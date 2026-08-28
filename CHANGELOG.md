# Changelog

This file records completed work and version history. New entries use the format
`version — YYYY-MM-DD — title`.

## 0.12.0 — 2026-08-27 — Render the confidence spectrum

- `popup.html` loads `confidence-gradient.js` and `fill-policy.js` ahead of `fuzzy-field-matcher.js` / `field-matcher.js`, so both surfaces read colours from the one helper.
- `addSuggestions` attaches `suggestion.display = ConfidenceGradient.colorFor(confidence)` and `suggestion.decision = FillPolicy.fillDecision(suggestion)` before injection.
- The popup list is driven by the gradient: each row's left border and the suggestion text colour come from `suggestion.display`; the band label comes from `ConfidenceGradient.describe`. No `high|review|medium|low` class keying remains. A field the page already filled shows an "Already filled — left unchanged" row with no colour.
- `applyHighConfidenceMatches` → `fillSuggestedValues(matches, blankDisplay)`. It writes a value whenever the suggestion's band is not `blank` (review-band values now fill in place); `blank` and no-match fields get a dashed-red outline and no value; an already-filled field is left completely untouched. The injected function does no scoring — it only applies the precomputed `display`. Every fill-safety invariant is unchanged.
- `popup.css`: the legend is now a red→green gradient bar with a dashed-red "left blank" chip.
- `demos/spectrum-demo.html`: the sample profile nests contact details under `organizationContact`, and the street label is "Street", so every band is populated — green (8 exact fields), review (organization type, reworded contact email, composed mailing address), dashed-red blank (favourite colour, referral source), and the pre-filled website left untouched.

## 0.11.0 — 2026-08-27 — Numeric confidence through the matcher

- `FieldMatcher.getSuggestion` now returns a numeric `confidence` (0..1) and a `band` (`blank` | `review` | `high`) instead of a category string. `confidence = clamp01(S_label × S_prov)` via `confidence-gradient.js`.
- Each `getMatchingRule` branch attaches a per-call `_labelMatch { strategy, strength, matchedAlias, normalizedLabel }` and `_rejected` (runner-up candidates) to a clone of the registry rule — `this.rules` is never mutated. `S_label` is `1.0` for the autocomplete and exact-alias branches and the raw tier score for the fuzzy branch.
- Added `valueProvenance(field, rule)`: `derived` (`0.85`) for select and composed-address values, `profile-field` (`1.0`) for direct scalars — so composed and select-mapped values can never reach the green band.
- `getSuggestion` returns `signals: { labelMatch, provenance, rejected }` for diagnostics. `getReason` is driven off `_labelMatch.strategy`; wording is unchanged.
- Added `tests/confidence-model.test.js`; updated `tests/field-matcher.test.js` to the numeric shape and to load `confidence-gradient.js` in the browser-context loader.

## 0.10.0 — 2026-08-27 — Gradient + fill-policy helpers

- Added `confidence-gradient.js`: a pure module mapping a 0..1 confidence to `DEFAULT_THRESHOLDS`, `clamp01`, `bandFor`, `hueFor` (0→120 across floor→1.0), `colorFor` (`{band, hue, dashed, outline, background, text}`; sub-floor is a fixed dark red with a dashed outline), and `describe`. Every function takes an explicit `thresholds` argument defaulting to `DEFAULT_THRESHOLDS`.
- Added `fill-policy.js`: pure `fillDecision(suggestion, thresholds)` returning `'fill'` unless there is no suggestion or the suggestion is in the blank band.
- Both modules use the dual export (`module.exports` + `globalThis`) so Node tests `require()` them directly and the popup can load them as plain scripts.
- Added `tests/confidence-gradient.test.js` and `tests/fill-policy.test.js` covering every band boundary, the sub-floor colour, and custom threshold sets. Nothing consumes the helpers yet; the matcher and popup wire in at A2 and A3.

## 0.9.0 — 2026-08-27 — Wire fuzzy matching into the live suggestion path

- `FieldMatcher.getMatchingRule` now falls back to `FuzzyFieldMatcher` when no exact alias matches, instead of the class sitting unused outside its own tests.
- Retuned the token-overlap weight (0.8 → 1.0) and REVIEW threshold (0.70 → 0.60) so a realistic near-miss label can surface as a review-confidence suggestion; the non-exact ceiling (0.855) still stays below HIGH, so only true exact aliases auto-fill.
- Fixed two top-level identifier collisions (`semantics`, `FieldSemantics`, `FuzzyFieldMatcher`) between `fuzzy-field-matcher.js` and `field-matcher.js`/`field-semantics.js` that would have thrown a `SyntaxError` once both scripts shared the popup's global scope.
- Added `fuzzy-field-matcher.js` to `popup.html`'s script list.
- Added a regression test proving a non-exact label returns a `review`-confidence suggestion via the fuzzy fallback.

## 0.8.0 — 2026-08-21 — Safe control matching and step 5 completion

- **Step 5:** Added safe control checks before suggesting values for text, email, tel, textarea, and select controls.
- Prevented overwriting existing values and rejected unsupported controls such as checkboxes and radio buttons.
- Added explicit reason text to each suggestion and surfaced it in the popup UI.
- Kept the form scan non-destructive: no clicks, submissions, or automatic form actions are triggered.
- Added regression tests for safe fill behavior, existing values, select handling, and unsupported control types.
- Evaluated Fuse.js, fast-fuzzy, and fuzzysort; deferred adding a dependency until the retrieval-only integration in Step 5.2.4 is needed.
- Integrated Fuse.js for ranked alias retrieval while retaining the existing normalization, context, type, confidence, and ambiguity safeguards.
- Added the normalized `ein tax id` alias so combined EIN labels such as `EIN / TAX ID` fill from the saved profile.
- Fixed select scanning by including option metadata and matching options against saved profile values, allowing organization type to fill correctly.
- Fixed textarea metadata so mission statement fields use the canonical `textarea` type and can be filled.
- Added standards-aware country and subdivision controls to the profile and country-first rescanning for dependent website dropdowns.
- Recognized standard `autocomplete` address tokens as semantic signals when website labels are ambiguous.
- Added a local ISO-style common-country and subdivision database to populate profile address controls without a network request.
- Event name, date, and description now fill when explicitly saved in the profile and remain blank when no event value is saved.
- Enabled scanning of local HTML fixtures with the required `file://` host permission and documented Chrome's **Allow access to file URLs** setting.
- Made the field semantics and matcher scripts load in both Chrome extension pages and CommonJS tests, with browser-loading regression coverage.

## 0.7.0 — 2026-08-21 — Foundation for conservative fuzzy matching (Steps 1-4)

- **Step 1:** Created HTML test fixture with all required field types (text, email, tel, select, textarea).
- **Step 2:** Defined field semantics with 21 field definitions, profile data structure, context separation (organization/organizationContact/event), and validation rules.
- **Step 3:** Implemented label normalization: case conversion, punctuation removal, required marker stripping, whitespace handling, and field context detection.
- **Step 4:** Added conservative fuzzy matching with hierarchical scoring, Jaccard similarity, confidence thresholds (high/review/no-match), smart tie-breaking, and field type safety.
- Added comprehensive test suite: 113 passing tests across 4 test files.
- Created profile data structure with organization, address, contact, and event organizer fields.
- Implemented LabelNormalizer for gathering label sources and context detection.
- Implemented FuzzyFieldMatcher with exact alias prioritization and ambiguity rejection.

## 0.6.2 — 2026-08-21 — Project maintenance

- Added a GitHub Actions workflow that installs dependencies and runs Jest.
- Added required local test steps to the project coding agent workflow.
- Added a graphify code graph with 80 nodes, 83 edges, and 13 communities.
- Added Git and GitHub workflow instructions to the README.
- Added `.gitignore` rules for generated development files.
- Documented the optional Node.js and npm test setup.
- Reorganized `TODO.md` into future fuzzy-matching work with acceptance criteria.
- Clarified when the agent updates graphify and when it suggests Git actions.

## 0.6.1 — 2026-08-21 — EIN number-field support

- Removes punctuation from an EIN only when a form requires a numeric value.
- Applies the green highlight only after the form accepts the filled value.
- Marks rejected values for review instead of treating them as successfully filled.

## 0.6.0 — 2026-08-21 — More exact high-confidence matches

- Added exact-label matches for email, phone, website, and EIN.
- Each value fills only when the field label is one of its approved aliases.
- Fields with unclear labels remain unfilled.

## 0.5.0 — 2026-08-21 — High-confidence fill and color review

- High-confidence matches now fill empty webpage fields.
- Webpage fields receive a color outline: green for high confidence, yellow for review, and red for no match.
- The popup shows a green, yellow, and red confidence guide.
- Fields without a high-confidence match are left unchanged.
- Existing field values are not overwritten.
- The extension still does not submit forms.

## 0.4.0 — 2026-08-21 — First conservative match

- Added an exact-match rule for **Organization Name**.
- The popup shows a high-confidence suggestion but does not fill the webpage.
- The rule rejects labels that include **address**.

## 0.3.0 — 2026-08-21 — Sample charity profile

- Added one editable profile for basic charity information.
- Added sample cat-shelter information for testing.
- Saves profile information locally in Chrome.

## 0.2.0 — 2026-08-21 — Field details

- The scan now lists each detected field in the popup.
- Each result shows its best available label, type, required state, and placeholder.
- Reads standard labels and accessibility labels before falling back to other field information.

## 0.1.1 — 2026-08-21 — Scan the open page

- Scanning now runs only when the user selects **Scan Form**.
- A page does not need to be refreshed before it can be scanned.
- The scan result now states that it counts visible, editable fields.

## 0.1.0 — 2026-08-21 — First extension shell

- Added the Chrome extension structure.
- Added a popup with a **Scan Form** button.
- Added a basic page scan that counts form fields.
- Does not fill, edit, or submit any form.
