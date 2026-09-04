const client = require('prom-client');

/**
 * Métriques Prometheus de l'application (E26 - Monitoring).
 *
 * `register` collecte à la fois les métriques par défaut de Node.js
 * (mémoire, event loop lag, garbage collector, ...) et les métriques HTTP
 * personnalisées définies ci-dessous, exposées ensuite sur `GET /metrics`
 * pour qu'un serveur Prometheus puisse venir les "scraper" (voir
 * `monitoring/prometheus.yml` et `monitoring/alert.rules.yml`).
 */
const register = new client.Registry();
client.collectDefaultMetrics({ register });

/** Nombre total de requêtes HTTP, par méthode/route/code de statut. */
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Nombre total de requêtes HTTP traitées',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

/**
 * Durée des requêtes HTTP, en secondes. Les "buckets" sont choisis
 * autour du seuil d'alerte de latence défini dans
 * monitoring/alert.rules.yml (500 ms).
 */
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durée des requêtes HTTP en secondes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.2, 0.3, 0.5, 0.75, 1, 2, 5],
  registers: [register],
});

/**
 * Middleware Express qui mesure chaque requête et alimente les
 * métriques ci-dessus. La route est prise sur `req.route.path` une fois
 * résolue par Express (regroupe `/api/tasks/:id` au lieu de logger un
 * label par ID de tâche, ce qui exploserait la cardinalité des métriques).
 */
function metricsMiddleware(req, res, next) {
  const stopTimer = process.hrtime.bigint();

  res.on('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - stopTimer) / 1e9;
    const route = (req.baseUrl || '') + (req.route ? req.route.path : req.path);
    const labels = { method: req.method, route, status_code: res.statusCode };

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSeconds);
  });

  next();
}

module.exports = { register, metricsMiddleware };
