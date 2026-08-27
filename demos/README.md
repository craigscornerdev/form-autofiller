# Demos

Runnable forms for watching the autofiller work. Each phase in `TODO.md` that
ends with ▶ points here.

## One-time setup

1. `chrome://extensions` → enable **Developer mode**.
2. **Load unpacked** → select the repo root.
3. Open the extension's **Details** → enable **Allow access to file URLs**
   (the demos load over `file://`).

## Running a demo

1. Open the demo file in Chrome (`File ▸ Open`, or drag it into a tab).
2. Click the extension icon → set up the profile once (or keep the sample).
3. Click **Scan Form**.
4. Read the result two ways: the popup list, and the colored outlines drawn on
   the page itself. For every field the popup row's left-border color and the
   on-page outline color are the same — they come from one gradient helper.

Colors: **green** = exact match to entered data · **yellow / orange** = looser,
composed, or learned match (filled, review it) · **dashed red** = left blank, no
confident match.

## Demo files

| File | Phase | Shows |
|---|---|---|
| `spectrum-demo.html` | A | The full red→green spectrum on one form. |
| `sections-demo.html` | B6 | Section headings alone disambiguate identical labels. |
| `personal-demo.html` | B9 | The same engine filling a non-charity form; passwords stay blank. |
| `synonyms-demo.html` | C4 | Semantic matches with no shared keywords (model on vs off). |
| `application-demo.html` | E, F | Learned custom fields; opt-in LLM draft for open-ended questions. |

Only `spectrum-demo.html` exists today; the rest are built by the step that
first needs them.

## What to watch, per phase

- **A — `spectrum-demo.html`:** exact fields solid green and filled; the reworded
  labels ("Organisation phone line", "Email address for the primary contact")
  orange–yellow and filled; "Mailing address" yellow-green and filled;
  "Favourite colour" and "How did you hear about us?" dashed red and empty;
  the pre-filled "Website" left untouched.
- **B4 — `spectrum-demo.html`:** identical to end of Phase A. Regression check
  for the registry swap, not a new feature.
- **B6 — `sections-demo.html`:** "Name" under *Organization* fills with the org
  name; "Name" under *Primary contact* fills with the contact name.
- **B7 — popup:** the profile form is generated from the active presets and
  grouped; edits persist across reopen; `spectrum-demo.html` still fills.
- **B9 — `personal-demo.html`:** enable only the `personal` preset — name, email,
  phone, DOB, address fill; the password field stays dashed red. Re-enable
  `charity`; `spectrum-demo.html` still works.
- **C2 — popup:** the dev "warm model" button reports load time and a cosine for
  two typed phrases (fully local).
- **C4 — `synonyms-demo.html`:** with the model warm, "Federal Tax Identification
  Number" / "Legal entity name" / "E-mail address" match and fill; with the model
  off they fall back to red / weak matches.
- **D4 — `personal-demo.html`:** opt in, hand-fill it twice, open the "Learning
  data" panel — one entry, count 2, labels only (no password). Export, delete,
  clear.
- **E1 — `application-demo.html`:** hand-fill "Grant program name" twice across
  scans; the third scan suggests it from history (yellow).
- **E4 — `application-demo.html`:** hand-fill "Reference contact" the same way
  across ~8 scans; it promotes to a saved concept and shows in the profile UI.
- **E5 — any demo:** expand a yellow result row to see the score breakdown and
  runner-up concepts.
- **F1 — `application-demo.html`:** with LLM assist opted in, the open-ended
  "Why do you want this grant?" textarea gets a proposed draft (orange); every
  other field still comes from the local tiers.

## Live forms

`realforms.md` lists real request forms. Try them only when it is safe and
permitted, after the local demos pass. Real markup changes without notice — the
local demos are the reproducible check.
