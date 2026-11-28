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

// Application iPhone de pi-appliance (spécification 2, TODO-1.12) : un seul
// écran, les pages de l'application web embarquées (ControleurWeb). Un lien
// « Ajouter un Pi » de la console (https://app.pi-appliance.com/#add?…) lu
// par l'appareil photo ou touché ailleurs ouvre l'application (lien
// universel, question 46 ; PiAppliance.entitlements et
// .well-known/apple-app-site-association du site). À chaque retour dans
// l'application, la documentation à jour est cherchée (Documentation.swift).

import SwiftUI

@main
struct PiApplianceApp: App {
    @Environment(\.scenePhase) private var phase

    var body: some Scene {
        WindowGroup {
            // Les pages gèrent elles-mêmes les bords de l'écran (viewport-fit=cover).
            VueWeb()
                .ignoresSafeArea()
                .onOpenURL { LiensRecus.partage.recevoir($0) }
                .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { activite in
                    if let lien = activite.webpageURL { LiensRecus.partage.recevoir(lien) }
                }
        }
        .onChange(of: phase) { nouvelle in
            if nouvelle == .active { Documentation.partage.verifier() }
        }
    }
}

struct VueWeb: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> ControleurWeb { ControleurWeb() }
    func updateUIViewController(_ controleur: ControleurWeb, context: Context) {}
}
