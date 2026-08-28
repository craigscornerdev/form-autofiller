const FieldMatcher = require('../field-matcher');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { LocationData } = require('../location-data');

const repoRoot = path.join(__dirname, '..');

// The scripts popup.html loads ahead of popup.js, in document order. Every
// global the scan path (addSuggestions / scanCurrentPage) reads must be provided
// by one of these, so the browser-context tests derive the list from popup.html
// rather than restating it — a module referenced but not wired in fails here.
function popupDependencyScripts() {
  const html = fs.readFileSync(path.join(repoRoot, 'popup.html'), 'utf8');
  const srcs = [];
  const pattern = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi;
  let match;

  while ((match = pattern.exec(html))) {
    if (match[1] !== 'popup.js' && !/^(https?:)?\/\//.test(match[1])) {
      srcs.push(match[1]);
    }
  }

  return srcs;
}

function loadBrowserContext() {
  const context = { console };
  vm.createContext(context);

  for (const src of popupDependencyScripts()) {
    vm.runInContext(fs.readFileSync(path.join(repoRoot, src), 'utf8'), context);
  }

  return context;
}

describe('FieldMatcher', () => {
  test('supports ISO country and subdivision values from the local database', () => {
    expect(LocationData.US.name).toBe('United States');
    expect(LocationData.US.subdivisions).toContainEqual(['US-NY', 'New York']);
    expect(LocationData.CA.subdivisions).toContainEqual(['CA-ON', 'Ontario']);
  });

  test('loads in a browser-like context without CommonJS require', () => {
    const context = loadBrowserContext();

    const matcher = new context.FieldMatcher({ email: 'alice@example.org' });
    expect(matcher.getSuggestion({ label: 'Email' }).value).toBe('alice@example.org');
  });

  test('popup.html loads every script the scan path needs', () => {
    const context = loadBrowserContext();

    // scanCurrentPage(): const blankDisplay = ConfidenceGradient.colorFor(0)
    expect(typeof context.ConfidenceGradient.colorFor).toBe('function');
    expect(context.ConfidenceGradient.colorFor(0).dashed).toBe(true);

    // addSuggestions(): suggestion.decision = FillPolicy.fillDecision(suggestion)
    expect(context.FillPolicy.fillDecision({ band: 'blank' })).toBe('skip');

    // popup.js init reads CharityLocationData before the first scan
    expect(context.CharityLocationData.LocationCountries.length).toBeGreaterThan(0);

    // addSuggestions(): new FieldMatcher(profile).getSuggestion(field), then
    // suggestion.display = ConfidenceGradient.colorFor(suggestion.confidence)
    const matcher = new context.FieldMatcher({ organizationContact: { email: 'a@b.org' } });
    const suggestion = matcher.getSuggestion({ label: 'Email', type: 'email' });

    expect(suggestion.value).toBe('a@b.org');
    expect(Number.isFinite(suggestion.confidence)).toBe(true);
    expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
    expect(suggestion.confidence).toBeLessThanOrEqual(1);
    expect(['blank', 'review', 'high']).toContain(suggestion.band);
    expect(typeof context.ConfidenceGradient.colorFor(suggestion.confidence).outline).toBe('string');
  });

  test('falls back to a review-confidence fuzzy match when no exact alias exists', () => {
    const context = loadBrowserContext();

    const matcher = new context.FieldMatcher({ email: 'alice@example.org' });
    const suggestion = matcher.getSuggestion({ label: 'Email Address for Contact', type: 'text' });

    expect(suggestion).toEqual({
      source: 'Organization contact email',
      value: 'alice@example.org',
      confidence: expect.closeTo(0.64125, 5),
      band: 'review',
      reason: 'Possible match for Organization contact email — please review.',
      signals: {
        labelMatch: {
          strategy: 'fuzzy',
          strength: expect.closeTo(0.64125, 5),
          matchedAlias: null,
          normalizedLabel: 'email address for contact'
        },
        provenance: { kind: 'profile-field', factor: 1, detail: 'scalar' },
        rejected: [
          {
            conceptId: 'eventOrganizerEmail',
            score: expect.closeTo(0.342, 5),
            reason: 'Low confidence match: "Event organizer email" (score: 34%)'
          }
        ]
      }
    });
  });

  test('the matcher reduces labels through the one canonical normalizer', () => {
    const fm = new FieldMatcher({});
    expect(fm.labelNormalizer.normalize('  Email Address (Work) ')).toBe('email address work');
    // a tight slash is kept as a compound; a spaced slash reads as a separator
    expect(fm.labelNormalizer.normalize('First/Last Name')).toBe('first/last name');
    expect(fm.labelNormalizer.normalize('State / Province')).toBe('state province');
  });

  test('getMatchingRule can combine split address data for a single address field', () => {
    const fm = new FieldMatcher({});
    const rule = fm.getMatchingRule('Mailing Address');
    expect(rule).not.toBeNull();
    expect(rule.profileField).toBe('organizationAddress');
  });

  test('getMatchingRule finds alias', () => {
    const fm = new FieldMatcher({});
    const rule = fm.getMatchingRule('Contact Email');
    expect(rule).not.toBeNull();
    expect(rule.profileField).toBe('email');
  });

  test('matches combined EIN and tax ID labels from the fixture', () => {
    const fm = new FieldMatcher({ ein: '12-3456789' });
    const suggestion = fm.getSuggestion({ label: 'EIN / TAX ID', type: 'text' });

    expect(suggestion).not.toBeNull();
    expect(suggestion.value).toBe('12-3456789');
  });

  test('getSuggestion returns null when profile value missing or empty', () => {
    const profile = { email: '   ' };
    const fm = new FieldMatcher(profile);
    const suggestion = fm.getSuggestion({ label: 'Email' });
    expect(suggestion).toBeNull();
  });

  test('getSuggestion returns suggestion when profile has value', () => {
    const profile = { email: 'alice@example.org' };
    const fm = new FieldMatcher(profile);
    const suggestion = fm.getSuggestion({ label: 'Email' });
    expect(suggestion).toEqual({
      source: 'Email',
      value: 'alice@example.org',
      confidence: 1,
      band: 'high',
      reason: 'Exact alias match for Email.',
      signals: {
        labelMatch: {
          strategy: 'exact-alias',
          strength: 1,
          matchedAlias: 'email',
          normalizedLabel: 'email'
        },
        provenance: { kind: 'profile-field', factor: 1, detail: 'scalar' },
        rejected: []
      }
    });
  });

  test('getSuggestion does not overwrite an existing value', () => {
    const profile = { email: 'alice@example.org' };
    const fm = new FieldMatcher(profile);
    const suggestion = fm.getSuggestion({ label: 'Email', value: 'existing@example.org' });
    expect(suggestion).toBeNull();
  });

  test('getSuggestion can select a visible option for a select field', () => {
    const profile = { email: 'alice@example.org' };
    const fm = new FieldMatcher(profile);
    const suggestion = fm.getSuggestion({
      label: 'Contact Email',
      type: 'select',
      value: '',
      options: [
        { value: 'other', text: 'Other' },
        { value: 'personal', text: 'Personal' },
        { value: 'work', text: 'Work Email' }
      ]
    });

    expect(suggestion).not.toBeNull();
    expect(suggestion.value).toBe('work');
    expect(suggestion.reason).toContain('select');
  });

  test('getSuggestion rejects unsupported field types', () => {
    const profile = { email: 'alice@example.org' };
    const fm = new FieldMatcher(profile);
    const suggestion = fm.getSuggestion({ label: 'Email', type: 'checkbox' });
    expect(suggestion).toBeNull();
  });

  test('getSuggestion combines split address data for a single address field', () => {
    const profile = {
      organizationAddress: {
        street: '123 Maple Lane',
        city: 'Riverdale',
        state: 'New York',
        postalCode: '10471',
        country: 'United States'
      }
    };
    const fm = new FieldMatcher(profile);
    const suggestion = fm.getSuggestion({ label: 'Mailing Address', type: 'textarea' });

    expect(suggestion).not.toBeNull();
    expect(suggestion.value).toBe('123 Maple Lane, Riverdale, New York 10471');
    expect(suggestion.reason).toContain('address');
  });

  test('getSuggestion uses split city data when city is matched directly', () => {
    const profile = {
      organizationAddress: {
        street: '123 Maple Lane',
        city: 'Riverdale',
        state: 'New York',
        postalCode: '10471'
      }
    };
    const fm = new FieldMatcher(profile);
    const suggestion = fm.getSuggestion({ label: 'City', type: 'text' });

    expect(suggestion).not.toBeNull();
    expect(suggestion.value).toBe('Riverdale');
  });

  test('getSuggestion supports organization type and contact position fields', () => {
    const profile = {
      organizationType: 'Charity',
      position: 'Development Director'
    };
    const fm = new FieldMatcher(profile);

    const typeSuggestion = fm.getSuggestion({ label: 'Organization Type', type: 'select' });
    const positionSuggestion = fm.getSuggestion({ label: 'Position', type: 'text' });

    expect(typeSuggestion).not.toBeNull();
    expect(typeSuggestion.value).toBe('Charity');
    expect(positionSuggestion).not.toBeNull();
    expect(positionSuggestion.value).toBe('Development Director');
  });

  test('fills a mission statement textarea', () => {
    const fm = new FieldMatcher({ missionStatement: 'We help cats.' });
    const suggestion = fm.getSuggestion({ label: 'Mission Statement', type: 'textarea' });

    expect(suggestion).not.toBeNull();
    expect(suggestion.value).toBe('We help cats.');
  });

  test('fills saved event details', () => {
    const fm = new FieldMatcher({
      eventName: 'Fall Adoption Drive',
      eventDate: '2026-10-18',
      eventDescription: 'A community adoption event.'
    });

    expect(fm.getSuggestion({ label: 'Event Name', type: 'text' }).value).toBe('Fall Adoption Drive');
    expect(fm.getSuggestion({ label: 'Event Date', type: 'text' }).value).toBe('2026-10-18');
    expect(fm.getSuggestion({ label: 'Event Description', type: 'textarea' }).value).toBe('A community adoption event.');
  });

  test('does not suggest event details when they are not saved', () => {
    const fm = new FieldMatcher({});

    expect(fm.getSuggestion({ label: 'Event Name', type: 'text' })).toBeNull();
    expect(fm.getSuggestion({ label: 'Event Date', type: 'text' })).toBeNull();
    expect(fm.getSuggestion({ label: 'Event Description', type: 'textarea' })).toBeNull();
  });

  test('selects the option matching the saved organization type', () => {
    const fm = new FieldMatcher({ organizationType: 'Charity' });
    const suggestion = fm.getSuggestion({
      label: 'Organization Type',
      type: 'select',
      options: [
        { value: '', text: '-- Select an option --' },
        { value: 'nonprofit', text: 'Non-Profit' },
        { value: 'charity', text: 'Registered Charity' }
      ]
    });

    expect(suggestion).not.toBeNull();
    expect(suggestion.value).toBe('charity');
  });

  test('selects an ISO subdivision value from a saved state name', () => {
    const fm = new FieldMatcher({ organizationAddress: { state: 'New York' } });
    const suggestion = fm.getSuggestion({
      label: 'State / Province',
      type: 'select',
      options: [
        { value: '', text: 'Select a state or province' },
        { value: 'US-NY', text: 'New York' },
        { value: 'US-CA', text: 'California' }
      ]
    });

    expect(suggestion).not.toBeNull();
    expect(suggestion.value).toBe('US-NY');
  });

  test('uses standard autocomplete semantics when a website label is ambiguous', () => {
    const fm = new FieldMatcher({ organizationAddress: { state: 'New York' } });
    const suggestion = fm.getSuggestion({
      label: 'Administrative region',
      autocomplete: 'address-level1',
      type: 'select',
      options: [{ value: 'US-NY', text: 'New York' }]
    });

    expect(suggestion).not.toBeNull();
    expect(suggestion.value).toBe('US-NY');
  });
});
