const { validateRegistration } = require('./auth');

describe('validateRegistration', () => {
  test('rejette un username ou password manquant', () => {
    expect(validateRegistration('', 'Password1!')).toMatch(/tous les champs/);
    expect(validateRegistration('user', '')).toMatch(/tous les champs/);
  });

  test('rejette un username trop court', () => {
    expect(validateRegistration('ab', 'Password1!')).toMatch(/nom d'utilisateur/);
  });

  test('rejette un mot de passe trop court', () => {
    expect(validateRegistration('user', 'Pw1!')).toMatch(/8 caractères/);
  });

  test.each([
    ['password1!', 'sans majuscule'],
    ['PASSWORD1!', 'sans minuscule'],
    ['Password!!', 'sans chiffre'],
    ['Password11', 'sans caractère spécial'],
  ])('rejette un mot de passe %s (%s)', (password) => {
    expect(validateRegistration('user', password)).toMatch(
      /majuscule.*minuscule.*chiffre.*caractère spécial/
    );
  });

  test('accepte un username et un mot de passe valides', () => {
    expect(validateRegistration('user', 'Password1!')).toBeNull();
  });
});
