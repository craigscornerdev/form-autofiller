/**
 * Profile Data Structure
 * 
 * Represents the user's saved profile information that can be suggested
 * for form fields. Contains organization data and event organizer data.
 */

const ProfileDataStructure = {
  // Organization Information
  organization: {
    name: "string",              // Legal organization name
    type: "enum",                // nonprofit, charity, community, faith
    ein: "string",               // Federal Employer Identification Number (XX-XXXXXXX)
    yearFounded: "string",       // YYYY format
    missionStatement: "string",  // Long text (100-200 words)
    website: "string"            // https://example.com
  },

  // Organization Address Components
  organizationAddress: {
    street: "string",            // Street address line
    city: "string",              // City
    state: "enum | string",      // State / Province from dropdown, or "Other" for custom input
    postalCode: "string",        // Postal/ZIP code
    country: "string"            // Country name
  },

  // Organization Contact Information
  organizationContact: {
    name: "string",              // Primary contact full name
    title: "string",             // Job title / position
    email: "string",             // Email address
    phone: "string"              // Phone number (any format)
  },

  // Event Organizer Information (separate from organization contact)
  eventOrganizer: {
    name: "string",              // Full name of event organizer
    email: "string",             // Email address
    phone: "string",             // Phone number (any format)
    title: "string"              // Title or role (optional)
  }
};

module.exports = ProfileDataStructure;
