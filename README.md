
# Projet d'Entraînement : Application de Gestion de Tâches

Bienvenue sur le projet d'entraînement pour l'évaluation "Mise en production et maintenance applicative". Cette application est une simple "To-Do List" composée d'un frontend en React et d'un backend en Node.js/Express.

**Important** : Cette application a été intentionnellement conçue avec des bugs, des failles de sécurité et des mauvaises pratiques. Votre mission est de l'améliorer en suivant les consignes ci dessous et de faire la mise en production.

## 1. Installation et Lancement

Ce projet utilise Node.js et MongoDB. Assurez-vous qu'ils sont installés sur votre système.

### a. Backend

```bash
# Allez dans le dossier du backend
cd backend

# Installez les dépendances
npm install

# Copiez le gabarit de variables d'environnement (fichier absent du repo,
# à créer à chaque nouveau clone) et personnalisez au moins JWT_SECRET
cp .env.example .env

# Lancez le serveur (il se connectera à MongoDB)
# Assurez-vous que votre service MongoDB est démarré
npm start
# Le serveur tournera sur http://localhost:5000

# En développement, préférez plutôt :
npm run dev
# Utilise nodemon : le serveur redémarre automatiquement à chaque modification d'un fichier backend (sinon vos changements de code ne sont pris en compte qu'après un redémarrage manuel).
```

### b. Frontend

```bash
# Depuis un autre terminal, allez dans le dossier du frontend
cd frontend

# Installez les dépendances
npm install

# Lancez l'application React
npm start
# L'application s'ouvrira sur http://localhost:3000
```

### c. Avec Docker (recommandé pour la mise en production)

Ce projet fournit un `Dockerfile` pour le backend, un pour le frontend, et
un `docker-compose.yml` qui orchestre les deux avec une base MongoDB —
aucune installation locale de Node.js ou MongoDB n'est nécessaire, seul
Docker (avec Compose) est requis.

```bash
# Copiez le gabarit de variables d'environnement et personnalisez-le (au minimum JWT_SECRET, avec un secret long et aléatoire)
cp .env.example .env

# Construisez les images et démarrez les 3 services (mongo, backend, frontend)
docker compose up --build
```

Une fois les 3 services démarrés (`mongo`, `backend`, `frontend` doivent
apparaître avec un état "Started"/"healthy" dans les logs), vérifiez que
ça fonctionne :

```bash
# Doit renvoyer {"status":"ok","database":"connected",...}
curl http://localhost:5000/api/health
```

Puis ouvrez **http://localhost:3000** dans un navigateur : inscrivez-vous
(bouton "Inscription" dans le menu), connectez-vous, ajoutez/modifiez/
supprimez une tâche.

Pour arrêter :

```bash
docker compose down
# Ajoutez -v pour supprimer aussi le volume MongoDB (repartir de zéro) :
docker compose down -v
```

Les données MongoDB sont persistées dans un volume Docker nommé
(`mongo_data`) : elles survivent à un `docker compose down` (mais pas à un
`docker compose down -v`).

### d. Tests

```bash
# Backend (Jest — tests unitaires sur la validation des mots de passe et des tâches)
cd backend
npm install
npm test

# Frontend (React Testing Library)
cd frontend
npm install
npm test -- --watchAll=false
```

Ces mêmes commandes sont ce que la pipeline CI/CD (section suivante)
exécute automatiquement sur GitHub à chaque push.

### e. CI/CD (GitHub Actions)

Le workflow `.github/workflows/ci.yml` s'exécute sur chaque push et
pull request vers `main` :

1. **Backend** : `npm ci` puis `npm test` (tests unitaires Jest sur les
   fonctions de validation d'`auth.js` et `tasks.js`, sans base de données).
2. **Frontend** : `npm ci`, `npm test` (React Testing Library) puis
   `npm run build` (vérifie que le build de production compile).
3. **Uniquement sur un push sur `main`**, et seulement si les deux étapes
   précédentes réussissent : build des images Docker (backend et
   frontend) et push vers Docker Hub, taguées `latest` et avec le SHA du
   commit.

Pour activer l'étape de push, configurez dans les settings du repo
GitHub (`Settings > Secrets and variables > Actions`) :
- **Secrets** : `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` (un [access
  token](https://hub.docker.com/settings/security) Docker Hub, pas votre
  mot de passe).
- **Variable** (optionnelle) : `REACT_APP_API_URL`, l'URL publique de
  l'API à utiliser pour le build de production du frontend.

Sans ces secrets, les jobs de test tournent normalement ; seul le job de
build/push est ignoré (il est mis en `if` sur `main`, mais échouerait
faute d'identifiants Docker Hub si on tentait de le lancer sans secrets
configurés).

### f. Monitoring et alertes

Le backend expose deux endpoints de supervision (accessibles une fois la
stack Docker démarrée à l'étape "c", ou en local avec `npm run dev`) :

```bash
# Sonde de santé : 200 si l'API + MongoDB répondent, 503 sinon
curl http://localhost:5000/api/health

# Métriques au format Prometheus (requêtes HTTP, latence, métriques Node.js)
curl http://localhost:5000/metrics
```

Pour tester une vraie collecte Prometheus (optionnel — pas nécessaire au
quotidien, pas lancé par `docker compose up`) avec la stack Docker déjà
démarrée :

```bash
docker run --rm -d --name prometheus-demo \
  --network exam-practice-app_default \
  -p 9090:9090 \
  -v "$(pwd)/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml" \
  -v "$(pwd)/monitoring/alert.rules.yml:/etc/prometheus/alert.rules.yml" \
  prom/prometheus
```

Puis ouvrez :
- **http://localhost:9090/targets** → la cible `backend` doit être `up`.
- **http://localhost:9090/alerts** → les 3 alertes (`APIDown`,
  `HighLatency`, `HighErrorRate`) doivent apparaître, en vert
  ("inactive" = tout va bien).
- **http://localhost:9090/graph**, tapez `http_requests_total` puis
  "Execute" → affiche les requêtes déjà comptabilisées.

Pour arrêter : `docker stop prometheus-demo`.

Voir [`monitoring/README.md`](monitoring/README.md) pour le détail des
outils proposés (Prometheus, Alertmanager, Grafana, Uptime Kuma) et des
3 alertes définies dans `monitoring/alert.rules.yml`.

### g. Hébergement, DNS, Sécurité (E21, E22, E23)

Pas de code pour ce point (pas d'infrastructure cloud réelle provisionnée
pour ce projet d'entraînement) : voir
[`hosting/README.md`](hosting/README.md) pour l'architecture cible
proposée (Scaleway + MongoDB Atlas), le schéma, et la configuration
domaine/HTTPS envisagée.

---

## 2. Mission pour les Étudiants

Votre objectif est d'analyser, corriger et améliorer cette application pour la rendre prête pour une mise en production, en suivant les compétences de votre référentiel.

### ✓ E27 – Détection des bugs et mesures correctives

Le code contient plusieurs bugs fonctionnels et d'interface.

**Pistes de réflexion :**
- Testez l'application : créez un compte, connectez-vous, ajoutez, modifiez et supprimez des tâches.
- Que se passe-t-il si vous soumettez des formulaires vides ?
- La mise à jour de l'interface est-elle toujours immédiate après une action ?
- Le feedback utilisateur en cas d'erreur (ex: mauvais login) est-il suffisant ?
- Autres ....
- **Action :** Identifiez au moins 3 bugs, décrivez-les, et proposez une correction dans le code.

### ✓ E28 – Détection des failles de sécurité et mesures correctives

L'application présente plusieurs vulnérabilités.

**Pistes de réflexion :**
- **Validation des entrées** : Que se passe-t-il si vous entrez du code HTML ou JavaScript (`<script>alert('test')</script>`) dans les formulaires ? (Faille XSS)
- **Contrôle d'accès** : Un utilisateur peut-il voir ou modifier les données d'un autre utilisateur ? (Faille IDOR - Insecure Direct Object Reference). Regardez les routes `PUT` et `DELETE` dans `backend/routes/tasks.js`.
- **Gestion des secrets** : Le secret `JWT_SECRET` dans le fichier `.env` est-il robuste ? Comment devrait-il être géré en production ?
- **Dépendances** : Les dépendances du projet (`package.json`) sont-elles à jour ? Utilisez `npm audit` pour vérifier.
- **Configuration** : La configuration CORS dans `backend/server.js` est-elle trop permissive pour une production ?
- Autres ....
- **Action :** Identifiez au moins 2 failles de sécurité, expliquez le risque associé et corrigez-les.

### ✓ E29 – Génération de la documentation et journal des évolutions

Le code n'est pas documenté et il n'y a pas de suivi des changements.

**Pistes de réflexion :**
- **Documentation du code source** : Comment pourriez-vous documenter les fonctions, les routes de l'API et les composants React ? Des outils comme **JSDoc** (`/** ... */`) pour le backend JavaScript et les commentaires standards pour React peuvent être utilisés.
- **Journal des évolutions (Changelog)** : Vous allez apporter des modifications. Comment les tracer ? Créez un fichier `CHANGELOG.md` à la racine du projet et documentez-y chaque bug et faille de sécurité que vous corrigez.
- **Action :**
    1.  Documentez au moins une route de l'API backend et un composant React frontend en utilisant les commentaires de documentation (fournir des precisions sur ce que vous avez fait ..).
    2.  Créez et maintenez un `CHANGELOG.md`.

### ✓ E21 à E26 – Déploiement, CI/CD, Monitoring

Ces points concernent l'infrastructure et l'automatisation.

**Pistes de réflexion :**
- **Conteneurisation (E24)** : Comment mettriez-vous cette application (frontend et backend) dans des conteneurs Docker ? Créez un `Dockerfile` pour le backend et un autre pour le frontend. Créez un fichier `docker-compose.yml` pour orchestrer les deux services ainsi qu'une base de données MongoDB.
- **CI/CD (E24)** : Comment automatiser le déploiement ? Écrivez un petit script `deploy.sh` ou décrivez les étapes d'un pipeline (ex: GitHub Actions, GitLab CI) qui pourrait :
    1.  Installer les dépendances.
    2.  Lancer les tests (que vous pourriez écrire !).
    3.  Construire les images Docker.
    4.  Pousser les images vers un registre (Docker Hub, etc.).
- **Journalisation (Logging) (E25)** : Les `console.log` actuels sont-ils suffisants ? Proposez une solution de logging plus robuste (ex: Winston, Pino) pour le backend, qui pourrait logger dans des fichiers ou envoyer les logs vers un service centralisé.
- **Monitoring et Alertes (E26)** : Comment surveiller que votre application est en bonne santé ? Proposez des outils (ex: Prometheus, Grafana, Uptime Kuma) et définissez 2 ou 3 alertes pertinentes (ex: "API down", "Latence > 500ms", "Taux d'erreur > 5%" ...) - sinon vous pourrez utiliser et decrire le solutions proposer pour le service d'hebergement que vous avez choisi

- **Hébergement, DNS, Sécurité (E21, E22, E23)** : Décrivez une architecture cible sur un fournisseur cloud (ex: AWS, Azure, GCP, Scaleway...). Où hébergeriez-vous les conteneurs ? La base de données ? Comment configureriez-vous le nom de domaine et le certificat HTTPS ?

---

Bon courage !
