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

// Service worker (spécification 3) : garde tout le site sur le téléphone et le
// sert sans réseau. À chaque ouverture avec réseau, lit version.json ; si le
// site a changé (empreinte « build »), il télécharge la nouvelle version dans
// un cache neuf, en arrière-plan, puis la met à la place de l'ancienne. Une
// mise à jour qui échoue en route est abandonnée : l'ancienne version reste.

const PREFIXE = "pi-appliance-site-";
let enCours = null;

async function versionGardee() {
  const r = await caches.match("version.json");
  return r ? r.json() : null;
}

async function mettreAJour() {
  const r = await fetch("version.json", { cache: "no-store" });
  if (!r.ok) throw new Error(`version.json : HTTP ${r.status}`);
  const nouvelle = await r.clone().json();
  const gardee = await versionGardee();
  if (gardee && gardee.build === nouvelle.build) return false;

  const nom = PREFIXE + nouvelle.build;
  await caches.delete(nom); // reste d'un essai interrompu
  const cache = await caches.open(nom);
  try {
    for (const f of nouvelle.fichiers) {
      const reponse = await fetch(new Request(f, { cache: "no-cache" }));
      if (!reponse.ok) throw new Error(`${f} : HTTP ${reponse.status}`);
      await cache.put(f, reponse);
    }
    await cache.put("version.json", r);
  } catch (e) {
    await caches.delete(nom);
    throw e;
  }
  for (const autre of await caches.keys()) {
    if (autre.startsWith(PREFIXE) && autre !== nom) await caches.delete(autre);
  }
  const fenetres = await self.clients.matchAll({ type: "window" });
  for (const f of fenetres) f.postMessage({ type: "version", version: nouvelle });
  return true;
}

function verifier() {
  if (!enCours) {
    enCours = mettreAJour()
      .catch((e) => console.warn("Mise à jour de la documentation impossible :", e))
      .finally(() => { enCours = null; });
  }
  return enCours;
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(verifier());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data === "verifier") event.waitUntil(verifier());
});

self.addEventListener("fetch", (event) => {
  const requete = event.request;
  if (requete.method !== "GET" || new URL(requete.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const gardee = await caches.match(requete, { ignoreSearch: true });
    if (gardee) return gardee;
    try {
      return await fetch(requete);
    } catch (e) {
      if (requete.mode === "navigate") {
        const accueil = await caches.match("./");
        if (accueil) return accueil;
      }
      throw e;
    }
  })());
});
