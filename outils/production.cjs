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

// Vérification du site en ligne (TODO-1.7) : certificat, page, manifeste,
// service worker, icônes, version publiée, renvoi de http vers https et de
// l'ancienne adresse github.io vers la nouvelle.
//
//   node outils/production.cjs [--site https://app.pi-appliance.com/]
//     [--ancienne https://gmoulard.github.io/pi-appliance-pwa/ | --ancienne -]
//     [--app-commit <sha attendu dans version.json>] [--attente <secondes>]
//
// --ancienne - : pas de contrôle du renvoi (site local). Avec --app-commit, la
// version publiée est relue jusqu'à --attente secondes (300 par défaut) : GitHub
// Pages met parfois une minute à servir le nouveau site. Le service worker est
// essayé dans Chromium si Playwright est installé, sauté sinon.

const tls = require("node:tls");

let echecs = 0;
function verifier(condition, message) {
  console.log(`${condition ? "ok  " : "ÉCHEC"} ${message}`);
  if (!condition) echecs++;
  return condition;
}

function options() {
  const o = { site: "https://app.pi-appliance.com/", ancienne: "https://gmoulard.github.io/pi-appliance-pwa/", attente: "300" };
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i += 2) {
    if (!a[i].startsWith("--") || a[i + 1] === undefined) throw new Error(`Option incomplète : ${a[i]}`);
    o[a[i].slice(2)] = a[i + 1];
  }
  if (!o.site.endsWith("/")) o.site += "/";
  return o;
}

function certificat(hote) {
  return new Promise((resolve) => {
    const s = tls.connect({ host: hote, port: 443, servername: hote, timeout: 15000 }, () => {
      const c = s.getPeerCertificate();
      resolve({ valable: s.authorized, erreur: s.authorizationError, fin: new Date(c.valid_to), noms: c.subjectaltname || "" });
      s.end();
    });
    s.on("timeout", () => { s.destroy(); resolve({ valable: false, erreur: "délai dépassé" }); });
    s.on("error", (e) => resolve({ valable: false, erreur: e.message }));
  });
}

async function lire(adresse, init) {
  try {
    return await fetch(adresse, { cache: "no-store", signal: AbortSignal.timeout(15000), ...init });
  } catch (e) {
    return { ok: false, status: 0, erreur: e.cause ? e.cause.message || e.cause.code : e.message, headers: new Headers() };
  }
}

function etat(r) {
  return r.status ? `HTTP ${r.status}` : r.erreur;
}

async function fichier(adresse, types, nom) {
  const r = await lire(adresse);
  const type = r.headers.get("content-type") || "";
  verifier(r.ok && types.some((t) => type.startsWith(t)), `${nom} : ${etat(r)}${type ? `, ${type}` : ""}`);
  return r.ok ? r : null;
}

async function serviceWorker(site) {
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch (e) {
    console.log("—    service worker dans Chromium : sauté (Playwright absent)");
    return;
  }
  const navigateur = await chromium.launch();
  try {
    const page = await navigateur.newPage();
    const erreurs = [];
    page.on("pageerror", (e) => erreurs.push(e.message));
    try {
      await page.goto(site);
    } catch (e) {
      verifier(false, `service worker dans Chromium : page injoignable (${e.message.split("\n")[0]})`);
      return;
    }
    const garde = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      const fin = Date.now() + 30000;
      while (Date.now() < fin) {
        if (await caches.match("version.json")) return { scope: reg.scope, garde: true };
        await new Promise((r) => setTimeout(r, 300));
      }
      return { scope: reg.scope, garde: false };
    });
    verifier(garde.scope === site, `service worker installé, portée ${garde.scope}`);
    verifier(garde.garde, "site gardé sur le téléphone (version.json en cache)");
    verifier(erreurs.length === 0, `aucune erreur JavaScript${erreurs.length ? ` : ${erreurs.join(" ; ")}` : ""}`);
  } finally {
    await navigateur.close();
  }
}

(async () => {
  const o = options();
  const site = new URL(o.site);
  console.log(`Vérification de ${site.href}`);

  if (site.protocol === "https:") {
    const c = await certificat(site.hostname);
    const jours = c.fin ? Math.floor((c.fin - Date.now()) / 86400000) : 0;
    verifier(c.valable, `certificat valable pour ${site.hostname}${c.valable ? `, ${jours} jours restants (${c.noms})` : ` : ${c.erreur}`}`);
    if (c.valable) verifier(jours >= 14, `certificat renouvelé à temps (${jours} jours restants)`);
    const http = await lire(`http://${site.host}${site.pathname}`, { redirect: "manual" });
    const vers = http.headers.get("location") || "";
    verifier([301, 308].includes(http.status) && vers.startsWith(site.href), `http renvoie vers https : ${etat(http)}${vers ? ` → ${vers}` : ""}`);
  }

  const page = await fichier(site.href, ["text/html"], "page d'accueil");
  if (page) {
    const html = await page.text();
    verifier(html.includes('rel="manifest"') && html.includes("app.js"), "page d'accueil de l'application (manifeste et app.js)");
  }

  const r = await fichier(new URL("manifest.webmanifest", site).href, ["application/manifest+json", "application/json"], "manifeste");
  if (r) {
    let m = null;
    try { m = JSON.parse(await r.text()); } catch (e) { verifier(false, `manifeste lisible : ${e.message}`); }
    if (m) {
      const debut = new URL(m.start_url, r.url).href;
      const portee = new URL(m.scope, r.url).href;
      const id = new URL(m.id, debut).href;
      verifier(m.name === "pi-appliance" && m.display === "standalone", `manifeste : nom « ${m.name} », affichage ${m.display}`);
      verifier(debut === site.href && portee === site.href && id === site.href, `manifeste : départ ${debut}, portée ${portee}, identifiant ${id}`);
      for (const icone of m.icons || []) {
        await fichier(new URL(icone.src, r.url).href, [icone.type], `icône ${icone.src} (${icone.sizes}, ${icone.purpose})`);
      }
      verifier((m.icons || []).some((i) => i.sizes === "512x512" && i.purpose === "maskable"), "icône 512×512 « maskable » (Android)");
    }
  }
  await fichier(new URL("icones/apple-touch-icon.png", site).href, ["image/png"], "icône de l'iPhone");
  await fichier(new URL("sw.js", site).href, ["text/javascript", "application/javascript"], "service worker (sw.js)");

  const attendu = o["app-commit"] || "";
  const fin = Date.now() + Number(o.attente) * 1000;
  let version = null;
  for (;;) {
    const v = await lire(new URL("version.json", site).href);
    version = v.ok ? await v.json().catch(() => null) : null;
    if (!attendu || (version && version.app_commit === attendu) || Date.now() > fin) break;
    await new Promise((res) => setTimeout(res, 15000));
  }
  if (verifier(!!version && /^v\d+\.\d+\.\d+$/.test(version.version) && Array.isArray(version.fichiers), `version publiée : ${version ? `documentation ${version.version}, application ${(version.app_commit || "?").slice(0, 7)}, build ${version.build}` : "illisible"}`)) {
    if (attendu) verifier(version.app_commit === attendu, `commit de l'application attendu : ${attendu.slice(0, 7)}`);
  }

  if (o.ancienne !== "-") {
    const ancienne = await lire(o.ancienne, { redirect: "manual" });
    const vers = ancienne.headers.get("location") || "";
    verifier([301, 302, 307, 308].includes(ancienne.status) && vers.startsWith(site.href), `ancienne adresse ${o.ancienne} renvoie vers la nouvelle : ${etat(ancienne)}${vers ? ` → ${vers}` : ""}`);
  }

  await serviceWorker(site.href);

  console.log(echecs ? `${echecs} vérification(s) en échec.` : "Le site en ligne est en ordre.");
  process.exit(echecs ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
