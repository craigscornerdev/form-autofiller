const ConceptRegistryModule = typeof module !== 'undefined' && module.exports
  ? require('./concept-registry')
  : globalThis.ConceptRegistry;
const CharityPresetModule = typeof module !== 'undefined' && module.exports
  ? require('./presets/charity')
  : globalThis.AutofillPresetCharity;
const FuzzyFieldMatcherClass = typeof module !== 'undefined' && module.exports
  ? require('./fuzzy-field-matcher')
  : globalThis.FuzzyFieldMatcher;
const Gradient = typeof module !== 'undefined' && module.exports
  ? require('./confidence-gradient')
  : globalThis.ConfidenceGradient;
const LabelNormalizerClass = typeof module !== 'undefined' && module.exports
  ? require('./label-normalizer')
  : globalThis.CharityLabelNormalizer;
const ValueComposeModule = typeof module !== 'undefined' && module.exports
  ? require('./value-compose')
  : globalThis.ValueCompose;

class FieldMatcher {
  constructor(profile = {}) {
    this.profile = profile;
    this.labelNormalizer = new LabelNormalizerClass();

    const activeRegistry = ConceptRegistryModule.load(['charity']);
    const bindings = (CharityPresetModule && CharityPresetModule.profileBindings) || {};

    this.rules = activeRegistry.map((concept) => {
      const binding = bindings[concept.id] || {};
      return {
        conceptId: concept.id,
        fieldName: concept.id,
        source: concept.label,
        aliases: (concept.aliases || []).map((alias) => this.labelNormalizer.normalize(alias)),
        autocompleteTokens: concept.autocompleteTokens || [],
        controlTypes: concept.controlTypes || [],
        valueType: concept.valueType,
        fillPolicy: concept.fillPolicy,
        sensitive: concept.sensitive === true,
        enumValues: concept.enumValues || null,
        compose: concept.compose || null,
        profileField: binding.profileField,
        profilePath: binding.profilePath || null
      };
    });
    this.fuzzyMatcher = new FuzzyFieldMatcherClass();
  }

  getSuggestion(field = {}) {
    const label = field.label || "";
    const rule = this.getMatchingRule(label, field.autocomplete, field.type, field.groupLabel);

    if (!rule) {
      return null;
    }

    if (rule.fillPolicy === "never" || rule.sensitive) {
      return null;
    }

    if (field.value && String(field.value).trim()) {
      return null;
    }

    if (!this.isSafeControl(field)) {
      return null;
    }

    const profileValue = this.getProfileValue(rule.profileField, rule);
    if (profileValue === undefined || profileValue === null || String(profileValue).trim() === "") {
      return null;
    }

    const value = this.resolveValue(field, rule, profileValue);
    if (value === null || value === undefined || String(value).trim() === "") {
      return null;
    }

    const labelMatch = rule._labelMatch;
    const provenance = this.valueProvenance(field, rule);
    const sLabel = labelMatch.strength;
    const sProv = provenance.factor;
    const confidence = Gradient.clamp01(sLabel * sProv);
    const band = Gradient.bandFor(confidence);

    return {
      source: rule.source,
      value,
      confidence,
      band,
      reason: this.getReason(field, rule),
      signals: {
        labelMatch,
        provenance,
        rejected: rule._rejected || []
      }
    };
  }

  getMatchingRule(label, autocomplete = "", fieldType = "", groupLabel = "") {
    const normalizedLabel = this.labelNormalizer.normalize(label);

    if (autocomplete) {
      const autocompleteRule = this.findLastRule((rule) => rule.autocompleteTokens.includes(autocomplete));
      if (autocompleteRule) {
        return {
          ...autocompleteRule,
          _labelMatch: { strategy: "autocomplete", strength: 1, matchedAlias: autocomplete, normalizedLabel },
          _rejected: []
        };
      }
    }

    if (!normalizedLabel) {
      return null;
    }

    const exactRule = this.findLastRule((rule) => rule.aliases.includes(normalizedLabel));
    if (exactRule) {
      return {
        ...exactRule,
        _labelMatch: { strategy: "exact-alias", strength: 1, matchedAlias: normalizedLabel, normalizedLabel },
        _rejected: []
      };
    }

    return this.getFuzzyMatchingRule(normalizedLabel, fieldType, groupLabel);
  }

  // Later presets refine earlier ones, so a concept defined later wins an
  // alias / autocomplete-token collision (same convention as the registry union).
  findLastRule(predicate) {
    for (let i = this.rules.length - 1; i >= 0; i -= 1) {
      if (predicate(this.rules[i])) {
        return this.rules[i];
      }
    }
    return null;
  }

  getFuzzyMatchingRule(normalizedLabel, fieldType, groupLabel = "") {
    const fieldContext = { fieldType: fieldType || "text", context: "unknown", groupLabel: groupLabel || "" };
    const result = this.fuzzyMatcher.findBestMatch(normalizedLabel, fieldContext);

    if (!result.matchedField || result.confidence === "no-match") {
      return null;
    }

    const rule = this.rules.find((candidate) => candidate.fieldName === result.matchedField);
    if (!rule) {
      return null;
    }

    const rejected = (result.allCandidates || [])
      .filter((candidate) => candidate.fieldName !== result.matchedField)
      .map((candidate) => ({
        conceptId: candidate.fieldName,
        score: candidate.score,
        reason: candidate.reason
      }));

    return {
      ...rule,
      _labelMatch: { strategy: "fuzzy", strength: result.score, matchedAlias: null, normalizedLabel },
      _rejected: rejected
    };
  }

  getProfileValue(profileField, rule = null) {
    if (!profileField) {
      return undefined;
    }

    const candidatePaths = [];
    if (rule && rule.profilePath) {
      candidatePaths.push(rule.profilePath);
    }
    candidatePaths.push(profileField);

    for (const candidatePath of candidatePaths) {
      const value = this.readProfilePath(this.profile, candidatePath);
      if (value !== undefined && value !== null) {
        return value;
      }
    }

    return undefined;
  }

  readProfilePath(source, path) {
    if (source === undefined || source === null || path === undefined || path === null || path === "") {
      return undefined;
    }

    if (Object.prototype.hasOwnProperty.call(source, path)) {
      return source[path];
    }

    const parts = String(path).split(".");
    let value = source;

    for (const part of parts) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  }

  isSafeControl(field = {}) {
    if (field.type === "checkbox" || field.type === "radio" || field.type === "file" || field.type === "button" || field.type === "submit" || field.type === "reset" || field.type === "hidden") {
      return false;
    }

    if (field.tagName === "SELECT" || field.type === "select") {
      return true;
    }

    return !field.type || ["text", "email", "tel", "url", "number", "textarea"].includes(field.type);
  }

  resolveValue(field, rule, profileValue) {
    if (field.tagName === "SELECT" || field.type === "select") {
      if (Array.isArray(field.options) && field.options.length > 0) {
        return this.pickSelectOption(field, rule, profileValue);
      }
      return profileValue;
    }

    if (rule.compose) {
      return this.composeValue(rule);
    }

    return profileValue;
  }

  // A composite concept's value is assembled from its part concepts: read each
  // part's profile value, then hand the map to the concept's named joiner.
  composeValue(rule) {
    const partMap = {};
    (rule.compose.parts || []).forEach((partId) => {
      const partRule = this.rules.find((candidate) => candidate.conceptId === partId);
      const partValue = partRule
        ? this.getProfileValue(partRule.profileField, partRule)
        : this.getProfileValue(partId);
      if (partValue !== undefined && partValue !== null) {
        partMap[partId] = partValue;
      }
    });

    return ValueComposeModule.compose(rule.compose, partMap);
  }

  pickSelectOption(field, rule, profileValue) {
    const options = Array.isArray(field.options) ? field.options : [];
    if (!options.length) {
      return null;
    }

    const profileText = this.labelNormalizer.normalize(typeof profileValue === "string" ? profileValue : "");
    const labelText = this.labelNormalizer.normalize(field.label || rule.source || "");
    let bestOption = null;
    let bestScore = 0;

    options.forEach((option) => {
      const optionText = typeof option === "string" ? option : (option.text || option.label || option.value || "");
      const optionValue = typeof option === "string" ? option : (option.value || option.text || option.label || "");
      const normalizedOption = this.labelNormalizer.normalize(optionText);
      const normalizedOptionValue = this.labelNormalizer.normalize(optionValue);
      const profileScore = Math.max(
        this.scoreSelectOption(profileText, normalizedOption),
        this.scoreSelectOption(profileText, normalizedOptionValue)
      );
      const score = profileScore || this.scoreSelectOption(labelText, normalizedOption);

      if (score > bestScore) {
        bestScore = score;
        bestOption = optionValue;
      }
    });

    return bestScore >= 0.2 ? bestOption : null;
  }

  scoreSelectOption(labelText, optionText) {
    if (!labelText || !optionText) {
      return 0;
    }

    const labelTokens = new Set(labelText.split(/\s+/));
    const optionTokens = new Set(optionText.split(/\s+/));
    const intersection = [...labelTokens].filter((token) => optionTokens.has(token)).length;
    const union = new Set([...labelTokens, ...optionTokens]).size || 1;

    return intersection / union;
  }

  // Generic reason templates keyed by how the label matched (`strategy`) and the
  // shape of the resolved value (`valueType`). No domain wording.
  getReason(field, rule) {
    const labelMatch = rule._labelMatch || {};

    if (labelMatch.strategy === "fuzzy") {
      return labelMatch.strength >= 0.9
        ? `High-confidence fuzzy match for ${rule.source}.`
        : `Possible match for ${rule.source} — please review.`;
    }

    const opener = labelMatch.strategy === "autocomplete"
      ? `Autocomplete token match for ${rule.source}`
      : `Exact alias match for ${rule.source}`;

    const valueType = this.resolvedValueType(field, rule);
    if (valueType === "enum") {
      return `${opener}, matched to a select option.`;
    }
    if (valueType === "composite") {
      return `${opener}, value composed from your saved details.`;
    }

    return `${opener}.`;
  }

  valueProvenance(field, rule) {
    if (this.resolvedValueType(field, rule) === "enum") {
      return { kind: "derived", factor: 0.85, detail: "select-option" };
    }

    if (rule.compose) {
      return { kind: "derived", factor: 0.85, detail: "composed" };
    }

    return { kind: "profile-field", factor: 1, detail: "scalar" };
  }

  // The value shape actually produced: a `<select>` control resolves to a picked
  // option (`enum`), a `compose` rule to a joined composite, anything else is a
  // direct `scalar` profile value.
  resolvedValueType(field, rule) {
    if (field.tagName === "SELECT" || field.type === "select") {
      return "enum";
    }
    if (rule.compose) {
      return "composite";
    }
    return "scalar";
  }

}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FieldMatcher;
}

if (typeof globalThis !== 'undefined') {
  globalThis.FieldMatcher = FieldMatcher;
}
