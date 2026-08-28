/**
 * Confidence gradient
 *
 * The single pure helper that turns a 0..1 confidence into a band and the
 * colours both surfaces paint with (the popup list and the injected on-page
 * highlight). No DOM, no maths anywhere else — callers read colours from here.
 *
 * See DESIGN.md §6.
 */

const DEFAULT_THRESHOLDS = { floor: 0.6, high: 0.9 };

/**
 * Clamp a number into [0, 1].
 * @param {number} x
 * @returns {number}
 */
function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

/**
 * Band for a confidence: below the floor writes nothing, up to `high` is
 * reviewed in place, at or above `high` fills.
 * @param {number} confidence
 * @param {{floor: number, high: number}} [thresholds]
 * @returns {'blank'|'review'|'high'}
 */
function bandFor(confidence, thresholds = DEFAULT_THRESHOLDS) {
  if (confidence >= thresholds.high) return 'high';
  if (confidence >= thresholds.floor) return 'review';
  return 'blank';
}

/**
 * Hue in degrees: 0 (red) at the floor rising linearly to 120 (green) at 1.0.
 * Sub-floor confidences pin to 0.
 * @param {number} confidence
 * @param {{floor: number, high: number}} [thresholds]
 * @returns {number}
 */
function hueFor(confidence, thresholds = DEFAULT_THRESHOLDS) {
  if (confidence < thresholds.floor) return 0;
  return 120 * clamp01((confidence - thresholds.floor) / (1 - thresholds.floor));
}

/**
 * Full display descriptor for a confidence. Sub-floor is a fixed dark red with
 * a dashed outline; everything else follows the hue gradient.
 * @param {number} confidence
 * @param {{floor: number, high: number}} [thresholds]
 * @returns {{band: string, hue: number, dashed: boolean, outline: string,
 *            background: string, text: string}}
 */
function colorFor(confidence, thresholds = DEFAULT_THRESHOLDS) {
  const blank = confidence < thresholds.floor;
  const h = hueFor(confidence, thresholds);
  return {
    band: bandFor(confidence, thresholds),
    hue: h,
    dashed: blank,
    outline: blank ? 'hsl(0 74% 45%)' : `hsl(${h} 70% 40%)`,
    background: blank ? 'hsl(0 86% 96%)' : `hsl(${h} 80% 94%)`,
    text: blank ? 'hsl(0 74% 30%)' : `hsl(${h} 70% 25%)`
  };
}

/**
 * Human-readable label for a confidence band.
 * @param {number} confidence
 * @param {{floor: number, high: number}} [thresholds]
 * @returns {string}
 */
function describe(confidence, thresholds = DEFAULT_THRESHOLDS) {
  if (confidence >= thresholds.high) return 'High confidence';
  if (confidence >= thresholds.floor) return 'Review';
  return 'Left blank';
}

const ConfidenceGradient = {
  DEFAULT_THRESHOLDS,
  clamp01,
  bandFor,
  hueFor,
  colorFor,
  describe
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConfidenceGradient;
}

if (typeof globalThis !== 'undefined') {
  globalThis.ConfidenceGradient = ConfidenceGradient;
}
