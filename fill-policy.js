/**
 * Fill policy
 *
 * Pure decision: given a suggestion, does the extension write its value into
 * the field or leave the field untouched? Everything at or above the floor
 * fills (the user reviews review-band values in place); sub-floor and "no
 * suggestion" write nothing.
 *
 * See DESIGN.md §6.
 */

const ConfidenceGradient = typeof module !== 'undefined' && module.exports
  ? require('./confidence-gradient')
  : globalThis.ConfidenceGradient;

/**
 * @param {?{band?: string, confidence?: number}} suggestion
 * @param {{floor: number, high: number}} [thresholds]
 * @returns {'fill'|'skip'}
 */
function fillDecision(suggestion, thresholds = ConfidenceGradient.DEFAULT_THRESHOLDS) {
  if (!suggestion) return 'skip';

  const band = typeof suggestion.confidence === 'number'
    ? ConfidenceGradient.bandFor(suggestion.confidence, thresholds)
    : suggestion.band;

  return band === 'blank' ? 'skip' : 'fill';
}

const FillPolicy = { fillDecision };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FillPolicy;
}

if (typeof globalThis !== 'undefined') {
  globalThis.FillPolicy = FillPolicy;
}
