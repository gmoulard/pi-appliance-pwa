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

// Lecture du code QR de « Mon Pi » par l'appareil photo (spécification 4.1),
// à la place de jsQR dans l'application iPhone (lecteur.js). Plein écran ;
// rend { texte } pour un lien « Ajouter un Pi » de la console, { annule: true }
// ou { erreur: "refuse" | "aucune" | "indisponible" }. Un autre code QR est
// signalé et la lecture continue. L'image ne quitte pas l'iPhone.

import AVFoundation
import UIKit

final class LecteurQR: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    // Mêmes adresses que lienAjout() de lecteur.js, qui vérifie de nouveau.
    private static let sites = ["https://app.pi-appliance.com/", "https://gmoulard.github.io/pi-appliance-pwa/"]

    private let textes: [String: String]
    private var fin: (([String: Any]) -> Void)?
    private let capture = AVCaptureSession()
    private var apercu: AVCaptureVideoPreviewLayer?
    private let message = UILabel()
    private var dernierAutre = ""
    private var lance = false

    init(textes: [String: String], fin: @escaping ([String: Any]) -> Void) {
        self.textes = textes
        self.fin = fin
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { fatalError("non utilisé") }

    static func vientDeLaConsole(_ texte: String) -> Bool {
        let t = texte.trimmingCharacters(in: .whitespacesAndNewlines)
        return sites.contains { t.hasPrefix($0) } && t.contains("#add?")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black

        let explication = UILabel()
        explication.text = textes["explication"]
        for etiquette in [explication, message] {
            etiquette.textColor = .white
            etiquette.numberOfLines = 0
            etiquette.textAlignment = .center
            etiquette.font = .preferredFont(forTextStyle: .body)
            etiquette.translatesAutoresizingMaskIntoConstraints = false
            view.addSubview(etiquette)
        }
        var style = UIButton.Configuration.filled()
        style.title = textes["annuler"] ?? "Annuler"
        style.baseBackgroundColor = UIColor(red: 0xC7 / 255, green: 0x1F / 255, blue: 0x5D / 255, alpha: 1) // framboise
        style.cornerStyle = .capsule
        let annuler = UIButton(configuration: style, primaryAction: UIAction { [weak self] _ in self?.terminer(["annule": true]) })
        annuler.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(annuler)

        let bords = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            explication.topAnchor.constraint(equalTo: bords.topAnchor, constant: 16),
            explication.leadingAnchor.constraint(equalTo: bords.leadingAnchor, constant: 16),
            explication.trailingAnchor.constraint(equalTo: bords.trailingAnchor, constant: -16),
            message.leadingAnchor.constraint(equalTo: bords.leadingAnchor, constant: 16),
            message.trailingAnchor.constraint(equalTo: bords.trailingAnchor, constant: -16),
            message.bottomAnchor.constraint(equalTo: annuler.topAnchor, constant: -16),
            annuler.centerXAnchor.constraint(equalTo: bords.centerXAnchor),
            annuler.bottomAnchor.constraint(equalTo: bords.bottomAnchor, constant: -24),
            annuler.heightAnchor.constraint(greaterThanOrEqualToConstant: 44),
        ])
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        apercu?.frame = view.bounds
    }

    // L'autorisation est demandée une fois l'écran montré (il peut alors se fermer).
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        guard !lance else { return }
        lance = true
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            demarrer()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { accorde in
                DispatchQueue.main.async { accorde ? self.demarrer() : self.terminer(["erreur": "refuse"]) }
            }
        default:
            terminer(["erreur": "refuse"])
        }
    }

    private func demarrer() {
        guard let camera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
              let entree = try? AVCaptureDeviceInput(device: camera), capture.canAddInput(entree) else {
            return terminer(["erreur": "aucune"])
        }
        capture.addInput(entree)
        let sortie = AVCaptureMetadataOutput()
        guard capture.canAddOutput(sortie) else { return terminer(["erreur": "indisponible"]) }
        capture.addOutput(sortie)
        sortie.setMetadataObjectsDelegate(self, queue: .main)
        sortie.metadataObjectTypes = [.qr]
        let couche = AVCaptureVideoPreviewLayer(session: capture)
        couche.videoGravity = .resizeAspectFill
        couche.frame = view.bounds
        view.layer.insertSublayer(couche, at: 0)
        apercu = couche
        let capture = self.capture
        DispatchQueue.global(qos: .userInitiated).async { capture.startRunning() }
    }

    nonisolated func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput objets: [AVMetadataObject],
                                    from connection: AVCaptureConnection) {
        let lus = objets.compactMap { ($0 as? AVMetadataMachineReadableCodeObject)?.stringValue }
        DispatchQueue.main.async { self.lu(lus) }
    }

    private func lu(_ lus: [String]) {
        guard fin != nil, let texte = lus.first else { return }
        if Self.vientDeLaConsole(texte) {
            terminer(["texte": texte])
        } else if texte != dernierAutre {
            dernierAutre = texte
            message.text = textes["autre"]
        }
    }

    /// Lien « Ajouter un Pi » arrivé pendant la lecture (lien universel,
    /// LiensRecus) : rendu comme un code QR lu.
    func rendre(_ texte: String) {
        terminer(["texte": texte])
    }

    private func terminer(_ resultat: [String: Any]) {
        guard let fin else { return }
        self.fin = nil
        let capture = self.capture
        DispatchQueue.global(qos: .userInitiated).async { if capture.isRunning { capture.stopRunning() } }
        dismiss(animated: true) { fin(resultat) }
    }
}
