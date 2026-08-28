/**
 * Fuzzy Field Matcher
 * 
 * Implements conservative fuzzy matching for form field labels using:
 * - Token-based similarity scoring
 * - Separate scoring for label evidence and field context
 * - Explicit confidence thresholds
 * - Tie-breaking logic that rejects ambiguous matches
 * - Field type compatibility checking
 */

const FuzzyConceptRegistry = typeof module !== 'undefined' && module.exports
  ? require('./concept-registry')
  : globalThis.ConceptRegistry;
const Fuse = typeof module !== 'undefined' && module.exports
  ? require('fuse.js')
  : globalThis.Fuse;
const FuzzyLabelNormalizerClass = typeof module !== 'undefined' && module.exports
  ? require('./label-normalizer')
  : globalThis.CharityLabelNormalizer;

class FuzzyFieldMatcher {
  constructor() {
    this.CONFIDENCE_THRESHOLDS = {
      HIGH: 0.90,        // >= 0.90: High confidence, auto-fill
      REVIEW: 0.60,      // 0.60-0.89: Medium confidence, review needed
      NO_MATCH: 0.0      // < 0.60: No match
    };

    // Scoring is multiplicative/hierarchical, not additive: this prevents
    // accidental high scores from combining unrelated factors. A token-overlap
    // match is bounded by tokenOverlap * contextMatch * typeCompatibility, so a
    // near-exact wording under a fitting heading still lands in review, not high
    // — only true exact aliases and autocomplete tokens auto-fill.
    this.SCORING_WEIGHTS = {
      exactAlias: 1.0,           // Exact match to an alias (base score)
      tokenOverlap: 1.0,         // Token-based similarity multiplier (max)
      contextMatch: 0.9,         // Heading fits the concept's groupHints
      contextUnknown: 0.95,      // No heading to judge by
      contextMismatch: 0.7,      // Heading points at another section
      typeCompatibility: 0.95    // Type compatibility bonus (small)
    };

    this.FIELD_TYPE_COMPATIBILITY = {
      text: ['text', 'email', 'tel', 'url'],
      email: ['email', 'text'],
      tel: ['tel', 'text'],
      textarea: ['textarea'],
      select: ['select'],
      url: ['url', 'text']
    };

    // One canonical normalizer: every alias enters the index in the same
    // normalized form labels are reduced to before matching.
    this.labelNormalizer = new FuzzyLabelNormalizerClass();
    this.fieldDefs = {};
    FuzzyConceptRegistry.load(['charity']).forEach((concept) => {
      this.fieldDefs[concept.id] = {
        source: concept.label,
        fieldType: concept.controlTypes[0],
        neverAutoFill: concept.fillPolicy === 'never',
        aliases: (concept.aliases || []).map((alias) => this.labelNormalizer.normalize(alias)),
        groupHints: concept.groupHints || []
      };
    });

    this.fieldEntries = Object.entries(this.fieldDefs).flatMap(([fieldName, fieldDef]) => (
      fieldDef.aliases || []
    ).map((alias) => ({ fieldName, alias })));
    this.fuzzyIndex = typeof Fuse === 'function'
      ? new Fuse(this.fieldEntries, {
        keys: ['alias'],
        includeScore: true,
        ignoreLocation: true,
        threshold: 0.8
      })
      : null;
  }

  /**
   * Find the best matching field for a given form field label
   * @param {string} normalizedLabel - Normalized label from LabelNormalizer
   * @param {Object} fieldContext - Field context from LabelNormalizer
   * @returns {Object} - Match result: { matchedField, confidence, score, reason, allCandidates }
   */
  findBestMatch(normalizedLabel, fieldContext) {
    const candidates = [];

    // Fuse only retrieves likely aliases; our scorer still owns all safety decisions.
    this._retrieveFieldNames(normalizedLabel).forEach((fieldName) => {
      const fieldDef = this.fieldDefs[fieldName];
      const score = this._scoreMatch(normalizedLabel, fieldContext, fieldName, fieldDef);
      
      if (score > 0) {
        candidates.push({
          fieldName,
          fieldDef,
          score,
          confidence: this._categorizeConfidence(score),
          reason: this._generateReason(normalizedLabel, fieldDef, score)
        });
      }
    });

    // Sort by score (descending)
    candidates.sort((a, b) => b.score - a.score);

    // Determine best match with tie-breaking
    const bestMatch = this._selectBestMatchWithTieBreaking(candidates);

    return {
      matchedField: bestMatch ? bestMatch.fieldName : null,
      matchedDef: bestMatch ? bestMatch.fieldDef : null,
      confidence: bestMatch ? bestMatch.confidence : 'no-match',
      score: bestMatch ? bestMatch.score : 0,
      reason: bestMatch ? bestMatch.reason : 'No matching field found',
      allCandidates: candidates.slice(0, 5)  // Top 5 candidates for debugging
    };
  }

  _retrieveFieldNames(normalizedLabel) {
    if (!this.fuzzyIndex) {
      return Object.keys(this.fieldDefs);
    }

    const fieldNames = [];
    const seen = new Set();

    this.fuzzyIndex.search(normalizedLabel).forEach((result) => {
      if (!seen.has(result.item.fieldName)) {
        seen.add(result.item.fieldName);
        fieldNames.push(result.item.fieldName);
      }
    });

    return fieldNames;
  }

  /**
   * Context multiplier for a candidate: how the scanned section heading
   * (`fieldContext.groupLabel`) token-fits this concept's `groupHints`.
   * @private
   * @param {Object} fieldContext - Field context carrying `groupLabel`
   * @param {Object} fieldDef - Field definition carrying `groupHints`
   * @returns {number} - 0.9 heading fits · 0.95 no heading · 0.7 heading points elsewhere
   */
  _contextMultiplier(fieldContext, fieldDef) {
    switch (this.labelNormalizer.headingFit(fieldContext.groupLabel, fieldDef.groupHints)) {
      case 'match': return this.SCORING_WEIGHTS.contextMatch;
      case 'mismatch': return this.SCORING_WEIGHTS.contextMismatch;
      default: return this.SCORING_WEIGHTS.contextUnknown;
    }
  }

  /**
   * Score how well a field definition matches the given normalized label
   * @private
   * @param {string} normalizedLabel - Normalized label
   * @param {Object} fieldContext - Field context
   * @param {string} fieldName - Field name to test
   * @param {Object} fieldDef - Field definition
   * @returns {number} - Score between 0 and 1
   */
  _scoreMatch(normalizedLabel, fieldContext, fieldName, fieldDef) {
    // Never auto-fill fields are excluded from fuzzy matching
    if (fieldDef.neverAutoFill) {
      return 0;
    }

    // Check field type compatibility first
    const isCompatible = this._isTypeCompatible(fieldContext.fieldType, fieldDef.fieldType);
    if (!isCompatible) {
      return 0;
    }

    let score = 0;

    // 1. Check for exact alias match (highest priority)
    if (fieldDef.aliases && fieldDef.aliases.includes(normalizedLabel)) {
      score = this.SCORING_WEIGHTS.exactAlias * this._contextMultiplier(fieldContext, fieldDef);
      return Math.max(0, Math.min(1, score));
    }

    // 2. Score token-based overlap with aliases
    let maxAliasScore = 0;
    if (fieldDef.aliases) {
      fieldDef.aliases.forEach(alias => {
        const overlapScore = this._tokenOverlap(normalizedLabel, alias);
        maxAliasScore = Math.max(maxAliasScore, overlapScore);
      });
    }
    
    // Only continue if there's meaningful token overlap
    if (maxAliasScore < 0.3) {
      return 0;  // Not similar enough
    }

    score = maxAliasScore * this.SCORING_WEIGHTS.tokenOverlap;  // Max 1.0
    score *= this._contextMultiplier(fieldContext, fieldDef);
    score *= this.SCORING_WEIGHTS.typeCompatibility;  // 0.95

    // Clamp score to 0-1 range
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate token overlap similarity between two normalized strings
   * @private
   * @param {string} label1 - First normalized label
   * @param {string} label2 - Second normalized label
   * @returns {number} - Similarity score between 0 and 1
   */
  _tokenOverlap(label1, label2) {
    const tokens1 = new Set(label1.split(/\s+/));
    const tokens2 = new Set(label2.split(/\s+/));

    // Find intersection and union
    const intersection = [...tokens1].filter(t => tokens2.has(t)).length;
    const union = new Set([...tokens1, ...tokens2]).size;

    // Jaccard similarity: |intersection| / |union|
    return union === 0 ? 0 : intersection / union;
  }

  /**
   * Check if field types are compatible (e.g., email field can fill text field)
   * @private
   * @param {string} formFieldType - Type from form (text, email, tel, etc.)
   * @param {string} profileFieldType - Type in profile definition
   * @returns {boolean}
   */
  _isTypeCompatible(formFieldType, profileFieldType) {
    const compatibleTypes = this.FIELD_TYPE_COMPATIBILITY[profileFieldType] || [profileFieldType];
    return compatibleTypes.includes(formFieldType);
  }

  /**
   * Categorize a score into confidence level
   * @private
   * @param {number} score - Score between 0 and 1
   * @returns {string} - 'high', 'review', or 'no-match'
   */
  _categorizeConfidence(score) {
    if (score >= this.CONFIDENCE_THRESHOLDS.HIGH) return 'high';
    if (score >= this.CONFIDENCE_THRESHOLDS.REVIEW) return 'review';
    return 'no-match';
  }

  /**
   * Select the best match with tie-breaking logic
   * Rejects ambiguous ties where the top two scores are too close
   * @private
   * @param {Array} candidates - Sorted candidate list
   * @returns {Object|null} - Best match or null if ambiguous
   */
  _selectBestMatchWithTieBreaking(candidates) {
    if (candidates.length === 0) {
      return null;
    }

    const best = candidates[0];

    // If only one candidate or no ambiguity, return best
    if (candidates.length === 1) {
      return best;
    }

    const secondBest = candidates[1];

    // Check for ambiguous tie (scores too close)
    const scoreDifference = best.score - secondBest.score;
    const TIE_THRESHOLD = 0.05;  // 5% difference considered ambiguous

    // If scores are too close and both are in "high" confidence, reject as ambiguous
    if (scoreDifference < TIE_THRESHOLD &&
        best.confidence === 'high' &&
        secondBest.confidence === 'high') {
      return null;
    }

    return best;
  }

  /**
   * Generate a human-readable reason for the match
   * @private
   * @param {string} normalizedLabel - Normalized label
   * @param {Object} fieldDef - Matched field definition
   * @param {number} score - Match score
   * @returns {string}
   */
  _generateReason(normalizedLabel, fieldDef, score) {
    if (score >= 0.99) {
      return `Exact alias match: "${fieldDef.source}"`;
    }
    if (score >= this.CONFIDENCE_THRESHOLDS.HIGH) {
      return `High confidence match: "${fieldDef.source}" (score: ${(score * 100).toFixed(0)}%)`;
    }
    if (score >= this.CONFIDENCE_THRESHOLDS.REVIEW) {
      return `Possible match: "${fieldDef.source}" - please review (score: ${(score * 100).toFixed(0)}%)`;
    }
    return `Low confidence match: "${fieldDef.source}" (score: ${(score * 100).toFixed(0)}%)`;
  }

  /**
   * Check if an address field value should be excluded from a non-address field
   * @param {string} profileFieldPath - Profile field path (e.g., "organizationAddress.street")
   * @param {Object} fieldDef - Target field definition
   * @returns {boolean} - True if incompatible
   */
  isIncompatibleFieldType(profileFieldPath, fieldDef) {
    const isAddressField = profileFieldPath && profileFieldPath.includes('Address');
    const isAddressTarget = fieldDef.addressComponent !== undefined;

    // Don't suggest address values for non-address fields
    return isAddressField && !isAddressTarget;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FuzzyFieldMatcher;
}

if (typeof globalThis !== 'undefined') {
  globalThis.FuzzyFieldMatcher = FuzzyFieldMatcher;
}
