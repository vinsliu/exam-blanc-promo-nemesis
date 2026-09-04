const jwt = require('jsonwebtoken');

/**
 * Middleware d'authentification JWT.
 *
 * Lit le token dans l'en-tête `x-auth-token`, le vérifie avec `JWT_SECRET`
 * et attache le payload décodé (`{ id }`) à `req.user` pour les routes
 * suivantes. Répond 401 si le token est absent ou invalide/expiré.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'Authentification requise' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    // Bug corrigé : 418 ("I'm a teapot") n'a pas de sens ici, le code HTTP
    // standard pour un token invalide/expiré est 401 Unauthorized.
    res.status(401).json({ msg: 'Session invalide ou expirée, veuillez vous reconnecter' });
  }
};
