# Questions pour finir la spécification

Questions posées le 2026-11-21 pour compléter la [spécification](specification.md). Chaque question a des choix numérotés ; celui que je propose est marqué **(proposé)**. Écrire après **Réponse :** le numéro choisi, ou un autre choix en quelques mots. Une fois tranchée, la réponse passe dans la spécification et la question est retirée d'ici.

Les questions marquées ⚠️ changent la conception : elles viennent de limites des navigateurs repérées en préparant la liste.

## A. Nom, icône, publication

### 1. Nom sous l'icône du téléphone

1. « pi-appliance » **(proposé)**
2. « Mes Pi »
3. Autre (l'écrire)

**Réponse :** 

### 2. Icône

Le symbole « La maison » de la charte. Android demande aussi une icône sur fond plein, qu'il découpe en rond ou en carré.

1. Le symbole sur fond rose pâle (`#FFF5F7`), même dessin partout **(proposé)**
2. Le symbole sur fond blanc
3. Le symbole sur fond framboise (`#C71F5D`), pour Android seulement

**Réponse :** 

### 3. Branche publiée par GitHub Pages

1. `master`, comme pi-appliance **(proposé)**
2. `main`

**Réponse :** 

### 4. Lien vers l'application (« Application mobile »)

1. Sur www.pi-appliance.com et dans la console, à faire dans pi-appliance **(proposé)**
2. Sur www.pi-appliance.com seulement
3. Nulle part pour l'instant

**Réponse :** 

## B. Documentation hors ligne

### 5. Pages reprises

Toujours reprises : guide utilisateur, installation et flashage, marketplace, premier démarrage (image), future FAQ. Toujours dehors : les pages pour le projet (spécification, TODO, environnement, prototype, manGit, charte).

1. Ajouter aussi `essais-plusieurs-pi.md` (plusieurs Pi à la maison) **(proposé)**
2. Ne pas l'ajouter

**Réponse :** 

### 6. Lien vers une page non reprise (par exemple vers la spécification)

1. Lien vers la page sur www.pi-appliance.com, marqué « en ligne » **(proposé)**
2. Lien retiré, texte gardé

**Réponse :** 

### 7. Version de la documentation

1. La dernière étiquette `vX.Y.Z` (aujourd'hui `v0.1.4`), même avant la version stable (TODO-5.9) **(proposé)**
2. Seulement à partir de la première version stable

**Réponse :** 

### 8. Un Pi resté sur une version plus ancienne

1. Une seule documentation, celle de la dernière version **(proposé)**
2. Garder aussi les documentations des versions précédentes

**Réponse :** 

### 9. Nouvelle documentation reçue

1. Prise en silence ; version et date en bas de page **(proposé)**
2. Bandeau « Documentation mise à jour »

**Réponse :** 

### 10. Rythme de republication

1. Une fois par jour et à la demande **(proposé)**
2. En plus, dès qu'une version de pi-appliance sort (le workflow de pi-appliance prévient ce dépôt, avec un jeton à créer)

**Réponse :** 

## C. Mes Pi : ajout

### 11. ⚠️ Code QR et iPhone

Sur iPhone, l'application posée sur l'écran d'accueil ne partage pas ses données avec Safari. Scanner le code avec l'appareil photo ouvre Safari, et le Pi ajouté là n'apparaît pas dans l'application installée.

1. L'application lit le code QR elle-même (bouton « Scanner le code », caméra du téléphone), avec une petite bibliothèque libre gardée dans le dépôt, par exemple jsQR (licence Apache 2.0) ; l'appareil photo reste possible sur Android **(proposé)**
2. Appareil photo seulement ; sur iPhone, dire de recopier l'adresse à la main

**Réponse :** 

### 12. Contenu du code QR

Toujours : nom du Pi, adresse à la maison, adresse sur internet ; jamais de mot de passe ni de clé. La console ne montre le code qu'à l'administrateur connecté, dans « Mon Pi » : un voisin du Wi-Fi ne le voit pas.

1. Avec aussi la liste des services et leurs adresses **(proposé)**
2. Sans les services

**Réponse :** 

### 13. Un Pi qui change de nom

Par exemple `pi-appliance-1a2b` devenu `controltower` : rescanner le code créerait un deuxième Pi.

1. Le code porte un identifiant stable et non secret (l'empreinte de la clé du Pi) : la fiche est mise à jour **(proposé)**
2. Pas d'identifiant : la personne supprime l'ancienne fiche elle-même

**Réponse :** 

### 14. Saisie à la main

1. Nom du Pi ou adresse IP (`192.168.1.196`) **(proposé)**
2. Nom du Pi seulement

**Réponse :** 

### 15. ⚠️ Recherche à la maison : ses limites réelles

Une page de `app.pi-appliance.com` voit très mal le réseau de la maison :
- le certificat du Pi à la maison est fait par le Pi lui-même, pas par une autorité reconnue. Le navigateur refuse alors la demande, et l'application ne peut pas distinguer « le Pi est là » de « le Pi n'existe pas », tant que la personne n'a pas accepté l'alerte du certificat dans ce navigateur. Sur iPhone, il faut l'avoir fait dans l'application installée elle-même ;
- Chrome demande en plus la permission d'accéder « aux appareils de votre réseau local ».

1. Garder la recherche, avec ces limites expliquées
2. La remplacer par un bouton « Essayer » sur chaque Pi, qui ouvre simplement l'adresse ; la vraie recherche reviendra si un moyen fiable apparaît **(proposé)**
3. La retirer : seulement le code QR et la saisie

**Réponse :** 

## D. Mes Pi : état et ouverture

### 16. ⚠️ État d'un Pi sur internet

L'adresse sur internet a un vrai certificat, donc l'état peut s'y lire de façon fiable, si la console répond à une petite demande sans connexion (par exemple `api/hello`), autorisée pour `app.pi-appliance.com`.

1. L'ajouter dans pi-appliance, réponse « je suis là » seulement **(proposé)**
2. L'ajouter, réponse avec aussi le nom et la version du Pi
3. Ne pas l'ajouter : pas d'état sur internet

**Réponse :** 

### 17. État à la maison

Avec les limites de la question 15 :

1. Affiché seulement quand il est sûr, rien sinon (jamais de « ne répond pas » douteux) **(proposé)**
2. Jamais affiché

**Réponse :** 

### 18. Ouverture d'un Pi

1. Deux boutons, « À la maison » et « Depuis internet », celui qui répond mis en avant **(proposé)**
2. Un seul bouton : l'application choisit l'adresse elle-même

**Réponse :** 

### 19. Où s'ouvre la console

1. Dans le navigateur habituel, qui garde la connexion et l'alerte du certificat déjà acceptée **(proposé)**
2. Dans la fenêtre de l'application

**Réponse :** 

## E. Mes Pi : la liste

### 20. Surnom d'un Pi (« Le Pi du salon »)

1. Surnom facultatif en plus du nom réseau **(proposé)**
2. Nom réseau seulement

**Réponse :** 

### 21. Ordre de la liste

Dans tous les cas : renommer et supprimer un Pi.

1. Ordre alphabétique du surnom **(proposé)**
2. Ordre d'ajout
3. Ordre choisi en faisant glisser

**Réponse :** 

### 22. Services d'un Pi

1. Seulement ceux du code QR ; rescanner met à jour **(proposé)**
2. Aussi ajoutés à la main dans la fiche

**Réponse :** 

### 23. Changer de téléphone

1. Pas dans la première version **(proposé)**
2. Passer la liste par un code QR de toute la liste
3. Passer la liste par un fichier

**Réponse :** 

## F. Écrans et langues

### 24. Premier écran

1. « Mes Pi » s'il y a au moins un Pi ; sinon un accueil avec « Ajouter mon Pi » et « Lire la documentation » **(proposé)**
2. Toujours « Mes Pi »
3. Toujours la documentation

**Réponse :** 

### 25. Aide à l'installation sur l'écran d'accueil

Bouton sur Android, « Partager » puis « Sur l'écran d'accueil » sur iPhone.

1. Expliquée une fois, sans insister **(proposé)**
2. Toujours visible dans un menu, jamais proposée d'elle-même
3. Aucune aide

**Réponse :** 

### 26. Langue

1. Celle du téléphone, avec un choix dans les réglages **(proposé)**
2. Celle du téléphone seulement

**Réponse :** 

### 27. Traductions

1. Faites par Claude, en reprenant les mots de la console de pi-appliance, puis relues par qui le peut **(proposé)**
2. Français seulement dans la première version

**Réponse :** 

## G. Travail avec pi-appliance

### 28. Changements dans la console (code QR dans « Mon Pi », `api/hello`, lien vers l'application)

Cette session ne peut pas écrire dans pi-appliance.

1. Je rédige la demande, à reprendre dans une session de pi-appliance (TODO-5.16) **(proposé)**
2. Tu donnes à cette session l'accès à pi-appliance

**Réponse :** 

## H. Ordre et essais

### 29. Par quoi commencer

1. La documentation hors ligne (section 2 du TODO), utile tout de suite, sans rien attendre de la console **(proposé)**
2. « Mes Pi » (section 3 du TODO)

**Réponse :** 

### 30. Téléphones pour les essais

Modèle d'Android et version, modèle d'iPhone et version d'iOS : ils fixent les navigateurs à viser. Pas de choix ici, l'écrire.

**Réponse :** 
