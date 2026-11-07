// Butterfly Effect's own text classifier: multinomial Naive Bayes, written from
// scratch and trained in the browser on training-data.js. No external AI API.

import { LABELS, trainingData } from "./training-data.js";

const STOPWORDS = new Set(
  "a an and are as at be but by can do does for from has have how i in is it its of on or our so that the their them there they this to was we what when where which who why will with you your my me us not no don doesn didn isn aren wasn won couldn shouldn ve ll re".split(
    " ",
  ),
);

function stem(word) {
  if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && /(ss|x|ch|sh)es$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

export function tokenize(text) {
  const words = String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word))
    .map(stem);
  const bigrams = words.slice(1).map((word, index) => `${words[index]}_${word}`);
  return [...words, ...bigrams];
}

/** Train a multinomial Naive Bayes model with Laplace smoothing. */
export function train(examples, { alpha = 0.5 } = {}) {
  const docCount = Object.fromEntries(LABELS.map((label) => [label, 0]));
  const wordCount = Object.fromEntries(LABELS.map((label) => [label, new Map()]));
  const totalWords = Object.fromEntries(LABELS.map((label) => [label, 0]));
  const vocab = new Set();

  for (const [label, text] of examples) {
    docCount[label] += 1;
    for (const token of tokenize(text)) {
      vocab.add(token);
      wordCount[label].set(token, (wordCount[label].get(token) ?? 0) + 1);
      totalWords[label] += 1;
    }
  }

  return { alpha, docCount, wordCount, totalWords, vocab, size: examples.length };
}

function logLikelihood(model, label, token) {
  const count = model.wordCount[label].get(token) ?? 0;
  return Math.log((count + model.alpha) / (model.totalWords[label] + model.alpha * model.vocab.size));
}

/** Returns class probabilities plus the words that pushed hardest toward the winner. */
export function predict(model, text) {
  const tokens = tokenize(text).filter((token) => model.vocab.has(token));
  const scores = {};
  for (const label of LABELS) {
    let score = Math.log(model.docCount[label] / model.size);
    for (const token of tokens) score += logLikelihood(model, label, token);
    scores[label] = score;
  }

  const max = Math.max(...Object.values(scores));
  const exp = Object.fromEntries(LABELS.map((label) => [label, Math.exp(scores[label] - max)]));
  const total = Object.values(exp).reduce((sum, value) => sum + value, 0);
  const probabilities = Object.fromEntries(LABELS.map((label) => [label, exp[label] / total]));
  const ranked = [...LABELS].sort((a, b) => probabilities[b] - probabilities[a]);
  const label = ranked[0];

  // Evidence per word: how much more likely it is under the winner than the runner-up.
  const runnerUp = ranked[1];
  const topWords = [...new Set(tokens)]
    .map((token) => ({
      token,
      weight: logLikelihood(model, label, token) - logLikelihood(model, runnerUp, token),
    }))
    .filter((item) => item.weight > 0.3)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6)
    .map((item) => item.token.replace("_", " "));

  return {
    label,
    runnerUp,
    confidence: probabilities[label],
    margin: probabilities[label] - probabilities[runnerUp],
    probabilities,
    ranked,
    topWords,
    knownWords: new Set(tokens.filter((token) => !token.includes("_"))).size,
  };
}

/** Leave-one-out accuracy: train on all-but-one example, test on the one left out. */
export function evaluate(examples = trainingData) {
  let correct = 0;
  const confusion = Object.fromEntries(LABELS.map((a) => [a, Object.fromEntries(LABELS.map((b) => [b, 0]))]));
  examples.forEach((example, index) => {
    const rest = examples.filter((_, other) => other !== index);
    const guess = predict(train(rest), example[1]).label;
    confusion[example[0]][guess] += 1;
    if (guess === example[0]) correct += 1;
  });
  const perClass = Object.fromEntries(
    LABELS.map((label) => {
      const row = confusion[label];
      const total = Object.values(row).reduce((sum, n) => sum + n, 0);
      return [label, { correct: row[label], total }];
    }),
  );
  return { correct, total: examples.length, accuracy: correct / examples.length, confusion, perClass };
}

let cachedEvaluation;
/** Evaluation is ~125 small trainings; compute once, lazily. */
export function getEvaluation() {
  cachedEvaluation ??= evaluate();
  return cachedEvaluation;
}

export const model = train(trainingData);
export const modelInfo = {
  type: "Multinomial Naive Bayes (unigrams + bigrams)",
  examples: trainingData.length,
  classes: LABELS.length,
  vocabulary: model.vocab.size,
};
