# Spécification de l'application mobile pi-appliance

> **Statut : en partie réalisé.** La documentation hors ligne (section 3) et la première partie de « Mes Pi » (section 4 : liste, ajout à la main, lien `#add`, recherche à la maison, état deviné, ouverture) sont construites (2026-11-21) ; le lecteur de code QR et `api/hello` attendent pi-appliance. Ce document décrit l'application visée ; l'avancement est dans [TODO.md](TODO.md). Une section passe de « cible » à « réalisé » quand le code existe. Choix de l'utilisateur du 2026-11-21 repris ici (questions et réponses : [questions.md](questions.md)).

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

**Réalisé côté application** (2026-11-21, `mespi.js`, `lecteur.js`, `cle.js`, essayés dans Chromium) : liste gardée dans le stockage local du navigateur, ordre alphabétique, suppression ; ajout à la main ; lecteur de code QR (jsQR, `vendor/jsqr/`) ; lien `#add?id=…&l=…&n=…&s=…&w=…[&c=…]` ; recherche à la maison ; état et bouton unique ; appairage (4.4). Le côté pi-appliance est fait sur sa branche `claude/application-mobile` (pas encore dans une version) ; rien n'est encore essayé avec un vrai Pi.

Une liste « Mes Pi », vide au départ, gardée sur le téléphone, **par ordre alphabétique du nom**. Pour chaque Pi : son nom sur le réseau (pas de surnom), son adresse à la maison (`https://<nom>.local/pi-appliance`), son adresse sur internet s'il en a une (`<nom>.pi-appliance.com`, DuckDNS, domaine personnel), un identifiant stable et ses services. Un Pi peut être supprimé ; son nom suit celui du Pi (code QR ou `api/hello`), il ne se change pas dans la liste.

### 4.1 Ajouter un Pi

1. **Code QR de la console** (le plus simple) : la console de pi-appliance affiche, dans « Mon Pi » et seulement à l'administrateur connecté, un code QR qui contient une adresse `https://app.pi-appliance.com/#add?...`, et le même lien prêt à partager (message, courriel). Il porte le nom du Pi, son adresse `.local`, son adresse sur internet, ses services et leurs adresses, et un **identifiant stable** non secret (l'empreinte de la clé du Pi) : un Pi qui change de nom (`pi-appliance-1a2b` devenu `controltower`) met à jour sa fiche au lieu d'en créer une deuxième. Jamais de mot de passe ni de clé ; le code QR (pas le lien à partager) porte en plus un code d'appairage à usage unique (4.4).
   - Lien réalisé par pi-appliance : `#add?id=…&l=…&n=…&s=…&w=…`, un paramètre `s` par service, valeur `<nom>,<adresse>` coupée à la première virgule ; `&c=<code>` à la fin, dans le code QR seulement.
   - **L'application lit le code elle-même** (« Scanner le code de mon Pi », caméra du téléphone, jsQR chargé seulement à ce moment-là ; un code QR qui ne vient pas d'une console est signalé et la lecture continue ; la caméra s'arrête dès qu'un code est lu ou qu'on quitte l'écran). Sur iPhone, l'application de l'écran d'accueil ne partage pas ses données avec Safari : un code scanné avec l'appareil photo ouvrirait Safari, et le Pi ajouté là n'apparaîtrait pas dans l'application. Sur Android, l'appareil photo marche aussi.
2. **Saisie à la main** : nom du Pi ou adresse IP (`192.168.1.196`) ; l'application complète `.local` et `/pi-appliance`.
3. **Recherche à la maison** : un navigateur ne peut pas lister les appareils du réseau (pas de mDNS depuis une page web). L'application essaie donc des noms connus — ceux de la liste, `pi-appliance.local`, `pi-appliance-2.local`… — et dit lesquels répondent. **Ses limites sont dites clairement à l'écran** :
   - elle ne trouve pas un Pi dont on ne connaît pas le nom ; pour un nouveau Pi, utiliser le code QR ou la liste des appareils de la box ;
   - à la maison, le certificat du Pi est fait par le Pi lui-même : tant que l'alerte du certificat n'a pas été acceptée dans ce navigateur (sur iPhone, dans l'application installée elle-même), la demande est refusée et l'application ne peut pas distinguer un Pi absent d'un Pi présent ;
   - Chrome demande la permission d'accéder « aux appareils de votre réseau local » : l'écran explique pourquoi avant que Chrome la demande.

### 4.2 Ouvrir un Pi

**Un seul bouton** par Pi : l'application choisit l'adresse elle-même, d'après l'état (4.3) — l'adresse sur internet si elle répond (vrai certificat, pas d'alerte), sinon celle de la maison — et l'ouvre **dans le navigateur habituel**, qui garde la connexion et l'alerte du certificat déjà acceptée. Elle ne parle pas à la console elle-même : la console a son propre écran de connexion. Les services du Pi sont des liens `https://<service>-<nom>.local` (TODO-2.61 de pi-appliance) ou leur adresse sur internet.

### 4.3 État et services

- **Demande `api/hello`** de la console (à ajouter dans pi-appliance, section 6) : sans connexion, autorisée pour `app.pi-appliance.com` (CORS, et l'autorisation de réseau privé de Chrome), elle rend le nom du Pi, sa version, son identifiant stable et ses services. N'importe qui qui connaît l'adresse du Pi sur internet peut la lire : choix accepté, les adresses des services sur internet étant déjà joignables par tous ; rien d'autre n'y figure. Sur internet, le Pi a un vrai certificat : l'état et les services s'y lisent de façon fiable. À la maison, seulement si l'alerte du certificat a été acceptée (4.1).
- **Sans `api/hello`** (Pi pas encore à jour) : l'application fait une simple demande dont elle ne peut pas lire la réponse ; elle aboutit si le Pi est joignable et son certificat accepté. Délai : 5 secondes.
- **Accès au réseau de la maison** : Chrome demande une autorisation pour qu'une page d'internet parle aux appareils de la maison. Pour qu'elle n'arrive pas sans explication, l'état à la maison n'est vérifié qu'après un geste de la personne (« Vérifier à la maison » sur « Mes Pi », ou « Lancer la recherche »), précédé d'une phrase qui dit pourquoi ; ensuite à chaque ouverture. Avant, l'écran dit « à la maison : pas encore vérifié ».
- **État affiché toujours**, même incertain : « répond à la maison », « répond sur internet », « ne répond pas », avec une mention quand il est incertain (par exemple « ne répond pas — ou alerte du certificat pas encore acceptée »).
- **Services mis à jour par le Pi** : à chaque ouverture de l'application, la liste des services de chaque Pi qui répond est relue dans `api/hello` ; le code QR donne la première liste.

### 4.4 Appairage : ouvrir la console sans mot de passe

**Réalisé côté application** (2026-11-21, `cle.js`, essayé dans Chromium avec un faux Pi) ; attend pi-appliance.

Choix de l'utilisateur du 2026-11-21 (A1, B1, C2) : un téléphone appairé à un Pi ouvre la console déjà connecté, sans retaper l'identifiant ni le mot de passe.

- **Clé du téléphone** : à son premier appairage, l'application crée une paire de clés ECDSA P-256 avec le navigateur (WebCrypto), la clé secrète **non exportable**, gardée dans IndexedDB : le navigateur s'en sert pour signer, mais personne ne peut la lire, pas même l'application. Une seule clé par téléphone, pour tous ses Pi. Elle est désignée par son empreinte (RFC 7638, SHA-256 en base64url).
- **Appairage, une fois par Pi** : le code QR de « Mon Pi », affiché seulement à l'administrateur connecté, porte un **code d'appairage** (`c`) valable 10 minutes et une seule fois ; le lien à partager ne le porte pas. Après « Ajouter et appairer », l'application ouvre dans le navigateur une page du Pi en lui envoyant (formulaire `POST`, rien dans l'adresse) le code, la clé publique, un nom d'appareil et une preuve signée ; le Pi enregistre la clé pour le compte qui a affiché le code et ouvre la console, déjà connectée.
- **Connexion** : « Ouvrir » envoie de la même façon un message signé (le Pi, l'heure, un numéro à usage unique) ; le Pi vérifie la signature et ouvre la session. Comme l'application ne lit aucune réponse du Pi, le certificat fait par le Pi ne bloque rien (une fois son alerte acceptée).
- **À la maison seulement** : pi-appliance ferme l'appairage, la connexion et le retrait sur internet (Traefik) ; l'application les envoie donc toujours à l'adresse `.local`. Loin de chez soi (adresse de la maison vérifiée sans réponse, adresse sur internet qui répond), « Ouvrir » ouvre l'adresse sur internet, et la console demande le mot de passe.
- **Double authentification** (B1) : un appairage fait pendant une session avec double authentification compte pour les deux facteurs.
- **Durée et rupture** (C2) : sans limite, mais l'appairage peut être rompu **des deux côtés** : dans la console du Pi (« Mon compte → Appareils → Retirer », par exemple pour un téléphone perdu), ou dans l'application (« Désappairer », ou « Supprimer » un Pi appairé), qui envoie au Pi un message signé pour qu'il oublie la clé du téléphone. Si le Pi ne répond pas à ce moment-là, l'application ne se sert plus de l'appairage, et l'écran dit de retirer l'appareil dans la console.
- **Si le Pi ne reconnaît plus le téléphone** (appareil retiré, Pi remis à zéro) : la console affiche son écran de connexion habituel ; rescanner le code QR appaire de nouveau.
- Protocole détaillé : [demande-pi-appliance.md](demande-pi-appliance.md), section 4.

## 5. Écrans

- **Premier écran** : « Mes Pi » s'il y a au moins un Pi ; sinon un accueil avec « Ajouter mon Pi » et « Lire la documentation ».
- **Installation sur l'écran d'accueil** : une aide toujours présente dans le menu, jamais proposée d'elle-même : bouton « Installer » avec Chrome sur Android ; menu ⋮ puis « Ajouter à l'écran d'accueil » avec Firefox sur Android, qui n'a pas ce bouton ; « Partager » puis « Sur l'écran d'accueil » sur iPhone. Installation essayée sur l'Android de l'utilisateur le 2026-11-21 : réussie avec Chrome ; avec Firefox, le bouton n'existe pas.
- **Langue** : celle du téléphone, avec un choix dans les réglages, quand il y aura plus d'une langue (1.1).

## 6. À faire dans pi-appliance

Cette application attend de la console de pi-appliance (demande à reprendre dans une session de pi-appliance, TODO-5.16 ; texte dans [demande-pi-appliance.md](demande-pi-appliance.md)) :

- le code QR et le lien de partage dans « Mon Pi » (4.1) ;
- la demande `api/hello` (4.3) ;
- l'appairage et la connexion par la clé du téléphone, et la liste des appareils dans « Mon compte » (4.4) ;
- un lien « Application mobile » sur www.pi-appliance.com et dans la console.

## 7. Questions ouvertes

Toutes les questions de [questions.md](questions.md) sont tranchées (2026-11-21). Restent :

- FAQ : à écrire dans pi-appliance (TODO-5.9) avant d'être reprise ici.
- Traduction de la documentation elle-même (TODO-5.11 de pi-appliance).
- Application dans les magasins (Play Store par une *Trusted Web Activity*) : pas pour l'instant.
