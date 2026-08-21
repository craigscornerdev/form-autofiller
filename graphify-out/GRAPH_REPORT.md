# Graph Report - Form Autofiller  (2026-08-21)

## Corpus Check
- 17 files · ~12,877 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 134 nodes · 160 edges · 13 communities (8 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `74502948`
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

## God Nodes (most connected - your core abstractions)
1. `FieldMatcher` - 14 edges
2. `Changelog` - 12 edges
3. `FuzzyFieldMatcher` - 10 edges
4. `Major Objective: Match Real-World Charity Forms` - 9 edges
5. `LabelNormalizer` - 7 edges
6. `scanCurrentPage()` - 7 edges
7. `Charity Form Autofiller` - 5 edges
8. `Charity Form Autofiller — Agile Backlog` - 4 edges
9. `FieldSemantics` - 3 edges
10. `FieldRegistry` - 3 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (13 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (19): addFillResults(), addSuggestions(), fieldList, getActiveTab(), getProfileFromForm(), loadProfile(), populateProfileForm(), profileForm (+11 more)

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (12): 0.1.0 — 2026-08-21 — First extension shell, 0.1.1 — 2026-08-21 — Scan the open page, 0.2.0 — 2026-08-21 — Field details, 0.3.0 — 2026-08-21 — Sample charity profile, 0.4.0 — 2026-08-21 — First conservative match, 0.5.0 — 2026-08-21 — High-confidence fill and color review, 0.6.0 — 2026-08-21 — More exact high-confidence matches, 0.6.1 — 2026-08-21 — EIN number-field support (+4 more)

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (12): Agile Step 1 — Capture the Form as Test Data, Agile Step 2 — Define Field Semantics and Profile Data, Agile Step 3 — Normalize Labels and Field Context, Agile Step 4 — Add Conservative Fuzzy Matching, Agile Step 5.1 — Improve Fuzzy Matching for Real-World Labels, Agile Step 5.2 — Generalize Matching and Support Custom Fields, Agile Step 5 — Match Values to Controls Safely, Agile Step 6 — Verify, Tune, and Release (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.22
Nodes (8): action, default_popup, default_title, description, manifest_version, name, permissions, version

### Community 5 - "Community 5"
Cohesion: 0.25
Nodes (7): devDependencies, jest, name, private, scripts, test, version

### Community 6 - "Community 6"
Cohesion: 0.33
Nodes (5): Charity Form Autofiller, Current scope, Development, GitHub workflow, Load the extension in Chrome

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (11): { FieldRegistry }, ContextSeparators, FieldRegistry, FieldSemantics, NeverAutoFillFields, ValidationRules, { FieldSemantics }, FieldMatcher (+3 more)

## Knowledge Gaps
- **53 isolated node(s):** `{ FieldRegistry }`, `{ FieldSemantics }`, `manifest_version`, `name`, `version` (+48 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `FieldMatcher` connect `Community 4` to `Community 7`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `FuzzyFieldMatcher` connect `Community 8` to `Community 7`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `{ FieldRegistry }`, `{ FieldSemantics }`, `manifest_version` to the rest of the system?**
  _53 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11333333333333333 - nodes in this community are weakly interconnected._
- **Should `Community 7` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._