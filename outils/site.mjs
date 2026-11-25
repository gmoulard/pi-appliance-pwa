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

// Construction du site (spécification 3) : copie l'application, convertit en
// HTML les pages de docs/ de pi-appliance, construit l'index de recherche et
// version.json, la liste des fichiers gardés pour le hors ligne.
//
// node outils/site.mjs --docs <docs de pi-appliance> --version v0.1.4 \
//   --commit <sha> --date AAAA-MM-JJ --out _site \
//   [--app-commit <sha de ce dépôt> --app-date AAAA-MM-JJ]
//
// Sans --app-commit, le commit de l'application et sa date sont lus dans le
// dépôt git de l'application (git log), et omis si git ne répond pas.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Pages reprises, dans l'ordre du sommaire (spécification 3). Une page absente
// de la version de pi-appliance (la FAQ, pas encore écrite) est sautée.
const PAGES = ["guide-utilisateur", "faq", "installation", "marketplace", "essais-plusieurs-pi"];

// Fichiers de l'application, copiés tels quels.
const APPLICATION = [
  "index.html", "app.css", "app.js", "textes.js", "cle.js", "lecteur.js", "mespi.js",
  "vendor/jsqr/jsQR.js", "vendor/jsqr/LICENSE", "recherche.js", "sw.js",
  "manifest.webmanifest",
  "icones/symbole.svg", "icones/favicon.svg", "icones/icone.svg",
  "icones/icone-192.png", "icones/icone-512.png", "icones/apple-touch-icon.png",
];

const SITE_EN_LIGNE = "https://www.pi-appliance.com/";

function options() {
  const o = {};
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i += 2) {
    if (!a[i].startsWith("--") || a[i + 1] === undefined) throw new Error(`Option incomplète : ${a[i]}`);
    o[a[i].slice(2)] = a[i + 1];
  }
  for (const nom of ["docs", "version", "commit", "date", "out"]) {
    if (!o[nom]) throw new Error(`Option manquante : --${nom}`);
  }
  if (!/^v\d+\.\d+\.\d+$/.test(o.version)) throw new Error(`Version invalide : ${o.version}`);
  if (!/^[0-9a-f]{7,40}$/.test(o.commit)) throw new Error(`Commit invalide : ${o.commit}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(o.date)) throw new Error(`Date invalide : ${o.date}`);
  if (!o["app-commit"]) {
    try {
      const [sha, jour] = execFileSync("git", ["-C", RACINE, "log", "-1", "--format=%H %cs"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim().split(" ");
      o["app-commit"] = sha;
      o["app-date"] = o["app-date"] || jour;
    } catch (e) {
      // Pas de git : le pied de page ne donne pas le commit de l'application.
    }
  }
  if (o["app-commit"] && !/^[0-9a-f]{7,40}$/.test(o["app-commit"])) throw new Error(`Commit de l'application invalide : ${o["app-commit"]}`);
  if (o["app-date"] && !/^\d{4}-\d{2}-\d{2}$/.test(o["app-date"])) throw new Error(`Date de l'application invalide : ${o["app-date"]}`);
  return o;
}

// Dépôts et licence (pied de page de chaque page, TODO-5.21 de pi-appliance).
const DEPOT_PI = "https://github.com/gmoulard/pi-appliance";
const DEPOT_APP = "https://github.com/gmoulard/pi-appliance-pwa";
const LICENCE_APP = `${DEPOT_APP}/blob/main/LICENSE`;

function echapper(texte) {
  return String(texte).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Identifiant d'un titre, comme kramdown sur www.pi-appliance.com : sans
// accents ni ponctuation, espaces en tirets (« Télécharger l'image » →
// « telecharger-limage »), pour que les liens #ancre de la documentation marchent.
function identifiant(texte) {
  const id = texte
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^a-z0-9 _-]/g, "")
    .trim()
    .replace(/ /g, "-");
  return id || "section";
}

function texteSeul(html) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function dateFrancaise(iso) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${iso}T00:00:00Z`));
}

// Catalogue de la marketplace : sur www.pi-appliance.com il est chargé par un
// script ; ici il est écrit dans la page, pour être lisible sans réseau.
function catalogue(docs) {
  const index = path.join(docs, "static", "pi-appliance-catalog.json");
  if (!fs.existsSync(index)) return null;
  const fichier = JSON.parse(fs.readFileSync(index, "utf8")).file;
  if (!/^pi-appliance-[0-9a-f]{32}\.json$/.test(fichier)) throw new Error(`Nom de catalogue invalide : ${fichier}`);
  const donnees = JSON.parse(fs.readFileSync(path.join(docs, "static", fichier), "utf8"));
  const cartes = (donnees.apps || []).map((app) =>
    `<li class="carte-app"><strong>${echapper(app.name)}</strong> <span class="categorie">${echapper(app.category || "")}</span><br>${echapper(app.description || "")}</li>`);
  const prevues = (donnees.planned || []).map((app) =>
    `<li><strong>${echapper(app.name)}</strong> : ${echapper(app.description || "")}</li>`);
  return {
    apps: `<ul class="catalogue">\n${cartes.join("\n")}\n</ul>`,
    prevues: `<ul>\n${prevues.join("\n")}\n</ul>`,
  };
}

function preparerMarkdown(md, cat) {
  let texte = md.replace(/^---\n[\s\S]*?\n---\n/, ""); // en-tête Jekyll
  if (cat) {
    texte = texte.replace(/<div id="marketplace-catalog"[\s\S]*?<\/table>\s*<\/div>/, cat.apps);
    texte = texte.replace(/<ul id="marketplace-planned"[^>]*><\/ul>/, cat.prevues);
  }
  return texte.replace(/\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/g, ""); // gabarits Jekyll
}

function convertir(nom, md, pages, aCopier, gabarit) {
  const ids = new Map();
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth, text }) {
        // Identifiant donné par kramdown : « ## Titre {#ancre} ».
        const explicite = text.match(/\s*\{#([\w-]+)\}\s*$/);
        let id = explicite ? explicite[1] : identifiant(text);
        const vu = ids.get(id) || 0;
        ids.set(id, vu + 1);
        if (vu) id = `${id}-${vu}`;
        const contenu = this.parser.parseInline(tokens).replace(/\s*\{#[\w-]+\}\s*$/, "");
        return `<h${depth} id="${id}">${contenu}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const contenu = this.parser.parseInline(tokens);
        const cible = lien(href, pages, aCopier);
        const t = title ? ` title="${echapper(title)}"` : "";
        if (cible.enLigne) {
          return `<a href="${echapper(cible.href)}"${t} rel="noopener">${contenu}<span class="en-ligne" data-t="doc.enligne">en ligne</span></a>`;
        }
        return `<a href="${echapper(cible.href)}"${t}>${contenu}</a>`;
      },
      image({ href, title, text }) {
        const cible = lien(href, pages, aCopier);
        const t = title ? ` title="${echapper(title)}"` : "";
        return `<img src="${echapper(cible.href)}" alt="${echapper(text)}"${t} loading="lazy">`;
      },
    },
  });
  const corps = marked.parse(md);
  const titre = texteSeul((corps.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, nom])[1]);

  // Sections pour la recherche : coupées aux titres de niveau 1 à 3.
  const sections = [];
  const morceaux = corps.split(/(?=<h[1-3] id=")/);
  for (const m of morceaux) {
    const t = m.match(/^<h[1-3] id="([^"]+)">([\s\S]*?)<\/h[1-3]>/);
    const texte = texteSeul(t ? m.slice(t[0].length) : m);
    sections.push({ page: `${nom}.html`, titre, section: t ? texteSeul(t[2]) : titre, ancre: t ? t[1] : "", texte });
  }
  return { titre, html: gabarit({ titre, corps }), sections };
}

// Où mène un lien de la documentation : page reprise, page sur
// www.pi-appliance.com (« en ligne »), ou fichier copié (image).
function lien(href, pages, aCopier) {
  if (!href || href.startsWith("#")) return { href };
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return { href, enLigne: /^https?:/i.test(href) };
  const [chemin, ancre] = href.split("#");
  const suite = ancre !== undefined ? `#${ancre}` : "";
  const m = chemin.match(/^(?:\.\/)?([^/]+)\.(md|html)$/);
  if (m) {
    if (pages.has(m[1])) return { href: `${m[1]}.html${suite}` };
    return { href: `${SITE_EN_LIGNE}${m[1]}.html${suite}`, enLigne: true };
  }
  if (/^(?:\.\/)?[\w.-]+\.(svg|png|jpe?g|webp|gif)$/i.test(chemin)) {
    const fichier = chemin.replace(/^\.\//, "");
    aCopier.add(fichier);
    return { href: fichier + suite };
  }
  return { href: SITE_EN_LIGNE + chemin.replace(/^\.\//, "") + suite, enLigne: true };
}

function gabaritPage(pied) {
  return ({ titre, corps, recherche = false }) => `<!DOCTYPE html>
<!--
This file is part of pi-appliance-pwa <https://github.com/gmoulard/pi-appliance-pwa>.
Copyright (c) 2026 Guillaume Moulard. Licence GNU AGPL-3.0 : voir LICENSE.
Page construite par outils/site.mjs à partir de la documentation de pi-appliance.
-->
<html lang="fr" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#C71F5D">
<title>${echapper(titre)} — pi-appliance</title>
<link rel="icon" href="../icones/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../icones/apple-touch-icon.png">
<link rel="manifest" href="../manifest.webmanifest">
<link rel="stylesheet" href="../app.css">
<script src="../textes.js" defer></script>
<script src="../app.js" defer></script>
${recherche ? '<script src="../recherche.js" defer></script>\n' : ""}</head>
<body>
<header class="entete">
<a class="marque" href="../index.html"><img src="../icones/symbole.svg" alt="" width="40" height="40"><span class="wordmark"><b>pi</b>-appliance</span></a>
<a class="bouton secondaire petit" href="index.html" data-t="doc.sommaire">Sommaire</a>
</header>
<main class="doc">
${corps}
</main>
<footer class="pied">${pied}</footer>
</body>
</html>
`;
}

function empreinte(fichiers, sortie) {
  const h = createHash("sha256");
  for (const f of fichiers) {
    h.update(f);
    h.update(fs.readFileSync(path.join(sortie, f)));
  }
  return h.digest("hex").slice(0, 16);
}

function main() {
  const o = options();
  const docs = path.resolve(o.docs);
  const sortie = path.resolve(o.out);
  fs.rmSync(sortie, { recursive: true, force: true });
  fs.mkdirSync(path.join(sortie, "doc"), { recursive: true });

  // Domaine personnalisé de GitHub Pages, s'il est donné par un fichier CNAME
  // (le domaine se règle aussi dans les réglages de Pages, sans ce fichier).
  if (fs.existsSync(path.join(RACINE, "CNAME"))) fs.copyFileSync(path.join(RACINE, "CNAME"), path.join(sortie, "CNAME"));

  for (const f of APPLICATION) {
    const source = path.join(RACINE, f);
    if (!fs.existsSync(source)) throw new Error(`Fichier de l'application manquant : ${f}`);
    fs.mkdirSync(path.dirname(path.join(sortie, f)), { recursive: true });
    fs.copyFileSync(source, path.join(sortie, f));
  }

  const lien = (href, contenu) => `<a href="${echapper(href)}" rel="noopener">${contenu}<span class="en-ligne" data-t="doc.enligne">en ligne</span></a>`;
  const commitCourt = o.commit.slice(0, 7);
  let pied = `<span id="version-doc">Documentation de pi-appliance <strong>${echapper(o.version)}</strong> du ${dateFrancaise(o.date)}, `
    + `commit ${lien(`${DEPOT_PI}/commit/${o.commit}`, `<code>${commitCourt}</code>`)}.</span> `;
  if (o["app-commit"]) {
    pied += `<span id="version-app">Application, commit ${lien(`${DEPOT_APP}/commit/${o["app-commit"]}`, `<code>${o["app-commit"].slice(0, 7)}</code>`)}`
      + `${o["app-date"] ? ` du ${dateFrancaise(o["app-date"])}` : ""}.</span> `;
  }
  pied += `<span>${lien(LICENCE_APP, '<span data-t="pied.licence">Logiciel libre, licence AGPL-3.0</span>')} · ${lien(DEPOT_APP, '<span data-t="pied.source">Code source</span>')}</span>`;
  const gabarit = gabaritPage(pied);

  const presentes = PAGES.filter((p) => fs.existsSync(path.join(docs, `${p}.md`)));
  const pages = new Set(presentes);
  const cat = catalogue(docs);
  const aCopier = new Set();
  const sommaire = [];
  let sections = [];
  for (const nom of presentes) {
    const md = preparerMarkdown(fs.readFileSync(path.join(docs, `${nom}.md`), "utf8"), nom === "marketplace" ? cat : null);
    const page = convertir(nom, md, pages, aCopier, gabarit);
    fs.writeFileSync(path.join(sortie, "doc", `${nom}.html`), page.html);
    sommaire.push(`<li><a class="carte-lien" href="${nom}.html">${echapper(page.titre)}</a></li>`);
    sections = sections.concat(page.sections);
  }
  for (const f of aCopier) {
    const source = path.join(docs, f);
    if (!fs.existsSync(source)) throw new Error(`Image introuvable dans la documentation : ${f}`);
    fs.copyFileSync(source, path.join(sortie, "doc", f));
  }

  const accueil = `<h1 data-t="doc.titre">Documentation</h1>
<p data-t="doc.intro">Lisible même sans réseau : elle reste sur votre téléphone.</p>
<form class="recherche" role="search" id="recherche">
<label for="recherche-texte" data-t="doc.chercher">Chercher dans la documentation</label>
<input id="recherche-texte" type="search" autocomplete="off" enterkeyhint="search">
</form>
<p id="recherche-etat" role="status" aria-live="polite"></p>
<ol id="recherche-resultats" class="resultats"></ol>
<h2 data-t="doc.pages">Pages</h2>
<ul class="sommaire">
${sommaire.join("\n")}
</ul>`;
  fs.writeFileSync(path.join(sortie, "doc", "index.html"), gabarit({ titre: "Documentation", corps: accueil, recherche: true }));
  fs.writeFileSync(path.join(sortie, "doc", "recherche.json"), JSON.stringify(sections));

  const fichiers = [];
  const parcourir = (dossier) => {
    for (const e of fs.readdirSync(path.join(sortie, dossier), { withFileTypes: true })) {
      const rel = dossier ? `${dossier}/${e.name}` : e.name;
      if (e.isDirectory()) parcourir(rel);
      else if (!["CNAME", "sw.js", "version.json"].includes(rel)) fichiers.push(rel);
    }
  };
  parcourir("");
  fichiers.sort();
  const version = {
    build: empreinte(fichiers, sortie),
    version: o.version,
    commit: o.commit,
    date: o.date,
    app_commit: o["app-commit"] || "",
    app_date: o["app-date"] || "",
    fichiers: ["./", ...fichiers],
  };
  fs.writeFileSync(path.join(sortie, "version.json"), `${JSON.stringify(version, null, 2)}\n`);
  console.log(`Site construit dans ${sortie} : ${presentes.length} pages, ${fichiers.length} fichiers, build ${version.build}.`);
}

main();
