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
// écran, les pages de l'application web embarquées (ControleurWeb).

import SwiftUI

@main
struct PiApplianceApp: App {
    var body: some Scene {
        WindowGroup {
            // Les pages gèrent elles-mêmes les bords de l'écran (viewport-fit=cover).
            VueWeb().ignoresSafeArea()
        }
    }
}

struct VueWeb: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> ControleurWeb { ControleurWeb() }
    func updateUIViewController(_ controleur: ControleurWeb, context: Context) {}
}
