# Publier pi-appliance sur l'App Store

Mode d'emploi pour l'utilisateur (TODO-1.12, questions 41 à 46 de [questions.md](questions.md)), repris de celui de NautiLink (`docs/etudes/app-store.md` de NautiLink) : même compte Apple Developer, même équipe, même clé d'API. Les étapes suivent l'ordre à respecter : chacune a besoin de la précédente. Compter une heure la première fois, sans la relecture d'Apple (un à trois jours en général).

Ce qui est automatique : à chaque changement de `ios/` ou des pages de l'application poussé sur `main`, et à la demande, le workflow « iPhone » (`.github/workflows/ios.yml`, sur macOS) construit le site (documentation de la dernière version de pi-appliance), l'embarque dans l'application et fabrique une IPA non signée (artefact de l'exécution) ; puis, si les quatre secrets de l'étape 3 sont posés, une version signée qu'il envoie à App Store Connect. Ce qui reste à la main : tout ce qui se passe dans les sites d'Apple (identifiant et sa capacité « Associated Domains », application, fiche, soumission) et la pose des secrets et de la variable `APPLE_TEAM_ID` dans GitHub.

Rien de secret ne va dans le dépôt ni dans une conversation : la clé `.p8` n'est collée que dans le formulaire des secrets de GitHub.

| Quoi | Valeur |
|------|--------|
| Identifiant de l'application (« Bundle ID ») | `com.pi-appliance.app` (question 42 ; écrit dans `ios/project.yml`) |
| Nom sur l'App Store et sous l'icône | pi-appliance |
| Appareils | iPhone seulement (`TARGETED_DEVICE_FAMILY` 1) : ni iPad, ni captures d'iPad |
| iOS | 16 au moins |
| Version | `MARKETING_VERSION` de `ios/project.yml`, aujourd'hui `1.0.0` |
| Numéro de build | numéro d'exécution du workflow « iPhone » (« run number »), qui augmente à chaque exécution |

**Changer de version** : le dépôt n'a pas de numéro de version (`CLAUDE.md`, « release »). Avant de soumettre une nouvelle version à Apple, changer la ligne `MARKETING_VERSION: "1.0.0"` de `ios/project.yml` (par exemple `1.1.0`), pousser sur `main` : le workflow construit et envoie le build avec cette version. Une version déjà publiée sur l'App Store ne peut pas recevoir de nouveau build.

## 1. Enregistrer l'identifiant de l'application

Site : [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list), avec le compte Apple Developer de NautiLink.

1. « Identifiers », bouton « + », choisir « App IDs », « Continue », puis « App », « Continue ».
2. « Description » : `pi-appliance`. « Bundle ID » : choisir « Explicit » et taper `com.pi-appliance.app`.
3. « Capabilities » : cocher **seulement « Associated Domains »** (liens universels, question 46 : le lien `https://app.pi-appliance.com/#add?…` du code QR de « Mon Pi », lu par l'appareil photo, ouvre l'application ; déclaré dans `ios/PiAppliance/PiAppliance.entitlements`). Rien d'autre : l'application n'a ni notifications, ni connexion avec Apple, ni iCloud, ni achat. L'appareil photo et le réseau local ne sont pas des capacités : ce sont des autorisations demandées à la personne (textes dans `ios/PiAppliance/Info.plist`). Identifiant déjà enregistré sans elle : « Identifiers », `com.pi-appliance.app`, cocher « Associated Domains », « Save » (« Confirm » si Apple prévient que les profils existants deviennent invalides : la signature automatique en refait un). Sans cette capacité, l'étape « App Store » du workflow échoue sur la signature.
4. « Continue », puis « Register ».
5. Appareil : l'équipe a déjà l'iPhone enregistré pour NautiLink (« Devices ») ; rien à faire. Sans au moins un appareil, l'envoi échoue avec « Your team has no devices from which to generate a provisioning profile » (voir le guide de NautiLink, § 1.5).

## 2. Créer l'application dans App Store Connect

Site : [App Store Connect](https://appstoreconnect.apple.com/), « Apps ».

1. Bouton « + », « Nouvelle app ».
2. Remplir :
   - **Plateformes** : iOS ;
   - **Nom** : `pi-appliance`. Le nom doit être libre sur l'App Store (il ne l'est pas toujours, même sans application de ce nom en vente). S'il est pris, App Store Connect le dit aussitôt ; propositions, dans l'ordre : `pi-appliance : mes Pi`, `pi-appliance mobile`, `Mes Pi – pi-appliance`. Le nom sous l'icône reste « pi-appliance » (il vient de l'application, pas de la fiche) ;
   - **Langue principale** : Français ;
   - **Identifiant de lot (Bundle ID)** : `com.pi-appliance.app` dans la liste (il y apparaît après l'étape 1) ;
   - **SKU** : une référence interne, jamais affichée, par exemple `pi-appliance-ios` ;
   - **Accès des utilisateurs** : « Accès complet ».
3. « Créer ». Rien à faire dans « Accords, impôts et opérations bancaires » : l'application est gratuite, sans achat.

## 3. Clé d'API et secrets dans GitHub

La clé d'API de NautiLink (`NautiLink GitHub`, rôle « Admin ») est une clé d'**équipe** : elle sert pour toutes les applications de l'équipe, donc aussi pour celle-ci. Inutile d'en créer une autre. Il faut seulement poser les mêmes valeurs dans ce dépôt-ci, car les secrets de GitHub appartiennent à un seul dépôt.

Valeurs : celles posées dans le dépôt NautiLink (GitHub ne les montre plus : les reprendre là où vous les avez gardées) :

- **Team ID** : [compte Apple Developer](https://developer.apple.com/account), « Membership details », ligne « Team ID » (10 caractères) ;
- **ID de la clé** et **ID de l'émetteur** : App Store Connect, « Utilisateurs et accès », « Intégrations », « Clés de l'API App Store Connect » : colonne « ID de la clé » sur la ligne de la clé, « ID de l'émetteur » en haut de la liste ;
- **le fichier `AuthKey_<ID de la clé>.p8`** gardé lors de sa création (Apple ne le donne qu'une fois). Perdu : créer une nouvelle clé « Admin » (guide de NautiLink, § 3), puis mettre à jour les secrets des deux dépôts.

Dépôt `gmoulard/pi-appliance-pwa` sur GitHub : « Settings », « Secrets and variables », « Actions », bouton « New repository secret ». Un secret à la fois : « Name » exactement comme ci-dessous, « Secret » avec la valeur, puis « Add secret ».

| Name | Valeur |
|------|--------|
| `APPLE_TEAM_ID` | le Team ID |
| `APP_STORE_CONNECT_KEY_ID` | l'ID de la clé |
| `APP_STORE_CONNECT_ISSUER_ID` | l'ID de l'émetteur |
| `APP_STORE_CONNECT_KEY_P8` | **le contenu du fichier `.p8` en clair** : l'ouvrir avec un éditeur de texte, tout copier, lignes `-----BEGIN PRIVATE KEY-----` et `-----END PRIVATE KEY-----` comprises, et le coller tel quel (le contenu encodé en base64 est aussi accepté) |

Le workflow écrit la clé dans `~/.appstoreconnect/private_keys/` sur la machine de construction, le temps de l'étape, puis l'efface. Tant qu'un des quatre secrets manque, l'étape « App Store » s'affiche comme sautée (« Étape sautée : secrets absents : … ») sans faire échouer l'exécution.

**Variable `APPLE_TEAM_ID`** (liens universels, question 46) : le Team ID n'est pas un secret, et le workflow « Site » doit pouvoir l'écrire dans le fichier public `https://app.pi-appliance.com/.well-known/apple-app-site-association` (un secret ne peut pas être publié). Même page de GitHub, onglet **« Variables »** (à côté de « Secrets »), bouton « New repository variable » : « Name » `APPLE_TEAM_ID`, « Value » le Team ID (10 caractères), « Add variable ». Puis onglet « Actions », workflow « Site », « Run workflow » sur `main` : le passage de chaque heure ne republie pas un site déjà à jour. Le workflow « iPhone » prend aussi cette variable si le secret `APPLE_TEAM_ID` n'est pas posé. Sans elle, le site ne publie pas le fichier et le lien du code QR s'ouvre dans Safari.

## 4. Premier envoi

1. GitHub, onglet « Actions », workflow « iPhone », « Run workflow » sur `main` (ou pousser un changement de `ios/`).
2. Dans l'exécution, étape « App Store (version signée envoyée à App Store Connect) » : elle se termine par « Version 1.0.0, build … envoyée à App Store Connect ». Compter 10 à 20 minutes pour l'exécution.
3. App Store Connect, « Apps », pi-appliance, onglet « TestFlight » : le build apparaît « En traitement », puis prêt après **10 à 30 minutes** ; Apple envoie un e-mail. Pour l'essayer avant la soumission : l'ajouter à un groupe de testeurs internes (vous), installer l'application TestFlight sur l'iPhone et y installer pi-appliance.
4. Essais sur l'iPhone (critères de TODO-1.12) : documentation lue en mode avion, puis, avec le réseau, pied de page de la documentation à la dernière version de pi-appliance (documentation téléchargée, question 45) et recherche qui marche ; « Scanner le code de mon Pi » devant « Mon Pi » de la console, « Ajouter et appairer » : la console s'ouvre **dans l'application**, déjà connectée ; « Retour » ; à la maison, « Vérifier à la maison », accepter « réseau local », état « Répond à la maison » ; « Ouvrir » : console déjà connectée ; un service s'ouvre dans Safari ; « Désappairer ». Liens universels (une fois `app.pi-appliance.com` en service, TODO-1.6, et la variable `APPLE_TEAM_ID` posée) : l'adresse `https://app-site-association.cdn-apple.com/a/v1/app.pi-appliance.com` (copie d'Apple, mise à jour en quelques heures) doit montrer le fichier ; le code QR de « Mon Pi » lu par l'appareil photo de l'iPhone propose alors d'ouvrir « pi-appliance ». Une application déjà installée relit le fichier à sa mise à jour : la réinstaller si le lien s'ouvre encore dans Safari.

L'IPA non signée (artefact `pi-appliance-iphone-<numéro>`) peut aussi s'installer sans l'App Store avec un outil comme Sideloadly ou AltStore et un identifiant Apple.

Messages courants (détail dans le guide de NautiLink, § 5) :

| Message | Cause et remède |
|---------|-----------------|
| `Cloud signing permission error` | Clé sans le rôle « Admin ». |
| `Your team has no devices from which to generate a provisioning profile` | Aucun iPhone enregistré dans l'équipe (§ 1.5). |
| `No profiles for 'com.pi-appliance.app' were found` | Identifiant pas encore enregistré (§ 1). |
| `The bundle version must be higher than the previously uploaded version` | Build déjà envoyé avec ce numéro : relancer le workflow (nouveau numéro). |
| Version refusée, `Invalid Pre-Release Train` | `MARKETING_VERSION` déjà publiée sur l'App Store : la changer (encadré plus haut). |
| `Missing Compliance` dans TestFlight | Ne devrait pas arriver : `ITSAppUsesNonExemptEncryption` vaut « non » (HTTPS du système seulement). |

## 5. Fiche App Store

App Store Connect, pi-appliance, onglet « Distribution », version « 1.0 Prepare for Submission » (la renommer `1.0.0`, comme `MARKETING_VERSION`). Les textes ci-dessous sont des propositions à relire.

### 5.1 Textes

- **Sous-titre** (30 caractères au plus) : « Votre Raspberry Pi en poche » (27).
- **Texte promotionnel** (facultatif) : « La documentation de pi-appliance lisible sans réseau, et vos Raspberry Pi à portée de main. »
- **Description** : « pi-appliance transforme un Raspberry Pi en petit serveur pour la maison. Cette application l'accompagne. La documentation dans la poche : premier démarrage, Wi-Fi de configuration, mot de passe oublié, diagnostic, lisibles même sans réseau, justement quand le Pi ou le Wi-Fi ne marchent pas. Mes Pi : ajoutez votre Raspberry Pi en scannant le code QR de sa console, ou en écrivant son nom ; l'application dit s'il répond à la maison ou sur internet, et ouvre sa console ou ses services d'un geste ; appairé, l'iPhone ouvre la console sans mot de passe. Aucun compte, aucune publicité, aucun traceur : tout reste sur votre iPhone. Il faut un Raspberry Pi avec pi-appliance (logiciel libre, www.pi-appliance.com) pour la partie Mes Pi. »
- **Mots-clés** (100 caractères au plus) : `raspberry,pi,serveur,maison,domotique,documentation,console,auto-hébergement,QR` (80).
- **URL d'assistance** (obligatoire) : `https://github.com/gmoulard/pi-appliance-pwa/issues` (ou `https://www.pi-appliance.com`).
- **URL marketing** (facultative) : `https://www.pi-appliance.com`.
- **Copyright** : `2026 Guillaume Moulard`.
- **Catégorie** : « Utilitaires » (secondaire : « Productivité »).

### 5.2 Captures d'écran

iPhone seulement : pas de captures d'iPad. 1 à 10 captures, PNG ou JPEG sans transparence, en portrait :

| Appareil | Pixels |
|----------|--------|
| iPhone 6,9 pouces (obligatoire) | 1320 × 2868 (ou 1290 × 2796) |
| iPhone 6,5 pouces (reprise de la 6,9 pouces si absente) | 1284 × 2778 (ou 1242 × 2688) |

Proposition : 3 à 4 captures faites sur l'iPhone avec l'application de TestFlight (boutons latéral et volume haut) : accueil, « Mes Pi » avec un Pi qui répond, une page de documentation, « Ajouter ce Pi ? » après un code QR. Une capture d'un iPhone plus petit doit être agrandie à la taille demandée ; Apple refuse les captures d'un autre appareil ou d'un navigateur.

### 5.3 Confidentialité

- **URL de la politique de confidentialité** (obligatoire) : la page `confidentialite.html` de l'application, qui existe déjà (« L'application pi-appliance ne collecte rien sur vous », section « Sur iPhone » comprise) : `https://app.pi-appliance.com/confidentialite.html` une fois le domaine en service (TODO-1.6), en attendant `https://gmoulard.github.io/pi-appliance-pwa/confidentialite.html`. Elle est aussi dans l'application (menu, « Confidentialité »).
- **Confidentialité de l'app** (« App Privacy ») : « Commencer », puis « Non, nous ne collectons pas de données de cette app ». C'est exact : l'application n'a pas de serveur ; elle ne parle qu'aux Raspberry Pi de la personne, et lit la documentation à jour sur le site de l'application par une simple demande, sans rien envoyer ; la liste des Pi, la clé de l'appairage et les certificats retenus restent sur l'iPhone ; ni compte, ni statistiques, ni rapport de plantage, ni publicité. Résultat affiché : « Aucune donnée collectée ».

### 5.4 Classement par âge

« Aucun » ou « Non » partout. Navigation web libre : **non** (l'application n'affiche que ses propres pages et la console des Raspberry Pi de la personne ; tout autre lien s'ouvre dans Safari). Pas de messagerie ni de contenu d'autres personnes. Résultat attendu : **4+**.

### 5.5 Prix et disponibilité

Gratuit. Disponibilité : tous les pays, ou ceux où l'on parle français (l'application n'est qu'en français pour l'instant, spécification 1.1).

### 5.6 Informations pour la relecture d'Apple

- **Connexion requise** : **non**. Il n'y a pas de compte : décocher « Connexion requise ». Pas de compte de démonstration.
- **Coordonnées** : nom, téléphone et e-mail pour qu'Apple puisse vous joindre.
- **Notes**, proposition (en anglais, la relecture se fait en anglais) :

  > pi-appliance is the free companion app of pi-appliance, open-source software that turns a Raspberry Pi into a small home server (https://www.pi-appliance.com, source code: https://github.com/gmoulard/pi-appliance-pwa). No account, no server, no data collected.
  >
  > Without a Raspberry Pi, you can test: (1) the offline documentation: turn on Airplane Mode, open "Lire la documentation" (Read the documentation), browse the pages and use the search field; (2) adding a Pi by hand: menu > "Ajouter un Pi", type "pi-appliance", "Ajouter": the Pi appears in "Mes Pi" (My Pis) with its status; "Vérifier à la maison" (Check at home) asks for the Local Network permission, then shows "Ne répond pas" (not responding), since there is no Raspberry Pi on your network; (3) the QR code scanner: "Scanner le code de mon Pi" opens the camera; a QR code that does not come from a pi-appliance console is rejected with a message.
  >
  > With a Raspberry Pi, the console shows a QR code in "Mon Pi"; the attached video shows the app scanning it, the Pi being added, its status read on the home network (Local Network permission, used only to reach the user's own Raspberry Pi) and "Ouvrir" (Open) showing the Pi's web console inside the app, already signed in thanks to a key kept on the iPhone ("Ajouter et appairer", pair). The camera is used only to read that QR code; the image never leaves the device. With a network connection, the app downloads the latest documentation pages (HTML and images only) from https://app.pi-appliance.com; no code is downloaded.
- **Pièce jointe** : une courte vidéo (une à deux minutes, filmée sur l'iPhone par l'enregistrement de l'écran) : code QR de « Mon Pi » scanné, « Ajouter et appairer », la console qui s'ouvre dans l'application, « Retour », « Mes Pi » avec « Répond à la maison », « Ouvrir » (console déjà connectée), puis la documentation en mode avion. Apple la demande souvent quand l'application sert un matériel que le relecteur n'a pas (règle 2.1).

## 6. Soumettre à la relecture

1. Dans la page de la version : section « Build », « Ajouter un build » et choisir le build reçu à l'étape 4.
2. « Ajouter pour vérification », puis « Soumettre à la vérification ».
3. Choisir la publication : automatique ou manuelle après l'acceptation.
4. Réponse d'Apple en général en 1 à 3 jours, dans le « Centre de résolution » en cas de refus : y répondre, ou corriger puis renvoyer un build (relancer le workflow).

Versions suivantes : changer `MARKETING_VERSION` dans `ios/project.yml`, pousser, puis dans App Store Connect « + » à côté de « iOS App », nouvelle version, choisir le build et soumettre. La documentation arrive seule sur les iPhone : l'application télécharge les pages à jour de `doc/` (question 45). Un changement des pages de l'application elle-même (« Mes Pi », styles, scripts) n'y arrive qu'avec une nouvelle version relue par Apple.

## 7. Risques de refus connus

| Règle d'Apple | Risque | Parade proposée |
|---------------|--------|-----------------|
| 4.2 : fonctionnalité minimale (une application qui n'est qu'un site dans une vue web est refusée) | L'application affiche des pages web. | Elle n'ouvre aucun site : ses pages et sa documentation sont **dans** l'application et marchent sans réseau ; elle ajoute ce qu'un site ne peut pas faire : lecture du code QR par l'appareil photo, accès au réseau de la maison pour parler aux Raspberry Pi, reconnaissance du certificat de chaque Pi. Le dire dans les notes (§ 5.6) et la vidéo. Elle ouvre aussi la console du Pi dans son propre écran, connectée sans mot de passe par une clé gardée sur l'iPhone (question 43). Si Apple refuse quand même, répondre dans le Centre de résolution en reprenant ces points. |
| 2.1 : application complète, testable | Le relecteur n'a pas de Raspberry Pi. | Notes et vidéo (§ 5.6) ; tout ce qui ne demande pas de Pi reste essayable (documentation, ajout à la main, lecteur). |
| 5.1.1 : autorisations expliquées | Appareil photo et réseau local. | Textes en clair dans `Info.plist`, demandés seulement au moment du geste (« Scanner », « Vérifier à la maison »). |
| 5.1.1 (i) : politique de confidentialité | — | `confidentialite.html` (§ 5.3). |
| 2.3 : fiche exacte | Fonctions décrites mais absentes. | L'ouverture sans mot de passe (appairage) est réalisée (question 43) : ne la garder dans la description qu'après l'avoir essayée sur l'iPhone (étape 4). |
| 2.5.2 : pas de code téléchargé | La documentation est téléchargée (question 45). | Seulement des pages HTML, `recherche.json` et des images de `doc/`, vérifiées par leur empreinte ; servies sans aucun script à elles (règle `Content-Security-Policy` : seuls les scripts de l'application, `app://`) ; le code de l'application ne change jamais ainsi. |

## 8. Une fois l'application acceptée

1. Relever l'adresse de l'App Store : App Store Connect, pi-appliance, « Distribution », lien « Voir sur l'App Store » ; forme `https://apps.apple.com/fr/app/pi-appliance/id1234567890`.
2. La donner pour l'ajouter à l'aide « Installer l'application » du site (Safari sur iPhone) et aux liens « Application mobile » de www.pi-appliance.com et de la console (spécification 6) : à faire dans une prochaine session.
