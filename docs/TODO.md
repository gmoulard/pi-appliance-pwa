# TODO

Avancement de l'application mobile pi-appliance ([spécification](specification.md)). Une action réalisée est cochée avec la date ou la version.

## 1. Mise en place

- [x] Dépôt `gmoulard/pi-appliance-pwa` créé (2026-11-21) ; spécification écrite.
- [x] Licence AGPL-3.0 (`LICENSE`), `README.md`, `CLAUDE.md` avec les paramètres des skills partagés (2026-11-21).
- [x] Questions de spécification posées et tranchées, précisions 31 à 37 comprises (2026-11-21).
- [ ] Sous-module `.claude/skills/` (https://github.com/gmoulard/claude_skills, au même commit que pi-appliance) : à ajouter par l'utilisateur, l'agent n'y a pas été autorisé.
- [x] Branche `main` créée, publiée par GitHub Pages (source « GitHub Actions ») ; premier site publié par le workflow « Site » le 2026-11-21, à l'adresse provisoire `https://gmoulard.github.io/pi-appliance-pwa/`.
- [ ] Nom `app.pi-appliance.com` dans Route 53 (`CNAME` vers `gmoulard.github.io`), GitHub Pages avec HTTPS (2).

## 2. Documentation hors ligne (3) — en premier

- [x] Workflow « Site » qui récupère `docs/` de pi-appliance à la dernière étiquette, convertit le Markdown en HTML (`outils/site.mjs` : pages reprises, liens « en ligne », catalogue de la marketplace écrit dans la page) et publie le site, chaque jour, à chaque changement de `main` et à la demande (2026-11-21). Premier passage réussi le 2026-11-21 (construction, essais, publication).
- [x] *Service worker* : pages et images gardées pour le hors ligne, mise à jour en silence, version, commit et date en bas de page (2026-11-21).
- [x] Recherche sans réseau (2026-11-21).
- [x] Manifeste, icônes (maison blanche sur fond framboise), aide à l'installation dans le menu (5) (2026-11-21).
- [x] Essais dans Chromium sans tête : `node outils/essai.cjs <site>` (site gardé, lecture et recherche sans réseau, mise à jour en silence), aussi lancés par le workflow (2026-11-21).
- [ ] À essayer sur l'Android : installation, lecture en mode avion, mise à jour après une nouvelle version de pi-appliance.

## 3. Mes Pi (4)

- [x] Liste gardée sur le téléphone, par ordre alphabétique, suppression ; ajout à la main (nom ou adresse IP) ; ouverture par un seul bouton dans le navigateur (2026-11-21, `mespi.js`).
- [x] Ajout par code QR, lu par l'application (`lecteur.js`, jsQR dans `vendor/jsqr/`) ou par l'appareil photo sur Android ; lien `#add?...` avec services `s` ; identifiant stable (2026-11-21, essayé dans Chromium avec une fausse caméra). À essayer sur l'Android avec le code de la console.
- [x] Recherche à la maison parmi les noms connus, avec ses limites dites à l'écran (2026-11-21). À essayer à la maison avec un vrai Pi.
- [ ] État toujours affiché, et services relus dans `api/hello`. Fait le 2026-11-21 : état deviné sans `api/hello`, vérification à la maison après un geste (autorisation de Chrome), lecture de `api/hello` selon le format de la demande. Restent : format définitif de pi-appliance, essai avec un vrai Pi.
- [x] Côté pi-appliance : [demande](demande-pi-appliance.md) réalisée par une session de pi-appliance sur sa branche `claude/application-mobile` (2026-11-21) : code QR et lien dans « Mon Pi », `api/hello`, appairage, connexion, retrait, « Mon compte → Appareils ». Versée dans `master` et sortie dans la version **v0.1.5** de pi-appliance (2026-11-21, image en construction par le workflow « Image »). Reste à l'essayer sur un vrai Pi.

- [ ] Appairage (4.4) : clé du téléphone (WebCrypto, non exportable, IndexedDB), appairage au lien `#add?...&c=…`, connexion signée à « Ouvrir ». Côté application fait le 2026-11-21 (`cle.js`, essayé dans Chromium avec un faux Pi, signatures vérifiées par Node). Côté pi-appliance : demande, section 4, confiée à sa session. Reste l'essai avec un vrai Pi.

## 4. Finitions

- [ ] Interface en français, textes à part et sens de lecture prêts pour les autres langues ; charte graphique de pi-appliance.
- [ ] Traduction dans les 11 autres langues, arabe et persan de droite à gauche (après la première version).
- [ ] Essais sur Android 16 (One UI 8.5), sans réseau et à la maison. Chrome. iPhone (Safari) visé mais pas essayé : pas de téléphone (question 37) ; noter ici ce qui n'y a pas été vérifié. Le 2026-11-21 : installation réussie avec Chrome (adresse provisoire github.io) ; avec Firefox, pas de bouton « Installer », aide ajoutée (menu ⋮).
