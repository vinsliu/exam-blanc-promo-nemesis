const fs = require('fs');
const path = require('path');
const winston = require('winston');

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const logsDir = path.join(__dirname, '..', 'logs');
if (!isTest && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Format lisible pour la console en développement (avec couleurs) ;
// les fichiers restent en JSON structuré (facile à ingérer par un outil
// externe type ELK/Loki si on veut centraliser plus tard).
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(
    ({ timestamp, level, message, stack }) => `${timestamp} ${level}: ${stack || message}`
  )
);

/**
 * Logger applicatif (remplace les `console.log`/`console.error` bruts).
 *
 * - Niveau configurable via `LOG_LEVEL` (défaut : "debug" en dev,
 *   "info" en production).
 * - Écrit dans `backend/logs/error.log` (uniquement les erreurs) et
 *   `backend/logs/combined.log` (tous les niveaux), en plus de la
 *   console. En conteneur, ces fichiers restent dans le système de
 *   fichiers éphémère de l'image : pour les conserver en production, il
 *   faut monter un volume sur `backend/logs`, ou remplacer/compléter ces
 *   transports par un envoi vers un service centralisé (voir
 *   CHANGELOG, section E25).
 * - Silencieux pendant les tests (`NODE_ENV=test`, positionné
 *   automatiquement par Jest) pour ne pas polluer la sortie de `npm test`.
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: isTest
    ? []
    : [
        new winston.transports.Console({ format: consoleFormat }),
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
        }),
        new winston.transports.File({
          filename: path.join(logsDir, 'combined.log'),
        }),
      ],
  silent: isTest,
});

module.exports = logger;
