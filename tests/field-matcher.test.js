const FieldMatcher = require('../field-matcher');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('FieldMatcher', () => {
  test('loads in a browser-like context without CommonJS require', () => {
    const context = { console };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'field-semantics.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'field-matcher.js'), 'utf8'), context);

    const matcher = new context.FieldMatcher({ email: 'alice@example.org' });
    expect(matcher.getSuggestion({ label: 'Email' }).value).toBe('alice@example.org');
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
      confidence: 'high',
      scoreCategory: 'high',
      reason: 'Exact alias match for Email.'
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
});
