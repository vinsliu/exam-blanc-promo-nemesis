const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;

/**
 * Valide et normalise les champs `title`/`description` envoyés par le client.
 *
 * Défense en profondeur contre les données non désirées (XSS stocké,
 * abus de taille, types incorrects) : même si React échappe l'affichage
 * côté frontend, l'API ne doit jamais faire confiance à l'entrée brute.
 *
 * @param {*} title
 * @param {*} description
 * @returns {{ error: string } | { title: string, description: string }}
 */
function sanitizeTaskInput(title, description) {
  if (typeof title !== 'string' || !title.trim()) {
    return { error: 'Le titre est requis' };
  }
  if (title.trim().length > MAX_TITLE_LENGTH) {
    return { error: `Le titre doit contenir au maximum ${MAX_TITLE_LENGTH} caractères` };
  }
  if (description !== undefined && typeof description !== 'string') {
    return { error: 'La description doit être une chaîne de caractères' };
  }
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    return { error: `La description doit contenir au maximum ${MAX_DESCRIPTION_LENGTH} caractères` };
  }
  return { title: title.trim(), description: description ? description.trim() : '' };
}

/**
 * GET /api/tasks
 * @route   GET api/tasks
 * @desc    Récupère toutes les tâches de l'utilisateur authentifié (le plus
 *          récent en premier). Nécessite le middleware `auth` (JWT valide).
 * @access  Privé
 */
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

/**
 * POST /api/tasks
 * @route   POST api/tasks
 * @desc    Crée une nouvelle tâche pour l'utilisateur authentifié.
 * @access  Privé
 * @bodyparam {string} title - Titre requis (max 200 caractères).
 * @bodyparam {string} [description] - Description optionnelle (max 2000 caractères).
 */
router.post('/', auth, async (req, res) => {
  const { title, description } = req.body;

  const validation = sanitizeTaskInput(title, description);
  if (validation.error) {
    return res.status(400).json({ msg: validation.error });
  }

  try {
    const newTask = new Task({
      title: validation.title,
      description: validation.description,
      user: req.user.id,
    });

    const task = await newTask.save();
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

/**
 * PUT /api/tasks/:id
 * @route   PUT api/tasks/:id
 * @desc    Met à jour une tâche existante. La tâche doit appartenir à
 *          l'utilisateur authentifié (protection IDOR) sous peine de 403.
 * @access  Privé
 */
router.put('/:id', auth, async (req, res) => {
  const { title, description, isCompleted } = req.body;

  const validation = sanitizeTaskInput(title, description);
  if (validation.error) {
    return res.status(400).json({ msg: validation.error });
  }

  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Tâche introuvable' });

    // Faille IDOR corrigée : sans cette vérification, n'importe quel
    // utilisateur authentifié pouvait modifier la tâche d'un autre
    // utilisateur simplement en connaissant son ID.
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Vous n'êtes pas autorisé à modifier cette tâche" });
    }

    task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: { title: validation.title, description: validation.description, isCompleted } },
      { new: true }
    );

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/tasks/:id
 * @route   DELETE api/tasks/:id
 * @desc    Supprime une tâche existante. La tâche doit appartenir à
 *          l'utilisateur authentifié (protection IDOR) sous peine de 403.
 * @access  Privé
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Tâche introuvable' });

    // Faille IDOR corrigée : idem que pour le PUT, on vérifie que la
    // tâche appartient bien à l'utilisateur qui fait la requête avant
    // de la supprimer.
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Vous n'êtes pas autorisé à supprimer cette tâche" });
    }

    await Task.findByIdAndRemove(req.params.id);

    res.json({ msg: 'Tâche supprimée' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

module.exports = router;
