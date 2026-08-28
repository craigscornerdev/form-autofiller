/**
 * Base preset — the concepts every domain shares.
 *
 * Contact and postal-address fields that a charity form, a personal signup, or a
 * business registration all ask for in some wording. Domain-specific presets
 * (`charity`, `personal`, …) declare `extends: "base"` and add their own vocab
 * on top; `concept-registry.js` unions them.
 *
 * Exports a `FieldConcept[]` (see the typedef in `concept-registry.js`).
 * See DESIGN.md §3.1–§3.2.
 */

/** @type {import('../concept-registry').FieldConcept[]} */
const baseConcepts = [
  {
    id: 'contact.full_name',
    label: 'Full name',
    aliases: ['full name', 'name', 'your name', 'contact name', 'contact person'],
    autocompleteTokens: ['name'],
    groupHints: ['contact', 'primary contact', 'your details', 'about you'],
    valueType: 'text',
    controlTypes: ['text'],
    fillPolicy: 'auto'
  },
  {
    id: 'contact.first_name',
    label: 'First name',
    aliases: ['first name', 'given name', 'forename'],
    autocompleteTokens: ['given-name'],
    groupHints: ['contact', 'primary contact', 'your details', 'about you'],
    valueType: 'text',
    controlTypes: ['text'],
    fillPolicy: 'auto'
  },
  {
    id: 'contact.last_name',
    label: 'Last name',
    aliases: ['last name', 'surname', 'family name'],
    autocompleteTokens: ['family-name'],
    groupHints: ['contact', 'primary contact', 'your details', 'about you'],
    valueType: 'text',
    controlTypes: ['text'],
    fillPolicy: 'auto'
  },
  {
    id: 'contact.email',
    label: 'Email address',
    aliases: ['email', 'email address', 'e-mail', 'e-mail address', 'contact email'],
    autocompleteTokens: ['email'],
    groupHints: ['contact', 'primary contact', 'your details', 'about you'],
    valueType: 'email',
    controlTypes: ['email', 'text'],
    fillPolicy: 'auto'
  },
  {
    id: 'contact.phone',
    label: 'Phone number',
    aliases: [
      'phone', 'phone number', 'telephone', 'contact phone',
      'mobile', 'mobile number', 'cell', 'cell phone'
    ],
    autocompleteTokens: ['tel'],
    groupHints: ['contact', 'primary contact', 'your details', 'about you'],
    valueType: 'tel',
    controlTypes: ['tel', 'text'],
    fillPolicy: 'auto'
  },
  {
    id: 'address.line1',
    label: 'Street address',
    aliases: [
      'address', 'street address', 'street', 'address line 1', 'address line'
    ],
    autocompleteTokens: ['address-line1', 'street-address'],
    groupHints: ['address', 'mailing address', 'location'],
    valueType: 'text',
    controlTypes: ['text'],
    fillPolicy: 'auto'
  },
  {
    id: 'address.line2',
    label: 'Address line 2',
    aliases: ['address line 2', 'apartment', 'suite', 'unit', 'apt'],
    autocompleteTokens: ['address-line2'],
    groupHints: ['address', 'mailing address', 'location'],
    valueType: 'text',
    controlTypes: ['text'],
    fillPolicy: 'auto'
  },
  {
    id: 'address.city',
    label: 'City',
    aliases: ['city', 'town', 'city/town', 'city or town'],
    autocompleteTokens: ['address-level2'],
    groupHints: ['address', 'mailing address', 'location'],
    valueType: 'text',
    controlTypes: ['text'],
    fillPolicy: 'auto'
  },
  {
    id: 'address.region',
    label: 'State / province',
    aliases: [
      'state', 'province', 'state/province', 'state or province',
      'region', 'county'
    ],
    autocompleteTokens: ['address-level1'],
    groupHints: ['address', 'mailing address', 'location'],
    valueType: 'text',
    controlTypes: ['text', 'select'],
    fillPolicy: 'auto'
  },
  {
    id: 'address.postal_code',
    label: 'Postal code',
    aliases: ['postal code', 'zip code', 'zip', 'postcode', 'post code'],
    autocompleteTokens: ['postal-code'],
    groupHints: ['address', 'mailing address', 'location'],
    valueType: 'postal-code',
    controlTypes: ['text'],
    fillPolicy: 'auto'
  },
  {
    id: 'address.country',
    label: 'Country',
    aliases: ['country', 'nation'],
    autocompleteTokens: ['country-name', 'country'],
    groupHints: ['address', 'mailing address', 'location'],
    valueType: 'text',
    controlTypes: ['text', 'select'],
    fillPolicy: 'auto'
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = baseConcepts;
}

if (typeof globalThis !== 'undefined') {
  globalThis.AutofillPresetBase = baseConcepts;
}
