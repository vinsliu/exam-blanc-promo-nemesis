import React from "react";
import "./Alert.css";

// Tracés repris de lucide-react (bibliothèque d'icônes utilisée par
// shadcn/ui), pour un rendu identique aux icônes "circle-alert",
// "circle-check-big" et "info".
const ICONS = {
  error: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  success: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.801 10A10 10 0 1 1 17 3.335" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  ),
  info: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

/**
 * Notification "toast" réutilisable : s'affiche en overlay fixe en haut de
 * l'écran (au-dessus du contenu, sous le header), comme un `alert()`
 * natif mais stylé — icône + texte, refermable, rendu inspiré du
 * composant "Alert" de shadcn/ui mais en CSS pur (voir Alert.css).
 *
 * Ne rend rien si `children` est vide/falsy, pour pouvoir écrire
 * directement `<Alert variant="error">{error}</Alert>` sans garde
 * `{error && ...}`.
 *
 * @param {object} props
 * @param {"error"|"success"|"info"} [props.variant="info"] - Style du toast.
 * @param {React.ReactNode} props.children - Contenu du message.
 * @param {() => void} [props.onDismiss] - Si fourni, affiche un bouton de
 *   fermeture qui appelle ce callback (ex: pour vider l'état d'erreur du parent).
 */
const Alert = ({ variant = "info", children, onDismiss }) => {
  if (!children) return null;

  return (
    <div className={`alert alert-${variant}`} role="alert">
      <span className="alert-icon" aria-hidden="true">
        {ICONS[variant]}
      </span>
      <div className="alert-description">{children}</div>
      {onDismiss && (
        <button
          type="button"
          className="alert-close"
          aria-label="Fermer"
          onClick={onDismiss}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
