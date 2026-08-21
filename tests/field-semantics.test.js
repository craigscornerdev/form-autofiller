/**
 * Tests for Step 2: Field Semantics and Profile Data
 * 
 * Validates:
 * - Profile data structure is complete
 * - Field semantics map correctly to profile paths
 * - Aliases are properly defined
 * - Context separation works (organization vs event)
 * - Never-auto-fill fields are marked correctly
 * - Validation rules work as expected
 */

const {
  FieldSemantics,
  ContextSeparators,
  NeverAutoFillFields,
  ValidationRules
} = require('../field-semantics');

describe('Field Semantics - Step 2 Validation', () => {
  
  // Test 1: All required profile paths are defined
  describe('Profile Path Coverage', () => {
    test('organizationName maps to correct profile path', () => {
      expect(FieldSemantics.organizationName.profilePath).toBe('organization.name');
    });

    test('organizationContactEmail maps to correct profile path', () => {
      expect(FieldSemantics.organizationContactEmail.profilePath).toBe('organizationContact.email');
    });

    test('eventOrganizerName maps to correct profile path', () => {
      expect(FieldSemantics.eventOrganizerName.profilePath).toBe('eventOrganizer.name');
    });

    test('event-specific fields have null profile path', () => {
      expect(FieldSemantics.eventName.profilePath).toBeNull();
      expect(FieldSemantics.eventDate.profilePath).toBeNull();
      expect(FieldSemantics.eventDescription.profilePath).toBeNull();
    });
  });

  // Test 2: Aliases are comprehensive
  describe('Field Aliases', () => {
    test('organizationName has multiple aliases', () => {
      const aliases = FieldSemantics.organizationName.aliases;
      expect(aliases).toContain('organization name');
      expect(aliases).toContain('charity name');
      expect(aliases).toContain('nonprofit name');
      expect(aliases.length).toBeGreaterThan(3);
    });

    test('all field aliases are lowercase and normalized', () => {
      Object.entries(FieldSemantics).forEach(([fieldName, field]) => {
        if (field.aliases) {
          field.aliases.forEach(alias => {
            expect(alias).toBe(alias.toLowerCase());
            // Allow lowercase letters, numbers, spaces, and slashes (for "state/province")
            expect(alias).toMatch(/^[a-z0-9\s\/]+$/);
          });
        }
      });
    });

    test('organizationType includes all select option mappings', () => {
      const selectOptions = FieldSemantics.organizationType.selectOptions;
      expect(selectOptions['non-profit']).toContain('nonprofit');
      expect(selectOptions['charity']).toContain('charity');
      expect(selectOptions['community']).toContain('community');
      expect(selectOptions['faith']).toContain('faith-based');
    });
  });

  // Test 3: Context separation
  describe('Context Separation', () => {
    test('organization fields have organization context', () => {
      expect(FieldSemantics.organizationName.context).toBe('organization');
      expect(FieldSemantics.ein.context).toBe('organization');
      expect(FieldSemantics.organizationWebsite.context).toBe('organization');
    });

    test('organizationContact fields have organizationContact context', () => {
      expect(FieldSemantics.organizationContactName.context).toBe('organizationContact');
      expect(FieldSemantics.organizationContactEmail.context).toBe('organizationContact');
      expect(FieldSemantics.organizationContactPhone.context).toBe('organizationContact');
    });

    test('event organizer fields have event context', () => {
      expect(FieldSemantics.eventOrganizerName.context).toBe('event');
      expect(FieldSemantics.eventOrganizerEmail.context).toBe('event');
      expect(FieldSemantics.eventName.context).toBe('event');
    });

    test('address fields grouped with organization context', () => {
      expect(FieldSemantics.organizationStreet.context).toBe('organization');
      expect(FieldSemantics.organizationCity.context).toBe('organization');
      expect(FieldSemantics.organizationPostalCode.context).toBe('organization');
    });
  });

  // Test 4: Address components properly tagged
  describe('Address Component Tagging', () => {
    test('address fields have addressComponent property', () => {
      expect(FieldSemantics.organizationStreet.addressComponent).toBe('street');
      expect(FieldSemantics.organizationCity.addressComponent).toBe('city');
      expect(FieldSemantics.organizationState.addressComponent).toBe('state');
      expect(FieldSemantics.organizationPostalCode.addressComponent).toBe('postalCode');
    });

    test('only address fields have addressComponent property', () => {
      const addressComponents = Object.entries(FieldSemantics)
        .filter(([_, field]) => field.addressComponent);
      expect(addressComponents.length).toBe(5); // street, city, state, postal, country
    });
  });

  // Test 5: Never-auto-fill fields are marked
  describe('Never Auto-Fill Fields', () => {
    test('event-specific fields are marked as neverAutoFill', () => {
      expect(FieldSemantics.eventName.neverAutoFill).toBe(true);
      expect(FieldSemantics.eventDate.neverAutoFill).toBe(true);
      expect(FieldSemantics.eventDescription.neverAutoFill).toBe(true);
    });

    test('NeverAutoFillFields array contains event fields', () => {
      expect(NeverAutoFillFields).toContain('eventName');
      expect(NeverAutoFillFields).toContain('eventDate');
      expect(NeverAutoFillFields).toContain('eventDescription');
    });

    test('organization fields are not marked neverAutoFill', () => {
      expect(FieldSemantics.organizationName.neverAutoFill).not.toBe(true);
      expect(FieldSemantics.organizationContactEmail.neverAutoFill).not.toBe(true);
      expect(FieldSemantics.eventOrganizerEmail.neverAutoFill).not.toBe(true);
    });
  });

  // Test 6: Field types are consistent
  describe('Field Types', () => {
    test('email fields have email type', () => {
      expect(FieldSemantics.organizationContactEmail.fieldType).toBe('email');
      expect(FieldSemantics.eventOrganizerEmail.fieldType).toBe('email');
    });

    test('phone fields have tel type', () => {
      expect(FieldSemantics.organizationContactPhone.fieldType).toBe('tel');
      expect(FieldSemantics.eventOrganizerPhone.fieldType).toBe('tel');
    });

    test('textarea fields are tagged correctly', () => {
      expect(FieldSemantics.missionStatement.fieldType).toBe('textarea');
      expect(FieldSemantics.eventDescription.fieldType).toBe('textarea');
    });

    test('select fields are tagged correctly', () => {
      expect(FieldSemantics.organizationType.fieldType).toBe('select');
    });
  });

  // Test 7: Required field flags
  describe('Required Field Flags', () => {
    test('critical organization fields are required', () => {
      expect(FieldSemantics.organizationName.required).toBe(true);
      expect(FieldSemantics.ein.required).toBe(true);
    });

    test('address components are required', () => {
      expect(FieldSemantics.organizationStreet.required).toBe(true);
      expect(FieldSemantics.organizationCity.required).toBe(true);
      expect(FieldSemantics.organizationState.required).toBe(true);
      expect(FieldSemantics.organizationPostalCode.required).toBe(true);
    });

    test('organization contact fields are required', () => {
      expect(FieldSemantics.organizationContactName.required).toBe(true);
      expect(FieldSemantics.organizationContactEmail.required).toBe(true);
      expect(FieldSemantics.organizationContactPhone.required).toBe(true);
    });

    test('optional fields are not required', () => {
      expect(FieldSemantics.organizationWebsite.required).toBe(false);
      expect(FieldSemantics.missionStatement.required).toBe(false);
      expect(FieldSemantics.yearFounded.required).toBe(false);
    });
  });

  // Test 8: Validation rules
  describe('Validation Rules', () => {
    test('EIN validation accepts correct format', () => {
      expect(ValidationRules.ein.test('12-3456789')).toBe(true);
      expect(ValidationRules.ein.test('99-9999999')).toBe(true);
    });

    test('EIN validation rejects incorrect format', () => {
      expect(ValidationRules.ein.test('123456789')).toBe(false);
      expect(ValidationRules.ein.test('12-345678')).toBe(false);
    });

    test('email validation accepts common formats', () => {
      expect(ValidationRules.email.test('alice@example.org')).toBe(true);
      expect(ValidationRules.email.test('user+tag@domain.co.uk')).toBe(true);
    });

    test('email validation rejects invalid formats', () => {
      expect(ValidationRules.email.test('invalid.email')).toBe(false);
      expect(ValidationRules.email.test('@domain.com')).toBe(false);
    });

    test('URL validation accepts HTTP(S) URLs', () => {
      expect(ValidationRules.url.test('https://example.com')).toBe(true);
      expect(ValidationRules.url.test('http://example.org')).toBe(true);
    });

    test('URL validation rejects non-HTTP URLs', () => {
      expect(ValidationRules.url.test('example.com')).toBe(false);
      expect(ValidationRules.url.test('ftp://example.com')).toBe(false);
    });
  });

  // Test 9: Field coverage
  describe('Field Coverage', () => {
    test('at least 20 fields are defined', () => {
      const fieldCount = Object.keys(FieldSemantics).length;
      expect(fieldCount).toBeGreaterThanOrEqual(20);
    });

    test('every field has source, aliases, required, fieldType, and context', () => {
      Object.entries(FieldSemantics).forEach(([fieldName, field]) => {
        expect(field.source).toBeDefined();
        expect(field.aliases).toBeDefined();
        expect(field.aliases.length).toBeGreaterThan(0);
        expect(field.required).toBeDefined();
        expect(field.fieldType).toBeDefined();
        expect(field.context).toBeDefined();
      });
    });
  });

  // Test 10: Context separators defined
  describe('Context Separators', () => {
    test('context separators defined for organization', () => {
      expect(ContextSeparators.organization).toContain('organization');
      expect(ContextSeparators.organization.length).toBeGreaterThan(1);
    });

    test('context separators defined for organizationContact', () => {
      expect(ContextSeparators.organizationContact).toBeDefined();
    });

    test('context separators defined for event', () => {
      expect(ContextSeparators.event).toContain('event');
    });
  });
});
