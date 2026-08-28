# Changelog

This file records completed work and version history. New entries use the format
`version — YYYY-MM-DD — title`.

## 0.17.0 — 2026-08-28 — Field debug readout + quieter highlight

- `confidence-gradient.js` gains `DEBUG_COLOR` (`hsl(282 60% 45%)`, reserved for
  debug output and never a band) and `debugLabel(confidence, thresholds)` →
  `"0.81 · review · hue 63"`. `colorFor` now returns a translucent `background`
  (`hsl(H S 55% / 0.10)`) and a `debug: { color, label }` key, so the injected
  fill function still does no maths.
- `paintField` recolours the field's **own** border (`border-color` +
  `border-style`, width untouched so nothing reflows) and falls back to a `1px`
  outline at offset `0` when the computed border width is `0`; the fill is the
  translucent `background`. It paints the purple `debug.label` in an absolutely
  positioned readout under the field's lower-right edge, in document
  coordinates, one per field, reused across scans via
  `field.dataset.autofillDebugId`.
- `tests/confidence-gradient.test.js`: `DEBUG_COLOR` and `debugLabel` cases; the
  `colorFor` cases updated for the translucent background and the `debug` key.
- Demo: re-scan `demos/spectrum-demo.html` — every painted field carries a
  purple `0.xx · band · hue N` at its lower right, borders are hairline-tinted in
  band colour, and the `.note` helper lines stay readable underneath.

## 0.16.0 — 2026-08-28 — Matcher runs on the concept registry

- `field-matcher.js` and `fuzzy-field-matcher.js` build their rules from `concept-registry.load(['charity'])` — the unioned `base` + `charity` `FieldConcept[]` — instead of a hand-built field registry. `field-semantics.js` and `profile-data-structure.js` are gone; `popup.html` loads `concept-registry.js` + `presets/base.js` + `presets/charity.js` ahead of the matchers.
- Label → concept: the autocomplete tier matches any `concept.autocompleteTokens` entry (not a fixed four-token map); the exact-alias and autocomplete tiers resolve an alias/token collision to the concept defined later (charity refines base), the same "last wins" rule the registry union uses.
- `getSuggestion` gates on the concept: `fillPolicy: "never"` or `sensitive: true` yields no suggestion, so the `event.name` / `event.date` / `event.description` concepts never autofill. `FieldMatcher.isNeverAutoFillRule` is removed.
- `presets/charity.js` gains `org.address.full` (a `composite` concept answering to "address" / "mailing address" / "street address", composed from the address parts) and a `profileBindings` map — the transitional concept-id → saved-profile-location bridge the matcher reads until the profile store is keyed by concept id.
- Scanning `demos/spectrum-demo.html` with the sample profile is unchanged from Phase A: eight fields solid green, organization type / reworded contact email / composed mailing address in the review band, favourite colour / referral source dashed-red blank, the pre-filled website untouched.
- Tests: `tests/fuzzy-field-matcher.test.js` reworked to concept ids and the `context: "unknown"` call shape; `tests/presets-charity.test.js` pins the vocabulary contract directly (no `field-semantics` dependency); `tests/field-matcher.test.js` updated for concept-id runners-up and the event-field gate; `tests/field-semantics.test.js` removed.

## 0.15.0 — 2026-08-28 — One canonical label normalizer

- `label-normalizer.js` now carries a dual-export footer (`module.exports` + `globalThis.CharityLabelNormalizer`) and `popup.html` loads it ahead of the matchers, so the same normalizer runs in the extension and in Node tests.
- `field-matcher.js` and `fuzzy-field-matcher.js` both reduce labels through a `LabelNormalizer` instance instead of each carrying their own rules; every registry alias is run through it when the matcher is constructed, so the label side and the alias side are always compared in the same form.
- The canonical normalizer keeps a tight slash as a compound (`"State/Province"` → `state/province`) but treats a spaced slash as a separator (`"EIN / Tax ID"` → `ein tax id`, `"State / Province"` → `state province`), so both wordings still resolve to their concept.
- `tests/label-normalizer.test.js` adds cross-call-site parity cases (the matchers delegate to `LabelNormalizer`; a raw label reduces identically wherever it is normalized; every stored alias is already in canonical form); `tests/field-matcher.test.js` checks the matcher normalizes through the shared normalizer, slash handling included.

- Added `presets/charity.js`: all 21 fields the current `FieldSemantics` registry describes, ported to domain-neutral `FieldConcept`s under the `org.*` and `event.*` namespaces. Every original alias is carried over, `organizationType`'s select-option map becomes `enumValues`, and the three `neverAutoFill` event fields (`event.name` / `event.date` / `event.description`) become `fillPolicy: "never"`. The array carries `extends: "base"`, so `concept-registry.load(['charity'])` unions the shared `contact.*` / `address.*` concepts underneath it. Dual export (`module.exports` + `globalThis.AutofillPresetCharity`). Nothing consumes it yet — the matcher still runs off `FieldRegistry`.
- `org.ein` also answers to the fuller tax-id wordings (`federal tax identification number`, `tax identification number`, `federal employer identification number`, `fein`) so the semantic tier has anchors to match against later.
- Added `tests/presets-charity.test.js`: field-for-field parity with `FieldSemantics` (every key ported, aliases preserved, labels and select options intact, `neverAutoFill` → `fillPolicy`), the `extends: "base"` union order, base/charity id-collision check, and the known label-miss cases (`nonprofit` vs `non-profit`, EIN / tax-id variants, multiline mission / event description).
- `tests/concept-registry.test.js`: the unknown-preset case now names a preset that stays unknown, since `charity` resolves.

## 0.13.0 — 2026-08-28 — FieldConcept schema + registry loader

- Added `concept-registry.js`: the `FieldConcept` JSDoc typedef (domain-neutral shape from DESIGN.md §3.1) plus `load(enabledPresets, customConcepts)`, which resolves each enabled preset (by built-in name or inline), pulls `extends` dependencies depth-first (a shared base is collected once), validates every concept, and unions them by `id` into a single active registry — custom concepts appended last so they win an id collision while the original slot order is kept.
- `validateConcept` returns a normalized clone with defaults applied (`fillPolicy: "auto"`, `sensitive: false`, empty `autocompleteTokens` / `groupHints` / `examples`, `null` `enumValues` / `compose`) and throws a `concept-registry: …` error on a missing/non-namespaced `id`, a bad `valueType` / `fillPolicy`, malformed `aliases` / `controlTypes`, an `enum` without `enumValues` (or `enumValues` on a non-enum), or a `composite` without a valid `compose` (or vice-versa).
- Added `presets/base.js`: the `contact.*` and `address.*` concepts every domain shares, as a `FieldConcept[]`. Dual export (`module.exports` + `globalThis.AutofillPresetBase`).
- Added `tests/concept-registry.test.js` covering the base preset shape, `load` union / defaults / clone / id-collision / `extends` de-duplication, enum + composite round-trips, and every malformed-input rejection. Nothing consumes the registry yet; the matcher swaps onto it in a later step.

## 0.12.1 — 2026-08-27 — Keep the popup's script wiring honest

- `fill-policy.js` no longer creates a module-level `ConfidenceGradient` binding — it resolves the gradient helper through a local `gradient()` accessor. As sibling classic scripts in `popup.html`, `fill-policy.js` and `confidence-gradient.js` had both declared `const ConfidenceGradient`, a global-scope collision that stopped `fill-policy.js` from defining `FillPolicy` and left `Scan Form` failing with the generic "This page cannot be scanned" message.
- `popup.js` checks `FieldMatcher`, `ConfidenceGradient`, `FillPolicy`, and `CharityLocationData` on load; if any is absent it shows "Extension didn't load fully. Reload it…" and disables the scan button instead of surfacing a mid-scan `TypeError`.
- `getScanErrorMessage` recognises the whole family of host-access failures (`cannot access contents…`, `missing host permission`, `request permission to access`) and points the user at **Allow access to file URLs**; `chrome://` / Web Store / other-extension pages still get "open a normal website".
- `tests/field-matcher.test.js` derives its browser-context script list from `popup.html` and adds `popup.html loads every script the scan path needs`, so a module referenced by the scan path but missing (or mis-ordered) in `popup.html` now fails `npm test`.

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
