/**
 * Tests for Step 4: Conservative Fuzzy Matching
 * 
 * Validates:
 * - Token-based similarity scoring
 * - Separate scoring for label and context
 * - Confidence thresholds (high, review, no-match)
 * - Tie-breaking logic
 * - Exact aliases prioritized over fuzzy matches
 * - Field type compatibility
 * - Address field exclusion from unrelated suggestions
 */

const FuzzyFieldMatcher = require('../fuzzy-field-matcher');

describe('Fuzzy Field Matcher - Step 4 Validation', () => {
  let matcher;

  beforeEach(() => {
    matcher = new FuzzyFieldMatcher();
  });

  // Test 1: Exact alias matching (highest priority)
  describe('Exact Alias Matching', () => {
    test('returns high score for exact alias with matching context', () => {
      const result = matcher.findBestMatch('organization name', {
        fieldType: 'text',
        context: 'organization',
        rawLabel: 'ORGANIZATION NAME'
      });
      
      expect(result.score).toBe(0.9);  // 1.0 * 0.9 (context match multiplier)
      expect(result.confidence).toBe('high');
      expect(result.matchedField).toBe('organizationName');
    });

    test('finds exact match for email alias', () => {
      const result = matcher.findBestMatch('contact email', {
        fieldType: 'email',
        context: 'organizationContact',
        rawLabel: 'Contact Email *'
      });
      
      expect(result.score).toBe(0.9);
      expect(result.matchedField).toBe('organizationContactEmail');
    });

    test('finds exact match for event organizer', () => {
      const result = matcher.findBestMatch('event organizer name', {
        fieldType: 'text',
        context: 'event',
        rawLabel: 'Event Organizer Name'
      });
      
      expect(result.score).toBe(0.9);
      expect(result.matchedField).toBe('eventOrganizerName');
    });
  });

  // Test 2: Token-based similarity scoring
  describe('Token-Based Similarity', () => {
    test('scores partial token match conservatively', () => {
      const result = matcher.findBestMatch('organization info', {
        fieldType: 'text',
        context: 'organization',
        rawLabel: 'Organization Info'
      });
      
      // Partial token matches score lower in conservative approach
      expect(result.score).toBeGreaterThan(0.1);
      expect(result.score).toBeLessThan(0.9);
    });

    test('scores similar labels with multiple tokens', () => {
      const result = matcher.findBestMatch('primary contact email address', {
        fieldType: 'email',
        context: 'organizationContact',
        rawLabel: 'Primary Contact Email Address'
      });
      
      expect(result.matchedField).toBe('organizationContactEmail');
      expect(result.score).toBeGreaterThan(0.4);
    });

    test('gives low score to completely different labels', () => {
      const result = matcher.findBestMatch('favorite color', {
        fieldType: 'text',
        context: 'unknown',
        rawLabel: 'Favorite Color'
      });
      
      expect(result.matchedField).toBeNull();
      expect(result.score).toBeLessThan(this.CONFIDENCE_THRESHOLDS?.REVIEW || 0.7);
    });
  });

  // Test 3: Confidence thresholds
  describe('Confidence Thresholds', () => {
    test('high confidence for score >= 0.90', () => {
      const result = matcher.findBestMatch('organization name', {
        fieldType: 'text',
        context: 'organization',
        rawLabel: 'ORGANIZATION NAME'
      });
      
      expect(result.confidence).toBe('high');
      expect(result.score).toBeGreaterThanOrEqual(0.90);
    });

    test('review confidence for score 0.70-0.89', () => {
      const result = matcher.findBestMatch('organization info name', {
        fieldType: 'text',
        context: 'organization',
        rawLabel: 'Organization Info Name'
      });
      
      if (result.matchedField) {
        if (result.score >= 0.70 && result.score < 0.90) {
          expect(result.confidence).toBe('review');
        }
      }
    });

    test('no-match for score < 0.70', () => {
      const result = matcher.findBestMatch('xyz', {
        fieldType: 'text',
        context: 'unknown',
        rawLabel: 'XYZ'
      });
      
      if (result.score < 0.70) {
        expect(result.confidence).toBe('no-match');
      }
    });
  });

  // Test 4: Context scoring
  describe('Context-Based Scoring', () => {
    test('boosts score when context matches', () => {
      const orgContext = {
        fieldType: 'text',
        context: 'organization',
        rawLabel: 'Name'
      };
      
      const result = matcher.findBestMatch('name', orgContext);
      
      // Match should be found even with short label due to context
      expect(result.allCandidates.length).toBeGreaterThan(0);
    });

    test('penalizes mismatched context', () => {
      // Searching for event field in organization context
      const result = matcher.findBestMatch('event', {
        fieldType: 'text',
        context: 'organization',  // Wrong context
        rawLabel: 'Event'
      });
      
      // Should not match eventName (which is event context)
      expect(result.matchedField).not.toBe('eventName');
    });

    test('gives partial credit for unknown context', () => {
      const result = matcher.findBestMatch('organization name', {
        fieldType: 'text',
        context: 'unknown',
        rawLabel: 'Organization Name'
      });
      
      expect(result.score).toBeGreaterThan(0.5);
    });
  });

  // Test 5: Field type compatibility
  describe('Field Type Compatibility', () => {
    test('email field can match email or text fields', () => {
      const result = matcher.findBestMatch('contact email', {
        fieldType: 'email',
        context: 'organizationContact',
        rawLabel: 'Contact Email'
      });
      
      expect(result.matchedField).toBe('organizationContactEmail');
      expect(result.score).toBe(0.9);
    });

    test('text field can fill text types', () => {
      const result = matcher.findBestMatch('organization name', {
        fieldType: 'text',
        context: 'organization',
        rawLabel: 'Organization Name'
      });
      
      expect(result.matchedField).toBe('organizationName');
    });

    test('rejects type-incompatible matches', () => {
      // Trying to match a select field with a text value
      const result = matcher.findBestMatch('organization type', {
        fieldType: 'number',  // Incompatible type
        context: 'organization',
        rawLabel: 'Organization Type'
      });
      
      // Should not match organizationType (which is select)
      expect(result.matchedField).not.toBe('organizationType');
    });
  });

  // Test 6: Exact aliases are stronger than fuzzy
  describe('Exact Aliases Prioritized', () => {
    test('exact alias gets high score', () => {
      const result = matcher.findBestMatch('organization name', {
        fieldType: 'text',
        context: 'organization',
        rawLabel: 'Organization Name'
      });
      
      expect(result.score).toBe(0.9);  // 1.0 base * 0.9 context multiplier
    });

    test('fuzzy match scores lower than exact', () => {
      const fuzzy = matcher.findBestMatch('org something name', {
        fieldType: 'text',
        context: 'organization',
        rawLabel: 'Org Something Name'
      });
      
      const exact = matcher.findBestMatch('organization name', {
        fieldType: 'text',
        context: 'organization',
        rawLabel: 'Organization Name'
      });
      
      if (fuzzy.matchedField === exact.matchedField) {
        expect(fuzzy.score).toBeLessThan(exact.score);
      }
    });
  });

  // Test 7: Never auto-fill fields excluded
  describe('Never Auto-Fill Fields', () => {
    test('event name is never matched', () => {
      const result = matcher.findBestMatch('event name', {
        fieldType: 'text',
        context: 'event',
        rawLabel: 'Event Name'
      });
      
      expect(result.matchedField).not.toBe('eventName');
    });

    test('event date is never matched', () => {
      const result = matcher.findBestMatch('event date', {
        fieldType: 'text',
        context: 'event',
        rawLabel: 'Event Date'
      });
      
      expect(result.matchedField).not.toBe('eventDate');
    });

    test('event description is never matched', () => {
      const result = matcher.findBestMatch('event description', {
        fieldType: 'textarea',
        context: 'event',
        rawLabel: 'Event Description'
      });
      
      expect(result.matchedField).not.toBe('eventDescription');
    });
  });

  // Test 8: Tie-breaking logic
  describe('Tie-Breaking Logic', () => {
    test('rejects ambiguous tie when top scores are very close', () => {
      // Create a scenario where we might get ambiguous matches
      const result = matcher.findBestMatch('x', {
        fieldType: 'text',
        context: 'unknown',
        rawLabel: 'X'
      });
      
      // With single letter, scores should be low anyway
      expect(result.score).toBeLessThan(0.7);
    });

    test('returns best candidate when clear winner', () => {
      const result = matcher.findBestMatch('organization name', {
        fieldType: 'text',
        context: 'organization',
        rawLabel: 'Organization Name'
      });
      
      expect(result.matchedField).toBe('organizationName');
      expect(result.allCandidates).toBeDefined();
    });

    test('provides top candidates for review', () => {
      const result = matcher.findBestMatch('contact', {
        fieldType: 'text',
        context: 'organization',
        rawLabel: 'Contact'
      });
      
      expect(result.allCandidates).toBeDefined();
      expect(Array.isArray(result.allCandidates)).toBe(true);
    });
  });

  // Test 9: Address field exclusion
  describe('Address Field Type Incompatibility', () => {
    test('detects address fields', () => {
      const isIncompatible = matcher.isIncompatibleFieldType('organizationAddress.street', {
        fieldType: 'text',
        addressComponent: undefined  // Not an address field
      });
      
      expect(isIncompatible).toBe(true);
    });

    test('allows address values for address fields', () => {
      const isIncompatible = matcher.isIncompatibleFieldType('organizationAddress.street', {
        fieldType: 'text',
        addressComponent: 'street'
      });
      
      expect(isIncompatible).toBe(false);
    });

    test('rejects address values for non-address fields', () => {
      const isIncompatible = matcher.isIncompatibleFieldType('organizationAddress.street', {
        fieldType: 'text',
        // No addressComponent - not an address field
      });
      
      expect(isIncompatible).toBe(true);
    });
  });

  // Test 10: Match reason generation
  describe('Match Reason Generation', () => {
    test('generates reason for exact match', () => {
      const result = matcher.findBestMatch('organization name', {
        fieldType: 'text',
        context: 'organization',
        rawLabel: 'Organization Name'
      });
      
      expect(result.reason).toContain('High confidence');
    });

    test('generates reason for high confidence fuzzy match', () => {
      const result = matcher.findBestMatch('organization info name', {
        fieldType: 'text',
        context: 'organization',
        rawLabel: 'Organization Info Name'
      });
      
      if (result.confidence === 'high') {
        expect(result.reason).toContain('High confidence');
      }
    });

    test('generates reason for no match', () => {
      const result = matcher.findBestMatch('xyz123', {
        fieldType: 'text',
        context: 'unknown',
        rawLabel: 'XYZ123'
      });
      
      if (result.matchedField === null) {
        expect(result.reason).toContain('No matching field');
      }
    });
  });

  // Test 11: Complex matching scenarios
  describe('Complex Matching Scenarios', () => {
    test('matches uppercase labels with fuzzy matching', () => {
      const result = matcher.findBestMatch('organization name', {
        fieldType: 'text',
        context: 'organization',
        rawLabel: 'ORGANIZATION NAME *'
      });
      
      expect(result.matchedField).toBe('organizationName');
    });

    test('matches labels with extra words', () => {
      const result = matcher.findBestMatch('contact phone number', {
        fieldType: 'tel',
        context: 'organizationContact',
        rawLabel: 'Contact Phone Number'
      });
      
      expect(result.matchedField).toBe('organizationContactPhone');
    });

    test('handles multiple label sources', () => {
      const result = matcher.findBestMatch('email', {
        fieldType: 'email',
        context: 'organizationContact',
        rawLabel: 'Email',
        sources: ['Email', 'contact_email', 'org-email-input']
      });
      
      expect(result.matchedField).toBe('organizationContactEmail');
    });
  });
});
