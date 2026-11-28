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

// Documentation à jour (question 45) : à l'ouverture de l'application avec le
// réseau (au plus toutes les 30 minutes), version.json du site publié est lu
// (app.pi-appliance.com, sinon l'adresse provisoire github.io) par une simple
// demande GET, sans rien envoyer. Si ses pages de documentation (doc/, et
// seulement elles : le code de l'application ne change jamais ainsi, règle
// 2.5.2 d'Apple) diffèrent de celles servies, elles sont téléchargées dans un
// dossier neuf, chaque fichier vérifié par son empreinte SHA-256 (« sha256 »
// de version.json, outils/site.mjs), puis mises à la place des anciennes ; un
// téléchargement interrompu ou faux est abandonné. Rien de téléchargé, ou une
// documentation plus ancienne que celle de l'application : la documentation
// embarquée sert. Jamais bloquant : les pages servent pendant ce temps.
// Gardée dans Application Support (hors sauvegarde iCloud) pour le hors ligne.

import CryptoKit
import Foundation

final class Documentation: @unchecked Sendable {
    static let partage = Documentation()

    private static let sites = ["https://app.pi-appliance.com/", "https://gmoulard.github.io/pi-appliance-pwa/"]
    private static let extensions: Set<String> = ["html", "json", "svg", "png", "jpg", "jpeg", "webp", "gif"]
    private static let tailleMax = 10 << 20 // par fichier
    private static let totalMax = 80 << 20
    private static let intervalle: TimeInterval = 30 * 60

    /// Documentation téléchargée et servie.
    struct Etat: Codable, Equatable {
        let dossier: String
        let version: String
        let commit: String
        let date: String
        let fichiers: [String: String] // chemin (doc/…) → SHA-256
    }

    /// version.json de l'application (dossier « site » du paquet).
    struct Embarquee {
        let brut: [String: Any]
        let version: String
        let sha256: [String: String]
    }

    private let verrou = NSLock()
    private let racine: URL
    private var actuelle: Etat?
    private var enCours = false
    private var derniere: Date?

    private init() {
        let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        racine = support.appendingPathComponent("documentation", isDirectory: true)
        guard let donnees = try? Data(contentsOf: racine.appendingPathComponent("actuelle.json")),
              let etat = try? JSONDecoder().decode(Etat.self, from: donnees),
              Self.nomValable(etat.dossier),
              FileManager.default.fileExists(atPath: racine.appendingPathComponent(etat.dossier).path) else { return }
        // Une version plus récente de l'application embarque une documentation plus récente.
        if Self.comparer(etat.version, Self.embarquee().version) < 0 {
            try? FileManager.default.removeItem(at: racine)
            return
        }
        actuelle = etat
    }

    // MARK: Pages servies (PagesEmbarquees, ControleurWeb.swift)

    /// Fichier téléchargé pour ce chemin (« doc/… »), s'il y en a un.
    func fichier(_ chemin: String) -> URL? {
        guard chemin.hasPrefix("doc/") else { return nil }
        verrou.lock()
        let etat = actuelle
        verrou.unlock()
        guard let etat, etat.fichiers[chemin] != nil else { return nil }
        let dossier = racine.appendingPathComponent(etat.dossier, isDirectory: true).standardizedFileURL
        let f = dossier.appendingPathComponent(chemin).standardizedFileURL
        guard f.path.hasPrefix(dossier.path + "/"), FileManager.default.fileExists(atPath: f.path) else { return nil }
        return f
    }

    /// version.json de l'application, avec la version, le commit et la date de
    /// la documentation téléchargée (pied de page, app.js) ; nil sans elle.
    func version() -> Data? {
        verrou.lock()
        let etat = actuelle
        verrou.unlock()
        guard let etat else { return nil }
        var v = Self.embarquee().brut
        v["version"] = etat.version
        v["commit"] = etat.commit
        v["date"] = etat.date
        return try? JSONSerialization.data(withJSONObject: v)
    }

    // MARK: Mise à jour

    func verifier() {
        verrou.lock()
        let attendre = enCours || derniere.map { Date().timeIntervalSince($0) < Self.intervalle } ?? false
        if !attendre {
            enCours = true
            derniere = Date()
        }
        let courante = actuelle
        verrou.unlock()
        guard !attendre else { return }
        let racine = self.racine
        Task.detached(priority: .utility) {
            var nouvelle: Etat?
            do {
                nouvelle = try await Self.telecharger(racine: racine, courante: courante)
            } catch {
                print("Documentation non mise à jour : \(error)")
            }
            self.terminer(nouvelle)
        }
    }

    private func terminer(_ nouvelle: Etat?) {
        verrou.lock()
        defer { verrou.unlock() }
        enCours = false
        guard let nouvelle, let donnees = try? JSONEncoder().encode(nouvelle) else { return }
        do {
            try donnees.write(to: racine.appendingPathComponent("actuelle.json"), options: .atomic)
        } catch {
            try? FileManager.default.removeItem(at: racine.appendingPathComponent(nouvelle.dossier))
            return
        }
        let ancienne = actuelle
        actuelle = nouvelle
        // Les autres dossiers (l'ancienne documentation, un essai interrompu) sont retirés.
        let autres = (try? FileManager.default.contentsOfDirectory(atPath: racine.path)) ?? []
        for nom in autres where nom != nouvelle.dossier && nom != "actuelle.json" && (nom == ancienne?.dossier || Self.nomValable(nom)) {
            try? FileManager.default.removeItem(at: racine.appendingPathComponent(nom))
        }
    }

    private enum Echec: Error {
        case illisible(String)
        case fichier(String, Int)
        case empreinte(String)
        case taille
    }

    private static func telecharger(racine: URL, courante: Etat?) async throws -> Etat? {
        let reglages = URLSessionConfiguration.ephemeral // ni cookie ni cache
        reglages.timeoutIntervalForRequest = 20
        reglages.timeoutIntervalForResource = 120
        reglages.waitsForConnectivity = false
        reglages.httpCookieAcceptPolicy = .never
        reglages.httpShouldSetCookies = false
        reglages.requestCachePolicy = .reloadIgnoringLocalCacheData
        let session = URLSession(configuration: reglages)
        defer { session.finishTasksAndInvalidate() }

        // 1. version.json du site publié.
        var lu: (base: URL, v: [String: Any])?
        for site in sites {
            guard let base = URL(string: site), let adresse = URL(string: "version.json", relativeTo: base) else { continue }
            if case let (donnees, reponse)? = try? await session.data(from: adresse),
               (reponse as? HTTPURLResponse)?.statusCode == 200,
               let v = try? JSONSerialization.jsonObject(with: donnees) as? [String: Any] {
                lu = (base, v)
                break
            }
        }
        guard let lu else { return nil } // pas de réseau : rien à faire
        let (base, v) = lu
        guard let version = v["version"] as? String, let commit = v["commit"] as? String, let date = v["date"] as? String,
              let liste = v["fichiers"] as? [String], let empreintes = v["sha256"] as? [String: String] else {
            throw Echec.illisible("version.json")
        }
        let embarquee = embarquee()
        guard comparer(version, embarquee.version) >= 0 else { return nil } // jamais plus ancienne

        var voulus: [String: String] = [:]
        for chemin in liste where chemin.hasPrefix("doc/") {
            guard cheminValable(chemin), let h = empreintes[chemin], h.range(of: "^[0-9a-f]{64}$", options: .regularExpression) != nil else {
                throw Echec.illisible(chemin)
            }
            voulus[chemin] = h
        }
        guard voulus["doc/index.html"] != nil else { throw Echec.illisible("doc/index.html") }
        let servis = courante?.fichiers ?? embarquee.sha256.filter { $0.key.hasPrefix("doc/") }
        if servis == voulus { return nil } // déjà la documentation servie

        // 2. Les pages, dans un dossier neuf.
        let nom = "doc-\(UUID().uuidString.lowercased())"
        let dossier = racine.appendingPathComponent(nom, isDirectory: true)
        let gestion = FileManager.default
        try gestion.createDirectory(at: dossier, withIntermediateDirectories: true)
        var racineSansSauvegarde = racine
        var valeurs = URLResourceValues()
        valeurs.isExcludedFromBackup = true
        try? racineSansSauvegarde.setResourceValues(valeurs)
        do {
            var total = 0
            for (chemin, h) in voulus.sorted(by: { $0.key < $1.key }) {
                let cible = dossier.appendingPathComponent(chemin)
                try gestion.createDirectory(at: cible.deletingLastPathComponent(), withIntermediateDirectories: true)
                // Même fichier déjà sur l'iPhone (téléchargé ou embarqué) : copié.
                var sources: [URL] = []
                if let courante, courante.fichiers[chemin] == h {
                    sources.append(racine.appendingPathComponent(courante.dossier).appendingPathComponent(chemin))
                }
                if embarquee.sha256[chemin] == h { sources.append(Site.dossier.appendingPathComponent(chemin)) }
                if let source = sources.first(where: { gestion.fileExists(atPath: $0.path) }) {
                    try gestion.copyItem(at: source, to: cible)
                    continue
                }
                guard let adresse = URL(string: chemin, relativeTo: base) else { throw Echec.illisible(chemin) }
                let (donnees, reponse) = try await session.data(from: adresse)
                let statut = (reponse as? HTTPURLResponse)?.statusCode ?? 0
                guard statut == 200 else { throw Echec.fichier(chemin, statut) }
                total += donnees.count
                guard donnees.count <= tailleMax, total <= totalMax else { throw Echec.taille }
                guard empreinte(donnees) == h else { throw Echec.empreinte(chemin) }
                try donnees.write(to: cible, options: .atomic)
            }
        } catch {
            try? gestion.removeItem(at: dossier)
            throw error
        }
        return Etat(dossier: nom, version: version, commit: commit, date: date, fichiers: voulus)
    }

    // MARK: Outils

    static func embarquee() -> Embarquee {
        let url = Site.dossier.appendingPathComponent("version.json")
        let brut = (try? Data(contentsOf: url)).flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: Any] } ?? [:]
        return Embarquee(brut: brut, version: brut["version"] as? String ?? "v0.0.0", sha256: brut["sha256"] as? [String: String] ?? [:])
    }

    private static func empreinte(_ donnees: Data) -> String {
        SHA256.hash(data: donnees).map { String(format: "%02x", $0) }.joined()
    }

    private static func nomValable(_ nom: String) -> Bool {
        nom.range(of: "^doc-[0-9a-f-]{36}$", options: .regularExpression) != nil
    }

    /// doc/<nom>[/<nom>…] avec une extension de page ou d'image ; jamais « .. ».
    private static func cheminValable(_ chemin: String) -> Bool {
        let motif = "^doc/([A-Za-z0-9][A-Za-z0-9._-]*/)*[A-Za-z0-9][A-Za-z0-9._-]*$"
        guard chemin.range(of: motif, options: .regularExpression) != nil, !chemin.contains("..") else { return false }
        return extensions.contains((chemin as NSString).pathExtension.lowercased())
    }

    /// « vX.Y.Z » comparées nombre par nombre : < 0, 0 ou > 0.
    static func comparer(_ a: String, _ b: String) -> Int {
        let nombres = { (v: String) in v.drop(while: { $0 == "v" }).split(separator: ".").map { Int($0) ?? 0 } }
        let (x, y) = (nombres(a), nombres(b))
        for i in 0..<max(x.count, y.count) {
            let (p, q) = (i < x.count ? x[i] : 0, i < y.count ? y[i] : 0)
            if p != q { return p < q ? -1 : 1 }
        }
        return 0
    }
}
