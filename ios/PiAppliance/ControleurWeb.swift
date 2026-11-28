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

// Les pages de l'application web (le site construit par outils/site.mjs,
// copié dans le dossier « site » de l'application) servies depuis le paquet
// par le schéma app://pi-appliance/ : lisibles sans réseau, sans service
// worker ; la documentation, depuis sa copie à jour si l'application en a
// téléchargé une (Documentation.swift, question 45). La console d'un Pi
// s'ouvre dans l'application (Console.swift, question 43) ; les services d'un
// Pi et les pages « en ligne » dans Safari. Les pages appellent l'application
// par pont.js : sonder un Pi, lire un code QR, oublier un Pi, ouvrir sa
// console, lui envoyer un formulaire de l'appairage. Un lien « Ajouter un Pi »
// ouvert hors de l'application (lien universel, question 46) arrive ici par
// LiensRecus.

import UIKit
import WebKit

enum Site {
    static let schema = "app"
    static let hote = "pi-appliance"
    static let accueil = URL(string: "app://pi-appliance/index.html")!
    static let dossier = Bundle.main.bundleURL.appendingPathComponent("site", isDirectory: true)
}

/// Liens « Ajouter un Pi » (https://app.pi-appliance.com/#add?…) reçus par
/// l'application : lien universel ouvert par l'appareil photo, un message ou
/// Safari (PiApplianceApp.swift), ou touché dans une console. Gardé jusqu'à ce
/// que l'écran des pages soit là (application lancée par le lien).
@MainActor
final class LiensRecus {
    static let partage = LiensRecus()

    private var enAttente: URL?
    weak var controleur: ControleurWeb? {
        didSet { remettre() }
    }

    /// « #add?… » d'un lien de la console (mêmes adresses que le lecteur de
    /// code QR, fragment laissé tel quel pour mespi.js), sinon nil.
    static func ajout(_ lien: URL) -> String? {
        guard LecteurQR.vientDeLaConsole(lien.absoluteString),
              let fragment = URLComponents(url: lien, resolvingAgainstBaseURL: false)?.percentEncodedFragment,
              fragment.hasPrefix("add?") else { return nil }
        return "#" + fragment
    }

    func recevoir(_ lien: URL) {
        guard Self.ajout(lien) != nil else { return }
        enAttente = lien
        remettre()
    }

    func prendre() -> URL? {
        defer { enAttente = nil }
        return enAttente
    }

    private func remettre() {
        guard let controleur, controleur.isViewLoaded, let lien = prendre() else { return }
        controleur.ouvrirAjout(lien)
    }
}

final class ControleurWeb: UIViewController, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandlerWithReply {
    private var vueWeb: WKWebView!
    private let sonde = Sonde()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white
        let reglages = WKWebViewConfiguration()
        reglages.setURLSchemeHandler(PagesEmbarquees(), forURLScheme: Site.schema)
        reglages.websiteDataStore = .default() // liste des Pi et clé du téléphone gardées (localStorage, IndexedDB)
        let contenu = reglages.userContentController
        if let fichier = Bundle.main.url(forResource: "pont", withExtension: "js"),
           let source = try? String(contentsOf: fichier, encoding: .utf8) {
            contenu.addUserScript(WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }
        contenu.addScriptMessageHandler(self, contentWorld: .page, name: "piAppliance")

        vueWeb = WKWebView(frame: view.bounds, configuration: reglages)
        vueWeb.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        vueWeb.scrollView.contentInsetAdjustmentBehavior = .never
        vueWeb.allowsBackForwardNavigationGestures = true
        vueWeb.navigationDelegate = self
        vueWeb.uiDelegate = self
        view.addSubview(vueWeb)
        // Application lancée par un lien « Ajouter un Pi » : « Ajouter ce Pi ? » d'emblée.
        let depart = LiensRecus.partage.prendre().flatMap(Self.pageAjout) ?? Site.accueil
        vueWeb.load(URLRequest(url: depart))
        LiensRecus.partage.controleur = self
        Documentation.partage.verifier()
    }

    private static func pageAjout(_ lien: URL) -> URL? {
        LiensRecus.ajout(lien).flatMap { URL(string: Site.accueil.absoluteString + $0) }
    }

    /// Lien « Ajouter un Pi » reçu : « Ajouter ce Pi ? » (mespi.js), par-dessus
    /// la console ou le lecteur de code QR s'ils sont ouverts.
    func ouvrirAjout(_ lien: URL) {
        guard let page = Self.pageAjout(lien) else { return }
        if let lecteur = presentedViewController as? LecteurQR {
            lecteur.rendre(lien.absoluteString) // comme un code QR lu
            return
        }
        if presentedViewController != nil { dismiss(animated: true) }
        vueWeb.load(URLRequest(url: page))
    }

    // MARK: Navigation : les pages embarquées ici, le reste dans Safari.

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { return decisionHandler(.cancel) }
        if url.scheme == Site.schema || url.scheme == "about" { return decisionHandler(.allow) }
        ouvrirDansSafari(url)
        decisionHandler(.cancel)
    }

    // Liens target="_blank" et window.open : services d'un Pi, pages en ligne.
    // La console d'un Pi passe par pont.js (mespi.js), pas par ici.
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url {
            if url.scheme == Site.schema { webView.load(URLRequest(url: url)) } else { ouvrirDansSafari(url) }
        }
        return nil
    }

    private func ouvrirDansSafari(_ url: URL) {
        if LiensRecus.ajout(url) != nil { return LiensRecus.partage.recevoir(url) }
        guard ["https", "http", "mailto"].contains(url.scheme?.lowercased() ?? "") else { return }
        UIApplication.shared.open(url)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.reload()
    }

    // MARK: alert() et confirm() des pages (« Supprimer » un Pi), par-dessus
    // tout écran ouvert (Console.swift).

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        montrerAlerte(message, completionHandler)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        montrerConfirmation(message, completionHandler)
    }

    // MARK: Appels des pages (pont.js)

    func userContentController(_ controleur: WKUserContentController, didReceive message: WKScriptMessage,
                               replyHandler: @escaping (Any?, String?) -> Void) {
        // Seules les pages embarquées parlent à l'application.
        guard message.frameInfo.securityOrigin.protocol == Site.schema,
              let corps = message.body as? [String: Any], let action = corps["action"] as? String else {
            return replyHandler(nil, "refusé")
        }
        let base = (corps["base"] as? String).flatMap(URL.init(string:))
        switch action {
        case "sonder":
            guard let base, base.scheme == "https", base.host != nil else { return replyHandler(["repond": false], nil) }
            let ajoute = corps["ajoute"] as? Bool ?? false
            Task { replyHandler(await sonde.sonder(base, ajoute: ajoute), nil) }
        case "oublier":
            if let hote = base?.host { Empreintes.oublier(hote) }
            replyHandler(true, nil)
        case "scanner":
            let lecteur = LecteurQR(textes: corps["textes"] as? [String: String] ?? [:]) { replyHandler($0, nil) }
            lecteur.modalPresentationStyle = .fullScreen
            montrer(lecteur)
        case "console":
            ouvrirConsole(corps, replyHandler)
        case "envoyer":
            guard let adresse = (corps["adresse"] as? String).flatMap(URL.init(string:)), Formulaire.valable(adresse),
                  let champs = corps["champs"] as? [String: String] else {
                return replyHandler(["ok": false, "erreur": "adresse"], nil)
            }
            Task {
                do {
                    let r = try await Formulaire.envoyer(adresse, champs)
                    replyHandler(["ok": true, "statut": r.statut], nil)
                } catch {
                    replyHandler(["ok": false, "erreur": (error as? Formulaire.Echec)?.rawValue ?? "injoignable"], nil)
                }
            }
        default:
            replyHandler(nil, "inconnu")
        }
    }

    /// Écran de la console d'un Pi : son adresse (https://…/pi-appliance/…),
    /// avec ou sans formulaire de l'appairage (cle.js) à lui envoyer d'abord.
    private func ouvrirConsole(_ corps: [String: Any], _ replyHandler: @escaping (Any?, String?) -> Void) {
        guard let adresse = (corps["adresse"] as? String).flatMap(URL.init(string:)), adresse.scheme == "https",
              adresse.host != nil, adresse.user == nil, adresse.path.hasPrefix("/pi-appliance") else {
            return replyHandler(["ok": false, "erreur": "adresse"], nil)
        }
        let depart: ControleurConsole.Depart
        if let champs = corps["champs"] as? [String: String] {
            guard Formulaire.valable(adresse) else { return replyHandler(["ok": false, "erreur": "adresse"], nil) }
            let repli = (corps["repli"] as? String).flatMap(URL.init(string:))
                .flatMap { $0.scheme == "https" && $0.host == adresse.host && $0.port == adresse.port ? $0 : nil }
            depart = .formulaire(adresse, champs, repli: repli)
        } else {
            depart = .adresse(adresse)
        }
        let console = ControleurConsole(depart: depart, textes: corps["textes"] as? [String: String] ?? [:]) { replyHandler($0, nil) }
        console.modalPresentationStyle = .fullScreen
        montrer(console)
    }
}

/// Sert les fichiers du dossier « site » du paquet ; « dossier/ » donne
/// « dossier/index.html ». Rien en dehors de ce dossier. Sous doc/, la
/// documentation téléchargée passe d'abord (Documentation.swift), sans aucun
/// script à elle : seuls ceux de l'application (app://) peuvent s'y exécuter.
final class PagesEmbarquees: NSObject, WKURLSchemeHandler {
    private static let types = [
        "html": "text/html; charset=utf-8", "css": "text/css; charset=utf-8",
        "js": "text/javascript; charset=utf-8", "json": "application/json; charset=utf-8",
        "webmanifest": "application/manifest+json", "svg": "image/svg+xml", "png": "image/png",
        "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp", "gif": "image/gif",
    ]
    private static let reglesTelechargees = "default-src 'self' app:; script-src 'self' app:; style-src 'self' app: 'unsafe-inline'; "
        + "img-src 'self' app: data:; object-src 'none'; base-uri 'none'; form-action 'none'"

    func webView(_ webView: WKWebView, start tache: WKURLSchemeTask) {
        let url = tache.request.url ?? Site.accueil
        if url.host == Site.hote, url.path == "/version.json", let version = Documentation.partage.version() {
            return repondre(tache, url, 200, Self.types["json"]!, version)
        }
        if case let (fichier, telecharge)? = Self.fichier(url), let donnees = try? Data(contentsOf: fichier) {
            let type = Self.types[fichier.pathExtension.lowercased()] ?? "text/plain; charset=utf-8"
            repondre(tache, url, 200, type, donnees, regles: telecharge ? Self.reglesTelechargees : nil)
        } else {
            repondre(tache, url, 404, "text/plain; charset=utf-8", Data())
        }
    }

    func webView(_ webView: WKWebView, stop tache: WKURLSchemeTask) {}

    private func repondre(_ tache: WKURLSchemeTask, _ url: URL, _ statut: Int, _ type: String, _ donnees: Data, regles: String? = nil) {
        var entetes = ["Content-Type": type, "Content-Length": String(donnees.count), "Cache-Control": "no-cache"]
        if let regles { entetes["Content-Security-Policy"] = regles }
        tache.didReceive(HTTPURLResponse(url: url, statusCode: statut, httpVersion: "HTTP/1.1", headerFields: entetes)!)
        tache.didReceive(donnees)
        tache.didFinish()
    }

    /// Fichier à servir, et s'il vient de la documentation téléchargée.
    static func fichier(_ url: URL) -> (URL, Bool)? {
        guard url.host == Site.hote else { return nil }
        var chemin = url.path
        if chemin.isEmpty || chemin.hasSuffix("/") { chemin += "index.html" }
        chemin = String(chemin.drop(while: { $0 == "/" }))
        if chemin == "doc" { chemin = "doc/index.html" }
        if let telecharge = Documentation.partage.fichier(chemin) { return (telecharge, true) }
        let racine = Site.dossier.standardizedFileURL
        let fichier = racine.appendingPathComponent(chemin).standardizedFileURL
        guard fichier.path.hasPrefix(racine.path + "/") else { return nil }
        var dossier: ObjCBool = false
        guard FileManager.default.fileExists(atPath: fichier.path, isDirectory: &dossier) else { return nil }
        return (dossier.boolValue ? fichier.appendingPathComponent("index.html") : fichier, false)
    }
}
