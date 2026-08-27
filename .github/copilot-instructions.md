# Copilot instructions

Read **`CLAUDE.md`** first — it is the entry point for this repo: where the docs
live, the per-step workflow, coding standards, and file ownership. Then
**`DESIGN.md`** for the target architecture and **`TODO.md`** for the current
step. Do not restate those rules here.

## graphify

For any question about this repo's architecture, structure, components, or how to
add / modify / find code, your first action is `graphify query "<question>"` when
`graphify-out/graph.json` exists. Use `graphify path "<A>" "<B>"` for
relationship questions and `graphify explain "<concept>"` for a focused concept.
These return a scoped subgraph, usually far smaller than raw grep output.

Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review. Read
source files only when (a) modifying or debugging specific code, (b) the graph
lacks the detail, or (c) the graph is missing or stale. Type `/graphify` in
Copilot Chat to build or update the graph.
