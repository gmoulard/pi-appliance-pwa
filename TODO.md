# TODO

Avancement de l'application mobile pi-appliance ([spécification](docs/specification.md)). États : `[ ]` à faire ; `[~]` en cours ou à vérifier (fait, mais pas encore validé, le plus souvent sur le téléphone ou avec un vrai Pi) ; `[!]` bloqué (attend une décision ou un accès : la raison est dite) ; `[x]` réalisé et validé, avec la date ou la version. Une action ouverte dit de quoi elle dépend (« Dépend de : ») et ses critères d'acceptation ; elle n'est cochée `[x]` qu'une fois ses critères remplis. Les actions réalisées tiennent sur une ligne.

## Lots

Groupes d'actions cohérents, réalisés chacun par le sous-agent `todo-lot` (une action = un commit poussé). LOT-1 tient une seule action : elle attend l'utilisateur.

| Lot | Titre | Actions | Dépend de | État |
|-----|-------|---------|-----------|------|
| LOT-1 | Accès à régler par l'utilisateur | TODO-1.6 | aucun | [!] |
| LOT-2 | Documentation sur le téléphone | TODO-2.6, TODO-2.7, TODO-4.3 | aucun | [~] |
| LOT-3 | Mes Pi avec un vrai Pi | TODO-3.2, TODO-3.3, TODO-3.4, TODO-3.5, TODO-3.6, TODO-3.7, TODO-3.8 | LOT-1 | [~] |
| LOT-4 | Langues | TODO-4.1, TODO-4.2 | aucun | [ ] |

## 1. Mise en place

- [x] **TODO-1.1**: Dépôt `gmoulard/pi-appliance-pwa` créé (2026-11-21) ; spécification écrite.
- [x] **TODO-1.2**: Licence AGPL-3.0 (`LICENSE`), `README.md`, `CLAUDE.md` avec les paramètres des skills partagés (2026-11-21).
- [x] **TODO-1.3**: Questions de spécification posées et tranchées, précisions 31 à 37 comprises (2026-11-21).
- [x] **TODO-1.4**: Sous-module `.claude/skills/` (https://github.com/gmoulard/claude_skills, au même commit que pi-appliance), ajouté le 2026-11-25 ; agent `todo-lot` relié dans `.claude/agents/`.
- [x] **TODO-1.5**: Branche `main` créée, publiée par GitHub Pages (source « GitHub Actions ») ; premier site publié par le workflow « Site » le 2026-11-21, à l'adresse provisoire `https://gmoulard.github.io/pi-appliance-pwa/`.
- [!] **TODO-1.6**: Nom `app.pi-appliance.com` dans Route 53 (`CNAME` vers `gmoulard.github.io`), GitHub Pages avec HTTPS (2). Dépend de : TODO-1.5.
  - Critères d'acceptation : `https://app.pi-appliance.com` ouvre l'application avec un certificat valide ; l'ancienne adresse github.io renvoie vers elle. Bloqué par : entrée DNS dans Route 53 et réglage de GitHub Pages, à faire par l'utilisateur.

## 2. Documentation hors ligne (3) — en premier

- [x] **TODO-2.1**: Workflow « Site » qui récupère `docs/` de pi-appliance à la dernière étiquette, convertit le Markdown en HTML (`outils/site.mjs` : pages reprises, liens « en ligne », catalogue de la marketplace écrit dans la page) et publie le site, toutes les heures (sans republier si rien n'a changé, depuis le 2026-11-23), à chaque changement de `main` et à la demande (2026-11-21). Premier passage réussi le 2026-11-21 (construction, essais, publication).
- [x] **TODO-2.2**: *Service worker* : pages et images gardées pour le hors ligne, mise à jour en silence, version, commit et date en bas de page (2026-11-21).
- [x] **TODO-2.3**: Recherche sans réseau (2026-11-21).
- [x] **TODO-2.4**: Manifeste, icônes (maison or sur fond framboise, 2026-11-21 ; blanche auparavant), aide à l'installation dans le menu (5) (2026-11-21).
- [x] **TODO-2.5**: Essais dans Chromium sans tête : `node outils/essai.cjs <site>` (site gardé, lecture et recherche sans réseau, mise à jour en silence), aussi lancés par le workflow (2026-11-21).
- [~] **TODO-2.6**: À essayer sur l'Android : installation, lecture en mode avion, mise à jour après une nouvelle version de pi-appliance. Dépend de : TODO-2.1.
  - Critères d'acceptation : essai réussi sur l'Android de l'utilisateur (Android 16, Chrome) : application installée, documentation lue en mode avion, mise à jour reçue après une nouvelle version de pi-appliance (fait : installation).
- [~] **TODO-2.7**: Pied de page complet (TODO-5.21 de pi-appliance, 2026-11-22) : documentation (version, date et commit de pi-appliance, liés) et application (son commit lié et sa date), licence AGPL-3.0 et code source, sur l'écran principal et chaque page de documentation ; essayé dans Chromium (`outils/essai.cjs`). À voir sur l'Android. Dépend de : TODO-2.1.
  - Critères d'acceptation : pied de page vu sur l'Android de l'utilisateur (écran principal et pages de documentation), liens du commit, de la licence et du code source qui s'ouvrent.

## 3. Mes Pi (4)

- [x] **TODO-3.1**: Liste gardée sur le téléphone, par ordre alphabétique, suppression ; ajout à la main (nom ou adresse IP) ; ouverture par un seul bouton dans le navigateur (2026-11-21, `mespi.js`). Le 2026-11-22, à la demande de l'utilisateur : plus de boutons sous la liste ; scanner et chercher à la maison passent dans « Ajouter un Pi », la documentation dans le menu.
- [~] **TODO-3.2**: Ajout par la seule adresse sur internet : nom, adresse `.local`, identifiant et services lus dans `api/hello` (2026-11-21, demande de l'utilisateur ; essayé dans Chromium avec un faux Pi). À essayer sur l'Android avec un vrai Pi, depuis `https://app.pi-appliance.com` (le Pi n'autorise que cette adresse). Dépend de : TODO-1.6.
  - Critères d'acceptation : essai réussi sur l'Android de l'utilisateur (Android 16, Chrome) : Pi ajouté par sa seule adresse sur internet depuis `https://app.pi-appliance.com`, nom, adresse `.local` et services lus.
- [~] **TODO-3.3**: Ajout par code QR, lu par l'application (`lecteur.js`, jsQR dans `vendor/jsqr/`) ou par l'appareil photo sur Android ; lien `#add?...` avec services `s` ; identifiant stable (2026-11-21, essayé dans Chromium avec une fausse caméra). À essayer sur l'Android avec le code de la console. Dépend de : aucune.
  - Critères d'acceptation : essai réussi sur l'Android de l'utilisateur (Android 16, Chrome) : code QR de la console scanné par l'application et par l'appareil photo, Pi ajouté avec ses services.
- [~] **TODO-3.4**: Recherche à la maison parmi les noms connus, avec ses limites dites à l'écran (2026-11-21). À essayer à la maison avec un vrai Pi. Dépend de : aucune.
  - Critères d'acceptation : essai réussi à la maison avec un vrai Pi : Pi trouvé parmi les noms connus, limites dites à l'écran.
- [~] **TODO-3.5**: État toujours affiché, et services relus dans `api/hello`. Fait le 2026-11-21 : état deviné sans `api/hello`, vérification à la maison après un geste (autorisation de Chrome), lecture de `api/hello` selon le format de la demande. Restent : format définitif de pi-appliance, essai avec un vrai Pi. Dépend de : TODO-3.6.
  - Critères d'acceptation : format de `api/hello` arrêté par pi-appliance ; essai réussi sur l'Android de l'utilisateur (Android 16, Chrome) : état juste à la maison et hors de la maison, services relus.
- [~] **TODO-3.6**: Côté pi-appliance : [demande](docs/demande-pi-appliance.md) réalisée par une session de pi-appliance sur sa branche `claude/application-mobile` (2026-11-21) : code QR et lien dans « Mon Pi », `api/hello`, appairage, connexion, retrait, « Mon compte → Appareils ». Versée dans `master` et sortie dans la version **v0.1.5** de pi-appliance (2026-11-21, image en construction par le workflow « Image »). Reste à l'essayer sur un vrai Pi. Dépend de : aucune.
  - Critères d'acceptation : voir TODO-3.3, TODO-3.5 et TODO-3.7 ; TODO-5.16 de pi-appliance.
- [~] **TODO-3.7**: Appairage (4.4) : clé du téléphone (WebCrypto, non exportable, IndexedDB), appairage au lien `#add?...&c=…`, connexion signée à « Ouvrir ». Côté application fait le 2026-11-21 (`cle.js`, essayé dans Chromium avec un faux Pi, signatures vérifiées par Node). Côté pi-appliance : demande, section 4, confiée à sa session. Reste l'essai avec un vrai Pi. Dépend de : TODO-3.3, TODO-3.6.
  - Critères d'acceptation : essai réussi sur l'Android de l'utilisateur (Android 16, Chrome) : téléphone appairé par le code QR, connexion sans mot de passe à « Ouvrir », retrait depuis « Mon compte → Appareils ».
- [~] **TODO-3.8**: Script `outils/pia-update`, à lancer sur le Pi en SSH : dernière version de pi-appliance sur GitHub, archive vérifiée (SHA-256), installée par `updates.sh appliance` comme depuis la console (2026-11-21, demande de l'utilisateur ; essayé avec un faux Pi). À essayer sur le vrai Pi ; sa place serait plutôt dans pi-appliance (par exemple `pia mise-a-jour`). Dépend de : aucune.
  - Critères d'acceptation : essai réussi sur un vrai Pi par SSH : dernière version installée, services gardés ; ou script repris dans pi-appliance (`pia update`, TODO-5.18 de pi-appliance) et retiré d'ici.

## 4. Finitions

- [ ] **TODO-4.1**: Interface en français, textes à part et sens de lecture prêts pour les autres langues ; charte graphique de pi-appliance. Dépend de : aucune.
  - Critères d'acceptation : aucun texte de l'interface écrit en dur dans le code, sens de lecture de droite à gauche prévu, couleurs et logo de la charte graphique de pi-appliance.
- [ ] **TODO-4.2**: Traduction dans les 11 autres langues, arabe et persan de droite à gauche (après la première version). Dépend de : TODO-4.1.
  - Critères d'acceptation : interface dans les 12 langues de la console, arabe et persan de droite à gauche, traductions relues.
- [~] **TODO-4.3**: Essais sur Android 16 (One UI 8.5), sans réseau et à la maison. Chrome. iPhone (Safari) visé mais pas essayé : pas de téléphone (question 37) ; noter ici ce qui n'y a pas été vérifié. Le 2026-11-21 : installation réussie avec Chrome (adresse provisoire github.io) ; avec Firefox, pas de bouton « Installer », aide ajoutée (menu ⋮). Dépend de : aucune.
  - Critères d'acceptation : essai réussi sur l'Android de l'utilisateur (Android 16, Chrome) : chaque écran essayé sans réseau et à la maison ; ce qui n'a pas été vérifié sur iPhone écrit ici.
