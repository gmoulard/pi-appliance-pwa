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

// « Mes Pi » (spécification 4) : la liste des Pi, gardée sur le téléphone
// (stockage local du navigateur), l'ajout à la main, par un lien #add?...
// ou par la recherche à la maison, l'état de chaque Pi et son ouverture.
// Rien ne quitte le téléphone : l'application ne parle qu'aux Pi eux-mêmes.

(function () {
  "use strict";

  const CLE = "mesPi";
  const CLE_RESEAU_LOCAL = "reseauLocalAutorise";
  const DELAI = 5000;
  const CHEMIN = "/pi-appliance";
  const NOMS_CONNUS = ["pi-appliance", "pi-appliance-2", "pi-appliance-3", "pi-appliance-4"];

  const t = (cle, valeurs) => window.t(cle, valeurs);

  // ---- Stockage ----

  function lire() {
    try {
      const liste = JSON.parse(localStorage.getItem(CLE) || "[]");
      return Array.isArray(liste) ? liste.filter((p) => p && typeof p.nom === "string" && typeof p.maison === "string") : [];
    } catch (e) {
      return [];
    }
  }

  function ecrire(liste) {
    try {
      localStorage.setItem(CLE, JSON.stringify(liste));
      return true;
    } catch (e) {
      return false;
    }
  }

  function trier(liste) {
    return liste.slice().sort((a, b) => a.nom.localeCompare(b.nom, "fr", { numeric: true }));
  }

  // Ajoute un Pi, ou met à jour sa fiche : même identifiant stable (un Pi qui
  // a changé de nom), sinon même adresse à la maison.
  function enregistrer(pi) {
    const liste = lire();
    const i = liste.findIndex((p) => (pi.id && p.id === pi.id) || p.maison === pi.maison);
    if (i >= 0) liste[i] = { ...liste[i], ...pi };
    else liste.push(pi);
    return ecrire(liste) ? (i >= 0 ? "maj" : "ajoute") : "erreur";
  }

  function supprimer(maison) {
    ecrire(lire().filter((p) => p.maison !== maison));
  }

  // ---- Adresses ----

  const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
  const NOM_HOTE = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/;

  // Hôte et port d'une saisie : « controltower », « controltower.local »,
  // « 192.168.1.196 », « https://controltower.local/pi-appliance/ »…
  function hote(saisie) {
    let texte = String(saisie || "").trim().toLowerCase();
    if (!texte) return null;
    if (!/^[a-z][a-z0-9+.-]*:\/\//.test(texte)) texte = `https://${texte}`;
    let url;
    try { url = new URL(texte); } catch (e) { return null; }
    if (url.username || url.password) return null;
    const h = url.hostname.replace(/\.$/, "");
    if (!IPV4.test(h) && !NOM_HOTE.test(h)) return null;
    return { hote: h, port: url.port };
  }

  // Saisie à la main (spécification 4.1) : un nom seul est complété en
  // « <nom>.local » ; l'adresse de la console finit toujours par /pi-appliance.
  function normaliser(maisonSaisie, internetSaisie) {
    const m = hote(maisonSaisie);
    if (!m) return { erreur: "ajouter.erreur.maison" };
    let h = m.hote;
    if (!IPV4.test(h) && !h.includes(".")) h = `${h}.local`;
    const port = m.port ? `:${m.port}` : "";
    const nom = IPV4.test(h) ? h : h.replace(/\.local$/, "").split(".")[0];
    const pi = { nom, maison: `https://${h}${port}${CHEMIN}`, internet: "", services: [] };
    if (String(internetSaisie || "").trim()) {
      const w = hote(internetSaisie);
      if (!w || w.hote.endsWith(".local") || !w.hote.includes(".")) return { erreur: "ajouter.erreur.internet" };
      pi.internet = `https://${w.hote}${w.port ? `:${w.port}` : ""}${CHEMIN}`;
    }
    return { pi };
  }

  // Lien #add?n=…&l=…&w=…&id=… donné par la console (spécification 4.1,
  // docs/demande-pi-appliance.md). Les services (s) seront lus quand leur
  // format sera fixé dans pi-appliance.
  function lireLien(hash) {
    const m = String(hash || "").match(/^#add\?(.*)$/);
    if (!m) return null;
    const p = new URLSearchParams(m[1]);
    const r = normaliser(p.get("l") || p.get("n") || "", p.get("w") || "");
    if (r.erreur) return r;
    const n = String(p.get("n") || "").trim().toLowerCase();
    if (/^[a-z0-9-]{1,63}$/.test(n)) r.pi.nom = n;
    const id = String(p.get("id") || "").trim().toLowerCase();
    if (/^[0-9a-f]{8,64}$/.test(id)) r.pi.id = id;
    return r;
  }

  // ---- État (spécification 4.3) ----

  async function demande(url, options) {
    const arret = new AbortController();
    const minuterie = setTimeout(() => arret.abort(), DELAI);
    try {
      return await fetch(url, { ...options, signal: arret.signal, cache: "no-store", credentials: "omit" });
    } finally {
      clearTimeout(minuterie);
    }
  }

  // Une adresse répond-elle ? D'abord api/hello (réponse lisible, à venir dans
  // pi-appliance), sinon une simple demande dont la réponse ne peut pas être
  // lue : elle aboutit si le Pi est joignable et son certificat accepté.
  async function sonder(base) {
    try {
      const r = await demande(`${base}/api/hello`, { mode: "cors" });
      if (r.ok) {
        let infos = null;
        try { infos = await r.json(); } catch (e) { /* réponse inattendue */ }
        return { repond: true, infos };
      }
    } catch (e) { /* pas encore de api/hello, ou pas joignable */ }
    try {
      await demande(`${base}/`, { mode: "no-cors" });
      return { repond: true, infos: null };
    } catch (e) {
      return { repond: false };
    }
  }

  function reseauLocalAutorise() {
    try { return localStorage.getItem(CLE_RESEAU_LOCAL) === "oui"; } catch (e) { return false; }
  }

  function autoriserReseauLocal() {
    try { localStorage.setItem(CLE_RESEAU_LOCAL, "oui"); } catch (e) { /* stockage refusé */ }
  }

  // ---- Affichage ----

  const etats = new Map(); // adresse maison → { internet, maison }

  function el(balise, attributs, ...enfants) {
    const e = document.createElement(balise);
    for (const [k, v] of Object.entries(attributs || {})) {
      if (k === "texte") e.textContent = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? "" : v);
    }
    e.append(...enfants.filter(Boolean));
    return e;
  }

  // Adresse ouverte par le bouton unique (réponse 33) : internet si elle
  // répond, sinon la maison.
  function adresseAOuvrir(pi) {
    const e = etats.get(pi.maison) || {};
    if (pi.internet && e.internet && e.internet.repond) return `${pi.internet}/`;
    return `${pi.maison}/`;
  }

  function texteEtat(pi) {
    const e = etats.get(pi.maison);
    if (!e || e.enCours) return { texte: t("etat.verification"), classe: "attente" };
    if (e.internet && e.internet.repond) return { texte: t("etat.internet"), classe: "marche" };
    if (e.maison && e.maison.repond) return { texte: t("etat.maison"), classe: "marche" };
    if (!e.maison) return { texte: pi.internet ? t("etat.aucun.internet") : t("etat.maison.inconnu"), classe: "attente" };
    return { texte: t("etat.aucun"), classe: "arret" };
  }

  function afficherListe() {
    const liste = trier(lire());
    const ul = document.getElementById("liste-pi");
    ul.replaceChildren(...liste.map((pi) => {
      const etat = texteEtat(pi);
      const services = (pi.services || []).filter((s) => s && s.nom && /^https:\/\//.test(s.adresse || ""));
      return el("li", { class: "carte fiche-pi" },
        el("h2", { texte: pi.nom }),
        el("p", { class: `etat ${etat.classe}`, role: "status", texte: etat.texte }),
        el("p", { class: "adresses" },
          el("span", { texte: pi.maison }),
          pi.internet ? el("br") : null,
          pi.internet ? el("span", { texte: pi.internet }) : null),
        el("div", { class: "actions" },
          el("a", { class: "bouton", href: adresseAOuvrir(pi), target: "_blank", rel: "noopener", texte: t("pi.ouvrir") }),
          el("button", {
            type: "button", class: "bouton secondaire",
            onclick: () => {
              if (window.confirm(t("pi.supprimer.confirmer", { nom: pi.nom }))) {
                supprimer(pi.maison);
                etats.delete(pi.maison);
                route();
              }
            },
            texte: t("pi.supprimer"),
          })),
        services.length ? el("ul", { class: "services" },
          ...services.map((s) => el("li", {}, el("a", { href: s.adresse, target: "_blank", rel: "noopener", texte: s.nom })))) : null);
    }));
    document.getElementById("reseau-local").hidden = reseauLocalAutorise() || !liste.length;
  }

  async function verifierEtats() {
    const liste = lire();
    const local = reseauLocalAutorise();
    await Promise.all(liste.map(async (pi) => {
      etats.set(pi.maison, { enCours: true });
      afficherListe();
      const [internet, maison] = await Promise.all([
        pi.internet ? sonder(pi.internet) : null,
        local ? sonder(pi.maison) : null,
      ]);
      etats.set(pi.maison, { internet, maison });
      const infos = (internet && internet.infos) || (maison && maison.infos);
      if (infos) majDepuisHello(pi, infos);
      afficherListe();
    }));
  }

  // Services relus dans api/hello (spécification 4.3) ; format défini dans
  // docs/demande-pi-appliance.md, à confirmer quand pi-appliance l'aura réalisé.
  function majDepuisHello(pi, infos) {
    if (!infos || typeof infos !== "object") return;
    const maj = {};
    if (Array.isArray(infos.services)) {
      maj.services = infos.services
        .filter((s) => s && typeof s.name === "string" && typeof s.address === "string")
        .map((s) => ({ nom: s.name, adresse: /^https?:\/\//.test(s.address) ? s.address : `https://${s.address}` }))
        .filter((s) => /^https:\/\//.test(s.adresse));
    }
    if (typeof infos.id === "string" && /^[0-9a-f]{8,64}$/.test(infos.id)) maj.id = infos.id;
    if (Object.keys(maj).length) enregistrer({ ...pi, ...maj });
  }

  // ---- Écrans ----

  const VUES = ["vue-accueil", "vue-mespi", "vue-ajouter", "vue-chercher", "vue-lien"];

  function montrer(vue) {
    for (const v of VUES) {
      const e = document.getElementById(v);
      if (e) e.hidden = v !== vue;
    }
    window.scrollTo(0, 0);
  }

  let lienEnAttente = null;

  function route() {
    const hash = location.hash;
    if (hash.startsWith("#add?")) {
      const r = lireLien(hash);
      const zone = document.getElementById("lien-details");
      const bouton = document.getElementById("lien-ajouter");
      if (r.erreur) {
        lienEnAttente = null;
        zone.replaceChildren(el("p", { class: "note", texte: t("lien.invalide") }));
        bouton.hidden = true;
      } else {
        lienEnAttente = r.pi;
        zone.replaceChildren(
          el("h2", { texte: r.pi.nom }),
          el("p", { class: "adresses" }, el("span", { texte: r.pi.maison }),
            r.pi.internet ? el("br") : null, r.pi.internet ? el("span", { texte: r.pi.internet }) : null));
        bouton.hidden = false;
      }
      montrer("vue-lien");
      return;
    }
    if (hash === "#ajouter") { montrer("vue-ajouter"); return; }
    if (hash === "#chercher") { montrer("vue-chercher"); return; }
    if (lire().length) {
      afficherListe();
      montrer("vue-mespi");
    } else {
      montrer("vue-accueil");
    }
  }

  function retourListe() {
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    route();
    verifierEtats();
  }

  function formulaireAjout() {
    const form = document.getElementById("form-ajouter");
    const message = document.getElementById("ajouter-message");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const r = normaliser(form.maison.value, form.internet.value);
      if (r.erreur) {
        message.textContent = t(r.erreur);
        message.hidden = false;
        return;
      }
      if (enregistrer(r.pi) === "erreur") {
        message.textContent = t("stockage.erreur");
        message.hidden = false;
        return;
      }
      message.hidden = true;
      form.reset();
      retourListe();
    });
  }

  function recherche() {
    const bouton = document.getElementById("chercher-lancer");
    const etat = document.getElementById("chercher-etat");
    const resultats = document.getElementById("chercher-resultats");
    bouton.addEventListener("click", async () => {
      autoriserReseauLocal();
      bouton.disabled = true;
      resultats.replaceChildren();
      etat.textContent = t("chercher.encours");
      const connus = lire();
      const noms = [...new Set([...connus.map((p) => p.maison), ...NOMS_CONNUS.map((n) => `https://${n}.local${CHEMIN}`)])];
      const trouves = [];
      await Promise.all(noms.map(async (maison) => {
        const s = await sonder(maison);
        if (s.repond) trouves.push(maison);
      }));
      bouton.disabled = false;
      etat.textContent = trouves.length ? t("chercher.trouve", { n: trouves.length }) : t("chercher.rien");
      for (const maison of trouves.sort()) {
        const deja = connus.find((p) => p.maison === maison);
        const nom = new URL(maison).hostname.replace(/\.local$/, "");
        resultats.append(el("li", { class: "carte fiche-pi" },
          el("h2", { texte: nom }),
          el("p", { class: "adresses" }, el("span", { texte: maison })),
          deja
            ? el("p", { class: "etat marche", texte: t("chercher.deja") })
            : el("button", {
              type: "button", class: "bouton",
              onclick: (event) => {
                enregistrer({ nom, maison, internet: "", services: [] });
                event.target.replaceWith(el("p", { class: "etat marche", texte: t("chercher.ajoute") }));
              },
              texte: t("chercher.ajouter"),
            })));
      }
    });
  }

  function demarrer() {
    if (!document.getElementById("vue-mespi")) return;
    formulaireAjout();
    recherche();
    document.getElementById("lien-ajouter").addEventListener("click", () => {
      if (lienEnAttente) enregistrer(lienEnAttente);
      lienEnAttente = null;
      retourListe();
    });
    document.getElementById("reseau-local-verifier").addEventListener("click", () => {
      autoriserReseauLocal();
      verifierEtats();
    });
    for (const b of document.querySelectorAll("[data-retour]")) b.addEventListener("click", retourListe);
    window.addEventListener("hashchange", route);
    route();
    if (!location.hash) verifierEtats();
  }

  // Pour les essais (outils/essai.cjs).
  window.mesPi = { normaliser, lireLien, adresseAOuvrir, etats };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", demarrer);
  else demarrer();
})();
