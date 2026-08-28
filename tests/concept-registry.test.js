/**
 * Tests for B1: the FieldConcept schema + registry loader (DESIGN.md §3).
 *
 * `concept-registry.load(enabledPresets, customConcepts)` returns a validated,
 * unioned active registry and rejects malformed concepts. `presets/base.js`
 * holds the concepts every domain shares.
 */

const { load, validateConcept } = require('../concept-registry');
const baseConcepts = require('../presets/base');

/** A minimal concept that passes validation. */
const minimal = (over = {}) => ({
  id: 'demo.thing',
  label: 'Demo thing',
  aliases: ['demo thing'],
  valueType: 'text',
  controlTypes: ['text'],
  ...over
});

describe('presets/base.js', () => {
  test('is a non-empty FieldConcept[] of contact.* and address.* concepts', () => {
    expect(Array.isArray(baseConcepts)).toBe(true);
    expect(baseConcepts.length).toBeGreaterThan(0);
    const ids = baseConcepts.map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining([
      'contact.email', 'contact.phone', 'address.line1', 'address.city',
      'address.postal_code', 'address.country'
    ]));
    expect(ids.every((id) => /^(contact|address)\./.test(id))).toBe(true);
  });

  test('every base concept passes validation unchanged in shape', () => {
    for (const concept of baseConcepts) {
      expect(() => validateConcept(concept, concept.id)).not.toThrow();
    }
  });

  test('is exposed on globalThis for classic-script loading', () => {
    expect(globalThis.AutofillPresetBase).toBe(baseConcepts);
  });
});

describe('concept-registry.load — happy path', () => {
  test('load([]) is an empty registry', () => {
    expect(load([])).toEqual([]);
    expect(load()).toEqual([]);
  });

  test("load(['base']) unions the base preset by name", () => {
    const registry = load(['base']);
    expect(registry.map((c) => c.id).sort())
      .toEqual(baseConcepts.map((c) => c.id).sort());
  });

  test('applies defaults to a minimal concept', () => {
    const [concept] = load([], [minimal()]);
    expect(concept).toMatchObject({
      fillPolicy: 'auto',
      sensitive: false,
      autocompleteTokens: [],
      groupHints: [],
      enumValues: null,
      compose: null,
      examples: []
    });
  });

  test('returns clones — the input concept is not mutated or shared', () => {
    const input = minimal({ aliases: ['a', 'b'] });
    const [concept] = load([], [input]);
    concept.aliases.push('c');
    expect(input.aliases).toEqual(['a', 'b']);
  });

  test('unions by id — custom concepts win an id collision, slot kept', () => {
    const registry = load(['base'], [minimal({
      id: 'contact.email',
      label: 'Work email',
      aliases: ['work email']
    })]);
    const emails = registry.filter((c) => c.id === 'contact.email');
    expect(emails).toHaveLength(1);
    expect(emails[0].label).toBe('Work email');
    expect(registry).toHaveLength(baseConcepts.length);
    expect(registry[0].id).toBe(baseConcepts[0].id); // original ordering preserved
  });

  test('resolves an inline preset extends: "base" before its own concepts', () => {
    const registry = load([
      { extends: 'base', concepts: [minimal({ id: 'org.legal_name', label: 'Legal name', aliases: ['legal name'] })] }
    ]);
    const ids = registry.map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(['contact.email', 'org.legal_name']));
    expect(ids.indexOf('contact.email')).toBeLessThan(ids.indexOf('org.legal_name'));
  });

  test('a shared base is pulled in only once across two presets', () => {
    const registry = load([
      { extends: 'base', concepts: [minimal({ id: 'a.one', aliases: ['one'] })] },
      { extends: 'base', concepts: [minimal({ id: 'b.two', aliases: ['two'] })] }
    ]);
    const emails = registry.filter((c) => c.id === 'contact.email');
    expect(emails).toHaveLength(1);
  });

  test('validates enum and composite concepts and round-trips their payload', () => {
    const [enumConcept, compositeConcept] = load([], [
      minimal({
        id: 'org.type',
        valueType: 'enum',
        controlTypes: ['select'],
        enumValues: [{ value: 'nonprofit', aliases: ['non-profit', 'npo'] }]
      }),
      minimal({
        id: 'org.mailing_address',
        valueType: 'composite',
        compose: { parts: ['address.line1', 'address.city'], joiner: 'addressLine' }
      })
    ]);
    expect(enumConcept.enumValues).toEqual([{ value: 'nonprofit', aliases: ['non-profit', 'npo'] }]);
    expect(compositeConcept.compose).toEqual({
      parts: ['address.line1', 'address.city'], joiner: 'addressLine'
    });
  });
});

describe('concept-registry.load — rejects malformed input', () => {
  const rejects = (concept) => expect(() => load([], [concept])).toThrow(/concept-registry:/);

  test('missing id / label', () => {
    rejects(minimal({ id: undefined }));
    rejects(minimal({ label: '' }));
  });

  test('id that is not lowercase dot-namespaced', () => {
    rejects(minimal({ id: 'Demo.Thing' }));
    rejects(minimal({ id: 'demothing' }));
    rejects(minimal({ id: 'demo thing.x' }));
  });

  test('aliases / controlTypes wrong shape', () => {
    rejects(minimal({ aliases: 'demo thing' }));
    rejects(minimal({ aliases: ['ok', ''] }));
    rejects(minimal({ controlTypes: [] }));
  });

  test('unknown valueType or fillPolicy', () => {
    rejects(minimal({ valueType: 'phone' }));
    rejects(minimal({ fillPolicy: 'always' }));
  });

  test('enum without enumValues, and enumValues on a non-enum', () => {
    rejects(minimal({ id: 'org.type', valueType: 'enum', controlTypes: ['select'] }));
    rejects(minimal({ enumValues: [{ value: 'x', aliases: [] }] }));
  });

  test('composite without compose, and compose on a non-composite', () => {
    rejects(minimal({ id: 'org.addr', valueType: 'composite' }));
    rejects(minimal({ compose: { parts: ['a.b', 'c.d'], joiner: 'join' } }));
    rejects(minimal({ id: 'org.addr', valueType: 'composite', compose: { parts: ['a.b'], joiner: 'x' } }));
  });

  test('unknown preset name', () => {
    expect(() => load(['charity'])).toThrow(/unknown preset "charity"/);
  });

  test('non-array arguments', () => {
    expect(() => load('base')).toThrow(/concept-registry:/);
    expect(() => load([], {})).toThrow(/concept-registry:/);
  });
});
