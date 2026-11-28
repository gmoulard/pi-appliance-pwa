# Questions pour finir la spécification

Les 30 premières questions ont été tranchées le 2026-11-21 et sont reprises dans la [spécification](specification.md). Les précisions 31 à 37, nées des réponses, ont été tranchées aussi, le même jour : toutes les questions sont reprises dans la spécification. Les questions 38 et 39 (application Android, 2026-11-25) et 40 (entrée DNS chez OVH, 2026-11-26), 43 à 46 (application iPhone, 2026-11-28) attendent une réponse ; 41 et 42 sont tranchées. Chaque question a des choix numérotés ; celui que je propose est marqué **(proposé)**. Écrire après **Réponse :** le numéro choisi, ou un autre choix en quelques mots.

### 31. « Lien de partage » (réponse à la question 12)

J'ai compris : la console montre, à côté du code QR, le même lien `https://app.pi-appliance.com/#add?...` prêt à envoyer par message.

1. Oui, c'est ça **(proposé)**
2. Non : un bouton dans l'application pour envoyer un de ses Pi à quelqu'un d'autre (famille)
3. Les deux

**Réponse :** 1

### 32. Ce que `api/hello` montre sans connexion (réponses 16 et 22)

Pour que les services soient mis à jour par le Pi, `api/hello` rend aussi la liste des services. Sans connexion, n'importe qui qui connaît l'adresse du Pi sur internet peut la lire.

1. D'accord : les adresses des services sur internet sont déjà joignables par tous **(proposé)**
2. Les services seulement à la maison ; sur internet, le nom et la version seulement
3. Pas de services dans `api/hello` : ils ne viennent que du code QR

**Réponse :** 1

### 33. Quelle adresse ouvre le bouton unique (réponse 18)

1. L'adresse sur internet si elle répond (vrai certificat, pas d'alerte), sinon celle de la maison **(proposé)**
2. L'adresse de la maison si elle répond, sinon celle d'internet

**Réponse :** 1

### 34. Fond de l'icône ailleurs qu'Android (réponse 2)

L'iPhone n'accepte pas d'icône transparente : il lui faut aussi un fond.

1. Framboise partout, comme Android **(proposé)**
2. Rose pâle (`#FFF5F7`) sur iPhone et dans le navigateur

**Réponse :** 1

### 35. Langue (réponse « 11 » à la question 26)

1. Tu voulais dire 1 : la langue du téléphone, avec un choix dans les réglages **(proposé)**
2. Tu voulais dire 2 : la langue du téléphone seulement

**Réponse :** 1

### 36. Navigateur sur ton Android 16 (One UI 8.5, Samsung)

1. Chrome **(proposé)**
2. Samsung Internet
3. Les deux

**Réponse :** 1

### 37. iPhone, sans téléphone pour l'essayer

1. L'application vise quand même l'iPhone ; ce qui n'a pas été essayé dessus est dit dans le TODO **(proposé)**
2. Android seulement dans la première version

**Réponse :** 1

## Appairage (2026-11-21)

Proposé après « J'aimerais ne plus jamais avoir à remplir mon identifiant et mon mot de passe une fois la connexion réussie ». Réponse : **A1, B1, C2**, reprise dans la spécification, 4.4.

- A. Code d'appairage dans le code QR : 1. accepté (10 minutes, une seule fois, administrateur connecté) ; 2. code à 6 chiffres à recopier. **Réponse : 1.**
- B. Double authentification : 1. l'appairage compte pour les deux facteurs ; 2. code demandé à chaque ouverture. **Réponse : 1.**
- C. Durée : 1. jusqu'au retrait, ou un an sans servir ; 2. jusqu'au retrait, sans limite. **Réponse : 2**, « avec rupture possible dans l'appli ou dans le Pi ».

## Application Android (2026-11-25)

Nées de la demande « générer l'appli en prod : Web App, Android, iPhone ». En attendant la réponse, le dépôt utilise le choix proposé.

### 38. Identifiant de l'application sur la Play Store

Il ne se change plus après la première mise en ligne. Il est écrit à un seul endroit : `paquet=` dans `android/gradle.properties`.

1. `com.pi_appliance.app` (le domaine `pi-appliance.com` à l'envers ; le tiret n'est pas permis) **(proposé)**
2. `com.piappliance.app`
3. Un autre, à dire

**Réponse :**

### 39. Signature de l'application

1. Signature par Google Play (*Play App Signing*) : la Play Store garde la clé de l'application ; la clé créée avec `keytool` ne sert qu'à envoyer les versions (perdue, elle se remplace) **(proposé)**
2. Sa propre clé seulement (perdue, l'application ne peut plus être mise à jour)

**Réponse :**

## Entrée DNS chez OVH (2026-11-26)

Née du passage de la zone `pi-appliance.com` chez OVH. En attendant la réponse, l'entrée est à créer à la main (`docs/mise-en-production.md`, étape 2).

### 40. Création de l'entrée `app` par un workflow

Un workflow pourrait créer l'entrée `CNAME` par l'API OVH, avec les secrets GitHub Actions `OVH_Application_name`, `OVH_Application_key`, `OVH_Application_secret` et `OVH_Consumer_Key` (définis dans pi-appliance, pas forcément dans ce dépôt).

1. À la main dans l'espace client OVH, une seule fois, sans secret dans ce dépôt **(proposé)**
2. Workflow « DNS » lancé à la demande, avec les quatre secrets copiés dans ce dépôt
3. Laisser pi-appliance créer l'entrée avec ses propres secrets

**Réponse :**

## Application iPhone (2026-11-28)

Née de la demande de l'utilisateur du 2026-11-28 : « Fabrique une appli iPhone pour pi-appliance » ; il a un compte Apple Developer (celui de NautiLink).

### 41. Forme de l'application iPhone

1. Application native publiée sur l'App Store : petite application Swift qui embarque les pages de l'application web (lisibles sans réseau) et ajoute la lecture native du code QR, l'accès au réseau de la maison et l'acceptation du certificat du seul Pi ajouté **(proposé)**
2. L'application web seule, dans Safari (« Sur l'écran d'accueil »)
3. Les deux

**Réponse :** 1 (2026-11-28).

### 42. Identifiant de l'application iPhone

1. `com.pi-appliance.app`
2. `org.moulard.piappliance`
3. Le même que l'Android (question 38)

**Réponse :** 1, `com.pi-appliance.app` (2026-11-28) ; compte Apple Developer : le même que NautiLink.

## Application iPhone, nées de sa réalisation (2026-11-28)

L'application est faite dans `ios/` (TODO-1.12) avec le premier choix de chaque question, sauf pour la 43 (choix 1 réalisé en attendant, conforme à la spécification 4.2).

### 43. Où s'ouvre la console d'un Pi dans l'application iPhone

La spécification (4.2) dit « dans le navigateur habituel » : sur l'iPhone, Safari. Mais l'appairage et la connexion sans mot de passe (4.4) envoient un formulaire au Pi dans le navigateur où la console s'ouvre, ce que l'application ne peut pas faire vers Safari. Réalisé en attendant : Safari, sans appairage.

1. Dans Safari, sans appairage : la console demande le mot de passe à chaque fois (réalisé)
2. Dans l'application, sur un écran plein avec un bouton « Retour » : appairage et connexion sans mot de passe comme sur Android, certificat du Pi déjà vérifié par l'application ; la connexion à la console n'est pas partagée avec Safari ; montre aussi à Apple une application plus complète (règle 4.2) **(proposé)**
3. Dans Safari, et l'appairage par un autre moyen à demander à pi-appliance

**Réponse :** 2, dans l'application, plein écran avec « Retour », appairage compris (2026-11-28).

### 44. Certificat fait par le Pi, dans l'application iPhone

Il est accepté pour un Pi de la liste seulement, retenu à la première connexion, refusé s'il change.

1. Rien à confirmer la première fois (ajouter le Pi vaut accord) ; s'il change, la fiche le dit, et il faut supprimer puis rajouter le Pi (réalisé) **(proposé)**
2. Demander la première fois : « Faire confiance à ce Pi ? »
3. Comme 1, plus un bouton « Faire de nouveau confiance » sur la fiche quand il a changé

**Réponse :** 1, rien à confirmer la première fois (2026-11-28).

### 45. Documentation embarquée dans l'application iPhone

Aujourd'hui, la documentation est celle de la dernière version de pi-appliance au moment où l'application est construite ; elle ne change qu'avec une nouvelle version de l'application, relue par Apple (un à trois jours). Sur le Web, elle suit chaque nouvelle version dans l'heure (spécification 3).

1. L'application télécharge elle-même les pages de documentation à jour (`doc/` seulement, d'après `version.json` du site, comme le *service worker*) et les garde ; les pages embarquées servent tant qu'il n'y a rien de plus récent ; le code de l'application ne change jamais ainsi **(proposé)**
2. Une nouvelle version de l'application à chaque version de pi-appliance (workflow lancé par la nouvelle étiquette, soumission à Apple à la main)
3. Documentation de la version de l'application, mise à jour avec elle seulement

**Réponse :** 1, l'application télécharge elle-même la documentation à jour (2026-11-28).

### 46. Code QR lu avec l'appareil photo de l'iPhone

Hors de l'application, l'appareil photo ouvre le lien `https://app.pi-appliance.com/#add?…` dans Safari, pas dans l'application.

1. Rien de plus : le code se lit dans l'application, « Scanner le code de mon Pi » (réalisé) **(proposé)**
2. Liens universels : ce lien ouvre l'application (fichier `apple-app-site-association` publié par le site, capacité « Associated Domains » de l'identifiant)

**Réponse :** 2, liens universels (2026-11-28).
