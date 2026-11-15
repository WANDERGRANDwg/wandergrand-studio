# SDFaker: Last Standing, Most Kills — serveur multijoueur

Ce dossier contient le vrai backend Node.js/WebSocket du jeu `SDFaker-Last-Standing-ONLINE.html`. Le HTML/WebGL reste hébergé sur GitHub Pages ; ce serveur doit tourner séparément sur un hôte Node.js ou Docker qui accepte les WebSockets.

## 1. Fonctionnement demandé : un seul bouton PLAY

```text
PLAY
  │
  └── WebSocket /ws → action join
        │
        ├── aucune salle active → crée automatiquement l'unique salle
        │
        └── salle déjà active   → rejoint cette même salle
```

- Le premier joueur crée automatiquement la salle en cliquant sur **PLAY**.
- Tous les joueurs suivants rejoignent cette salle ; il n'y a ni liste de serveurs, ni nom de salle, ni bouton « créer ».
- Une connexion WebSocket ne peut posséder qu'un joueur. Les doubles demandes `join` sont idempotentes.
- Le backend Node est l'autorité réseau. Le joueur qui clique en premier n'est pas le serveur technique : il n'y a donc aucun hôte-joueur à élire. S'il quitte, les autres restent dans la partie, sans réinitialisation.
- Le serveur conserve la salle tant qu'au moins un joueur reste connecté. Il supprime la salle, le top 3 et le record de session au départ du dernier joueur.
- **Le processus Node reste disponible même lorsque la salle est vide.** Une page GitHub Pages ne peut pas démarrer un processus Node distant. Si le processus lui-même s'arrêtait à zéro joueur, le visiteur suivant ne pourrait plus cliquer sur PLAY pour le réveiller. Le processus doit donc rester hébergé ; c'est la salle de jeu qui se ferme et se recrée automatiquement.
- Si le processus Node est arrêté ou redémarre pendant une partie, la salle en mémoire est perdue. La reprise d'une partie après une panne du processus n'est pas incluse.
- Déployer une seule instance de ce serveur. Plusieurs instances indépendantes créeraient plusieurs salles distinctes.

Cette architecture conserve le comportement voulu pour les joueurs tout en garantissant que le départ du premier joueur ne met pas fin à la partie des autres.

## 2. Systèmes pris en charge

- Salle unique créée au premier `join`, compteur de joueurs connectés, heartbeat WebSocket et déconnexion des clients silencieux.
- Noms réservés pendant la préparation et le jeu ; le nom redevient libre à la mort ou au départ ; noms comparés sans distinction majuscule/minuscule.
- Le nom `Jika` est réservé et exige le code créateur `ADMIN_NAME_CODE`, vérifié uniquement côté serveur avec comparaison en temps constant. Le code privé n'est pas intégré au HTML.
- Préparation de 30 secondes ; `Commencer` entre immédiatement en jeu ; à la fin du délai, entrée automatique avec un nom généré, couleur verte, taille normale et modèle fille/garçon choisi aléatoirement.
- 10 points de vie ; balle corps = -1 ; headshot = mort ; mort = score de session remis à zéro ; retour à la préparation après l'écran de mort.
- Soin : un kill ajoute un soin à récupérer avec E ; maximum deux soins portés ; un soin restaure 5 PV, plafonnés à 10.
- Eau profonde : -2 PV puis respawn terrestre à l'endroit le moins proche des autres joueurs ; si le joueur n'a que 1 ou 2 PV, il meurt normalement.
- Pistolet à apparence de fusil de précision : semi-automatique, chargeur de 10, recharge de 10 secondes, munitions infinies, cooldown de tir serveur, hitscan jusqu'à 1 500 m (couvre la diagonale de l'île de 1 km).
- Score de session et Top 3. Le record #1 garde son score après la mort/le départ du détenteur, mais son nom devient « no player ». Le record et le Top 3 sont remis à zéro quand le dernier joueur quitte ; le record personnel reste stocké localement par le navigateur.
- Cycle jour/nuit de 20 minutes (10 minutes jour, 10 minutes nuit) et météo synchronisée ; pluie/tempête avec durées variables.
- Choix fille/garçon, taille, couleur globale et couleurs par partie transférés pour l'affichage des autres joueurs.

## 3. Carte et collisions serveur

`world-colliders.json` contient **3 198 colliders** extraits du générateur déterministe déjà intégré dans le HTML du jeu. Ils couvrent les éléments solides de la carte : murs, bâtiments, parties de toits, troncs, palmiers, rochers et objets en bois, pierre, béton ou métal.

`world.js` construit une grille spatiale de 16 mètres afin d'accélérer les vérifications. Le serveur s'en sert pour :

- refuser les positions qui chevauchent un objet solide ;
- vérifier le trajet complet entre deux mises à jour avec des échantillons de 25 cm, pour empêcher de traverser un mur entre deux paquets ;
- arrêter les tirs sur le premier objet solide ou le terrain rencontré, avant de tester un joueur situé derrière ;
- choisir un spawn libre de colliders et aussi éloigné que possible des joueurs présents.

Le client possède déjà la même géométrie pour rendre les déplacements réactifs. Le serveur vérifie les coordonnées qu'il reçoit, mais le prototype reçoit encore les positions et orientations du navigateur : ce n'est pas encore un moteur physique entièrement simulé côté serveur et inviolable. Les éléments purement décoratifs (herbe, fleurs, particules et feuillages non solides) ne bloquent volontairement ni le joueur ni les tirs.

## 4. Installation locale sur Linux

Prérequis : Node.js 20+ et npm.

```bash
cd sdfaker-online-server
npm install
cp .env.example .env
```

Ouvre le fichier `.env` et remplace `ADMIN_NAME_CODE` par le code privé exact que tu as défini pour le nom `Jika`. Ne partage pas ce fichier et ne l'ajoute jamais à Git : `.env` est ignoré par `.gitignore`.

**Terminal 1 — démarrer le backend :**

```bash
cd sdfaker-online-server
ALLOWED_ORIGINS=http://localhost:8000 npm start
```

Le serveur écoute sur `http://127.0.0.1:8080/health` et `ws://127.0.0.1:8080/ws`.

**Terminal 2 — servir le jeu en HTTP** (ne pas ouvrir le HTML avec `file://`) :

```bash
cd /chemin/vers/SDFaker-Last-Standing-Online-Package
python3 -m http.server 8000
```

Pour ce test local uniquement, ouvre `sdfaker-server-config.js` et configure :

```js
window.SDFAKER_SERVER_URL = "ws://127.0.0.1:8080/ws";
```

Ouvre ensuite `http://localhost:8000/SDFaker-Last-Standing-ONLINE.html` dans deux navigateurs ou profils distincts. Clique `PLAY` dans chacun : le premier crée la salle, le second rejoint la même salle.

Avant de publier sur GitHub Pages, remplace cette adresse locale par la véritable URL WSS de production. Ne publie jamais `127.0.0.1` comme adresse publique.

## 5. Hébergement public

Le backend doit être déployé séparément sur un VPS ou un service Node.js/Docker qui reste actif et autorise les WebSocket upgrades. Pour le jeu en HTTPS, le service doit fournir du **WSS** (TLS direct ou via un reverse proxy).

Configure ces variables dans le tableau de bord privé de l'hébergeur :

```text
PORT=<port fourni par l'hébergeur>
MAX_PLAYERS=0
ALLOWED_ORIGINS=https://wandergrandwg.github.io
ADMIN_NAME_CODE=<code privé du créateur>
```

`MAX_PLAYERS=0` signifie « pas de limite logicielle » ; le nombre réel de joueurs dépend toujours du processeur, de la mémoire et du réseau de l'hôte. Le serveur doit être lancé avec une seule instance.

Après le déploiement, vérifie l'URL `/health`. Elle doit renvoyer `status: "ok"`, `transport: "websocket"` et `colliders: 3198`.

Puis modifie **uniquement** `sdfaker-server-config.js` dans le dossier du jeu avec la vraie adresse WSS attribuée par l'hébergeur :

```js
window.SDFAKER_SERVER_URL = "wss://ADRESSE-REELLE-DU-SERVEUR/ws";
```

L'adresse ci-dessus est un modèle, pas un serveur opérationnel. Publie ensuite les fichiers du jeu et de sa configuration sur GitHub Pages.

## 6. Déploiement Docker

Depuis ce dossier :

```bash
docker build -t sdfaker-last-standing .
docker run -d --name sdfaker-last-standing --restart unless-stopped \
  -p 8080:8080 \
  -e PORT=8080 \
  -e MAX_PLAYERS=0 \
  -e ALLOWED_ORIGINS=https://wandergrandwg.github.io \
  -e ADMIN_NAME_CODE='REMPLACER_PAR_LE_CODE_CRÉATEUR_PRIVE' \
  sdfaker-last-standing
```

Remplace la valeur d'exemple par le code créateur exact, sans l'écrire dans un fichier public. Pour une mise en production, préfère les variables secrètes du panneau d'hébergement plutôt que de laisser le code dans l'historique du shell. Le reverse proxy ou l'hébergeur doit transmettre les WebSocket et fournir TLS pour l'URL WSS.

## 7. Tests

Vérifier la syntaxe, régénérer les collisions et tester le monde :

```bash
npm run check
npm run build:colliders
npm run test:world
```

Avec le backend démarré dans un autre terminal, lancer le test réseau à deux clients :

```bash
npm run test:online
```

Ou lancer les deux suites :

```bash
npm test
```

Le test réseau vérifie la création/jointure de la salle unique, les doubles `join`, la protection des identifiants, la réservation et la libération d'un nom, la synchronisation de deux clients, la fermeture de la salle vide et sa recréation au `PLAY` suivant.

## 8. Limites connues avant la sortie publique

- GitHub Pages n'exécute pas le backend : le serveur doit être déployé séparément et son URL WSS configurée.
- La salle est en mémoire ; une panne ou un redémarrage du backend coupe la partie.
- Aucun plafond logiciel de joueurs n'est configuré par défaut, mais la capacité matérielle reste limitée.
- Les positions envoyées par le client sont contrôlées (vitesse, limites, collision balayée), mais le serveur ne simule pas encore entièrement les touches et la physique. Un jeu compétitif devra effectuer cette simulation côté serveur.
- Le partage entre plusieurs instances, la base de données, la reprise après panne, l'anti-triche avancé et le monitoring ne sont pas inclus.
- Ne considère pas le multijoueur comme public/live avant d'avoir déployé le backend, configuré l'URL WSS et réussi un test depuis deux appareils différents.
