# Graph Report - Form Autofiller  (2026-08-21)

## Corpus Check
- 10 files · ~3,276 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 82 nodes · 85 edges · 13 communities (9 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `df4f66ec`
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
1. `Changelog` - 12 edges
2. `Charity Form Autofiller — Prototype Checklist` - 9 edges
3. `scanCurrentPage()` - 7 edges
4. `FieldMatcher` - 5 edges
5. `Charity Form Autofiller` - 5 edges
6. `action` - 3 edges
7. `showScanResult()` - 3 edges
8. `addSuggestions()` - 3 edges
9. `getProfileFromForm()` - 3 edges
10. `scripts` - 2 edges

## Surprising Connections (you probably didn't know these)
- `scanCurrentPage()` --calls--> `addSuggestions()`  [EXTRACTED]
  popup.js → popup.js  _Bridges community 7 → community 8_
- `scanCurrentPage()` --calls--> `showScanResult()`  [EXTRACTED]
  popup.js → popup.js  _Bridges community 7 → community 11_

## Import Cycles
- None detected.

## Communities (13 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.15
Nodes (7): fieldList, profileForm, profileStatus, results, sampleProfile, scanButton, statusMessage

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (12): 0.1.0 — First extension shell, 0.1.1 — Scan the open page, 0.2.0 — Field details, 0.3.0 — Sample charity profile, 0.4.0 — First conservative match, 0.5.0 — High-confidence fill and color review, 0.6.0 — More exact high-confidence matches, 0.6.1 — EIN number-field support (+4 more)

### Community 2 - "Community 2"
Cohesion: 0.20
Nodes (9): Charity Form Autofiller — Prototype Checklist, Goal, Later, Not in the First Prototype, Prototype 1: Extension Shell, Prototype 2: Read a Form, Prototype 3: Store One Charity Profile, Prototype 4: Conservative Matching, Prototype 5: Review and Fill (+1 more)

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
Cohesion: 0.40
Nodes (5): addFillResults(), getActiveTab(), scanCurrentPage(), setScanningState(), showError()

### Community 8 - "Community 8"
Cohesion: 0.67
Nodes (3): addSuggestions(), getProfileFromForm(), saveProfile()

## Knowledge Gaps
- **44 isolated node(s):** `manifest_version`, `name`, `version`, `description`, `default_title` (+39 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `manifest_version`, `name`, `version` to the rest of the system?**
  _44 weakly-connected nodes found - possible documentation gaps or missing edges._