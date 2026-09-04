import React, { useState } from "react";
import "./PasswordInput.css";

// Tracés repris de lucide-react ("eye" / "eye-off"), pour rester cohérent
// avec les icônes déjà utilisées dans <Alert />.
const EYE_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EYE_OFF_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
    <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
    <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
    <path d="m2 2 20 20" />
  </svg>
);

/**
 * Champ de mot de passe avec un bouton pour en basculer la visibilité
 * (afficher/masquer en clair), pour faciliter la vérification de la
 * saisie par l'utilisateur sans dupliquer ce comportement sur chaque page.
 *
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.value
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} props.onChange
 * @param {string} [props.label="Mot de passe"]
 * @param {React.ReactNode} [props.hint] - Texte d'aide affiché en
 *   permanence sous le champ (ex: règles de composition attendues à
 *   l'inscription). Non affiché si omis (ex: page de connexion).
 */
const PasswordInput = ({
  id,
  value,
  onChange,
  label = "Mot de passe",
  hint,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <div className="password-field">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={
            visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
          aria-pressed={visible}
        >
          {visible ? EYE_OFF_ICON : EYE_ICON}
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="password-hint">
          {hint}
        </p>
      )}
    </div>
  );
};

export default PasswordInput;
