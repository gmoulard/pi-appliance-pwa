# Mise en production à `app.pi-appliance.com`

L'application est publiée par GitHub Pages (workflow « Site », source « GitHub Actions »), aujourd'hui à l'adresse provisoire `https://gmoulard.github.io/pi-appliance-pwa/`. Le dépôt est prêt pour `https://app.pi-appliance.com` (fichier `CNAME`, adresses relatives dans le manifeste et le *service worker*, vérification `outils/production.cjs`). Restent trois gestes, à faire par l'utilisateur, **dans cet ordre** (TODO-1.6). Aucun secret n'est demandé ici : la CLI AWS lit ses clés dans `%USERPROFILE%\AWS\.aws`, comme dans `docs/environnement.md` de pi-appliance.

## 1. Déclarer le domaine dans GitHub Pages

GitHub demande de déclarer le domaine **avant** de créer l'entrée DNS (sinon un autre compte pourrait le prendre). Avec une publication par GitHub Actions, le fichier `CNAME` du site est ignoré : le domaine se règle seulement ici.

1. https://github.com/gmoulard/pi-appliance-pwa/settings/pages
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
- Application Android (étape suivante) : le fichier `.well-known/assetlinks.json` d'une *Trusted Web Activity* devra être servi à `https://app.pi-appliance.com/.well-known/assetlinks.json` (à la racine du domaine : c'est possible seulement avec ce domaine, pas sous `gmoulard.github.io/pi-appliance-pwa/`) ; `outils/site.mjs` devra le copier.
