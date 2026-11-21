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

// Essai du site construit, dans Chromium sans tête (Playwright) :
//   node outils/essai.cjs <dossier du site construit> [dossier des captures]
// Vérifie : service worker installé et site gardé, lecture et recherche sans
// réseau, mise à jour en silence quand version.json change.

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml", ".png": "image/png",
};

function serveur(racine) {
  return http.createServer((req, res) => {
    let chemin = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (chemin.endsWith("/")) chemin += "index.html";
    const fichier = path.join(racine, chemin);
    if (!fichier.startsWith(racine) || !fs.existsSync(fichier)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream" });
    res.end(fs.readFileSync(fichier));
  });
}

// page.waitForFunction n'attend pas une fonction asynchrone (la promesse rendue
// compte comme vraie) : on interroge la page jusqu'à la réponse attendue.
async function attendre(page, fonction, delai = 15000) {
  const fin = Date.now() + delai;
  while (Date.now() < fin) {
    if (await page.evaluate(fonction)) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Délai dépassé : ${fonction}`);
}

let echecs = 0;
function verifier(condition, message) {
  console.log(`${condition ? "ok  " : "ÉCHEC"} ${message}`);
  if (!condition) echecs++;
}

(async () => {
  const site = path.resolve(process.argv[2] || "_site");
  const captures = process.argv[3];
  const srv = serveur(site).listen(0);
  const adresse = `http://localhost:${srv.address().port}/`;
  const navigateur = await chromium.launch();
  const contexte = await navigateur.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await contexte.newPage();
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));

  try {
    await page.goto(adresse);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await attendre(page, async () => !!(await caches.match("version.json")));
    const version = JSON.parse(fs.readFileSync(path.join(site, "version.json"), "utf8"));
    const gardes = await page.evaluate(async (fichiers) => {
      const manquants = [];
      for (const f of fichiers) if (!(await caches.match(f))) manquants.push(f);
      return manquants;
    }, version.fichiers);
    verifier(gardes.length === 0, `site gardé sur le téléphone (${version.fichiers.length} fichiers)${gardes.length ? ` — manquent : ${gardes.join(", ")}` : ""}`);
    await page.reload();
    await page.waitForFunction(() => document.getElementById("version-doc").textContent.includes("Documentation de pi-appliance"));
    verifier(true, `version affichée : ${await page.textContent("#version-doc")}`);
    if (captures) await page.screenshot({ path: path.join(captures, "accueil.png") });

    await contexte.setOffline(true);
    await page.goto(`${adresse}doc/guide-utilisateur.html#fichier-reset`);
    verifier((await page.textContent("h1")).length > 0, "page du guide lue sans réseau");
    await page.goto(`${adresse}doc/index.html`);
    await page.fill("#recherche-texte", "mot de passe oublie");
    await page.waitForFunction(() => document.querySelectorAll("#recherche-resultats li").length > 0, null, { timeout: 5000 });
    const premier = await page.textContent("#recherche-resultats li strong");
    verifier(/mot de passe/i.test(premier), `recherche sans réseau, sans accents : « ${premier} »`);
    if (captures) await page.screenshot({ path: path.join(captures, "recherche.png") });
    await page.goto(`${adresse}doc/marketplace.html`);
    verifier((await page.locator(".carte-app").count()) > 0, "catalogue de la marketplace lisible sans réseau");
    await page.goto(`${adresse}page-inconnue.html`);
    verifier((await page.locator("#vue-accueil").count()) === 1, "page inconnue sans réseau : l'accueil s'affiche");
    await contexte.setOffline(false);

    // Mes Pi (spécification 4) : saisie à la main, ordre, lien #add, suppression.
    await page.goto(adresse);
    const cas = await page.evaluate(() => [
      window.mesPi.normaliser("controltower", "").pi,
      window.mesPi.normaliser("https://Salon.local/pi-appliance/", "salon.pi-appliance.com").pi,
      window.mesPi.normaliser("192.168.1.196", "").pi,
      window.mesPi.normaliser("pas un nom !", "").erreur,
      window.mesPi.normaliser("controltower", "controltower.local").erreur,
    ]);
    verifier(cas[0].maison === "https://controltower.local/pi-appliance" && cas[0].nom === "controltower", "nom seul complété en .local/pi-appliance");
    verifier(cas[1].maison === "https://salon.local/pi-appliance" && cas[1].internet === "https://salon.pi-appliance.com/pi-appliance", "adresse complète et adresse sur internet");
    verifier(cas[2].maison === "https://192.168.1.196/pi-appliance" && cas[2].nom === "192.168.1.196", "adresse IP acceptée");
    verifier(cas[3] && cas[4], "saisies invalides refusées");
    verifier(await page.isVisible("#vue-accueil"), "liste vide : l'accueil s'affiche");
    page.on("dialog", (d) => d.accept());
    for (const [maison, internet] of [["controltower", "controltower.pi-appliance.com"], ["192.168.1.196", ""]]) {
      await page.goto(`${adresse}#ajouter`);
      await page.fill("#ajouter-maison", maison);
      await page.fill("#ajouter-internet", internet);
      await page.click("#form-ajouter button[type=submit]");
      await page.waitForSelector("#vue-mespi:not([hidden])");
    }
    let noms = await page.$$eval("#liste-pi h2", (h) => h.map((e) => e.firstChild.textContent));
    verifier(noms.join(",") === "192.168.1.196,controltower", `liste par ordre alphabétique : ${noms.join(", ")}`);
    const lien = await page.getAttribute("#liste-pi li:nth-child(2) a.bouton", "href");
    verifier(lien === "https://controltower.local/pi-appliance/", `internet ne répond pas : le bouton ouvre la maison (${lien})`);
    await page.goto(`${adresse}#add?n=salon&l=https%3A%2F%2Fsalon.local%2Fpi-appliance&id=0123456789abcdef`);
    await page.waitForSelector("#vue-lien:not([hidden])");
    await page.click("#lien-ajouter");
    await page.goto(`${adresse}#add?n=cuisine&l=https%3A%2F%2Fcuisine.local%2Fpi-appliance&id=0123456789abcdef`);
    await page.click("#lien-ajouter");
    await page.waitForSelector("#vue-mespi:not([hidden])");
    noms = await page.$$eval("#liste-pi h2", (h) => h.map((e) => e.firstChild.textContent));
    verifier(noms.join(",") === "192.168.1.196,controltower,cuisine", `lien #add, puis Pi renommé reconnu par son identifiant : ${noms.join(", ")}`);
    // Appairage et connexion sans mot de passe (spécification 4.4) : un faux Pi
    // reçoit les formulaires ; la signature est vérifiée ici avec Node.
    const recus = [];
    await contexte.route("https://grenier.local/**", async (route) => {
      const r = route.request();
      if (r.method() === "POST") recus.push({ url: r.url(), champs: Object.fromEntries(new URLSearchParams(r.postData() || "")) });
      await route.fulfill({ status: 200, contentType: "text/html", body: "<p>faux Pi</p>" });
    });
    const code = "AbCdEfGhIjKlMnOpQrStUv";
    await page.goto(`${adresse}#add?n=grenier&l=https%3A%2F%2Fgrenier.local%2Fpi-appliance&id=fedcba9876543210&c=${code}`);
    await page.waitForSelector("#vue-lien:not([hidden])");
    verifier((await page.textContent("#lien-ajouter")) === "Ajouter et appairer", "lien avec code d'appairage : « Ajouter et appairer »");
    await page.click("#lien-ajouter");
    const attendreRecu = async (fin) => { for (let i = 0; i < 50 && !recus.some((x) => x.url.endsWith(fin)); i++) await new Promise((r) => setTimeout(r, 100)); return recus.find((x) => x.url.endsWith(fin)); };
    const appairage = await attendreRecu("/pi-appliance/appareil/appairer");
    const { webcrypto } = require("node:crypto");
    const verifierSignature = async (jwk, message, signature) => {
      const cle = await webcrypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
      return webcrypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, cle, Buffer.from(signature, "base64url"), new TextEncoder().encode(message));
    };
    let jwk = null;
    if (appairage) {
      const c = appairage.champs;
      jwk = JSON.parse(c.cle);
      verifier(c.code === code && c.message === `appairer|fedcba9876543210|${code}` && c.appareil.length > 0 && !jwk.d,
        "appairage envoyé au Pi : code, message, nom d'appareil, clé publique seule");
      verifier(await verifierSignature(jwk, c.message, c.signature), "signature de l'appairage valable (vérifiée par Node)");
    } else {
      verifier(false, "appairage envoyé au Pi");
    }
    const nonExportable = await page.evaluate(async () => {
      const c = await window.cleTelephone.lireCle();
      try { await crypto.subtle.exportKey("jwk", c.privee); return false; } catch (e) { return true; }
    });
    verifier(nonExportable, "clé secrète du téléphone non exportable");
    await page.goto(adresse);
    const fiche = page.locator("#liste-pi li", { hasText: "grenier" });
    verifier((await fiche.locator(".badge").count()) === 1, "Pi marqué « appairé » dans la liste");
    await fiche.locator("a.bouton").click();
    const connexion = await attendreRecu("/pi-appliance/appareil/connexion");
    if (connexion && jwk) {
      const c = connexion.champs;
      const parties = c.message.split("|");
      const canon = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y });
      const attendue = require("node:crypto").createHash("sha256").update(canon).digest("base64url");
      verifier(parties[0] === "connexion" && parties[1] === "fedcba9876543210" && Math.abs(Number(parties[2]) - Date.now() / 1000) < 60 && /^[A-Za-z0-9_-]{22}$/.test(parties[3]),
        `message de connexion : ${parties.slice(0, 3).join(" / ")} / numéro`);
      verifier(c.cle === attendue, "empreinte de la clé conforme à la RFC 7638");
      verifier(await verifierSignature(jwk, c.message, c.signature), "signature de la connexion valable (vérifiée par Node)");
    } else {
      verifier(false, "connexion signée envoyée au Pi");
    }
    for (const autre of contexte.pages()) if (autre !== page) await autre.close();

    await contexte.setOffline(true);
    await page.reload();
    verifier((await page.locator("#liste-pi li").count()) === 4, "liste gardée et affichée sans réseau");
    await contexte.setOffline(false);
    await page.click("#liste-pi li:nth-child(1) button");
    await page.waitForTimeout(300);
    noms = await page.$$eval("#liste-pi h2", (h) => h.map((e) => e.firstChild.textContent));
    verifier(noms.join(",") === "controltower,cuisine,grenier", `suppression d'un Pi : ${noms.join(", ")}`);
    if (captures) {
      await page.waitForFunction(() => !document.body.textContent.includes("Vérification…"), null, { timeout: 15000 });
      await page.screenshot({ path: path.join(captures, "mespi.png") });
      await page.goto(`${adresse}#chercher`);
      await page.screenshot({ path: path.join(captures, "chercher.png") });
    }

    // Mise à jour en silence : nouvelle empreinte, nouveau contenu.
    const avant = await page.evaluate(() => caches.keys());
    const sauvegarde = { version: fs.readFileSync(path.join(site, "version.json")), css: fs.readFileSync(path.join(site, "app.css")) };
    fs.appendFileSync(path.join(site, "app.css"), "\n/* essai de mise à jour */\n");
    fs.writeFileSync(path.join(site, "version.json"), JSON.stringify({ ...version, build: "essai-mise-a-jour" }));
    await page.goto(adresse);
    await attendre(page, async () => { const k = await caches.keys(); return k.length === 1 && k[0].endsWith("essai-mise-a-jour"); });
    const apres = await page.evaluate(() => caches.keys());
    const css = await page.evaluate(async () => (await (await caches.match("app.css")).text()).includes("essai de mise à jour"));
    verifier(apres.length === 1 && !avant.includes(apres[0]) && css, `mise à jour prise en arrière-plan, ancien cache retiré (${avant} → ${apres})`);
    fs.writeFileSync(path.join(site, "version.json"), sauvegarde.version);
    fs.writeFileSync(path.join(site, "app.css"), sauvegarde.css);

    if (captures) {
      await page.goto(`${adresse}doc/guide-utilisateur.html`);
      await page.screenshot({ path: path.join(captures, "guide.png") });
    }
    verifier(erreurs.length === 0, `aucune erreur JavaScript${erreurs.length ? ` : ${erreurs.join(" | ")}` : ""}`);
  } finally {
    await navigateur.close();
    srv.close();
  }
  console.log(echecs ? `${echecs} échec(s).` : "Tous les essais sont passés.");
  process.exit(echecs ? 1 : 0);
})();
