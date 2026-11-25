# Questions pour finir la spécification

Les 30 premières questions ont été tranchées le 2026-11-21 et sont reprises dans la [spécification](specification.md). Les précisions 31 à 37, nées des réponses, ont été tranchées aussi, le même jour : toutes les questions sont reprises dans la spécification. Les questions 38 et 39 (application Android, 2026-11-25) attendent une réponse. Chaque question a des choix numérotés ; celui que je propose est marqué **(proposé)**. Écrire après **Réponse :** le numéro choisi, ou un autre choix en quelques mots.

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
