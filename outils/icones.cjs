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

// Dessine les icônes PNG à partir de icones/icone.svg, avec Chromium (Playwright) :
//   node outils/icones.cjs
// À relancer après un changement de icones/icone.svg.

const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const ICONES = path.resolve(__dirname, "..", "icones");

(async () => {
  const svg = fs.readFileSync(path.join(ICONES, "icone.svg"), "utf8");
  const navigateur = await chromium.launch();
  const page = await navigateur.newPage();
  // Application iPhone (ios/) : une seule image 1024 × 1024, sans transparence
  // (refusée par l'App Store), dans son catalogue d'images.
  const IOS = path.resolve(__dirname, "..", "ios", "PiAppliance", "Assets.xcassets", "AppIcon.appiconset", "icone-1024.png");
  for (const [taille, fichier] of [[192, path.join(ICONES, "icone-192.png")], [512, path.join(ICONES, "icone-512.png")],
    [180, path.join(ICONES, "apple-touch-icon.png")], [1024, IOS]]) {
    await page.setViewportSize({ width: taille, height: taille });
    await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${taille}px;height:${taille}px}</style>${svg}`);
    await page.screenshot({ path: fichier, omitBackground: false });
  }
  await navigateur.close();
})();
