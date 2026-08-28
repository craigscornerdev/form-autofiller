/**
 * Tests for A1: the confidence gradient helper (DESIGN.md §6).
 *
 * One 0..1 score → band, hue, and the colours both surfaces paint with.
 */

const {
  DEFAULT_THRESHOLDS,
  clamp01,
  bandFor,
  hueFor,
  colorFor,
  describe: describeConfidence
} = require('../confidence-gradient');

describe('confidence-gradient', () => {
  describe('DEFAULT_THRESHOLDS', () => {
    test('floor 0.60, high 0.90', () => {
      expect(DEFAULT_THRESHOLDS).toEqual({ floor: 0.6, high: 0.9 });
    });
  });

  describe('clamp01', () => {
    test('clamps below 0 and above 1', () => {
      expect(clamp01(-0.5)).toBe(0);
      expect(clamp01(1.5)).toBe(1);
    });

    test('passes values already in range through', () => {
      expect(clamp01(0)).toBe(0);
      expect(clamp01(0.42)).toBe(0.42);
      expect(clamp01(1)).toBe(1);
    });
  });

  describe('bandFor', () => {
    test('sub-floor is blank', () => {
      expect(bandFor(0)).toBe('blank');
      expect(bandFor(0.59)).toBe('blank');
    });

    test('floor..high (exclusive) is review', () => {
      expect(bandFor(0.6)).toBe('review');
      expect(bandFor(0.75)).toBe('review');
      expect(bandFor(0.899)).toBe('review');
    });

    test('at or above high is high', () => {
      expect(bandFor(0.9)).toBe('high');
      expect(bandFor(1)).toBe('high');
    });

    test('honours a custom threshold set', () => {
      const t = { floor: 0.75, high: 0.95 };
      expect(bandFor(0.7, t)).toBe('blank');
      expect(bandFor(0.8, t)).toBe('review');
      expect(bandFor(0.96, t)).toBe('high');
    });
  });

  describe('hueFor', () => {
    test('sub-floor pins to 0 (red)', () => {
      expect(hueFor(0)).toBe(0);
      expect(hueFor(0.3)).toBe(0);
    });

    test('0 at the floor, 120 at 1.0, linear between', () => {
      expect(hueFor(0.6)).toBe(0);
      expect(hueFor(1)).toBe(120);
      expect(hueFor(0.8)).toBeCloseTo(60);
    });

    test('clamps above 1.0 to 120', () => {
      expect(hueFor(1.5)).toBe(120);
    });

    test('tracks a custom floor', () => {
      expect(hueFor(0.8, { floor: 0.8, high: 0.95 })).toBe(0);
      expect(hueFor(0.9, { floor: 0.8, high: 0.95 })).toBeCloseTo(60);
    });
  });

  describe('colorFor', () => {
    test('sub-floor: fixed dark red, dashed', () => {
      expect(colorFor(0.4)).toEqual({
        band: 'blank',
        hue: 0,
        dashed: true,
        outline: 'hsl(0 74% 45%)',
        background: 'hsl(0 86% 96%)',
        text: 'hsl(0 74% 30%)'
      });
    });

    test('exact match: solid green', () => {
      expect(colorFor(1)).toEqual({
        band: 'high',
        hue: 120,
        dashed: false,
        outline: 'hsl(120 70% 40%)',
        background: 'hsl(120 80% 94%)',
        text: 'hsl(120 70% 25%)'
      });
    });

    test('review band: gradient hue, not dashed', () => {
      const c = colorFor(0.8);
      expect(c.band).toBe('review');
      expect(c.dashed).toBe(false);
      expect(c.hue).toBeCloseTo(60);
      expect(c.outline).toBe(`hsl(${c.hue} 70% 40%)`);
      expect(c.background).toBe(`hsl(${c.hue} 80% 94%)`);
      expect(c.text).toBe(`hsl(${c.hue} 70% 25%)`);
    });
  });

  describe('describe', () => {
    test('one label per band', () => {
      expect(describeConfidence(0.4)).toBe('Left blank');
      expect(describeConfidence(0.7)).toBe('Review');
      expect(describeConfidence(0.95)).toBe('High confidence');
    });

    test('honours a custom threshold set', () => {
      expect(describeConfidence(0.92, { floor: 0.6, high: 0.95 })).toBe('Review');
    });
  });
});
