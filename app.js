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

// Commun à toutes les pages : langue de l'interface, service worker (hors
// ligne et mise à jour en silence), version de la documentation, aide à
// l'installation sur l'écran d'accueil (spécification 3 et 5).

(function () {
  "use strict";

  const DROITE_A_GAUCHE = ["ar", "fa"];
  const script = document.currentScript;
  const racine = new URL(".", script ? script.src : location.href);

  function langue() {
    const textes = window.TEXTES || {};
    let choisie = null;
    try { choisie = localStorage.getItem("langue"); } catch (e) { /* stockage refusé */ }
    if (choisie && textes[choisie]) return choisie;
    for (const l of navigator.languages || [navigator.language || "fr"]) {
      const court = String(l).toLowerCase().split("-")[0];
      if (textes[court]) return court;
    }
    return "fr";
  }

  const LANGUE = langue();

  function t(cle, valeurs) {
    const textes = window.TEXTES || {};
    let texte = (textes[LANGUE] && textes[LANGUE][cle]) || (textes.fr && textes.fr[cle]) || cle;
    for (const [k, v] of Object.entries(valeurs || {})) texte = texte.split(`{${k}}`).join(v);
    return texte;
  }
  window.t = t;

  function appliquerLangue() {
    document.documentElement.lang = LANGUE;
    document.documentElement.dir = DROITE_A_GAUCHE.includes(LANGUE) ? "rtl" : "ltr";
    if (LANGUE === "fr") return; // le HTML est déjà en français
    for (const el of document.querySelectorAll("[data-t]")) el.textContent = t(el.dataset.t);
  }

  function dateLocale(iso) {
    try {
      return new Intl.DateTimeFormat(LANGUE, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
        .format(new Date(`${iso}T00:00:00Z`));
    } catch (e) {
      return iso;
    }
  }

  // Texte traduit dont {commit} devient un lien vers la page du commit sur GitHub.
  function avecCommit(el, texte, depot, commit) {
    const [avant, apres = ""] = texte.split("{commit}");
    const lien = document.createElement("a");
    lien.href = `https://github.com/gmoulard/${depot}/commit/${encodeURIComponent(commit)}`;
    lien.rel = "noopener";
    const code = document.createElement("code");
    code.textContent = commit.slice(0, 7);
    lien.append(code);
    el.replaceChildren(avant, lien, apres);
  }

  // Pied de page (TODO-5.21 de pi-appliance) : la documentation (version,
  // date et commit de pi-appliance) et l'application (son commit et sa date).
  function afficherVersion(v) {
    const el = document.getElementById("version-doc");
    if (!el || !v) return;
    if (v.commit) avecCommit(el, t("doc.version", { version: v.version, date: dateLocale(v.date) }), "pi-appliance", v.commit);
    const app = document.getElementById("version-app");
    if (app && v.app_commit) avecCommit(app, t("app.version", { date: v.app_date ? dateLocale(v.app_date) : "" }), "pi-appliance-pwa", v.app_commit);
  }

  async function lireVersion() {
    const el = document.getElementById("version-doc");
    if (!el) return;
    try {
      const r = await fetch(new URL("version.json", racine));
      if (r.ok) afficherVersion(await r.json());
    } catch (e) {
      if (!el.textContent) el.textContent = t("doc.horsligne");
    }
  }

  function serviceWorker() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "version") afficherVersion(event.data.version);
    });
    navigator.serviceWorker.register(new URL("sw.js", racine), { scope: racine.pathname }).then(() => {
      if (navigator.onLine === false) return;
      return navigator.serviceWorker.ready.then((reg) => { if (reg.active) reg.active.postMessage("verifier"); });
    }).catch((e) => console.warn("Service worker refusé :", e));
  }

  // Aide à l'installation : toujours dans le menu, jamais proposée d'elle-même.
  let invitation = null;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    invitation = event;
    const bouton = document.getElementById("installer-bouton");
    if (bouton) bouton.hidden = false;
  });

  function installation() {
    const fenetre = document.getElementById("installer");
    const ouvrir = document.getElementById("menu-installer");
    if (!fenetre || !ouvrir) return;
    const installee = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    document.getElementById("installer-deja").hidden = !installee;
    ouvrir.addEventListener("click", () => {
      const menu = ouvrir.closest("details");
      if (menu) menu.open = false;
      fenetre.showModal();
    });
    document.getElementById("installer-fermer").addEventListener("click", () => fenetre.close());
    document.getElementById("installer-bouton").addEventListener("click", async () => {
      if (!invitation) return;
      invitation.prompt();
      await invitation.userChoice;
      invitation = null;
      document.getElementById("installer-bouton").hidden = true;
      fenetre.close();
    });
  }

  function demarrer() {
    appliquerLangue();
    lireVersion();
    installation();
  }

  serviceWorker();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", demarrer);
  else demarrer();
})();
