# Questions pour finir la spécification

Questions posées le 2026-11-21 pour compléter la [spécification](specification.md). Chacune vient avec une **proposition**. Écrire la réponse après **Réponse :** : « d'accord », ou un autre choix. Une fois tranchée, la réponse passe dans la spécification et la question est retirée d'ici.

Les questions marquées ⚠️ changent la conception : elles viennent de limites des navigateurs repérées en préparant la liste.

## A. Nom, icône, publication

### 1. Nom sous l'icône

**Nom sous l'icône** du téléphone : « pi-appliance », « Mes Pi », autre ?

*Proposition : « pi-appliance ».*

**Réponse :** 

### 2. Icône

**Icône** : le symbole « La maison » de la charte. Android demande aussi une icône sur fond plein, qu'il découpe en rond ou en carré.

*Proposition : le symbole sur fond rose pâle (`#FFF5F7`), même dessin partout.*

**Réponse :** 

### 3. Branche publiée

**Branche publiée** par GitHub Pages : `master` comme pi-appliance, ou `main` ?

*Proposition : `master`, pour faire comme pi-appliance.*

**Réponse :** 

### 4. Lien vers l'application

**Lien vers l'application** depuis www.pi-appliance.com et depuis la console (« Application mobile ») ?

*Proposition : oui, dans les deux, à faire dans pi-appliance.*

**Réponse :** 

## B. Documentation hors ligne

### 5. Pages reprises

**Pages reprises** : guide utilisateur, installation et flashage, marketplace, premier démarrage (image), future FAQ. Et `essais-plusieurs-pi.md` (plusieurs Pi à la maison) ? Les pages pour le projet (spécification, TODO, environnement, prototype, manGit, charte) restent dehors.

*Proposition : oui pour « plusieurs Pi », non pour les autres.*

**Réponse :** 

### 6. Liens vers une page non reprise

**Liens vers une page non reprise** (par exemple vers la spécification) :

*Proposition : lien vers la page sur www.pi-appliance.com, marqué « en ligne ».*

**Réponse :** 

### 7. Quelle version

**Quelle version** : la dernière étiquette `vX.Y.Z` (aujourd'hui `v0.1.4`), même avant la version stable (TODO-5.9) ?

*Proposition : oui, la dernière étiquette.*

**Réponse :** 

### 8. Un Pi resté sur une version plus ancienne

**Un Pi resté sur une version plus ancienne** : afficher seulement la documentation de la dernière version ?

*Proposition : oui, une seule documentation.*

**Réponse :** 

### 9. Nouvelle documentation

**Nouvelle documentation** : prise en silence (la date change), ou un bandeau « Documentation mise à jour » ?

*Proposition : en silence, avec la version et la date en bas de page.*

**Réponse :** 

### 10. Rythme

**Rythme** : chaque jour et à la demande. Faut-il aussi la republier dès qu'une version de pi-appliance sort ? Il faudrait pour cela que le workflow de pi-appliance prévienne ce dépôt, avec un jeton à créer.

*Proposition : non, une fois par jour suffit.*

**Réponse :** 

## C. Mes Pi : ajout

### 11. Code QR et iPhone

⚠️ **Code QR et iPhone** : sur iPhone, l'application posée sur l'écran d'accueil ne partage pas ses données avec Safari. Scanner le code avec l'appareil photo ouvre Safari, et le Pi ajouté là n'apparaît pas dans l'application installée. Pour que l'ajout marche partout, l'application doit lire le code QR elle-même (bouton « Scanner le code », caméra du téléphone). Il faut pour cela une petite bibliothèque libre qui lit les codes QR, par exemple jsQR (licence Apache 2.0), gardée dans le dépôt, sans framework.

*Proposition : oui, lecteur dans l'application. L'appareil photo reste possible sur Android.*

**Réponse :** 

### 12. Contenu du code QR

**Contenu du code QR** : nom du Pi, adresse à la maison, adresse sur internet. Faut-il aussi la liste des services ? La console ne montre le code qu'à l'administrateur connecté, dans « Mon Pi » : un voisin du Wi-Fi ne le voit pas.

*Proposition : oui, avec les services et leurs adresses ; jamais de mot de passe ni de clé.*

**Réponse :** 

### 13. Un Pi qui change de nom

**Un Pi qui change de nom** (par exemple `pi-appliance-1a2b` devenu `controltower`) : rescanner le code créerait un deuxième Pi. Le code peut porter un identifiant stable et non secret, l'empreinte de la clé du Pi, pour mettre à jour la fiche au lieu d'en ajouter une.

*Proposition : oui.*

**Réponse :** 

### 14. Saisie à la main

**Saisie à la main** : accepter aussi une adresse IP (`192.168.1.196`) en plus d'un nom ?

*Proposition : oui.*

**Réponse :** 

### 15. Recherche à la maison : ses limites réelles

⚠️ **Recherche à la maison : ses limites réelles**. Une page de `app.pi-appliance.com` voit très mal le réseau de la maison :
- le certificat du Pi à la maison est fait par le Pi lui-même, pas par une autorité reconnue. Le navigateur refuse alors la demande, et l'application ne peut pas distinguer « le Pi est là » de « le Pi n'existe pas », tant que la personne n'a pas accepté l'alerte du certificat dans ce navigateur. Sur iPhone, il faut l'avoir fait dans l'application installée elle-même ;
- Chrome demande en plus la permission d'accéder « aux appareils de votre réseau local ».

Que faire ? (a) garder la recherche, avec ces limites expliquées ; (b) la remplacer par un bouton « Essayer » par Pi, qui ouvre simplement l'adresse ; (c) la retirer et ne garder que le code QR et la saisie.

*Proposition : (b), plus honnête pour le grand public ; la vraie recherche reviendra si un moyen fiable apparaît.*

**Réponse :** 

## D. Mes Pi : état et ouverture

### 16. État d'un Pi sur internet

⚠️ **État d'un Pi sur internet** : son adresse sur internet a un vrai certificat, donc l'état peut s'y lire de façon fiable. Il faudrait pour cela que la console réponde à une petite demande sans connexion (par exemple `api/hello`), autorisée pour `app.pi-appliance.com`, qui ne rend que « je suis là » (et peut-être le nom et la version).

*Proposition : oui, à ajouter dans pi-appliance, réponse « je suis là » seulement.*

**Réponse :** 

### 17. État à la maison

**État à la maison** : avec les limites de la question 15, faut-il l'afficher seulement quand il est sûr, et rien sinon ?

*Proposition : oui, jamais de « ne répond pas » douteux.*

**Réponse :** 

### 18. Ouverture

**Ouverture** : l'application choisit-elle seule entre la maison et internet, ou montre-t-elle deux boutons ?

*Proposition : deux boutons, « À la maison » et « Depuis internet », celui qui répond mis en avant.*

**Réponse :** 

### 19. Où s'ouvre la console

**Où s'ouvre la console** : dans le navigateur habituel, ou dans la fenêtre de l'application ?

*Proposition : dans le navigateur, pour qu'il garde la connexion et l'alerte du certificat déjà acceptée.*

**Réponse :** 

## E. Mes Pi : la liste

### 20. Fiche d'un Pi

**Fiche d'un Pi** : faut-il un surnom libre (« Le Pi du salon ») en plus du nom réseau ?

*Proposition : oui, facultatif.*

**Réponse :** 

### 21. Modifier, supprimer, ordonner

**Modifier, supprimer, ordonner** : renommer et supprimer un Pi ; ordre d'ajout, ou ordre choisi par glisser ?

*Proposition : renommer et supprimer ; ordre alphabétique du surnom.*

**Réponse :** 

### 22. Services ajoutés à la main

**Services ajoutés à la main** dans la fiche, ou seulement ceux du code QR ?

*Proposition : seulement par le code QR ; rescanner met à jour.*

**Réponse :** 

### 23. Changer de téléphone

**Changer de téléphone** : la liste reste sur le téléphone. Faut-il pouvoir la passer à un autre téléphone (code QR de toute la liste, ou fichier) ?

*Proposition : pas dans la première version.*

**Réponse :** 

## F. Écrans et langues

### 24. Premier écran

**Premier écran** : « Mes Pi » ou la documentation ?

*Proposition : « Mes Pi » s'il y a au moins un Pi ; sinon un accueil avec les deux choix (« Ajouter mon Pi », « Lire la documentation »).*

**Réponse :** 

### 25. Aide à l'installation

**Aide à l'installation** : expliquer comment mettre l'application sur l'écran d'accueil (bouton sur Android, « Partager » puis « Sur l'écran d'accueil » sur iPhone) ?

*Proposition : oui, une fois, sans insister.*

**Réponse :** 

### 26. Langue

**Langue** : celle du téléphone, avec un choix dans les réglages ?

*Proposition : oui.*

**Réponse :** 

### 27. Traductions

**Traductions** : faites par Claude, en reprenant les mots déjà traduits de la console de pi-appliance, puis relues par qui le peut ?

*Proposition : oui.*

**Réponse :** 

## G. Travail avec pi-appliance

### 28. Changements dans la console

**Changements dans la console** (code QR dans « Mon Pi », demande `api/hello`, lien vers l'application) : qui les fait ? Cette session ne peut pas écrire dans pi-appliance.

*Proposition : je rédige la demande, à reprendre dans une session de pi-appliance (TODO-5.16).*

**Réponse :** 

## H. Ordre et essais

### 29. Par quoi commencer

**Par quoi commencer** : « Mes Pi » (section 3 du TODO) ou la documentation hors ligne (section 2) ?

*Proposition : la documentation, utile tout de suite, sans rien attendre de la console.*

**Réponse :** 

### 30. Téléphones pour les essais

**Téléphones pour les essais** : lesquels as-tu (modèle d'Android et version, modèle d'iPhone et version d'iOS) ? Ils fixent les navigateurs à viser.

**Réponse :**
