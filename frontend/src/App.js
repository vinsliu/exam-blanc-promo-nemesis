import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";

// La page n'a pas de style cohérent
// => ajouter un fichier CSS pour gérer les styles de la page
// => importer le fichier CSS dans le composant App
import "./App.css";
import Tasks from "./pages/Tasks";
import Header from "./components/Header";
import Footer from "./components/Footer";

/**
 * Composant App.
 *
 * Gère l'état d'authentification global (présence d'un token JWT dans le
 * localStorage) et le routage. La route /tasks est protégée : si
 * `isAuthenticated` devient `false` (ex: clic sur "Déconnexion"), elle est
 * immédiatement remplacée par une redirection vers /login au lieu de rester
 * affichée sans données valides.
 */
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const handleLogin = () => setIsAuthenticated(true);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="App">
        <header className="header">
          <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        </header>
        <main>
          <Routes>
            <Route
              path="/"
              element={
                <Navigate to={isAuthenticated ? "/tasks" : "/login"} replace />
              }
            />
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/tasks" replace />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/register"
              element={
                isAuthenticated ? (
                  <Navigate to="/tasks" replace />
                ) : (
                  <Register />
                )
              }
            />
            <Route
              path="/tasks"
              element={
                isAuthenticated ? <Tasks /> : <Navigate to="/login" replace />
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
