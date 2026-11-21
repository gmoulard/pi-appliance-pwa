# CLAUDE.md

Instructions pour Claude Code (ou tout agent) travaillant sur ce dépôt.

## Le projet

pi-appliance-pwa est l'application mobile de [pi-appliance](https://github.com/gmoulard/pi-appliance) : une application web installable (PWA) publiée sur `https://app.pi-appliance.com`, qui donne la documentation de pi-appliance lisible sans réseau et un lien direct vers ses Raspberry Pi. L'application visée est décrite dans [docs/specification.md](docs/specification.md), l'avancement dans [docs/TODO.md](docs/TODO.md) : les lire avant toute modification fonctionnelle et les mettre à jour dans le même changement. La spécification est marquée « cible » tant que le code n'existe pas : quand une fonction est réalisée, le dire dans la spécification et cocher le TODO.

Public visé : le grand public (spécification 1.1). Les écrans parlent en langage courant, sans jargon technique, dans les 12 langues de la console de pi-appliance (arabe et persan de droite à gauche). Charte graphique : `docs/charte-graphique.md` de pi-appliance.

Technique : HTML, CSS et JavaScript sans framework, sans étape de construction obligatoire (spécification 2). Rien de ce que la personne saisit ne quitte son téléphone : ni compte, ni statistiques, ni traceur.

Services hors du dépôt (DNS `pi-appliance.com` chez AWS Route 53, GitHub Pages) : `docs/environnement.md` de pi-appliance.

Ne jamais versionner de secret, et ne jamais mettre de mot de passe ou de clé dans un code QR ou une adresse `#add?...`.

## Paramètres des skills

`.claude/skills/` est un sous-module git, le dépôt partagé https://github.com/gmoulard/claude_skills, comme dans pi-appliance : `git submodule update --init` après un clone. Modifier un skill = commit et push dans ce dépôt-là (demander avant de pousser), puis commit ici du nouveau pointeur du sous-module. Ne jamais y écrire de valeur propre à ce dépôt : elle va ci-dessous. Une valeur absente : la demander à l'utilisateur.

- **`code-style`** :
  - code : HTML, CSS et JavaScript à la racine du site (pas de framework, pas de module ES exotique), workflows dans `.github/workflows/` ; pièges : `grep -rn "NE PAS" .` ;
  - en-tête de licence AGPL-3.0, avec le commentaire du langage (`#`, `//`, `/* */`, `<!-- -->`), sur les fichiers de code (`.js`, `.css`, `.html`, `.sh`, `.py`, workflows) :

    ```
    This file is part of pi-appliance-pwa <https://github.com/gmoulard/pi-appliance-pwa>.
    Copyright (c) 2026 Guillaume Moulard.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, version 3.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
    ```
- **`spec-sync`** :
  - référence : `docs/specification.md`, en français, qui fait foi ; pas de traduction pour l'instant ;
  - évolutions non implémentées : `docs/TODO.md` et section 5 « Questions ouvertes » de la spécification ;
  - choix techniques : section 2 ; arborescence : README.
- **Tests** : à définir avec le premier code (essais dans un navigateur sans tête, Chromium avec Playwright) ; à la main : Android (Chrome) et iPhone (Safari, écran d'accueil), sans réseau et à la maison.
- **`release`** : pas de numéro de version pour l'instant ; le site est republié par GitHub Pages à chaque changement de la branche principale. La documentation affichée porte la version de pi-appliance dont elle vient (étiquette `vX.Y.Z`).
