# Changelog

This file records visible feature changes. Versions use the format `major.minor.patch`.

## 2026-08-21 — Project setup documentation

- Added Git and GitHub workflow instructions to the README.
- Added `.gitignore` rules for generated development files.
- Documented the optional Node.js and npm test setup.

## 0.6.1 — EIN number-field support

- Removes punctuation from an EIN only when a form requires a numeric value.
- Applies the green highlight only after the form accepts the filled value.
- Marks rejected values for review instead of treating them as successfully filled.

## 0.6.0 — More exact high-confidence matches

- Added exact-label matches for email, phone, website, and EIN.
- Each value fills only when the field label is one of its approved aliases.
- Fields with unclear labels remain unfilled.

## 0.5.0 — High-confidence fill and color review

- High-confidence matches now fill empty webpage fields.
- Webpage fields receive a color outline: green for high confidence, yellow for review, and red for no match.
- The popup shows a green, yellow, and red confidence guide.
- Fields without a high-confidence match are left unchanged.
- Existing field values are not overwritten.
- The extension still does not submit forms.

## 0.4.0 — First conservative match

- Added an exact-match rule for **Organization Name**.
- The popup shows a high-confidence suggestion but does not fill the webpage.
- The rule rejects labels that include **address**.

## 0.3.0 — Sample charity profile

- Added one editable profile for basic charity information.
- Added sample cat-shelter information for testing.
- Saves profile information locally in Chrome.

## 0.2.0 — Field details

- The scan now lists each detected field in the popup.
- Each result shows its best available label, type, required state, and placeholder.
- Reads standard labels and accessibility labels before falling back to other field information.

## 0.1.1 — Scan the open page

- Scanning now runs only when the user selects **Scan Form**.
- A page does not need to be refreshed before it can be scanned.
- The scan result now states that it counts visible, editable fields.

## 0.1.0 — First extension shell

- Added the Chrome extension structure.
- Added a popup with a **Scan Form** button.
- Added a basic page scan that counts form fields.
- Does not fill, edit, or submit any form.
