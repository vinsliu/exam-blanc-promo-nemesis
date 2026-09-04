import { render, screen } from '@testing-library/react';
import Alert from './Alert';

describe('Alert', () => {
  test("ne rend rien si children est vide", () => {
    const { container } = render(<Alert variant="error">{''}</Alert>);
    expect(container).toBeEmptyDOMElement();
  });

  test('affiche le message avec la classe correspondant à la variante', () => {
    render(<Alert variant="error">Une erreur est survenue</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Une erreur est survenue');
    expect(alert).toHaveClass('alert-error');
  });

  test('affiche un bouton de fermeture uniquement si onDismiss est fourni', () => {
    const { rerender } = render(<Alert variant="info">Message</Alert>);
    expect(screen.queryByRole('button', { name: /fermer/i })).not.toBeInTheDocument();

    rerender(
      <Alert variant="info" onDismiss={() => {}}>
        Message
      </Alert>
    );
    expect(screen.getByRole('button', { name: /fermer/i })).toBeInTheDocument();
  });
});
