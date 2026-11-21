# TODO

Avancement de l'application mobile pi-appliance ([spécification](specification.md)). Une action réalisée est cochée avec la date ou la version.

## 1. Mise en place

- [x] Dépôt `gmoulard/pi-appliance-pwa` créé (2026-11-21) ; spécification écrite.
- [x] Licence AGPL-3.0 (`LICENSE`), `README.md`, `CLAUDE.md` avec les paramètres des skills partagés (2026-11-21).
- [x] Questions de spécification posées et tranchées (2026-11-21) ; restent les précisions de [questions.md](questions.md).
- [ ] Sous-module `.claude/skills/` (https://github.com/gmoulard/claude_skills, au même commit que pi-appliance) : à ajouter par l'utilisateur, l'agent n'y a pas été autorisé.
- [ ] Branche `main`, publiée par GitHub Pages (2).
- [ ] Nom `app.pi-appliance.com` dans Route 53 (`CNAME` vers `gmoulard.github.io`), GitHub Pages avec HTTPS (2).

## 2. Documentation hors ligne (3) — en premier

- [ ] Workflow qui récupère `docs/` de pi-appliance à la dernière étiquette, convertit le Markdown en HTML (pages reprises et liens « en ligne », 3) et publie le site, chaque jour et à la demande.
- [ ] *Service worker* : pages et images gardées pour le hors ligne, mise à jour en silence, version, commit et date en bas de page.
- [ ] Recherche sans réseau.
- [ ] Manifeste, icônes (fond framboise sur Android), aide à l'installation dans le menu (5).

## 3. Mes Pi (4)

- [ ] Liste gardée sur le téléphone, par ordre alphabétique, suppression ; ajout à la main (nom ou adresse IP) ; ouverture par un seul bouton dans le navigateur.
- [ ] Ajout par code QR, lu par l'application (jsQR) ou par l'appareil photo sur Android ; lien `#add?...` ; identifiant stable.
- [ ] Recherche à la maison parmi les noms connus, avec ses limites dites à l'écran.
- [ ] État toujours affiché, et services relus dans `api/hello`.
- [ ] Côté pi-appliance : [demande](demande-pi-appliance.md) reprise dans une session de pi-appliance (code QR et lien dans « Mon Pi », `api/hello`, liens vers l'application ; TODO-5.16 de pi-appliance).

## 4. Finitions

- [ ] Interface en français, textes à part et sens de lecture prêts pour les autres langues ; charte graphique de pi-appliance.
- [ ] Traduction dans les 11 autres langues, arabe et persan de droite à gauche (après la première version).
- [ ] Essais sur Android 16 (One UI 8.5), sans réseau et à la maison. iPhone : pas de téléphone pour l'essayer (question 37).
