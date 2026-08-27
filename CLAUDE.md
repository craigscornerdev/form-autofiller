# Project Conventions

## Communication
Clear, compact language by default. Expand into detail only when asked.

## Coding standards
Follow ISO/IEC 25010 quality traits:
- **Reuse**: check `package.json`/`node_modules` for an existing library before writing new logic.
- **Maintainability**: small, single-responsibility functions/classes; clear names.
- **Testability**: keep code unit-testable.
- **Reliability**: handle real edge cases only; no speculative error handling.
- **No gravestones**: don't reference removed/prior approaches, names, or values in code, docs, or commit messages — describe only the current state.

## Workflow
1. Pick the next open item in `TODO.md`.
2. Check the graph (`graphify query`/`explain`) for that section of the code before editing.
3. Make the smallest focused change that satisfies the item.
4. Add or update at least one test covering the change; run `npm test` until it passes.
5. Update the graph (`graphify update .`), add a dated `CHANGELOG.md` entry, and remove the completed item from `TODO.md`.
6. Commit locally with a concise message. Do not push or open a PR unless asked.

## File ownership
- `TODO.md` — future work only, no completed items.
- `CHANGELOG.md` — completed work, `YYYY-MM-DD` dates.
- `graphify-out/` — kept current after structural changes.

## Tools
- Prefer `graphify` over raw grep for architecture/relationship queries.
- Test framework: Jest (`npm test`).
