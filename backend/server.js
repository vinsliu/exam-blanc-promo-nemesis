// Point d'entrée du serveur backend
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const logger = require('./config/logger');

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
