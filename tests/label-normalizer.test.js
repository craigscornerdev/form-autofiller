/**
 * Tests for Step 3: Label Normalization and Field Context Detection
 * 
 * Validates:
 * - Basic normalization (case, punctuation, whitespace)
 * - Required marker removal (asterisks, etc.)
 * - Uppercase label handling
 * - Label gathering from multiple sources
 * - Context detection (organization vs event)
 * - Field context object creation
 */

const LabelNormalizer = require('../label-normalizer');
const FieldMatcher = require('../field-matcher');
const FuzzyFieldMatcher = require('../fuzzy-field-matcher');

describe('Label Normalizer - Step 3 Validation', () => {
  let normalizer;

  beforeEach(() => {
    normalizer = new LabelNormalizer();
  });

  // Test 1: Basic normalization
  describe('Basic Normalization', () => {
    test('converts uppercase to lowercase', () => {
      expect(normalizer.normalize('ORGANIZATION NAME')).toBe('organization name');
      expect(normalizer.normalize('Email')).toBe('email');
      expect(normalizer.normalize('PHONE NUMBER')).toBe('phone number');
    });

    test('removes extra whitespace', () => {
      expect(normalizer.normalize('  organization   name  ')).toBe('organization name');
      expect(normalizer.normalize('\n\tcontact email\r')).toBe('contact email');
    });

    test('trims leading and trailing whitespace', () => {
      expect(normalizer.normalize('   email address   ')).toBe('email address');
      expect(normalizer.normalize('\t\tphone\t\t')).toBe('phone');
    });

    test('handles empty and null inputs', () => {
      expect(normalizer.normalize('')).toBe('');
      expect(normalizer.normalize(null)).toBe('');
      expect(normalizer.normalize(undefined)).toBe('');
    });
  });

  // Test 2: Punctuation removal
  describe('Punctuation Removal', () => {
    test('removes asterisks (required markers)', () => {
      expect(normalizer.normalize('Organization Name *')).toBe('organization name');
      expect(normalizer.normalize('* Email Address')).toBe('email address');
      expect(normalizer.normalize('Phone ***')).toBe('phone');
    });

    test('removes common punctuation', () => {
      expect(normalizer.normalize('Street Address.')).toBe('street address');
      expect(normalizer.normalize('City, State')).toBe('city state');
      expect(normalizer.normalize('Postal Code (ZIP)')).toBe('postal code zip');
    });

    test('removes special characters but preserves meaning', () => {
      expect(normalizer.normalize('Organization@Info')).toBe('organization info');
      expect(normalizer.normalize('Email#Address')).toBe('email address');
    });

    test('preserves slashes for compound terms', () => {
      expect(normalizer.normalize('State/Province')).toBe('state/province');
      expect(normalizer.normalize('First/Last Name')).toBe('first/last name');
    });

    test('a tight slash is a compound; a spaced slash is a separator', () => {
      expect(normalizer.normalize('State/Province')).toBe('state/province');
      expect(normalizer.normalize('State / Province')).toBe('state province');
      expect(normalizer.normalize('State  /  Province')).toBe('state province');
    });

    test('handles mixed case with punctuation', () => {
      expect(normalizer.normalize('  CONTACT EMAIL (WORK) *  ')).toBe('contact email work');
    });
  });

  // Test 3: Required marker handling
  describe('Required Marker Removal', () => {
    test('removes asterisks', () => {
      expect(normalizer.normalize('Email *')).toBe('email');
      expect(normalizer.normalize('* Email')).toBe('email');
    });

    test('removes multiple required markers', () => {
      expect(normalizer.normalize('Required Field ***')).toBe('required field');
    });

    test('removes other marker characters', () => {
      expect(normalizer.normalize('Organization Name † ')).toBe('organization name');
    });
  });

  // Test 4: Label gathering from multiple sources
  describe('Gather Label Sources', () => {
    test('gathers label text', () => {
      const field = { label: 'Organization Name' };
      const sources = normalizer.gatherLabelSources(field);
      expect(sources).toContain('Organization Name');
    });

    test('humanizes name attribute', () => {
      const field = { name: 'organization_name' };
      const sources = normalizer.gatherLabelSources(field);
      expect(sources.some(s => s.includes('organization'))).toBe(true);
    });

    test('humanizes id attribute', () => {
      const field = { id: 'org-name-input' };
      const sources = normalizer.gatherLabelSources(field);
      expect(sources.some(s => s.includes('org') || s.includes('name'))).toBe(true);
    });

    test('includes placeholder text', () => {
      const field = { placeholder: 'Enter organization name' };
      const sources = normalizer.gatherLabelSources(field);
      expect(sources).toContain('Enter organization name');
    });

    test('includes aria-label', () => {
      const field = { 'aria-label': 'Organization Name Input' };
      const sources = normalizer.gatherLabelSources(field);
      expect(sources).toContain('Organization Name Input');
    });

    test('includes aria-describedby and aria-labelledby references', () => {
      const field = {
        'aria-describedby': 'org-hint',
        'aria-labelledby': 'org-label'
      };
      const sources = normalizer.gatherLabelSources(field);
      expect(sources.length).toBeGreaterThan(0);
    });

    test('gathers multiple sources into array', () => {
      const field = {
        label: 'Organization Name',
        name: 'organization_name',
        placeholder: 'Enter full legal name',
        'aria-label': 'Organization Name Input'
      };
      const sources = normalizer.gatherLabelSources(field);
      expect(sources.length).toBeGreaterThan(2);
    });

    test('filters out empty strings', () => {
      const field = {
        label: 'Email',
        name: '',
        placeholder: ''
      };
      const sources = normalizer.gatherLabelSources(field);
      expect(sources).not.toContain('');
      expect(sources).toContain('Email');
    });
  });

  // Test 5: Context detection
  describe('Context Detection', () => {
    test('detects organization context', () => {
      expect(normalizer.detectContext('organization name')).toBe('organization');
      expect(normalizer.detectContext('charity name')).toBe('organization');
      expect(normalizer.detectContext('ein')).toBe('organization');
      expect(normalizer.detectContext('mission statement')).toBe('organization');
    });

    test('detects organization address context', () => {
      expect(normalizer.detectContext('street address')).toBe('organization');
      expect(normalizer.detectContext('city')).toBe('organization');
      expect(normalizer.detectContext('postal code')).toBe('organization');
    });

    test('detects organization contact context', () => {
      expect(normalizer.detectContext('primary contact name')).toBe('organizationContact');
      expect(normalizer.detectContext('contact email')).toBe('organizationContact');
      expect(normalizer.detectContext('contact phone')).toBe('organizationContact');
    });

    test('detects event context', () => {
      expect(normalizer.detectContext('event name')).toBe('event');
      expect(normalizer.detectContext('organizer name')).toBe('event');
      expect(normalizer.detectContext('event organizer')).toBe('event');
      expect(normalizer.detectContext('coordinator')).toBe('event');
    });

    test('handles uppercase labels for context detection', () => {
      expect(normalizer.detectContext('ORGANIZATION NAME')).toBe('organization');
      expect(normalizer.detectContext('EVENT ORGANIZER')).toBe('event');
      expect(normalizer.detectContext('CONTACT EMAIL')).toBe('organizationContact');
    });

    test('respects explicit context parameter', () => {
      expect(normalizer.detectContext('name', 'event')).toBe('event');
      expect(normalizer.detectContext('email', 'organizationContact')).toBe('organizationContact');
    });

    test('returns unknown for ambiguous labels', () => {
      expect(normalizer.detectContext('text')).toBe('unknown');
      expect(normalizer.detectContext('field')).toBe('unknown');
    });
  });

  // Test 6: Complex label scenarios
  describe('Complex Label Scenarios', () => {
    test('handles uppercase with required marker', () => {
      expect(normalizer.normalize('  ORGANIZATION NAME *  ')).toBe('organization name');
    });

    test('handles abbreviations in labels', () => {
      expect(normalizer.normalize('ORG. NAME')).toBe('org name');
      expect(normalizer.normalize('ST / PROV.')).toBe('st prov');
    });

    test('handles label with leading/trailing punctuation', () => {
      expect(normalizer.normalize('...Email Address...')).toBe('email address');
      expect(normalizer.normalize('(Organization Name)')).toBe('organization name');
    });

    test('handles labels with tabs and newlines', () => {
      expect(normalizer.normalize('Email\tAddress')).toBe('email address');
      expect(normalizer.normalize('Organization\nName')).toBe('organization name');
    });

    test('handles mixed punctuation and markers', () => {
      expect(normalizer.normalize('CONTACT EMAIL (WORK) - PRIMARY *')).toBe('contact email work primary');
    });
  });

  // Test 7: Field context creation
  describe('Field Context Object', () => {
    test('creates complete field context', () => {
      const field = {
        label: 'Organization Name',
        name: 'org_name',
        id: 'org-input',
        placeholder: 'Enter name',
        fieldType: 'text'
      };
      const context = normalizer.createFieldContext(field, 'ORGANIZATION NAME *');
      
      expect(context.rawLabel).toBe('ORGANIZATION NAME *');
      expect(context.normalized).toBe('organization name');
      expect(context.context).toBe('organization');
      expect(context.fieldType).toBe('text');
      expect(context.sources.length).toBeGreaterThan(0);
    });

    test('preserves raw label for audit', () => {
      const field = { label: 'Email Address *' };
      const context = normalizer.createFieldContext(field, '  EMAIL ADDRESS *  ');
      
      expect(context.rawLabel).toBe('  EMAIL ADDRESS *  ');
      expect(context.normalized).toBe('email address');
    });

    test('handles email field context', () => {
      const field = {
        label: 'Contact Email',
        name: 'email',
        fieldType: 'email'
      };
      const context = normalizer.createFieldContext(field, 'Contact Email');
      
      expect(context.normalized).toBe('contact email');
      expect(context.context).toBe('organizationContact');
    });

    test('handles event organizer context', () => {
      const field = {
        label: 'Event Organizer Name',
        name: 'event_organizer_name',
        fieldType: 'text'
      };
      const context = normalizer.createFieldContext(field, 'EVENT ORGANIZER NAME');
      
      expect(context.context).toBe('event');
    });
  });

  // Test 8: Edge cases
  describe('Edge Cases', () => {
    test('handles single character labels', () => {
      expect(normalizer.normalize('A')).toBe('a');
      expect(normalizer.normalize('*')).toBe('');
    });

    test('handles very long labels', () => {
      const longLabel = 'This is a very long label with multiple words and punctuation marks';
      const normalized = normalizer.normalize(longLabel);
      expect(normalized).toBe('this is a very long label with multiple words and punctuation marks');
    });

    test('handles labels with numbers', () => {
      expect(normalizer.normalize('Address Line 1')).toBe('address line 1');
      expect(normalizer.normalize('Field 123')).toBe('field 123');
    });

    test('handles unicode characters', () => {
      // Should handle common unicode gracefully
      const result = normalizer.normalize('Café Name');
      expect(result).toBeTruthy();
    });

    test('normalizes null field element gracefully', () => {
      const sources = normalizer.gatherLabelSources(null);
      expect(sources).toEqual([]);
    });
  });
});

describe('One canonical normalizer across call sites', () => {
  test('FieldMatcher and FuzzyFieldMatcher normalize through LabelNormalizer', () => {
    expect(new FieldMatcher({}).labelNormalizer).toBeInstanceOf(LabelNormalizer);
    expect(new FuzzyFieldMatcher().labelNormalizer).toBeInstanceOf(LabelNormalizer);
  });

  test('a raw label reduces identically wherever it is normalized', () => {
    const raw = '  FIRST/LAST NAME * ';
    const canonical = new LabelNormalizer().normalize(raw);

    expect(canonical).toBe('first/last name');
    expect(new FieldMatcher({}).labelNormalizer.normalize(raw)).toBe(canonical);
    expect(new FuzzyFieldMatcher().labelNormalizer.normalize(raw)).toBe(canonical);
  });

  test('every registry alias is stored in canonical normalized form', () => {
    const canon = new LabelNormalizer();

    new FieldMatcher({}).rules.forEach((rule) => {
      rule.aliases.forEach((alias) => {
        expect(alias).toBe(canon.normalize(alias));
      });
    });

    const fuzzy = new FuzzyFieldMatcher();
    Object.values(fuzzy.fieldDefs).forEach((fieldDef) => {
      fieldDef.aliases.forEach((alias) => {
        expect(alias).toBe(canon.normalize(alias));
      });
    });
  });
});
