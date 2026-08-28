# Form Autofiller — Backlog

Future work only. Shipped work is in `CHANGELOG.md`. Architecture is in
`DESIGN.md` — read the referenced section before starting a step. Demos and how
to run them are in `demos/README.md`.

**Each numbered step is one agent session:** read the named files + the DESIGN
section, make the change, add/update the one named test, `npm test` until green,
`graphify update .`, add a dated `CHANGELOG.md` entry, tick the box here, commit
locally. Steps within a phase are ordered. Steps marked ▶ end with a runnable
demo the user can watch.

## Vision

A domain-agnostic smart autofiller. The user enters each piece of data once; the
extension matches it to however a form labels that field, fills everything above
a confidence floor, and shows each result on a red→green spectrum (red = left
blank, green = exact match, gradient between for looser / composed / learned
values). The user reviews and submits — never automatic. Charity forms are the
default preset, not a code path.

## Scoring model (target — DESIGN.md §6)

`confidence = clamp01(S_label × S_prov)`, multiplicative.
`S_label`: 1.0 exact/autocomplete · 0.60–0.89 embedding · ≤0.855 token-overlap ·
×0.7–0.95 context. `S_prov`: 1.0 scalar profile · 0.85 composed/enum ·
0.40–0.90 learned. Bands: `blank` <0.60 ≤ `review` <0.90 ≤ `high`. Green needs
`S_label == 1.0` **and** `S_prov == 1.0`. `blank` writes nothing.

---

## Phase B — Generic concept model (remove the charity coupling)

Build the neutral structure in parallel (B1–B3), swap onto it (B4), then refine.
`charity` preset stays default-enabled the whole time. DESIGN.md §3–§5.

### B1 — FieldConcept schema + registry loader
Files: `concept-registry.js`, `presets/base.js` (new)
Tests: `tests/concept-registry.test.js` (new)
Read: DESIGN.md §3
- [x] `FieldConcept` JSDoc typedef. `concept-registry.js`:
  `load(enabledPresets, customConcepts)` → validated, unioned active registry;
  rejects malformed concepts.
- [x] `presets/base.js`: the concepts every domain shares (`contact.*`,
  `address.*`) as `FieldConcept[]`.

### B2 — Port the charity vocabulary to a preset
Files: `presets/charity.js` (new)
Tests: `tests/presets-charity.test.js` (new — parity with the current registry:
every field present, aliases preserved, `neverAutoFill` → `fillPolicy`)
Read: `field-semantics.js`, DESIGN.md §3.1
- [x] All current fields as `FieldConcept[]` in `presets/charity.js` (+ `extends:
  "base"`). Nothing consumes it yet; the old path is untouched.

### B3 — One canonical normalizer
Files: `label-normalizer.js`, `field-matcher.js`, `fuzzy-field-matcher.js`
Tests: `tests/label-normalizer.test.js` (add cross-call-site parity cases);
adjust `tests/field-matcher.test.js` normalize case
Read: DESIGN.md §3.2, all three files
- [x] Dual-export footer on `label-normalizer.js`. Delete `FieldMatcher.normalize`
  and the inline normalize in `fuzzy-field-matcher.js`; both delegate to it. Run
  every concept alias through it at load. Preserves `/` — verify no alias relies
  on `/`→space first.

### B4 ▶ — Swap the matcher onto the registry
Files: `field-matcher.js`, `fuzzy-field-matcher.js`; delete `field-semantics.js`,
`profile-data-structure.js`
Tests: update every test importing `field-semantics` / `FieldRegistry`
Read: DESIGN.md §4, `concept-registry.js`, `presets/charity.js`
- [x] Matcher consumes `concept-registry.load(['charity'])` instead of
  `FieldRegistry`. `autocompleteFieldMap` → `concept.autocompleteTokens`. Delete
  `isNeverAutoFillRule`. `fillPolicy` / `sensitive` gates from the concept.
- [x] **Demo:** re-run the Phase A `demos/spectrum-demo.html` scan — behavior is
  byte-for-byte the same as end of Phase A. This step is a regression checkpoint,
  not a feature.

### B5 — Generic value composition
Files: `value-compose.js` (new), `field-matcher.js`
Tests: `tests/value-compose.test.js` (new); update the address tests in
`tests/field-matcher.test.js`
Read: DESIGN.md §5.2
- [ ] `value-compose.js`: named joiners `addressLine`, `fullName`, `join`.
  `field-matcher` uses `concept.compose` instead of `combineAddress`. `getReason`
  → generic templates keyed by `strategy` + `valueType`.

### B6 ▶ — Generic context signal
Files: `popup.js` (scan fn), `label-normalizer.js`, `fuzzy-field-matcher.js`,
`demos/sections-demo.html` (new)
Tests: update context cases in `tests/label-normalizer.test.js`,
`tests/fuzzy-field-matcher.test.js`
Read: DESIGN.md §3.2
- [ ] `scanPageFields` captures the nearest preceding `<h1..6>` / `<legend>`
  text per field. Matcher token-matches it against `concept.groupHints` for the
  context multiplier; absent heading ⇒ neutral. Delete `detectContext`'s keyword
  table and `ContextSeparators`.
- [ ] Build `demos/sections-demo.html`: the label "Name" appears under an
  "Organization" heading and again under a "Primary contact" heading; likewise
  "Email".
- [ ] **Demo:** scan `demos/sections-demo.html`. Expect: the org-section "Name"
  fills with the organization name, the contact-section "Name" fills with the
  contact name — heading text alone disambiguated them, no charity code involved.

### B7 ▶ — Generic profile store + generated profile UI
Files: `popup.js`, `popup.html`, `popup.css`
Tests: `tests/profile-store.test.js` (new — form ⇄ `{conceptId:{value}}`, and
migration of a legacy `organizationProfile` object)
Read: DESIGN.md §3.3, `popup.js`
- [ ] Profile persisted as `{conceptId: {value, updatedAt}}`. `loadProfile` /
  `saveProfile` / `getProfileFromForm` / `populateProfileForm` rewritten against
  it; migrate an existing saved `organizationProfile` to concept ids on load.
- [ ] `popup.html`: replace the fixed field list with a container; `popup.js`
  generates inputs from the active presets, grouped by id-namespace prefix.
  Composite concepts render as their parts.
- [ ] **Demo:** open the popup — the profile form is auto-generated and grouped.
  Edit a value, Save, reopen: it persists. Scan `demos/spectrum-demo.html`:
  still fills correctly from the generated store.

### B8 — Neutral naming + version alignment
Files: repo-wide rename; `manifest.json`, `package.json`, `CHANGELOG.md`
Tests: mechanical updates only
Read: DESIGN.md §10
- [ ] `CharityFieldSemantics` → `AutofillRegistry`, `CharityLocationData` →
  `LocationData`, `CharityLabelNormalizer` → `LabelNormalizer`,
  `dataset.charityAutofillerConfidence` → `dataset.autofillConfidence`. Rename
  `fuzzy-field-matcher.js` → `label-matcher.js`. Manifest name → "Smart Form
  Autofiller". One version string across `manifest.json` / `package.json` /
  `CHANGELOG.md`.

### B9 ▶ — Personal preset proves generalization
Files: `presets/personal.js`, `demos/personal-demo.html` (new); `popup.js` /
`popup.html` preset toggle
Tests: `tests/presets-personal.test.js` (new); `tests/generic-guard.test.js`
(new — no domain literal in `field-matcher.js` / `label-matcher.js`); a matcher
test running the personal fixture fields against `['personal']` only
Read: DESIGN.md §3.2, §10
- [ ] `presets/personal.js` (`person.full_name`, `person.email`, `person.phone`,
  `person.address.*`, `person.dob`, …). Popup lets the user enable presets.
- [ ] Build `demos/personal-demo.html`: an account-signup form (name, email,
  phone, DOB, address, **password**).
- [ ] **Demo:** in the popup enable **only** `personal`, fill the personal
  profile, scan `demos/personal-demo.html`: name/email/phone/DOB/address fill on
  a form that shares no vocabulary with charity; the password field stays dashed
  red. Re-enable `charity`, scan `demos/spectrum-demo.html`: still works. Same
  code, two domains.

**Phase B acceptance:** `field-matcher.js` / `label-matcher.js` hold zero domain
strings; `['personal']`-only fills the personal demo; the charity demo is
unchanged from Phase A.

---

## Phase C — Local embedding label matching

### C1 — esbuild + service-worker skeleton
Files: `package.json` (`build` script), `esbuild.config.mjs`, `sw.js` (new),
`manifest.json` (`background`), `.github/workflows/ci.yml` (build before test)
Tests: none (infra); `npm run build` must emit `sw.bundle.js`, extension loads
Read: DESIGN.md §9
- [ ] esbuild bundles **only** the SW entry. Pure modules stay plain files.

### C2 ▶ — Embedder module (local model, not in the matcher path yet)
Files: `embedder.js` (SW-side), `sw.js`, `models/**` (Git LFS), `package.json`
(transformers.js), `popup.js` (dev "warm model" button)
Tests: `tests/embedder.test.js` gated behind `RUN_MODEL_TESTS=1` (skipped in CI)
Read: DESIGN.md §9, the `claude-api` skill is not needed (local model)
- [ ] Quantized `all-MiniLM-L6-v2` (int8 ONNX + SIMD WASM) under `models/`.
  transformers.js local-only (`allowRemoteModels=false`, `numThreads=1`). `model/
  warm` message; pre-warm on install.
- [ ] **Demo:** click the dev "warm model" button in the popup → it reports load
  time and the cosine of two hand-typed phrases. Proves fully-local inference in
  the extension.

### C3 — Build-time alias vectors
Files: `scripts/embed-registry.js`, `registry-embeddings.json`, `package.json`
(`embed:registry`)
Tests: `tests/registry-embeddings.test.js` (new — every active alias has a
vector, `modelId` matches, dim 384)
Read: DESIGN.md §4
- [ ] Normalize then embed every active-preset alias; emit per-alias int8
  vectors (~60 KB).

### C4 ▶ — Embedding tier in the cascade + fallback
Files: `label-matcher.js`, `field-matcher.js`, `demos/synonyms-demo.html` (new)
Tests: `tests/embedding-label-matcher.test.js` (stubbed embedder — mapping
monotonic + bounded [0.60,0.89], gates still reject, degraded path delegates)
Read: DESIGN.md §4, §6
- [ ] `EmbeddingLabelMatcher.match`: embed the one novel label, cosine vs
  precomputed vectors, reuse type/context/tie-break gates, map cosine →
  `S_label`. `signals.labelMatch.cosine`. Model absent ⇒ `degraded:true`, token
  path, popup notice; a scan never blocks on load.
- [ ] Build `demos/synonyms-demo.html`: labels with no exact alias — "Federal
  Tax Identification Number", "Legal entity name", "E-mail address", "Mobile
  number", "Web site".
- [ ] **Demo:** scan `demos/synonyms-demo.html` with the model warm — the
  synonym labels match and fill (yellow-green). Toggle the model off in
  settings, rescan — they drop to red / weak token matches. The semantic tier is
  the visible difference.

### C5 — Drop Fuse.js
Files: `label-matcher.js`, `package.json`, `FUZZY-LIBRARY-EVALUATION.md`
Tests: existing suites stay green
Read: `FUZZY-LIBRARY-EVALUATION.md`
- [ ] Once fixture recall ≥ token-overlap, remove `fuse.js`; keep
  `_tokenOverlap` as fallback. Rewrite the evaluation doc to current state only.
- [ ] **Demo:** re-run every `demos/*.html` scan — no regression.

**Risk:** package size / Store review, SW cold-start, low-end WASM perf —
mitigated by int8 + single-thread SIMD + build-time precompute + non-blocking
fallback. If package size is rejected: ship a curated ~200-entry synonym map as
data instead of the model.

---

## Phase D — Capture how the user fills forms

### D1 ▶ — Content script + messaging skeleton
Files: `manifest.json` (`optional_host_permissions`, `alarms`, CSP), `content.js`
(new), `sw.js`, `popup.js`
Tests: `tests/message-router.test.js` (new — SW `onMessage` router with a
hand-rolled `chrome` shim)
Read: DESIGN.md §7.1
- [ ] Per-origin programmatic injection gated on a user allowlist (from
  `activeTab`). Port content↔SW round-trip.
- [ ] **Demo:** allowlist the demo origin; open `demos/personal-demo.html`; the
  popup shows "capture active on this origin" and the SW logs a round-trip.

### D2 — Field-commit capture + denylist
Files: `content.js`, `capture-denylist.js` (new)
Tests: `tests/capture-denylist.test.js` (new — password/cc/ssn label+attr tables)
Read: DESIGN.md §7.1
- [ ] `blur` (changed value) + `submit` (capture phase, no `preventDefault`) +
  `beforeunload` flush → `capture/field-committed`. Denylist filter applied
  before send.

### D3 — Learning store + SW writer
Files: `learning-store.js` (new), `sw.js`
Tests: `tests/learning-store.test.js` (new — pure `applyCapture` /
`applyFeedback` reducers, key-derivation determinism)
Read: DESIGN.md §7.2
- [ ] Schema per §7.2 (salted-hash key, no origin in key). SW is the sole
  `storage.local` writer (write queue). `learn/query|dump|clear|export`.

### D4 ▶ — Privacy panel + retention sweep
Files: `popup.js`, `popup.html`, `popup.css`, `sw.js` (alarms), `PRIVACY.md`
(new)
Tests: reducer coverage for the retention sweep in `tests/learning-store.test.js`
Read: DESIGN.md §7.4
- [ ] First-run opt-in prompt. "Learning data" panel: list / per-entry delete /
  export JSON / clear all / global off. `alarms` sweep drops old low-count
  entries.
- [ ] **Demo:** opt in; hand-fill `demos/personal-demo.html` twice; open the
  panel — one entry, count 2, labels only (no password). Export JSON, delete the
  entry, clear all.

---

## Phase E — Learning integration, custom fields, diagnostics

### E1 ▶ — learnedEntries in the cascade
Files: `field-matcher.js`, `popup.js`
Tests: `tests/learning-integration.test.js` (new)
Read: DESIGN.md §7.3
- [ ] `new FieldMatcher(profileStore, activeRegistry, learnedEntries)`; popup
  fetches via `learn/query` first. Order: registry match → learned match → merge
  (profile wins; disagreement → profile value `×0.85`, learned alt in
  `signals.rejected`; hash-only learned ⇒ review flag, no autofill).
- [ ] Build `demos/application-demo.html`: a grant/job application with standard
  fields plus non-vocabulary labels ("Grant program name", "Reference contact").
- [ ] **Demo:** hand-fill "Grant program name" on `demos/application-demo.html`
  twice across scans; third scan suggests it (yellow), sourced from history.

### E2 — Provenance strength function
Files: `provenance-strength.js` (new), `field-matcher.js`
Tests: `tests/provenance-strength.test.js` (new — `R` monotonic in count &
acceptRate, decays with age, bounded [0.40,0.90])
Read: DESIGN.md §6
- [ ] `R(count, ageDays, acceptRate)` wired into `S_prov` for learned values.
  Learned-only never reaches `high`.

### E3 — Conflict UX
Files: `popup.js`, `field-matcher.js`
Tests: extend `tests/learning-integration.test.js`
Read: DESIGN.md §7.3
- [ ] Never auto-switch. Repeated override of a profile-backed suggestion →
  popup nudge "update your profile?". Competing learned values within 15% → cap
  at `review`, list both.

### E4 ▶ — Custom concept promotion
Files: `custom-concepts.js` (new), `concept-registry.js`, `popup.js`
Tests: `tests/custom-concept-promotion.test.js`,
`tests/custom-concept-schema.test.js` (new)
Read: DESIGN.md §8
- [ ] `observed → candidate → active` state machine (candidate at count ≥3 +
  dominant value + safe control; active on confirm or count ≥8 & acceptRate
  ≥0.8). Capped at `review` until ≥2 aliases + one control type + no recent
  rejections. Schema-validated `customConceptStore` merged into the active
  registry as ordinary `FieldConcept`s. Generic labels ("Name", "Date") never
  promoted.
- [ ] **Demo:** hand-fill "Reference contact" on `demos/application-demo.html`
  across ~8 scans with the same value; it promotes to a saved concept, appears
  in the generated profile UI, and thereafter autofills (yellow-capped until it
  has aliases).

### E5 ▶ — Diagnostics surface
Files: `popup.js`, `popup.html`, `popup.css`
Tests: none new (`signals` already populated); manual
Read: DESIGN.md §6
- [ ] Each result row expands to show `signals`: candidate scores, matched
  signal, rejected candidates, and why it was filled / sent to review / left
  blank.
- [ ] **Demo:** scan any `demos/*.html`, expand a yellow row — the score
  breakdown and the runner-up concepts are visible.

---

## Phase F — Optional LLM assist (opt-in)

### F1 ▶ — Provider seam + settings
Files: `llm-assist.js` (new, SW-side), `sw.js`, `popup.js`, `popup.html`
Tests: `tests/llm-assist.test.js` (new — stubbed provider; off by default;
output feeds the confidence model as a low-ceiling provenance)
Read: the `claude-api` skill (model ids, Messages API, key handling)
- [ ] Off by default. User supplies an API key in settings. Only fields no tier
  resolved are sent. Form structure / profile data never leave the machine
  unless enabled. Result enters the cascade as a distinct provenance capped
  below `high`.
- [ ] **Demo:** opt in, add a key, scan `demos/application-demo.html` — the
  open-ended "Why do you want this grant?" textarea gets a proposed draft
  (orange, review); everything else still comes from the local tiers.

---

## Ongoing — matcher hardening

Fold into whichever step touches the area; do not batch.

- [ ] Type-compatibility for `textarea` / `select` concepts (mission statement,
  event description) — verify in B5.
- [ ] Failing-then-passing tests for known misses: `nonprofit` vs `non-profit`,
  EIN / tax-id variants, multiline variants, event name/date/description — add
  in B2 and C4.
- [ ] Re-tune thresholds and ambiguity checks after Phase C, once embedding
  recall is known.
- [ ] Re-run every `demos/*.html` after each phase; confirm no new false
  positives.

## Release gate

- [ ] Unit coverage for normalization, scoring, thresholds, conflicts, controls.
- [ ] One integration test per demo fixture covering scan → suggestion → fill;
  green through every phase.
- [ ] Test deliberately similar wrong labels and missing profile values.
- [ ] Try the Renegade Lemonade request form (`realforms.md`) when safe and
  permitted; record the result.
- [ ] `npm test -- --runInBand --watch=false` green locally and in CI.
- [ ] `graphify update .` after each structural change; dated `CHANGELOG.md`
  entry; box ticked here.

## Other backlog

- [ ] Event / campaign concepts as their own preset.
- [ ] Document attachments (W-9, tax-exempt letter, résumé).
Sign in for multiple computer use, paid tier. Think paid tier would include signing in or out + 
