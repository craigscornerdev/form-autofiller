# Charity Form Autofiller

This is an early Chrome extension prototype. It can scan the open webpage and fill high-confidence matches. It does not submit a form.

It also includes one editable charity profile. Profile information is saved locally in Chrome.

## Load the extension in Chrome

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Select **Load unpacked**.
4. Select this project folder.
5. Pin **Charity Form Autofiller** to the Chrome toolbar.
7. Open the extension's **Details** page and enable **Allow access to file URLs** if you are testing `charity-form-fixture.html` locally.
8. Open a webpage with a form and select the extension icon.
9. Select **Scan Form**.

## Current scope

- Shows a popup.
- Finds visible, editable inputs, dropdowns, and text areas.
- Ignores hidden fields and form buttons.
- Reports the total number of fields found and lists their details.
- Scans the page only after the user selects **Scan Form**.
- Includes a locally saved charity profile with sample cat-shelter data.
- Stores country as an ISO 3166-1 alpha-2 code and state/province as an ISO 3166-2-style code when using standardized controls.
- Includes a local common-country location database covering complete first-level subdivisions for the US, Canada, UK, Australia, Germany, and France, plus common entries for India and Mexico.
- Matches organization name, email, phone, website, and EIN only for exact approved labels.
- Formats an EIN without punctuation when a form requires numbers only.
- Does not match an organization-address field to the organization name.
- Fills only high-confidence matches and highlights webpage fields by confidence.
- Does not submit forms.

## Development

Node.js and npm are used only for local tests. They are not required when the
extension runs in Chrome.

Install the test dependencies:

```powershell
npm.cmd install
```

Run the tests:

```powershell
npm.cmd test
```

PowerShell may block the `npm.ps1` launcher. Use `npm.cmd` as shown above, or
allow local scripts for your user account with `RemoteSigned`.

The `node_modules` folder is generated locally. Do not commit it. The
`.gitignore` file excludes it from Git.

## GitHub workflow

This project uses the GitHub repository:

<https://github.com/craigscornerdev/Form-Autofiller>

Check the repository state:

```powershell
git status
```

Review changes, stage them, and create a commit:

```powershell
git diff
git add .
git diff --cached
git commit -m "Describe the change"
```

Send your commit to GitHub only when you are ready:

```powershell
git push -u origin main
```

Review the staged changes before every commit. This keeps version control under
your control.
