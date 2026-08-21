# Charity Form Autofiller — Agile Backlog

## Product Goal

Suggest safe values for clearly identified charity-form fields. The user
reviews every suggestion and submits the form.

## Major Objective: Match Real-World Charity Forms

The matcher must support forms like the attached organization-information form.
The form includes uppercase labels, required markers, select fields, multiline
address fields, organization details, and event-organizer contact details.

### Agile Step 1 — Capture the Form as Test Data

- [x] Create a local HTML fixture that represents the target form.
- [x] Include text inputs, email inputs, telephone inputs, selects, and a textarea.
- [x] Include required markers, uppercase labels, placeholders, and common field attributes.
- [x] Include organization fields and event-organizer contact fields.
- [x] Do not use real personal or organization data in the fixture.

**Acceptance criteria:** The fixture loads locally and contains every field type
needed for the first matching pass.

### Agile Step 2 — Define Field Semantics and Profile Data

- [x] Map target labels to profile fields and approved aliases.
- [x] Separate organization contact data from event-organizer contact data.
- [x] Define address components: street, city, state or province, and postal code.
- [x] Define rules for required fields and select options.
- [x] Define fields that must never receive an automatic suggestion.

**Acceptance criteria:** Each target field has one documented profile source,
or is explicitly marked as unsupported or manual review.

### Agile Step 3 — Normalize Labels and Field Context

- [x] Normalize case, punctuation, required markers, and repeated whitespace.
- [x] Read label text together with `name`, `id`, `placeholder`, and accessibility text.
- [x] Detect section context such as organization information and event organizer.
- [x] Preserve the raw label for display and audit messages.
- [x] Add tests for uppercase labels, asterisks, abbreviations, and punctuation.

**Acceptance criteria:** Equivalent labels produce the same normalized representation,
while organization and event-contact fields remain distinguishable.

### Agile Step 4 — Add Conservative Fuzzy Matching

- [x] Add token-based similarity for labels that are close but not exact.
- [x] Score label evidence and field context separately.
- [x] Use explicit thresholds for high-confidence, review, and no-match results.
- [x] Reject ambiguous ties instead of selecting a best guess.
- [x] Keep exact approved aliases stronger than fuzzy matches.
- [x] Exclude address and other incompatible field types from unrelated suggestions.

**Acceptance criteria:** Fuzzy matching improves recall on the fixture without
creating a high-confidence match for an incorrect field.

### Agile Step 5 — Match Values to Controls Safely

- [x] Fill text, email, telephone, and textarea controls only when appropriate.
- [x] Match select values by visible option text or a documented value mapping.
- [x] Leave unsupported controls, including unchecked choices, for manual review.
- [x] Do not overwrite an existing value.
- [x] Never click or submit the form.
- [x] Explain the source, score category, and reason for each suggestion.

**Acceptance criteria:** The fixture receives only safe suggestions, and every
filled field has a visible reason that a user can review.

### Agile Step 5.1 — Improve Fuzzy Matching for Real-World Labels

- 5.1.1 [ ] Diagnose alias coverage gaps for hyphenated and equivalent terms such as `nonprofit` vs `non-profit`, `tax id` vs `tax identification`, and `mission` vs `organization mission`.
- 5.1.2 [ ] Add canonical normalization for word variants so equivalent labels collapse before scoring, including hyphenation, punctuation, abbreviations, and repeated wording.
- 5.1.3 [ ] Expand alias and synonym sets for mission statements, EIN and tax ID fields, and event-related labels without widening the matcher to clearly unrelated fields.
- 5.1.4 [ ] Review type compatibility rules for textarea and select controls so labels like mission statement or event description are not filtered out by a strict field-type mismatch.
- 5.1.5 [ ] Decide the safe policy for event-specific fields: either a lower-confidence review path or an explicit manual-review rule, instead of silently excluding them from matching.
- 5.1.6 [ ] Add failing tests for the specific misses: nonprofit vs non-profit, EIN and tax ID variants, mission statement variants, and event name/date/description labels.
- 5.1.7 [ ] Re-tune confidence thresholds and ambiguity checks so near-equivalent labels can match, but still reject garbled or misleading choices.
- 5.1.8 [ ] Re-run the fixture scan and confirm the improved matcher still avoids false positives.

**Acceptance criteria:** The matcher recognizes common label variants and still refuses ambiguous matches.

### Agile Step 5.2 — Generalize Matching and Support Custom Fields

- 5.2.1 [x] Consolidate the duplicate field rule catalogs in `field-matcher.js` and `field-semantics.js` behind one shared field registry.
- 5.2.2 [x] Define a registry contract for every field: stable ID, profile path, labels, synonyms, context, value type, accepted control types, validation rule, and fill policy.
- 5.2.3 [ ] Evaluate a small browser-compatible fuzzy text library, such as Fuse.js, fast-fuzzy, or fuzzysort, against the current matcher and bundle-size constraints.
- 5.2.4 [ ] Use any library only for ranked candidate retrieval; keep normalization, semantic synonyms, context checks, type compatibility, confidence thresholds, and ambiguity rejection in our own code.
- 5.2.5 [ ] Add a canonical normalization layer shared by exact matching, fuzzy matching, select-option matching, and custom fields.
- 5.2.6 [ ] Make the matcher consume registry entries rather than hard-coded field-specific branches so new fields use the same pipeline.
- 5.2.7 [ ] Design custom field definitions that let users provide a field name, one or more aliases, optional examples, context, expected control type, value type, and fill policy.
- 5.2.8 [ ] Store custom field definitions and values separately from built-in semantics, with stable IDs and schema validation.
- 5.2.9 [ ] Default custom fields to review-only until they have sufficient aliases, a compatible control type, and an unambiguous match history.
- 5.2.10 [ ] Add diagnostics showing candidate scores, matched signals, rejected candidates, and the reason a custom field was accepted, sent for review, or rejected.
- 5.2.11 [ ] Add tests proving built-in and custom fields share the same normalization, fuzzy retrieval, context filtering, control compatibility, and tie-breaking behavior.
- 5.2.12 [ ] Add negative tests for generic or ambiguous custom labels so extensibility does not weaken the no-guessing policy.

**Acceptance criteria:** Built-in and user-defined fields use one matching pipeline, equivalent labels receive ranked candidates, and custom fields cannot produce automatic suggestions without explicit evidence and safe control compatibility.

### Agile Step 6 — Verify, Tune, and Release

- [ ] Add unit tests for normalization, scoring, thresholds, conflicts, and controls.
- [ ] Add integration tests for the complete fixture scan and suggestion flow.
- [ ] Test deliberately similar incorrect labels and missing profile values.
- [ ] Test the Renegade Lemonade request form when safe and permitted.
- [ ] Run `npm.cmd test -- --runInBand --watch=false` locally.
- [ ] Confirm the GitHub Actions CI run passes.
- [ ] Update `CHANGELOG.md` with the current date and completed changes.
- [ ] Run `graphify update .` after code or test changes.
- [ ] Review the final diff before committing or pushing.

**Acceptance criteria:** Tests pass locally and in CI, the graph is current,
and no automatic suggestion is made when evidence is ambiguous.

## Later Backlog

- [ ] Event and campaign profiles.
- [ ] Reusable answers for open-ended questions.
- [ ] Document attachments, such as a W-9 or tax letter.
- [ ] Optional AI suggestions for unclear questions.
- [ ] Expand to all types of forms.
- [ ] Allow AI to get 'smarter' based on what the user inputs, locally if possible.
