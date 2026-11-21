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
    "accueil.ajouter.detail": "Pour l'ouvrir d'un seul geste, à la maison ou sur internet.",
    "menu.mespi": "Mes Pi",
    "menu.ajouter": "Ajouter un Pi",
    "mespi.titre": "Mes Pi",
    "mespi.ajouter": "Ajouter un Pi",
    "mespi.chercher": "Chercher à la maison",
    "reseau.explication": "Pour voir si vos Pi répondent à la maison, l'application doit pouvoir parler aux appareils de votre réseau. Chrome va vous demander l'autorisation : acceptez-la.",
    "reseau.verifier": "Vérifier à la maison",
    "pi.ouvrir": "Ouvrir",
    "pi.supprimer": "Supprimer",
    "pi.supprimer.confirmer": "Retirer « {nom} » de vos Pi ? Le Pi lui-même ne change pas.",
    "etat.verification": "Vérification…",
    "etat.internet": "Répond sur internet",
    "etat.maison": "Répond à la maison",
    "etat.aucun": "Ne répond pas — ou l'alerte du certificat n'a pas encore été acceptée dans ce navigateur",
    "etat.aucun.internet": "Ne répond pas sur internet ; à la maison, pas encore vérifié",
    "etat.maison.inconnu": "À la maison : pas encore vérifié",
    "ajouter.titre": "Ajouter un Pi",
    "ajouter.maison": "Nom du Pi ou son adresse à la maison",
    "ajouter.maison.aide": "Le nom choisi dans la console (par exemple controltower), ou son adresse IP (par exemple 192.168.1.196), donnée par la liste des appareils de votre box.",
    "ajouter.internet": "Adresse sur internet (si vous en avez une)",
    "ajouter.valider": "Ajouter",
    "ajouter.erreur.maison": "Ce nom ou cette adresse ne convient pas. Exemple : controltower, ou 192.168.1.196.",
    "ajouter.erreur.internet": "Cette adresse sur internet ne convient pas. Exemple : controltower.pi-appliance.com.",
    "stockage.erreur": "Impossible d'enregistrer sur ce téléphone : le navigateur refuse de garder des données (navigation privée ?).",
    "annuler": "Annuler",
    "retour": "Retour",
    "chercher.titre": "Chercher à la maison",
    "chercher.explication": "L'application essaie les noms qu'elle connaît : ceux de votre liste et pi-appliance.local. Un téléphone ne peut pas lister les appareils du réseau : un Pi dont elle ne connaît pas le nom ne sera pas trouvé.",
    "chercher.limite.nouveau": "Pour un nouveau Pi, utilisez le code QR de sa console, ou cherchez-le dans la liste des appareils de votre box.",
    "chercher.limite.certificat": "Un Pi n'est trouvé que si vous avez déjà accepté l'alerte du certificat de sa console dans ce navigateur. Sinon, il semble absent même s'il est là.",
    "chercher.limite.chrome": "Chrome va vous demander d'autoriser l'accès aux appareils de votre réseau : acceptez-le, sinon rien ne pourra être trouvé.",
    "chercher.lancer": "Lancer la recherche",
    "chercher.encours": "Recherche en cours…",
    "chercher.trouve": "{n} Pi trouvé(s).",
    "chercher.rien": "Aucun Pi trouvé. Relisez les limites ci-dessus.",
    "chercher.deja": "Déjà dans vos Pi",
    "chercher.ajouter": "Ajouter",
    "chercher.ajoute": "Ajouté",
    "lien.titre": "Ajouter ce Pi ?",
    "lien.ajouter": "Ajouter à mes Pi",
    "lien.invalide": "Ce lien ne contient pas d'adresse de Pi valable.",
    "lien.appairage": "Ce téléphone sera aussi reconnu par le Pi : plus besoin d'identifiant ni de mot de passe pour ouvrir sa console. La console va s'ouvrir dans un nouvel onglet pour le confirmer.",
    "lien.appairer": "Ajouter et appairer",
    "lien.appairage.erreur": "L'appairage n'a pas pu commencer sur ce navigateur. Le Pi est ajouté : sa console demandera l'identifiant et le mot de passe.",
    "pi.appaire": "appairé",
    "menu": "Menu",
    "menu.doc": "Documentation",
    "menu.installer": "Installer l'application",
    "installer.titre": "Mettre l'application sur l'écran d'accueil",
    "installer.android": "Sur Android, avec Chrome : touchez le bouton ci-dessous, ou le menu ⋮ puis « Ajouter à l'écran d'accueil ».",
    "installer.bouton": "Installer",
    "installer.firefox": "Sur Android, avec Firefox : touchez le menu ⋮ puis « Ajouter à l'écran d'accueil » (ou « Installer »).",
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
