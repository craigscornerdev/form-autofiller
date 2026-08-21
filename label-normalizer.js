/**
 * Label Normalizer
 * 
 * Handles normalization of form field labels:
 * - Converts to lowercase
 * - Removes punctuation and special characters
 * - Strips required markers (asterisks, etc.)
 * - Removes extra whitespace
 * - Preserves the original label for audit purposes
 */

class LabelNormalizer {
  /**
   * Normalize a label by cleaning case, punctuation, and whitespace
   * @param {string} label - Raw label text
   * @returns {string} - Normalized label (lowercase, no punctuation, trimmed)
   */
  normalize(label) {
    if (!label || typeof label !== 'string') {
      return '';
    }

    return label
      .toLowerCase()           // Convert to lowercase
      .replace(/[*†‡]/g, '')   // Remove required markers (asterisk, obelus, etc.)
      .replace(/[^a-z0-9\s\/]/g, ' ')  // Replace punctuation with spaces (keep slashes for "state/province")
      .replace(/\s+/g, ' ')    // Collapse multiple spaces to single space
      .trim();                 // Remove leading/trailing whitespace
  }

  /**
   * Gather label text from multiple sources (label, name, id, placeholder, aria attributes)
   * @param {Object} fieldElement - DOM element or field object with attributes
   * @returns {string[]} - Array of label texts to consider
   */
  gatherLabelSources(fieldElement) {
    const sources = [];

    if (!fieldElement) return sources;

    // Add explicit label text
    if (fieldElement.label) {
      sources.push(fieldElement.label);
    }

    // Add name attribute
    if (fieldElement.name) {
      sources.push(this._humanizeAttributeName(fieldElement.name));
    }

    // Add id attribute
    if (fieldElement.id) {
      sources.push(this._humanizeAttributeName(fieldElement.id));
    }

    // Add placeholder text
    if (fieldElement.placeholder) {
      sources.push(fieldElement.placeholder);
    }

    // Add aria-label
    if (fieldElement['aria-label']) {
      sources.push(fieldElement['aria-label']);
    }

    // Add aria-describedby reference content
    if (fieldElement['aria-describedby']) {
      sources.push(`aria: ${fieldElement['aria-describedby']}`);
    }

    // Add aria-labelledby reference content
    if (fieldElement['aria-labelledby']) {
      sources.push(`aria: ${fieldElement['aria-labelledby']}`);
    }

    return sources.filter(s => s && s.trim());
  }

  /**
   * Convert attribute names to human-readable format
   * e.g., "organization_name" -> "organization name"
   * @private
   * @param {string} attrName - Attribute name
   * @returns {string} - Humanized name
   */
  _humanizeAttributeName(attrName) {
    if (!attrName) return '';
    return attrName
      .replace(/[-_]/g, ' ')   // Replace hyphens and underscores with spaces
      .replace(/([a-z])([A-Z])/g, '$1 $2');  // Split camelCase
  }

  /**
   * Detect the context/section of a field (organization, event, etc.)
   * @param {string} label - Normalized or raw label
   * @param {string} context - Optional explicit context
   * @returns {string} - Detected context: 'organization', 'organizationContact', 'event', or 'unknown'
   */
  detectContext(label, context) {
    if (!label) return 'unknown';

    const normalized = this.normalize(label);

    // Explicit context provided
    if (context) {
      return context;
    }

    // Check for event-related keywords
    if (this._matchesPattern(normalized, ['event', 'organizer', 'coordinator', 'campaign'])) {
      return 'event';
    }

    // Check for organization contact keywords
    if (this._matchesPattern(normalized, ['contact', 'primary contact'])) {
      return 'organizationContact';
    }

    // Check for organization address keywords
    if (this._matchesPattern(normalized, ['address', 'street', 'city', 'state', 'postal', 'country'])) {
      return 'organization';
    }

    // Check for organization information keywords
    if (this._matchesPattern(normalized, [
      'organization',
      'charity',
      'nonprofit',
      'ein',
      'tax id',
      'mission',
      'website'
    ])) {
      return 'organization';
    }

    return 'unknown';
  }

  /**
   * Check if a normalized label matches any pattern
   * @private
   * @param {string} normalized - Normalized label
   * @param {string[]} patterns - Patterns to match
   * @returns {boolean}
   */
  _matchesPattern(normalized, patterns) {
    return patterns.some(pattern => normalized.includes(pattern));
  }

  /**
   * Create a field context object with all available information
   * @param {Object} fieldElement - Field element or object
   * @param {string} rawLabel - Raw, unmodified label
   * @returns {Object} - Field context with normalized info
   */
  createFieldContext(fieldElement, rawLabel) {
    const sources = this.gatherLabelSources(fieldElement);
    const normalized = this.normalize(rawLabel || '');
    const context = this.detectContext(normalized, fieldElement.context);

    return {
      rawLabel: rawLabel || '',          // Original label for display
      normalized: normalized,             // Normalized for matching
      sources: sources,                   // All label sources (name, id, placeholder, aria)
      context: context,                   // Section context
      fieldType: fieldElement.fieldType || 'text',
      fieldName: fieldElement.name || '',
      fieldId: fieldElement.id || ''
    };
  }
}

module.exports = LabelNormalizer;
