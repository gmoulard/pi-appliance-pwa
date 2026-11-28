// This file is part of pi-appliance-pwa <https://github.com/gmoulard/pi-appliance-pwa>.
// Copyright (c) 2026 Guillaume Moulard.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, version 3.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

// Console d'un Pi ouverte DANS l'application (question 43) : un écran plein,
// avec « Retour », et sa propre WKWebView (le cookie de la console reste dans
// l'application, il n'est pas partagé avec Safari). Seule la console de CE Pi
// (même hôte, même port) s'y ouvre ; ses services et tout autre lien partent
// dans Safari, et un lien « Ajouter un Pi » revient dans l'application.
//
// Certificat (question 44) : un certificat reconnu par l'iPhone passe comme
// dans Safari ; celui fait par le Pi est accepté pour l'hôte de ce Pi
// seulement, retenu à la première connexion sans rien demander (Empreintes,
// Sonde.swift) et refusé s'il change, ce que l'écran dit.
//
// Appairage et connexion sans mot de passe (spécification 4.4) : la page
// (cle.js) signe le message avec la clé du téléphone, non exportable, et donne
// les champs du formulaire ; l'application l'envoie elle-même (Formulaire),
// pose dans la WKWebView de la console le cookie de session rendu par le Pi,
// puis ouvre la page où le Pi renvoie (console, ou « ?appareil=<raison> »).
// Le Pi n'accepte ce formulaire que venu de l'application web : l'en-tête
// Origin est donc celui de https://app.pi-appliance.com (internal/console/
// devices.go de pi-appliance).

import UIKit
import WebKit

enum Formulaire {
    /// Origine que le Pi accepte pour appareil/* (mobileOrigins de pi-appliance).
    static let origine = "https://app.pi-appliance.com"
    private static let actions = ["appairer", "connexion", "retirer"]
    private static let permis = CharacterSet(charactersIn: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~")

    enum Echec: String, Error { case certificat, injoignable }

    struct Reponse {
        let statut: Int
        let suite: URL
        let cookies: [HTTPCookie]
    }

    /// https://<Pi>/pi-appliance/appareil/<appairer|connexion|retirer>, rien d'autre.
    static func valable(_ adresse: URL) -> Bool {
        guard adresse.scheme == "https", adresse.host != nil, adresse.user == nil, adresse.password == nil,
              adresse.query == nil, adresse.fragment == nil else { return false }
        return actions.contains { adresse.path.hasSuffix("/pi-appliance/appareil/\($0)") }
    }

    private static func encoder(_ texte: String) -> String {
        texte.addingPercentEncoding(withAllowedCharacters: permis) ?? ""
    }

    /// Envoie le formulaire, sans suivre de renvoi. Toute réponse du Pi compte
    /// (un refus est dit par la page où il renvoie) ; Echec si aucune réponse.
    static func envoyer(_ adresse: URL, _ champs: [String: String]) async throws -> Reponse {
        var requete = URLRequest(url: adresse, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 10)
        requete.httpMethod = "POST"
        requete.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        requete.setValue(origine, forHTTPHeaderField: "Origin")
        requete.httpBody = champs.sorted { $0.key < $1.key }
            .map { "\(encoder($0.key))=\(encoder($0.value))" }
            .joined(separator: "&").data(using: .utf8)
        let reglages = URLSessionConfiguration.ephemeral // le cookie est lu ici, posé dans la console
        reglages.timeoutIntervalForRequest = 10
        reglages.timeoutIntervalForResource = 15
        reglages.waitsForConnectivity = false
        reglages.httpCookieAcceptPolicy = .never
        reglages.httpShouldSetCookies = false
        let session = URLSession(configuration: reglages)
        defer { session.finishTasksAndInvalidate() }
        let suivi = Suivi(ajoute: true, renvois: false) // Pi de la liste
        let resultat: (Data, URLResponse)
        do {
            resultat = try await session.data(for: requete, delegate: suivi)
        } catch {
            throw suivi.certificatChange ? Echec.certificat : Echec.injoignable
        }
        let (donnees, reponse) = resultat
        guard let http = reponse as? HTTPURLResponse else { throw Echec.injoignable }
        var entetes: [String: String] = [:]
        for (cle, valeur) in http.allHeaderFields {
            if let cle = cle as? String, let valeur = valeur as? String { entetes[cle] = valeur }
        }
        let cookies = HTTPCookie.cookies(withResponseHeaderFields: entetes, for: adresse)
        return Reponse(statut: http.statusCode, suite: suite(adresse, donnees), cookies: cookies)
    }

    /// Page où le Pi renvoie (<meta http-equiv="refresh" content="0;url=…">,
    /// devicePage de pi-appliance), sur le même Pi ; sinon la console.
    static func suite(_ adresse: URL, _ donnees: Data) -> URL {
        let console = adresse.deletingLastPathComponent().deletingLastPathComponent() // …/pi-appliance/
        let texte = String(decoding: donnees.prefix(65536), as: UTF8.self)
        guard let motif = try? NSRegularExpression(pattern: #"content="0;url=([^"]+)""#),
              let trouve = motif.firstMatch(in: texte, range: NSRange(texte.startIndex..., in: texte)),
              let plage = Range(trouve.range(at: 1), in: texte) else { return console }
        let chemin = texte[plage].replacingOccurrences(of: "&amp;", with: "&")
        guard let cible = URL(string: chemin, relativeTo: adresse)?.absoluteURL,
              cible.scheme == adresse.scheme, cible.host == adresse.host, cible.port == adresse.port else { return console }
        return cible
    }
}

final class ControleurConsole: UIViewController, WKNavigationDelegate, WKUIDelegate {
    enum Depart {
        case adresse(URL)
        case formulaire(URL, [String: String], repli: URL?)
    }

    private static let framboise = UIColor(red: 0xC7 / 255, green: 0x1F / 255, blue: 0x5D / 255, alpha: 1)

    private let depart: Depart
    private let textes: [String: String]
    private let hote: String
    private let port: Int?
    private var fin: (([String: Any]) -> Void)?
    private var tache: Task<Void, Never>?
    private var vueWeb: WKWebView!
    private let message = UILabel()
    private let attente = UIActivityIndicatorView(style: .large)
    private var certificatChange = false

    init(depart: Depart, textes: [String: String], fin: @escaping ([String: Any]) -> Void) {
        self.depart = depart
        self.textes = textes
        self.fin = fin
        let adresse: URL
        switch depart {
        case .adresse(let a): adresse = a
        case .formulaire(let a, _, _): adresse = a
        }
        hote = adresse.host?.lowercased() ?? ""
        port = adresse.port
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { fatalError("non utilisé") }

    private func texte(_ cle: String, _ defaut: String) -> String {
        let t = textes[cle] ?? ""
        return t.isEmpty || t == cle ? defaut : t
    }

    /// Même console : même hôte et même port que l'adresse ouverte, en https.
    private func memePi(_ url: URL) -> Bool {
        url.scheme == "https" && url.host?.lowercased() == hote && url.port == port
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white

        let barre = UIView()
        barre.backgroundColor = .white
        barre.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(barre)
        let trait = UIView()
        trait.backgroundColor = UIColor(white: 0.85, alpha: 1)
        trait.translatesAutoresizingMaskIntoConstraints = false
        barre.addSubview(trait)

        var style = UIButton.Configuration.plain()
        style.title = texte("retour", "Retour")
        style.image = UIImage(systemName: "chevron.backward")
        style.imagePadding = 4
        style.baseForegroundColor = Self.framboise
        let retour = UIButton(configuration: style, primaryAction: UIAction { [weak self] _ in self?.fermer() })
        retour.translatesAutoresizingMaskIntoConstraints = false
        barre.addSubview(retour)

        let titre = UILabel()
        titre.text = hote
        titre.textColor = .darkGray
        titre.font = .preferredFont(forTextStyle: .footnote)
        titre.lineBreakMode = .byTruncatingMiddle
        titre.translatesAutoresizingMaskIntoConstraints = false
        barre.addSubview(titre)

        let reglages = WKWebViewConfiguration()
        reglages.websiteDataStore = .default() // connexion à la console gardée dans l'application
        vueWeb = WKWebView(frame: .zero, configuration: reglages)
        vueWeb.translatesAutoresizingMaskIntoConstraints = false
        vueWeb.allowsBackForwardNavigationGestures = true
        vueWeb.navigationDelegate = self
        vueWeb.uiDelegate = self
        view.addSubview(vueWeb)

        message.numberOfLines = 0
        message.textAlignment = .center
        message.textColor = .darkGray
        message.font = .preferredFont(forTextStyle: .body)
        message.translatesAutoresizingMaskIntoConstraints = false
        message.isHidden = true
        attente.translatesAutoresizingMaskIntoConstraints = false
        attente.hidesWhenStopped = true
        view.addSubview(message)
        view.addSubview(attente)

        let bords = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            barre.topAnchor.constraint(equalTo: view.topAnchor),
            barre.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            barre.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            barre.bottomAnchor.constraint(equalTo: bords.topAnchor, constant: 44),
            trait.leadingAnchor.constraint(equalTo: barre.leadingAnchor),
            trait.trailingAnchor.constraint(equalTo: barre.trailingAnchor),
            trait.bottomAnchor.constraint(equalTo: barre.bottomAnchor),
            trait.heightAnchor.constraint(equalToConstant: 0.5),
            retour.leadingAnchor.constraint(equalTo: bords.leadingAnchor, constant: 4),
            retour.centerYAnchor.constraint(equalTo: barre.bottomAnchor, constant: -22),
            retour.heightAnchor.constraint(greaterThanOrEqualToConstant: 44),
            titre.leadingAnchor.constraint(greaterThanOrEqualTo: retour.trailingAnchor, constant: 8),
            titre.trailingAnchor.constraint(equalTo: bords.trailingAnchor, constant: -16),
            titre.centerYAnchor.constraint(equalTo: retour.centerYAnchor),
            vueWeb.topAnchor.constraint(equalTo: barre.bottomAnchor),
            vueWeb.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            vueWeb.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            vueWeb.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            message.leadingAnchor.constraint(equalTo: bords.leadingAnchor, constant: 24),
            message.trailingAnchor.constraint(equalTo: bords.trailingAnchor, constant: -24),
            message.centerYAnchor.constraint(equalTo: vueWeb.centerYAnchor),
            attente.centerXAnchor.constraint(equalTo: vueWeb.centerXAnchor),
            attente.centerYAnchor.constraint(equalTo: vueWeb.centerYAnchor),
        ])
        titre.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)

        switch depart {
        case .adresse(let adresse):
            rendre(["ok": true])
            charger(adresse)
        case .formulaire(let adresse, let champs, let repli):
            montrerAttente()
            tache = Task { [weak self] in
                do {
                    let r = try await Formulaire.envoyer(adresse, champs)
                    guard let self, !Task.isCancelled else { return }
                    await self.poser(r.cookies)
                    self.rendre(["ok": true, "statut": r.statut])
                    self.charger(r.suite)
                } catch {
                    guard let self, !Task.isCancelled else { return }
                    let code = (error as? Formulaire.Echec)?.rawValue ?? Formulaire.Echec.injoignable.rawValue
                    if let repli {
                        // Connexion sans réponse : la console elle-même, qui dira ce qui ne va pas.
                        self.rendre(["ok": false, "erreur": code])
                        self.charger(repli)
                    } else {
                        // Appairage sans réponse : la page le dit (cle.js, mespi.js), une
                        // fois cet écran fermé (montrer, plus bas).
                        self.rendre(["ok": false, "erreur": code])
                        self.dismiss(animated: true)
                    }
                }
            }
        }
    }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        // Écran fermé d'ailleurs (lien « Ajouter un Pi ») : la page attend
        // toujours une réponse.
        if isBeingDismissed || presentingViewController == nil {
            tache?.cancel()
            rendre(["ok": false, "erreur": "annule"])
        }
    }

    private func rendre(_ resultat: [String: Any]) {
        guard let fin else { return }
        self.fin = nil
        fin(resultat)
    }

    private func fermer() {
        tache?.cancel()
        rendre(["ok": false, "erreur": "annule"])
        dismiss(animated: true)
    }

    private func poser(_ cookies: [HTTPCookie]) async {
        let magasin = vueWeb.configuration.websiteDataStore.httpCookieStore
        for cookie in cookies {
            await withCheckedContinuation { (suite: CheckedContinuation<Void, Never>) in
                magasin.setCookie(cookie) { suite.resume() }
            }
        }
    }

    private func charger(_ adresse: URL) {
        certificatChange = false
        message.isHidden = true
        vueWeb.isHidden = false
        attente.startAnimating()
        vueWeb.load(URLRequest(url: adresse))
    }

    private func montrerAttente() {
        message.text = texte("attente", "Connexion à la console…")
        message.isHidden = false
        vueWeb.isHidden = true
        attente.startAnimating()
    }

    private func montrerErreur() {
        attente.stopAnimating()
        message.text = certificatChange
            ? texte("certificat", "Le certificat du Pi a changé : par prudence, l'application ne s'y connecte plus.")
            : texte("injoignable", "La console du Pi ne répond pas.")
        message.isHidden = false
        vueWeb.isHidden = true
    }

    // MARK: Navigation : la console de ce Pi ici, le reste ailleurs.

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { return decisionHandler(.cancel) }
        if memePi(url) || ["about", "blob", "data"].contains(url.scheme ?? "") { return decisionHandler(.allow) }
        if action.targetFrame?.isMainFrame == false { return decisionHandler(.cancel) } // cadre d'un autre site
        decisionHandler(.cancel)
        ailleurs(url)
    }

    // Liens target="_blank" et window.open de la console.
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url {
            if memePi(url) { webView.load(URLRequest(url: url)) } else { ailleurs(url) }
        }
        return nil
    }

    /// Lien « Ajouter un Pi » (Mon Pi) : dans l'application ; le reste dans Safari.
    private func ailleurs(_ url: URL) {
        if LiensRecus.ajout(url) != nil {
            LiensRecus.partage.recevoir(url)
            return
        }
        guard ["https", "http", "mailto", "tel"].contains(url.scheme?.lowercased() ?? "") else { return }
        UIApplication.shared.open(url)
    }

    func webView(_ webView: WKWebView, didReceive defi: URLAuthenticationChallenge,
                 completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        guard defi.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
              let confiance = defi.protectionSpace.serverTrust else { return completionHandler(.performDefaultHandling, nil) }
        let hoteDefi = defi.protectionSpace.host.lowercased()
        let hotePi = hote
        // Évaluation hors du fil principal (elle peut attendre le réseau).
        DispatchQueue.global(qos: .userInitiated).async {
            let reconnu = SecTrustEvaluateWithError(confiance, nil)
            var accepte = false
            var change = false
            if !reconnu, hoteDefi == hotePi, let empreinte = Empreintes.calculer(confiance) {
                accepte = Empreintes.accepter(hoteDefi, empreinte)
                change = !accepte
            }
            DispatchQueue.main.async {
                if change { self.certificatChange = true }
                if reconnu {
                    completionHandler(.performDefaultHandling, nil)
                } else if accepte {
                    completionHandler(.useCredential, URLCredential(trust: confiance))
                } else {
                    completionHandler(.cancelAuthenticationChallenge, nil)
                }
            }
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        attente.stopAnimating()
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        // Lien parti dans Safari (navigation annulée) : rien à dire.
        if (error as? URLError)?.code == .cancelled, !certificatChange { return attente.stopAnimating() }
        if (error as NSError).domain == "WebKitErrorDomain", (error as NSError).code == 102 { return attente.stopAnimating() }
        montrerErreur()
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        attente.stopAnimating()
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.reload()
    }

    // MARK: alert(), confirm() et prompt() de la console.

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        montrerAlerte(message, completionHandler)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        montrerConfirmation(message, completionHandler)
    }

    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
        montrerSaisie(prompt, defaultText, completionHandler)
    }
}

/// Fenêtres des pages (alert, confirm, prompt), montrées au-dessus de tout
/// écran déjà présenté (console, lecteur de code QR), et seulement une fois
/// fini un écran en train de s'ouvrir ou de se fermer : sinon UIKit ne la
/// montre pas, et la page attendrait sa réponse sans fin.
extension UIViewController {
    var plusHaut: UIViewController {
        var c: UIViewController = self
        while let p = c.presentedViewController, !p.isBeingDismissed { c = p }
        return c
    }

    func montrer(_ ecran: UIViewController) {
        let cible = plusHaut
        if let transition = cible.presentedViewController?.transitionCoordinator ?? cible.transitionCoordinator,
           transition.animate(alongsideTransition: nil, completion: { _ in self.montrer(ecran) }) {
            return
        }
        cible.present(ecran, animated: true)
    }

    func montrerAlerte(_ texte: String, _ fin: @escaping () -> Void) {
        let alerte = UIAlertController(title: nil, message: texte, preferredStyle: .alert)
        alerte.addAction(UIAlertAction(title: "OK", style: .default) { _ in fin() })
        montrer(alerte)
    }

    func montrerConfirmation(_ texte: String, _ fin: @escaping (Bool) -> Void) {
        let alerte = UIAlertController(title: nil, message: texte, preferredStyle: .alert)
        alerte.addAction(UIAlertAction(title: "Annuler", style: .cancel) { _ in fin(false) })
        alerte.addAction(UIAlertAction(title: "OK", style: .default) { _ in fin(true) })
        montrer(alerte)
    }

    func montrerSaisie(_ texte: String, _ defaut: String?, _ fin: @escaping (String?) -> Void) {
        let alerte = UIAlertController(title: nil, message: texte, preferredStyle: .alert)
        alerte.addTextField { $0.text = defaut }
        alerte.addAction(UIAlertAction(title: "Annuler", style: .cancel) { _ in fin(nil) })
        alerte.addAction(UIAlertAction(title: "OK", style: .default) { [weak alerte] _ in fin(alerte?.textFields?.first?.text ?? "") })
        montrer(alerte)
    }
}
