import { opportunities, sources } from "./data.js";

const STORAGE_KEY = "butterfly-community-feed-v1";
const opportunityById = new Map(opportunities.map((item) => [item.id, item]));
const sourceById = new Map(sources.map((item) => [item.id, item]));
const feed = document.querySelector("#community-feed-list");
const sharePanel = document.querySelector("#agent-share-panel");
const liveStatus = document.querySelector("#community-feed-status");
const feedLink = document.querySelector('.header-nav a[href="#community-feed"]');
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));

const seedPosts = [
  {
    id: "sample-1", opportunityId: "senior-cool-bundles", label: "Sample resident · fictional",
    concern: "My grandmother's apartment stays hot overnight, but she worries about running the air conditioner.",
    summary: "Could a trusted nearby room stay open during heat alerts, with transport and low-barrier access?",
    why: "Nighttime heat and limited cooling may make recovery difficult for older adults.",
    uncertainty: "The sources describe general heat risks; they do not establish conditions in this building or whether a refuge would be used.",
    nextStep: "Ask residents and a local community center what would make an overnight cooling option usable.",
    sourceIds: ["who-heat", "cdc-heat"], support: 8,
  },
  {
    id: "sample-2", opportunityId: "shade-school-routes", label: "Sample parent · fictional",
    concern: "The walk to school has almost no shade, and kids arrive overheated.",
    summary: "A short, shaded route pilot could test whether shade and safe crossings help families walk.",
    why: "Shade can reduce heat exposure along outdoor routes, though local use and safety need checking.",
    uncertainty: "The sample does not include local temperatures, route observations, or family feedback.",
    nextStep: "Walk the hottest route with families and mark shade gaps, crossings, and places to pause.",
    sourceIds: ["epa-trees", "who-heat"], support: 5,
  },
  {
    id: "sample-3", opportunityId: "canopy-index", label: "Sample resident · fictional",
    concern: "Our hottest blocks do not seem to be near the top of the tree planting list.",
    summary: "Compare canopy gaps with surface heat and vulnerability indicators before choosing pilot blocks.",
    why: "Canopy alone may miss other factors that shape heat risk and residents’ ability to cope.",
    uncertainty: "These indicators are proxies; block-level data may be incomplete and do not capture indoor exposure.",
    nextStep: "Review a small set of candidate blocks with residents and local data stewards.",
    sourceIds: ["epa-heat", "tree-equity"], support: 3,
  },
  {
    id: "sample-4", opportunityId: "overnight-cool-refuge", label: "Sample resident · fictional",
    concern: "The cooling centre closes before my neighbour gets off a late shift, and their room stays hot all night.",
    summary: "A trusted overnight cool refuge with transport could be tested during heat alerts.",
    why: "People without reliable home cooling may have few ways to recover from nighttime heat.",
    uncertainty: "The sample has no local information about overnight demand, transport needs, staffing, or site access.",
    nextStep: "Ask residents and trusted local sites what hours, transport, and access rules would make a pilot usable.",
    sourceIds: ["who-heat", "cdc-cooling"], support: 6,
  },
];

function readSaved() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      posts: Array.isArray(parsed.posts)
        ? parsed.posts
            .filter((post) => post && typeof post.id === "string" && typeof post.concern === "string")
            .slice(0, 40)
            .map((post) => ({
              id: post.id.slice(0, 100),
              opportunityId: typeof post.opportunityId === "string" ? post.opportunityId : null,
              label: typeof post.label === "string" ? post.label.slice(0, 80) : "Community input · not verified",
              concern: post.concern.slice(0, 1200),
              summary: typeof post.summary === "string" ? post.summary.slice(0, 1200) : "",
              why: typeof post.why === "string" ? post.why.slice(0, 1200) : "",
              uncertainty: typeof post.uncertainty === "string" ? post.uncertainty.slice(0, 1200) : "",
              nextStep: typeof post.nextStep === "string" ? post.nextStep.slice(0, 1200) : "",
              sourceIds: Array.isArray(post.sourceIds) ? post.sourceIds.filter((id) => typeof id === "string").slice(0, 8) : [],
              confidence: Number.isFinite(post.confidence) && post.confidence >= 0 && post.confidence <= 1 ? post.confidence : null,
            }))
        : [],
      reacted: parsed.reacted && typeof parsed.reacted === "object" && !Array.isArray(parsed.reacted) ? parsed.reacted : {},
    };
  } catch {
    return { posts: [], reacted: {} };
  }
}

let saved = readSaved();
let pendingAgent = null;

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    liveStatus.textContent = "This change is visible for this session, but could not be saved in this browser.";
  }
}

function communityPosts() {
  return [...saved.posts, ...seedPosts];
}

function signalsFor(opportunityId) {
  const sampleSupport = seedPosts.filter((post) => post.opportunityId === opportunityId)
    .reduce((total, post) => total + post.support, 0);
  const localPosts = saved.posts.filter((post) => post.opportunityId === opportunityId).length;
  const localReactions = communityPosts().filter((post) => post.opportunityId === opportunityId && saved.reacted[post.id]).length;
  return { sampleSupport, localPosts, localReactions, total: sampleSupport + localPosts + localReactions };
}

function signalLabel(opportunityId) {
  const { sampleSupport, localPosts, localReactions } = signalsFor(opportunityId);
  const parts = [];
  if (sampleSupport) parts.push(`${sampleSupport} fictional sample ${sampleSupport === 1 ? "signal" : "signals"}`);
  if (localPosts) parts.push(`${localPosts} local ${localPosts === 1 ? "post" : "posts"}`);
  if (localReactions) parts.push(`${localReactions} local ${localReactions === 1 ? "reaction" : "reactions"}`);
  return parts.join(" · ") || "No support signals yet";
}

function sourceLinks(ids = []) {
  return ids.map((id) => sourceById.get(id)).filter(Boolean).slice(0, 4).map((source) =>
    `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.short)} ↗</a>`
  ).join("");
}

function renderPost(post) {
  const opportunity = opportunityById.get(post.opportunityId);
  const signals = signalsFor(post.opportunityId);
  const reacted = Boolean(saved.reacted[post.id]);
  const title = opportunity?.shortTitle ?? "No matching sample opportunity";
  const ownPost = saved.posts.some((item) => item.id === post.id);
  return `<article class="social-post">
    <div class="social-post-meta"><span class="social-sample-label">${escapeHtml(post.label || "Community input · not verified")}</span><span class="social-signal-count">${escapeHtml(signalLabel(post.opportunityId))}</span></div>
    <h3 class="social-post-title">${escapeHtml(title)}</h3>
    <blockquote>${escapeHtml(post.concern)}</blockquote>
    <div class="social-brief"><span class="social-kicker">Agent brief</span>
      <p>${escapeHtml(post.summary)}</p>
      ${post.why ? `<p><strong>Why this might connect:</strong> ${escapeHtml(post.why)}</p>` : ""}
      ${post.uncertainty ? `<p><strong>Uncertainty:</strong> ${escapeHtml(post.uncertainty)}</p>` : ""}
      ${post.nextStep ? `<p><strong>Possible next step:</strong> ${escapeHtml(post.nextStep)}</p>` : ""}
      ${Number.isFinite(post.confidence) ? `<p class="social-confidence"><strong>Model class score:</strong> ${Math.round(post.confidence * 100)}% <span>(uncalibrated; not a truth probability)</span></p>` : ""}
      ${sourceLinks(post.sourceIds)}
    </div>
    <div class="social-post-actions"><button class="social-react" type="button" data-support-post="${escapeHtml(post.id)}" aria-pressed="${reacted}" aria-label="${reacted ? "Remove" : "Add"} your local response to this concern">${reacted ? "✓ Affects me too" : "+ This affects me too"}</button>
      ${ownPost ? `<button class="social-remove" type="button" data-remove-post="${escapeHtml(post.id)}">Remove my post</button>` : ""}
      <span class="social-post-note">Your response is saved only in this browser. Signals show shared concern, not proof of cause.</span></div>
  </article>`;
}

function renderFeed() {
  const sorted = communityPosts().sort((a, b) => signalsFor(b.opportunityId).total - signalsFor(a.opportunityId).total);
  feed.innerHTML = sorted.map(renderPost).join("");
  const totals = [...new Set(sorted.map((post) => post.opportunityId).filter(Boolean))]
    .map((id) => ({ id, ...signalsFor(id) })).sort((a, b) => b.total - a.total);
  document.querySelector("#community-opportunity-pulse").innerHTML = totals.map(({ id, total }) => {
    const opportunity = opportunityById.get(id);
    if (!opportunity) return "";
    return `<div class="social-pulse-row"><span>${escapeHtml(opportunity.shortTitle)}</span><strong>${total}<small> total signals</small></strong><small class="social-pulse-breakdown">${escapeHtml(signalLabel(id))}</small></div>`;
  }).join("");
}

function showAgentShare({ concern, result }) {
  if (!concern || !result?.brief) return;
  pendingAgent = { concern, result };
  const brief = result.brief;
  const title = opportunityById.get(brief.opportunityId)?.shortTitle ?? "No matching sample opportunity";
  const isSample = concern.source === "sample" || concern.source === "example";
  const confidence = Number.isFinite(result.prediction?.confidence) ? result.prediction.confidence : null;
  const previewSources = sourceLinks(brief.sourceIds);
  sharePanel.hidden = false;
  if (feedLink) {
    feedLink.classList.add("social-nav-ready");
    feedLink.setAttribute("aria-label", "Community feed, agent brief ready to add");
    if (!feedLink.querySelector(".social-nav-indicator")) {
      const indicator = document.createElement("span");
      indicator.className = "social-nav-indicator";
      indicator.textContent = "Brief ready";
      feedLink.append(indicator);
    }
  }
  sharePanel.innerHTML = `<div class="social-share-copy">
    <span class="social-kicker">Review before adding · ${isSample ? "fictional sample input" : "your concern"}</span>
    <h3>${escapeHtml(title)}</h3>
    <blockquote>${escapeHtml([concern.concern, concern.who].filter(Boolean).join(" — "))}</blockquote>
    <div class="social-share-brief"><p>${escapeHtml(brief.summary)}</p>
      ${brief.why ? `<p><strong>Why it might connect:</strong> ${escapeHtml(brief.why)}</p>` : ""}
      ${brief.uncertainty ? `<p><strong>Uncertainty:</strong> ${escapeHtml(brief.uncertainty)}</p>` : ""}
      ${brief.nextStep ? `<p><strong>Possible next step:</strong> ${escapeHtml(brief.nextStep)}</p>` : ""}
      ${confidence !== null ? `<p class="social-confidence"><strong>Model class score:</strong> ${Math.round(confidence * 100)}% <span>(uncalibrated; not a truth probability)</span></p>` : ""}
      ${previewSources ? `<div class="social-share-sources"><strong>Sources</strong>${previewSources}</div>` : ""}
    </div>
    <p class="social-share-privacy">This only adds a post to this browser’s local demo feed. Nothing is sent to a public service or visible to other devices. ${isSample ? "Sample inputs stay labeled fictional." : "Your concern will be labeled community input · not verified."}</p>
  </div><div class="social-share-actions"><button class="button button-primary" id="share-agent-brief" type="button">Add to local feed <span aria-hidden="true">→</span></button><button class="button button-ghost" id="dismiss-agent-share" type="button">Cancel</button></div>`;
}

window.addEventListener("butterfly:agent-result", (event) => showAgentShare(event.detail ?? {}));

sharePanel.addEventListener("click", (event) => {
  if (!event.target.closest("#share-agent-brief") || !pendingAgent) return;
  const { concern, result } = pendingAgent;
  const brief = result.brief;
  const isSample = concern.source === "sample" || concern.source === "example";
  const post = {
    id: `community-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    opportunityId: brief.opportunityId,
    label: isSample ? "Sample input · fictional" : "Community input · not verified",
    concern: [concern.concern, concern.who].filter(Boolean).join(" — "),
    summary: brief.summary,
    why: brief.why,
    uncertainty: brief.uncertainty,
    nextStep: brief.nextStep,
    sourceIds: Array.isArray(brief.sourceIds) ? brief.sourceIds : [],
    confidence: Number.isFinite(result.prediction?.confidence) ? result.prediction.confidence : null,
  };
  saved.posts.unshift(post);
  persist();
  renderFeed();
  sharePanel.hidden = true;
  pendingAgent = null;
  feedLink?.classList.remove("social-nav-ready");
  feedLink?.setAttribute("aria-label", "Community feed");
  feedLink?.querySelector(".social-nav-indicator")?.remove();
  liveStatus.textContent = isSample
    ? "The fictional sample concern and agent brief were added to this browser’s local feed."
    : "Your concern and agent brief were added to this browser’s local feed.";
  document.querySelector("#community-feed").scrollIntoView({ behavior: "smooth", block: "start" });
});

sharePanel.addEventListener("click", (event) => {
  if (!event.target.closest("#dismiss-agent-share")) return;
  pendingAgent = null;
  sharePanel.hidden = true;
  feedLink?.classList.remove("social-nav-ready");
  feedLink?.setAttribute("aria-label", "Community feed");
  feedLink?.querySelector(".social-nav-indicator")?.remove();
  liveStatus.textContent = "Sharing cancelled. Nothing was added to the feed.";
});

feed.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-post]");
  if (removeButton) {
    const id = removeButton.dataset.removePost;
    saved.posts = saved.posts.filter((post) => post.id !== id);
    delete saved.reacted[id];
    persist();
    renderFeed();
    liveStatus.textContent = "Your post was removed from this browser’s local feed.";
    return;
  }
  const button = event.target.closest("[data-support-post]");
  if (!button) return;
  const id = button.dataset.supportPost;
  saved.reacted[id] = !saved.reacted[id];
  persist();
  renderFeed();
  liveStatus.textContent = saved.reacted[id] ? "Added your support." : "Removed your support.";
});

renderFeed();
