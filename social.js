import { opportunities, sources } from "./data.js";

const STORAGE_KEY = "butterfly-community-feed-v1";
const opportunityById = new Map(opportunities.map((item) => [item.id, item]));
const sourceById = new Map(sources.map((item) => [item.id, item]));
const feed = document.querySelector("#community-feed-list");
const sharePanel = document.querySelector("#agent-share-panel");
const liveStatus = document.querySelector("#community-feed-status");
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
];

function readSaved() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      posts: Array.isArray(parsed.posts) ? parsed.posts.filter((post) => post && typeof post.id === "string") : [],
      reacted: parsed.reacted && typeof parsed.reacted === "object" ? parsed.reacted : {},
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

function supportCount(opportunityId) {
  const base = seedPosts.filter((post) => post.opportunityId === opportunityId)
    .reduce((total, post) => total + post.support, 0);
  const posts = communityPosts().filter((post) => post.opportunityId === opportunityId);
  const extra = posts.filter((post) => !post.id.startsWith("sample-")).length;
  const reactions = posts.filter((post) => saved.reacted[post.id]).length;
  return base + extra + reactions;
}

function sourceLinks(ids = []) {
  return ids.map((id) => sourceById.get(id)).filter(Boolean).slice(0, 4).map((source) =>
    `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.short)} ↗</a>`
  ).join("");
}

function renderPost(post) {
  const opportunity = opportunityById.get(post.opportunityId);
  const count = supportCount(post.opportunityId);
  const reacted = Boolean(saved.reacted[post.id]);
  const title = opportunity?.shortTitle ?? "No matching sample opportunity";
  return `<article class="social-post">
    <div class="social-post-meta"><span class="social-sample-label">${escapeHtml(post.label || "Community input · not verified")}</span><span>${count} ${count === 1 ? "resident" : "residents"} say this affects them</span></div>
    <blockquote>${escapeHtml(post.concern)}</blockquote>
    <div class="social-brief"><span class="social-kicker">Agent brief · ${escapeHtml(title)}</span>
      <p>${escapeHtml(post.summary)}</p>
      ${post.why ? `<p><strong>Why this might connect:</strong> ${escapeHtml(post.why)}</p>` : ""}
      ${post.uncertainty ? `<p><strong>Uncertainty:</strong> ${escapeHtml(post.uncertainty)}</p>` : ""}
      ${post.nextStep ? `<p><strong>Possible next step:</strong> ${escapeHtml(post.nextStep)}</p>` : ""}
      ${sourceLinks(post.sourceIds)}
    </div>
    <div class="social-post-actions"><button class="social-react" type="button" data-support-post="${escapeHtml(post.id)}" aria-pressed="${reacted}">${reacted ? "✓ Affects me too" : "+ This affects me too"}</button>
      <span class="social-post-note">Support shows shared concern, not proof of cause.</span></div>
  </article>`;
}

function renderFeed() {
  const sorted = communityPosts().sort((a, b) => supportCount(b.opportunityId) - supportCount(a.opportunityId));
  feed.innerHTML = sorted.map(renderPost).join("");
  const totals = [...new Set(sorted.map((post) => post.opportunityId).filter(Boolean))]
    .map((id) => ({ id, count: supportCount(id) })).sort((a, b) => b.count - a.count);
  document.querySelector("#community-opportunity-pulse").innerHTML = totals.map(({ id, count }) => {
    const opportunity = opportunityById.get(id);
    if (!opportunity) return "";
    return `<div class="social-pulse-row"><span>${escapeHtml(opportunity.shortTitle)}</span><strong>${count}<small> residents</small></strong></div>`;
  }).join("");
}

function showAgentShare({ concern, result }) {
  if (!concern || !result?.brief) return;
  pendingAgent = { concern, result };
  const title = opportunityById.get(result.brief.opportunityId)?.shortTitle ?? "No matching sample opportunity";
  sharePanel.hidden = false;
  sharePanel.innerHTML = `<div><span class="social-kicker">Your agent research brief is ready</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(result.brief.summary)}</p><p class="social-share-privacy">Review what will be shared. Your post will be labeled as community input, not verified.</p></div><button class="button button-primary" id="share-agent-brief" type="button">Share to community feed <span aria-hidden="true">→</span></button>`;
}

document.addEventListener("butterfly:agent-result", (event) => showAgentShare(event.detail ?? {}));

sharePanel.addEventListener("click", (event) => {
  if (!event.target.closest("#share-agent-brief") || !pendingAgent) return;
  const { concern, result } = pendingAgent;
  const brief = result.brief;
  const post = {
    id: `community-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    opportunityId: brief.opportunityId,
    label: "Community input · not verified",
    concern: [concern.concern, concern.who].filter(Boolean).join(" — "),
    summary: brief.summary,
    why: brief.why,
    uncertainty: brief.uncertainty,
    nextStep: brief.nextStep,
    sourceIds: Array.isArray(brief.sourceIds) ? brief.sourceIds : [],
  };
  saved.posts.unshift(post);
  persist();
  renderFeed();
  sharePanel.hidden = true;
  pendingAgent = null;
  liveStatus.textContent = "Your concern and agent brief were shared to the local community feed.";
  document.querySelector("#community-feed").scrollIntoView({ behavior: "smooth", block: "start" });
});

feed.addEventListener("click", (event) => {
  const button = event.target.closest("[data-support-post]");
  if (!button) return;
  const id = button.dataset.supportPost;
  saved.reacted[id] = !saved.reacted[id];
  persist();
  renderFeed();
  liveStatus.textContent = saved.reacted[id] ? "Added your support." : "Removed your support.";
});

renderFeed();
