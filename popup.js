const scanButton = document.getElementById("scan-form-button");
const statusMessage = document.getElementById("status-message");
const results = document.getElementById("results");
const fieldList = document.getElementById("field-list");
const profileForm = document.getElementById("profile-form");
const profileStatus = document.getElementById("profile-status");

const sampleProfile = {
  organizationName: "Paws & Whiskers Cat Shelter",
  organizationType: "Charity",
  missionStatement: "We rescue and rehome neglected cats while promoting humane care, adoption, and community education.",
  contactName: "Jamie Lee",
  position: "Development Director",
  email: "contact@pawsandwhiskers.example",
  phone: "(555) 014-0202",
  organizationAddress: {
    street: "123 Maple Lane",
    city: "Riverdale",
    state: "New York",
    postalCode: "10471",
    country: "United States"
  },
  website: "https://pawsandwhiskers.example",
  ein: "12-3456789",
  eventName: "Paws & Whiskers Fall Adoption Drive",
  eventDate: "2026-10-18",
  shippingDate: "2026-10-08",
  eventDescription: "A community adoption event featuring cat meet-and-greets, foster volunteer signups, and donation opportunities."
};

scanButton.addEventListener("click", scanCurrentPage);
profileForm.addEventListener("submit", saveProfile);
loadProfile();

async function scanCurrentPage() {
  setScanningState();

  try {
    const activeTab = await getActiveTab();
    const scanResults = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: scanPageFields
    });
    const fields = addSuggestions(scanResults[0]?.result?.fields ?? []);
    const fillResults = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: applyHighConfidenceMatches,
      args: [fields]
    });

    showScanResult({ fields: addFillResults(fields, fillResults[0]?.result ?? []) });
  } catch (error) {
    showError(error);
  } finally {
    scanButton.disabled = false;
  }
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
  if (error?.message?.includes("Cannot access contents of the page")) {
    return "This local page is blocked. Enable Allow access to file URLs for this extension, then scan again.";
  }

  return "This page cannot be scanned. Open a normal website and try again.";
}

function renderFieldList(fields) {
  fieldList.replaceChildren();

  fields.forEach((field) => {
    const listItem = document.createElement("li");
    const label = document.createElement("span");
    const details = document.createElement("span");
    const suggestion = field.suggestion;

    label.className = "field-label";
    label.textContent = field.label;
    details.className = "field-details";
    details.textContent = buildFieldDetails(field);

    listItem.append(label, details);

    if (suggestion) {
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
  element.className = "field-suggestion low";
  element.textContent = "No high-confidence match — left unchanged";
  return element;
}

function createSuggestionElement(suggestion) {
  const element = document.createElement("span");
  const category = suggestion.scoreCategory || suggestion.confidence || "high";
  const label = category === "high" ? "High confidence" : category === "review" ? "Review" : "Low confidence";
  const reason = suggestion.reason ? ` • ${suggestion.reason}` : "";

  element.className = `field-suggestion ${suggestion.confidence || category}`;
  element.textContent = `${label}: ${suggestion.source} — ${suggestion.value}${reason}`;
  return element;
}

function addSuggestions(fields) {
  const matcher = new FieldMatcher(getProfileFromForm());

  return fields.map((field) => ({
    ...field,
    suggestion: matcher.getSuggestion(field)
  }));
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
      return "text area";
    }

    return field.type || "text";
  }

  function cleanText(value) {
    return value?.replace(/\s+/g, " ").trim();
  }
}

function applyHighConfidenceMatches(matches) {
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

    const confidence = match.suggestion?.confidence || "low";

    if (!match.suggestion) {
      highlightField(field, "low");
      return { index: match.index, outcome: "no-match" };
    }

    if (field.value) {
      highlightField(field, confidence);
      return { index: match.index, outcome: "already-filled" };
    }

    if (!isSafeFillTarget(field, match.suggestion)) {
      highlightField(field, "low");
      return { index: match.index, outcome: "unsupported-control" };
    }

    if (confidence !== "high") {
      highlightField(field, confidence);
      return { index: match.index, outcome: "review-required" };
    }

    const valueToFill = formatValueForField(field, match.suggestion);
    field.value = valueToFill;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));

    if (field.value !== valueToFill) {
      highlightField(field, "medium");
      return { index: match.index, outcome: "not-accepted" };
    }

    highlightField(field, confidence);

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

  function highlightField(field, confidence) {
    const colors = {
      high: { outline: "#16a34a", background: "#dcfce7" },
      medium: { outline: "#d97706", background: "#fef3c7" },
      low: { outline: "#dc2626", background: "#fee2e2" }
    };
    const color = colors[confidence] || colors.low;

    field.dataset.charityAutofillerConfidence = confidence;
    field.style.setProperty("outline", `3px solid ${color.outline}`, "important");
    field.style.setProperty("outline-offset", "2px", "important");
    field.style.setProperty("background-color", color.background, "important");
  }
}
