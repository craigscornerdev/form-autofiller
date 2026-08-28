/**
 * Tests for B2: the charity vocabulary ported to a preset (DESIGN.md §3.1).
 *
 * `presets/charity.js` must carry every field the current `FieldSemantics`
 * registry describes — same aliases, same select-option mappings, and every
 * `neverAutoFill` field expressed as `fillPolicy: "never"`. It declares
 * `extends: "base"` and is not consumed by the matcher yet.
 */

const charityConcepts = require('../presets/charity');
const { FieldSemantics } = require('../field-semantics');
const { load, validateConcept } = require('../concept-registry');

/** The current-registry field → ported concept id. Every semantics key appears. */
const CONCEPT_ID_FOR = {
  organizationName: 'org.legal_name',
  organizationType: 'org.type',
  ein: 'org.ein',
  yearFounded: 'org.year_founded',
  missionStatement: 'org.mission',
  organizationStreet: 'org.address.line1',
  organizationCity: 'org.address.city',
  organizationState: 'org.address.region',
  organizationPostalCode: 'org.address.postal_code',
  organizationCountry: 'org.address.country',
  organizationContactName: 'org.contact.full_name',
  organizationContactTitle: 'org.contact.title',
  organizationContactEmail: 'org.contact.email',
  organizationContactPhone: 'org.contact.phone',
  organizationWebsite: 'org.website',
  eventName: 'event.name',
  eventOrganizerName: 'event.organizer_name',
  eventOrganizerEmail: 'event.organizer_email',
  eventOrganizerPhone: 'event.organizer_phone',
  eventDate: 'event.date',
  eventDescription: 'event.description'
};

const byId = new Map(charityConcepts.map((c) => [c.id, c]));

describe('presets/charity.js — shape', () => {
  test('is a non-empty FieldConcept[] declaring extends: "base"', () => {
    expect(Array.isArray(charityConcepts)).toBe(true);
    expect(charityConcepts.length).toBeGreaterThan(0);
    expect(charityConcepts.extends).toBe('base');
  });

  test('every concept passes validation unchanged in shape', () => {
    for (const concept of charityConcepts) {
      expect(() => validateConcept(concept, concept.id)).not.toThrow();
    }
  });

  test('ids are org.* / event.* namespaced and unique', () => {
    const ids = charityConcepts.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^(org|event)\./.test(id))).toBe(true);
  });

  test('is exposed on globalThis for classic-script loading', () => {
    expect(globalThis.AutofillPresetCharity).toBe(charityConcepts);
  });
});

describe('presets/charity.js — parity with the current registry', () => {
  test('every FieldSemantics field is ported to a concept', () => {
    for (const key of Object.keys(FieldSemantics)) {
      expect(CONCEPT_ID_FOR[key]).toBeDefined();
      expect(byId.has(CONCEPT_ID_FOR[key])).toBe(true);
    }
    // no orphan mappings
    expect(Object.keys(CONCEPT_ID_FOR).sort())
      .toEqual(Object.keys(FieldSemantics).sort());
  });

  test('every original alias is preserved on the ported concept', () => {
    for (const [key, id] of Object.entries(CONCEPT_ID_FOR)) {
      const concept = byId.get(id);
      expect(concept.aliases).toEqual(
        expect.arrayContaining(FieldSemantics[key].aliases)
      );
    }
  });

  test('the source label carries over as the concept label', () => {
    for (const [key, id] of Object.entries(CONCEPT_ID_FOR)) {
      expect(byId.get(id).label).toBe(FieldSemantics[key].source);
    }
  });

  test('neverAutoFill → fillPolicy: "never"; the rest stay auto', () => {
    for (const [key, id] of Object.entries(CONCEPT_ID_FOR)) {
      const expected = FieldSemantics[key].neverAutoFill ? 'never' : 'auto';
      expect(byId.get(id).fillPolicy).toBe(expected);
    }
    expect(byId.get('event.name').fillPolicy).toBe('never');
    expect(byId.get('event.date').fillPolicy).toBe('never');
    expect(byId.get('event.description').fillPolicy).toBe('never');
  });

  test('select options carry over as enumValues, aliases intact', () => {
    const orgType = byId.get('org.type');
    expect(orgType.valueType).toBe('enum');
    expect(orgType.controlTypes).toEqual(['select']);
    for (const [value, aliases] of Object.entries(FieldSemantics.organizationType.selectOptions)) {
      const entry = orgType.enumValues.find((e) => e.value === value);
      expect(entry).toBeDefined();
      expect(entry.aliases).toEqual(expect.arrayContaining(aliases));
    }
  });

  test('field types carry over to a compatible valueType / controlTypes', () => {
    expect(byId.get('org.contact.email').valueType).toBe('email');
    expect(byId.get('org.contact.email').controlTypes).toContain('email');
    expect(byId.get('org.contact.phone').valueType).toBe('tel');
    expect(byId.get('org.website').valueType).toBe('url');
    expect(byId.get('org.mission').controlTypes).toEqual(['textarea']);
    expect(byId.get('event.description').controlTypes).toEqual(['textarea']);
  });
});

describe("concept-registry.load(['charity'])", () => {
  test('unions the base concepts underneath the charity concepts', () => {
    const registry = load(['charity']);
    const ids = registry.map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining([
      'contact.email', 'address.line1', 'org.legal_name', 'event.name'
    ]));
    // base pulled in first (extends resolved depth-first)
    expect(ids.indexOf('contact.email')).toBeLessThan(ids.indexOf('org.legal_name'));
  });

  test('base and charity ids do not collide', () => {
    const base = require('../presets/base').map((c) => c.id);
    const charity = charityConcepts.map((c) => c.id);
    expect(base.filter((id) => charity.includes(id))).toEqual([]);
  });
});

describe('presets/charity.js — known label misses stay covered', () => {
  test('nonprofit vs non-profit are both reachable', () => {
    expect(byId.get('org.legal_name').aliases).toEqual(
      expect.arrayContaining(['nonprofit name', 'non profit name'])
    );
    const orgType = byId.get('org.type');
    const npo = orgType.enumValues.find((e) => e.value === 'non-profit');
    expect(npo.aliases).toEqual(expect.arrayContaining(['nonprofit', 'non-profit']));
  });

  test('EIN / tax-id wording variants map to org.ein', () => {
    const aliases = byId.get('org.ein').aliases;
    expect(aliases).toEqual(expect.arrayContaining([
      'ein', 'tax id', 'federal tax id', 'employer identification number',
      'federal tax identification number', 'tax identification number'
    ]));
  });

  test('mission and event description are multiline concepts', () => {
    expect(byId.get('org.mission').valueType).toBe('multiline');
    expect(byId.get('event.description').valueType).toBe('multiline');
  });

  test('event name / date / description never auto-fill', () => {
    for (const id of ['event.name', 'event.date', 'event.description']) {
      expect(byId.get(id).fillPolicy).toBe('never');
    }
  });
});
