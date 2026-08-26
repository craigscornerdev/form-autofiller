const semantics = typeof module !== 'undefined' && module.exports
  ? require('./field-semantics')
  : globalThis.CharityFieldSemantics;
const fieldRegistry = semantics.FieldRegistry;

class FieldMatcher {
  constructor(profile = {}) {
    this.profile = profile;
    this.rules = fieldRegistry.map((rule) => ({ ...rule }));
  }

  getSuggestion(field = {}) {
    const label = field.label || "";
    const rule = this.getMatchingRule(label, field.autocomplete);

    if (!rule) {
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

    const scoreCategory = "high";
    return {
      source: rule.source,
      value,
      confidence: "high",
      scoreCategory,
      reason: this.getReason(field, rule, scoreCategory)
    };
  }

  getMatchingRule(label, autocomplete = "") {
    const normalizedLabel = this.normalize(label);

    const autocompleteFieldMap = {
      country: "organizationCountry",
      "country-name": "organizationCountry",
      "address-level1": "organizationState",
      "address-level2": "organizationCity"
    };

    if (autocompleteFieldMap[autocomplete]) {
      const semanticFieldName = autocompleteFieldMap[autocomplete];
      const semanticRule = this.rules.find((rule) => rule.fieldName === semanticFieldName);

      if (semanticRule) {
        return semanticRule;
      }
    }

    if (!normalizedLabel) {
      return null;
    }

    return this.rules.find((rule) => rule.aliases.includes(normalizedLabel)) || null;
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

    if (profileField === "organizationAddress") {
      return this.profile.organizationAddress || {};
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

    if (rule.profileField === "organizationAddress" && profileValue && typeof profileValue === "object") {
      return this.combineAddress(profileValue);
    }

    return profileValue;
  }

  pickSelectOption(field, rule, profileValue) {
    const options = Array.isArray(field.options) ? field.options : [];
    if (!options.length) {
      return null;
    }

    const profileText = this.normalize(typeof profileValue === "string" ? profileValue : "");
    const labelText = this.normalize(field.label || rule.source || "");
    let bestOption = null;
    let bestScore = 0;

    options.forEach((option) => {
      const optionText = typeof option === "string" ? option : (option.text || option.label || option.value || "");
      const optionValue = typeof option === "string" ? option : (option.value || option.text || option.label || "");
      const normalizedOption = this.normalize(optionText);
      const normalizedOptionValue = this.normalize(optionValue);
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

  combineAddress(address) {
    if (!address || typeof address !== "object") {
      return "";
    }

    const city = address.city ? String(address.city).trim() : "";
    const state = address.state ? String(address.state).trim() : "";
    const postalCode = address.postalCode ? String(address.postalCode).trim() : "";
    const street = address.street ? String(address.street).trim() : "";

    const cityStatePostalParts = [];
    if (city) {
      cityStatePostalParts.push(city);
    }

    const statePostal = [state, postalCode].filter((part) => part).join(" ");
    if (statePostal) {
      cityStatePostalParts.push(statePostal);
    }

    const cityStatePostal = cityStatePostalParts.join(", ");
    const combined = [street, cityStatePostal].filter((part) => part).join(", ");

    return combined || [street, city, state, postalCode]
      .filter((part) => part)
      .join(", ");
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

  getReason(field, rule, scoreCategory) {
    if (field.tagName === "SELECT" || field.type === "select") {
      return `select option matched for ${rule.source}.`;
    }

    if (rule.profileField === "organizationAddress" || rule.profileField === "organizationAddress.street" || rule.profileField === "organizationAddress.city" || rule.profileField === "organizationAddress.state" || rule.profileField === "organizationAddress.postalCode" || rule.profileField === "organizationAddress.country") {
      return `combined address data matched for ${rule.source}.`;
    }

    return `${scoreCategory === "high" ? "Exact alias match" : "Safe match"} for ${rule.source}.`;
  }

  isNeverAutoFillRule(profileField) {
    return [
      "eventName",
      "eventDate",
      "eventDescription",
      "shippingDate",
      "event.name",
      "event.date",
      "event.description"
    ].includes(profileField);
  }

  normalize(value) {
    if (!value || typeof value !== "string") {
      return "";
    }

    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FieldMatcher;
}

if (typeof globalThis !== 'undefined') {
  globalThis.FieldMatcher = FieldMatcher;
}
