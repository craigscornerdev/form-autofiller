# Project Conventions

Clear, compact language by default; expand only when asked.

## Where things live

- **`DESIGN.md`** — the target architecture. Read the relevant section before
  starting any work.
- **`TODO.md`** — the phased backlog. Each numbered step is scoped to one
  session and names the files to touch, the test to write, and the `DESIGN.md`
  section to read. Work the next open step; don't skip ahead. Completed items
  move to `CHANGELOG.md`, they are not kept here.
- **`demos/README.md`** — how to run the extension against the demo forms and
  what each phase should visibly do. `TODO.md` steps marked ▶ end with one.
- **`CHANGELOG.md`** — shipped work, `YYYY-MM-DD` dated. The only record of
  completed work.
- **`graphify-out/`** — the code graph; keep it current after structural changes.

## Per-step workflow

1. Read the `DESIGN.md` section and source files the `TODO.md` step names.
2. Query the graph (`graphify query` / `explain`) for that area before editing.
3. Make the smallest change that satisfies the step — nothing from later steps.
4. Add or update the test the step names; `npm test` until green.
5. `graphify update .`, add a dated `CHANGELOG.md` entry, remove item from
   `TODO.md`.
6. Commit locally, concise message. No push or PR unless asked.

## Coding standards

ISO/IEC 25010: reuse an existing library before writing logic; small
single-responsibility units; unit-testable; handle real edge cases only.

**No gravestones** — code, docs, and commit messages describe the current state
only; never name a removed approach, value, or file.

Architecture-specific rules (dual exports, no domain strings in the matcher,
absolute fill-safety invariants) are in `DESIGN.md` §10.

## Tools

- `graphify` over raw grep for architecture / relationship questions.
- Tests: Jest, node environment — `npm test`.
