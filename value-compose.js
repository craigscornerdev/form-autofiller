/**
 * Value composition
 *
 * Named joiners that assemble a composite concept's value from its parts.
 * `compose(spec, partMap)` looks each part up in the `{conceptId: value}` part
 * map, drops the empty and missing ones, and joins what remains per the named
 * joiner — so empty or absent parts never leave a stray separator behind.
 * See DESIGN.md §5.2.
 *
 * Joiners:
 *   fullName      parts separated by a single space
 *   addressLine   parts separated by ", ", except a postal-code part joins the
 *                 preceding segment with a space ("City, ST 12345")
 *   join:<sep>    parts separated by the literal text after the colon
 */

const POSTAL_PART = /(?:^|[._-])(?:postal|post_?code|postcode|zip)(?:[._-]|$)/i;

function cleanValue(value) {
  if (value == null) return '';
  return String(value).trim();
}

function presentParts(spec, partMap) {
  const parts = spec && Array.isArray(spec.parts) ? spec.parts : [];
  const map = partMap && typeof partMap === 'object' ? partMap : {};
  return parts
    .map((id) => ({ id, value: cleanValue(map[id]) }))
    .filter((part) => part.value !== '');
}

function joinAddressLine(parts) {
  const segments = [];
  parts.forEach((part) => {
    if (POSTAL_PART.test(part.id) && segments.length > 0) {
      segments[segments.length - 1] += ` ${part.value}`;
    } else {
      segments.push(part.value);
    }
  });
  return segments.join(', ');
}

/**
 * @param {?{parts?: string[], joiner?: string}} spec
 * @param {?Object<string, *>} partMap
 * @returns {string}
 */
function compose(spec, partMap) {
  const parts = presentParts(spec, partMap);
  if (parts.length === 0) return '';

  const joiner = spec && typeof spec.joiner === 'string' ? spec.joiner : '';
  const values = parts.map((part) => part.value);

  if (joiner === 'addressLine') return joinAddressLine(parts);
  if (joiner.startsWith('join:')) return values.join(joiner.slice('join:'.length));
  return values.join(' '); // fullName, and the sensible default for any other joiner
}

const ValueCompose = { compose };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValueCompose;
}

if (typeof globalThis !== 'undefined') {
  globalThis.ValueCompose = ValueCompose;
}
