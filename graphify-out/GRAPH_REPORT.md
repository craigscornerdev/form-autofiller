# Graph Report - Form Autofiller  (2026-08-27)

## Corpus Check
- 21 files · ~15,619 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 165 nodes · 190 edges · 16 communities (11 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c4ce5409`
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

## God Nodes (most connected - your core abstractions)
1. `FieldMatcher` - 15 edges
2. `Changelog` - 13 edges
3. `FuzzyFieldMatcher` - 11 edges
4. `Major Objective: Match Real-World Charity Forms` - 9 edges
5. `scanCurrentPage()` - 8 edges
6. `LabelNormalizer` - 7 edges
7. `Project Conventions` - 6 edges
8. `Fuzzy Library Evaluation` - 5 edges
9. `Charity Form Autofiller` - 5 edges
10. `Charity Form Autofiller — Agile Backlog` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (16 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (22): addFillResults(), addSuggestions(), fieldList, getActiveTab(), getProfileFromForm(), getScanErrorMessage(), loadProfile(), populateProfileForm() (+14 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (13): 0.1.0 — 2026-08-21 — First extension shell, 0.1.1 — 2026-08-21 — Scan the open page, 0.2.0 — 2026-08-21 — Field details, 0.3.0 — 2026-08-21 — Sample charity profile, 0.4.0 — 2026-08-21 — First conservative match, 0.5.0 — 2026-08-21 — High-confidence fill and color review, 0.6.0 — 2026-08-21 — More exact high-confidence matches, 0.6.1 — 2026-08-21 — EIN number-field support (+5 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (17): Candidate comparison, Constraints, Decision, Fuzzy Library Evaluation, Guardrails for 5.2.4, Agile Step 1 — Capture the Form as Test Data, Agile Step 2 — Define Field Semantics and Profile Data, Agile Step 3 — Normalize Labels and Field Context (+9 more)

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
Cohesion: 0.29
Nodes (6): Coding standards, Communication, File ownership, Project Conventions, Tools, Workflow

## Knowledge Gaps
- **69 isolated node(s):** `semanticExports`, `LocationCountries`, `manifest_version`, `name`, `version` (+64 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `FieldMatcher` connect `Community 4` to `Community 13`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `semanticExports`, `LocationCountries`, `manifest_version` to the rest of the system?**
  _69 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09655172413793103 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._