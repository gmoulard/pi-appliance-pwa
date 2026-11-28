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

// Clé du téléphone (spécification 4.4, docs/demande-pi-appliance.md section 4) :
// une paire de clés ECDSA P-256 créée par le navigateur, la clé secrète non
// exportable, gardée dans IndexedDB. Elle sert à appairer le téléphone à un Pi
// puis à ouvrir sa console sans mot de passe, par un formulaire envoyé au Pi
// dans un nouvel onglet : l'application ne lit aucune réponse du Pi.
// Dans l'application iPhone (window.piApplianceIos), le formulaire est envoyé
// par l'application elle-même (ios/PiAppliance/Console.swift), qui ouvre la
// console dans son propre écran (question 43) ; la clé reste celle de la page,
// non exportable, dans la WKWebView.

(function () {
  "use strict";

  const BASE = "pi-appliance";
  const MAGASIN = "cles";
  const NOM = "appareil";
  const ALGO = { name: "ECDSA", namedCurve: "P-256" };
  const SIGNATURE = { name: "ECDSA", hash: "SHA-256" };

  function ouvrirBase() {
    return new Promise((resolve, reject) => {
      const r = indexedDB.open(BASE, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(MAGASIN);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }

  async function operation(mode, action) {
    const base = await ouvrirBase();
    try {
      return await new Promise((resolve, reject) => {
        const tx = base.transaction(MAGASIN, mode);
        const r = action(tx.objectStore(MAGASIN));
        tx.oncomplete = () => resolve(r && r.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } finally {
      base.close();
    }
  }

  function base64url(octets) {
    let s = "";
    for (const o of new Uint8Array(octets)) s += String.fromCharCode(o);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  // Empreinte RFC 7638 : SHA-256 des membres obligatoires, dans l'ordre.
  async function empreinte(jwk) {
    const canon = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y });
    return base64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canon)));
  }

  async function lireCle() {
    return operation("readonly", (m) => m.get(NOM));
  }

  // La clé du téléphone, créée au premier appairage.
  async function cle() {
    const existante = await lireCle();
    if (existante && existante.privee) return existante;
    const paire = await crypto.subtle.generateKey(ALGO, false, ["sign", "verify"]);
    const brute = await crypto.subtle.exportKey("jwk", paire.publicKey);
    const publique = { kty: "EC", crv: "P-256", x: brute.x, y: brute.y };
    const nouvelle = { privee: paire.privateKey, publique, empreinte: await empreinte(publique), creee: new Date().toISOString() };
    await operation("readwrite", (m) => m.put(nouvelle, NOM));
    return nouvelle;
  }

  async function signer(cleTelephone, message) {
    return base64url(await crypto.subtle.sign(SIGNATURE, cleTelephone.privee, new TextEncoder().encode(message)));
  }

  function aleatoire(n) {
    return base64url(crypto.getRandomValues(new Uint8Array(n)));
  }

  function nomAppareil() {
    const ua = navigator.userAgent || "";
    if (/iPhone/.test(ua)) return "iPhone";
    if (/iPad/.test(ua)) return "iPad";
    if (/Android/.test(ua)) return window.t(/Mobile/.test(ua) ? "appareil.telephone" : "appareil.tablette");
    return window.t("appareil.navigateur");
  }

  // Envoie un formulaire au Pi dans un nouvel onglet (rien dans l'adresse).
  // NE PAS mettre de retour à la ligne dans un champ signé : le navigateur les
  // change en \r\n à l'envoi, et la signature ne correspondrait plus.
  // Sur iPhone : la console s'ouvre dans l'application, qui envoie le
  // formulaire ; repli : adresse ouverte si le Pi ne répond pas. Rend
  // { ok, erreur? } (ok faux : rien n'est arrivé au Pi).
  function envoyer(action, champs, repli) {
    if (window.piApplianceIos) return window.piApplianceIos.console(action, { champs, repli });
    const form = document.createElement("form");
    form.method = "post";
    form.action = action;
    form.target = "_blank";
    form.setAttribute("rel", "noopener");
    form.hidden = true;
    for (const [nom, valeur] of Object.entries(champs)) {
      const champ = document.createElement("input");
      champ.type = "hidden";
      champ.name = nom;
      champ.value = valeur;
      form.append(champ);
    }
    document.body.append(form);
    form.submit();
    form.remove();
    return Promise.resolve({ ok: true });
  }

  // Appairage (demande, 4.3) : base = adresse de la console, sans « / » final.
  async function appairer(base, idPi, code) {
    const c = await cle();
    const message = `appairer|${idPi}|${code}`;
    const r = await envoyer(`${base}/appareil/appairer`, {
      code,
      cle: JSON.stringify(c.publique),
      appareil: nomAppareil(),
      message,
      signature: await signer(c, message),
    });
    if (r && r.ok === false) throw new Error(`appairage : ${r.erreur || "échec"}`);
  }

  // Connexion (demande, 4.4).
  async function connecter(base, idPi) {
    const c = await lireCle();
    if (!c || !c.privee) return false;
    const message = `connexion|${idPi}|${Math.floor(Date.now() / 1000)}|${aleatoire(16)}`;
    await envoyer(`${base}/appareil/connexion`, { cle: c.empreinte, message, signature: await signer(c, message) }, `${base}/`);
    return true;
  }

  // Rupture de l'appairage depuis l'application (demande, 4.7) : le Pi oublie
  // la clé de ce téléphone. Sur iPhone, envoyé par l'application sans ouvrir
  // la console ; la promesse se résout une fois la réponse du Pi reçue.
  async function retirer(base, idPi) {
    const c = await lireCle();
    if (!c || !c.privee) return false;
    const message = `retirer|${idPi}|${Math.floor(Date.now() / 1000)}|${aleatoire(16)}`;
    const champs = { cle: c.empreinte, message, signature: await signer(c, message) };
    if (window.piApplianceIos) {
      const r = await window.piApplianceIos.envoyerFormulaire(`${base}/appareil/retirer`, champs);
      return !!(r && r.ok);
    }
    envoyer(`${base}/appareil/retirer`, champs);
    return true;
  }

  // Aussi dans l'application iPhone (question 43) : la console s'y ouvre dans
  // l'application, qui lui envoie le formulaire.
  const disponible = !!(window.crypto && crypto.subtle && window.indexedDB);

  window.cleTelephone = { disponible, cle, lireCle, appairer, connecter, retirer, empreinte, signer };
})();
