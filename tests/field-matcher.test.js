const FieldMatcher = require('../field-matcher');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { LocationData } = require('../location-data');

describe('FieldMatcher', () => {
  test('supports ISO country and subdivision values from the local database', () => {
    expect(LocationData.US.name).toBe('United States');
    expect(LocationData.US.subdivisions).toContainEqual(['US-NY', 'New York']);
    expect(LocationData.CA.subdivisions).toContainEqual(['CA-ON', 'Ontario']);
  });

  test('loads in a browser-like context without CommonJS require', () => {
    const context = { console };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'field-semantics.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'confidence-gradient.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'fuzzy-field-matcher.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'field-matcher.js'), 'utf8'), context);

    const matcher = new context.FieldMatcher({ email: 'alice@example.org' });
    expect(matcher.getSuggestion({ label: 'Email' }).value).toBe('alice@example.org');
  });

  test('falls back to a review-confidence fuzzy match when no exact alias exists', () => {
    const context = { console };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'field-semantics.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'confidence-gradient.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'fuzzy-field-matcher.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'field-matcher.js'), 'utf8'), context);

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

  test('normalize lowercases and trims punctuation', () => {
    const fm = new FieldMatcher({});
    expect(fm.normalize('  Email Address (Work) ')).toBe('email address work');
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
