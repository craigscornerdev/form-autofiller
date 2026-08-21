const FieldMatcher = require('../field-matcher');

describe('FieldMatcher', () => {
  test('normalize lowercases and trims punctuation', () => {
    const fm = new FieldMatcher({});
    expect(fm.normalize('  Email Address (Work) ')).toBe('email address work');
  });

  test('getMatchingRule returns null for address-containing labels', () => {
    const fm = new FieldMatcher({});
    expect(fm.getMatchingRule('Mailing Address')).toBeNull();
  });

  test('getMatchingRule finds alias', () => {
    const fm = new FieldMatcher({});
    const rule = fm.getMatchingRule('Contact Email');
    expect(rule).not.toBeNull();
    expect(rule.profileField).toBe('email');
  });

  test('getSuggestion returns null when profile value missing or empty', () => {
    const profile = { email: '   ' };
    const fm = new FieldMatcher(profile);
    const suggestion = fm.getSuggestion({ label: 'Email' });
    expect(suggestion).toBeNull();
  });

  test('getSuggestion returns suggestion when profile has value', () => {
    const profile = { email: 'alice@example.org' };
    const fm = new FieldMatcher(profile);
    const suggestion = fm.getSuggestion({ label: 'Email' });
    expect(suggestion).toEqual({
      source: 'Email',
      value: 'alice@example.org',
      confidence: 'high'
    });
  });
});
