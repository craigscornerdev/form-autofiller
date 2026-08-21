class FieldMatcher {
  constructor(profile) {
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

  getSuggestion(field) {
    const rule = this.getMatchingRule(field.label);

    if (!rule || !this.profile[rule.profileField].trim()) {
      return null;
    }

    return {
      source: rule.source,
      value: this.profile[rule.profileField],
      confidence: "high"
    };
  }

  getMatchingRule(label) {
    const normalizedLabel = this.normalize(label);

    if (normalizedLabel.includes("address")) {
      return null;
    }

    return this.rules.find((rule) => rule.aliases.includes(normalizedLabel)) || null;
  }

  normalize(value) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}

module.exports = FieldMatcher;
