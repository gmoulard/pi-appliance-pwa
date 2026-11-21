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

// Textes de l'interface, une entrée par langue (spécification 1.1). Première
// version en français seulement ; une langue ajoutée ici est proposée d'après
// la langue du téléphone. Une clé absente d'une langue reste en français.
// Les pages gardent leur texte français dans le HTML : app.js le remplace
// (attribut data-t) quand une autre langue est choisie.

window.TEXTES = {
  fr: {
    "accueil.titre": "Bienvenue",
    "accueil.intro": "Votre Raspberry Pi pi-appliance, dans la poche.",
    "accueil.doc": "Lire la documentation",
    "accueil.doc.detail": "Premier démarrage, Wi-Fi, mot de passe oublié… lisible même sans réseau.",
    "accueil.ajouter": "Ajouter mon Pi",
    "accueil.ajouter.detail": "La liste de vos Pi arrive dans une prochaine version.",
    "accueil.bientot": "En attendant, ouvrez la console de votre Pi dans le navigateur : https://pi-appliance.local/pi-appliance (ou le nom que vous lui avez donné, suivi de .local).",
    "menu": "Menu",
    "menu.doc": "Documentation",
    "menu.installer": "Installer l'application",
    "installer.titre": "Mettre l'application sur l'écran d'accueil",
    "installer.android": "Sur Android, avec Chrome : touchez le bouton ci-dessous, ou le menu ⋮ puis « Ajouter à l'écran d'accueil ».",
    "installer.bouton": "Installer",
    "installer.iphone": "Sur iPhone, avec Safari : touchez « Partager » (le carré avec une flèche), puis « Sur l'écran d'accueil ».",
    "installer.deja": "L'application est déjà installée sur ce téléphone.",
    "fermer": "Fermer",
    "doc.sommaire": "Sommaire",
    "doc.titre": "Documentation",
    "doc.intro": "Lisible même sans réseau : elle reste sur votre téléphone.",
    "doc.chercher": "Chercher dans la documentation",
    "doc.pages": "Pages",
    "doc.version": "Documentation de pi-appliance {version} du {date}.",
    "doc.horsligne": "Pas encore gardée sur ce téléphone : ouvrez l'application une fois avec le réseau.",
    "recherche.aucun": "Rien trouvé pour « {texte} ».",
    "recherche.nombre": "{n} résultat(s).",
    "recherche.indisponible": "La recherche n'est pas disponible pour l'instant.",
  },
};
