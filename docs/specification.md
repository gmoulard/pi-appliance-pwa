# Spécification de l'application mobile pi-appliance

> **Statut : en partie réalisé.** La documentation hors ligne (section 3) est construite (2026-11-21) ; « Mes Pi » (section 4) est encore une cible. Ce document décrit l'application visée ; l'avancement est dans [TODO.md](TODO.md). Une section passe de « cible » à « réalisé » quand le code existe. Choix de l'utilisateur du 2026-11-21 repris ici (questions et réponses : [questions.md](questions.md)).

## 1. Objet

L'application mobile pi-appliance est une **application web installable** (PWA) pour téléphone. Elle complète [pi-appliance](https://github.com/gmoulard/pi-appliance), qui transforme un Raspberry Pi en appliance à la maison. Elle sert à deux choses :

- **la documentation dans la poche**, lisible sans réseau : c'est justement quand le Pi ou le Wi-Fi ne marchent pas qu'on en a besoin (premier démarrage, Wi-Fi de configuration, mot de passe oublié, diagnostic) ;
- **un lien direct vers ses Pi** : la liste des appliances de la personne, chacune avec un bouton qui ouvre sa console ou ses services.

Projet séparé de pi-appliance (dépôt `gmoulard/pi-appliance-pwa`), décidé le 2026-11-21 (TODO-5.16 de pi-appliance).

### 1.1 Public visé

Le même que pi-appliance : le grand public. Les écrans parlent en langage courant, sans jargon. **Première version en français seulement** ; les 11 autres langues de la console (anglais, allemand, espagnol, italien, portugais, néerlandais, turc, arabe et persan de droite à gauche, chinois, japonais) viendront ensuite, et le code est prêt pour elles dès le départ (textes à part, sens de lecture). Charte graphique : celle de pi-appliance (framboise, ludique, pensée d'abord pour le téléphone, polices du système, pas de thème sombre).

## 2. Publication et technique

- Adresse : **`https://app.pi-appliance.com`**, publiée par GitHub Pages depuis la branche **`main`** de ce dépôt. Le nom `app` est à ajouter dans la zone DNS `pi-appliance.com` chez AWS Route 53 (voir `docs/environnement.md` de pi-appliance), enregistrement `CNAME` vers `gmoulard.github.io`.
- **HTML, CSS et JavaScript sans framework** ni étape de construction obligatoire, comme la console : un manifeste d'application web (`manifest.webmanifest`), un *service worker* pour le hors ligne, pas de module ES exotique. Seule bibliothèque extérieure : un lecteur de code QR (jsQR, licence Apache 2.0), gardé dans le dépôt. Navigateurs visés : Chrome sur Android, où se font les essais (Android 16, One UI 8.5), et Safari sur iPhone (« Sur l'écran d'accueil »), sans téléphone pour l'essayer : ce qui n'y a pas été essayé est dit dans le TODO.
- Nom sous l'icône : **« pi-appliance »**. Icône : la maison « La maison » de la charte sur fond framboise (`#C71F5D`) partout : Android la découpe en rond ou en carré, l'iPhone n'accepte pas d'icône transparente. Sur ce fond, le toit framboise du symbole disparaîtrait : la maison y est donc blanche, avec le π framboise (le dessin de l'ancienne `icone-app.svg` de la charte, en carré plein, `icones/icone.svg`). Le symbole lui-même reste dans l'en-tête et l'onglet du navigateur.
- Licence AGPL-3.0, comme pi-appliance, avec le même en-tête dans chaque fichier de code.
- Aucun compte, aucun serveur à soi : tout ce que la personne saisit reste **sur son téléphone** (stockage local du navigateur). Pas de statistiques, pas de traceur.
- Liens vers l'application : sur www.pi-appliance.com et dans la console (« Application mobile »), à ajouter dans pi-appliance (section 6).

## 3. Documentation hors ligne

**Réalisé** (2026-11-21), essayé dans Chromium (`outils/essai.cjs`) ; à essayer sur un vrai téléphone une fois le site publié.

- Contenu : les pages pour l'utilisateur de pi-appliance — guide utilisateur, premier démarrage (avec `premier-demarrage.svg`), installation et flashage, marketplace, plusieurs Pi à la maison (`essais-plusieurs-pi.md`), et la future FAQ (TODO-5.9 de pi-appliance). Les pages faites pour le projet (spécification, TODO, environnement, prototype, manGit, charte) n'y sont pas ; un lien vers l'une d'elles mène à la page sur www.pi-appliance.com, marqué « en ligne ».
- Source : le dossier `docs/` de pi-appliance, **à la dernière étiquette publiée** (`vX.Y.Z`, aujourd'hui `v0.1.4`), même avant la première version stable, jamais `master` : la documentation doit décrire la version que les Pi installent. Une seule documentation, celle de la dernière version, même pour un Pi resté sur une version plus ancienne. Un workflow de ce dépôt la récupère, convertit le Markdown en pages HTML, et republie le site ; il tourne chaque jour et à la demande.
- Hors ligne : à l'installation, le *service worker* garde toutes les pages et leurs images. À chaque ouverture avec réseau, il cherche une nouvelle version et la prend **en silence** ; le bas de chaque page dit de quelle version de pi-appliance date la documentation, avec la référence du commit (les 7 premiers caractères, lien vers GitHub), et quand elle a été mise à jour.
- Recherche dans la documentation, sans réseau (index construit avec le site) : chaque mot cherché doit se trouver dans la section, sans tenir compte des accents ni des majuscules.
- Catalogue de la marketplace : sur www.pi-appliance.com il est chargé par un script ; ici il est écrit dans la page à la construction, pour être lisible sans réseau.
- **Réalisation** : `outils/site.mjs` (Node, bibliothèque marked) copie l'application, convertit les pages (identifiants de titres comme kramdown, pour que les liens `#ancre` marchent ; liens vers une page non reprise et liens vers internet marqués « en ligne »), écrit l'index de recherche `doc/recherche.json` et `version.json` : la liste des fichiers à garder et une empreinte de leur contenu. Le *service worker* (`sw.js`) sert tout depuis le téléphone ; à chaque ouverture avec réseau, il relit `version.json` et, si l'empreinte a changé, télécharge la nouvelle version dans un cache neuf avant de retirer l'ancien ; une mise à jour interrompue est abandonnée et l'ancienne version reste. Workflow « Site » (`.github/workflows/site.yml`) : chaque jour, à chaque changement de `main` et à la demande ; il essaie le site dans Chromium avant de le publier. Un site inchangé garde la même empreinte : les téléphones ne retéléchargent rien.
- Langue : la documentation de pi-appliance n'existe qu'en français pour l'instant. Une page traduite plus tard dans pi-appliance sera prise telle quelle.

## 4. Mes Pi

Une liste « Mes Pi », vide au départ, gardée sur le téléphone, **par ordre alphabétique du nom**. Pour chaque Pi : son nom sur le réseau (pas de surnom), son adresse à la maison (`https://<nom>.local/pi-appliance`), son adresse sur internet s'il en a une (`<nom>.pi-appliance.com`, DuckDNS, domaine personnel), un identifiant stable et ses services. Un Pi peut être supprimé ; son nom suit celui du Pi (code QR ou `api/hello`), il ne se change pas dans la liste.

### 4.1 Ajouter un Pi

1. **Code QR de la console** (le plus simple) : la console de pi-appliance affiche, dans « Mon Pi » et seulement à l'administrateur connecté, un code QR qui contient une adresse `https://app.pi-appliance.com/#add?...`, et le même lien prêt à partager (message, courriel). Il porte le nom du Pi, son adresse `.local`, son adresse sur internet, ses services et leurs adresses, et un **identifiant stable** non secret (l'empreinte de la clé du Pi) : un Pi qui change de nom (`pi-appliance-1a2b` devenu `controltower`) met à jour sa fiche au lieu d'en créer une deuxième. Jamais de mot de passe ni de clé.
   - **L'application lit le code elle-même** (bouton « Scanner le code », caméra du téléphone). Sur iPhone, l'application de l'écran d'accueil ne partage pas ses données avec Safari : un code scanné avec l'appareil photo ouvrirait Safari, et le Pi ajouté là n'apparaîtrait pas dans l'application. Sur Android, l'appareil photo marche aussi.
2. **Saisie à la main** : nom du Pi ou adresse IP (`192.168.1.196`) ; l'application complète `.local` et `/pi-appliance`.
3. **Recherche à la maison** : un navigateur ne peut pas lister les appareils du réseau (pas de mDNS depuis une page web). L'application essaie donc des noms connus — ceux de la liste, `pi-appliance.local`, `pi-appliance-2.local`… — et dit lesquels répondent. **Ses limites sont dites clairement à l'écran** :
   - elle ne trouve pas un Pi dont on ne connaît pas le nom ; pour un nouveau Pi, utiliser le code QR ou la liste des appareils de la box ;
   - à la maison, le certificat du Pi est fait par le Pi lui-même : tant que l'alerte du certificat n'a pas été acceptée dans ce navigateur (sur iPhone, dans l'application installée elle-même), la demande est refusée et l'application ne peut pas distinguer un Pi absent d'un Pi présent ;
   - Chrome demande la permission d'accéder « aux appareils de votre réseau local » : l'écran explique pourquoi avant que Chrome la demande.

### 4.2 Ouvrir un Pi

**Un seul bouton** par Pi : l'application choisit l'adresse elle-même, d'après l'état (4.3) — l'adresse sur internet si elle répond (vrai certificat, pas d'alerte), sinon celle de la maison — et l'ouvre **dans le navigateur habituel**, qui garde la connexion et l'alerte du certificat déjà acceptée. Elle ne parle pas à la console elle-même : la console a son propre écran de connexion. Les services du Pi sont des liens `https://<service>-<nom>.local` (TODO-2.61 de pi-appliance) ou leur adresse sur internet.

### 4.3 État et services

- **Demande `api/hello`** de la console (à ajouter dans pi-appliance, section 6) : sans connexion, autorisée pour `app.pi-appliance.com` (CORS, et l'autorisation de réseau privé de Chrome), elle rend le nom du Pi, sa version, son identifiant stable et ses services. N'importe qui qui connaît l'adresse du Pi sur internet peut la lire : choix accepté, les adresses des services sur internet étant déjà joignables par tous ; rien d'autre n'y figure. Sur internet, le Pi a un vrai certificat : l'état et les services s'y lisent de façon fiable. À la maison, seulement si l'alerte du certificat a été acceptée (4.1).
- **État affiché toujours**, même incertain : « répond à la maison », « répond sur internet », « ne répond pas », avec une mention quand il est incertain (par exemple « ne répond pas — ou alerte du certificat pas encore acceptée »).
- **Services mis à jour par le Pi** : à chaque ouverture de l'application, la liste des services de chaque Pi qui répond est relue dans `api/hello` ; le code QR donne la première liste.

## 5. Écrans

- **Premier écran** : « Mes Pi » s'il y a au moins un Pi ; sinon un accueil avec « Ajouter mon Pi » et « Lire la documentation ».
- **Installation sur l'écran d'accueil** : une aide toujours présente dans le menu (bouton sur Android, « Partager » puis « Sur l'écran d'accueil » sur iPhone), jamais proposée d'elle-même.
- **Langue** : celle du téléphone, avec un choix dans les réglages, quand il y aura plus d'une langue (1.1).

## 6. À faire dans pi-appliance

Cette application attend de la console de pi-appliance (demande à reprendre dans une session de pi-appliance, TODO-5.16 ; texte dans [demande-pi-appliance.md](demande-pi-appliance.md)) :

- le code QR et le lien de partage dans « Mon Pi » (4.1) ;
- la demande `api/hello` (4.3) ;
- un lien « Application mobile » sur www.pi-appliance.com et dans la console.

## 7. Questions ouvertes

Toutes les questions de [questions.md](questions.md) sont tranchées (2026-11-21). Restent :

- FAQ : à écrire dans pi-appliance (TODO-5.9) avant d'être reprise ici.
- Traduction de la documentation elle-même (TODO-5.11 de pi-appliance).
- Application dans les magasins (Play Store par une *Trusted Web Activity*) : pas pour l'instant.
