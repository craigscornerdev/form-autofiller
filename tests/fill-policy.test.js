/**
 * Tests for A1: the fill policy (DESIGN.md §6).
 *
 * `fillDecision` returns 'fill' unless there is no suggestion or the
 * suggestion lands in the blank band.
 */

const { fillDecision } = require('../fill-policy');

describe('fill-policy', () => {
  test('no suggestion → skip', () => {
    expect(fillDecision(null)).toBe('skip');
    expect(fillDecision(undefined)).toBe('skip');
  });

  test('sub-floor confidence → skip', () => {
    expect(fillDecision({ confidence: 0.4 })).toBe('skip');
    expect(fillDecision({ confidence: 0.59 })).toBe('skip');
  });

  test('review-band confidence → fill', () => {
    expect(fillDecision({ confidence: 0.6 })).toBe('fill');
    expect(fillDecision({ confidence: 0.82 })).toBe('fill');
  });

  test('high-band confidence → fill', () => {
    expect(fillDecision({ confidence: 0.95 })).toBe('fill');
    expect(fillDecision({ confidence: 1 })).toBe('fill');
  });

  test('falls back to a precomputed band when confidence is absent', () => {
    expect(fillDecision({ band: 'blank' })).toBe('skip');
    expect(fillDecision({ band: 'review' })).toBe('fill');
    expect(fillDecision({ band: 'high' })).toBe('fill');
  });

  test('custom thresholds move the fill line', () => {
    const t = { floor: 0.75, high: 0.95 };
    expect(fillDecision({ confidence: 0.7 }, t)).toBe('skip');
    expect(fillDecision({ confidence: 0.8 }, t)).toBe('fill');
  });
});
