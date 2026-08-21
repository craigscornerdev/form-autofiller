# Charity Form Autofiller — Prototype Checklist

## Goal

Create a Chrome extension that fills only clearly identified charity-form fields. The user reviews the form and submits it.

## Prototype 1: Extension Shell

- [x] Create the Chrome extension files.
- [x] Add a simple popup with a **Scan Form** button.
- [x] Load the extension in Chrome and confirm the popup opens.

## Prototype 2: Read a Form

- [x] Find text boxes, email fields, text areas, dropdowns, checkboxes, and radio buttons on the current page.
- [x] Read each field's label, placeholder, name, and accessibility label.
- [x] Show the detected fields in the popup.

## Prototype 3: Store One Charity Profile

- [x] Create a simple profile form in the popup.
- [x] Save organization name, contact name, email, phone, address, website, and EIN locally.
- [x] Confirm saved information remains after Chrome restarts.

## Prototype 4: Conservative Matching

- [x] Match exact labels and approved aliases only.
- [x] Do not fill a field when the match is unclear.
- [x] Prevent conflicts, such as matching **Organization Name** to **Organization Address**.
- [ ] Show the reason for every suggested match.

## Prototype 5: Review and Fill

- [ ] Fill approved fields only.
- [ ] Do not overwrite an existing field value.
- [ ] Never click or submit a form.
- [x] Clearly mark fields that were filled by the extension.

## Prototype 6: Test and Improve

- [ ] Make a local sample donation-request form for safe testing.
- [ ] Test correct matches and deliberately similar incorrect matches.
- [ ] Test with the Renegade Lemonade request form.
- [ ] Record problems and add only the rules needed to fix them.

## Later, Not in the First Prototype

- [ ] Event and campaign profiles.
- [ ] Reusable answers for open-ended questions.
- [ ] Document attachments, such as a W-9 or tax letter.
- [ ] Optional AI suggestions for unclear questions.
