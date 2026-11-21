# Demande pour pi-appliance

Changements à faire dans la console de [pi-appliance](https://github.com/gmoulard/pi-appliance) pour l'application mobile (TODO-5.16 de pi-appliance ; [spécification de l'application](specification.md), sections 4 et 6). À reprendre dans une session de pi-appliance : cette session ne peut pas y écrire. Rédigé le 2026-11-21 ; à compléter selon les réponses aux questions 31 et 32 de [questions.md](questions.md).

## 1. Code QR et lien dans « Mon Pi »

- Dans « Mon Pi », pour l'administrateur connecté seulement : une carte « Application mobile » avec un code QR et le même lien, prêt à copier ou à partager.
- Lien : `https://app.pi-appliance.com/#add?` suivi de paramètres d'adresse (encodés comme une adresse web) :
  - `n` : nom du Pi (`controltower`) ;
  - `l` : adresse à la maison (`https://controltower.local/pi-appliance`) ;
  - `w` : adresse sur internet, s'il en a une ;
  - `id` : identifiant stable et non secret, l'empreinte de la clé publique du Pi (`device.key`, Ed25519), par exemple les 16 premiers caractères de son SHA-256 en hexadécimal ;
  - `s` : services, une entrée par service, nom et adresse.
- Jamais de mot de passe, de clé privée ni de jeton.
- Le code QR est dessiné par la console elle-même, sans service extérieur.

## 2. Demande `api/hello`

- `GET /pi-appliance/api/hello`, sans connexion.
- Réponse JSON : `{"name", "version", "id", "services": [{"name", "address"}]}`.
- En-têtes : `Access-Control-Allow-Origin: https://app.pi-appliance.com` ; à la demande préalable du navigateur (`OPTIONS`), aussi `Access-Control-Allow-Private-Network: true` (Chrome, accès au réseau local).
- Rien d'autre : ni état du système, ni comptes.

## 3. Liens vers l'application

- www.pi-appliance.com : lien « Application mobile » vers `https://app.pi-appliance.com`.
- Console : le même lien, dans « Mon Pi » (carte du point 1) ou en bas de page.
