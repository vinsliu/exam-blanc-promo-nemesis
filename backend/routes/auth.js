const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

const USERNAME_MIN_LENGTH = 3;
const PASSWORD_MIN_LENGTH = 8;
// Au moins une minuscule, une majuscule, un chiffre et un caractère
// spécial, pour éviter les mots de passe trop simples (ex: "12345678").
const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

/**
 * Valide le couple username/password à l'inscription.
 *
 * Le frontend impose déjà des contraintes minimales, mais elles sont
 * contournables via un appel direct à l'API : cette validation côté
 * serveur est donc la seule garantie réelle de robustesse des comptes créés.
 *
 * @param {*} username
 * @param {*} password
 * @returns {string|null} Un message d'erreur, ou `null` si valide.
 */
function validateRegistration(username, password) {
  if (!username || !password) {
    return 'Veuillez remplir tous les champs';
  }
  if (typeof username !== 'string' || username.trim().length < USERNAME_MIN_LENGTH) {
    return `Le nom d'utilisateur doit contenir au moins ${USERNAME_MIN_LENGTH} caractères`;
  }
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    return `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`;
  }
  if (!PASSWORD_COMPLEXITY_REGEX.test(password)) {
    return 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial';
  }
  return null;
}

/**
 * POST /api/auth/register
 * @route   POST api/auth/register
 * @desc    Crée un nouveau compte utilisateur. Le mot de passe est validé
 *          côté serveur (longueur minimale, complexité) puis hashé avec
 *          bcrypt avant d'être stocké.
 * @access  Public
 */
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  const validationError = validateRegistration(username, password);
  if (validationError) {
    return res.status(400).json({ msg: validationError });
  }

  const trimmedUsername = username.trim();

  try {
    let user = await User.findOne({ username: trimmedUsername });
    if (user) {
      return res.status(400).json({ msg: 'Ce nom d\'utilisateur est déjà utilisé' });
    }

    user = new User({ username: trimmedUsername, password });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    logger.error(err.message, { stack: err.stack });
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

/**
 * POST /api/auth/login
 * @route   POST api/auth/login
 * @desc    Authentifie un utilisateur (username + password) et renvoie un
 *          token JWT valable 1h. Message d'erreur volontairement générique
 *          ("Invalid credentials") dans les deux cas d'échec pour ne pas
 *          révéler si le username existe (anti-énumération).
 * @access  Public
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    let user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: 'Identifiants invalides' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Identifiants invalides' });
    }

    const payload = { user: { id: user.id } };
    // La durée de vie du token est peut-être trop longue pour certaines applications.
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    logger.error(err.message, { stack: err.stack });
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

module.exports = router;
// Export nommé en plus du router par défaut, pour pouvoir tester la
// logique de validation en isolation (sans monter l'app/la DB).
module.exports.validateRegistration = validateRegistration;
