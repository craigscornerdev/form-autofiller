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

const fuzzySemantics = typeof module !== 'undefined' && module.exports
  ? require('./field-semantics')
  : globalThis.CharityFieldSemantics;
const { FieldSemantics: FuzzyFieldSemantics } = fuzzySemantics;
const Fuse = typeof module !== 'undefined' && module.exports
  ? require('fuse.js')
  : globalThis.Fuse;

class FuzzyFieldMatcher {
  constructor() {
    this.CONFIDENCE_THRESHOLDS = {
      HIGH: 0.90,        // >= 0.90: High confidence, auto-fill
      REVIEW: 0.60,      // 0.60-0.89: Medium confidence, review needed
      NO_MATCH: 0.0      // < 0.60: No match
    };

    // Scoring is now multiplicative/hierarchical, not additive
    // This prevents accidental high scores from combining unrelated factors.
    // Ceiling for a non-exact match is tokenOverlap * contextMatch * typeCompatibility
    // = 1.0 * 0.9 * 0.95 = 0.855, always below HIGH so only true exact aliases auto-fill.
    this.SCORING_WEIGHTS = {
      exactAlias: 1.0,           // Exact match to an alias (base score)
      tokenOverlap: 1.0,         // Token-based similarity multiplier (max)
      contextMatch: 0.9,         // Context match multiplier
      contextMismatch: 0.7,      // Context mismatch penalty
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

    this.fieldEntries = Object.entries(FuzzyFieldSemantics).flatMap(([fieldName, fieldDef]) => (
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
      const fieldDef = FuzzyFieldSemantics[fieldName];
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
    const bestMatch = this._selectBestMatchWithTieBreaking(candidates, normalizedLabel, fieldContext);

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
      return Object.keys(FuzzyFieldSemantics);
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
      // Base score for exact match
      score = this.SCORING_WEIGHTS.exactAlias;  // 1.0
      
      // Apply context match/mismatch multiplier
      if (fieldContext.context === fieldDef.context) {
        score *= this.SCORING_WEIGHTS.contextMatch;  // Keep it high: 0.9
      } else if (fieldContext.context === 'unknown') {
        // Unknown context doesn't penalize exact matches as much
        score *= 0.95;
      } else {
        // Mismatched context significantly penalizes
        score *= this.SCORING_WEIGHTS.contextMismatch;  // 0.7
      }
      
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

    // Apply context multiplier
    if (fieldContext.context === fieldDef.context) {
      score *= this.SCORING_WEIGHTS.contextMatch;  // Boost to potentially 0.72
    } else if (fieldContext.context === 'unknown') {
      score *= 0.9;  // Slight boost for unknown context
    } else {
      // Mismatched context significantly penalizes
      score *= this.SCORING_WEIGHTS.contextMismatch;  // Reduce to 0.56
    }

    // Apply small type compatibility bonus
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
   * Rejects ambiguous ties where top 2 scores are too close
   * @private
   * @param {Array} candidates - Sorted candidate list
   * @param {string} normalizedLabel - Normalized label
   * @param {Object} fieldContext - Field context
   * @returns {Object|null} - Best match or null if ambiguous
   */
  _selectBestMatchWithTieBreaking(candidates, normalizedLabel, fieldContext) {
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

    // Special case: if best has exact context match and second doesn't, prefer best
    if (best.fieldDef.context === fieldContext.context && 
        secondBest.fieldDef.context !== fieldContext.context) {
      return best;
    }

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
