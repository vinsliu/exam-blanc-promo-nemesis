import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Alert from '../components/Alert';
import PasswordInput from '../components/PasswordInput';

// Délai laissé à l'utilisateur pour lire le message de succès avant la
// redirection automatique vers la page de connexion.
const REDIRECT_DELAY_MS = 1500;

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const redirectTimeoutRef = useRef(null);

  // Annule la redirection différée si l'utilisateur quitte la page avant
  // la fin du délai (ex: navigation manuelle).
  useEffect(() => {
    return () => clearTimeout(redirectTimeoutRef.current);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/auth/register', { username, password });
      setSuccess('Compte créé avec succès. Redirection vers la connexion...');
      redirectTimeoutRef.current = setTimeout(() => {
        navigate('/login');
      }, REDIRECT_DELAY_MS);
    } catch (err) {
      console.error('Register failed', err);
      setError(
        err.response?.data?.msg || "Échec de l'inscription. Veuillez réessayer."
      );
    }
  };

  return (
    <div className="container">
      <h1>Inscription</h1>
      <Alert variant="error" onDismiss={() => setError('')}>
        {error}
      </Alert>
      <Alert variant="success">{success}</Alert>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="register-username">Nom d'utilisateur</label>
          <input id="register-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <PasswordInput
          id="register-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="Au moins 8 caractères, avec une majuscule, une minuscule, un chiffre et un caractère spécial."
        />
        <button type="submit" className="btn" disabled={!!success}>
          S'inscrire
        </button>
      </form>
    </div>
  );
};

export default Register;
