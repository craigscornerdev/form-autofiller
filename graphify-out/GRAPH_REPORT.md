# Graph Report - Form Autofiller  (2026-08-28)

## Corpus Check
- 31 files · ~26,234 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 279 nodes · 323 edges · 23 communities (20 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bf853ee5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]

## God Nodes (most connected - your core abstractions)
1. `Changelog` - 20 edges
2. `FieldMatcher` - 15 edges
3. `Design — Smart Form Autofiller` - 12 edges
4. `Phase B — Generic concept model (remove the charity coupling)` - 12 edges
5. `FuzzyFieldMatcher` - 11 edges
6. `Form Autofiller — Backlog` - 11 edges
7. `Phase D — Capture how the user fills forms` - 9 edges
8. `scanCurrentPage()` - 8 edges
9. `Phase C — Local embedding label matching` - 8 edges
10. `Phase E — Learning integration, custom fields, diagnostics` - 8 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (23 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (24): addFillResults(), addSuggestions(), fieldList, getActiveTab(), getProfileFromForm(), getScanErrorMessage(), loadProfile(), missingGlobals (+16 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (20): 0.10.0 — 2026-08-27 — Gradient + fill-policy helpers, 0.11.0 — 2026-08-27 — Numeric confidence through the matcher, 0.12.0 — 2026-08-27 — Render the confidence spectrum, 0.12.1 — 2026-08-27 — Keep the popup's script wiring honest, 0.13.0 — 2026-08-28 — FieldConcept schema + registry loader, 0.15.0 — 2026-08-28 — One canonical label normalizer, 0.16.0 — 2026-08-28 — Matcher runs on the concept registry, 0.1.0 — 2026-08-21 — First extension shell (+12 more)

### Community 2 - "Community 2"
Cohesion: 0.33
Nodes (5): Candidate comparison, Constraints, Decision, Fuzzy Library Evaluation, Guardrails for 5.2.4

### Community 3 - "Community 3"
Cohesion: 0.20
Nodes (9): action, default_popup, default_title, description, host_permissions, manifest_version, name, permissions (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.20
Nodes (9): dependencies, fuse.js, devDependencies, jest, name, private, scripts, test (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.33
Nodes (5): Charity Form Autofiller, Current scope, Development, GitHub workflow, Load the extension in Chrome

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (12): B4a ▶ — Field debug readout + quieter highlight, B5a — Composite joiners, B5b — Matcher resolves composites from the concept, B6a — Scan captures the section heading, B6b ▶ — Heading drives the context multiplier, B7a — Profile store keyed by concept id, B7b ▶ — Generated profile UI, B8a — Neutral global names (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.26
Nodes (4): LabelNormalizer, FieldMatcher, FuzzyFieldMatcher, LabelNormalizer

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (9): D1a — Injection + per-origin allowlist, D1b ▶ — SW message router, D2a — Capture denylist, D2b — Field-commit capture, D3a — Learning store reducers, D3b — SW is the sole writer, D4a ▶ — Opt-in + privacy panel, D4b — Retention sweep + PRIVACY.md (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.14
Nodes (12): LocationCountries, LocationData, ConfidenceGradient, FieldMatcher, FieldMatcher, fs, loadBrowserContext(), { LocationData } (+4 more)

### Community 14 - "Community 14"
Cohesion: 0.33
Nodes (5): Coding standards, Per-step workflow, Project Conventions, Tools, Where things live

### Community 16 - "Community 16"
Cohesion: 0.08
Nodes (25): C1 — esbuild + service-worker skeleton, C2a — Vendor the model, C2b ▶ — Embedder module (local model, not in the matcher path yet), C3 — Build-time alias vectors, C4a — Embedding scorer, C4b ▶ — Embedding tier in the cascade + fallback, C5 — Drop Fuse.js, E1a — learnedEntries in the cascade (+17 more)

### Community 17 - "Community 17"
Cohesion: 0.09
Nodes (22): 10. Conventions for future agents, 11. Roadmap, 1. Product vision, 2. Architecture at a glance, 3.1 FieldConcept, 3.2 Presets, 3.3 Profile store, 3.4 Location data (+14 more)

### Community 18 - "Community 18"
Cohesion: 0.13
Nodes (17): ConceptRegistry, fail(), FILL_POLICIES, isNonEmptyString(), isStringArray(), load(), normalizePreset(), toExtendsList() (+9 more)

### Community 19 - "Community 19"
Cohesion: 0.29
Nodes (6): Demo files, Demos, Live forms, One-time setup, Running a demo, What to watch, per phase

### Community 20 - "Community 20"
Cohesion: 0.42
Nodes (9): bandFor(), clamp01(), colorFor(), ConfidenceGradient, debugLabel(), DEFAULT_THRESHOLDS, describe(), hueFor() (+1 more)

### Community 21 - "Community 21"
Cohesion: 0.47
Nodes (4): fillDecision(), FillPolicy, gradient(), { fillDecision }

### Community 22 - "Community 22"
Cohesion: 0.29
Nodes (6): charityConcepts, EVENT_HINTS, EVENT_ORGANIZER_HINTS, ORG_ADDRESS_HINTS, ORG_CONTACT_HINTS, ORG_HINTS

## Knowledge Gaps
- **151 isolated node(s):** `VALUE_TYPES`, `FILL_POLICIES`, `ConceptRegistry`, `ConfidenceGradient`, `FillPolicy` (+146 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Form Autofiller — Backlog` connect `Community 16` to `Community 11`, `Community 7`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `FieldMatcher` connect `Community 4` to `Community 13`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `VALUE_TYPES`, `FILL_POLICIES`, `ConceptRegistry` to the rest of the system?**
  _151 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08522727272727272 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Community 13` be split into smaller, more focused modules?**
  _Cohesion score 0.14166666666666666 - nodes in this community are weakly interconnected._
- **Should `Community 16` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._