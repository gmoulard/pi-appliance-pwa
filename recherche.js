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

// Recherche dans la documentation, sans réseau (spécification 3) : l'index
// doc/recherche.json est construit avec le site et gardé par le service worker.
// Chaque mot cherché doit se trouver dans la section, sans tenir compte des
// accents ni des majuscules ; un mot trouvé dans un titre compte plus.

(function () {
  "use strict";

  const MAX = 20;
  let sections = null;

  function simple(texte) {
    return String(texte).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  async function charger() {
    if (sections) return sections;
    const r = await fetch("recherche.json");
    if (!r.ok) throw new Error(`recherche.json : HTTP ${r.status}`);
    sections = (await r.json()).map((s) => ({
      ...s,
      cleTitre: simple(`${s.titre} ${s.section}`),
      cleTexte: simple(s.texte),
    }));
    return sections;
  }

  function extrait(s, mot) {
    // simple() garde la longueur du texte en français courant : la position
    // trouvée dans le texte simplifié vaut pour le texte d'origine.
    const i = Math.max(0, s.cleTexte.indexOf(mot));
    const debut = Math.max(0, i - 60);
    const fin = Math.min(s.texte.length, i + 140);
    return (debut > 0 ? "… " : "") + s.texte.slice(debut, fin).trim() + (fin < s.texte.length ? " …" : "");
  }

  function chercher(liste, requete) {
    const mots = simple(requete).split(/\s+/).filter((m) => m.length > 1);
    if (!mots.length) return [];
    const trouves = [];
    for (const s of liste) {
      let score = 0;
      for (const m of mots) {
        const dansTitre = s.cleTitre.includes(m);
        const dansTexte = s.cleTexte.includes(m);
        if (!dansTitre && !dansTexte) { score = -1; break; }
        score += (dansTitre ? 10 : 0) + (dansTexte ? 1 : 0);
      }
      if (score > 0) trouves.push({ s, score, extrait: extrait(s, mots[0]) });
    }
    return trouves.sort((a, b) => b.score - a.score).slice(0, MAX);
  }

  function demarrer() {
    const formulaire = document.getElementById("recherche");
    const champ = document.getElementById("recherche-texte");
    const etat = document.getElementById("recherche-etat");
    const resultats = document.getElementById("recherche-resultats");
    if (!formulaire || !champ) return;
    let minuterie = null;

    async function lancer() {
      const requete = champ.value.trim();
      resultats.replaceChildren();
      if (!requete) { etat.textContent = ""; return; }
      let liste;
      try {
        liste = await charger();
      } catch (e) {
        etat.textContent = window.t("recherche.indisponible");
        return;
      }
      const trouves = chercher(liste, requete);
      etat.textContent = trouves.length
        ? window.t("recherche.nombre", { n: trouves.length })
        : window.t("recherche.aucun", { texte: requete });
      for (const { s, extrait: texte } of trouves) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = s.ancre ? `${s.page}#${s.ancre}` : s.page;
        a.className = "carte-lien";
        const titre = document.createElement("strong");
        titre.textContent = s.section === s.titre ? s.titre : `${s.section} — ${s.titre}`;
        const p = document.createElement("span");
        p.className = "extrait";
        p.textContent = texte;
        a.append(titre, p);
        li.append(a);
        resultats.append(li);
      }
    }

    formulaire.addEventListener("submit", (event) => { event.preventDefault(); lancer(); champ.blur(); });
    champ.addEventListener("input", () => {
      clearTimeout(minuterie);
      minuterie = setTimeout(lancer, 150);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", demarrer);
  else demarrer();
})();
