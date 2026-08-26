# Fuzzy Library Evaluation

Step 5.2.3 was evaluated against the current matcher on 2026-08-26.

## Constraints

- The extension has no bundler and loads plain JavaScript from a Manifest V3 package.
- Fuzzy retrieval must remain separate from normalization, aliases, context, control-type compatibility, confidence thresholds, and ambiguity rejection.
- The dependency should add only a small amount of shipped JavaScript.

The current matcher has no runtime dependency. `fuzzy-field-matcher.js` is 10,188 bytes and uses token Jaccard overlap after the field registry, type checks, and context checks have been applied.

## Candidate comparison

Sizes below come from the published npm package on the evaluation date. Minified size is the closest useful browser payload where the package publishes one.

| Library | Version | License | Published size | Browser/module notes | Retrieval smoke test |
| --- | --- | --- | ---: | --- | --- |
| Fuse.js | 7.5.0 | Apache-2.0 | 26.1 KB minified CJS/MJS | Explicit CJS and ESM builds; no runtime dependencies | Retrieved `org name` -> `organization name`, `website url` -> `website` |
| fast-fuzzy | 1.12.0 | ISC | 15.1 KB MJS source | CJS and MJS entries; no browser field; no published minified build | Retrieved `org name` -> `organization name`, `website url` -> `website` |
| fuzzysort | 4.0.2 | MIT | 17.6 KB minified browser script | Plain browser script; no runtime dependencies | Retrieved `org name`, but returned no result for `website url` with default settings |

The package tarball sizes were 113.2 KB for Fuse.js, 9.4 KB for fast-fuzzy, and 22.6 KB for fuzzysort. Tarball size includes documentation and type/source files, so it is not the shipped-code estimate.

## Decision

Step 5.2.4 integrates **Fuse.js** behind the existing matcher pipeline. Fuse.js retrieves and ranks likely alias records, while the current matcher remains responsible for normalization, scoring, context, type compatibility, confidence, and ambiguity decisions. The smoke test handled both abbreviated and extra-token labels. The cost is approximately 26 KB minified and should be measured against the packaged extension size as browser bundling is added.

fast-fuzzy is the smallest source option, but its lack of a browser-specific/minified distribution adds packaging uncertainty. fuzzysort is easy to load directly in a browser, but its default retrieval was weaker for the representative URL variant.

## Guardrails for 5.2.4

A selected library may retrieve and rank alias candidates only. Our code must continue to own normalization, semantic synonyms, context checks, control compatibility, confidence thresholds, and ambiguity rejection. No library result should directly produce an autofill suggestion.
