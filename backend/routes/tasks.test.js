const { sanitizeTaskInput } = require('./tasks');

describe('sanitizeTaskInput', () => {
  test('rejette un titre vide ou composé uniquement d\'espaces', () => {
    expect(sanitizeTaskInput('', 'desc').error).toMatch(/titre est requis/);
    expect(sanitizeTaskInput('   ', 'desc').error).toMatch(/titre est requis/);
  });

  test('rejette un titre qui n\'est pas une chaîne', () => {
    expect(sanitizeTaskInput(undefined, 'desc').error).toMatch(/titre est requis/);
    expect(sanitizeTaskInput(42, 'desc').error).toMatch(/titre est requis/);
  });

  test('rejette un titre trop long', () => {
    const longTitle = 'a'.repeat(201);
    expect(sanitizeTaskInput(longTitle, '').error).toMatch(/200 caractères/);
  });

  test('rejette une description trop longue', () => {
    const longDescription = 'a'.repeat(2001);
    expect(sanitizeTaskInput('Titre', longDescription).error).toMatch(/2000 caractères/);
  });

  test('trim le titre et la description valides', () => {
    expect(sanitizeTaskInput('  Titre  ', '  Description  ')).toEqual({
      title: 'Titre',
      description: 'Description',
    });
  });

  test('accepte une tâche sans description', () => {
    expect(sanitizeTaskInput('Titre', undefined)).toEqual({
      title: 'Titre',
      description: '',
    });
  });
});
