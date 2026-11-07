// Butterfly Effect agent: plans an investigation using our own trained model
// (model.js). It decides whether to ask the resident a question, which tools to
// run, and whether any path honestly fits. No external AI API is called.

import { opportunities, sources } from "./data.js";
import { matchConcern } from "./community.js";
import { model, modelInfo, predict } from "./model.js";
import { answerHints, clarifiers } from "./training-data.js";

const OUT = "out-of-scope";
const ASK_MARGIN = 0.45; // ask when the top two paths are this close
const MIN_CONFIDENCE = 0.4; // below this, say "no match" instead of guessing
const MIN_KNOWN_WORDS = 3; // the model must recognize a few words to judge
// Explicit scope rule: this sample only covers heat-related concerns.
const DOMAIN_TERMS =
  /\b(heat\w*|hot\w*|warm\w*|cool\w*|temperature\w*|sun\w*|summer\w*|shade\w*|shady|tree\w*|canop\w*|air[- ]?condition\w*|a\/?c|swelter\w*|humid\w*|overheat\w*|stifl\w*|fans?|bak\w*|oven\w*|thirst\w*|dehydrat\w*|splash\w*)\b/i;

const pct = (value) => `${Math.round(value * 100)}%`;
const titleOf = (id) => opportunities.find((item) => item.id === id)?.title ?? id;

function sourceRelevance(source, query, matchedOpportunityIds) {
  const haystack = `${source.short} ${source.title} ${source.summary}`.toLowerCase();
  const words = [...new Set(query.toLowerCase().match(/[a-z]{4,}/g) ?? [])];
  const lexical = words.filter((word) => haystack.includes(word)).length;
  const linked = matchedOpportunityIds.some((id) => {
    const opportunity = opportunities.find((item) => item.id === id);
    return opportunity?.path.some((node) => node.sources?.includes(source.id));
  });
  return lexical + (linked ? 3 : 0);
}

export function rankSources(query, matchedOpportunityIds = [], limit = 5) {
  return sources
    .map((source) => ({ source, score: sourceRelevance(source, query, matchedOpportunityIds) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.source);
}

function clarifierFor(a, b) {
  if (a === OUT || b === OUT) return null;
  return clarifiers[[a, b].sort().join("|")] ?? null;
}

function strengthFor(confidence) {
  if (confidence >= 0.8) return { id: "strong", label: `High model confidence · ${pct(confidence)}` };
  if (confidence >= 0.55) return { id: "moderate", label: `Moderate model confidence · ${pct(confidence)}` };
  return { id: "light", label: `Low model confidence · ${pct(confidence)}` };
}

function firstSentence(text = "") {
  const match = String(text).match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : text).trim();
}

function noMatch(prediction, tools, reason) {
  tools.push({ name: "Honest stop", detail: reason });
  return {
    mode: "own-model",
    needsClarification: false,
    prediction,
    matches: [],
    sources: [],
    tools,
    brief: {
      opportunityId: null,
      summary: "This concern does not fit any of the four heat and health paths in our sample, so the agent is not forcing a result.",
      why: reason,
      uncertainty: "The model only knows the examples it was trained on. A real concern can matter even when it is outside this sample.",
      nextStep: "Try an example concern below, or bring this concern to a local councillor or community association.",
      sourceIds: [],
    },
  };
}

export function runCommunityAgent(input) {
  const baseText = [input.concern, input.who, input.context].filter(Boolean).join(". ");
  const tools = [];

  // Step 1: our own model reads the concern.
  let prediction = predict(model, baseText);
  tools.push({
    name: "Own model: classify concern",
    detail: `Naive Bayes model (trained on ${modelInfo.examples} labeled concerns) rates “${titleOf(prediction.label)}” at ${pct(
      prediction.confidence,
    )}, runner-up “${titleOf(prediction.runnerUp)}” at ${pct(prediction.probabilities[prediction.runnerUp])}.`,
  });

  const fullText = `${baseText} ${input.settingAnswer ?? ""}`;
  const inDomain = DOMAIN_TERMS.test(fullText);
  tools.push({
    name: "Scope check",
    detail: inDomain
      ? "The concern mentions heat, sun, shade, cooling, or trees, which this sample covers."
      : "The concern never mentions heat, sun, shade, cooling, or trees.",
  });
  if (!inDomain) {
    return noMatch(prediction, tools, "This sample only covers heat-related concerns, and none of those topics came up.");
  }

  if (prediction.knownWords < MIN_KNOWN_WORDS) {
    return noMatch(prediction, tools, `The model recognized only ${prediction.knownWords} words it was trained on, which is too few to judge.`);
  }

  // Step 2: decide whether a clarifying question would change the answer.
  const clarifier = clarifierFor(prediction.label, prediction.runnerUp);
  if (!input.settingAnswer && clarifier && prediction.margin < ASK_MARGIN) {
    tools.push({
      name: "Decide: ask the resident",
      detail: `The top two paths are only ${pct(prediction.margin)} apart, so one detail could flip the answer.`,
    });
    return { mode: "own-model", needsClarification: true, prediction, question: clarifier.question, choices: clarifier.choices, tools };
  }

  if (input.settingAnswer) {
    const hint = answerHints[input.settingAnswer] ?? input.settingAnswer;
    const before = prediction.label;
    prediction = predict(model, `${baseText}. ${input.settingAnswer}. ${hint}`);
    tools.push({
      name: "Re-classify with the answer",
      detail: `Resident answered “${input.settingAnswer}”. Model now rates “${titleOf(prediction.label)}” at ${pct(prediction.confidence)}${
        before !== prediction.label ? ` (changed from “${titleOf(before)}”)` : ""
      }.`,
    });
  }

  if (prediction.label === OUT) {
    return noMatch(prediction, tools, `The model rated this ${pct(prediction.confidence)} likely to be outside the sample's heat and health scope.`);
  }
  if (prediction.confidence < MIN_CONFIDENCE) {
    return noMatch(prediction, tools, `The best guess reached only ${pct(prediction.confidence)} confidence, below the ${pct(MIN_CONFIDENCE)} bar for suggesting a path.`);
  }

  // Step 3: tools — read the chosen path, search evidence, cross-check.
  const opportunity = opportunities.find((item) => item.id === prediction.label);
  tools.push({
    name: "Read opportunity path",
    detail: `Loaded “${opportunity.title}”: its claims, unknowns, risks, and next test.`,
  });

  const evidence = rankSources(`${baseText} ${prediction.topWords.join(" ")}`, [opportunity.id]);
  tools.push({
    name: "Search evidence library",
    detail: `Searched ${sources.length} real sources; kept ${evidence.length} that support this path.`,
  });

  const keyword = matchConcern({ ...input, context: `${input.context ?? ""} ${input.settingAnswer ?? ""}` });
  const agrees = keyword[0]?.opportunityId === opportunity.id;
  tools.push({
    name: "Cross-check with keyword rules",
    detail: keyword.length
      ? agrees
        ? "The hand-written keyword matcher agrees with the model."
        : `The keyword matcher preferred “${titleOf(keyword[0].opportunityId)}”, so treat this result with extra care.`
      : "The keyword matcher found no clear overlap; the model's judgment stands alone.",
  });

  // Step 4: write the brief.
  const gap = opportunity.path.find((node) => node.phase === "Gap");
  const runnerUpP = prediction.probabilities[prediction.runnerUp];
  const brief = {
    opportunityId: opportunity.id,
    summary: `Your concern most resembles “${opportunity.title}”. ${opportunity.tagline}`,
    why: `The model leaned on words like ${prediction.topWords.slice(0, 4).map((w) => `“${w}”`).join(", ") || "the overall description"}. ${
      gap ? `A possible shared gap: ${gap.title.toLowerCase()}.` : ""
    }`,
    uncertainty: `${firstSentence(opportunity.uncertaintyNote)}${
      prediction.runnerUp !== OUT && runnerUpP > 0.1 ? ` The model also gave “${titleOf(prediction.runnerUp)}” ${pct(runnerUpP)}.` : ""
    }${agrees ? "" : " The keyword cross-check disagreed."}`,
    nextStep: `${opportunity.test.title} (${opportunity.test.timeframe}). ${firstSentence(opportunity.test.design)}`,
    sourceIds: evidence.map((source) => source.id),
  };
  tools.push({ name: "Write cited brief", detail: `Cited ${evidence.length} sources and one low-cost next step.` });

  const matches = [
    { opportunityId: opportunity.id, score: prediction.confidence, cueLabels: prediction.topWords, strength: strengthFor(prediction.confidence) },
    ...prediction.ranked
      .slice(1)
      .filter((id) => id !== OUT && prediction.probabilities[id] >= 0.15)
      .map((id) => ({
        opportunityId: id,
        score: prediction.probabilities[id],
        cueLabels: [`model ${pct(prediction.probabilities[id])}`],
        strength: strengthFor(prediction.probabilities[id]),
      })),
  ];

  return { mode: "own-model", needsClarification: false, prediction, matches, sources: evidence, tools, brief };
}

/** Async wrapper so the UI can show a short "agent at work" state. */
export async function runAgent(input) {
  await new Promise((resolve) => setTimeout(resolve, 700));
  return runCommunityAgent(input);
}
