/**
 * Field Semantics and Mapping Rules
 * 
 * Maps form field labels to profile data sources and defines approval rules.
 * Includes aliases, required field status, select options, and fields
 * that should never receive automatic suggestions.
 */

const FieldSemantics = {
  // Organization Information Fields
  organizationName: {
    profilePath: "organization.name",
    source: "Organization name",
    aliases: [
      "organization name",
      "name of organization",
      "charity name",
      "nonprofit name",
      "non profit name",
      "organization legal name"
    ],
    required: true,
    fieldType: "text",
    context: "organization"
  },

  organizationType: {
    profilePath: "organization.type",
    source: "Organization type",
    aliases: [
      "organization type",
      "type of organization",
      "charity type",
      "nonprofit type"
    ],
    required: false,
    fieldType: "select",
    context: "organization",
    selectOptions: {
      "non-profit": ["nonprofit", "non-profit", "npo"],
      "charity": ["charity", "registered charity"],
      "community": ["community", "community organization"],
      "faith": ["faith-based", "faith based", "religious"]
    }
  },

  ein: {
    profilePath: "organization.ein",
    source: "EIN / Tax ID",
    aliases: [
      "ein",
      "ein number",
      "employer identification number",
      "tax id",
      "tax id number",
      "federal tax id"
    ],
    required: true,
    fieldType: "text",
    context: "organization",
    format: "XX-XXXXXXX"
  },

  yearFounded: {
    profilePath: "organization.yearFounded",
    source: "Year founded",
    aliases: [
      "year founded",
      "founded",
      "year established",
      "established"
    ],
    required: false,
    fieldType: "text",
    context: "organization",
    format: "YYYY"
  },

  missionStatement: {
    profilePath: "organization.missionStatement",
    source: "Mission statement",
    aliases: [
      "mission statement",
      "mission",
      "organization mission",
      "our mission"
    ],
    required: false,
    fieldType: "textarea",
    context: "organization",
    neverAutoFill: false
  },

  // Organization Address Fields
  organizationStreet: {
    profilePath: "organizationAddress.street",
    source: "Organization street address",
    aliases: [
      "street address",
      "street",
      "address line",
      "address line 1",
      "organization address",
      "organization street"
    ],
    required: true,
    fieldType: "text",
    context: "organization",
    addressComponent: "street"
  },

  organizationCity: {
    profilePath: "organizationAddress.city",
    source: "Organization city",
    aliases: [
      "city",
      "organization city"
    ],
    required: true,
    fieldType: "text",
    context: "organization",
    addressComponent: "city"
  },

  organizationState: {
    profilePath: "organizationAddress.state",
    source: "Organization state / province",
    aliases: [
      "state",
      "state/province",
      "state or province",
      "province",
      "organization state"
    ],
    required: true,
    fieldType: "text",
    context: "organization",
    addressComponent: "state"
  },

  organizationPostalCode: {
    profilePath: "organizationAddress.postalCode",
    source: "Organization postal code",
    aliases: [
      "postal code",
      "zip code",
      "zip",
      "postcode",
      "organization postal code"
    ],
    required: true,
    fieldType: "text",
    context: "organization",
    addressComponent: "postalCode"
  },

  organizationCountry: {
    profilePath: "organizationAddress.country",
    source: "Organization country",
    aliases: [
      "country",
      "organization country",
      "country of operation"
    ],
    required: false,
    fieldType: "text",
    context: "organization",
    addressComponent: "country"
  },

  // Organization Contact Information Fields
  organizationContactName: {
    profilePath: "organizationContact.name",
    source: "Organization contact name",
    aliases: [
      "primary contact name",
      "contact name",
      "organization contact name",
      "contact person",
      "primary contact"
    ],
    required: true,
    fieldType: "text",
    context: "organizationContact"
  },

  organizationContactTitle: {
    profilePath: "organizationContact.title",
    source: "Organization contact title",
    aliases: [
      "contact title",
      "title",
      "position",
      "contact position",
      "organization contact title"
    ],
    required: false,
    fieldType: "text",
    context: "organizationContact"
  },

  organizationContactEmail: {
    profilePath: "organizationContact.email",
    source: "Organization contact email",
    aliases: [
      "contact email",
      "email",
      "email address",
      "contact email address",
      "organization email",
      "organization contact email"
    ],
    required: true,
    fieldType: "email",
    context: "organizationContact"
  },

  organizationContactPhone: {
    profilePath: "organizationContact.phone",
    source: "Organization contact phone",
    aliases: [
      "contact phone",
      "phone",
      "phone number",
      "contact phone number",
      "telephone",
      "contact telephone",
      "organization phone",
      "organization contact phone"
    ],
    required: true,
    fieldType: "tel",
    context: "organizationContact"
  },

  organizationWebsite: {
    profilePath: "organization.website",
    source: "Organization website",
    aliases: [
      "website",
      "organization website",
      "charity website",
      "nonprofit website",
      "web site",
      "organization web site"
    ],
    required: false,
    fieldType: "url",
    context: "organization"
  },

  // Event Organizer Information Fields
  eventName: {
    profilePath: null,  // Event name is form-specific, not from profile
    source: "Event name",
    aliases: [
      "event name",
      "name of event",
      "campaign name",
      "event or campaign name"
    ],
    required: true,
    fieldType: "text",
    context: "event",
    neverAutoFill: true  // Never auto-fill - event-specific data
  },

  eventOrganizerName: {
    profilePath: "eventOrganizer.name",
    source: "Event organizer name",
    aliases: [
      "organizer name",
      "event organizer name",
      "event organizer",
      "organizer",
      "coordinator name",
      "event coordinator"
    ],
    required: true,
    fieldType: "text",
    context: "event"
  },

  eventOrganizerEmail: {
    profilePath: "eventOrganizer.email",
    source: "Event organizer email",
    aliases: [
      "organizer email",
      "event organizer email",
      "organizer email address",
      "coordinator email"
    ],
    required: true,
    fieldType: "email",
    context: "event"
  },

  eventOrganizerPhone: {
    profilePath: "eventOrganizer.phone",
    source: "Event organizer phone",
    aliases: [
      "organizer phone",
      "event organizer phone",
      "organizer phone number",
      "coordinator phone"
    ],
    required: false,
    fieldType: "tel",
    context: "event"
  },

  eventDate: {
    profilePath: null,  // Event date is form-specific, not from profile
    source: "Event date",
    aliases: [
      "event date",
      "date",
      "event date",
      "date of event"
    ],
    required: false,
    fieldType: "text",
    context: "event",
    neverAutoFill: true,  // Never auto-fill - event-specific data
    format: "MM/DD/YYYY"
  },

  eventDescription: {
    profilePath: null,  // Event description is form-specific
    source: "Event description",
    aliases: [
      "event description",
      "description",
      "event details",
      "about the event"
    ],
    required: false,
    fieldType: "textarea",
    context: "event",
    neverAutoFill: true  // Never auto-fill - event-specific data
  }
};

/**
 * Context Separators
 * 
 * Defines field groupings by context to help distinguish between
 * organization contacts and event organizers.
 */
const ContextSeparators = {
  organization: ["organization", "org", "charity", "nonprofit"],
  organizationContact: ["organization contact", "organization contact", "primary contact"],
  event: ["event", "organizer", "coordinator"]
};

/**
 * Fields that should NEVER receive automatic suggestions
 */
const NeverAutoFillFields = [
  "eventName",
  "eventDate",
  "eventDescription"
];

/**
 * Validation rules for field values
 */
const ValidationRules = {
  ein: /^\d{2}-\d{7}$/,                    // XX-XXXXXXX format
  phone: /^[\d\-\+\(\)\s\.]+$/,           // Common phone formats
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,    // Basic email validation
  postalCode: /^[\da-zA-Z\s\-]+$/,        // Alphanumeric with common separators
  url: /^https?:\/\/.+/                   // HTTP(S) URL
};

module.exports = {
  FieldSemantics,
  ContextSeparators,
  NeverAutoFillFields,
  ValidationRules
};
