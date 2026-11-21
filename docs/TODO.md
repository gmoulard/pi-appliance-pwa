# TODO

Avancement de l'application mobile pi-appliance ([spécification](specification.md)). Une action réalisée est cochée avec la date ou la version.

## 1. Mise en place

- [x] Dépôt `gmoulard/pi-appliance-pwa` créé (2026-11-21) ; spécification écrite.
- [x] Licence AGPL-3.0 (`LICENSE`), `README.md`, `CLAUDE.md` avec les paramètres des skills partagés (2026-11-21).
- [ ] Sous-module `.claude/skills/` (https://github.com/gmoulard/claude_skills, au même commit que pi-appliance) : à ajouter par l'utilisateur, l'agent n'y a pas été autorisé.
- [ ] Nom `app.pi-appliance.com` dans Route 53 (`CNAME` vers `gmoulard.github.io`), GitHub Pages avec HTTPS (2).

## 2. Documentation hors ligne (3)

- [ ] Workflow qui récupère `docs/` de pi-appliance à l'étiquette de la dernière version, convertit le Markdown en HTML et publie le site.
- [ ] *Service worker* : pages et images gardées pour le hors ligne, mise à jour en arrière-plan, version et date affichées.
- [ ] Recherche sans réseau.

## 3. Mes Pi (4)

- [ ] Liste gardée sur le téléphone, ajout à la main, ouverture de la console à la maison ou sur internet.
- [ ] Ajout par code QR (`#add?...`) ; côté pi-appliance, code QR dans « Mon Pi » (TODO-5.16 de pi-appliance).
- [ ] Recherche à la maison parmi les noms connus, avec ses limites dites clairement.
- [ ] État de chaque Pi quand le navigateur le permet.

## 4. Finitions

- [ ] Interface dans les 12 langues, arabe et persan de droite à gauche ; charte graphique de pi-appliance.
- [ ] Essais sur Android (Chrome) et iPhone (Safari, écran d'accueil), sans réseau et à la maison.
