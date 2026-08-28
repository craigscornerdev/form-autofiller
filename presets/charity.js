/**
 * Charity preset — the nonprofit / fundraising-organization vocabulary.
 *
 * Every concept a charity, grant, or event-registration form asks for, on top
 * of the shared `contact.*` / `address.*` concepts in `base`. This is the
 * default-enabled preset, so out-of-the-box behaviour is the charity flow.
 *
 * Exports a `FieldConcept[]` (see the typedef in `concept-registry.js`) carrying
 * `extends: "base"`, so `concept-registry.load(['charity'])` unions the base
 * concepts underneath these. Nothing consumes it yet.
 * See DESIGN.md §3.1–§3.2.
 */

const ORG_HINTS = [
  'organization', 'organisation', 'organization information', 'about your organization'
];
const ORG_ADDRESS_HINTS = [
  'organization', 'organization address', 'mailing address', 'location'
];
const ORG_CONTACT_HINTS = [
  'organization contact', 'primary contact', 'contact information', 'contact person'
];
const EVENT_HINTS = ['event', 'event details', 'event information'];
const EVENT_ORGANIZER_HINTS = ['event', 'organizer', 'coordinator', 'event details'];

/** @type {import('../concept-registry').FieldConcept[]} */
const charityConcepts = [
  {
    id: 'org.legal_name',
    label: 'Organization name',
    aliases: [
      'organization name', 'name of organization', 'charity name',
      'nonprofit name', 'non profit name', 'organization legal name'
    ],
    autocompleteTokens: ['organization'],
    groupHints: ORG_HINTS,
    valueType: 'text',
    controlTypes: ['text'],
    fillPolicy: 'auto'
  },
  {
    id: 'org.type',
    label: 'Organization type',
    aliases: [
      'organization type', 'type of organization', 'charity type', 'nonprofit type'
    ],
    groupHints: ORG_HINTS,
    valueType: 'enum',
    controlTypes: ['select'],
    fillPolicy: 'auto',
    enumValues: [
      { value: 'non-profit', aliases: ['nonprofit', 'non-profit', 'npo'] },
      { value: 'charity', aliases: ['charity', 'registered charity'] },
      { value: 'community', aliases: ['community', 'community organization'] },
      { value: 'faith', aliases: ['faith-based', 'faith based', 'religious'] }
    ]
  },
  {
    id: 'org.ein',
    label: 'EIN / Tax ID',
    aliases: [
      'ein', 'ein number', 'ein tax id', 'employer identification number',
      'tax id', 'tax id number', 'federal tax id',
      'federal employer identification number',
      'federal tax identification number', 'tax identification number', 'fein'
    ],
    groupHints: ORG_HINTS,
    valueType: 'text',
    controlTypes: ['text'],
    fillPolicy: 'auto'
  },
  {
    id: 'org.year_founded',
    label: 'Year founded',
    aliases: ['year founded', 'founded', 'year established', 'established'],
    groupHints: ORG_HINTS,
    valueType: 'text',
    controlTypes: ['text'],
    fillPolicy: 'auto'
  },
  {
    id: 'org.mission',
    label: 'Mission statement',
    aliases: ['mission statement', 'mission', 'organization mission', 'our mission'],
    groupHints: ORG_HINTS,
    valueType: 'multiline',
    controlTypes: ['textarea'],
    fillPolicy: 'auto'
  },
  {
    id: 'org.address.line1',
    label: 'Organization street address',
    aliases: [
      'street address', 'street', 'address line', 'address line 1',
      'organization address', 'organization street'
    ],
    autocompleteTokens: ['street-address', 'address-line1'],
    groupHints: ORG_ADDRESS_HINTS,
    valueType: 'text',
    controlTypes: ['text'],
    fillPolicy: 'auto'
  },
  {
    id: 'org.address.city',
    label: 'Organization city',
    aliases: ['city', 'organization city'],
    autocompleteTokens: ['address-level2'],
    groupHints: ORG_ADDRESS_HINTS,
    valueType: 'text',
    controlTypes: ['text'],
    fillPolicy: 'auto'
  },
  {
    id: 'org.address.region',
    label: 'Organization state / province',
    aliases: [
      'state', 'state/province', 'state province', 'state or province',
      'province', 'organization state'
    ],
    autocompleteTokens: ['address-level1'],
    groupHints: ORG_ADDRESS_HINTS,
    valueType: 'text',
    controlTypes: ['text', 'select'],
    fillPolicy: 'auto'
  },
  {
    id: 'org.address.postal_code',
    label: 'Organization postal code',
    aliases: [
      'postal code', 'zip code', 'zip', 'postcode', 'organization postal code'
    ],
    autocompleteTokens: ['postal-code'],
    groupHints: ORG_ADDRESS_HINTS,
    valueType: 'postal-code',
    controlTypes: ['text'],
    fillPolicy: 'auto'
  },
  {
    id: 'org.address.country',
    label: 'Organization country',
    aliases: ['country', 'organization country', 'country of operation'],
    autocompleteTokens: ['country-name', 'country'],
    groupHints: ORG_ADDRESS_HINTS,
    valueType: 'text',
    controlTypes: ['text', 'select'],
    fillPolicy: 'auto'
  },
  {
    id: 'org.contact.full_name',
    label: 'Organization contact name',
    aliases: [
      'primary contact name', 'contact name', 'organization contact name',
      'contact person', 'primary contact'
    ],
    groupHints: ORG_CONTACT_HINTS,
    valueType: 'text',
    controlTypes: ['text'],
    fillPolicy: 'auto'
  },
  {
    id: 'org.contact.title',
    label: 'Organization contact title',
    aliases: [
      'contact title', 'title', 'position', 'contact position',
      'organization contact title'
    ],
    groupHints: ORG_CONTACT_HINTS,
    valueType: 'text',
    controlTypes: ['text'],
    fillPolicy: 'auto'
  },
  {
    id: 'org.contact.email',
    label: 'Organization contact email',
    aliases: [
      'contact email', 'email', 'email address', 'contact email address',
      'organization email', 'organization contact email'
    ],
    autocompleteTokens: ['email'],
    groupHints: ORG_CONTACT_HINTS,
    valueType: 'email',
    controlTypes: ['email', 'text'],
    fillPolicy: 'auto'
  },
  {
    id: 'org.contact.phone',
    label: 'Organization contact phone',
    aliases: [
      'contact phone', 'phone', 'phone number', 'contact phone number',
      'telephone', 'contact telephone', 'organization phone',
      'organization contact phone'
    ],
    autocompleteTokens: ['tel'],
    groupHints: ORG_CONTACT_HINTS,
    valueType: 'tel',
    controlTypes: ['tel', 'text'],
    fillPolicy: 'auto'
  },
  {
    id: 'org.website',
    label: 'Organization website',
    aliases: [
      'website', 'organization website', 'charity website', 'nonprofit website',
      'web site', 'organization web site'
    ],
    autocompleteTokens: ['url'],
    groupHints: ORG_HINTS,
    valueType: 'url',
    controlTypes: ['url', 'text'],
    fillPolicy: 'auto'
  },
  {
    id: 'event.name',
    label: 'Event name',
    aliases: ['event name', 'name of event', 'campaign name', 'event or campaign name'],
    groupHints: EVENT_HINTS,
    valueType: 'text',
    controlTypes: ['text'],
    fillPolicy: 'never'
  },
  {
    id: 'event.organizer_name',
    label: 'Event organizer name',
    aliases: [
      'organizer name', 'event organizer name', 'event organizer', 'organizer',
      'coordinator name', 'event coordinator'
    ],
    groupHints: EVENT_ORGANIZER_HINTS,
    valueType: 'text',
    controlTypes: ['text'],
    fillPolicy: 'auto'
  },
  {
    id: 'event.organizer_email',
    label: 'Event organizer email',
    aliases: [
      'organizer email', 'event organizer email', 'organizer email address',
      'coordinator email'
    ],
    autocompleteTokens: ['email'],
    groupHints: EVENT_ORGANIZER_HINTS,
    valueType: 'email',
    controlTypes: ['email', 'text'],
    fillPolicy: 'auto'
  },
  {
    id: 'event.organizer_phone',
    label: 'Event organizer phone',
    aliases: [
      'organizer phone', 'event organizer phone', 'organizer phone number',
      'coordinator phone'
    ],
    autocompleteTokens: ['tel'],
    groupHints: EVENT_ORGANIZER_HINTS,
    valueType: 'tel',
    controlTypes: ['tel', 'text'],
    fillPolicy: 'auto'
  },
  {
    id: 'event.date',
    label: 'Event date',
    aliases: ['event date', 'date', 'date of event'],
    groupHints: EVENT_HINTS,
    valueType: 'text',
    controlTypes: ['text'],
    fillPolicy: 'never'
  },
  {
    id: 'event.description',
    label: 'Event description',
    aliases: ['event description', 'description', 'event details', 'about the event'],
    groupHints: EVENT_HINTS,
    valueType: 'multiline',
    controlTypes: ['textarea'],
    fillPolicy: 'never'
  }
];

charityConcepts.extends = 'base';

if (typeof module !== 'undefined' && module.exports) {
  module.exports = charityConcepts;
}

if (typeof globalThis !== 'undefined') {
  globalThis.AutofillPresetCharity = charityConcepts;
}
