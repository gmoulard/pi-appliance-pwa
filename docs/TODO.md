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

- [ ] Liste gardée sur le téléphone, par ordre alphabétique, suppression ; ajout à la main (nom ou adresse IP) ; ouverture par un seul bouton dans le navigateur.
- [ ] Ajout par code QR, lu par l'application (jsQR) ou par l'appareil photo sur Android ; lien `#add?...` ; identifiant stable.
- [ ] Recherche à la maison parmi les noms connus, avec ses limites dites à l'écran.
- [ ] État toujours affiché, et services relus dans `api/hello`.
- [ ] Côté pi-appliance : [demande](demande-pi-appliance.md) reprise dans une session de pi-appliance (code QR et lien dans « Mon Pi », `api/hello`, liens vers l'application ; TODO-5.16 de pi-appliance). Confiée le 2026-11-21 à une session de pi-appliance (« pi-appliance : prise en compte de l'application mobile (PWA) »).

## 4. Finitions

- [ ] Interface en français, textes à part et sens de lecture prêts pour les autres langues ; charte graphique de pi-appliance.
- [ ] Traduction dans les 11 autres langues, arabe et persan de droite à gauche (après la première version).
- [ ] Essais sur Android 16 (One UI 8.5), sans réseau et à la maison. Chrome. iPhone (Safari) visé mais pas essayé : pas de téléphone (question 37) ; noter ici ce qui n'y a pas été vérifié. Le 2026-11-21 : installation réussie avec Chrome (adresse provisoire github.io) ; avec Firefox, pas de bouton « Installer », aide ajoutée (menu ⋮).
