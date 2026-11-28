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

// Lecteur de code QR (spécification 4.1) : la caméra du téléphone, lue par
// jsQR (vendor/jsqr, chargé seulement quand on scanne). Sur iPhone,
// l'application de l'écran d'accueil ne partage pas ses données avec Safari :
// le code doit être lu ici, pas par l'appareil photo.

(function () {
  "use strict";

  const racine = new URL(".", document.currentScript ? document.currentScript.src : location.href);
  const SITES = ["app.pi-appliance.com", "gmoulard.github.io", location.host];
  const PAUSE = 150; // millisecondes entre deux analyses d'image

  let flux = null;
  let actif = false;
  let chargement = null;

  function chargerJsQR() {
    if (window.jsQR) return Promise.resolve(window.jsQR);
    if (!chargement) {
      chargement = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = new URL("vendor/jsqr/jsQR.js", racine).href;
        s.onload = () => (window.jsQR ? resolve(window.jsQR) : reject(new Error("jsQR absent")));
        s.onerror = () => { chargement = null; reject(new Error("jsQR introuvable")); };
        document.head.append(s);
      });
    }
    return chargement;
  }

  // Le texte d'un code QR mène-t-il à « Ajouter un Pi » ? Rend « #add?... ».
  function lienAjout(texte) {
    let url;
    try { url = new URL(String(texte).trim()); } catch (e) { return null; }
    if (url.protocol !== "https:" && url.host !== location.host) return null;
    if (!SITES.includes(url.host) || !url.hash.startsWith("#add?")) return null;
    return url.hash;
  }

  // Analyse une image (canvas) : texte du code QR trouvé, ou null.
  function analyser(jsQR, canvas) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(image.data, image.width, image.height, { inversionAttempts: "attemptBoth" });
    return code ? code.data : null;
  }

  function arreter() {
    actif = false;
    if (flux) for (const piste of flux.getTracks()) piste.stop();
    flux = null;
  }

  // Application iPhone : l'appareil photo est lu par l'application elle-même
  // (ios/PiAppliance/LecteurQR.swift), qui ne rend qu'un code de la console ;
  // ni jsQR ni getUserMedia. Lecture abandonnée : annule().
  async function demarrerIos(video, { trouve, autre, erreur, annule }) {
    const cadre = video.closest(".camera");
    if (cadre) cadre.style.display = "none";
    let r = null;
    try {
      r = await window.piApplianceIos.scanner({ explication: window.t("scanner.explication"), annuler: window.t("annuler"), autre: window.t("scanner.autre") });
    } catch (e) {
      erreur("scanner.indisponible");
      return;
    }
    if (r && typeof r.texte === "string") {
      const hash = lienAjout(r.texte);
      if (hash) trouve(hash); else autre();
    } else if (r && ["refuse", "aucune", "indisponible"].includes(r.erreur)) {
      erreur(`scanner.${r.erreur}`);
    } else if (annule) {
      annule();
    }
  }

  // Lance la caméra dans <video> ; trouve(hash) quand un code de la console
  // est lu, autre() pour un code QR qui n'en vient pas, erreur(cle) sinon.
  async function demarrer(video, rappels) {
    if (window.piApplianceIos) return demarrerIos(video, rappels);
    const { trouve, autre, erreur } = rappels;
    arreter();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { erreur("scanner.indisponible"); return; }
    let jsQR;
    try {
      jsQR = await chargerJsQR();
      flux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    } catch (e) {
      arreter();
      erreur(e && e.name === "NotAllowedError" ? "scanner.refuse" : e && e.name === "NotFoundError" ? "scanner.aucune" : "scanner.indisponible");
      return;
    }
    actif = true;
    video.srcObject = flux;
    video.setAttribute("playsinline", "");
    video.muted = true;
    try { await video.play(); } catch (e) { /* lecture lancée par l'attribut autoplay */ }
    const canvas = document.createElement("canvas");
    let dernierAutre = "";
    const tour = () => {
      if (!actif) return;
      if (video.readyState >= 2 && video.videoWidth) {
        const echelle = Math.min(1, 800 / Math.max(video.videoWidth, video.videoHeight));
        canvas.width = Math.round(video.videoWidth * echelle);
        canvas.height = Math.round(video.videoHeight * echelle);
        canvas.getContext("2d", { willReadFrequently: true }).drawImage(video, 0, 0, canvas.width, canvas.height);
        const texte = analyser(jsQR, canvas);
        if (texte) {
          const hash = lienAjout(texte);
          if (hash) { arreter(); trouve(hash); return; }
          if (texte !== dernierAutre) { dernierAutre = texte; autre(); }
        }
      }
      setTimeout(tour, PAUSE);
    };
    tour();
  }

  window.lecteurQR = { demarrer, arreter, lienAjout, analyser, chargerJsQR };
})();
