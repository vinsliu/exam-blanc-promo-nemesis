import React, { useState } from "react";
import api from "../api";
import Alert from "./Alert";

/**
 * Formulaire de création d'une tâche.
 *
 * Envoie un POST /api/tasks avec le titre saisi, puis délègue la mise à
 * jour de la liste au parent via la prop `addTask`. La validation (titre
 * requis, longueur maximale, ...) est entièrement gérée par le backend
 * (backend/routes/tasks.js) : ce composant se contente de transmettre la
 * saisie et d'afficher le message d'erreur renvoyé par l'API le cas échéant.
 *
 * @param {object} props
 * @param {(task: object) => void} props.addTask - Callback appelé avec la
 *   tâche créée (renvoyée par l'API) pour que le parent mette sa liste à jour.
 */
const TaskForm = ({ addTask }) => {
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    try {
      const res = await api.post(
        "/tasks",
        { title },
        {
          headers: { "x-auth-token": token },
        }
      );
      addTask(res.data);
      setTitle("");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.msg || "Impossible d'ajouter la tâche, veuillez réessayer."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-group">
      <Alert variant="error" onDismiss={() => setError("")}>
        {error}
      </Alert>
      <input
        type="text"
        placeholder="Ajouter une tâche ..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button type="submit" className="btn" style={{ marginTop: "10px" }}>
        Ajouter Tâche
      </button>
    </form>
  );
};

export default TaskForm;
