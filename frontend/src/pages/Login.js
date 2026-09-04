import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Alert from "../components/Alert";
import PasswordInput from "../components/PasswordInput";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/login", { username, password });
      localStorage.setItem("token", res.data.token);
      if (onLogin) onLogin();
      navigate("/tasks");
    } catch (err) {
      console.error("Login failed", err);
      // On affiche désormais un message à l'utilisateur au lieu de laisser
      // le formulaire silencieux en cas d'identifiants invalides.
      setError(
        err.response?.data?.msg || "Échec de la connexion. Veuillez réessayer."
      );
    }
  };

  return (
    <div className="container">
      <h1>Connexion</h1>
      <Alert variant="error" onDismiss={() => setError("")}>
        {error}
      </Alert>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="login-username">Nom d'utilisateur</label>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <PasswordInput
          id="login-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="btn">
          Se connecter
        </button>
      </form>
    </div>
  );
};

export default Login;
