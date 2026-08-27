# Design — Smart Form Autofiller

Reference for the target architecture. `TODO.md` holds the migration checklist;
`CHANGELOG.md` holds what has shipped. This document describes the current and
intended design only — not its history.

## 1. Product vision

Turn a small, plain-language profile into smart autofill. The user enters each
piece of data once. The extension matches it to however a given form labels that
field, fills every field it can above a confidence floor, and shows each result
on a red→green spectrum:

- **red / dashed** — left blank, no confident match
- **green** — exact match to data the user entered
- **gradient between** — a looser label match, a composed value, or a value
  learned from how the user has filled similar fields before

The user reviews and submits. Nothing is ever clicked or submitted automatically.
Accuracy improves the more the extension is used.

The pipeline is domain-agnostic. Charity/nonprofit forms are the default preset,
not a special case in the code.

## 2. Architecture at a glance

```
scan page ──▶ describe fields ──▶ for each field:
                                    normalize label
                                    match to a FieldConcept   (cascade, §4)
                                    resolve value             (§5)
                                    score confidence          (§6)
                                  ──▶ render spectrum + fill above floor
                                  ──▶ (later) capture what the user commits (§7)
```

No step contains domain-specific branching. Domain knowledge lives entirely in
**presets** (§3) as data.

## 3. Core data model

### 3.1 FieldConcept

A concept is one thing the user might be asked for. Domain-neutral shape:

```js
{
  id: "org.legal_name",              // stable, namespaced string id
  label: "Organization legal name",  // shown in the generated profile UI
  aliases: ["organization name", "legal entity name", "charity name"],
  autocompleteTokens: ["organization"],   // HTML autocomplete tokens that imply this concept
  groupHints: ["organization", "about your org"],  // words likely in a nearby section heading
  valueType: "text",                 // text | email | tel | url | number | date
                                     //  | postal-code | multiline | enum | composite
  controlTypes: ["text"],            // form controls this may fill
  fillPolicy: "auto",                // auto | review | never  (replaces any "never-fill" list)
  sensitive: false,                  // true => never captured by learning, never auto-filled
  enumValues: null,                  // for valueType "enum": [{ value, aliases: [...] }]
  compose: null,                     // for "composite": see §5.2
  examples: []                       // optional, aids embedding / disambiguation
}
```

Custom user-defined fields (§8) use this exact shape and are appended to the
active registry — the pipeline never distinguishes them from built-ins.

### 3.2 Presets

```
presets/
  base.js       concepts every domain shares — contact.*, address.*
  charity.js    nonprofit/org — org.legal_name, org.ein, org.mission, event.*, ...
  personal.js   individual — person.full_name, person.dob, person.address.*, ...
  business.js   company — biz.legal_name, biz.tax_id, ...
```

Each preset exports a `FieldConcept[]` and may declare `extends: "base"`. The
user enables one or more presets; `concept-registry.js` unions the enabled
concepts (plus custom concepts) into the **active registry**. `charity` is
enabled by default, so default behavior matches today's.

Disambiguation between near-identical concepts (e.g. `person.email` vs
`org.contact.email`) comes from three generic mechanisms, no keyword tables:

1. **Namespacing** — different ids, different aliases.
2. **Preset scoping** — only enabled concepts are candidates; the profile only
   holds values for enabled concepts.
3. **Heading proximity** — at scan time capture the nearest preceding
   `<h1..6>` / `<legend>` / `<fieldset>` label (generic DOM walk); token-match
   or embed it against `groupHints` and apply the context multiplier (§6).
   Absent heading ⇒ neutral, no penalty. This also separates "Billing address"
   from "Shipping address" with no extra code.

### 3.3 Profile store

Replaces any fixed field list. Keyed by concept id:

```js
profileStore = {
  "org.legal_name":     { value: "Paws & Whiskers", updatedAt: 1710000000000 },
  "org.address.street": { value: "123 Maple Lane",  updatedAt: 1710000000000 },
  ...
}
```

The profile UI in the popup is **generated** from the active presets' concepts,
grouped by id-namespace prefix. Composite concepts render as their parts.

### 3.4 Location data

`location-data.js` holds ISO 3166 country/subdivision tables. Generic; used to
map free-text region names to option values in `<select>` controls.

## 4. Label → concept matching (the cascade)

Each tier runs only if the previous produced no confident hit. The tier that
answers, and how strongly, sets `S_label` (§6).

| # | Tier | `S_label` | Notes |
|---|------|-----------|-------|
| 1 | `autocomplete` token → concept | `1.0` | via `concept.autocompleteTokens` |
| 2 | exact alias (normalized label ∈ `concept.aliases`) | `1.0` | |
| 3 | embedding cosine vs precomputed alias vectors | `0.60–0.89` | Phase C; novel label embedded at scan time |
| 4 | token-overlap (Jaccard) vs aliases | `≤ 0.855` | fallback / offline; also the pre-embedding default |
| 5 | learned history (§7) — user filled this label before | feeds `S_prov`, not `S_label` | |
| 6 | nothing | — | field left blank (red) |

All tiers pass through the same gates before a match is accepted:

- **type compatibility** — form control type ∈ `concept.controlTypes`
- **context multiplier** — heading vs `groupHints` (§3.2): match `×0.9`,
  unknown `×0.95`, mismatch `×0.7`
- **ambiguity rejection** — if the top two candidates are within `0.05`, return
  no match rather than guess

Owned by `label-matcher.js` (token + embedding scorers, gates, tie-break) and
`field-matcher.js` (cascade orchestration, concept lookup).

## 5. Value resolution

Given a concept and the profile store:

### 5.1 Scalar

Direct lookup `profileStore[concept.id].value`. Missing/empty ⇒ no suggestion.
`enum` concepts map the stored value to an option via `enumValues[].aliases` and
`location-data.js`, scored by token overlap against option text/value.

### 5.2 Composite

`concept.compose` is declarative:

```js
compose: { parts: ["org.address.street", "org.address.city",
                   "org.address.region", "org.address.postal"],
           joiner: "addressLine" }   // addressLine | fullName | "join:, "
```

`value-compose.js` holds the small set of named joiners. Works for any composite
— full name from parts, address lines, etc. — with no per-concept code.

## 6. Confidence model

One number per suggestion:

```
confidence = clamp01(S_label × S_prov)
```

Multiplicative: a weak label match cannot be rescued by strong provenance, or
vice-versa.

**S_label** — from the matching tier (§4): `1.0` exact/autocomplete;
`0.60–0.89` embedding; `≤ 0.855` token-overlap; `× 0.7–0.95` context multiplier.

**S_prov** — value provenance:

| provenance | S_prov |
|---|---|
| direct scalar profile value | `1.0` |
| composed / enum-mapped value | `0.85` |
| learned value (§7) | `R(count, ageDays, acceptRate) ∈ [0.40, 0.90]` |

```
acceptRate = (acceptCount + 1) / (acceptCount + rejectCount + 2)   // Laplace
R = clamp(0.40, 0.90,
      0.35
    + 0.30 * (1 - exp(-(count - 1) / 3))    // saturating repetition
    + 0.15 * exp(-ageDays / 45)             // recency, ~31-day half-life
    + 0.20 * (acceptRate - 0.5) * 2)
```

**Bands** (`DEFAULT_THRESHOLDS = { floor: 0.60, high: 0.90 }`):

| band | range | fill | color |
|---|---|---|---|
| `blank` | `< 0.60` or no match | nothing written | fixed dark red, **dashed** outline |
| `review` | `0.60 – 0.899` | value written, user reviews in place | gradient hue 0→~87 |
| `high` | `≥ 0.90` | value written | gradient hue ~87→120 (green) |

**Invariant:** `high` (green) is reachable only when `S_label == 1.0` **and**
`S_prov == 1.0` — an exact alias/autocomplete hit on a direct scalar profile
value. Embedding (`≤ 0.89`), token-overlap (`≤ 0.855`), composed values
(`× 0.85`), and learned-only values (`≤ 0.90` strict) never turn green.

**Gradient** is computed in exactly one pure helper (`confidence-gradient.js`).
Both surfaces — the popup list and the injected on-page highlight — read colors
from it. The injected function does no math: the popup attaches
`suggestion.display = colorFor(confidence)` before injection.

```js
DEFAULT_THRESHOLDS = { floor: 0.60, high: 0.90 }
clamp01(x)        = Math.min(1, Math.max(0, x))
bandFor(c, t)     = c >= t.high ? 'high' : c >= t.floor ? 'review' : 'blank'
hueFor(c, t)      = c < t.floor ? 0 : 120 * clamp01((c - t.floor) / (1 - t.floor))
describe(c, t)    = c >= t.high ? 'High confidence'
                 : c >= t.floor ? 'Review' : 'Left blank'

colorFor(c, t) => {
  const blank = c < t.floor, h = hueFor(c, t);
  return {
    band:       bandFor(c, t),
    hue:        h,
    dashed:     blank,
    outline:    blank ? 'hsl(0 74% 45%)' : `hsl(${h} 70% 40%)`,
    background: blank ? 'hsl(0 86% 96%)' : `hsl(${h} 80% 94%)`,
    text:       blank ? 'hsl(0 74% 30%)' : `hsl(${h} 70% 25%)`
  };
}
```

All five exports (`DEFAULT_THRESHOLDS`, `clamp01`, `bandFor`, `hueFor`,
`colorFor`, `describe`) take an explicit `thresholds` arg defaulting to
`DEFAULT_THRESHOLDS`, so later phases can pass a tuned floor.

**Suggestion shape** (`conceptId` lands in Phase B4 with the concept registry;
before that the field is absent):

```js
{
  conceptId, source, value,
  confidence,          // number 0..1
  band,                // 'blank' | 'review' | 'high'
  reason,              // generic template keyed by strategy + valueType
  signals: {           // diagnostics
    labelMatch: { strategy, strength, matchedAlias, cosine? , degraded? },
    provenance: { kind, factor, detail },   // detail e.g. 'composed' | 'profile-history-conflict'
    rejected: [ { conceptId, score, reason } ]
  }
}
```

## 7. Learning subsystem

### 7.1 Capture (content script + service worker)

A per-origin content script (injected on a user allowlist, starting from
`activeTab`) observes:

- `blur` on an `input`/`select`/`textarea` whose value changed since focus
- form `submit` (capture phase, never `preventDefault`) and a `beforeunload`
  flush
- the user accepting / editing / rejecting / clearing a suggestion

and posts events to the service worker, which is the **sole writer** to
`chrome.storage.local` (write queue, no races).

**Never captured:** `type=password`; `autocomplete` ∈ `{cc-*, one-time-code,
current-password, new-password}`; any concept with `sensitive: true`; label /
name / id matching `/pass|ssn|social security|card|cvv|cvc|routing|account
number/i`.

### 7.2 Store schema (`chrome.storage.local`, local only, never synced)

```js
learningStore = {
  version: 1,
  entries: {
    "<key>": {   // key = salted sha256(normalizedLabel | controlSignature | groupTag)
                 // no origin in the key => learning generalizes across forms
      normalizedLabel, controlSignature, groupTag,
      mappedConceptId,        // active-registry concept id if the value matches one, else null
      valueMode,              // 'hash' (default) | 'value' (opt-in + non-PII filter)
      value,                  // only if valueMode === 'value'
      valueHash,              // salted hash, always
      distinctValues,         // valueHash -> { count, lastSeenAt }, cap 5 LRU
      count, firstSeenAt, lastSeenAt,
      acceptCount, rejectCount, editCount,
      perOrigin: { "<origin>": { count, lastSeenAt } }   // opt-in; conflict resolution only
    }
  },
  settings: { captureEnabled: false, storeValues: false,
              allowlistedOrigins: [], retentionDays: 180 }
}
```

### 7.3 Integration

`FieldMatcher` stays synchronous and pure: `new FieldMatcher(profileStore,
activeRegistry, learnedEntries)`. The popup fetches `learnedEntries` from the
service worker before constructing it. Resolution order in `getSuggestion`:

1. cascade match vs the **active registry** (§4), value from the profile store
2. match vs `learnedEntries` (same normalize → match → gate pipeline)
3. merge: profile value wins; learned recency/accept-rate may boost or cap
   `confidence`; on disagreement suggest the profile value with
   `confidence × 0.85` and put the learned alternative in `signals.rejected`
4. learned-only, `valueMode: 'hash'` ⇒ no value to supply — show a
   "you usually fill this" review flag, do not autofill

### 7.4 Privacy

100% local. Capture is opt-in (first-run prompt). The popup has a "Learning
data" panel: list entries, per-entry delete, export JSON, clear all, global off
switch. Device-local random salt so exported hashes are not rainbow-tableable.
An `alarms` sweep drops entries older than `retentionDays` with `count < 2`.
Shipped `PRIVACY.md` documents exactly what is stored.

## 8. Custom fields

A repeatedly-filled label with no active-registry match becomes a candidate
concept after `count ≥ 3` sessions with a dominant value
(`topValue.count / total ≥ 0.6`) and a safe control signature. State machine:
`observed → candidate → active` (`active` on user confirmation, or automatically
at `count ≥ 8` and `acceptRate ≥ 0.8`).

Even when `active`, a custom concept's suggestions are capped at `review` (never
green) until it has ≥ 2 aliases, one unambiguous control type, and no recent
rejections. Custom concepts are stored in a schema-validated `customConceptStore`
and merged into the active registry as ordinary `FieldConcept`s.

## 9. Module layout (target)

Runtime, loaded by `popup.html` in order (all plain dual-export — `module.exports`
+ `globalThis` — so Node tests `require()` them directly):

| File | Owns |
|---|---|
| `location-data.js` | ISO country / subdivision tables |
| `label-normalizer.js` | the one canonical string normalizer (case, punctuation, markers; preserves `/`) |
| `concept-registry.js` | load + union enabled presets + custom concepts → active registry |
| `presets/base.js`, `presets/charity.js`, `presets/personal.js`, `presets/business.js` | `FieldConcept[]` per domain |
| `confidence-gradient.js` | pure: `confidence` → `{ band, hue, outline, background, text, dashed }` |
| `fill-policy.js` | pure: suggestion → `fill` \| `skip` |
| `value-compose.js` | named composite joiners (`addressLine`, `fullName`, …) |
| `label-matcher.js` | token-overlap + embedding scorers, type/context gates, tie-break |
| `field-matcher.js` | cascade orchestration, concept lookup, value resolution, confidence, suggestion shape |
| `popup.{html,js,css}` | generated profile form; scan; spectrum render |
| `sw.js` → `sw.bundle.js` | service worker: embedder + learning-store writer (bundled) |

Build (Phase C onward): esbuild bundles **only** the service worker entry.
Everything else stays plain files. `scripts/embed-registry.js` precomputes
`registry-embeddings.json` (per-alias int8 vectors) from the active presets.

Tests: node-env Jest, one file per module, plain-object fixtures, hand-rolled
`chrome` shim (no mocking framework).

`demos/` holds runnable HTML forms — one per phase checkpoint — plus
`demos/README.md` (load + watch instructions). The same files double as the
inputs for the release-gate integration tests.

## 10. Conventions for future agents

- ISO/IEC 25010: reuse before writing; small single-responsibility units;
  unit-testable; handle real edge cases only.
- **No gravestones** — code, docs, and commit messages describe the current
  state only. Do not name removed approaches or values.
- Dual export on every runtime module. Keep pure logic out of the injected
  page function — it only applies precomputed `suggestion.display`.
- Never add a domain string to `field-matcher.js` or `label-matcher.js`. Domain
  knowledge is data in `presets/`.
- Safety invariants are absolute: never overwrite a non-empty field, only fill
  `concept.controlTypes`-compatible controls, never click or submit.
- The per-step workflow loop (graph check → smallest change → test → graph update
  → changelog → TODO tick → local commit) is in `CLAUDE.md`.

## 11. Roadmap

Phases and their acceptance criteria live in `TODO.md`. Summary:

- **A — Confidence spectrum.** Numeric score end to end; shared gradient helper;
  fill every band above the floor. Domain-agnostic already.
- **B — Generic concept model.** `FieldConcept` + presets + `concept-registry.js`;
  rewrite `field-matcher.js` concept-driven (no domain branches); one shared
  normalizer; generated profile UI + profile store; neutral naming; add
  `personal` preset + fixture to prove the pipeline generalizes with zero code
  change. `charity` stays default-enabled.
- **C — Local embeddings.** esbuild for the SW; build-time alias-vector
  precompute; quantized MiniLM in the SW, local-only inference; cosine →
  `S_label`; token-overlap fallback; drop `fuse.js` once recall is confirmed.
- **D — Capture.** Content script + service worker + learning store + privacy
  panel.
- **E — Learning integration.** Merge learned entries into the cascade; provenance
  strength function; conflict UX; custom concepts; diagnostics surface.
- **F — Optional LLM assist.** Opt-in, user-supplied key, for open-ended
  questions only; feeds the confidence model as a distinct low-ceiling
  provenance.
