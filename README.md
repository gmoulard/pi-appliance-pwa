# pi-appliance — application mobile

Application web installable (PWA) qui accompagne [pi-appliance](https://github.com/gmoulard/pi-appliance), le projet qui transforme un Raspberry Pi en appliance à la maison. Sur le téléphone, elle donne :

- **la documentation dans la poche**, lisible même sans réseau : premier démarrage, Wi-Fi de configuration, mot de passe oublié, diagnostic ;
- **« Mes Pi »** : la liste de ses Raspberry Pi, chacun avec un bouton qui ouvre sa console, à la maison ou sur internet. Un Pi s'ajoute en scannant le code QR de sa console, à la main, ou par une recherche à la maison parmi les noms connus.

Aucun compte, aucun traceur : ce qui est saisi reste sur le téléphone.

Projet en cours de conception : voir la [spécification](docs/specification.md) et le [TODO](docs/TODO.md). Publication prévue à l'adresse `https://app.pi-appliance.com` (GitHub Pages).

## Pour contribuer

HTML, CSS et JavaScript sans framework ni étape de construction. Après un clone, récupérer les skills partagés :

```
git submodule update --init
```

Les conventions (français, langage courant, en-tête de licence dans chaque fichier de code) sont dans [CLAUDE.md](CLAUDE.md).

## Licence

GNU Affero General Public License, version 3 (AGPL-3.0) : voir [LICENSE](LICENSE).
