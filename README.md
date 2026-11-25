# pi-appliance — application mobile

Application web installable (PWA) qui accompagne [pi-appliance](https://github.com/gmoulard/pi-appliance), le projet qui transforme un Raspberry Pi en appliance à la maison. Sur le téléphone, elle donne :

- **la documentation dans la poche**, lisible même sans réseau : premier démarrage, Wi-Fi de configuration, mot de passe oublié, diagnostic ;
- **« Mes Pi »** : la liste de ses Raspberry Pi, chacun avec un bouton qui ouvre sa console, à la maison ou sur internet. Un Pi s'ajoute en scannant le code QR de sa console, à la main, ou par une recherche à la maison parmi les noms connus.

Aucun compte, aucun traceur : ce qui est saisi reste sur le téléphone.

pi-appliance a trois parties, qui portent toutes ce nom : **l'image** à flasher sur la carte SD, **le socle** toujours installé sur le Pi (sa **console** web, ses outils et la commande **`pia`**), et **cette application mobile**.

Projet en cours : la documentation hors ligne est construite, « Mes Pi » en partie (le code QR attend pi-appliance). Voir la [spécification](docs/specification.md) et le [TODO](TODO.md). Adresse : `https://app.pi-appliance.com` (GitHub Pages), dès que son entrée DNS et le réglage de GitHub Pages sont faits ([mise en production](docs/mise-en-production.md)) ; en attendant, adresse provisoire `https://gmoulard.github.io/pi-appliance-pwa/`, qui renverra ensuite vers la nouvelle.

## Pour contribuer

HTML, CSS et JavaScript sans framework ni étape de construction pour l'application ; seule la documentation est convertie, par le workflow « Site ».

| Chemin | Rôle |
|--------|------|
| `index.html`, `app.css`, `app.js`, `textes.js` | Accueil, styles (charte de pi-appliance), code commun, textes de l'interface |
| `cle.js` | Clé du téléphone : appairage à un Pi et connexion sans mot de passe |
| `lecteur.js`, `vendor/jsqr/` | Lecteur de code QR (jsQR 1.4.0, licence Apache 2.0) |
| `mespi.js` | « Mes Pi » : liste des Pi, ajout, recherche à la maison, état, ouverture |
| `recherche.js` | Recherche dans la documentation, sans réseau |
| `sw.js` | *Service worker* : site gardé sur le téléphone, mise à jour en silence |
| `manifest.webmanifest`, `icones/` | Application installable et ses icônes |
| `outils/site.mjs` | Construction du site : documentation de pi-appliance convertie, index de recherche, `version.json` |
| `outils/essai.cjs`, `outils/essai-qr-*.png` | Essais dans Chromium sans tête (fausse caméra, faux Pi) |
| `outils/pia-update` | À lancer sur le Pi en SSH : installe la dernière version de pi-appliance (`curl -fsSLO https://raw.githubusercontent.com/gmoulard/pi-appliance-pwa/main/outils/pia-update && sudo sh pia-update [version]` ; sans version, la dernière ; `-l` : liste des versions) |
| `outils/production.cjs` | Vérification du site en ligne : certificat, page, manifeste, *service worker*, icônes, renvoi de l'ancienne adresse (`node outils/production.cjs`) |
| `CNAME`, `docs/dns-app.json`, `docs/mise-en-production.md` | Domaine `app.pi-appliance.com` : nom pour GitHub Pages, entrée DNS de Route 53, étapes à faire à la main |
| `outils/icones.cjs` | Icônes PNG dessinées à partir de `icones/icone.svg` |
| `.github/workflows/site.yml` | Construction, essais, publication sur GitHub Pages et vérification du site en ligne |

Construire et essayer le site (Node 22 ; Playwright pour les essais) :

```
git clone --depth 1 --branch v0.2.1 https://github.com/gmoulard/pi-appliance.git ../pi-appliance
npm ci --prefix outils
node outils/site.mjs --docs ../pi-appliance/docs --version v0.2.1 \
  --commit $(git -C ../pi-appliance rev-parse HEAD) --date $(git -C ../pi-appliance log -1 --format=%cs) --out _site
node outils/essai.cjs _site
```

Après un clone, récupérer les skills partagés :

```
git submodule update --init
```

Les conventions (français, langage courant, en-tête de licence dans chaque fichier de code) sont dans [CLAUDE.md](CLAUDE.md).

## Licence

GNU Affero General Public License, version 3 (AGPL-3.0) : voir [LICENSE](LICENSE).
