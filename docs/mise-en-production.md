# Mise en production à `app.pi-appliance.com`

L'application est publiée par GitHub Pages (workflow « Site », source « GitHub Actions »), aujourd'hui à l'adresse provisoire `https://gmoulard.github.io/pi-appliance-pwa/`. Le dépôt est prêt pour `https://app.pi-appliance.com` (fichier `CNAME`, adresses relatives dans le manifeste et le *service worker*, vérification `outils/production.cjs`). Restent trois gestes, à faire par l'utilisateur, **dans cet ordre** (TODO-1.6). Aucun secret n'est demandé ici : la CLI AWS lit ses clés dans `%USERPROFILE%\AWS\.aws`, comme dans `docs/environnement.md` de pi-appliance.

## 1. Déclarer le domaine dans GitHub Pages

GitHub demande de déclarer le domaine **avant** de créer l'entrée DNS (sinon un autre compte pourrait le prendre). Avec une publication par GitHub Actions, le fichier `CNAME` du site est ignoré : le domaine se règle seulement ici.

1. https://github.com/gmoulard/pi-appliance-pwa/settings/pages
   « Build and deployment » → « Source » doit être **« GitHub Actions »**, pas « Deploy from a branch ». Le 2026-11-25, une construction « pages build and deployment » (Jekyll, branche `main`) tournait encore à chaque changement de `main`, en plus du workflow « Site » : elle publie le dépôt tel quel, sans la documentation, sans `version.json` et sans `.well-known/` (Jekyll ignore les dossiers commençant par un point), et la dernière publication arrivée l'emporte.
2. « Custom domain » : `app.pi-appliance.com`, puis « Save ». Le contrôle DNS échoue tant que l'étape 2 n'est pas faite : c'est normal.

Facultatif, contre la prise du domaine par un autre compte : https://github.com/settings/pages → « Add a domain » → `pi-appliance.com`, puis créer l'entrée `TXT` qu'il indique (si ce n'est pas déjà fait pour www.pi-appliance.com).

## 2. Créer l'entrée DNS dans Route 53

Enregistrement `app.pi-appliance.com CNAME gmoulard.github.io` (TTL 300), dans la zone `Z01037363SBTB2LIT0ZB4`. Le fichier de la demande est [`dns-app.json`](dns-app.json) (`UPSERT` : relancer la commande ne crée pas de doublon).

Dans PowerShell, depuis la racine de ce dépôt :

```powershell
docker run --rm -v "$env:USERPROFILE\AWS\.aws:/root/.aws:ro" -v "${PWD}\docs:/demande:ro" amazon/aws-cli route53 change-resource-record-sets --hosted-zone-id Z01037363SBTB2LIT0ZB4 --change-batch file:///demande/dns-app.json
```

La réponse donne un `Id` (`/change/C…`) à l'état `PENDING`. Vérifier, une minute plus tard :

```powershell
docker run --rm -v "$env:USERPROFILE\AWS\.aws:/root/.aws:ro" amazon/aws-cli route53 list-resource-record-sets --hosted-zone-id Z01037363SBTB2LIT0ZB4 --query "ResourceRecordSets[?Name=='app.pi-appliance.com.']"
nslookup app.pi-appliance.com
```

`nslookup` doit répondre `gmoulard.github.io` (alias) et les adresses `185.199.108-111.153`.

## 3. Activer HTTPS

De retour sur https://github.com/gmoulard/pi-appliance-pwa/settings/pages : quand le contrôle DNS est passé (« DNS check successful »), GitHub demande le certificat (quelques minutes, jusqu'à 24 heures). Cocher alors **« Enforce HTTPS »**. Dès ce moment, `https://gmoulard.github.io/pi-appliance-pwa/` renvoie vers `https://app.pi-appliance.com/`.

## 4. Vérifier

- Relancer le workflow « Site » (Actions → Site → « Run workflow ») : son dernier job, « verifier », lance `node outils/production.cjs` contre le site en ligne (certificat, page, manifeste, *service worker*, icônes, version publiée, renvoi de http vers https et de l'ancienne adresse). Il est marqué en échec sans bloquer la publication tant que le domaine n'est pas en service.
- Ou sur un poste avec Node 22 : `npm ci --prefix outils`, puis `node outils/production.cjs` (avec Playwright installé, le *service worker* est aussi essayé dans Chromium).
- Sur le téléphone : ouvrir `https://app.pi-appliance.com`, puis l'installer (menu → « Installer l'application » → « Installer »).

## Ce qui change pour qui a installé l'application provisoire

L'adresse provisoire et la nouvelle ne partagent pas leurs données (le navigateur les range à part). Sur un téléphone où l'application a été installée depuis `gmoulard.github.io` : installer l'application depuis `https://app.pi-appliance.com`, y ajouter de nouveau ses Pi (code QR de la console : il appaire aussi le téléphone), puis retirer l'ancienne application. Le Pi garde l'ancien téléphone dans « Mon compte → Appareils » : l'y retirer.

## Après

- pi-appliance accepte `https://app.pi-appliance.com` et, pour l'instant, l'adresse provisoire `https://gmoulard.github.io` (`api/hello`, appairage, connexion : `internal/console/devices.go`). Une fois le renvoi en place, l'adresse provisoire pourra y être retirée, ainsi que sa mention dans le guide utilisateur de pi-appliance.
- Application Android : voir ci-dessous. Son fichier `.well-known/assetlinks.json` n'a de sens qu'à la racine de `https://app.pi-appliance.com` (pas sous `gmoulard.github.io/pi-appliance-pwa/`) : la partie Android suppose le domaine en service.

# Application Android sur la Play Store

L'application Android est une *Trusted Web Activity* : une petite application qui ouvre `https://app.pi-appliance.com` dans Chrome, en plein écran (spécification 2, TODO-1.8 à TODO-1.10). Le dépôt contient le projet (`android/`), le workflow « Android » qui le construit et le signe, et la publication de `.well-known/assetlinks.json` par le workflow « Site ». **Aucune clé, aucun mot de passe ne va dans le dépôt** : la clé reste sur ton PC (et dans ta sauvegarde), ses mots de passe dans les secrets GitHub.

À faire dans cet ordre, une fois `https://app.pi-appliance.com` en service (partie précédente).

## 1. Choisir l'identifiant de l'application

Proposé : `com.pi_appliance.app` (question 38 de [questions.md](questions.md)). Il ne se change plus après la première mise en ligne. Pour en prendre un autre : changer `paquet=` dans `android/gradle.properties`, c'est le seul endroit.

## 2. Créer la clé d'envoi

Avec la signature par Google Play (*Play App Signing*, question 39, proposée), Google garde la clé qui signe l'application chez les gens ; la tienne sert seulement à envoyer les versions à la Play Console (perdue, elle se remplace par une demande au support). Dans PowerShell, **hors du dépôt** (Java n'a pas besoin d'être installé : Docker suffit, comme pour la CLI AWS) :

```powershell
mkdir "$env:USERPROFILE\pi-appliance-android"
docker run --rm -it -v "$env:USERPROFILE\pi-appliance-android:/cle" eclipse-temurin:17 keytool -genkeypair -v -keystore /cle/pi-appliance-envoi.jks -storetype PKCS12 -alias envoi -keyalg RSA -keysize 4096 -validity 10000 -dname "CN=pi-appliance, C=FR"
```

`keytool` demande un mot de passe (deux fois) : le noter dans ton gestionnaire de mots de passe, et y garder aussi une copie du fichier `pi-appliance-envoi.jks`. Avec ce format (PKCS12), le mot de passe de la clé est le même que celui du fichier.

Empreinte de cette clé (servira à l'étape 6) :

```powershell
docker run --rm -it -v "$env:USERPROFILE\pi-appliance-android:/cle" eclipse-temurin:17 keytool -list -v -keystore /cle/pi-appliance-envoi.jks -alias envoi
```

La ligne `SHA256:` donne 32 octets du type `AB:CD:…`.

## 3. Ranger les secrets dans GitHub

https://github.com/gmoulard/pi-appliance-pwa/settings/secrets/actions → « New repository secret », quatre fois :

| Nom | Valeur |
|-----|--------|
| `ANDROID_KEYSTORE` | le fichier en base64 : `[Convert]::ToBase64String([IO.File]::ReadAllBytes("$env:USERPROFILE\pi-appliance-android\pi-appliance-envoi.jks")) \| Set-Clipboard`, puis coller |
| `ANDROID_KEYSTORE_PASSWORD` | le mot de passe choisi à l'étape 2 |
| `ANDROID_KEY_ALIAS` | `envoi` |
| `ANDROID_KEY_PASSWORD` | le même mot de passe |

Puis Actions → Android → « Run workflow ». Le résultat (onglet « Summary », en bas : « Artifacts ») contient `pi-appliance.aab` (pour la Play Console), `pi-appliance.apk` (signé, à installer à la main) et `pi-appliance-essai.apk` (débogage) ; le résumé donne l'empreinte de la clé d'envoi. Sans les secrets, le workflow donne seulement `pi-appliance-essai.apk` et un AAB non signé, que la Play Console refuse.

Essai avant la Play Store : copier `pi-appliance-essai.apk` sur le téléphone, l'ouvrir (Android demande d'autoriser l'installation depuis l'application Fichiers). L'application s'ouvre avec une barre d'adresse en haut : c'est normal tant que le lien de l'étape 6 n'est pas fait. La désinstaller avant d'installer celle de la Play Store (elles ne sont pas signées par la même clé).

## 4. Ouvrir un compte développeur Google Play

https://play.google.com/console/signup, avec ton compte Google :

- compte **personnel** ; frais d'inscription uniques de **25 dollars US** (carte bancaire) ;
- **vérification d'identité** : pièce d'identité, adresse, numéro de téléphone ; compter quelques jours ;
- les comptes personnels récents doivent faire un **test fermé avec au moins 12 testeurs pendant 14 jours** avant de pouvoir publier pour tous (règle de Google à relire au moment de l'inscription) : le test interne de l'étape 7 n'en dispense pas.

## 5. Créer l'application dans la Play Console

« Créer une application » : nom `pi-appliance`, langue par défaut **français (France)**, « Application », « Gratuite » ; accepter les règles.

Puis « Tests » → « Test interne » → « Créer une release » : la signature par Google Play est proposée (« Utiliser la signature d'application Google Play ») ; l'accepter, importer `pi-appliance.aab` de l'étape 3. Nom de la release : celui proposé (le numéro de version).

## 6. Relier l'application au site

Play Console → « Tester et publier » → « Configuration » → « Intégrité de l'application » → « Signature d'application » : deux certificats, chacun avec son « Empreinte du certificat SHA-256 » :

- « Certificat de la clé de signature d'application » (celle de Google : c'est celle des téléphones) ;
- « Certificat de la clé d'importation » (ta clé d'envoi, la même qu'à l'étape 2).

https://github.com/gmoulard/pi-appliance-pwa/settings/variables/actions → « New repository variable » : nom `ANDROID_EMPREINTES_SHA256`, valeur les deux empreintes séparées par une virgule (`AB:CD:…, 12:34:…`). Ce n'est pas un secret : elles sont publiques. Puis Actions → Site → « Run workflow ».

Vérifier : https://app.pi-appliance.com/.well-known/assetlinks.json montre le paquet et les deux empreintes, et l'outil de Google le confirme : https://developers.google.com/digital-asset-links/tools/generator (domaine `app.pi-appliance.com`, paquet, empreinte de Google → « Test statement »).

## 7. Fiche de la Play Store

« Développer la présence sur le Play Store » → « Fiche principale du Play Store ». Textes prêts à copier :

- **Nom de l'application** (30 caractères au plus) : `pi-appliance`
- **Description courte** (80 au plus) : `Votre Raspberry Pi pi-appliance dans la poche, et sa documentation sans réseau.`
- **Description complète** :

```
pi-appliance transforme un Raspberry Pi en petit serveur pour la maison : photos, fichiers, sites et services, que vous gérez depuis une console web, sans ligne de commande.

Cette application l'accompagne sur votre téléphone :

• La documentation dans la poche, lisible même sans réseau : premier démarrage, Wi-Fi de configuration, mot de passe oublié, que faire quand quelque chose ne va pas.

• Mes Pi : la liste de vos Raspberry Pi, chacun avec un bouton qui ouvre sa console, à la maison comme en déplacement. Un Pi s'ajoute en scannant le code QR affiché par sa console, en tapant son nom, ou par une recherche à la maison.

• Plus de mot de passe à retaper : une fois le téléphone appairé à votre Pi, la console s'ouvre directement. La clé qui le permet ne quitte jamais votre téléphone.

Rien ne vous est demandé : ni compte, ni inscription. L'application ne collecte rien, n'affiche aucune publicité et ne contient aucun traceur. La liste de vos Pi reste sur votre téléphone.

Il faut un Raspberry Pi avec pi-appliance pour la partie « Mes Pi » ; la documentation se lit sans. Logiciel libre (licence AGPL-3.0) : https://github.com/gmoulard/pi-appliance-pwa
```

- **Icône** 512 × 512 : `icones/icone-512.png` du dépôt.
- **Image de présentation** 1024 × 500 (obligatoire) et **au moins deux captures d'écran** du téléphone (accueil « Mes Pi », une page de documentation) : à faire sur le téléphone avec l'application installée.
- **Catégorie** : « Outils » ; **adresse e-mail** de contact : la tienne (elle est publique sur la fiche).
- **Politique de confidentialité** (« Contenu de l'application ») : `https://app.pi-appliance.com/confidentialite.html` (page du dépôt `confidentialite.html` : l'application ne collecte rien).
- **Sécurité des données** : « Votre application collecte-t-elle ou partage-t-elle des données utilisateur ? » → **Non**.
- **Annonces** : non. **Accès à l'application** : tout est accessible sans identifiant (la documentation se lit sans Pi ; expliquer que la console demande un Raspberry Pi à soi). **Classification du contenu** : remplir le questionnaire (aucun contenu sensible : tous publics). **Public cible** : 18 ans et plus (l'application n'est pas faite pour les enfants : cela évite les règles « Familles »). Applications d'actualités, gouvernementales, financières, de santé : non.

## 8. Première mise en ligne en test interne

« Test interne » → « Testeurs » : créer une liste avec ton adresse Gmail, enregistrer, copier le « lien d'adhésion ». Envoyer la release de l'étape 5 (« Examiner la release » → « Lancer le déploiement »). Sur le téléphone, ouvrir le lien d'adhésion, accepter, installer depuis la Play Store.

C'est réussi si l'application s'ouvre **sans barre d'adresse** (le lien de l'étape 6 est vérifié), lit la documentation en mode avion et ouvre un Pi (TODO-1.10). Ensuite : test fermé (12 testeurs, 14 jours, étape 4), puis « Production ».

## Nouvelles versions

Le contenu vient du site : une nouvelle documentation ou un changement de l'application web arrive sans nouvelle version Android. Il n'en faut une que si `android/` change : le workflow « Android » repart, son numéro de construction sert de numéro de version (toujours croissant, comme l'exige la Play Store) ; importer le nouveau `pi-appliance.aab` dans la Play Console.
