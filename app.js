import { meta, opportunities, sources } from "./data.js";
import { concernExamples, sampleConcern } from "./community.js";
import { runAgent } from "./agent.js";
import { getEvaluation, modelInfo } from "./model.js";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const sourceById = new Map(sources.map((source) => [source.id, source]));
const opportunityById = new Map(opportunities.map((opportunity) => [opportunity.id, opportunity]));

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

const pad = (value) => String(value).padStart(2, "0");

function weightedScore(opportunity) {
  return meta.weights.reduce(
    (total, component) => total + opportunity.scores[component.key] * component.weight,
    0,
  );
}

function priorityScore(opportunity) {
  return Math.round(weightedScore(opportunity) - opportunity.scores.risk);
}

function sourceIdsFor(opportunity) {
  return [
    ...new Set(
      opportunity.path.flatMap((node) => (node.kind === "reported" ? node.sources ?? [] : [])),
    ),
  ];
}

function uncertaintyFor(opportunity) {
  const certainty = opportunity.scores.certainty;
  if (certainty >= 75) {
    return { label: "Lower uncertainty", short: "Lower uncertainty", tone: "lower" };
  }
  if (certainty >= 60) {
    return { label: "Moderate uncertainty", short: "Moderate uncertainty", tone: "moderate" };
  }
  if (certainty >= 45) {
    return {
      label: "Moderate–high uncertainty",
      short: "Moderate–high",
      tone: "moderate-high",
    };
  }
  return { label: "High uncertainty", short: "High uncertainty", tone: "high" };
}

function domainTone(domain) {
  const value = domain.toLowerCase();
  if (value.includes("heat")) return "heat";
  if (value.includes("health")) return "health";
  if (value.includes("canopy") || value.includes("green")) return "canopy";
  if (value.includes("data") || value.includes("equity") || value.includes("access")) return "gold";
  if (value.includes("mobility") || value.includes("children")) return "sky";
  return "forest";
}

function strengthClass(strength) {
  return String(strength)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const priorityOrder = [...opportunities].sort(
  (a, b) => priorityScore(b) - priorityScore(a) || a.title.localeCompare(b.title),
);

const rankById = new Map(priorityOrder.map((opportunity, index) => [opportunity.id, index + 1]));

const topOpportunity = priorityOrder[0];

function initialSelectedId() {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return priorityOrder[0].id;
  try {
    const decoded = decodeURIComponent(raw);
    return opportunities.some((opportunity) => opportunity.id === decoded)
      ? decoded
      : priorityOrder[0].id;
  } catch {
    return priorityOrder[0].id;
  }
}

const searchBlobs = new Map(
  opportunities.map((opportunity) => {
    const sourceText = sourceIdsFor(opportunity)
      .map((id) => sourceById.get(id))
      .filter(Boolean)
      .flatMap((source) => [source.title, source.publisher, source.summary, source.short]);

    const text = [
      opportunity.title,
      opportunity.shortTitle,
      opportunity.tagline,
      opportunity.track,
      opportunity.hypothesis,
      opportunity.uncertaintyNote,
      ...opportunity.domains,
      ...opportunity.unknowns,
      opportunity.test.title,
      opportunity.test.design,
      opportunity.test.killCriteria,
      ...opportunity.test.measures,
      ...opportunity.risks.flatMap((risk) => [risk.title, risk.detail, risk.mitigation]),
      ...opportunity.path.flatMap((node) => [node.phase, node.domain, node.title, node.claim]),
      ...sourceText,
    ]
      .join(" ")
      .toLowerCase();

    return [opportunity.id, text];
  }),
);

/* -------------------------------------------------------------------------- */
/* State and filters                                                          */
/* -------------------------------------------------------------------------- */

const state = {
  selectedId: initialSelectedId(),
  query: "",
  filter: "all",
  sort: "priority",
  concern: null,
};

const filters = [
  {
    id: "all",
    label: "All opportunities",
    description: "Show every opportunity in the sample.",
    test: () => true,
  },
  {
    id: "strong",
    label: "Strongest evidence",
    description: "Evidence strength score of 80 or higher.",
    test: (opportunity) => opportunity.scores.evidence >= 80,
  },
  {
    id: "uncertain",
    label: "Highest uncertainty",
    description: "Certainty score below 55.",
    test: (opportunity) => opportunity.scores.certainty < 55,
  },
];

const sorters = {
  priority: (a, b) => priorityScore(b) - priorityScore(a),
  uncertainty: (a, b) => b.scores.certainty - a.scores.certainty,
  impact: (a, b) => b.scores.impact - a.scores.impact,
  feasibility: (a, b) => b.scores.feasibility - a.scores.feasibility,
};

const els = {
  search: $("#search"),
  sort: $("#sort"),
  filterGroup: $("#filter-group"),
  candidateGrid: $("#candidate-grid"),
  emptyState: $("#empty-state"),
  resetView: $("#reset-view"),
  detail: $("#detail"),
  resultCount: $("#result-count"),
  liveStatus: $("#live-status"),
  toast: $("#toast"),
  methodDialog: $("#method-dialog"),
  evidenceDialog: $("#evidence-dialog"),
  methodContent: $("#method-content"),
  evidenceContent: $("#evidence-content"),
  concernForm: $("#concern-form"),
  concernText: $("#concern-text"),
  concernWho: $("#concern-who"),
  concernContext: $("#concern-context"),
  concernErrorSummary: $("#concern-error-summary"),
  concernTextError: $("#concern-text-error"),
  concernWhoError: $("#concern-who-error"),
  sampleConcernButton: $("[data-sample-concern]"),
  discovery: $("#discovery"),
};

/* -------------------------------------------------------------------------- */
/* Selection and filtering                                                    */
/* -------------------------------------------------------------------------- */

function activeFilter() {
  return filters.find((filter) => filter.id === state.filter) ?? filters[0];
}

function visibleOpportunities() {
  const filter = activeFilter();
  const query = state.query.toLowerCase();
  const sorter = sorters[state.sort] ?? sorters.priority;

  return opportunities
    .filter((opportunity) => filter.test(opportunity))
    .filter((opportunity) => {
      if (!query) return true;
      return (searchBlobs.get(opportunity.id) ?? "").includes(query);
    })
    .sort((a, b) => sorter(a, b) || a.title.localeCompare(b.title));
}

function syncFilterState() {
  $$("[data-filter]", els.filterGroup).forEach((button) => {
    const active = button.dataset.filter === state.filter;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function renderFilters() {
  els.filterGroup.innerHTML = filters
    .map((filter) => {
      const count = opportunities.filter(filter.test).length;
      return `
        <button
          class="filter-chip ${state.filter === filter.id ? "is-active" : ""}"
          type="button"
          data-filter="${escapeHtml(filter.id)}"
          aria-pressed="${state.filter === filter.id}"
          title="${escapeHtml(filter.description)}"
        >
          ${escapeHtml(filter.label)}
          <span class="filter-count">${count}</span>
        </button>
      `;
    })
    .join("");
}

function updateResultCount(count) {
  els.resultCount.textContent = `${count} of ${opportunities.length} opportunities`;
}

function refreshView() {
  const visible = visibleOpportunities();

  if (visible.length === 0) {
    state.selectedId = null;
    els.candidateGrid.innerHTML = "";
    els.candidateGrid.hidden = true;
    els.emptyState.hidden = false;
    els.detail.hidden = true;
    els.detail.innerHTML = "";
    delete els.detail.dataset.renderedId;
    updateResultCount(0);
    return;
  }

  els.candidateGrid.hidden = false;
  els.emptyState.hidden = true;
  els.detail.hidden = false;

  if (!visible.some((opportunity) => opportunity.id === state.selectedId)) {
    state.selectedId = visible[0].id;
    updateHash(state.selectedId);
  }

  renderCandidates(visible);
  renderDetail();
  updateResultCount(visible.length);
}

function updateHash(id) {
  if (!id) return;
  window.history.replaceState(null, "", `#${encodeURIComponent(id)}`);
}

function maybeScrollToDetail(force = false) {
  if (els.detail.hidden) return;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rect = els.detail.getBoundingClientRect();
  const mostlyBelow = rect.top > window.innerHeight * 0.5;
  const mostlyAbove = rect.bottom < 100;

  if (force || mostlyBelow || mostlyAbove) {
    els.detail.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }
}

function selectCandidate(id, { scroll = false } = {}) {
  const opportunity = opportunities.find((candidate) => candidate.id === id);
  if (!opportunity) return;

  state.selectedId = id;

  $$("[data-candidate-id]", els.candidateGrid).forEach((card) => {
    const selected = card.dataset.candidateId === id;
    card.classList.toggle("is-selected", selected);
    card.setAttribute("aria-pressed", String(selected));
  });

  renderDetail({ force: true });
  updateHash(id);
  els.liveStatus.textContent = `Selected ${opportunity.title}. Priority score ${priorityScore(
    opportunity,
  )} out of 100. ${uncertaintyFor(opportunity).label}.`;

  if (scroll) window.requestAnimationFrame(() => maybeScrollToDetail());
}

/* -------------------------------------------------------------------------- */
/* Candidate cards                                                            */
/* -------------------------------------------------------------------------- */

function renderCandidates(visible) {
  els.candidateGrid.innerHTML = visible
    .map((opportunity, index) => {
      const score = priorityScore(opportunity);
      const uncertainty = uncertaintyFor(opportunity);
      const rank = rankById.get(opportunity.id);
      const selected = opportunity.id === state.selectedId;
      const shownDomains = opportunity.domains.slice(0, 3);
      const extraDomains = opportunity.domains.length - shownDomains.length;
      const reportedCount = opportunity.path.filter((node) => node.kind === "reported").length;
      const inferredCount = opportunity.path.filter((node) => node.kind === "inferred").length;

      const domainMarkup =
        shownDomains
          .map((domain) => `<span class="domain-chip">${escapeHtml(domain)}</span>`)
          .join("") +
        (extraDomains > 0
          ? `<span class="domain-chip domain-chip--more">+${extraDomains}</span>`
          : "");

      const miniPath = opportunity.path
        .map((node) => `<i class="mini-node mini-node--${node.kind}" aria-hidden="true"></i>`)
        .join("");

      return `
        <button
          class="candidate ${selected ? "is-selected" : ""}"
          type="button"
          data-candidate-id="${escapeHtml(opportunity.id)}"
          aria-pressed="${selected}"
          style="--card-index:${index}"
        >
          <span class="candidate-top">
            <span class="candidate-rank">${pad(rank)} <span>/ ${pad(opportunities.length)}</span></span>
            <span class="candidate-score"><strong>${score}</strong><small>priority</small></span>
          </span>
          <span class="candidate-kicker">${escapeHtml(opportunity.track)}</span>
          <span class="candidate-title">${escapeHtml(opportunity.title)}</span>
          <span class="candidate-tagline">${escapeHtml(opportunity.tagline)}</span>
          <span class="candidate-domains">${domainMarkup}</span>
          <span class="candidate-foot">
            <span class="candidate-path">
              <span class="mini-path" aria-hidden="true">${miniPath}</span>
              <span class="mini-path-label" title="${reportedCount} source-supported anchors and ${inferredCount} system-inferred steps">${reportedCount} sourced · ${inferredCount} inferred</span>
            </span>
            <span class="uncertainty-pill is-${uncertainty.tone}">${escapeHtml(uncertainty.short)}</span>
          </span>
        </button>
      `;
    })
    .join("");
}

/* -------------------------------------------------------------------------- */
/* Detail renderers                                                           */
/* -------------------------------------------------------------------------- */

function renderDetail({ force = false } = {}) {
  const opportunity = opportunities.find((candidate) => candidate.id === state.selectedId);
  if (!opportunity) {
    els.detail.hidden = true;
    els.detail.innerHTML = "";
    delete els.detail.dataset.renderedId;
    return;
  }

  if (!force && els.detail.dataset.renderedId === opportunity.id) {
    return;
  }

  const rank = rankById.get(opportunity.id);
  const score = priorityScore(opportunity);
  const uncertainty = uncertaintyFor(opportunity);
  const sourceIds = sourceIdsFor(opportunity);
  const reportedCount = opportunity.path.filter((node) => node.kind === "reported").length;
  const inferredCount = opportunity.path.filter((node) => node.kind === "inferred").length;

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const ringOffset = circumference * (1 - score / 100);

  const pathMarkup = opportunity.path
    .map((node, index) => {
      const isReported = node.kind === "reported";
      const sourceLinks = isReported
        ? (node.sources ?? [])
            .map((id) => {
              const source = sourceById.get(id);
              if (!source) return "";
              return `
                <a
                  class="node-source"
                  href="${escapeHtml(source.url)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open source: ${escapeHtml(source.title)}"
                >
                  ${escapeHtml(source.short)}<span aria-hidden="true">↗</span>
                </a>
              `;
            })
            .join("")
        : "";

      const nodeFooter = isReported
        ? `<span class="node-sources">${sourceLinks}</span>`
        : `<span class="node-inference"><i aria-hidden="true"></i>System-inferred · validate locally</span>`;

      const nodeMarkup = `
        <article class="path-node path-node--${node.kind} ${node.phase === "Opportunity" ? "is-leverage" : ""}">
          <span class="node-meta">
            <span class="node-phase">${pad(index + 1)} · ${escapeHtml(node.phase)}</span>
            <span class="status-badge status-badge--${node.kind}">
              <span class="badge-dot" aria-hidden="true"></span>${isReported ? "Source-supported" : "System-inferred"}
            </span>
          </span>
          <span class="node-domain">
            <i class="domain-dot domain-dot--${domainTone(node.domain)}" aria-hidden="true"></i>
            ${escapeHtml(node.domain)}
          </span>
          <h4>${escapeHtml(node.title)}</h4>
          <p>${escapeHtml(node.claim)}</p>
          ${nodeFooter}
        </article>
      `;

      const edgeMarkup = node.edge
        ? `
          <div class="path-edge" aria-hidden="true">
            <span class="edge-label">${escapeHtml(node.edge)}</span>
            <span class="edge-line"></span>
          </div>
        `
        : "";

      return nodeMarkup + edgeMarkup;
    })
    .join("");

  const domainMarkup = opportunity.domains
    .map((domain) => `<span class="domain-chip">${escapeHtml(domain)}</span>`)
    .join("");

  els.detail.setAttribute("aria-labelledby", "detail-heading");
  els.detail.dataset.renderedId = opportunity.id;
  els.detail.hidden = false;

  els.detail.innerHTML = `
    <div class="detail-shell">
      <div class="detail-kicker">
        <span>Priority ${pad(rank)} / ${pad(opportunities.length)}</span>
        <span class="kicker-separator" aria-hidden="true"></span>
        <span>${escapeHtml(opportunity.track)}</span>
        <span class="sample-tag">Local sample</span>
      </div>

      <div class="detail-header">
        <div class="detail-title-block">
          <h2 id="detail-heading">${escapeHtml(opportunity.title)}</h2>
          <div class="detail-domains">${domainMarkup}</div>
          <div class="hypothesis-block">
            <span class="micro-label">Hypothesis</span>
            <p>${escapeHtml(opportunity.hypothesis)}</p>
          </div>
          <div class="detail-stats">
            <span><strong>${reportedCount}</strong> source-supported anchors</span>
            <span><strong>${inferredCount}</strong> system-inferred steps</span>
            <span><strong>${sourceIds.length}</strong> sources</span>
          </div>
        </div>

        <aside class="score-card" aria-label="Priority score">
          <div class="score-ring-wrap">
            <svg class="score-ring" viewBox="0 0 132 132" aria-hidden="true">
              <defs>
                <linearGradient id="ringGradient-${escapeHtml(opportunity.id)}" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#2d7a5a"></stop>
                  <stop offset="100%" stop-color="#d4653a"></stop>
                </linearGradient>
              </defs>
              <circle class="score-ring-track" cx="66" cy="66" r="${radius}"></circle>
              <circle
                class="score-ring-progress"
                cx="66"
                cy="66"
                r="${radius}"
                stroke="url(#ringGradient-${escapeHtml(opportunity.id)})"
                style="--ring-circumference:${circumference.toFixed(
                  2,
                )};--ring-offset:${ringOffset.toFixed(2)}"
              ></circle>
            </svg>
            <div class="score-ring-label">
              <strong>${score}</strong>
              <span>/100</span>
            </div>
          </div>
          <div class="score-meta">
            <p class="score-caption">Priority score</p>
            <p class="score-subcaption">Higher = more worth testing. Not a chance of success.</p>
          </div>
          <div class="detail-actions">
            <button class="action-button action-button--primary" type="button" data-copy-brief>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <rect x="7" y="7" width="9" height="9" rx="1.5"></rect>
                <path d="M5.5 13H4.8A1.8 1.8 0 0 1 3 11.2V4.8A1.8 1.8 0 0 1 4.8 3h6.4A1.8 1.8 0 0 1 13 4.8v.7"></path>
              </svg>
              Copy brief
            </button>
            <button class="action-button" type="button" data-download-brief>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 3v9m0 0 3.2-3.2M10 12 6.8 8.8M4 15.5h12"></path>
              </svg>
              Download .md
            </button>
          </div>
        </aside>
      </div>

      <section class="path-section" aria-labelledby="path-title">
        <div class="path-head">
          <div>
            <span class="micro-label">Reasoning surface</span>
            <h3 id="path-title">Evidence path</h3>
          </div>
          <div class="legend" aria-label="Path legend">
            <span class="legend-item">
              <i class="legend-swatch legend-swatch--reported" aria-hidden="true"></i>
              <span>Source-supported <small>from a linked source</small></span>
            </span>
            <span class="legend-item">
              <i class="legend-swatch legend-swatch--inferred" aria-hidden="true"></i>
              <span>System-inferred <small>a testable hypothesis</small></span>
            </span>
          </div>
        </div>

        <div class="path-scroller" tabindex="0" role="region" aria-label="Evidence path for ${escapeHtml(
          opportunity.title,
        )}">
          <div class="path">${pathMarkup}</div>
        </div>

        <p class="path-caption">
          Arrows show the flow of reasoning, not causation. Source links open the original
          publisher material. System-inferred nodes are the leap this sample proposes to test.
        </p>
      </section>

      <div class="guardrail" role="note">
        <span class="guardrail-icon" aria-hidden="true">!</span>
        <p>
          <strong>Hypothesis path — not causal proof.</strong>
          Source-supported nodes summarize linked sources; system-inferred nodes are the sample's
          synthesis. Income, housing, behavior, and measurement choices can confound the pattern.
        </p>
        <button class="guardrail-link" type="button" data-dialog="method">Read the method</button>
      </div>

      <div class="panel-grid">
        ${scorePanelMarkup(opportunity)}
        ${uncertaintyPanelMarkup(opportunity, uncertainty)}
        ${risksPanelMarkup(opportunity)}
        ${testPanelMarkup(opportunity)}
      </div>

      ${sourcesPanelMarkup(sourceIds)}
    </div>
  `;
}

function scorePanelMarkup(opportunity) {
  const weighted = weightedScore(opportunity);
  const risk = opportunity.scores.risk;
  const score = priorityScore(opportunity);

  const rows = meta.weights
    .map((component) => {
      const value = opportunity.scores[component.key];
      const contribution = value * component.weight;
      return `
        <div class="score-row">
          <div class="score-row-head">
            <span class="score-row-label">
              ${escapeHtml(component.label)}
              <span class="weight-chip">${Math.round(component.weight * 100)}%</span>
            </span>
            <span class="score-row-value"><strong>${value}</strong><span>+${contribution.toFixed(1)}</span></span>
          </div>
          <div class="score-bar" aria-hidden="true"><span style="width:${value}%"></span></div>
        </div>
      `;
    })
    .join("");

  const formula = `${meta.weights
    .map((component) => `${component.weight.toFixed(2)}×${opportunity.scores[component.key]}`)
    .join(" + ")} − ${risk.toFixed(1)} = ${(weighted - risk).toFixed(1)} → ${score}`;

  return `
    <section class="panel panel--score" aria-labelledby="score-panel-title">
      <div class="panel-head">
        <div>
          <span class="micro-label">Transparent score</span>
          <h3 id="score-panel-title">Why this ranks here</h3>
        </div>
        <span class="formula-chip">Rubric v0.1</span>
      </div>

      <div class="score-rows">${rows}</div>
      <div class="score-row score-row--risk">
        <div class="score-row-head">
          <span class="score-row-label">Risk drag <span class="weight-chip">0–${meta.riskPenaltyMax}</span></span>
          <span class="score-row-value score-row-value--negative"><strong>−${risk.toFixed(1)}</strong></span>
        </div>
      </div>

      <div class="score-total">
        <span>
          <small>Weighted total</small>
          ${weighted.toFixed(1)} − ${risk.toFixed(1)} risk
        </span>
        <strong>${score}<small>/100</small></strong>
      </div>

      <code class="formula-line">${escapeHtml(formula)}</code>
      <p class="panel-footnote">
        Fixed weights, visible inputs, one risk penalty. A higher score means a higher-priority
        test — not a higher chance of success.
      </p>
    </section>
  `;
}

function uncertaintyPanelMarkup(opportunity, uncertainty) {
  const certainty = opportunity.scores.certainty;
  const unknowns = opportunity.unknowns
    .map((unknown) => `<li>${escapeHtml(unknown)}</li>`)
    .join("");

  return `
    <section class="panel panel--uncertainty" aria-labelledby="uncertainty-panel-title">
      <div class="panel-head">
        <div>
          <span class="micro-label">Uncertainty</span>
          <h3 id="uncertainty-panel-title">${escapeHtml(uncertainty.label)}</h3>
        </div>
        <span class="certainty-number">${certainty}<small>/100</small></span>
      </div>

      <div class="certainty-meter" aria-hidden="true">
        <span class="certainty-marker" style="left:${certainty}%"></span>
      </div>
      <div class="certainty-scale" aria-hidden="true">
        <span>Less certain</span>
        <span>More certain</span>
      </div>

      <p class="panel-intro">${escapeHtml(opportunity.uncertaintyNote)}</p>

      <h4 class="panel-subhead">What we don't know</h4>
      <ul class="unknown-list">${unknowns}</ul>

      <p class="panel-footnote">
        Certainty reflects the whole path, not just individual source quality.
      </p>
    </section>
  `;
}

function risksPanelMarkup(opportunity) {
  const risks = opportunity.risks
    .map(
      (risk) => `
        <div class="risk-item">
          <div class="risk-top">
            <span class="severity severity--${escapeHtml(risk.severity.toLowerCase())}">${escapeHtml(
              risk.severity,
            )}</span>
            <strong>${escapeHtml(risk.title)}</strong>
          </div>
          <p>${escapeHtml(risk.detail)}</p>
          <p class="mitigation"><span>Mitigation</span>${escapeHtml(risk.mitigation)}</p>
        </div>
      `,
    )
    .join("");

  return `
    <section class="panel panel--risks" aria-labelledby="risks-panel-title">
      <div class="panel-head">
        <div>
          <span class="micro-label">Risks</span>
          <h3 id="risks-panel-title">What could break this</h3>
        </div>
        <span class="count-pill">${opportunity.risks.length} identified</span>
      </div>
      <div class="risk-list">${risks}</div>
    </section>
  `;
}

function testPanelMarkup(opportunity) {
  const measures = opportunity.test.measures
    .map((measure) => `<span class="measure-chip">${escapeHtml(measure)}</span>`)
    .join("");

  return `
    <section class="panel panel--test" aria-labelledby="test-panel-title">
      <div class="panel-head">
        <div>
          <span class="micro-label">Next experiment</span>
          <h3 id="test-panel-title">${escapeHtml(opportunity.test.title)}</h3>
        </div>
        <span class="time-pill">${escapeHtml(opportunity.test.timeframe)}</span>
      </div>

      <p class="test-design">${escapeHtml(opportunity.test.design)}</p>

      <div class="measure-block">
        <span class="measure-label">What we would measure</span>
        <div class="measure-chips">${measures}</div>
      </div>

      <div class="kill-criteria">
        <span>Kill criteria</span>
        <p>${escapeHtml(opportunity.test.killCriteria)}</p>
      </div>
    </section>
  `;
}

function sourceRowMarkup(source, index) {
  return `
    <a
      class="source-row"
      href="${escapeHtml(source.url)}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open source: ${escapeHtml(source.title)}"
    >
      <span class="source-number">${pad(index + 1)}</span>
      <span class="source-body">
        <span class="source-title">${escapeHtml(source.title)}</span>
        <span class="source-meta">${escapeHtml(source.publisher)} · ${escapeHtml(
          source.year,
        )} · ${escapeHtml(source.type)}</span>
        <span class="source-summary">${escapeHtml(source.summary)}</span>
      </span>
      <span class="source-side">
        <span class="strength-pill strength--${strengthClass(source.strength)}">${escapeHtml(
          source.strength,
        )}</span>
        <span class="source-arrow" aria-hidden="true">↗</span>
      </span>
    </a>
  `;
}

function sourcesPanelMarkup(sourceIds) {
  const rows = sourceIds
    .map((id) => sourceById.get(id))
    .filter(Boolean)
    .map((source, index) => sourceRowMarkup(source, index))
    .join("");

  return `
    <section class="sources-panel" aria-labelledby="sources-panel-title">
      <div class="panel-head">
        <div>
          <span class="micro-label">Evidence ledger</span>
          <h3 id="sources-panel-title">Sources behind this path</h3>
        </div>
        <span class="count-pill">${sourceIds.length} sources</span>
      </div>
      <div class="source-list">${rows}</div>
      <p class="source-note">
        Source claims are paraphrased. Follow the links for original context and limitations.
        Strength labels are editorial judgments for this sample, not a formal evidence grade.
      </p>
    </section>
  `;
}

/* -------------------------------------------------------------------------- */
/* Dialogs                                                                    */
/* -------------------------------------------------------------------------- */

const SHORT_LABELS = {
  "canopy-index": "Canopy index",
  "senior-cool-bundles": "Senior housing",
  "shade-school-routes": "School routes",
  "overnight-cool-refuge": "Overnight refuge",
  "out-of-scope": "Outside sample",
};

function modelCardMarkup() {
  const evaluation = getEvaluation();
  const labels = Object.keys(evaluation.confusion);
  const header = labels.map((label) => `<th scope="col">${escapeHtml(SHORT_LABELS[label] ?? label)}</th>`).join("");
  const rows = labels
    .map(
      (actual) => `
        <tr>
          <th scope="row">${escapeHtml(SHORT_LABELS[actual] ?? actual)}</th>
          ${labels
            .map((guess) => {
              const n = evaluation.confusion[actual][guess];
              const cls = actual === guess ? "is-hit" : n ? "is-miss" : "";
              return `<td class="${cls}">${n}</td>`;
            })
            .join("")}
        </tr>`,
    )
    .join("");
  const oos = evaluation.perClass["out-of-scope"];

  return `
    <section class="modal-section model-card">
      <div class="modal-section-head">
        <h3>Model card</h3>
        <span class="formula-chip">Trained by us · runs in your browser</span>
      </div>
      <dl class="model-card-facts">
        <div><dt>Model</dt><dd>${escapeHtml(modelInfo.type)}, written from scratch</dd></div>
        <div><dt>Training data</dt><dd>${modelInfo.examples} hand-written, fictional resident concerns in ${modelInfo.classes} classes</dd></div>
        <div><dt>Vocabulary</dt><dd>${modelInfo.vocabulary.toLocaleString()} words and word pairs</dd></div>
        <div><dt>Accuracy</dt><dd><strong>${Math.round(evaluation.accuracy * 100)}%</strong> (${evaluation.correct}/${evaluation.total}), leave-one-out: each example is tested on a model trained without it</dd></div>
      </dl>
      <p>Rows are the true label, columns are what the model guessed. Green is correct.</p>
      <div class="confusion-wrap">
        <table class="confusion">
          <thead><tr><th scope="col">True ↓ / guessed →</th>${header}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p>
        <strong>Known weakness:</strong> it spots off-topic concerns only ${oos.correct} of ${oos.total}
        times, because "everything else" is hard to learn from a few examples. So the agent adds
        three checks around the model: a scope rule (the concern must mention heat, sun, shade,
        cooling, or trees), a minimum number of recognized words, and a 40% confidence floor.
        Vague concerns are also sensitive to wording, which is why the agent asks a question when it is unsure.
      </p>
    </section>
  `;
}

function renderMethodDialog() {
  const weightRows = meta.weights
    .map(
      (component, index) => `
        <div class="weight-row">
          <span class="weight-index">${pad(index + 1)}</span>
          <div class="weight-info">
            <strong>${escapeHtml(component.label)}</strong>
            <p>${escapeHtml(component.description)}</p>
          </div>
          <span class="weight-value">${Math.round(component.weight * 100)}%</span>
        </div>
      `,
    )
    .join("");

  els.methodContent.innerHTML = `
    <p class="modal-lede">
      Butterfly Effect starts with a community concern, then looks for possible links to wider
      problems and source-linked opportunities. The goal is not to prove a cause. It is to give a
      community team a clearer, more honest place to start investigating.
    </p>

    <div class="pipeline-grid">
      <article class="pipeline-card">
        <span class="pipeline-index">01</span>
        <h3>Share what you see</h3>
        <p>Describe the concern, who or where it affects, and any context or ideas you already have.</p>
      </article>
      <article class="pipeline-card">
        <span class="pipeline-index">02</span>
        <h3>Our model reads it</h3>
        <p>A classifier we trained ourselves picks the closest of four paths, or none. If it is torn between two, the agent asks you first.</p>
      </article>
      <article class="pipeline-card">
        <span class="pipeline-index">03</span>
        <h3>Separate the claims</h3>
        <p>Keep community input, source-supported claims, and system-inferred hypotheses visibly distinct.</p>
      </article>
      <article class="pipeline-card">
        <span class="pipeline-index">04</span>
        <h3>Test one next step</h3>
        <p>End with a practical experiment, its uncertainty, and the risks that could break it.</p>
      </article>
    </div>

    ${modelCardMarkup()}

    <section class="modal-section">
      <div class="modal-section-head">
        <h3>The scoring rubric</h3>
        <span class="formula-chip">Fixed weights</span>
      </div>
      <p>
        In plain language: a higher priority score means this idea may be <strong>more worth
        testing sooner</strong>. It does not mean the intervention will work, or that most people
        would benefit. Each component is scored 0–100, weight-adjusted, then reduced by a risk drag
        of 0–${meta.riskPenaltyMax}.
      </p>
      <div class="weights-list">${weightRows}</div>
      <div class="formula-card">
        <span>Priority score</span>
        <code>0.30 × evidence + 0.20 × impact + 0.15 × novelty + 0.20 × feasibility + 0.15 × certainty − risk drag</code>
        <p>${escapeHtml(meta.scoreNote)}</p>
      </div>
    </section>

    <section class="modal-section">
      <h3>Three kinds of information</h3>
      <div class="definition-grid definition-grid--three">
        <div class="definition definition--community">
          <span class="info-label info-label--community">Community input</span>
          <h4>What a person or group shared</h4>
          <p>
            Firsthand context from the concern form. It is important local knowledge, but it has
            not been independently checked by this demo.
          </p>
        </div>
        <div class="definition definition--source">
          <span class="info-label info-label--source">Source-supported</span>
          <h4>What a linked source says</h4>
          <p>
            A paraphrase of a real publisher or study. The link supports that individual claim —
            not the concern match, the proposed cause, or the intervention.
          </p>
        </div>
        <div class="definition definition--inferred">
          <span class="info-label info-label--inferred">System-inferred</span>
          <h4>What the sample suggests might follow</h4>
          <p>
            Rule-based matching and synthesis that goes beyond any single source. It is a testable
            hypothesis — not evidence, and not a causal conclusion.
          </p>
        </div>
      </div>
    </section>

    <section class="modal-section">
      <h3>What this demo is — and isn't</h3>
      <ul class="limits-list">
        <li><strong>It works offline.</strong> The concern matcher is a small local keyword rule. There are no live model, retrieval, geospatial, or API calls.</li>
        <li><strong>It's a sample, not a local study.</strong> The dataset covers four opportunity paths in urban heat, health, shade, and housing. A concern outside that scope is shown as a no-match.</li>
        <li><strong>It's not causal inference.</strong> Scores are analyst judgments on a fixed rubric, not statistical estimates.</li>
        <li><strong>It doesn't invent evidence.</strong> Source links are real reference material. The sample does not generate new studies, statistics, or impact claims.</li>
        <li><strong>It's intentionally falsifiable.</strong> Every opportunity includes unknowns, risks, and kill criteria.</li>
      </ul>
    </section>

    <div class="modal-disclaimer">
      <strong>The guardrail stays on.</strong>
      A match is a suggestion to investigate, not a verified cause or a guaranteed solution. Before
      acting, speak with affected residents, check local conditions, and review the original
      sources. Community context and local validation always come next.
    </div>
  `;
}

function renderEvidenceLibrary() {
  const libraryItems = sources
    .map((source, index) => {
      const usedBy = opportunities.filter((opportunity) =>
        sourceIdsFor(opportunity).includes(source.id),
      );
      const usage = usedBy
        .map(
          (opportunity) =>
            `<button class="usage-chip" type="button" data-jump="${escapeHtml(
              opportunity.id,
            )}">${escapeHtml(opportunity.shortTitle)}</button>`,
        )
        .join("");

      return `
        <article class="library-item">
          <span class="library-index">${pad(index + 1)}</span>
          <div class="library-body">
            <div class="library-title-row">
              <h3>
                <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">
                  ${escapeHtml(source.title)}<span aria-hidden="true">↗</span>
                </a>
              </h3>
              <span class="strength-pill strength--${strengthClass(source.strength)}">${escapeHtml(
                source.strength,
              )}</span>
            </div>
            <p class="library-meta">${escapeHtml(source.publisher)} · ${escapeHtml(
              source.year,
            )} · ${escapeHtml(source.type)}</p>
            <p class="library-summary">${escapeHtml(source.summary)}</p>
            <div class="library-used">
              <span>Used in</span>
              ${usage}
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  els.evidenceContent.innerHTML = `
    <p class="modal-lede">
      Every source-supported path anchor traces to one of these ${sources.length} real sources.
      Open a source to inspect the original material. These links support individual claims in the
      sample — not a concern match, a suggested shared cause, or an intervention. Strength labels
      are editorial judgments, not a formal GRADE rating.
    </p>
    <div class="library-note-strip">
      <span><i class="legend-swatch legend-swatch--reported"></i> Source-supported claims only</span>
      <span>Claims are paraphrased</span>
      <span>Local sample · ${escapeHtml(meta.updated)}</span>
    </div>
    <div class="library-list">${libraryItems}</div>
    <p class="source-note">
      This is not a systematic review or an exhaustive literature search. The library is a small,
      transparent sample designed to make the evidence model inspectable. Butterfly Effect does not
      invent sources or impact claims.
    </p>
  `;
}

function openDialog(name) {
  const dialog = $(`#${name}-dialog`);
  if (!dialog || dialog.open) return;
  dialog.showModal();
  document.body.classList.add("modal-open");
}

function closeDialog(dialog) {
  if (!dialog || !dialog.open) return;
  dialog.close();
}

function resetBrowseTo(id) {
  state.filter = "all";
  state.query = "";
  state.sort = "priority";
  state.selectedId = id;
  els.search.value = "";
  els.sort.value = "priority";
  syncFilterState();
  refreshView();
  updateHash(id);
}

/* -------------------------------------------------------------------------- */
/* Community concern intake and discovery                                     */
/* -------------------------------------------------------------------------- */

function readConcernForm() {
  return {
    concern: els.concernText.value.trim(),
    who: els.concernWho.value.trim(),
    context: els.concernContext.value.trim(),
  };
}

function setFieldError(field, errorElement, message) {
  if (!field || !errorElement) return;
  if (message) {
    errorElement.textContent = message;
    errorElement.hidden = false;
    field.setAttribute("aria-invalid", "true");
    field.classList.add("is-invalid");
  } else {
    errorElement.textContent = "";
    errorElement.hidden = true;
    field.removeAttribute("aria-invalid");
    field.classList.remove("is-invalid");
  }
}

function clearConcernErrors() {
  setFieldError(els.concernText, els.concernTextError, "");
  setFieldError(els.concernWho, els.concernWhoError, "");
  if (els.concernErrorSummary) {
    els.concernErrorSummary.textContent = "";
    els.concernErrorSummary.hidden = true;
  }
}

function validateConcern(values) {
  const errors = [];

  if (values.concern.length < 12) {
    errors.push({
      field: els.concernText,
      element: els.concernTextError,
      message: "Please describe what is happening in a little more detail.",
    });
  }

  if (values.who.length < 3) {
    errors.push({
      field: els.concernWho,
      element: els.concernWhoError,
      message: "Please say who or where this affects — even a general description helps.",
    });
  }

  return errors;
}

function fillConcernFields(values) {
  els.concernText.value = values.concern ?? "";
  els.concernWho.value = values.who ?? "";
  els.concernContext.value = values.context ?? "";
  clearConcernErrors();
}

function sourceLabelFor(concern) {
  if (concern.source === "sample") {
    return {
      className: "info-label--sample",
      label: "Sample input",
      note: "Fictional composite · for demo",
      privacy: "This is a made-up example. Nothing was sent or saved.",
    };
  }
  if (concern.source === "example") {
    return {
      className: "info-label--sample",
      label: "Example input",
      note: "Fictional example · for demo",
      privacy: "This is a made-up example. Nothing was sent or saved.",
    };
  }
  return {
    className: "info-label--community",
    label: "Community input",
    note: "Not independently verified",
    privacy: "This text stays in your browser. It is not stored or sent anywhere.",
  };
}

function concernRecapMarkup(concern) {
  const source = sourceLabelFor(concern);

  return `
    <section class="concern-recap" aria-labelledby="concern-recap-title">
      <div class="concern-recap-head">
        <div>
          <span class="info-label ${source.className}">${escapeHtml(source.label)}</span>
          <h3 id="concern-recap-title">The concern you shared</h3>
        </div>
        <span class="sample-flag">${escapeHtml(source.note)}</span>
      </div>
      <blockquote>${escapeHtml(concern.concern)}</blockquote>
      <dl class="concern-facts">
        <div>
          <dt>Who and where</dt>
          <dd>${escapeHtml(concern.who)}</dd>
        </div>
        ${
          concern.context
            ? `<div>
                <dt>Context or ideas</dt>
                <dd>${escapeHtml(concern.context)}</dd>
              </div>`
            : ""
        }
      </dl>
      <p class="concern-privacy">${escapeHtml(source.privacy)}</p>
    </section>
  `;
}

function cueChipsMarkup(cues) {
  return cues.map((cue) => `<span class="cue-chip">${escapeHtml(cue)}</span>`).join("");
}

function matchNoteMarkup(cueLabels, matchCount) {
  const uniqueCues = [...new Set(cueLabels)];
  const cueMarkup = uniqueCues.length
    ? `<div class="cue-chips" aria-label="Topic clues that overlapped">${cueChipsMarkup(
        uniqueCues,
      )}</div>`
    : `<p class="cue-empty">No topic clues crossed the sample's matching threshold.</p>`;

  return `
    <aside class="match-note" aria-label="How the suggestion was made">
      <div class="match-note-head">
        <div>
          <span class="info-label info-label--inferred">How this was matched</span>
          <h3>Rule-based, local, and deliberately small</h3>
        </div>
        <span class="local-chip">No AI model · no internet request</span>
      </div>
      <p>
        Butterfly Effect compared the words you shared with hand-written topic clues for the four
        sample opportunities. ${
          matchCount
            ? "A word overlap is only a prompt to investigate — it is not evidence that the concern has this cause."
            : "Because no clue overlapped enough, the demo is not going to force a result."
        }
      </p>
      ${cueMarkup}
    </aside>
  `;
}

function miniSourceMarkup(source) {
  return `
    <a
      class="mini-source"
      href="${escapeHtml(source.url)}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open source: ${escapeHtml(source.title)}"
    >
      <strong>${escapeHtml(source.short)} <span aria-hidden="true">↗</span></strong>
      <span>${escapeHtml(source.publisher)} · ${escapeHtml(source.year)}</span>
      <small>${escapeHtml(source.strength)}</small>
    </a>
  `;
}

function relatedSignalsMarkup(opportunity) {
  return opportunity.path
    .filter((node) => node.kind === "reported")
    .map(
      (node) => `
        <li>
          <span class="signal-domain">${escapeHtml(node.domain)}</span>
          <strong>${escapeHtml(node.title)}</strong>
          <p>${escapeHtml(node.claim)}</p>
        </li>
      `,
    )
    .join("");
}

function risksMarkup(opportunity) {
  return opportunity.risks
    .slice(0, 2)
    .map(
      (risk) => `
        <div class="mini-risk">
          <div class="mini-risk-head">
            <span class="severity severity--${escapeHtml(risk.severity.toLowerCase())}">${escapeHtml(
              risk.severity,
            )}</span>
            <strong>${escapeHtml(risk.title)}</strong>
          </div>
          <p>${escapeHtml(risk.detail)}</p>
          <p class="mitigation"><span>Mitigation</span>${escapeHtml(risk.mitigation)}</p>
        </div>
      `,
    )
    .join("");
}

function connectionMarkup(match) {
  const opportunity = opportunityById.get(match.opportunityId);
  if (!opportunity) return "";

  const gap = opportunity.path.find((node) => node.phase === "Gap");
  const intervention = opportunity.path.find((node) => node.phase === "Opportunity");
  const score = priorityScore(opportunity);
  const uncertainty = uncertaintyFor(opportunity);
  const sourceIds = sourceIdsFor(opportunity);
  const uniqueSources = sourceIds.map((id) => sourceById.get(id)).filter(Boolean);
  const sourceMarkup = uniqueSources.map(miniSourceMarkup).join("");
  const measures = opportunity.test.measures.slice(0, 3);
  const topSources = uniqueSources
    .slice(0, 5)
    .map((source) => source.short)
    .join(", ");

  return `
    <article class="connection-card" aria-labelledby="connection-${escapeHtml(opportunity.id)}">
      <header class="connection-head">
        <div class="connection-heading">
          <div class="connection-badges">
            <span class="info-label info-label--inferred">Suggested connection · system-inferred</span>
            <span class="match-strength match-strength--${escapeHtml(match.strength.id)}">
              ${escapeHtml(match.strength.label)}
            </span>
          </div>
          <h3 id="connection-${escapeHtml(opportunity.id)}">${escapeHtml(opportunity.title)}</h3>
          <p class="connection-tagline">${escapeHtml(opportunity.tagline)}</p>
          <div class="connection-clues">
            <span>Matched topic clues</span>
            ${cueChipsMarkup(match.cueLabels)}
          </div>
        </div>
        <div class="connection-score" aria-label="Priority score ${score} out of 100">
          <strong>${score}<small>/100</small></strong>
          <span>Priority score</span>
          <p>Higher means more worth testing — not a chance of success.</p>
        </div>
      </header>

      <div class="connection-grid">
        <section class="connection-block">
          <span class="info-label info-label--inferred">System-inferred</span>
          <h4>Possible shared cause or gap</h4>
          <p>${gap ? `<strong>${escapeHtml(gap.title)}.</strong> ${escapeHtml(gap.claim)}` : "This sample does not include a shared-cause step for this opportunity."}</p>
        </section>

        <section class="connection-block">
          <span class="info-label info-label--source">Source-supported</span>
          <h4>Related problems the sources describe</h4>
          <ul class="signal-list">${relatedSignalsMarkup(opportunity)}</ul>
        </section>

        <section class="connection-block">
          <span class="info-label info-label--inferred">System-inferred</span>
          <h4>Potential intervention to test</h4>
          <p>${intervention ? `<strong>${escapeHtml(intervention.title)}.</strong> ${escapeHtml(intervention.claim)}` : "This sample does not include an intervention step for this opportunity."}</p>
        </section>

        <section class="connection-block connection-block--sources">
          <span class="info-label info-label--source">Source-supported</span>
          <h4>Supporting sources</h4>
          <div class="mini-source-list">${sourceMarkup}</div>
          <p class="source-caveat">
            These links support the individual related problems above — not the concern match,
            the suggested shared cause, or the intervention. ${topSources ? `Included: ${escapeHtml(topSources)}.` : ""}
          </p>
        </section>
      </div>

      <section class="next-step" aria-labelledby="next-step-${escapeHtml(opportunity.id)}">
        <div class="next-step-head">
          <div>
            <span class="info-label info-label--action">One practical next step</span>
            <h4 id="next-step-${escapeHtml(opportunity.id)}">${escapeHtml(opportunity.test.title)}</h4>
          </div>
          <span class="time-pill">${escapeHtml(opportunity.test.timeframe)}</span>
        </div>
        <p class="test-design">${escapeHtml(opportunity.test.design)}</p>
        <div class="next-step-measures">
          <span>What to measure</span>
          ${measures.map((measure) => `<span class="measure-chip">${escapeHtml(measure)}</span>`).join("")}
        </div>
        <p class="kill-note"><strong>Stop or redesign if:</strong> ${escapeHtml(opportunity.test.killCriteria)}</p>
        <div class="next-step-actions">
          <button class="button button-primary" type="button" data-open-opportunity="${escapeHtml(opportunity.id)}">
            Open the full evidence path <span aria-hidden="true">↓</span>
          </button>
          <button class="button button-ghost" type="button" data-dialog="method">
            How scoring works
          </button>
        </div>
      </section>

      <div class="connection-caution-grid">
        <section class="caution-block" aria-labelledby="uncertainty-${escapeHtml(opportunity.id)}">
          <span class="info-label info-label--inferred">Uncertainty</span>
          <h4 id="uncertainty-${escapeHtml(opportunity.id)}">${escapeHtml(uncertainty.label)}</h4>
          <p>${escapeHtml(opportunity.uncertaintyNote)}</p>
          <ul class="unknown-list">
            ${opportunity.unknowns
              .slice(0, 2)
              .map((unknown) => `<li>${escapeHtml(unknown)}</li>`)
              .join("")}
          </ul>
          <p class="certainty-plain">Certainty ${opportunity.scores.certainty}/100 across the whole path — not just the sources.</p>
        </section>

        <section class="caution-block caution-block--risk" aria-labelledby="risk-${escapeHtml(opportunity.id)}">
          <span class="info-label info-label--caution">Risks to watch</span>
          <h4 id="risk-${escapeHtml(opportunity.id)}">What could break this</h4>
          <div class="mini-risk-list">${risksMarkup(opportunity)}</div>
        </section>
      </div>

      <p class="connection-guardrail">
        <strong>Keep this in perspective.</strong> This is a sample-data suggestion from a small model
        trained on example concerns. It is not a verified cause, a diagnosis, or a guaranteed solution. A real next step
        would involve affected residents, local experts, and local data.
      </p>
    </article>
  `;
}

function otherThreadsMarkup(matches) {
  if (!matches.length) return "";

  const cards = matches
    .map((match) => {
      const opportunity = opportunityById.get(match.opportunityId);
      if (!opportunity) return "";
      const gap = opportunity.path.find((node) => node.phase === "Gap");
      return `
        <article class="thread-card">
          <div class="thread-card-top">
            <span class="info-label info-label--inferred">Also possible · system-inferred</span>
            <span class="thread-score">${priorityScore(opportunity)}<small>/100</small></span>
          </div>
          <h4>${escapeHtml(opportunity.title)}</h4>
          <p>${escapeHtml(opportunity.tagline)}</p>
          <div class="thread-clues">
            <span>Matched</span>
            ${cueChipsMarkup(match.cueLabels)}
          </div>
          ${gap ? `<p class="thread-gap"><strong>Possible gap:</strong> ${escapeHtml(gap.title)}.</p>` : ""}
          <button class="text-button" type="button" data-open-opportunity="${escapeHtml(opportunity.id)}">
            Review this opportunity <span aria-hidden="true">↓</span>
          </button>
        </article>
      `;
    })
    .join("");

  return `
    <section class="more-threads" aria-labelledby="more-threads-title">
      <div class="more-threads-head">
        <div>
          <span class="info-label info-label--inferred">Lower-scoring overlaps</span>
          <h3 id="more-threads-title">Other threads worth a look</h3>
        </div>
        <p>These are weaker keyword overlaps. Treat them as other questions to explore, not stronger evidence.</p>
      </div>
      <div class="thread-grid">${cards}</div>
    </section>
  `;
}

function noMatchMarkup() {
  const examples = concernExamples
    .map(
      (example) => `
        <article class="example-card">
          <h4>${escapeHtml(example.label)}</h4>
          <p>${escapeHtml(example.preview)}</p>
          <button class="text-button" type="button" data-example-id="${escapeHtml(example.id)}">
            Try this example <span aria-hidden="true">→</span>
          </button>
        </article>
      `,
    )
    .join("");

  return `
    <div class="no-match">
      <div class="no-match-lede">
        <span class="info-label info-label--caution">No sample match</span>
        <h3>Why this can happen</h3>
        <p>
          The words you shared did not overlap enough with the four opportunity paths in this local
          sample. That is not a judgment that nothing can be done. It means this demo cannot
          suggest a thread without stretching what the sample contains.
        </p>
        <p>
          This is a deliberately narrow demo. It does not invent evidence, a cause, or a source
          just to make a result appear.
        </p>
        <div class="no-match-actions">
          <a class="button button-primary" href="#portfolio">Browse the four opportunities <span aria-hidden="true">↓</span></a>
          <button class="button button-ghost" type="button" data-edit-concern>Edit my concern</button>
        </div>
      </div>

      <section class="examples" aria-labelledby="examples-title">
        <div class="examples-head">
          <div>
            <span class="info-label info-label--sample">Sample concerns</span>
            <h3 id="examples-title">Try an example to see the flow</h3>
          </div>
          <p>Each example is fictional and written to fit one of the four sample opportunities.</p>
        </div>
        <div class="example-grid">${examples}</div>
      </section>

      <aside class="scope-note">
        <h3>What would make this more useful</h3>
        <p>
          A real deployment would add more local sources, community partners, and neighborhood
          data — then involve residents in deciding which questions are worth pursuing. The demo
          stops honestly at the edge of its sample.
        </p>
      </aside>
    </div>
  `;
}

function discoveryHeadline(count) {
  if (count === 0) return "No clear sample match — yet.";
  if (count === 1) return "One possible thread to investigate.";
  if (count === 2) return "Two possible threads to investigate.";
  return `${count} possible threads to investigate.`;
}

function discoveryLede(count) {
  if (count === 0) {
    return "No match is a valid result. Here is what happened, plus a few sample concerns you can try.";
  }
  return `We found ${count} possible sample connection${
    count === 1 ? "" : "s"
  } using our own trained model. These are suggestions to investigate — not verified causes or guaranteed solutions.`;
}

function agentModeChip() {
  return `<span class="local-chip agent-chip agent-chip--live">Our own trained model · no AI API</span>`;
}

const LABEL_NAMES = {
  "out-of-scope": "Outside this sample",
};

function modelBarsMarkup(prediction) {
  if (!prediction) return "";
  return `
    <div class="model-bars" aria-label="Model probabilities">
      <span class="model-bars-title">What our model thinks</span>
      ${prediction.ranked
        .map((label) => {
          const p = prediction.probabilities[label];
          const name = LABEL_NAMES[label] ?? opportunityById.get(label)?.title ?? label;
          return `
            <div class="model-bar ${label === prediction.label ? "is-top" : ""}">
              <span class="model-bar-name">${escapeHtml(name)}</span>
              <span class="model-bar-track"><span style="width:${(p * 100).toFixed(1)}%"></span></span>
              <span class="model-bar-pct">${Math.round(p * 100)}%</span>
            </div>`;
        })
        .join("")}
      ${
        prediction.topWords?.length
          ? `<div class="cue-chips" aria-label="Words that drove the decision"><span class="model-bars-title">Words that drove it</span>${cueChipsMarkup(prediction.topWords)}</div>`
          : ""
      }
    </div>
  `;
}

function agentStepsMarkup(tools = []) {
  return `
    <ol class="agent-steps">
      ${tools
        .map(
          (tool, index) => `
            <li class="agent-step" style="--step:${index}">
              <span class="agent-step-num" aria-hidden="true">${index + 1}</span>
              <div>
                <strong>${escapeHtml(tool.name)}</strong>
                <p>${escapeHtml(tool.detail)}</p>
              </div>
            </li>
          `,
        )
        .join("")}
    </ol>
  `;
}

function agentTraceMarkup(result) {
  const brief = result.brief;
  const cited = result.sources ?? [];
  const briefMarkup = brief
    ? `
      <div class="agent-brief">
        <span class="info-label info-label--inferred">Agent brief · system-inferred</span>
        <p class="agent-brief-summary">${escapeHtml(brief.summary)}</p>
        <dl class="agent-brief-grid">
          <div><dt>Why this thread</dt><dd>${escapeHtml(brief.why)}</dd></div>
          <div><dt>What's uncertain</dt><dd>${escapeHtml(brief.uncertainty)}</dd></div>
          <div><dt>One next step</dt><dd>${escapeHtml(brief.nextStep)}</dd></div>
        </dl>
      </div>`
    : "";
  const sourcesMarkup = cited.length
    ? `<div class="agent-sources">
         <span>${brief ? "Sources the agent cited" : "Evidence the agent ranked"}</span>
         <div class="mini-source-list">${cited.map(miniSourceMarkup).join("")}</div>
       </div>`
    : "";

  return `
    <aside class="match-note agent-trace" aria-label="What the agent did">
      <div class="match-note-head">
        <div>
          <span class="info-label info-label--inferred">Agent run</span>
          <h3>How the agent investigated this</h3>
        </div>
        ${agentModeChip(result)}
      </div>
      ${agentStepsMarkup(result.tools)}
      ${modelBarsMarkup(result.prediction)}
      ${briefMarkup}
      ${sourcesMarkup}
    </aside>
  `;
}

function agentWorkingMarkup(concern) {
  return `
    <div class="discovery-shell">
      <header class="discovery-head">
        <div>
          <p class="eyebrow"><span class="eyebrow-rule"></span>Agent at work</p>
          <h2 id="discovery-title" tabindex="-1">Investigating your concern…</h2>
          <p class="discovery-lede">The agent is deciding what to check, searching the evidence library, and comparing opportunity paths.</p>
        </div>
      </header>
      ${concernRecapMarkup(concern)}
      <div class="agent-working" role="status">
        <span class="agent-spinner" aria-hidden="true"></span>
        Triage → match opportunities → search evidence → write a cited brief
      </div>
    </div>
  `;
}

function clarificationMarkup(concern, result) {
  return `
    <div class="discovery-shell">
      <header class="discovery-head">
        <div>
          <p class="eyebrow"><span class="eyebrow-rule"></span>Agent needs one detail</p>
          <h2 id="discovery-title" tabindex="-1">${escapeHtml(result.question)}</h2>
          <p class="discovery-lede">Your answer changes which evidence and interventions fit, so the agent asked instead of guessing.</p>
        </div>
        <button class="button button-ghost discovery-edit" type="button" data-edit-concern>Edit concern</button>
      </header>
      ${concernRecapMarkup(concern)}
      <div class="agent-question">
        ${result.choices
          .map(
            (choice) =>
              `<button class="button button-primary" type="button" data-agent-answer="${escapeHtml(choice)}">${escapeHtml(choice)}</button>`,
          )
          .join("")}
      </div>
      <aside class="match-note agent-trace">
        <div class="match-note-head">
          <div><span class="info-label info-label--inferred">Agent run so far</span></div>
          ${agentModeChip(result)}
        </div>
        ${agentStepsMarkup(result.tools)}
        ${modelBarsMarkup(result.prediction)}
      </aside>
    </div>
  `;
}

function renderDiscovery(concern, matches, agentResult = null) {
  const count = matches.length;

  els.discovery.innerHTML = `
    <div class="discovery-shell">
      <header class="discovery-head">
        <div>
          <p class="eyebrow"><span class="eyebrow-rule"></span>Discovery · agent result</p>
          <h2 id="discovery-title" tabindex="-1">${escapeHtml(discoveryHeadline(count))}</h2>
          <p class="discovery-lede">${escapeHtml(discoveryLede(count))}</p>
        </div>
        <button class="button button-ghost discovery-edit" type="button" data-edit-concern>
          Edit concern
        </button>
      </header>

      ${concernRecapMarkup(concern)}
      ${agentResult ? agentTraceMarkup(agentResult) : matchNoteMarkup(matches[0]?.cueLabels ?? [], count)}

      ${
        count
          ? `${connectionMarkup(matches[0])}
             ${otherThreadsMarkup(matches.slice(1))}
             <p class="discovery-scope">
               <strong>A note on this result:</strong> the model learns word patterns, not meaning. It can
               miss a real connection or surface a loose one. The sources are real; the links between
               them are the sample's hypotheses. Treat every result as a question to check with people
               who know the place.
             </p>`
          : noMatchMarkup()
      }
    </div>
  `;
}

function scrollToDiscovery() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const title = $("#discovery-title");
  if (title) title.focus({ preventScroll: true });
  els.discovery.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });
}

async function runAgentFlow(concern, settingAnswer = "") {
  const runId = (state.agentRunId = (state.agentRunId ?? 0) + 1);
  els.discovery.innerHTML = agentWorkingMarkup(concern);
  els.discovery.hidden = false;
  els.liveStatus.textContent = "The agent is investigating your concern.";
  window.requestAnimationFrame(scrollToDiscovery);

  const { concern: text, who, context } = concern;
  const result = await runAgent({ concern: text, who, context, settingAnswer });
  if (runId !== state.agentRunId) return;

  if (result.needsClarification) {
    state.pendingAgentConcern = concern;
    els.discovery.innerHTML = clarificationMarkup(concern, result);
    els.liveStatus.textContent = `The agent has a question: ${result.question}`;
    $("#discovery-title")?.focus({ preventScroll: true });
    return;
  }

  const matches = result.matches ?? [];
  const shown = settingAnswer ? { ...concern, context: [concern.context, `Exposure: ${settingAnswer}`].filter(Boolean).join(" · ") } : concern;
  renderDiscovery(shown, matches, result);
  window.dispatchEvent(new CustomEvent("butterfly:agent-result", { detail: { concern: shown, result } }));
  els.liveStatus.textContent = matches.length
    ? `The agent found ${matches.length} possible sample connection${
        matches.length === 1 ? "" : "s"
      }. These are suggestions to investigate, not verified causes.`
    : "The agent found no clear match in this sample and is offering examples instead of inventing a result.";
  window.requestAnimationFrame(scrollToDiscovery);
}

function submitConcern(source = "community", label = "") {
  const values = readConcernForm();
  clearConcernErrors();
  const errors = validateConcern(values);

  if (errors.length) {
    errors.forEach((error) => setFieldError(error.field, error.element, error.message));
    if (els.concernErrorSummary) {
      els.concernErrorSummary.textContent =
        "Please check the highlighted fields so the sample has enough to work with.";
      els.concernErrorSummary.hidden = false;
    }
    errors[0].field.focus();
    els.liveStatus.textContent =
      "The concern form needs a little more detail before it can look for connections.";
    return;
  }

  const concern = {
    ...values,
    source,
    label: label || sampleConcern.label,
  };

  state.concern = concern;
  runAgentFlow(concern);
}

function editConcern() {
  document.getElementById("share")?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start",
  });
  els.concernText.focus({ preventScroll: true });
}

function openOpportunityFromDiscovery(id) {
  const opportunity = opportunityById.get(id);
  if (!opportunity) return;

  resetBrowseTo(id);
  els.liveStatus.textContent = `Loaded ${opportunity.title}. Priority score ${priorityScore(
    opportunity,
  )} out of 100. ${uncertaintyFor(opportunity).label}.`;
  window.requestAnimationFrame(() => maybeScrollToDetail(true));
}

/* -------------------------------------------------------------------------- */
/* Brief export                                                               */
/* -------------------------------------------------------------------------- */

function buildMarkdownBrief(opportunity) {
  const rank = rankById.get(opportunity.id);
  const score = priorityScore(opportunity);
  const weighted = weightedScore(opportunity);
  const uncertainty = uncertaintyFor(opportunity);
  const sourceIds = sourceIdsFor(opportunity);
  const nodes = opportunity.path
    .map((node, index) => {
      const label = node.kind === "reported" ? "SOURCE-SUPPORTED" : "SYSTEM-INFERRED";
      const nodeSources =
        node.kind === "reported" && node.sources?.length
          ? `\n   Sources: ${node.sources
              .map((id) => {
                const source = sourceById.get(id);
                return source ? `${source.short} (${source.url})` : id;
              })
              .join("; ")}`
          : "";
      return `${index + 1}. **${label} · ${node.phase} — ${node.title}**\n   ${node.claim}${nodeSources}`;
    })
    .join("\n\n");

  const scoreRows = meta.weights
    .map((component) => {
      const value = opportunity.scores[component.key];
      const contribution = value * component.weight;
      return `| ${component.label} | ${Math.round(component.weight * 100)}% | ${value} | +${contribution.toFixed(1)} |`;
    })
    .join("\n");

  const risks = opportunity.risks
    .map(
      (risk) =>
        `- **${risk.severity} · ${risk.title}** — ${risk.detail}\n  - Mitigation: ${risk.mitigation}`,
    )
    .join("\n");

  const unknowns = opportunity.unknowns.map((unknown) => `- ${unknown}`).join("\n");
  const measures = opportunity.test.measures.map((measure) => `- ${measure}`).join("\n");
  const sourceList = sourceIds
    .map((id) => sourceById.get(id))
    .filter(Boolean)
    .map(
      (source, index) =>
        `${index + 1}. [${source.title}](${source.url}) — ${source.publisher}, ${source.year}. ${source.summary}`,
    )
    .join("\n");

  return `# ${opportunity.title}

**Butterfly Effect · opportunity brief**

- Priority: ${rank} of ${opportunities.length}
- Priority score: ${score}/100 (weighted ${weighted.toFixed(1)} − ${opportunity.scores.risk.toFixed(1)} risk drag)
- Uncertainty: ${uncertainty.label} (certainty ${opportunity.scores.certainty}/100)
- Track: ${opportunity.track}
- Domains: ${opportunity.domains.join(", ")}
- Dataset: ${meta.datasetLabel}, ${meta.updated}

> ${opportunity.hypothesis}

## Evidence path

${nodes}

## Score breakdown

| Component | Weight | Score | Contribution |
| --- | ---: | ---: | ---: |
${scoreRows}
| Risk drag | — | — | −${opportunity.scores.risk.toFixed(1)} |

**Total: ${score}/100.** ${meta.scoreNote}

## Uncertainty

${opportunity.uncertaintyNote}

${unknowns}

## Risks

${risks}

## Next experiment: ${opportunity.test.title} (${opportunity.test.timeframe})

${opportunity.test.design}

### Measures

${measures}

### Kill criteria

${opportunity.test.killCriteria}

## Sources

${sourceList}

---

This is an opportunity hypothesis, not causal proof. Source-supported nodes summarize linked sources; system-inferred nodes are the sample's synthesis. Associations may be confounded by income, housing, behavior, and measurement choices. Validate locally before making claims or investments.
`;
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

function downloadMarkdown(opportunity, markdown) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `butterfly-effect-${opportunity.id}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

let toastTimer;

function showToast(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => els.toast.classList.remove("is-visible"), 2600);
}

/* -------------------------------------------------------------------------- */
/* Static stats and events                                                    */
/* -------------------------------------------------------------------------- */

function updateStaticStats() {
  const domainCount = new Set(opportunities.flatMap((opportunity) => opportunity.domains)).size;
  $("#stat-hypotheses").textContent = String(opportunities.length);
  $("#stat-sources").textContent = String(sources.length);
  $("#stat-top-score").textContent = String(priorityScore(topOpportunity));
  $("#stat-top-name").textContent = topOpportunity.shortTitle;
  $("#stat-domains").textContent = String(domainCount);
  $("#nav-source-count").textContent = String(sources.length);
  $("#dataset-updated").textContent = meta.updated.replace("November", "Nov");
}

function bindEvents() {
  els.concernForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitConcern("community");
  });

  els.sampleConcernButton?.addEventListener("click", () => {
    fillConcernFields(sampleConcern);
    submitConcern("sample", sampleConcern.label);
  });

  els.concernText.addEventListener("input", () => {
    setFieldError(els.concernText, els.concernTextError, "");
  });

  els.concernWho.addEventListener("input", () => {
    setFieldError(els.concernWho, els.concernWhoError, "");
  });

  document.addEventListener("click", (event) => {
    const openTrigger = event.target.closest("[data-open-opportunity]");
    if (openTrigger) {
      event.preventDefault();
      openOpportunityFromDiscovery(openTrigger.dataset.openOpportunity);
      return;
    }

    const answerTrigger = event.target.closest("[data-agent-answer]");
    if (answerTrigger && state.pendingAgentConcern) {
      event.preventDefault();
      runAgentFlow(state.pendingAgentConcern, answerTrigger.dataset.agentAnswer);
      return;
    }

    const editTrigger = event.target.closest("[data-edit-concern]");
    if (editTrigger) {
      event.preventDefault();
      editConcern();
      return;
    }

    const exampleTrigger = event.target.closest("[data-example-id]");
    if (exampleTrigger) {
      event.preventDefault();
      const example = concernExamples.find(
        (candidate) => candidate.id === exampleTrigger.dataset.exampleId,
      );
      if (!example) return;
      fillConcernFields(example);
      submitConcern("example", example.label);
    }
  });

  els.filterGroup.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    state.filter = button.dataset.filter;
    syncFilterState();
    refreshView();
  });

  els.search.addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    refreshView();
  });

  els.search.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && els.search.value) {
      els.search.value = "";
      state.query = "";
      refreshView();
    }
  });

  els.sort.addEventListener("change", (event) => {
    state.sort = event.target.value;
    refreshView();
  });

  els.candidateGrid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-candidate-id]");
    if (!card) return;
    selectCandidate(card.dataset.candidateId, { scroll: true });
  });

  els.resetView.addEventListener("click", () => {
    state.query = "";
    state.filter = "all";
    state.sort = "priority";
    els.search.value = "";
    els.sort.value = "priority";
    syncFilterState();
    refreshView();
  });

  els.detail.addEventListener("click", async (event) => {
    const copyButton = event.target.closest("[data-copy-brief]");
    const downloadButton = event.target.closest("[data-download-brief]");
    const opportunity = opportunities.find((candidate) => candidate.id === state.selectedId);

    if (copyButton && opportunity) {
      const markdown = buildMarkdownBrief(opportunity);
      const copied = await copyText(markdown);
      showToast(copied ? "Opportunity brief copied to clipboard." : "Copy failed — download the .md instead.");
    }

    if (downloadButton && opportunity) {
      downloadMarkdown(opportunity, buildMarkdownBrief(opportunity));
      showToast("Markdown brief downloaded.");
    }
  });

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-dialog]");
    if (trigger) {
      event.preventDefault();
      openDialog(trigger.dataset.dialog);
      return;
    }

    const closer = event.target.closest("[data-close]");
    if (closer) {
      closeDialog(closer.closest("dialog"));
    }
  });

  $$("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
    dialog.addEventListener("close", () => {
      if (!$$("dialog").some((candidate) => candidate.open)) {
        document.body.classList.remove("modal-open");
      }
    });
  });

  els.evidenceContent.addEventListener("click", (event) => {
    const jump = event.target.closest("[data-jump]");
    if (!jump) return;
    const id = jump.dataset.jump;
    closeDialog(els.evidenceDialog);
    resetBrowseTo(id);
    const opportunity = opportunities.find((candidate) => candidate.id === id);
    if (opportunity) {
      els.liveStatus.textContent = `Loaded ${opportunity.title}. Priority score ${priorityScore(
        opportunity,
      )} out of 100.`;
    }
    window.requestAnimationFrame(() => maybeScrollToDetail(true));
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const editable = target?.closest("input, textarea, select, [contenteditable='true']");
    const dialogOpen = Boolean($("dialog[open]"));
    if (event.key === "/" && !editable && !dialogOpen && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      els.search.focus();
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Boot                                                                       */
/* -------------------------------------------------------------------------- */

renderFilters();
updateStaticStats();
renderMethodDialog();
renderEvidenceLibrary();
bindEvents();
refreshView();
