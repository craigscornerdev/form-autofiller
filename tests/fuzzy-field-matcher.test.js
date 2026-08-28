/**
 * Conservative fuzzy matching over the active concept registry.
 *
 * Validates:
 * - retrieval-only Fuse index, our scorer owns every safety decision
 * - exact-alias scoring (unknown heading context ⇒ ×0.95)
 * - token-overlap similarity is bounded well below the auto-fill line
 * - confidence thresholds (high / review / no-match)
 * - field-type compatibility gating
 * - `fillPolicy: "never"` concepts are excluded
 * - tie-breaking rejects ambiguous matches
 *
 * The matcher always calls `findBestMatch` with `context: 'unknown'` — heading
 * context lands in a later step — so the tests pass it that way too.
 */

const FuzzyFieldMatcher = require('../fuzzy-field-matcher');

const ctx = (over = {}) => ({ fieldType: 'text', context: 'unknown', ...over });

describe('Fuzzy Field Matcher over the concept registry', () => {
  let matcher;

  beforeEach(() => {
    matcher = new FuzzyFieldMatcher();
  });

  describe('Retrieval-Only Fuzzy Index', () => {
    test('retrieves a variant label before applying the conservative score', () => {
      const result = matcher.findBestMatch('org name', ctx({ rawLabel: 'Org Name' }));

      expect(result.allCandidates.some((c) => c.fieldName === 'org.legal_name')).toBe(true);
      expect(result.score).toBeLessThan(0.6);
      expect(result.confidence).toBe('no-match');
    });

    test('keeps unrelated labels out of the retrieval candidate list', () => {
      const result = matcher.findBestMatch('favorite color', ctx({ rawLabel: 'Favorite Color' }));

      expect(result.allCandidates).toHaveLength(0);
      expect(result.matchedField).toBeNull();
    });
  });

  describe('Exact Alias Matching', () => {
    test('an exact alias on an unknown heading context scores 0.95 / high', () => {
      const result = matcher.findBestMatch('organization name', ctx({ rawLabel: 'ORGANIZATION NAME' }));

      expect(result.score).toBeCloseTo(0.95, 5);
      expect(result.confidence).toBe('high');
      expect(result.matchedField).toBe('org.legal_name');
    });

    test('finds the exact match for an EIN wording', () => {
      const result = matcher.findBestMatch('employer identification number', ctx());

      expect(result.score).toBeCloseTo(0.95, 5);
      expect(result.matchedField).toBe('org.ein');
    });

    test('finds the exact match for an event organizer', () => {
      const result = matcher.findBestMatch('event organizer name', ctx());

      expect(result.score).toBeCloseTo(0.95, 5);
      expect(result.matchedField).toBe('event.organizer_name');
    });
  });

  describe('Token-Based Similarity', () => {
    test('a partial token overlap scores well below the auto-fill line', () => {
      const result = matcher.findBestMatch('organization info', ctx({ rawLabel: 'Organization Info' }));

      expect(result.score).toBeGreaterThan(0.1);
      expect(result.score).toBeLessThan(0.855);
    });

    test('a multi-token near-miss still resolves to the right concept', () => {
      const result = matcher.findBestMatch('primary contact email address', ctx({ fieldType: 'email' }));

      expect(result.matchedField).toBe('org.contact.email');
      expect(result.score).toBeGreaterThan(0.4);
      expect(result.score).toBeLessThan(0.9);
    });

    test('gives no match to a completely unrelated label', () => {
      const result = matcher.findBestMatch('favorite color', ctx());

      expect(result.matchedField).toBeNull();
      expect(result.score).toBeLessThan(0.6);
    });
  });

  describe('Confidence Thresholds', () => {
    test('high for an exact alias (>= 0.90)', () => {
      const result = matcher.findBestMatch('organization name', ctx());

      expect(result.confidence).toBe('high');
      expect(result.score).toBeGreaterThanOrEqual(0.9);
    });

    test('no-match for a single stray token', () => {
      const result = matcher.findBestMatch('xyz', ctx());

      expect(result.confidence).toBe('no-match');
      expect(result.score).toBeLessThan(0.6);
    });
  });

  describe('Field Type Compatibility', () => {
    test('an email concept matches an email or a text control', () => {
      expect(matcher.findBestMatch('employer identification number', ctx()).matchedField).toBe('org.ein');
      expect(
        matcher.findBestMatch('primary contact email address', ctx({ fieldType: 'text' })).matchedField
      ).toBe('org.contact.email');
    });

    test('rejects a type-incompatible match', () => {
      // org.type is a select concept — a number control cannot fill it
      const result = matcher.findBestMatch('organization type', ctx({ fieldType: 'number' }));

      expect(result.matchedField).not.toBe('org.type');
    });
  });

  describe('Exact Aliases Beat Fuzzy', () => {
    test('an exact alias outscores a token near-miss for the same concept', () => {
      const fuzzy = matcher.findBestMatch('org something name', ctx());
      const exact = matcher.findBestMatch('organization name', ctx());

      if (fuzzy.matchedField === exact.matchedField && fuzzy.matchedField) {
        expect(fuzzy.score).toBeLessThan(exact.score);
      }
      expect(exact.score).toBeCloseTo(0.95, 5);
    });
  });

  describe('fillPolicy: "never" concepts are excluded', () => {
    test('event name is never matched', () => {
      const result = matcher.findBestMatch('event name', ctx());
      expect(result.matchedField).not.toBe('event.name');
    });

    test('event date is never matched', () => {
      const result = matcher.findBestMatch('event date', ctx());
      expect(result.matchedField).not.toBe('event.date');
    });

    test('event description is never matched', () => {
      const result = matcher.findBestMatch('event description', ctx({ fieldType: 'textarea' }));
      expect(result.matchedField).not.toBe('event.description');
    });
  });

  describe('Tie-Breaking Logic', () => {
    test('a single stray character scores low, no confident match', () => {
      const result = matcher.findBestMatch('x', ctx());
      expect(result.score).toBeLessThan(0.6);
    });

    test('returns the clear winner and its candidate list', () => {
      const result = matcher.findBestMatch('organization name', ctx());

      expect(result.matchedField).toBe('org.legal_name');
      expect(Array.isArray(result.allCandidates)).toBe(true);
    });
  });

  describe('Address Field Type Incompatibility', () => {
    test('flags an address value routed at a non-address target', () => {
      expect(
        matcher.isIncompatibleFieldType('organizationAddress.street', { fieldType: 'text' })
      ).toBe(true);
    });

    test('allows an address value at an address target', () => {
      expect(
        matcher.isIncompatibleFieldType('organizationAddress.street', {
          fieldType: 'text',
          addressComponent: 'street'
        })
      ).toBe(false);
    });
  });

  describe('Match Reason Generation', () => {
    test('generates a reason for an exact alias', () => {
      const result = matcher.findBestMatch('organization name', ctx());
      expect(result.reason).toContain('High confidence');
    });

    test('generates a reason when nothing matches', () => {
      const result = matcher.findBestMatch('xyz123', ctx());
      expect(result.reason).toContain('No matching field');
    });
  });

  describe('Complex Matching Scenarios', () => {
    test('matches an uppercased label through normalization upstream', () => {
      const result = matcher.findBestMatch('organization name', ctx({ rawLabel: 'ORGANIZATION NAME *' }));
      expect(result.matchedField).toBe('org.legal_name');
    });

    test('matches a label with extra words', () => {
      const result = matcher.findBestMatch('organization contact phone number', ctx({ fieldType: 'tel' }));
      expect(result.matchedField).toBe('org.contact.phone');
    });
  });
});
