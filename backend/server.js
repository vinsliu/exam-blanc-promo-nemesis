// Point d'entrée du serveur backend
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const { register, metricsMiddleware } = require('./config/metrics');

// Connexion à la base de données
connectDB();

const app = express();

// Middleware
// Faille corrigée : `cors()` sans options autorise TOUTES les origines, ce
// qui est trop permissif en production. On restreint désormais aux origines
// listées dans CORS_ORIGIN (séparées par des virgules), avec un fallback
// vers le frontend de dev local.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Journal d'accès HTTP (méthode, route, code de statut, temps de réponse)
// via morgan, redirigé vers le logger applicatif plutôt que vers stdout
// brut, pour rester cohérent avec les fichiers de logs et le niveau
// configuré (silencieux en test).
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) },
  })
);

app.use(metricsMiddleware);

/**
 * GET /api/health
 * @route   GET api/health
 * @desc    Vérification de l'état de santé de l'application, pour les
 *          sondes de liveness/readiness (Docker HEALTHCHECK, Uptime
 *          Kuma, load balancer, etc.). Renvoie 200 si l'API répond et
 *          que MongoDB est connecté, 503 sinon.
 * @access  Public
 */
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1; // 1 = connected
  const status = isDbConnected ? 'ok' : 'degraded';

  res.status(isDbConnected ? 200 : 503).json({
    status,
    uptime: process.uptime(),
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /metrics
 * @route   GET metrics
 * @desc    Expose les métriques applicatives au format Prometheus
 *          (requêtes HTTP, latence, métriques par défaut de Node.js),
 *          destinées à être "scrapées" par un serveur Prometheus (voir
 *          monitoring/prometheus.yml).
 * @access  Public (à restreindre par IP/réseau en production, cf. README)
 */
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

/**
 * Renvoie les `maxLines` dernières lignes d'un fichier de log, ou une
 * chaîne vide si le fichier n'existe pas encore (rien loggé depuis le
 * démarrage du conteneur).
 * @param {string} filePath
 * @param {number} maxLines
 * @returns {string}
 */
function tailLogFile(filePath, maxLines) {
  if (!fs.existsSync(filePath)) return '';
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  return lines.slice(-maxLines).join('\n');
}

/**
 * Compare deux chaînes en temps constant (évite qu'un attaquant devine le
 * token caractère par caractère en mesurant le temps de réponse).
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function timingSafeEqualStrings(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/**
 * GET /api/logs
 * @route   GET api/logs
 * @desc    Expose les ~200 dernières lignes des logs applicatifs
 *          (backend/logs/combined.log, ou error.log via ?level=error),
 *          pour pouvoir les consulter sans accès au dashboard de
 *          l'hébergeur (ex: Render). Protégé par un token secret
 *          (`LOGS_ACCESS_TOKEN`) attendu dans l'en-tête `x-logs-token`
 *          ou le paramètre `?token=`. Renvoie 403 si la variable
 *          d'environnement n'est pas configurée (désactivé par défaut),
 *          401 si le token fourni est invalide.
 *
 *          Limite : en conteneur éphémère (ex: offre gratuite Render),
 *          ces fichiers ne contiennent que les logs depuis le dernier
 *          redémarrage, pas un historique complet.
 * @access  Protégé par token
 */
app.get('/api/logs', (req, res) => {
  const expectedToken = process.env.LOGS_ACCESS_TOKEN;
  if (!expectedToken) {
    return res
      .status(403)
      .json({ msg: 'Consultation des logs désactivée (LOGS_ACCESS_TOKEN non configuré)' });
  }

  const providedToken = req.header('x-logs-token') || req.query.token || '';
  if (!timingSafeEqualStrings(expectedToken, String(providedToken))) {
    return res.status(401).json({ msg: 'Token invalide' });
  }

  const level = req.query.level === 'error' ? 'error' : 'combined';
  const logsDir = path.join(__dirname, 'logs');
  const lines = tailLogFile(path.join(logsDir, `${level}.log`), 200);

  res.type('text/plain').send(lines || '(aucun log pour le moment)');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));

// Ce handler ne catch que les erreurs synchrones. Les erreurs dans les promesses ne sont pas gérées.
app.use((err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
