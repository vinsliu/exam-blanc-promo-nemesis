# Hébergement, DNS, Sécurité (E21, E22, E23)

Architecture cible proposée pour mettre cette application en production,
sur une base **entièrement gratuite** (aucune carte bancaire requise,
aucun abonnement), en réutilisant ce qui existe déjà dans le repo
(`Dockerfile` backend/frontend de l'E24, `/api/health` et `/metrics` de
l'E26).

## Fournisseurs choisis

| Besoin | Service | Pourquoi | Limite du gratuit |
|---|---|---|---|
| Conteneurs (backend + frontend) | **[Render](https://render.com)** — Web Services | Déploie directement depuis nos `Dockerfile` existants, sans rien réécrire ; redéploiement automatique à chaque push sur `main`. | Le service s'endort après 15 min sans requête ; la requête suivante réveille le conteneur en ~30-60s ("cold start"). |
| Base de données | **[MongoDB Atlas](https://www.mongodb.com/atlas)** — cluster M0 | Managé (sauvegardes, mises à jour, TLS) et gratuit à vie, pas juste un essai limité dans le temps. | 512 Mo de stockage, cluster partagé (performances limitées) — largement suffisant pour un projet d'entraînement. |
| Nom de domaine + HTTPS | Sous-domaine **`*.onrender.com`** fourni par Render | Certificat HTTPS (Let's Encrypt) généré et renouvelé automatiquement, aucune config DNS à faire. | Pas de nom de domaine personnalisé (`monapp.fr`) sans l'acheter séparément — mais Render l'accepte gratuitement le jour où on en achète un. |
| Surveillance "API down" | **[UptimeRobot](https://uptimerobot.com)** (plan gratuit) | Vérifie `/api/health` toutes les 5 min depuis l'extérieur, alerte par email dès que ça répond mal — sans avoir à héberger soi-même un Prometheus 24/7. | Vérification toutes les 5 min seulement (pas toutes les 15s comme un Prometheus dédié) — suffisant pour "API down", pas pour du monitoring fin. |
| CI (tests) | **GitHub Actions** (déjà en place, E24) | Gratuit sur un repo public ; quota gratuit large sur un repo privé. | — |

Aucun de ces éléments ne nécessite de moyen de paiement à l'inscription.

## Déploiement actuel (démo)

Cette architecture a été mise en œuvre pour de vrai, pas seulement
documentée :

- **Application** : https://exam-blanc-frontend.onrender.com
- **API / santé** : https://exam-blanc-backend.onrender.com/api/health

⚠️ Offre gratuite Render : les services s'endorment après 15 min
d'inactivité. Le premier chargement après une pause peut prendre
30 à 60 secondes le temps que le conteneur redémarre — c'est normal,
pas un bug.

## Où sont hébergés les conteneurs

**Render, Web Services**, un pour le backend et un pour le frontend,
chacun construit **directement depuis le `Dockerfile` déjà présent dans
le repo** (`backend/Dockerfile`, `frontend/Dockerfile`) — Render lit le
`Dockerfile` du dossier indiqué, inutile de passer par Docker Hub ou un
registre pour ce déploiement (Docker Hub reste utile pour distribuer les
images indépendamment, cf. E24, mais n'est pas requis pour Render) :

- **Déploiement continu inclus** : Render se branche directement sur le
  repo GitHub et redéploie automatiquement à chaque push sur `main` —
  pas besoin d'ajouter de job de déploiement dans `ci.yml`.
- **HTTPS automatique** sur le sous-domaine fourni
  (`nom-du-service.onrender.com`), aucune configuration à faire.
- **Variables d'environnement** (`MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`,
  `REACT_APP_API_URL`) saisies dans le dashboard Render, jamais dans le
  code — même principe que `.env`/`.env.example` en local (E28).
- **Limite acceptée** : mise en veille après 15 min d'inactivité (offre
  gratuite). Pour un vrai projet en production avec du trafic constant,
  il faudrait passer sur une offre payante Render (ou un service toujours
  actif) — c'est le compromis du "gratuit" assumé ici pour un projet
  d'entraînement, pas pour un usage commercial réel.

## Où est hébergée la base de données

**MongoDB Atlas, cluster M0 (gratuit à vie)** plutôt qu'une base
installée soi-même sur un serveur :

- Sauvegardes, mises à jour de sécurité, disponibilité gérées par Atlas.
- **Accès réseau restreint** : dans l'idéal, allowlist des IP sortantes
  de Render ; à défaut (IP de sortie non fixes sur l'offre gratuite de
  Render), autoriser `0.0.0.0/0` **mais** avec un utilisateur MongoDB
  dédié à droits limités (lecture/écriture sur la seule base de l'appli,
  jamais le compte admin du cluster) et un mot de passe long généré
  aléatoirement — c'est le compromis du gratuit : on compense l'absence
  d'IP fixe par des identifiants forts et un scope minimal.
- Connexion toujours en `mongodb+srv://` (TLS obligatoire par défaut chez
  Atlas, non désactivable).
- `MONGO_URI` renseignée uniquement dans les variables d'environnement du
  service Render, jamais commitée — cohérent avec ce qui est déjà fait
  pour `JWT_SECRET` (E28).

## Nom de domaine et certificat HTTPS

Pas d'achat de domaine ni de config DNS à faire pour rester dans le
gratuit :

- Render fournit un sous-domaine HTTPS pour chaque service
  (`mon-backend.onrender.com`, `mon-frontend.onrender.com`), certificat
  Let's Encrypt généré et renouvelé automatiquement.
- **`CORS_ORIGIN`** (déjà configurable, cf. E28) pointé sur l'URL Render
  du frontend en production, plus sur `localhost:3000`.
- **`REACT_APP_API_URL`** (déjà configurable, cf. E24) pointé sur l'URL
  Render du backend au moment du build du frontend.
- Si un vrai nom de domaine est acheté plus tard (chez n'importe quel
  registrar), Render permet de le rattacher gratuitement à un service —
  seul l'achat du domaine lui-même a un coût, pas son intégration.

## Sécurité complémentaire pour la mise en production

- **`/metrics`** (E26) : non authentifié aujourd'hui, adapté au
  développement. Sur l'offre gratuite Render, pas de règle de pare-feu
  réseau disponible pour le restreindre par IP — à protéger a minima par
  un en-tête secret vérifié côté backend avant d'exposer publiquement une
  URL Render.
- **Secrets** : `JWT_SECRET`, `MONGO_URI` uniquement dans les variables
  d'environnement du dashboard Render — jamais dans un fichier committé
  (déjà garanti par `.gitignore`, E28).
- **Logs** (E25) : en conteneur qui redémarre régulièrement (mise en
  veille), les fichiers locaux `backend/logs/` ne persistent pas d'un
  redémarrage à l'autre. Render conserve un historique de logs limité
  dans son dashboard (suffisant pour du débogage ponctuel gratuit) ; pour
  une conservation plus longue, il faudrait brancher un service de
  logging externe avec offre gratuite (ex: Better Stack Logs).
- **Monitoring** (E26) : `/metrics` reste disponible pour qui veut le
  scraper manuellement (cf. `monitoring/README.md`) ; pour une
  surveillance continue et gratuite sans rien héberger, UptimeRobot sur
  `/api/health` couvre déjà l'alerte la plus importante ("API down").
