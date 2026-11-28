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

// État d'un Pi (spécification 4.3) : api/hello demandé par l'application
// elle-même, pour mespi.js (pas de règle CORS : les pages viennent de
// app://, pas de https://app.pi-appliance.com).
//
// Certificat : un certificat reconnu par l'iPhone (Pi sur internet) passe
// comme dans Safari. À la maison, le Pi a un certificat fait par lui-même :
// il est accepté SEULEMENT pour l'adresse d'un Pi de la liste (ajoute),
// retenu à la première connexion (son empreinte SHA-256) et refusé s'il
// change ensuite. NE PAS accepter un certificat inconnu pour une autre
// adresse : un Pi pas encore ajouté (recherche à la maison) est seulement dit
// présent, puisqu'il a montré un certificat, sans que rien ne lui soit lu.

import CryptoKit
import Foundation
import Security

enum Empreintes {
    private static let cle = "empreintesCertificats" // hôte → empreinte SHA-256

    private static func lire() -> [String: String] {
        UserDefaults.standard.dictionary(forKey: cle) as? [String: String] ?? [:]
    }

    static func oublier(_ hote: String) {
        var liste = lire()
        liste[hote.lowercased()] = nil
        UserDefaults.standard.set(liste, forKey: cle)
    }

    /// Vrai si c'est le certificat retenu pour cet hôte, ou le premier vu (alors retenu).
    static func accepter(_ hote: String, _ empreinte: String) -> Bool {
        var liste = lire()
        if let connue = liste[hote.lowercased()] { return connue == empreinte }
        liste[hote.lowercased()] = empreinte
        UserDefaults.standard.set(liste, forKey: cle)
        return true
    }

    /// Empreinte du certificat du serveur (le premier de la chaîne).
    static func calculer(_ confiance: SecTrust) -> String? {
        guard let chaine = SecTrustCopyCertificateChain(confiance) as? [SecCertificate], let certificat = chaine.first else { return nil }
        let octets = SecCertificateCopyData(certificat) as Data
        return SHA256.hash(data: octets).map { String(format: "%02x", $0) }.joined()
    }
}

final class Sonde {
    private let session: URLSession = {
        let reglages = URLSessionConfiguration.ephemeral // ni cookie ni cache
        reglages.timeoutIntervalForRequest = 5 // délai de mespi.js
        reglages.timeoutIntervalForResource = 5
        reglages.waitsForConnectivity = false
        reglages.httpCookieAcceptPolicy = .never
        return URLSession(configuration: reglages)
    }()

    /// { repond, texte? (réponse de api/hello), certificat? ("change") }
    func sonder(_ base: URL, ajoute: Bool) async -> [String: Any] {
        let suivi = Suivi(ajoute: ajoute)
        do {
            let (donnees, reponse) = try await session.data(for: URLRequest(url: base.appendingPathComponent("api/hello")), delegate: suivi)
            // Toute réponse du serveur : le Pi est là (api/hello absent avant pi-appliance 0.1.5).
            guard let http = reponse as? HTTPURLResponse, http.statusCode == 200, donnees.count <= 65536,
                  let texte = String(data: donnees, encoding: .utf8) else { return ["repond": true] }
            return ["repond": true, "texte": texte]
        } catch {
            if suivi.certificatChange { return ["repond": false, "certificat": "change"] }
            return ["repond": suivi.presente]
        }
    }
}

private final class Suivi: NSObject, URLSessionTaskDelegate {
    let ajoute: Bool
    var presente = false
    var certificatChange = false

    init(ajoute: Bool) { self.ajoute = ajoute }

    func urlSession(_ session: URLSession, task: URLSessionTask, didReceive defi: URLAuthenticationChallenge,
                    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        guard defi.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
              let confiance = defi.protectionSpace.serverTrust else { return completionHandler(.performDefaultHandling, nil) }
        presente = true
        if SecTrustEvaluateWithError(confiance, nil) { return completionHandler(.performDefaultHandling, nil) }
        guard ajoute, let empreinte = Empreintes.calculer(confiance) else { return completionHandler(.cancelAuthenticationChallenge, nil) }
        if Empreintes.accepter(defi.protectionSpace.host, empreinte) {
            completionHandler(.useCredential, URLCredential(trust: confiance))
        } else {
            certificatChange = true
            completionHandler(.cancelAuthenticationChallenge, nil)
        }
    }
}
