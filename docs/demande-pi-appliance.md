# Demande pour pi-appliance

Changements à faire dans la console de [pi-appliance](https://github.com/gmoulard/pi-appliance) pour l'application mobile (TODO-5.16 de pi-appliance ; [spécification de l'application](specification.md), sections 4 et 6). À reprendre dans une session de pi-appliance : cette session ne peut pas y écrire. Rédigé le 2026-11-21 (questions 12, 16, 22, 31 et 32 de [questions.md](questions.md)).

## 1. Code QR et lien dans « Mon Pi »

- Dans « Mon Pi », pour l'administrateur connecté seulement : une carte « Application mobile » avec un code QR et le même lien, prêt à copier ou à partager.
- Lien : `https://app.pi-appliance.com/#add?` suivi de paramètres d'adresse (encodés comme une adresse web) :
  - `n` : nom du Pi (`controltower`) ;
  - `l` : adresse à la maison (`https://controltower.local/pi-appliance`) ;
  - `w` : adresse sur internet, s'il en a une ;
  - `id` : identifiant stable et non secret, l'empreinte de la clé publique du Pi (`device.key`, Ed25519), par exemple les 16 premiers caractères de son SHA-256 en hexadécimal ;
  - `s` : services, une entrée par service, nom et adresse.
  - `c` : **code d'appairage** (section 4), dans le code QR seulement, **jamais dans le lien à partager**.
- Jamais de mot de passe, de clé privée ni de jeton durable.
- Le code QR est dessiné par la console elle-même, sans service extérieur.

## 2. Demande `api/hello`

- `GET /pi-appliance/api/hello`, sans connexion.
- Réponse JSON : `{"name", "version", "id", "services": [{"name", "address"}]}`.
- En-têtes : `Access-Control-Allow-Origin: https://app.pi-appliance.com` ; à la demande préalable du navigateur (`OPTIONS`), aussi `Access-Control-Allow-Private-Network: true` (Chrome, accès au réseau local).
- Rien d'autre : ni état du système, ni comptes.

## 3. Liens vers l'application

- www.pi-appliance.com : lien « Application mobile » vers `https://app.pi-appliance.com`.
- Console : le même lien, dans « Mon Pi » (carte du point 1) ou en bas de page.

## 4. Appairage : connexion sans mot de passe

Choix de l'utilisateur du 2026-11-21 (spécification de l'application, 4.4) : A1 code d'appairage dans le code QR, B1 l'appairage compte pour la double authentification, C2 pas de limite de durée.

### 4.1 Clé du téléphone

- Paire de clés **ECDSA P-256 / SHA-256** créée par l'application (WebCrypto), clé secrète non exportable, une par téléphone.
- Clé publique transmise en JWK : `{"kty":"EC","crv":"P-256","x":"…","y":"…"}` (`x`, `y` en base64url).
- Empreinte de la clé : **RFC 7638** (SHA-256 du JSON `{"crv":"P-256","kty":"EC","x":"…","y":"…"}`, membres dans cet ordre, sans espaces), en base64url sans `=`.
- Messages signés : champs séparés par `|`, sans retour à la ligne (un navigateur change `\n` en `\r\n` dans un formulaire envoyé).
- Signature : format WebCrypto, `r‖s` (64 octets) en base64url sans `=` ; en Go : `r` = 32 premiers octets, `s` = 32 suivants, `ecdsa.Verify(pub, sha256(message), r, s)`.

### 4.2 Code d'appairage

- Créé à l'affichage de la carte « Application mobile » pour l'administrateur connecté : 16 octets aléatoires en base64url (`c`), valable **10 minutes**, **une seule fois**, lié au compte qui l'a affiché (et à son état de double authentification au moment de l'affichage). Un nouveau code remplace le précédent.
- Le lien à partager (copier, partager) ne porte pas `c`.

### 4.3 Appairage : `POST /pi-appliance/appareil/appairer`

Formulaire (`application/x-www-form-urlencoded`), envoyé par une navigation dans un nouvel onglet (pas par `fetch`) :

| Champ | Contenu |
|-------|---------|
| `code` | le code d'appairage `c` |
| `cle` | la clé publique, JWK en JSON |
| `appareil` | nom de l'appareil, 64 caractères au plus (« Téléphone Android », modifiable ensuite dans la console) |
| `message` | `appairer\|<id du Pi>\|<code>` |
| `signature` | signature de `message` (preuve que le téléphone a la clé secrète) |

Le Pi vérifie le code (existant, non expiré, non utilisé), la signature, et que `<id du Pi>` est le sien ; il enregistre `{empreinte, clé publique, nom, compte, date d'appairage, dernière utilisation}` dans ses fichiers (droits 600, gardés après les redémarrages et les mises à jour), puis ouvre une session pour le compte (section 4.5). Erreur (code expiré, déjà utilisé, signature fausse) : page de la console en langage courant (« Ce code a expiré : affichez de nouveau le code QR dans Mon Pi »), sans session.

### 4.4 Connexion : `POST /pi-appliance/appareil/connexion`

Même façon d'envoyer :

| Champ | Contenu |
|-------|---------|
| `cle` | empreinte de la clé (RFC 7638) |
| `message` | `connexion\|<id du Pi>\|<heure en secondes Unix>\|<numéro à usage unique, 16 octets en base64url>` |
| `signature` | signature de `message` |

Le Pi vérifie : empreinte connue et non retirée, compte actif, signature, `<id du Pi>` le sien, heure à **5 minutes** près, numéro jamais vu (gardé le temps de la fenêtre). Puis il ouvre une session (section 4.5) et met à jour la date de dernière utilisation. Refus : écran de connexion habituel de la console, avec une phrase (« Ce téléphone n'est plus reconnu par le Pi : connectez-vous, puis rescannez le code QR de Mon Pi pour l'appairer de nouveau »).

Limiter les essais comme pour la connexion par mot de passe.

### 4.5 Session ouverte

- Même session qu'après une connexion par mot de passe ; la double authentification est considérée comme faite si elle l'était à l'affichage du code d'appairage (B1).
- Le cookie de session est `SameSite=Strict` : posé en réponse à une demande venue d'un autre site (`app.pi-appliance.com`), il ne serait pas envoyé à une redirection immédiate. Répondre donc par une petite page de la console qui passe ensuite à la console par une navigation du même site (lien ou redirection en JavaScript), pour que la session soit vue tout de suite.
- Les demandes `POST` venues de `app.pi-appliance.com` sont attendues sur ces deux adresses seulement (contrôle d'origine : `Origin: https://app.pi-appliance.com`, ou l'adresse provisoire `https://gmoulard.github.io` tant que le domaine n'est pas en place).

### 4.6 Rupture depuis l'application : `POST /pi-appliance/appareil/retirer`

Même façon d'envoyer que la connexion :

| Champ | Contenu |
|-------|---------|
| `cle` | empreinte de la clé (RFC 7638) |
| `message` | `retirer\|<id du Pi>\|<heure en secondes Unix>\|<numéro à usage unique>` |
| `signature` | signature de `message` |

Mêmes vérifications que la connexion ; puis le Pi retire l'appareil (sa clé ne vaut plus rien) et affiche une page de la console : « Ce téléphone n'est plus appairé à ce Pi », **sans ouvrir de session**. Clé inconnue ou déjà retirée : même page (le résultat voulu est atteint).

### 4.7 « Mon compte → Appareils »

- Liste des appareils appairés du compte : nom, date d'appairage, dernière utilisation ; bouton « Retirer » (la clé ne vaut plus rien) et « Renommer ».
- Sans limite de durée (C2) : un appareil reste appairé jusqu'à ce qu'il soit retiré, ici ou depuis l'application (4.6). Changer de mot de passe ne retire pas les appareils ; la remise à zéro du Pi les retire tous.

