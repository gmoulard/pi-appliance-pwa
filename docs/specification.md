# Spécification de l'application mobile pi-appliance

> **Statut : cible.** Rien n'est encore construit. Ce document décrit l'application visée ; l'avancement est dans [TODO.md](TODO.md). Une section passe de « cible » à « réalisé » quand le code existe.

## 1. Objet

L'application mobile pi-appliance est une **application web installable** (PWA) pour téléphone. Elle complète [pi-appliance](https://github.com/gmoulard/pi-appliance), qui transforme un Raspberry Pi en appliance à la maison. Elle sert à deux choses :

- **la documentation dans la poche**, lisible sans réseau : c'est justement quand le Pi ou le Wi-Fi ne marchent pas qu'on en a besoin (premier démarrage, Wi-Fi de configuration, mot de passe oublié, diagnostic) ;
- **un lien direct vers ses Pi** : la liste des appliances de la personne, chacune avec un bouton qui ouvre sa console ou ses services.

Projet séparé de pi-appliance (dépôt `gmoulard/pi-appliance-pwa`), décidé le 2026-11-21 (TODO-5.16 de pi-appliance).

### 1.1 Public visé

Le même que pi-appliance : le grand public. Les écrans parlent en langage courant, sans jargon, dans les 12 langues de la console (français, anglais, allemand, espagnol, italien, portugais, néerlandais, turc, arabe et persan de droite à gauche, chinois, japonais). Charte graphique : celle de pi-appliance (framboise, ludique, pensée d'abord pour le téléphone, polices du système).

## 2. Publication et technique

- Adresse : **`https://app.pi-appliance.com`**, publiée par GitHub Pages depuis ce dépôt. Le nom `app` est à ajouter dans la zone DNS `pi-appliance.com` chez AWS Route 53 (voir `docs/environnement.md` de pi-appliance), enregistrement `CNAME` vers `gmoulard.github.io`.
- **HTML, CSS et JavaScript sans framework** ni étape de construction obligatoire, comme la console : un manifeste d'application web (`manifest.webmanifest`, icônes framboise), un *service worker* pour le hors ligne, pas de module ES exotique. Fonctionne sur les navigateurs récents d'Android et d'iPhone (Safari : « Sur l'écran d'accueil »).
- Licence AGPL-3.0, comme pi-appliance, avec le même en-tête dans chaque fichier de code.
- Aucun compte, aucun serveur à soi : tout ce que la personne saisit reste **sur son téléphone** (stockage local du navigateur). Pas de statistiques, pas de traceur.

## 3. Documentation hors ligne

- Contenu : les pages pour l'utilisateur de pi-appliance — guide utilisateur, premier démarrage (avec `premier-demarrage.svg`), installation et flashage, marketplace, et la future FAQ (TODO-5.9 de pi-appliance). La spécification et le TODO, faits pour le projet, n'y sont pas.
- Source : le dossier `docs/` de pi-appliance, **à l'étiquette de la dernière version publiée** (`vX.Y.Z`), jamais `master` : la documentation doit décrire la version que les Pi installent. Un workflow de ce dépôt la récupère, convertit le Markdown en pages HTML, et republie le site ; il tourne chaque jour et à la demande.
- Hors ligne : à l'installation, le *service worker* garde toutes les pages et leurs images. À chaque ouverture avec réseau, il cherche une nouvelle version et la prend en arrière-plan ; l'écran dit de quelle version de pi-appliance date la documentation et quand elle a été mise à jour.
- Recherche dans la documentation, sans réseau (index construit avec le site).
- Langue : la documentation de pi-appliance n'existe qu'en français pour l'instant ; l'interface de l'application, elle, est traduite. Une page traduite plus tard dans pi-appliance sera prise telle quelle.

## 4. Mes Pi

Une liste « Mes Pi », vide au départ, gardée sur le téléphone. Pour chaque Pi : son nom, son adresse à la maison (`https://<nom>.local/pi-appliance`), son adresse sur internet s'il en a une (`<nom>.pi-appliance.com`, DuckDNS, domaine personnel), et ses services s'ils sont connus.

Trois façons d'ajouter un Pi :

1. **Code QR de la console** (le plus simple) : la console de pi-appliance affiche, dans « Mon Pi », un code QR qui contient une adresse `https://app.pi-appliance.com/#add?...` avec le nom du Pi, son adresse `.local` et son adresse sur internet. Le scanner avec l'appareil photo ouvre l'application, qui propose d'ajouter le Pi. Rien de secret dans le code : ni mot de passe ni clé. Demande une évolution de la console, à faire dans pi-appliance.
2. **Saisie à la main** : nom ou adresse du Pi ; l'application complète `.local` et `/pi-appliance`.
3. **Recherche à la maison** : un navigateur ne peut pas lister les appareils du réseau (pas de mDNS depuis une page web). L'application essaie donc des noms connus — ceux de la liste, `pi-appliance.local`, et les noms `pi-appliance-XXXX.local` déjà vus — et dit lesquels répondent. Elle le dit clairement : la recherche ne trouve pas un Pi dont on ne connaît pas le nom ; pour un nouveau Pi, utiliser le code QR ou la liste des appareils de la box.

Ouvrir un Pi : un bouton par adresse. L'application choisit l'adresse de la maison quand le Pi y répond, sinon celle d'internet, et l'ouvre dans le navigateur. Elle ne parle pas à la console elle-même : la console a son propre écran de connexion, et à la maison son certificat est local (alerte du navigateur la première fois), ce qu'une page de `app.pi-appliance.com` ne peut pas contourner. Les services du Pi sont des liens `https://<service>-<nom>.local` (TODO-2.61 de pi-appliance) ou leur adresse sur internet.

État d'un Pi (« répond à la maison », « répond sur internet », « ne répond pas ») : seulement ce qu'une page web peut voir, une demande qui aboutit ou non, sans lire la réponse. Les navigateurs limitent les demandes d'une page publique vers le réseau de la maison (*Private Network Access*) : si l'état ne peut pas être lu, l'application affiche seulement les boutons.

## 5. Questions ouvertes

- Contenu exact du code QR, et si la console peut aussi donner la liste des services installés sans connexion (sans rien révéler à un voisin du Wi-Fi).
- FAQ : à écrire dans pi-appliance (TODO-5.9) avant d'être reprise ici.
- Traduction de la documentation elle-même (TODO-5.11 de pi-appliance).
- Application dans les magasins (Play Store par une *Trusted Web Activity*) : pas pour l'instant.
