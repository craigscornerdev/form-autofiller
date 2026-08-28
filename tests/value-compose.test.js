/**
 * Tests for B5a: named composite joiners (DESIGN.md §5.2).
 *
 * `compose({ parts, joiner }, partMap)` resolves each part id against the
 * part map, drops empty and missing parts, and joins the rest. No stray
 * separators when parts drop out.
 */

const { compose } = require('../value-compose');

describe('value-compose', () => {
  describe('fullName', () => {
    const spec = { parts: ['p.first', 'p.middle', 'p.last'], joiner: 'fullName' };

    test('joins present parts with a single space', () => {
      expect(compose(spec, { 'p.first': 'Jane', 'p.middle': 'Q', 'p.last': 'Doe' }))
        .toBe('Jane Q Doe');
    });

    test('a missing middle part leaves no double space', () => {
      expect(compose(spec, { 'p.first': 'Jane', 'p.last': 'Doe' })).toBe('Jane Doe');
    });

    test('an empty part is treated as missing', () => {
      expect(compose(spec, { 'p.first': 'Jane', 'p.middle': '   ', 'p.last': 'Doe' }))
        .toBe('Jane Doe');
    });

    test('trims each part', () => {
      expect(compose(spec, { 'p.first': '  Jane ', 'p.last': ' Doe  ' })).toBe('Jane Doe');
    });

    test('a single present part composes to just that part', () => {
      expect(compose(spec, { 'p.first': 'Jane' })).toBe('Jane');
    });

    test('no present parts compose to an empty string', () => {
      expect(compose(spec, {})).toBe('');
      expect(compose(spec, { 'p.first': '', 'p.last': null })).toBe('');
    });
  });

  describe('addressLine', () => {
    const spec = {
      parts: ['a.line1', 'a.city', 'a.region', 'a.postal_code'],
      joiner: 'addressLine'
    };
    const full = {
      'a.line1': '123 Maple Lane',
      'a.city': 'Springfield',
      'a.region': 'IL',
      'a.postal_code': '62704'
    };

    test('postal code joins the preceding segment with a space, the rest by ", "', () => {
      expect(compose(spec, full)).toBe('123 Maple Lane, Springfield, IL 62704');
    });

    test('missing postal code drops without a trailing separator', () => {
      const { 'a.postal_code': _omit, ...noPostal } = full;
      expect(compose(spec, noPostal)).toBe('123 Maple Lane, Springfield, IL');
    });

    test('missing region keeps the comma list intact', () => {
      const { 'a.region': _omit, ...noRegion } = full;
      expect(compose(spec, noRegion)).toBe('123 Maple Lane, Springfield 62704');
    });

    test('street line only', () => {
      expect(compose(spec, { 'a.line1': '123 Maple Lane' })).toBe('123 Maple Lane');
    });

    test('empty part map composes to an empty string', () => {
      expect(compose(spec, {})).toBe('');
    });

    test('coerces a non-string part value', () => {
      expect(compose(spec, { ...full, 'a.postal_code': 62704 }))
        .toBe('123 Maple Lane, Springfield, IL 62704');
    });

    test('recognises a zip-named postal part', () => {
      const zipSpec = { parts: ['a.city', 'a.zip'], joiner: 'addressLine' };
      expect(compose(zipSpec, { 'a.city': 'Springfield', 'a.zip': '62704' }))
        .toBe('Springfield 62704');
    });
  });

  describe('join:<sep>', () => {
    const spec = { parts: ['x.a', 'x.b', 'x.c'], joiner: 'join:, ' };

    test('joins present parts with the literal separator', () => {
      expect(compose(spec, { 'x.a': 'one', 'x.b': 'two', 'x.c': 'three' }))
        .toBe('one, two, three');
    });

    test('a dropped middle part leaves no doubled separator', () => {
      expect(compose(spec, { 'x.a': 'one', 'x.c': 'three' })).toBe('one, three');
    });

    test('preserves separator whitespace', () => {
      expect(compose({ parts: ['x.a', 'x.b'], joiner: 'join: / ' }, { 'x.a': 'a', 'x.b': 'b' }))
        .toBe('a / b');
    });

    test('an empty separator concatenates', () => {
      expect(compose({ parts: ['x.a', 'x.b'], joiner: 'join:' }, { 'x.a': '(', 'x.b': ')' }))
        .toBe('()');
    });
  });

  describe('degenerate input', () => {
    test('a spec with no parts composes to an empty string', () => {
      expect(compose({ joiner: 'fullName' }, { 'p.first': 'Jane' })).toBe('');
      expect(compose({ parts: [], joiner: 'fullName' }, { 'p.first': 'Jane' })).toBe('');
    });

    test('a null part map composes to an empty string', () => {
      expect(compose({ parts: ['p.first'], joiner: 'fullName' }, null)).toBe('');
    });

    test('an unrecognised joiner falls back to space-joining', () => {
      expect(compose({ parts: ['p.a', 'p.b'], joiner: 'mystery' }, { 'p.a': 'x', 'p.b': 'y' }))
        .toBe('x y');
    });
  });
});
