/**
 * Concept registry — load + union enabled presets (plus custom concepts) into a
 * single validated active registry the matcher can consume.
 *
 * A `FieldConcept` is one thing a form might ask the user for, described in a
 * domain-neutral shape. Domain knowledge lives entirely in `presets/` as data;
 * this module never contains a domain string.
 *
 * See DESIGN.md §3.
 */

/**
 * @typedef {Object} FieldConcept
 * @property {string} id
 *   Stable, lowercase, dot-namespaced id, e.g. `"contact.email"`.
 * @property {string} label
 *   Human label shown in the generated profile UI.
 * @property {string[]} aliases
 *   Normalized label strings this concept answers to (may be empty when the
 *   concept is only reachable via `autocompleteTokens`).
 * @property {string[]} [autocompleteTokens]
 *   HTML `autocomplete` tokens that imply this concept. Defaults to `[]`.
 * @property {string[]} [groupHints]
 *   Words likely to appear in a nearby section heading. Defaults to `[]`.
 * @property {'text'|'email'|'tel'|'url'|'number'|'date'|'postal-code'|'multiline'|'enum'|'composite'} valueType
 * @property {string[]} controlTypes
 *   Form control types this concept may fill (non-empty).
 * @property {'auto'|'review'|'never'} [fillPolicy]
 *   Fill behaviour. Defaults to `"auto"`.
 * @property {boolean} [sensitive]
 *   When true the concept is never captured by learning and never auto-filled.
 *   Defaults to `false`.
 * @property {?Array<{value: string, aliases: string[]}>} [enumValues]
 *   Required when `valueType === "enum"`; must be `null` otherwise.
 * @property {?{parts: string[], joiner: string}} [compose]
 *   Required when `valueType === "composite"`; must be `null` otherwise.
 * @property {string[]} [examples]
 *   Optional sample values; aid embedding / disambiguation. Defaults to `[]`.
 */

const VALUE_TYPES = [
  'text', 'email', 'tel', 'url', 'number', 'date',
  'postal-code', 'multiline', 'enum', 'composite'
];
const FILL_POLICIES = ['auto', 'review', 'never'];
const ID_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*(?:\.[a-z0-9]+(?:_[a-z0-9]+)*)+$/;

function fail(where, reason) {
  throw new Error(`concept-registry: ${where}: ${reason}`);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isStringArray(value) {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

/**
 * Validate one raw concept and return a normalized clone with defaults applied.
 * Throws on any malformed field.
 * @param {*} raw
 * @param {string} where - context for error messages
 * @returns {FieldConcept}
 */
function validateConcept(raw, where = 'concept') {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    fail(where, 'concept must be a plain object');
  }

  if (!isNonEmptyString(raw.id)) fail(where, 'missing string "id"');
  const id = raw.id;
  if (!ID_PATTERN.test(id)) {
    fail(`${where} ("${id}")`,
      'id must be lowercase and dot-namespaced, e.g. "contact.email"');
  }

  const at = `concept "${id}"`;

  if (!isNonEmptyString(raw.label)) fail(at, 'missing string "label"');
  if (!Array.isArray(raw.aliases) || !raw.aliases.every(isNonEmptyString)) {
    fail(at, '"aliases" must be an array of non-empty strings');
  }
  if (raw.autocompleteTokens !== undefined && !isStringArray(raw.autocompleteTokens)) {
    fail(at, '"autocompleteTokens" must be an array of non-empty strings');
  }
  if (raw.groupHints !== undefined && !isStringArray(raw.groupHints)) {
    fail(at, '"groupHints" must be an array of non-empty strings');
  }
  if (!VALUE_TYPES.includes(raw.valueType)) {
    fail(at, `"valueType" must be one of: ${VALUE_TYPES.join(', ')}`);
  }
  if (!Array.isArray(raw.controlTypes) || raw.controlTypes.length === 0 ||
      !raw.controlTypes.every(isNonEmptyString)) {
    fail(at, '"controlTypes" must be a non-empty array of non-empty strings');
  }

  const fillPolicy = raw.fillPolicy === undefined ? 'auto' : raw.fillPolicy;
  if (!FILL_POLICIES.includes(fillPolicy)) {
    fail(at, `"fillPolicy" must be one of: ${FILL_POLICIES.join(', ')}`);
  }
  if (raw.sensitive !== undefined && typeof raw.sensitive !== 'boolean') {
    fail(at, '"sensitive" must be a boolean');
  }
  if (raw.examples !== undefined && !isStringArray(raw.examples)) {
    fail(at, '"examples" must be an array of non-empty strings');
  }

  let enumValues = raw.enumValues == null ? null : raw.enumValues;
  if (raw.valueType === 'enum') {
    if (!Array.isArray(enumValues) || enumValues.length === 0) {
      fail(at, 'an "enum" concept requires a non-empty "enumValues" array');
    }
    enumValues = enumValues.map((entry, i) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        fail(at, `enumValues[${i}] must be a plain object`);
      }
      if (!isNonEmptyString(entry.value)) {
        fail(at, `enumValues[${i}] missing string "value"`);
      }
      if (!Array.isArray(entry.aliases) || !entry.aliases.every(isNonEmptyString)) {
        fail(at, `enumValues[${i}] "aliases" must be an array of non-empty strings`);
      }
      return { value: entry.value, aliases: [...entry.aliases] };
    });
  } else if (enumValues != null) {
    fail(at, '"enumValues" is only valid when valueType === "enum"');
  }

  let compose = raw.compose == null ? null : raw.compose;
  if (raw.valueType === 'composite') {
    if (!compose || typeof compose !== 'object' || Array.isArray(compose)) {
      fail(at, 'a "composite" concept requires a "compose" object');
    }
    if (!isStringArray(compose.parts) || compose.parts.length < 2) {
      fail(at, '"compose.parts" must list at least two concept ids');
    }
    if (!isNonEmptyString(compose.joiner)) {
      fail(at, '"compose.joiner" must be a non-empty string');
    }
    compose = { parts: [...compose.parts], joiner: compose.joiner };
  } else if (compose != null) {
    fail(at, '"compose" is only valid when valueType === "composite"');
  }

  return {
    id,
    label: raw.label,
    aliases: [...raw.aliases],
    autocompleteTokens: raw.autocompleteTokens ? [...raw.autocompleteTokens] : [],
    groupHints: raw.groupHints ? [...raw.groupHints] : [],
    valueType: raw.valueType,
    controlTypes: [...raw.controlTypes],
    fillPolicy,
    sensitive: raw.sensitive === true,
    enumValues,
    compose,
    examples: raw.examples ? [...raw.examples] : []
  };
}

/**
 * Resolve a built-in preset by name, in both Node (require) and browser
 * (globalThis) contexts. Returns `undefined` when the preset is unknown.
 * @param {string} name
 */
function builtinPreset(name) {
  if (typeof require === 'function') {
    try {
      return require('./presets/' + name);
    } catch (err) {
      return undefined;
    }
  }
  const globals = typeof globalThis !== 'undefined' ? globalThis : {};
  const key = 'AutofillPreset' + name.charAt(0).toUpperCase() + name.slice(1);
  return globals[key];
}

function toExtendsList(ext) {
  if (ext == null) return [];
  return Array.isArray(ext) ? ext : [ext];
}

/**
 * Coerce a preset value into `{ concepts, ext }`. A preset is either a
 * `FieldConcept[]` (optionally carrying `.extends`) or an object
 * `{ concepts: FieldConcept[], extends?: string|string[] }`.
 */
function normalizePreset(preset, where) {
  if (Array.isArray(preset)) {
    return { concepts: preset, ext: toExtendsList(preset.extends) };
  }
  if (preset && typeof preset === 'object' && Array.isArray(preset.concepts)) {
    return { concepts: preset.concepts, ext: toExtendsList(preset.extends) };
  }
  fail(where, 'preset must be a FieldConcept[] or { concepts: FieldConcept[] }');
}

/**
 * Load the active registry from the enabled presets and any custom concepts.
 *
 * `enabledPresets` entries are either a built-in preset name (string) or an
 * inline preset (`FieldConcept[]` / `{ concepts, extends }`). `extends` is
 * resolved depth-first so shared concepts land before the presets that build on
 * them. Custom concepts are appended last, so they win id collisions.
 *
 * Concepts are unioned by `id` (last definition wins, original slot kept). Any
 * malformed concept or unknown preset throws.
 *
 * @param {Array<string|FieldConcept[]|{concepts: FieldConcept[]}>} [enabledPresets]
 * @param {FieldConcept[]} [customConcepts]
 * @returns {FieldConcept[]} the validated, unioned active registry
 */
function load(enabledPresets = [], customConcepts = []) {
  if (!Array.isArray(enabledPresets)) fail('load', '"enabledPresets" must be an array');
  if (!Array.isArray(customConcepts)) fail('load', '"customConcepts" must be an array');

  /** @type {FieldConcept[]} */
  const collected = [];
  const seenPresets = new Set();

  const addNormalized = (norm, label) => {
    for (const dep of norm.ext) {
      if (typeof dep === 'string') addByName(dep, `${label} extends`);
      else addNormalized(normalizePreset(dep, `${label} extends`), `${label} extends`);
    }
    norm.concepts.forEach((concept, i) => {
      collected.push(validateConcept(concept, `${label}[${i}]`));
    });
  };

  const addByName = (name, label) => {
    if (seenPresets.has(name)) return;
    seenPresets.add(name);
    const preset = builtinPreset(name);
    if (preset === undefined) fail('load', `unknown preset "${name}"`);
    addNormalized(normalizePreset(preset, `preset "${name}"`), `preset "${name}"`);
  };

  enabledPresets.forEach((entry, i) => {
    if (typeof entry === 'string') addByName(entry, `preset "${entry}"`);
    else addNormalized(normalizePreset(entry, `preset[${i}]`), `preset[${i}]`);
  });

  customConcepts.forEach((concept, i) => {
    collected.push(validateConcept(concept, `customConcepts[${i}]`));
  });

  const byId = new Map();
  for (const concept of collected) byId.set(concept.id, concept);
  return Array.from(byId.values());
}

const ConceptRegistry = { load, validateConcept, VALUE_TYPES, FILL_POLICIES };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConceptRegistry;
}

if (typeof globalThis !== 'undefined') {
  globalThis.ConceptRegistry = ConceptRegistry;
}
