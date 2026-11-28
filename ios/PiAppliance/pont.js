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

// Pont entre les pages et l'application iPhone, posé avant tout autre script
// (ControleurWeb.swift). Sa présence dit aux pages qu'elles tournent dans
// l'application (app.js, cle.js, lecteur.js, mespi.js). Chaque appel rend une
// promesse : la réponse de l'application (ControleurWeb.userContentController).
//   sonder(base, ajoute) → { repond, texte?, certificat? }  (texte : api/hello)
//   scanner(textes)      → { texte } | { annule: true } | { erreur }
//   oublier(base)        → true  (certificat retenu pour ce Pi oublié)
//   console(adresse, { champs?, repli? })
//                        → { ok, erreur? }  écran de la console du Pi, avec
//                          « Retour » (question 43) ; avec champs, formulaire
//                          de l'appairage envoyé d'abord (cle.js) ; repli :
//                          adresse ouverte si le Pi ne répond pas
//   envoyerFormulaire(adresse, champs)
//                        → { ok, statut?, erreur? }  formulaire envoyé sans
//                          ouvrir la console (« retirer », cle.js)

(function () {
  "use strict";

  const pont = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.piAppliance;
  if (!pont) return;
  const envoyer = (message) => pont.postMessage(message);
  const t = (cle) => (window.t ? window.t(cle) : "");
  // Textes de l'écran de la console, dans la langue des pages (textes.js).
  const textesConsole = () => ({
    retour: t("retour"), attente: t("console.attente"),
    injoignable: t("console.injoignable"), certificat: t("etat.certificat.change"),
  });

  window.piApplianceIos = Object.freeze({
    sonder: (base, ajoute) => envoyer({ action: "sonder", base: String(base), ajoute: !!ajoute }),
    scanner: (textes) => envoyer({ action: "scanner", textes: textes || {} }),
    oublier: (base) => envoyer({ action: "oublier", base: String(base) }),
    console: (adresse, options) => {
      const message = { action: "console", adresse: String(adresse), textes: textesConsole() };
      if (options && options.champs) message.champs = options.champs;
      if (options && options.repli) message.repli = String(options.repli);
      return envoyer(message);
    },
    envoyerFormulaire: (adresse, champs) => envoyer({ action: "envoyer", adresse: String(adresse), champs: champs || {} }),
  });
})();
