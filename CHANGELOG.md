# Changelog

Toutes les modifications notables apportées à ce projet dans le cadre de
l'évaluation "Mise en production et maintenance applicative" sont
documentées dans ce fichier.

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
Les versions sont alignées sur les exercices du `README.md` (0.0.1 = E27,
0.0.2 = E28, 0.0.3 = E29), puis se poursuivent classiquement pour les
évolutions suivantes.

## [Non publié]

_Rien pour l'instant. Les prochains changements viendront ici, avant
d'être basculés dans une nouvelle section versionnée au moment de la
prochaine "livraison" (tag / déploiement)._

## [0.0.5] - 2026-09-04

### E24 – Conteneurisation

- **Dockerfile backend** (`backend/Dockerfile`) : image `node:20-alpine`,
  dépendances installées avec `npm ci --omit=dev` (reproductible, sans les
  devDependencies comme `nodemon`), démarre `node server.js` sur le port
  5000. `npm` est mis à jour vers la v11 avant `npm ci` : la version de
  npm embarquée dans l'image de base (10.8.2) est plus stricte sur la
  cohérence du lock file et faisait échouer l'installation à tort.
- **Dockerfile frontend** (`frontend/Dockerfile`) : build multi-stage —
  une étape `node:20-alpine` compile l'app React (`npm run build`), puis
  l'image finale `nginx:alpine` ne sert que les fichiers statiques
  générés (pas de Node.js à l'exécution). `frontend/nginx.conf` ajoute un
  `try_files ... /index.html` pour que les routes React Router (ex:
  `/tasks`) fonctionnent aussi en accès direct/rechargement, pas
  seulement en navigation interne.
- **`REACT_APP_API_URL` configurable au build** — `frontend/src/api.js`
  utilisait une URL d'API en dur (`http://localhost:5000/api`), ce qui
  posait justement la question notée en commentaire dans ce fichier
  ("comment gérer différentes URLs pour le développement, la
  pré-production et la production ?"). **Correction** : lecture de
  `process.env.REACT_APP_API_URL` (avec ce fallback en dev), injectée via
  un `ARG`/`ENV` du Dockerfile au moment du `npm run build` (CRA fige les
  variables `REACT_APP_*` dans le bundle statique, il n'y a plus de
  serveur Node ensuite pour les lire).
- **`docker-compose.yml`** (racine du projet) : orchestre `mongo` (image
  `mongo:7`, volume nommé `mongo_data` pour persister les données),
  `backend` (variables d'environnement `MONGO_URI`/`JWT_SECRET`/
  `CORS_ORIGIN` injectées à l'exécution, `JWT_SECRET` obligatoire — le
  compose refuse de démarrer si elle n'est pas définie) et `frontend`
  (build avec `REACT_APP_API_URL` en argument). Exposé sur
  `localhost:3000` (frontend) et `localhost:5000` (backend).
- **`.env.example`** (racine) : gabarit des variables lues par
  `docker-compose.yml`, à copier en `.env` (déjà ignoré par git). Ne pas
  confondre avec `backend/.env.example`, utilisé pour le lancement sans
  Docker.
- **`.dockerignore`** (backend et frontend) : exclut `node_modules`,
  fichiers `.env`, logs, etc. du contexte de build, pour des images plus
  légères et pour ne jamais copier de secret dedans par erreur.
- **Validé manuellement** : `docker compose build` (les deux images
  compilent), puis `docker compose up` — MongoDB se connecte
  (`MongoDB Connected...`), le backend répond correctement (401 sur une
  route protégée sans token), une inscription via `POST
  /api/auth/register` renvoie bien un token JWT, et le frontend sert le
  bundle React avec le fallback SPA fonctionnel sur `/tasks`.

## [0.0.4] - 2026-09-04

Améliorations complémentaires ne correspondant pas à un exercice du
référentiel en particulier (confort d'utilisation, outillage de dev).

### Ajouté

- **Affichage/masquage du mot de passe** —
  `frontend/src/components/PasswordInput.js` (+ `.css`) : les champs mot
  de passe (`Login.js`, `Register.js`) n'avaient aucun moyen de vérifier sa
  saisie avant de valider le formulaire. **Ajout** : un composant
  `PasswordInput` réutilisable avec un bouton "œil" (icônes lucide-react,
  cohérentes avec `Alert`) qui bascule le champ entre `type="password"` et
  `type="text"`.
- **Rechargement automatique du backend en développement** —
  `backend/package.json` : le serveur ne se relançait qu'avec `node
  server.js` (script `npm start`), donc toute modification de code backend
  n'était prise en compte qu'après un redémarrage manuel — source de
  confusion ("le fix ne marche pas" alors qu'il suffisait de relancer le
  serveur). **Ajout** : `nodemon` en devDependency et un script `npm run
  dev` qui surveille les fichiers du backend et redémarre automatiquement
  le serveur à chaque changement. `npm start` reste inchangé pour un
  lancement type production.

### Modifié

- **Séparation des responsabilités front/back** —
  `frontend/src/pages/Register.js` et `frontend/src/components/TaskForm.js`
  contenaient une logique de validation (longueur du username, complexité
  du mot de passe, titre non vide) dupliquée avec les règles déjà
  appliquées côté backend. **Correction** : cette logique métier a été
  retirée du frontend, qui se contente désormais d'envoyer la saisie brute
  à l'API et d'afficher le message d'erreur renvoyé par le backend
  (`err.response.data.msg`). Le backend reste la seule source de vérité
  pour les règles de validation.

## [0.0.3] - 2026-09-04

### E29 – Génération de la documentation et journal des évolutions

- Ajout de commentaires JSDoc sur l'ensemble des routes de
  `backend/routes/tasks.js` et `backend/routes/auth.js` (méthode,
  description, accès, paramètres attendus), ainsi que sur le middleware
  `backend/middleware/auth.js`.
- Ajout de commentaires de documentation sur les composants React
  `frontend/src/pages/Tasks.js` et `frontend/src/components/TaskForm.js`
  (rôle du composant, props, comportement).
- Création de ce fichier `CHANGELOG.md`.

## [0.0.2] - 2026-09-04

### E28 – Détection des failles de sécurité et mesures correctives

- **IDOR sur les tâches (critique)** — `backend/routes/tasks.js` : les
  routes `PUT /api/tasks/:id` et `DELETE /api/tasks/:id` ne vérifiaient pas
  que la tâche appartenait à l'utilisateur authentifié. N'importe quel
  utilisateur connecté pouvait donc modifier ou supprimer les tâches d'un
  autre utilisateur simplement en devinant/énumérant un ID de tâche.
  **Correction** : ajout d'une vérification `task.user.toString() ===
  req.user.id` avant toute mise à jour/suppression, avec réponse `403
  Forbidden` sinon.
- **Absence de validation des entrées côté API (XSS stocké / abus)** —
  `backend/routes/tasks.js` : les champs `title`/`description` étaient
  enregistrés tels quels, sans vérification de type ni de longueur. Un
  contenu malveillant (`<script>...</script>`) pouvait être stocké et,
  bien que React échappe l'affichage actuellement, cela restait un risque
  en cas d'évolution future du rendu (ex: `dangerouslySetInnerHTML`) ou
  d'appel direct à l'API. **Correction** : ajout d'une fonction de
  validation/normalisation (`sanitizeTaskInput`) qui rejette les titres
  vides, limite la taille des champs (200 / 2000 caractères) et « trim »
  les valeurs avant sauvegarde.
- **Configuration CORS trop permissive** — `backend/server.js` : `cors()`
  était appelé sans options, ce qui autorise toutes les origines à appeler
  l'API. **Correction** : restriction aux origines listées dans la
  variable d'environnement `CORS_ORIGIN` (fallback `http://localhost:3000`
  en développement).
- **Absence de politique de mot de passe côté serveur** —
  `backend/routes/auth.js` : `POST /api/auth/register` ne vérifiait que la
  présence (non-vide) du username et du mot de passe, ce qui permettait de
  créer un compte avec un mot de passe trivial comme `"a"` (la validation
  de longueur ajoutée côté frontend est contournable en appelant l'API
  directement, ex: `curl`). **Correction** : ajout d'une validation
  serveur (`validateRegistration`, fonction `PASSWORD_COMPLEXITY_REGEX`)
  exigeant un nom d'utilisateur d'au moins 3 caractères et un mot de passe
  d'au moins 8 caractères contenant **une majuscule, une minuscule, un
  chiffre et un caractère spécial**. Pour que cette règle soit claire pour
  l'utilisateur, `frontend/src/components/PasswordInput.js` affiche un
  bloc d'aide permanent sous le champ (prop `hint`, relié au champ via
  `aria-describedby`) sur `frontend/src/pages/Register.js`, plutôt que de
  ne l'indiquer qu'après une erreur de soumission.
- **Secret JWT faible et absence de gabarit d'environnement** —
  `backend/.env` utilisait un `JWT_SECRET` trivial (`secretkey123`).
  **Correction** : remplacement par un secret long et aléatoire en
  développement local, et ajout de `backend/.env.example` documentant les
  variables attendues (`MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`) et
  rappelant de générer un secret robuste (`openssl rand -hex 64`) en
  production, sans jamais committer le `.env` réel (déjà présent dans
  `.gitignore`).

## [0.0.1] - 2026-09-04

### E27 – Détection des bugs et mesures correctives

- **Liste des tâches non mise à jour après ajout** —
  `frontend/src/pages/Tasks.js` : la fonction `addTask` était vide, la
  nouvelle tâche n'apparaissait qu'après un rafraîchissement manuel de la
  page. **Correction** : `addTask` insère désormais la tâche renvoyée par
  l'API en tête de la liste locale (`setTasks`).
- **Aucune modification de tâche possible** — la consigne de test de cet
  exercice ("créez un compte, connectez-vous, ajoutez, **modifiez** et
  supprimez des tâches") révèle que la route backend `PUT /api/tasks/:id`
  existait déjà mais que rien dans l'interface ne permettait de modifier
  une tâche créée. **Correction** : `frontend/src/pages/Tasks.js` propose
  désormais un bouton "Modifier" qui bascule la tâche en mode édition
  (champ titre + boutons "Enregistrer"/"Annuler"), et une case à cocher
  pour marquer une tâche comme terminée/non terminée (active le style CSS
  `.completed` déjà présent mais jusque-là inatteignable).
- **Feedback utilisateur insuffisant en cas d'erreur** —
  `frontend/src/pages/Login.js`, `frontend/src/pages/Register.js`,
  `frontend/src/pages/Tasks.js`, `frontend/src/components/TaskForm.js` :
  les erreurs API (mauvais identifiants, échec réseau, ...) n'étaient
  loguées qu'en console, l'utilisateur ne voyait rien se passer.
  **Correction** : ajout d'un état `error` affiché à l'utilisateur avec le
  message renvoyé par l'API. Ce message est rendu via un composant
  `<Alert>` dédié (`frontend/src/components/Alert.js` + `.css`), au rendu
  inspiré des "Alert" de shadcn/ui (icônes lucide-react, variantes
  error/success/info) mais en CSS pur — affiché comme un toast fixe en
  haut de l'écran (sous le header), avec animation d'apparition et bouton
  de fermeture "×", pour se rapprocher d'un `alert()` natif tout en
  gardant un style soigné et bien aligné.
- **Aucune confirmation après une inscription réussie** —
  `frontend/src/pages/Register.js` : en cas de succès, l'utilisateur était
  redirigé immédiatement vers `/login` sans aucun retour visuel, ce qui
  donnait l'impression que rien ne s'était passé (ou pire, qu'une erreur
  silencieuse avait eu lieu). **Correction** : affichage d'un message de
  succès via `<Alert variant="success">` ("Compte créé avec succès.
  Redirection vers la connexion...") puis redirection différée de 1,5s
  pour laisser le temps de le lire ; le bouton "S'inscrire" est désactivé
  pendant ce délai pour éviter une double soumission.
- **Formulaires soumissibles avec des champs vides** —
  `frontend/src/components/TaskForm.js` (titre de tâche vide) et
  `frontend/src/pages/Register.js` (username/password vides) pouvaient
  être soumis sans retour clair. **Correction** : le backend rejette ces
  cas avec un message explicite, affiché côté frontend via `<Alert>`
  (toute la validation étant centralisée côté backend, voir la section
  "Modifié" de la v0.0.4).
- **La déconnexion ne redirige pas l'utilisateur** —
  `frontend/src/App.js` : `handleLogout` supprimait le token du
  `localStorage` mais ne redirigeait jamais vers `/login`, et la route
  `/tasks` n'était pas protégée. Résultat : après un clic sur
  "Déconnexion", l'utilisateur restait affiché sur la page des tâches.
  **Correction** : la route `/tasks` vérifie désormais `isAuthenticated`
  et redirige automatiquement vers `/login` (`<Navigate to="/login"
  replace />`) dès que ce booléen passe à `false`, ce qui couvre à la fois
  la déconnexion et un accès direct à `/tasks` sans être connecté.
- **Aucun lien vers l'inscription dans le menu** —
  `frontend/src/components/Header.js` : seul un lien "Connexion" était
  affiché pour un visiteur non authentifié, la page `/register` n'était
  atteignable qu'en tapant l'URL directement. **Correction** : ajout d'un
  lien "Inscription" à côté de "Connexion" dans le menu quand l'utilisateur
  n'est pas connecté.
- **Redirection de `/` toujours vers `/login`, même si connecté** —
  `frontend/src/App.js` : la route `/` redirigeait systématiquement vers
  `/login`, y compris pour un utilisateur déjà authentifié, qui devait
  alors recliquer pour retourner sur ses tâches. **Correction** : la
  redirection dépend désormais de `isAuthenticated` (`/tasks` si connecté,
  `/login` sinon). Par symétrie, `/login` et `/register` redirigent
  désormais vers `/tasks` si l'utilisateur est déjà connecté (ex: retour
  en arrière ou URL tapée manuellement).
- **Code HTTP incorrect pour un token invalide** —
  `backend/middleware/auth.js` : un token JWT invalide/expiré renvoyait le
  statut `418 I'm a teapot`, ce qui n'a pas de sens sémantique et peut
  perturber les clients/proxies. **Correction** : renvoi du code standard
  `401 Unauthorized`.
- **Bouton "Déconnexion" non stylé** — `frontend/src/App.css` : le menu
  utilise un `<button className="nav-link">` pour la déconnexion, mais la
  règle CSS ne ciblait que les balises `<a>` (`header nav ul li a`). Le
  bouton gardait donc l'apparence par défaut du navigateur (fond blanc,
  bordure grise), en rupture avec le reste du menu. **Correction** : la
  règle de couleur/police cible désormais aussi `.nav-link`, et le chrome
  natif du `<button>` (fond, bordure, padding) est supprimé pour qu'il se
  fonde visuellement avec les liens "Mes Tâches" / "Connexion" /
  "Inscription", avec un soulignement au survol.
- **Messages et libellés en anglais** — tous les messages d'erreur
  renvoyés par le backend (`routes/auth.js`, `routes/tasks.js`,
  `middleware/auth.js`) étaient en anglais ("Invalid credentials", "User
  already exists", "Task not found", "No token, authorization denied",
  ...) alors que ce sont ces messages qui s'affichent tels quels dans le
  composant `<Alert>`, pour une application destinée à des utilisateurs
  français. **Correction** : tous traduits en français ; au passage, les
  erreurs 500 renvoyées en texte brut (`res.status(500).send('Server
  Error')`) sont désormais du JSON cohérent avec le reste de l'API
  (`{ msg: 'Erreur serveur' }`). Les libellés frontend restés en anglais
  (`Login.js`/`Register.js` : titres "Login"/"Register", labels
  "Username"/"Password", boutons) ont aussi été traduits, ainsi que
  `<html lang="en">` et le `<title>` de `public/index.html`.

## Comment lire ce changelog

- **[Non publié]** : modifications faites mais pas encore associées à une
  version (pas de tag/déploiement).
- **[X.Y.Z] - AAAA-MM-JJ** : une version "figée" à une date donnée. Les
  premières versions sont alignées sur les exercices du référentiel
  (0.0.1 = E27, 0.0.2 = E28, 0.0.3 = E29), les suivantes regroupent les
  évolutions qui n'entrent pas dans un exercice précis.
- Chaque entrée suit le même schéma : catégorie (Ajouté / Modifié /
  Sécurité / Corrigé / exercice concerné), fichier(s) concerné(s),
  problème, correction apportée.
