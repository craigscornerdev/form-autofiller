# Form Autofiller — Backlog

Future work only. Shipped work is in `CHANGELOG.md`. Architecture is in
`DESIGN.md` — read the referenced section before starting a step. Demos and how
to run them are in `demos/README.md`.

**Each step is one agent session:** read the named files + the DESIGN section,
make the change, add/update the one named test, `npm test` until green,
`graphify update .`, add a dated `CHANGELOG.md` entry, tick the box here, commit
locally. Steps within a phase are ordered. Steps marked ▶ end with a runnable
demo the user can watch.

Steps are sized to fit one session with room for troubleshooting: a step either
adds a module or wires one in, never both. Where that split was needed the step
carries a letter (`B7a` / `B7b`) so references by number still resolve.

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

The matcher already runs on the concept registry. What remains is moving value
composition, the context signal, the profile store, and naming onto it, then
proving the pipeline generalizes with a second preset. `charity` stays
default-enabled throughout. DESIGN.md §3–§5.

### B4a ▶ — Field debug readout + quieter highlight
Files: `confidence-gradient.js`, `popup.js` (`paintField`)
Tests: `tests/confidence-gradient.test.js` (update the `colorFor` cases; add
`debugLabel` cases)
Read: DESIGN.md §6
- [ ] `confidence-gradient.js`: `DEBUG_COLOR` (fixed purple) and
  `debugLabel(confidence, thresholds)` → `"0.81 · review · hue 63"`. `colorFor`
  returns a translucent `background` and `debug: { color, label }`, so the
  injected function still does no maths.
- [ ] `paintField` tints the field's own border (`border-color` +
  `border-style`, width untouched; `1px` outline at offset `0` when the computed
  border width is `0`) and paints the purple readout under the field's right
  edge — absolutely positioned in document coordinates so nothing reflows, one
  per field, reused across scans via `field.dataset.autofillDebugId`.
- [ ] **Demo:** re-scan `demos/spectrum-demo.html`. Every painted field carries
  a purple `0.xx · band · hue N` at its lower right; borders are hairline-tinted
  in band color; the `.note` helper lines stay readable underneath.

### B5a — Composite joiners
Files: `value-compose.js` (new)
Tests: `tests/value-compose.test.js` (new)
Read: DESIGN.md §5.2
- [ ] `value-compose.js`: named joiners `addressLine`, `fullName`, `join:<sep>`,
  applied to a `{conceptId: value}` part map. Empty and missing parts drop out
  without leaving stray separators. Dual export; nothing consumes it yet.

### B5b — Matcher resolves composites from the concept
Files: `field-matcher.js`, `popup.html` (script order)
Tests: update the address cases in `tests/field-matcher.test.js` and the
composed-provenance case in `tests/confidence-model.test.js`
Read: DESIGN.md §5.2, `value-compose.js`
- [ ] `resolveValue` composes through `concept.compose` + `value-compose`;
  `combineAddress` is gone. `getReason` → generic templates keyed by
  `strategy` + `valueType`. Composed values keep `S_prov` `0.85`.

### B6a — Scan captures the section heading
Files: `popup.js` (`scanPageFields`), `field-matcher.js`
Tests: `tests/field-matcher.test.js` (descriptor passthrough)
Read: DESIGN.md §3.2
- [ ] `describeField` adds `groupLabel`: the nearest preceding `<h1..6>` /
  `<legend>` text, found by a generic DOM walk; empty when there is none.
  `field-matcher` threads it into the fuzzy tier's field context. Nothing scores
  on it yet — this step is a no-op on every band.

### B6b ▶ — Heading drives the context multiplier
Files: `fuzzy-field-matcher.js`, `label-normalizer.js`,
`demos/sections-demo.html` (new)
Tests: update context cases in `tests/fuzzy-field-matcher.test.js` and
`tests/label-normalizer.test.js`
Read: DESIGN.md §3.2, §4
- [ ] The fuzzy tier token-matches `groupLabel` against `concept.groupHints` for
  the context multiplier (match `×0.9`, absent heading `×0.95`, mismatch `×0.7`).
  `detectContext` and its keyword table are deleted from `label-normalizer.js`.
- [ ] Build `demos/sections-demo.html`: the label "Name" appears under an
  "Organization" heading and again under a "Primary contact" heading; likewise
  "Email".
- [ ] **Demo:** scan `demos/sections-demo.html`. Expect: the org-section "Name"
  fills with the organization name, the contact-section "Name" fills with the
  contact name — heading text alone disambiguated them, no charity code involved.

### B7a — Profile store keyed by concept id
Files: `popup.js`, `presets/charity.js` (`profileBindings` → migration map only)
Tests: `tests/profile-store.test.js` (new — form ⇄ `{conceptId:{value}}`, and
migration of a saved `organizationProfile` object)
Read: DESIGN.md §3.3
- [ ] Profile persisted as `{conceptId: {value, updatedAt}}`. `loadProfile` /
  `saveProfile` / `getProfileFromForm` / `populateProfileForm` rewritten against
  it; a saved `organizationProfile` migrates to concept ids on load. The popup's
  fixed field list still renders — only what it reads and writes changes.

### B7b ▶ — Generated profile UI
Files: `popup.html`, `popup.js`, `popup.css`
Tests: extend `tests/profile-store.test.js` (generated field set matches the
active registry)
Read: DESIGN.md §3.3, `concept-registry.js`
- [ ] `popup.html`: the fixed field list becomes a container; `popup.js`
  generates inputs from the active presets, grouped by id-namespace prefix.
  Composite concepts render as their parts.
- [ ] **Demo:** open the popup — the profile form is auto-generated and grouped.
  Edit a value, Save, reopen: it persists. Scan `demos/spectrum-demo.html`:
  still fills correctly from the generated store.

### B8a — Neutral global names
Files: `location-data.js`, `label-normalizer.js`, `popup.js`, `popup.html`,
`field-matcher.js`, `fuzzy-field-matcher.js`, tests
Tests: mechanical updates only
Read: DESIGN.md §10
- [ ] `CharityLocationData` → `LocationData`, `CharityLabelNormalizer` →
  `LabelNormalizer`, `dataset.charityAutofillerConfidence` →
  `dataset.autofillConfidence`. Grep-driven; no behavior change.

### B8b — Matcher filename + one version string
Files: `fuzzy-field-matcher.js` → `label-matcher.js`, `popup.html`,
`field-matcher.js`, `manifest.json`, `package.json`, `CHANGELOG.md`
Tests: `tests/fuzzy-field-matcher.test.js` → `tests/label-matcher.test.js`
Read: DESIGN.md §9, §10
- [ ] Rename the file and the class (`FuzzyFieldMatcher` → `LabelMatcher`),
  including the `popup.html` script tag and the test's browser-context loader.
  Manifest name → "Smart Form Autofiller". One version string across
  `manifest.json` / `package.json` / `CHANGELOG.md`.

### B9a — Personal preset + the generic guard
Files: `presets/personal.js` (new)
Tests: `tests/presets-personal.test.js` (new); `tests/generic-guard.test.js`
(new — no domain literal in `field-matcher.js` / `label-matcher.js`); a matcher
test running personal-form labels against `['personal']` only
Read: DESIGN.md §3.2, §10
- [ ] `presets/personal.js` (`person.full_name`, `person.email`, `person.phone`,
  `person.address.*`, `person.dob`, …) with `extends: "base"`, and `password` as
  a `sensitive` concept. Nothing enables it yet.

### B9b ▶ — Preset toggle proves generalization
Files: `popup.js`, `popup.html`, `demos/personal-demo.html` (new)
Tests: extend `tests/profile-store.test.js` (enabled presets persist and drive
`concept-registry.load`)
Read: DESIGN.md §3.2
- [ ] The popup lets the user enable presets; the enabled set persists and is
  what the matcher and the generated profile form are built from.
- [ ] Build `demos/personal-demo.html`: an account-signup form (name, email,
  phone, DOB, address, **password**).
- [ ] **Demo:** in the popup enable **only** `personal`, fill the personal
  profile, scan `demos/personal-demo.html`: name/email/phone/DOB/address fill on
  a form that shares no vocabulary with charity; the password field stays dashed
  red. Re-enable `charity`, scan `demos/spectrum-demo.html`: still works. Same
  code, two domains.

**Phase B acceptance:** `field-matcher.js` / `label-matcher.js` hold zero domain
strings; `['personal']`-only fills the personal demo; every field of the charity
demo lands in the band it lands in today.

---

## Phase C — Local embedding label matching

### C1 — esbuild + service-worker skeleton
Files: `package.json` (`build` script), `esbuild.config.mjs`, `sw.js` (new),
`manifest.json` (`background`), `.github/workflows/ci.yml` (build before test)
Tests: none (infra); `npm run build` must emit `sw.bundle.js`, extension loads
Read: DESIGN.md §9
- [ ] esbuild bundles **only** the SW entry. Pure modules stay plain files.

### C2a — Vendor the model
Files: `models/**` (Git LFS), `.gitattributes`, `package.json` (transformers.js)
Tests: none (assets); `npm run build` still emits `sw.bundle.js`
Read: DESIGN.md §9
- [ ] Quantized `all-MiniLM-L6-v2` (int8 ONNX + SIMD WASM) under `models/`,
  tracked by Git LFS. Record the packed extension size — it is the Store-review
  risk this phase carries.

### C2b ▶ — Embedder module (local model, not in the matcher path yet)
Files: `embedder.js` (SW-side), `sw.js`, `popup.js` (dev "warm model" button)
Tests: `tests/embedder.test.js` gated behind `RUN_MODEL_TESTS=1` (skipped in CI)
Read: DESIGN.md §9, the `claude-api` skill is not needed (local model)
- [ ] transformers.js local-only (`allowRemoteModels=false`, `numThreads=1`).
  `model/warm` message; pre-warm on install.
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

### C4a — Embedding scorer
Files: `label-matcher.js`
Tests: `tests/embedding-label-matcher.test.js` (new — stubbed embedder: mapping
monotonic + bounded [0.60,0.89], type/context/tie-break gates still reject)
Read: DESIGN.md §4, §6
- [ ] `EmbeddingLabelMatcher.match`: embed the one novel label, cosine vs the
  precomputed vectors, reuse the existing gates, map cosine → `S_label`. The
  embedder is injected, so the test never loads a model.

### C4b ▶ — Embedding tier in the cascade + fallback
Files: `field-matcher.js`, `popup.js`, `demos/synonyms-demo.html` (new)
Tests: extend `tests/embedding-label-matcher.test.js` (degraded path delegates
to the token tier)
Read: DESIGN.md §4, §6
- [ ] The tier runs between exact-alias and token-overlap;
  `signals.labelMatch.cosine` is populated. Model absent ⇒ `degraded:true`,
  token path, popup notice; a scan never blocks on model load.
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

### D1a — Injection + per-origin allowlist
Files: `manifest.json` (`optional_host_permissions`, `alarms`, CSP), `content.js`
(new), `popup.js`
Tests: none (permissions plumbing); the extension loads and injects on an
allowlisted origin only
Read: DESIGN.md §7.1
- [ ] Per-origin programmatic injection gated on a user allowlist granted from
  `activeTab`. `content.js` is a stub that announces itself and nothing more.

### D1b ▶ — SW message router
Files: `sw.js`, `content.js`, `popup.js`
Tests: `tests/message-router.test.js` (new — SW `onMessage` router with a
hand-rolled `chrome` shim)
Read: DESIGN.md §7.1
- [ ] Port content↔SW round-trip; unknown message types are rejected, not
  ignored.
- [ ] **Demo:** allowlist the demo origin; open `demos/personal-demo.html`; the
  popup shows "capture active on this origin" and the SW logs a round-trip.

### D2a — Capture denylist
Files: `capture-denylist.js` (new)
Tests: `tests/capture-denylist.test.js` (new — password/cc/ssn label+attr tables)
Read: DESIGN.md §7.1
- [ ] Pure predicate over a field descriptor: `type=password`, `autocomplete` ∈
  `{cc-*, one-time-code, current-password, new-password}`, `sensitive` concepts,
  and the label / name / id pattern. Dual export; nothing consumes it yet.

### D2b — Field-commit capture
Files: `content.js`
Tests: extend `tests/capture-denylist.test.js` (the event payload builder is
pure and denylist-filtered)
Read: DESIGN.md §7.1
- [ ] `blur` (changed value) + `submit` (capture phase, no `preventDefault`) +
  `beforeunload` flush → `capture/field-committed`. Denylist filter applied
  before send.

### D3a — Learning store reducers
Files: `learning-store.js` (new)
Tests: `tests/learning-store.test.js` (new — pure `applyCapture` /
`applyFeedback` reducers, key-derivation determinism)
Read: DESIGN.md §7.2
- [ ] Schema per §7.2 (salted-hash key, no origin in key), as pure functions
  over a plain store object. No `chrome` API use.

### D3b — SW is the sole writer
Files: `sw.js`
Tests: extend `tests/message-router.test.js` (serialized writes, one in flight)
Read: DESIGN.md §7.2
- [ ] The SW owns every `storage.local` write behind a queue and answers
  `learn/query|dump|clear|export`.

### D4a ▶ — Opt-in + privacy panel
Files: `popup.js`, `popup.html`, `popup.css`
Tests: none new (reducers already covered); manual
Read: DESIGN.md §7.4
- [ ] First-run opt-in prompt. "Learning data" panel: list / per-entry delete /
  export JSON / clear all / global off.
- [ ] **Demo:** opt in; hand-fill `demos/personal-demo.html` twice; open the
  panel — one entry, count 2, labels only (no password). Export JSON, delete the
  entry, clear all.

### D4b — Retention sweep + PRIVACY.md
Files: `sw.js` (alarms), `learning-store.js`, `PRIVACY.md` (new)
Tests: retention-sweep reducer coverage in `tests/learning-store.test.js`
Read: DESIGN.md §7.4
- [ ] `alarms` sweep drops entries older than `retentionDays` with `count < 2`.
  `PRIVACY.md` documents exactly what is stored and what never is.

---

## Phase E — Learning integration, custom fields, diagnostics

### E1a — learnedEntries in the cascade
Files: `field-matcher.js`
Tests: `tests/learning-integration.test.js` (new)
Read: DESIGN.md §7.3
- [ ] `new FieldMatcher(profileStore, activeRegistry, learnedEntries)`. Order:
  registry match → learned match → merge (profile wins; disagreement → profile
  value `×0.85`, learned alt in `signals.rejected`; hash-only learned ⇒ review
  flag, no autofill). Plain-object fixtures — the matcher stays synchronous.

### E1b ▶ — Popup feeds the matcher from history
Files: `popup.js`, `demos/application-demo.html` (new)
Tests: extend `tests/learning-integration.test.js` (no entries ⇒ identical
suggestions to today)
Read: DESIGN.md §7.3
- [ ] The popup fetches `learnedEntries` via `learn/query` before constructing
  the matcher.
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

### E4a — Promotion state machine
Files: `custom-concepts.js` (new)
Tests: `tests/custom-concept-promotion.test.js`,
`tests/custom-concept-schema.test.js` (new)
Read: DESIGN.md §8
- [ ] `observed → candidate → active` (candidate at count ≥3 + dominant value +
  safe control; active on confirm or count ≥8 & acceptRate ≥0.8). Generic labels
  ("Name", "Date") never promoted. Schema-validated `customConceptStore` entries
  are ordinary `FieldConcept`s.

### E4b ▶ — Promoted concepts in the registry + popup
Files: `concept-registry.js`, `popup.js`
Tests: extend `tests/custom-concept-promotion.test.js` (a promoted concept
matches like a built-in but caps at `review`)
Read: DESIGN.md §8
- [ ] The active registry merges `customConceptStore`; suggestions from a
  promoted concept cap at `review` until it has ≥2 aliases, one unambiguous
  control type, and no recent rejections. The popup surfaces and confirms
  candidates.
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

### F1a — Provider seam
Files: `llm-assist.js` (new, SW-side), `sw.js`
Tests: `tests/llm-assist.test.js` (new — stubbed provider; off by default; only
unresolved fields are in the request; nothing is sent when disabled)
Read: the `claude-api` skill (model ids, Messages API, key handling)
- [ ] Off by default. The request builder is pure and testable without a key.
  Form structure / profile data never leave the machine unless enabled.

### F1b ▶ — Settings + cascade integration
Files: `popup.js`, `popup.html`, `field-matcher.js`
Tests: extend `tests/llm-assist.test.js` (result enters as a distinct provenance
capped below `high`)
Read: DESIGN.md §6, §11
- [ ] The user opts in and supplies an API key in settings. Only fields no tier
  resolved are sent; the result enters the cascade as a distinct provenance
  capped below `high`.
- [ ] **Demo:** opt in, add a key, scan `demos/application-demo.html` — the
  open-ended "Why do you want this grant?" textarea gets a proposed draft
  (orange, review); everything else still comes from the local tiers.

---

## Ongoing — matcher hardening

Fold into whichever step touches the area; do not batch.

- [ ] Type-compatibility for `textarea` / `select` concepts (mission statement,
  event description) — verify in B5b.
- [ ] Failing-then-passing tests for the remaining known misses: multiline
  variants and event name/date/description — add in C4a.
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
- Cross sync across the users own cloud? Via google drive appDataFolder. Interesting, not sure if we want that but does put everything in googles hands. Just make it the paid tier I guess. Bundle that plus some AI credits they can purchase. Make the first couple free, get them hooked. 
- The niche we want to fill is a smart auto fill that doesn't send all your data to AI unless you really want it to.
- Already filled field logic? what is happening there? 
