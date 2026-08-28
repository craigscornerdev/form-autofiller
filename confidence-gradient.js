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

// Reserved for debug output only — never carries confidence meaning.
const DEBUG_COLOR = 'hsl(282 60% 45%)';

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
 * Diagnostic label for a confidence: the number the color was computed from,
 * its band, and its hue — e.g. `"0.81 · review · hue 63"`.
 * @param {number} confidence
 * @param {{floor: number, high: number}} [thresholds]
 * @returns {string}
 */
function debugLabel(confidence, thresholds = DEFAULT_THRESHOLDS) {
  return `${confidence.toFixed(2)} · ${bandFor(confidence, thresholds)} · `
    + `hue ${Math.round(hueFor(confidence, thresholds))}`;
}

/**
 * Full display descriptor for a confidence. Sub-floor is a fixed dark red with
 * a dashed outline; everything else follows the hue gradient. `background` is
 * translucent so the field's own fill still reads through it. `debug` is the
 * purple diagnostic overlay both surfaces paint, so the injected function does
 * no maths.
 * @param {number} confidence
 * @param {{floor: number, high: number}} [thresholds]
 * @returns {{band: string, hue: number, dashed: boolean, outline: string,
 *            background: string, text: string,
 *            debug: {color: string, label: string}}}
 */
function colorFor(confidence, thresholds = DEFAULT_THRESHOLDS) {
  const blank = confidence < thresholds.floor;
  const h = hueFor(confidence, thresholds);
  return {
    band: bandFor(confidence, thresholds),
    hue: h,
    dashed: blank,
    outline: blank ? 'hsl(0 74% 45%)' : `hsl(${h} 70% 40%)`,
    background: blank ? 'hsl(0 86% 55% / 0.10)' : `hsl(${h} 80% 55% / 0.10)`,
    text: blank ? 'hsl(0 74% 30%)' : `hsl(${h} 70% 25%)`,
    debug: { color: DEBUG_COLOR, label: debugLabel(confidence, thresholds) }
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
  DEBUG_COLOR,
  clamp01,
  bandFor,
  hueFor,
  debugLabel,
  colorFor,
  describe
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConfidenceGradient;
}

if (typeof globalThis !== 'undefined') {
  globalThis.ConfidenceGradient = ConfidenceGradient;
}
