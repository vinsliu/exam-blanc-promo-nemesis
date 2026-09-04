import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Ajout
import api from "../api";
import TaskForm from "../components/TaskForm";
import Alert from "../components/Alert";

/**
 * Page "Mes Tâches".
 *
 * Récupère la liste des tâches de l'utilisateur connecté (GET /api/tasks),
 * permet d'en ajouter via <TaskForm />, d'en modifier le titre et le statut
 * "terminée" (PUT /api/tasks/:id), et d'en supprimer. Redirige vers /login
 * si aucun token n'est présent dans le localStorage.
 */
const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const navigate = useNavigate(); // Ajout

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const fetchTasks = async () => {
      try {
        const res = await api.get("/tasks", {
          headers: { "x-auth-token": token },
        });
        setTasks(res.data);
      } catch (err) {
        // Token expiré/invalide ou erreur serveur : on informe l'utilisateur
        // au lieu de laisser la page vide sans explication.
        console.error(err);
        setError("Impossible de charger vos tâches. Veuillez vous reconnecter.");
      }
    };
    fetchTasks();
  }, [navigate]);

  /**
   * Ajoute une tâche fraîchement créée en tête de liste, sans recharger la page.
   * @param {object} task - Tâche renvoyée par l'API après création (POST /api/tasks).
   */
  const addTask = (task) => {
    setTasks((prevTasks) => [task, ...prevTasks]);
  };

  const deleteTask = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/tasks/${id}`, { headers: { "x-auth-token": token } });
      setTasks(tasks.filter((task) => task._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Envoie une mise à jour partielle d'une tâche à l'API et synchronise
   * la liste locale avec la tâche renvoyée par le backend.
   * @param {string} id
   * @param {{ title: string, description?: string, isCompleted: boolean }} updates
   * @returns {Promise<boolean>} `true` si la mise à jour a réussi.
   */
  const updateTask = async (id, updates) => {
    const token = localStorage.getItem("token");
    try {
      const res = await api.put(`/tasks/${id}`, updates, {
        headers: { "x-auth-token": token },
      });
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task._id === id ? res.data : task))
      );
      return true;
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.msg || "Impossible de modifier la tâche."
      );
      return false;
    }
  };

  /** Bascule le statut "terminée" d'une tâche. */
  const toggleCompleted = (task) => {
    updateTask(task._id, {
      title: task.title,
      description: task.description,
      isCompleted: !task.isCompleted,
    });
  };

  /** Passe la tâche en mode édition du titre. */
  const startEdit = (task) => {
    setError("");
    setEditingId(task._id);
    setEditTitle(task.title);
  };

  /** Annule l'édition en cours sans rien envoyer à l'API. */
  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  /** Valide l'édition en cours du titre. Le backend fait foi pour la validation. */
  const saveEdit = async (task) => {
    const success = await updateTask(task._id, {
      title: editTitle,
      description: task.description,
      isCompleted: task.isCompleted,
    });
    if (success) {
      cancelEdit();
    }
  };

  return (
    <div className="container">
      <h1>Mes Tâches</h1>
      <Alert variant="error" onDismiss={() => setError("")}>
        {error}
      </Alert>
      <TaskForm addTask={addTask} />
      <ul className="task-list">
        {tasks.map((task) =>
          editingId === task._id ? (
            <li key={task._id} className="task-item">
              <input
                type="text"
                className="task-edit-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                autoFocus
              />
              <div className="task-actions">
                <button className="btn-save" onClick={() => saveEdit(task)}>
                  Enregistrer
                </button>
                <button className="btn-cancel" onClick={cancelEdit}>
                  Annuler
                </button>
              </div>
            </li>
          ) : (
            <li
              key={task._id}
              className={`task-item ${task.isCompleted ? "completed" : ""}`}
            >
              <label className="task-label">
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => toggleCompleted(task)}
                />
                <span>{task.title}</span>
              </label>
              <div className="task-actions">
                <button className="btn-edit" onClick={() => startEdit(task)}>
                  Modifier
                </button>
                <button
                  className="btn-delete"
                  onClick={() => deleteTask(task._id)}
                >
                  Supprimer
                </button>
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  );
};

export default Tasks;
