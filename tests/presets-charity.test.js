/**
 * Tests for the charity preset (DESIGN.md §3.1).
 *
 * `presets/charity.js` is the charity/nonprofit vocabulary the matcher runs on.
 * These pin the vocabulary contract: the labels and aliases every ported concept
 * must keep answering to, the select-option mappings, and the `fillPolicy: "never"`
 * concepts. It declares `extends: "base"`.
 */

const charityConcepts = require('../presets/charity');
const { load, validateConcept } = require('../concept-registry');

/**
 * The vocabulary each concept must carry. Labels shown in the profile UI;
 * `aliases` are the wordings a form label may use; `fillPolicy` gates autofill.
 */
const VOCABULARY = {
  'org.legal_name': {
    label: 'Organization name',
    aliases: ['organization name', 'name of organization', 'charity name', 'nonprofit name', 'non profit name', 'organization legal name']
  },
  'org.type': {
    label: 'Organization type',
    aliases: ['organization type', 'type of organization', 'charity type', 'nonprofit type'],
    enumValues: {
      'non-profit': ['nonprofit', 'non-profit', 'npo'],
      charity: ['charity', 'registered charity'],
      community: ['community', 'community organization'],
      faith: ['faith-based', 'faith based', 'religious']
    }
  },
  'org.ein': {
    label: 'EIN / Tax ID',
    aliases: ['ein', 'ein number', 'ein tax id', 'employer identification number', 'tax id', 'tax id number', 'federal tax id']
  },
  'org.year_founded': {
    label: 'Year founded',
    aliases: ['year founded', 'founded', 'year established', 'established']
  },
  'org.mission': {
    label: 'Mission statement',
    aliases: ['mission statement', 'mission', 'organization mission', 'our mission']
  },
  'org.address.line1': {
    label: 'Organization street address',
    aliases: ['street address', 'street', 'address line', 'address line 1', 'organization address', 'organization street']
  },
  'org.address.city': {
    label: 'Organization city',
    aliases: ['city', 'organization city']
  },
  'org.address.region': {
    label: 'Organization state / province',
    aliases: ['state', 'state/province', 'state province', 'state or province', 'province', 'organization state']
  },
  'org.address.postal_code': {
    label: 'Organization postal code',
    aliases: ['postal code', 'zip code', 'zip', 'postcode', 'organization postal code']
  },
  'org.address.country': {
    label: 'Organization country',
    aliases: ['country', 'organization country', 'country of operation']
  },
  'org.contact.full_name': {
    label: 'Organization contact name',
    aliases: ['primary contact name', 'contact name', 'organization contact name', 'contact person', 'primary contact']
  },
  'org.contact.title': {
    label: 'Organization contact title',
    aliases: ['contact title', 'title', 'position', 'contact position', 'organization contact title']
  },
  'org.contact.email': {
    label: 'Organization contact email',
    aliases: ['contact email', 'email', 'email address', 'contact email address', 'organization email', 'organization contact email']
  },
  'org.contact.phone': {
    label: 'Organization contact phone',
    aliases: ['contact phone', 'phone', 'phone number', 'contact phone number', 'telephone', 'contact telephone', 'organization phone', 'organization contact phone']
  },
  'org.website': {
    label: 'Organization website',
    aliases: ['website', 'organization website', 'charity website', 'nonprofit website', 'web site', 'organization web site']
  },
  'event.name': {
    label: 'Event name',
    aliases: ['event name', 'name of event', 'campaign name', 'event or campaign name'],
    fillPolicy: 'never'
  },
  'event.organizer_name': {
    label: 'Event organizer name',
    aliases: ['organizer name', 'event organizer name', 'event organizer', 'organizer', 'coordinator name', 'event coordinator']
  },
  'event.organizer_email': {
    label: 'Event organizer email',
    aliases: ['organizer email', 'event organizer email', 'organizer email address', 'coordinator email']
  },
  'event.organizer_phone': {
    label: 'Event organizer phone',
    aliases: ['organizer phone', 'event organizer phone', 'organizer phone number', 'coordinator phone']
  },
  'event.date': {
    label: 'Event date',
    aliases: ['event date', 'date', 'date of event'],
    fillPolicy: 'never'
  },
  'event.description': {
    label: 'Event description',
    aliases: ['event description', 'description', 'event details', 'about the event'],
    fillPolicy: 'never'
  }
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

describe('presets/charity.js — vocabulary contract', () => {
  test('every contract concept is present in the preset', () => {
    for (const id of Object.keys(VOCABULARY)) {
      expect(byId.has(id)).toBe(true);
    }
  });

  test('every contract alias is carried on its concept', () => {
    for (const [id, spec] of Object.entries(VOCABULARY)) {
      expect(byId.get(id).aliases).toEqual(expect.arrayContaining(spec.aliases));
    }
  });

  test('the profile-UI label is carried on its concept', () => {
    for (const [id, spec] of Object.entries(VOCABULARY)) {
      expect(byId.get(id).label).toBe(spec.label);
    }
  });

  test('fillPolicy is "never" for the event concepts, "auto" otherwise', () => {
    for (const [id, spec] of Object.entries(VOCABULARY)) {
      expect(byId.get(id).fillPolicy).toBe(spec.fillPolicy || 'auto');
    }
    expect(byId.get('event.name').fillPolicy).toBe('never');
    expect(byId.get('event.date').fillPolicy).toBe('never');
    expect(byId.get('event.description').fillPolicy).toBe('never');
  });

  test('select options are expressed as enumValues, aliases intact', () => {
    const orgType = byId.get('org.type');
    expect(orgType.valueType).toBe('enum');
    expect(orgType.controlTypes).toEqual(['select']);
    for (const [value, aliases] of Object.entries(VOCABULARY['org.type'].enumValues)) {
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
