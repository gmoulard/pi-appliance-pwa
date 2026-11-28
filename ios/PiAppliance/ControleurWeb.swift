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
// worker. Tout lien vers l'extérieur (console d'un Pi, services, pages « en
// ligne ») s'ouvre dans Safari (spécification 4.2). Les pages appellent
// l'application par pont.js : sonder un Pi, lire un code QR, oublier un Pi.

import UIKit
import WebKit

enum Site {
    static let schema = "app"
    static let hote = "pi-appliance"
    static let accueil = URL(string: "app://pi-appliance/index.html")!
    static let dossier = Bundle.main.bundleURL.appendingPathComponent("site", isDirectory: true)
}

final class ControleurWeb: UIViewController, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandlerWithReply {
    private var vueWeb: WKWebView!
    private let sonde = Sonde()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white
        let reglages = WKWebViewConfiguration()
        reglages.setURLSchemeHandler(PagesEmbarquees(), forURLScheme: Site.schema)
        reglages.websiteDataStore = .default() // liste des Pi gardée (localStorage)
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
        vueWeb.load(URLRequest(url: Site.accueil))
    }

    // MARK: Navigation : les pages embarquées ici, le reste dans Safari.

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { return decisionHandler(.cancel) }
        if url.scheme == Site.schema || url.scheme == "about" { return decisionHandler(.allow) }
        ouvrirDansSafari(url)
        decisionHandler(.cancel)
    }

    // Liens target="_blank" et window.open : « Ouvrir » un Pi, ses services.
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url {
            if url.scheme == Site.schema { webView.load(URLRequest(url: url)) } else { ouvrirDansSafari(url) }
        }
        return nil
    }

    private func ouvrirDansSafari(_ url: URL) {
        guard ["https", "http", "mailto"].contains(url.scheme?.lowercased() ?? "") else { return }
        UIApplication.shared.open(url)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.reload()
    }

    // MARK: alert() et confirm() des pages (« Supprimer » un Pi).

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alerte = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alerte.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        present(alerte, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alerte = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alerte.addAction(UIAlertAction(title: "Annuler", style: .cancel) { _ in completionHandler(false) })
        alerte.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
        present(alerte, animated: true)
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
            present(lecteur, animated: true)
        default:
            replyHandler(nil, "inconnu")
        }
    }
}

/// Sert les fichiers du dossier « site » du paquet ; « dossier/ » donne
/// « dossier/index.html ». Rien en dehors de ce dossier.
final class PagesEmbarquees: NSObject, WKURLSchemeHandler {
    private static let types = [
        "html": "text/html; charset=utf-8", "css": "text/css; charset=utf-8",
        "js": "text/javascript; charset=utf-8", "json": "application/json; charset=utf-8",
        "webmanifest": "application/manifest+json", "svg": "image/svg+xml", "png": "image/png",
    ]

    func webView(_ webView: WKWebView, start tache: WKURLSchemeTask) {
        let url = tache.request.url ?? Site.accueil
        if let fichier = Self.fichier(url), let donnees = try? Data(contentsOf: fichier) {
            let type = Self.types[fichier.pathExtension.lowercased()] ?? "text/plain; charset=utf-8"
            repondre(tache, url, 200, type, donnees)
        } else {
            repondre(tache, url, 404, "text/plain; charset=utf-8", Data())
        }
    }

    func webView(_ webView: WKWebView, stop tache: WKURLSchemeTask) {}

    private func repondre(_ tache: WKURLSchemeTask, _ url: URL, _ statut: Int, _ type: String, _ donnees: Data) {
        let entetes = ["Content-Type": type, "Content-Length": String(donnees.count), "Cache-Control": "no-cache"]
        tache.didReceive(HTTPURLResponse(url: url, statusCode: statut, httpVersion: "HTTP/1.1", headerFields: entetes)!)
        tache.didReceive(donnees)
        tache.didFinish()
    }

    static func fichier(_ url: URL) -> URL? {
        guard url.host == Site.hote else { return nil }
        var chemin = url.path
        if chemin.isEmpty || chemin.hasSuffix("/") { chemin += "index.html" }
        let racine = Site.dossier.standardizedFileURL
        let fichier = racine.appendingPathComponent(String(chemin.drop(while: { $0 == "/" }))).standardizedFileURL
        guard fichier.path.hasPrefix(racine.path + "/") else { return nil }
        var dossier: ObjCBool = false
        guard FileManager.default.fileExists(atPath: fichier.path, isDirectory: &dossier) else { return nil }
        return dossier.boolValue ? fichier.appendingPathComponent("index.html") : fichier
    }
}
