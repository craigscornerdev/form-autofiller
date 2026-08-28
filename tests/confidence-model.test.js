/**
 * Confidence model through the matcher (DESIGN.md §6)
 *
 * `confidence = clamp01(S_label × S_prov)` — a single number per suggestion.
 * `S_label` comes from the matching tier, `S_prov` from `valueProvenance`.
 * Green (`high`) is reachable only when both factors are 1.0.
 */

const FieldMatcher = require('../field-matcher');
const ConfidenceGradient = require('../confidence-gradient');

describe('confidence model', () => {
  test('exact alias on a scalar profile value is a solid 1.0 / high', () => {
    const fm = new FieldMatcher({ email: 'alice@example.org' });
    const suggestion = fm.getSuggestion({ label: 'Email' });

    expect(suggestion.confidence).toBe(1);
    expect(suggestion.band).toBe('high');
    expect(suggestion.signals.labelMatch.strategy).toBe('exact-alias');
    expect(suggestion.signals.labelMatch.strength).toBe(1);
    expect(suggestion.signals.provenance).toEqual({ kind: 'profile-field', factor: 1, detail: 'scalar' });
    expect(suggestion.signals.rejected).toEqual([]);
  });

  test('a derived select value never turns green even on an exact alias', () => {
    const fm = new FieldMatcher({ organizationType: 'Charity' });
    const suggestion = fm.getSuggestion({
      label: 'Organization Type',
      type: 'select',
      options: [
        { value: '', text: '-- Select an option --' },
        { value: 'nonprofit', text: 'Non-Profit' },
        { value: 'charity', text: 'Registered Charity' }
      ]
    });

    expect(suggestion.signals.labelMatch.strength).toBe(1);
    expect(suggestion.signals.provenance).toEqual({ kind: 'derived', factor: 0.85, detail: 'select-option' });
    expect(suggestion.confidence).toBeCloseTo(0.85, 5);
    expect(suggestion.band).toBe('review');
  });

  test('a composed address value caps at S_prov 0.85 / review', () => {
    const fm = new FieldMatcher({
      organizationAddress: { street: '123 Maple Lane', city: 'Riverdale', state: 'New York', postalCode: '10471' }
    });
    const suggestion = fm.getSuggestion({ label: 'Mailing Address', type: 'textarea' });

    expect(suggestion.signals.labelMatch.strategy).toBe('exact-alias');
    expect(suggestion.signals.provenance).toEqual({ kind: 'derived', factor: 0.85, detail: 'composed' });
    expect(suggestion.confidence).toBeCloseTo(0.85, 5);
    expect(suggestion.band).toBe('review');
  });

  test('a fuzzy label match carries its raw tier score as S_label', () => {
    const fm = new FieldMatcher({ email: 'alice@example.org' });
    const suggestion = fm.getSuggestion({ label: 'Email Address for Contact', type: 'text' });

    expect(suggestion.signals.labelMatch.strategy).toBe('fuzzy');
    expect(suggestion.signals.labelMatch.strength).toBeGreaterThan(0.6);
    expect(suggestion.signals.labelMatch.strength).toBeLessThan(0.9);
    // scalar provenance => confidence is the label score unchanged
    expect(suggestion.confidence).toBeCloseTo(suggestion.signals.labelMatch.strength, 10);
    expect(suggestion.band).toBe('review');
    expect(suggestion.signals.rejected.length).toBeGreaterThan(0);
    expect(suggestion.signals.rejected[0]).toEqual({
      conceptId: expect.any(String),
      score: expect.any(Number),
      reason: expect.any(String)
    });
  });

  test('the reported band always matches ConfidenceGradient.bandFor(confidence)', () => {
    const fm = new FieldMatcher({
      email: 'alice@example.org',
      organizationType: 'Charity',
      organizationAddress: { street: '123 Maple Lane', city: 'Riverdale', state: 'New York', postalCode: '10471' }
    });

    const fields = [
      { label: 'Email' },
      { label: 'Organization Type', type: 'select', options: [{ value: 'charity', text: 'Registered Charity' }] },
      { label: 'Mailing Address', type: 'textarea' },
      { label: 'Email Address for Contact', type: 'text' }
    ];

    fields.forEach((field) => {
      const suggestion = fm.getSuggestion(field);
      expect(suggestion.band).toBe(ConfidenceGradient.bandFor(suggestion.confidence));
    });
  });

  describe('valueProvenance', () => {
    const fm = new FieldMatcher({});

    test('select controls resolve to a derived value', () => {
      expect(fm.valueProvenance({ type: 'select' }, { profileField: 'organizationType' }))
        .toEqual({ kind: 'derived', factor: 0.85, detail: 'select-option' });
    });

    test('a compose rule resolves to a composed value', () => {
      const composedRule = {
        compose: { parts: ['address.line1', 'address.city'], joiner: 'addressLine' }
      };
      expect(fm.valueProvenance({ type: 'text' }, composedRule))
        .toEqual({ kind: 'derived', factor: 0.85, detail: 'composed' });
    });

    test('a plain scalar field resolves to the profile value directly', () => {
      expect(fm.valueProvenance({ type: 'text' }, { profileField: 'email' }))
        .toEqual({ kind: 'profile-field', factor: 1, detail: 'scalar' });
    });
  });
});
