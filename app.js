
/* ==========================================================================
   BUTTERFLY EFFECT — AI DISCOVERY ENGINE
   Accepts open-ended questions and problems.
   Requires a backend endpoint: POST /api/analyze
   ========================================================================== */

const API_URL = "/api/analyze";

// Existing form elements
const form = document.querySelector("#concern-form");
const concernInput = document.querySelector("#concern-text");
const whoInput = document.querySelector("#concern-who");
const contextInput = document.querySelector("#concern-context");

const discovery = document.querySelector("#discovery");
const liveStatus = document.querySelector("#live-status");

let isAnalyzing = false;

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function getInputValues() {
  return {
    concern: concernInput?.value.trim() || "",
    who: whoInput?.value.trim() || "",
    context: contextInput?.value.trim() || ""
  };
}

function setStatus(message) {
  if (liveStatus) {
    liveStatus.textContent = message;
  }
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

// --------------------------------------------------------------------------
// Loading screen
// --------------------------------------------------------------------------

function renderLoading() {
  discovery.replaceChildren();

  const container = createElement("section", "ai-loading");

  const spinner = createElement("div", "ai-spinner");
  spinner.setAttribute("aria-hidden", "true");

  const title = createElement("h2", "", "Exploring your question");

  const description = createElement(
    "p",
    "",
    "Looking for underlying causes, unexpected connections, and possible ways forward."
  );

  container.append(spinner, title, description);
  discovery.append(container);

  discovery.hidden = false;
}

// --------------------------------------------------------------------------
// Normalize AI responses
// Supports both plain text and structured JSON responses.
// --------------------------------------------------------------------------

function normalizeAnalysis(data) {
  let result = data?.analysis ?? data?.result ?? data?.response ?? data;

  if (typeof result === "string") {
    try {
      result = JSON.parse(result);
    } catch {
      return {
        overview: result,
        connections: [],
        opportunities: [],
        risks: [],
        nextSteps: []
      };
    }
  }

  if (typeof result !== "object" || result === null) {
    throw new Error("The AI returned an invalid response.");
  }

  return {
    overview: result.overview || result.summary || result.answer || "",
    connections: Array.isArray(result.connections)
      ? result.connections
      : [],
    opportunities: Array.isArray(result.opportunities)
      ? result.opportunities
      : [],
    risks: Array.isArray(result.risks)
      ? result.risks
      : [],
    nextSteps: Array.isArray(result.next_steps)
      ? result.next_steps
      : Array.isArray(result.nextSteps)
        ? result.nextSteps
        : []
  };
}

// --------------------------------------------------------------------------
// Reusable result section
// --------------------------------------------------------------------------

function renderSection(title, items, className) {
  if (!items.length) return null;

  const section = createElement("section", "ai-section");
  section.append(createElement("h3", "", title));

  const list = createElement("div", className || "ai-item-list");

  items.forEach((item) => {
    const card = createElement("article", "ai-item");

    if (typeof item === "string") {
      card.append(createElement("p", "", item));
    } else {
      const heading =
        item.title || item.name || item.connection || item.label;

      const explanation =
        item.explanation ||
        item.reasoning ||
        item.description ||
        item.detail ||
        item.why;

      if (heading) {
        card.append(createElement("h4", "", heading));
      }

      if (explanation) {
        card.append(createElement("p", "", explanation));
      }

      if (item.evidence) {
        const evidence = createElement(
          "p",
          "ai-evidence",
          `Evidence: ${item.evidence}`
        );
        card.append(evidence);
      }

      if (item.confidence) {
        card.append(
          createElement(
            "span",
            "ai-confidence",
            `Confidence: ${item.confidence}`
          )
        );
      }
    }

    list.append(card);
  });

  section.append(list);
  return section;
}

// --------------------------------------------------------------------------
// Display results
// --------------------------------------------------------------------------

function renderAnalysis(data, originalQuestion) {
  const result = normalizeAnalysis(data);

  discovery.replaceChildren();

  const container = createElement("div", "ai-results");

  // Header
  const header = createElement("header", "ai-results-header");

  header.append(
    createElement("span", "ai-label", "BUTTERFLY EFFECT · AI ANALYSIS"),
    createElement("h2", "", "What we found"),
    createElement("p", "ai-question", originalQuestion)
  );

  container.append(header);

  // Main explanation
  if (result.overview) {
    const overview = createElement("section", "ai-overview");

    overview.append(
      createElement("h3", "", "The bigger picture"),
      createElement("p", "", result.overview)
    );

    container.append(overview);
  }

  // Connections
  const connections = renderSection(
    "Unexpected connections",
    result.connections,
    "ai-connection-list"
  );

  if (connections) container.append(connections);

  // Opportunities
  const opportunities = renderSection(
    "Potential opportunities",
    result.opportunities,
    "ai-opportunity-list"
  );

  if (opportunities) container.append(opportunities);

  // Risks
  const risks = renderSection(
    "Risks and uncertainties",
    result.risks,
    "ai-risk-list"
  );

  if (risks) container.append(risks);

  // Practical steps
  const steps = renderSection(
    "Where to start",
    result.nextSteps,
    "ai-step-list"
  );

  if (steps) container.append(steps);

  // If the AI returned no usable content
  if (
    !result.overview &&
    !connections &&
    !opportunities &&
    !risks &&
    !steps
  ) {
    container.append(
      createElement(
        "p",
        "",
        "The AI did not return enough information. Please try again."
      )
    );
  }

  // Disclaimer
  const disclaimer = createElement(
    "p",
    "ai-disclaimer",
    "These are AI-generated ideas, not verified causal relationships. Check important claims against reliable evidence and local expertise."
  );

  container.append(disclaimer);

  // Try again
  const retryButton = createElement(
    "button",
    "button button-ghost",
    "Analyze another question"
  );

  retryButton.type = "button";

  retryButton.addEventListener("click", () => {
    concernInput?.focus();
    document.querySelector("#share")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  container.append(retryButton);

  discovery.append(container);
  discovery.hidden = false;

  setStatus("Analysis complete.");
}

// --------------------------------------------------------------------------
// Error display
// --------------------------------------------------------------------------

function renderError(message) {
  discovery.replaceChildren();

  const error = createElement("section", "ai-error");

  error.append(
    createElement("h2", "", "We couldn't complete the analysis"),
    createElement("p", "", message)
  );

  const retry = createElement(
    "button",
    "button button-primary",
    "Try again"
  );

  retry.type = "button";

  retry.addEventListener("click", () => {
    submitQuestion();
  });

  error.append(retry);
  discovery.append(error);
  discovery.hidden = false;

  setStatus("Analysis failed.");
}

// --------------------------------------------------------------------------
// Main AI request
// --------------------------------------------------------------------------

async function submitQuestion() {
  if (isAnalyzing) return;

  const values = getInputValues();

  if (values.concern.length < 5) {
    concernInput?.focus();
    setStatus("Please enter a question or describe a problem.");
    return;
  }

  isAnalyzing = true;

  const submitButton = form?.querySelector(
    'button[type="submit"], input[type="submit"]'
  );

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.dataset.originalText =
      submitButton.textContent || "Analyze";
    submitButton.textContent = "Analyzing...";
  }

  renderLoading();
  setStatus("Analyzing your question.");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.detail ||
        data.error ||
        `Server error (${response.status}).`
      );
    }

    if (data.success === false) {
      throw new Error(data.error || "The analysis was unsuccessful.");
    }

    renderAnalysis(data, values.concern);

  } catch (error) {
    console.error("Butterfly Effect error:", error);

    renderError(
      error.message ||
      "Something went wrong. Check your connection and try again."
    );

  } finally {
    isAnalyzing = false;

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent =
        submitButton.dataset.originalText || "Find connections";
    }
  }
}

// --------------------------------------------------------------------------
// Events
// --------------------------------------------------------------------------

if (!form || !concernInput || !discovery) {
  console.error(
    "Butterfly Effect could not initialize. Check the form and element IDs."
  );
} else {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitQuestion();
  });
}

// Make the form available to the browser without exposing API credentials.
console.info("Butterfly Effect AI interface initialized.");
