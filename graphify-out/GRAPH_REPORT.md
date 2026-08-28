# Graph Report - Form Autofiller  (2026-08-27)

## Corpus Check
- 28 files · ~21,369 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 237 nodes · 267 edges · 22 communities (17 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fd0de8d3`
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

## God Nodes (most connected - your core abstractions)
1. `FieldMatcher` - 15 edges
2. `Changelog` - 13 edges
3. `Design — Smart Form Autofiller` - 12 edges
4. `Form Autofiller — Backlog` - 12 edges
5. `FuzzyFieldMatcher` - 11 edges
6. `Phase B — Generic concept model (remove the charity coupling)` - 10 edges
7. `scanCurrentPage()` - 8 edges
8. `LabelNormalizer` - 7 edges
9. `Phase C — Local embedding label matching` - 6 edges
10. `Phase E — Learning integration, custom fields, diagnostics` - 6 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (22 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (22): addFillResults(), addSuggestions(), fieldList, getActiveTab(), getProfileFromForm(), getScanErrorMessage(), loadProfile(), populateProfileForm() (+14 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (13): 0.1.0 — 2026-08-21 — First extension shell, 0.1.1 — 2026-08-21 — Scan the open page, 0.2.0 — 2026-08-21 — Field details, 0.3.0 — 2026-08-21 — Sample charity profile, 0.4.0 — 2026-08-21 — First conservative match, 0.5.0 — 2026-08-21 — High-confidence fill and color review, 0.6.0 — 2026-08-21 — More exact high-confidence matches, 0.6.1 — 2026-08-21 — EIN number-field support (+5 more)

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
Cohesion: 0.20
Nodes (8): ContextSeparators, FieldRegistry, FieldSemantics, NeverAutoFillFields, semanticExports, ValidationRules, FieldMatcher, {
  FieldSemantics,
  FieldRegistry,
  ContextSeparators,
  NeverAutoFillFields,
  ValidationRules
}

### Community 13 - "Community 13"
Cohesion: 0.22
Nodes (7): LocationCountries, LocationData, FieldMatcher, fs, { LocationData }, path, vm

### Community 14 - "Community 14"
Cohesion: 0.33
Nodes (5): Coding standards, Per-step workflow, Project Conventions, Tools, Where things live

### Community 16 - "Community 16"
Cohesion: 0.07
Nodes (29): A1 — Gradient + fill-policy helpers, A2 — Numeric score through the matcher, A3 ▶ — Render the spectrum, C1 — esbuild + service-worker skeleton, C2 ▶ — Embedder module (local model, not in the matcher path yet), C3 — Build-time alias vectors, C4 ▶ — Embedding tier in the cascade + fallback, C5 — Drop Fuse.js (+21 more)

### Community 17 - "Community 17"
Cohesion: 0.09
Nodes (22): 10. Conventions for future agents, 11. Roadmap, 1. Product vision, 2. Architecture at a glance, 3.1 FieldConcept, 3.2 Presets, 3.3 Profile store, 3.4 Location data (+14 more)

### Community 18 - "Community 18"
Cohesion: 0.20
Nodes (10): B1 — FieldConcept schema + registry loader, B2 — Port the charity vocabulary to a preset, B3 — One canonical normalizer, B4 ▶ — Swap the matcher onto the registry, B5 — Generic value composition, B6 ▶ — Generic context signal, B7 ▶ — Generic profile store + generated profile UI, B8 — Neutral naming + version alignment (+2 more)

### Community 19 - "Community 19"
Cohesion: 0.29
Nodes (6): Demo files, Demos, Live forms, One-time setup, Running a demo, What to watch, per phase

### Community 20 - "Community 20"
Cohesion: 0.40
Nodes (8): bandFor(), clamp01(), colorFor(), ConfidenceGradient, DEFAULT_THRESHOLDS, describe(), hueFor(), {
  DEFAULT_THRESHOLDS,
  clamp01,
  bandFor,
  hueFor,
  colorFor,
  describe: describeConfidence
}

### Community 21 - "Community 21"
Cohesion: 0.50
Nodes (3): fillDecision(), FillPolicy, { fillDecision }

## Knowledge Gaps
- **117 isolated node(s):** `ConfidenceGradient`, `semanticExports`, `FillPolicy`, `LocationCountries`, `manifest_version` (+112 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Form Autofiller — Backlog` connect `Community 16` to `Community 18`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `FieldMatcher` connect `Community 4` to `Community 13`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `Phase B — Generic concept model (remove the charity coupling)` connect `Community 18` to `Community 16`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `ConfidenceGradient`, `semanticExports`, `FillPolicy` to the rest of the system?**
  _117 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09655172413793103 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `Community 16` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._