# Monitoring et alertes (E26)

Cette application expose ce dont un outil de monitoring a besoin, sans
imposer de faire tourner une stack Prometheus/Grafana en permanence pour
un projet d'entraînement.

## Ce que le backend expose

- **`GET /api/health`** — sonde de santé (liveness/readiness). Renvoie
  `200 { status: "ok", database: "connected", uptime, timestamp }` si
  l'API répond et que MongoDB est connecté, `503 { status: "degraded" }`
  sinon. Utilisée par le `HEALTHCHECK` du `backend/Dockerfile`, et c'est
  cette route qu'un outil comme **Uptime Kuma** interrogerait
  périodiquement pour l'alerte "API down".
- **`GET /metrics`** — métriques au format [Prometheus](https://prometheus.io/docs/concepts/data_model/) :
  métriques par défaut de Node.js (mémoire, event loop, GC, ...) et
  métriques HTTP personnalisées (`http_requests_total`,
  `http_request_duration_seconds`), taguées par méthode/route/code de
  statut.

## Outils proposés

| Outil | Rôle |
|---|---|
| **Prometheus** | Collecte périodique (`scrape`) de `/metrics` et évaluation des règles d'alerte (`alert.rules.yml`). |
| **Alertmanager** | Reçoit les alertes déclenchées par Prometheus et les route (email, Slack, ...). |
| **Grafana** | Dashboards de visualisation des métriques collectées par Prometheus. |
| **Uptime Kuma** | Solution plus légère, complémentaire : vérifie périodiquement `/api/health` depuis l'extérieur (utile même sans Prometheus, ou en secours si Prometheus lui-même est down). |

## Les 3 alertes définies (`alert.rules.yml`)

1. **`APIDown`** — `up{job="backend"} == 0` pendant 1 minute : Prometheus
   n'arrive plus à joindre `/metrics`, donc l'API est probablement down.
2. **`HighLatency`** — 95e percentile de `http_request_duration_seconds`
   > 500 ms pendant 5 minutes : l'application répond, mais trop lentement.
3. **`HighErrorRate`** — plus de 5% des requêtes renvoient un code 5xx
   pendant 5 minutes : quelque chose casse côté serveur (bug, DB down,
   dépendance externe en panne, ...).

## Tester en local (optionnel)

Ces fichiers ne sont pas branchés au `docker-compose.yml` principal (pas
besoin de faire tourner Prometheus en permanence pour développer). Pour
les essayer ponctuellement, sur le même réseau Docker que la stack
applicative (`docker compose up` doit déjà tourner) :

```bash
docker run --rm -d --name prometheus \
  --network exam-practice-app_default \
  -p 9090:9090 \
  -v "$(pwd)/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml" \
  -v "$(pwd)/monitoring/alert.rules.yml:/etc/prometheus/alert.rules.yml" \
  prom/prometheus

# Interface Prometheus : http://localhost:9090
# Cible /metrics : http://localhost:9090/targets
# Alertes définies : http://localhost:9090/alerts
```

## En production

- Le endpoint `/metrics` n'a aucune authentification : à restreindre par
  réseau (accessible uniquement depuis le serveur Prometheus, pas
  exposé publiquement) plutôt qu'à protéger par mot de passe.
- Alertmanager (ou l'intégration alertes du service d'hébergement choisi)
  doit être configuré pour notifier une vraie destination (email, Slack,
  PagerDuty...) — `alert.rules.yml` définit *quand* alerter, pas *qui*
  prévenir.
