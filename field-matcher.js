class FieldMatcher {
  constructor(profile = {}) {
    this.profile = profile;
    this.rules = [
      {
        profileField: "organizationName",
        source: "Organization name",
        aliases: [
          "organization name",
          "name of organization",
          "charity name",
          "nonprofit name",
          "non profit name"
        ]
      },
      {
        profileField: "organizationType",
        source: "Organization type",
        aliases: [
          "organization type",
          "type of organization",
          "charity type",
          "nonprofit type",
          "organization category"
        ]
      },
      {
        profileField: "missionStatement",
        source: "Mission statement",
        aliases: [
          "mission statement",
          "mission",
          "organization mission",
          "our mission"
        ]
      },
      {
        profileField: "organizationAddress",
        source: "Organization address",
        aliases: [
          "address",
          "organization address",
          "mailing address",
          "street address",
          "organization street address"
        ]
      },
      {
        profileField: "organizationAddress.street",
        source: "Street address",
        aliases: [
          "street address",
          "street",
          "address line",
          "address line 1",
          "organization street"
        ]
      },
      {
        profileField: "organizationAddress.city",
        source: "City",
        aliases: ["city", "organization city", "town"]
      },
      {
        profileField: "organizationAddress.state",
        source: "State",
        aliases: ["state", "state province", "state or province", "province", "organization state"]
      },
      {
        profileField: "organizationAddress.postalCode",
        source: "Postal code",
        aliases: ["postal code", "zip code", "zip", "postcode", "organization postal code"]
      },
      {
        profileField: "organizationAddress.country",
        source: "Country",
        aliases: ["country", "organization country", "country of operation"]
      },
      {
        profileField: "position",
        source: "Position",
        aliases: [
          "position",
          "contact title",
          "job title",
          "title",
          "contact position",
          "role"
        ]
      },
      {
        profileField: "email",
        source: "Email",
        aliases: ["email", "email address", "contact email", "contact email address"]
      },
      {
        profileField: "phone",
        source: "Phone",
        aliases: ["phone", "phone number", "contact phone", "contact phone number", "telephone"]
      },
      {
        profileField: "website",
        source: "Website",
        aliases: ["website", "organization website", "charity website", "nonprofit website"]
      },
      {
        profileField: "ein",
        source: "EIN",
        aliases: ["ein", "ein number", "employer identification number"]
      }
    ];
  }

  getSuggestion(field = {}) {
    const label = field.label || "";
    const rule = this.getMatchingRule(label);

    if (!rule) {
      return null;
    }

    if (this.isNeverAutoFillRule(rule.profileField)) {
      return null;
    }

    if (field.value && String(field.value).trim()) {
      return null;
    }

    if (!this.isSafeControl(field)) {
      return null;
    }

    const profileValue = this.getProfileValue(rule.profileField);
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

  getMatchingRule(label) {
    const normalizedLabel = this.normalize(label);

    if (!normalizedLabel) {
      return null;
    }

    return this.rules.find((rule) => rule.aliases.includes(normalizedLabel)) || null;
  }

  getProfileValue(profileField) {
    if (!profileField) {
      return undefined;
    }

    if (this.profile[profileField] !== undefined) {
      return this.profile[profileField];
    }

    if (profileField === "organizationAddress") {
      return this.profile.organizationAddress || {};
    }

    const parts = profileField.split(".");
    let value = this.profile;

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

    const labelText = this.normalize(field.label || rule.source || "");
    let bestOption = null;
    let bestScore = 0;

    options.forEach((option) => {
      const optionText = typeof option === "string" ? option : (option.text || option.label || option.value || "");
      const optionValue = typeof option === "string" ? option : (option.value || option.text || option.label || "");
      const normalizedOption = this.normalize(optionText);
      const score = this.scoreSelectOption(labelText, normalizedOption);

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

module.exports = FieldMatcher;
