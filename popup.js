const scanButton = document.getElementById("scan-form-button");
const statusMessage = document.getElementById("status-message");
const results = document.getElementById("results");
const fieldList = document.getElementById("field-list");
const profileForm = document.getElementById("profile-form");
const profileStatus = document.getElementById("profile-status");

const REQUIRED_GLOBALS = ["FieldMatcher", "ConfidenceGradient", "FillPolicy", "CharityLocationData"];
const missingGlobals = REQUIRED_GLOBALS.filter((name) => typeof globalThis[name] === "undefined");

const sampleProfile = {
  organizationName: "Paws & Whiskers Cat Shelter",
  organizationType: "Charity",
  missionStatement: "We rescue and rehome neglected cats while promoting humane care, adoption, and community education.",
  organizationContact: {
    name: "Jamie Lee",
    title: "Development Director",
    email: "contact@pawsandwhiskers.example",
    phone: "(555) 014-0202"
  },
  organizationAddress: {
    street: "123 Maple Lane",
    city: "Riverdale",
    state: "US-NY",
    postalCode: "10471",
    country: "US"
  },
  website: "https://pawsandwhiskers.example",
  ein: "12-3456789",
  eventName: "Paws & Whiskers Fall Adoption Drive",
  eventDate: "2026-10-18",
  shippingDate: "2026-10-08",
  eventDescription: "A community adoption event featuring cat meet-and-greets, foster volunteer signups, and donation opportunities."
};

if (missingGlobals.length) {
  statusMessage.classList.add("error");
  statusMessage.textContent = "Extension didn't load fully. Reload it at chrome://extensions and reopen this popup.";
  scanButton.disabled = true;
} else {
  scanButton.addEventListener("click", scanCurrentPage);
  profileForm.addEventListener("submit", saveProfile);
  profileForm.elements.namedItem("organizationAddress.country").addEventListener("change", updateProfileSubdivisionOptions);
  populateProfileCountryOptions();
  loadProfile();
}

async function scanCurrentPage() {
  setScanningState();

  try {
    const blankDisplay = ConfidenceGradient.colorFor(0);
    const activeTab = await getActiveTab();
    const scanResults = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: scanPageFields
    });
    const fields = addSuggestions(scanResults[0]?.result?.fields ?? []);
    const countryFields = fields.filter(isCountryField);
    const countryFillResults = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: fillSuggestedValues,
      args: [countryFields, blankDisplay]
    });

    if (countryFillResults[0]?.result?.some((result) => result.outcome === "filled")) {
      await waitForDependentFields();
    }

    const refreshedScanResults = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: scanPageFields
    });
    const refreshedFields = addSuggestions(refreshedScanResults[0]?.result?.fields ?? []);
    const fieldsToFill = refreshedFields.filter((field) => !isCountryField(field));
    const fillResults = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: fillSuggestedValues,
      args: [fieldsToFill, blankDisplay]
    });
    const allFillResults = [
      ...(countryFillResults[0]?.result ?? []),
      ...(fillResults[0]?.result ?? [])
    ];

    showScanResult({ fields: addFillResults(refreshedFields, allFillResults) });
  } catch (error) {
    showError(error);
  } finally {
    scanButton.disabled = false;
  }
}

function isCountryField(field) {
  return field.autocomplete === "country"
    || field.label.toLowerCase().trim() === "country";
}

function waitForDependentFields() {
  return new Promise((resolve) => setTimeout(resolve, 250));
}

function getActiveTab() {
  return chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    const activeTab = tabs[0];

    if (!activeTab?.id) {
      throw new Error("Could not find the active tab.");
    }

    return activeTab;
  });
}

function setScanningState() {
  scanButton.disabled = true;
  results.hidden = true;
  statusMessage.classList.remove("error");
  statusMessage.textContent = "Scanning this page...";
}

function showScanResult(scanResult) {
  const fields = scanResult?.fields ?? [];
  const count = fields.length;

  statusMessage.classList.remove("error");
  const filledCount = fields.filter((field) => field.fillResult?.outcome === "filled").length;
  statusMessage.textContent = `Found ${count} visible, editable field${count === 1 ? "" : "s"}. Filled ${filledCount}.`;
  renderFieldList(fields);
}

function showError(error) {
  results.hidden = true;
  statusMessage.classList.add("error");
  statusMessage.textContent = getScanErrorMessage(error);
  console.error("Form scan failed:", error);
}

function getScanErrorMessage(error) {
  const message = error?.message || "";

  if (/cannot access (a |an )?chrome|extensions? gallery|cannot be scripted|chrome-extension:\/\//i.test(message)) {
    return "This page cannot be scanned. Open a normal website and try again.";
  }

  if (/cannot access contents|missing host permission|request permission to access/i.test(message)) {
    return "This page is blocked. Open the extension's Details page, enable Allow access to file URLs, then scan again.";
  }

  return "This page cannot be scanned. Open a normal website and try again.";
}

function renderFieldList(fields) {
  fieldList.replaceChildren();

  fields.forEach((field) => {
    const listItem = document.createElement("li");
    const label = document.createElement("span");
    const details = document.createElement("span");
    const untouched = field.fillResult?.outcome === "already-filled";
    const suggestion = field.suggestion;

    label.className = "field-label";
    label.textContent = field.label;
    details.className = "field-details";
    details.textContent = buildFieldDetails(field);

    const rowDisplay = untouched
      ? null
      : suggestion?.display || ConfidenceGradient.colorFor(0);
    if (rowDisplay) {
      listItem.style.borderLeftWidth = "4px";
      listItem.style.borderLeftStyle = rowDisplay.dashed ? "dashed" : "solid";
      listItem.style.borderLeftColor = rowDisplay.outline;
    }

    listItem.append(label, details);

    if (untouched) {
      listItem.append(createUntouchedElement());
    } else if (suggestion) {
      listItem.append(createSuggestionElement(suggestion));
    } else {
      listItem.append(createNoMatchElement());
    }

    fieldList.append(listItem);
  });

  results.hidden = false;
}

function createNoMatchElement() {
  const element = document.createElement("span");
  const display = ConfidenceGradient.colorFor(0);

  element.className = "field-suggestion";
  element.style.color = display.text;
  element.textContent = `${ConfidenceGradient.describe(0)} — no confident match`;
  return element;
}

function createUntouchedElement() {
  const element = document.createElement("span");
  element.className = "field-suggestion";
  element.textContent = "Already filled — left unchanged";
  return element;
}

function createSuggestionElement(suggestion) {
  const element = document.createElement("span");
  const display = suggestion.display || ConfidenceGradient.colorFor(suggestion.confidence);
  const label = ConfidenceGradient.describe(suggestion.confidence);
  const reason = suggestion.reason ? ` • ${suggestion.reason}` : "";

  element.className = "field-suggestion";
  element.style.color = display.text;
  element.textContent = `${label}: ${suggestion.source} — ${suggestion.value}${reason}`;
  return element;
}

function addSuggestions(fields) {
  const matcher = new FieldMatcher(getProfileFromForm());

  return fields.map((field) => {
    const suggestion = matcher.getSuggestion(field);

    if (suggestion) {
      suggestion.display = ConfidenceGradient.colorFor(suggestion.confidence);
      suggestion.decision = FillPolicy.fillDecision(suggestion);
    }

    return { ...field, suggestion };
  });
}

function addFillResults(fields, fillResults) {
  const resultsByIndex = new Map(fillResults.map((result) => [result.index, result]));

  return fields.map((field) => ({
    ...field,
    fillResult: resultsByIndex.get(field.index)
  }));
}

function buildFieldDetails(field) {
  const details = [field.type];

  if (field.required) {
    details.push("required");
  }

  if (field.placeholder && field.placeholder !== field.label) {
    details.push(`placeholder: ${field.placeholder}`);
  }

  return details.join(" · ");
}

async function loadProfile() {
  const savedData = await chrome.storage.local.get("organizationProfile");
  populateProfileForm(savedData.organizationProfile || sampleProfile);
  updateProfileSubdivisionOptions();
}

function populateProfileCountryOptions() {
  const countryField = profileForm.elements.namedItem("organizationAddress.country");
  const selectedCountry = countryField.value;

  countryField.replaceChildren(new Option("Select a country", ""));
  CharityLocationData.LocationCountries.forEach((country) => {
    countryField.add(new Option(country.name, country.code));
  });
  countryField.value = selectedCountry;
}

function updateProfileSubdivisionOptions() {
  const countryField = profileForm.elements.namedItem("organizationAddress.country");
  const stateField = profileForm.elements.namedItem("organizationAddress.state");
  const selectedState = stateField.value;
  const subdivisions = CharityLocationData.LocationData[countryField.value]?.subdivisions || [];

  stateField.replaceChildren(new Option("Select a state or province", ""));
  subdivisions.forEach(([code, name]) => {
    stateField.add(new Option(name, code));
  });
  stateField.add(new Option("Other / custom", "Other"));
  stateField.value = subdivisions.some(([code]) => code === selectedState) ? selectedState : "";
}

async function saveProfile(event) {
  event.preventDefault();

  const organizationProfile = getProfileFromForm();
  await chrome.storage.local.set({ organizationProfile });

  profileStatus.classList.remove("error");
  profileStatus.textContent = "Profile saved on this computer.";
}

function getProfileFromForm() {
  const profile = {};

  for (const [key, value] of new FormData(profileForm).entries()) {
    if (!value || String(value).trim() === "") {
      continue;
    }

    const path = key.split(".");
    let current = profile;

    path.forEach((segment, index) => {
      if (index === path.length - 1) {
        current[segment] = value;
      } else {
        current[segment] = current[segment] || {};
        current = current[segment];
      }
    });
  }

  return profile;
}

function populateProfileForm(profile) {
  const formEntries = Object.entries(profile || {});

  formEntries.forEach(([fieldName, value]) => {
    const field = profileForm.elements.namedItem(fieldName);

    if (field) {
      field.value = value;
      return;
    }

    if (value && typeof value === "object") {
      Object.entries(value).forEach(([nestedName, nestedValue]) => {
        const nestedField = profileForm.elements.namedItem(`${fieldName}.${nestedName}`);

        if (nestedField) {
          nestedField.value = nestedValue;
        }
      });
    }
  });
}

function scanPageFields() {
  const ignoredInputTypes = ["button", "hidden", "image", "reset", "submit"];
  const fields = Array.from(document.querySelectorAll("input, select, textarea"))
    .filter((field) => isFillableField(field, ignoredInputTypes));

  return { fields: fields.map(describeField) };

  function isFillableField(field, ignoredTypes) {
    const style = window.getComputedStyle(field);
    const isVisible = style.display !== "none"
      && style.visibility !== "hidden"
      && field.getClientRects().length > 0;

    if (field.disabled || !isVisible) {
      return false;
    }

    return field.tagName !== "INPUT" || !ignoredTypes.includes(field.type);
  }

  function describeField(field, index) {
    return {
      index,
      label: getFieldLabel(field),
      type: getFieldType(field),
      required: field.required,
      placeholder: field.placeholder || "",
      autocomplete: field.autocomplete || "",
      options: field.tagName === "SELECT"
        ? Array.from(field.options).map((option) => ({
          text: option.text,
          value: option.value
        }))
        : []
    };
  }

  function getFieldLabel(field) {
    const labelText = Array.from(field.labels || [])
      .map((label) => label.innerText)
      .join(" ");
    const labelledByText = (field.getAttribute("aria-labelledby") || "")
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.innerText || "")
      .join(" ");

    return cleanText(labelText)
      || cleanText(field.getAttribute("aria-label"))
      || cleanText(labelledByText)
      || cleanText(field.closest("label")?.innerText)
      || cleanText(field.placeholder)
      || cleanText(field.name)
      || cleanText(field.id)
      || "Unlabeled field";
  }

  function getFieldType(field) {
    if (field.tagName === "SELECT") {
      return "select";
    }

    if (field.tagName === "TEXTAREA") {
      return "textarea";
    }

    return field.type || "text";
  }

  function cleanText(value) {
    return value?.replace(/\s+/g, " ").trim();
  }
}

function fillSuggestedValues(matches, blankDisplay) {
  const ignoredInputTypes = ["button", "hidden", "image", "reset", "submit"];
  const fields = Array.from(document.querySelectorAll("input, select, textarea"))
    .filter((field) => isFillableField(field, ignoredInputTypes));

  return matches
    .map((match) => processMatch(fields[match.index], match));

  function isFillableField(field, ignoredTypes) {
    const style = window.getComputedStyle(field);
    const isVisible = style.display !== "none"
      && style.visibility !== "hidden"
      && field.getClientRects().length > 0;

    return !field.disabled
      && isVisible
      && (field.tagName !== "INPUT" || !ignoredTypes.includes(field.type));
  }

  function processMatch(field, match) {
    if (!field) {
      return { index: match.index, outcome: "not-found" };
    }

    const suggestion = match.suggestion;

    if (field.value) {
      return { index: match.index, outcome: "already-filled" };
    }

    if (!suggestion || !suggestion.display || suggestion.display.band === "blank") {
      paintField(field, (suggestion && suggestion.display) || blankDisplay);
      return { index: match.index, outcome: "left-blank" };
    }

    if (!isSafeFillTarget(field, suggestion)) {
      paintField(field, blankDisplay);
      return { index: match.index, outcome: "unsupported-control" };
    }

    const valueToFill = formatValueForField(field, suggestion);
    field.value = valueToFill;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));

    if (field.value !== valueToFill) {
      paintField(field, blankDisplay);
      return { index: match.index, outcome: "not-accepted" };
    }

    paintField(field, suggestion.display);

    return { index: match.index, outcome: "filled" };
  }

  function isSafeFillTarget(field, suggestion) {
    const unsupportedTypes = ["checkbox", "radio", "button", "submit", "reset", "file", "hidden"].includes(field.type);

    if (unsupportedTypes) {
      return false;
    }

    if (field.tagName === "SELECT") {
      return !!suggestion && !!suggestion.value;
    }

    return ["text", "email", "tel", "url", "number", "textarea"].includes(field.type || "text");
  }

  function formatValueForField(field, suggestion) {
    const isNumericEinField = suggestion.source === "EIN" && field.type === "number";

    return isNumericEinField
      ? suggestion.value.replace(/\D/g, "")
      : suggestion.value;
  }

  function paintField(field, display) {
    field.dataset.charityAutofillerConfidence = display.band;

    const style = display.dashed ? "dashed" : "solid";
    const borderWidth = parseFloat(window.getComputedStyle(field).borderTopWidth) || 0;

    if (borderWidth > 0) {
      field.style.setProperty("border-color", display.outline, "important");
      field.style.setProperty("border-style", style, "important");
    } else {
      field.style.setProperty("outline", `1px ${style} ${display.outline}`, "important");
      field.style.setProperty("outline-offset", "0", "important");
    }

    field.style.setProperty("background-color", display.background, "important");
    paintDebugReadout(field, display.debug);
  }

  function paintDebugReadout(field, debug) {
    if (!debug) {
      return;
    }

    const doc = field.ownerDocument;
    let readout = field.dataset.autofillDebugId && doc.getElementById(field.dataset.autofillDebugId);

    if (!readout) {
      const id = `autofill-debug-${Math.random().toString(36).slice(2)}`;
      field.dataset.autofillDebugId = id;
      readout = doc.createElement("div");
      readout.id = id;
      doc.body.appendChild(readout);
    }

    const rect = field.getBoundingClientRect();
    readout.textContent = debug.label;
    readout.style.cssText = "position:absolute;margin:0;padding:0 2px;"
      + "font:10px/1.4 ui-monospace,Menlo,Consolas,monospace;white-space:nowrap;"
      + "background:transparent;pointer-events:none;z-index:2147483647;";
    readout.style.setProperty("color", debug.color, "important");
    readout.style.setProperty("left", `${rect.right + window.scrollX}px`, "important");
    readout.style.setProperty("top", `${rect.bottom + window.scrollY}px`, "important");
    readout.style.setProperty("transform", "translateX(-100%)", "important");
  }
}
