# Butterfly Effect

Butterfly Effect is an offline hackathon demo for **community concern discovery**. A resident describes what they are seeing, then the app looks for possible threads in a small, source-linked sample of urban heat, health, shade, and housing opportunities. Each result separates **community input**, **source-supported claims**, and **system-inferred hypotheses** — and ends with one practical next step to test.

> **Guardrail:** Matches are suggestions to investigate, not verified causes or guaranteed solutions. Sources support individual claims; the connections between them are the sample's synthesis. Associations can be confounded by income, housing, behavior, and measurement choices.

## Run locally

Requires Node.js 18 or newer. No install, build, API key, or internet connection needed.

```bash
node server.mjs
```

Then open **http://127.0.0.1:4173**.

Open the app through this server rather than double-clicking `index.html`; the ES module imports need an HTTP origin. The server serves every asset locally and sends `Cache-Control: no-store`, so edits show up on refresh.

To use a different port:

```bash
PORT=4174 node server.mjs
```

On Windows PowerShell:

```powershell
$env:PORT=4174; node server.mjs
```

`npm start` also works if your shell permits npm scripts.

## The AI agent (Cortex: AI Agents track)

Butterfly Effect runs on **our own AI model**, with no external AI API.

- **Model** (`model.js`): a multinomial Naive Bayes text classifier (unigrams + bigrams, Laplace smoothing) written from scratch. It trains in the browser on load.
- **Training data** (`training-data.js`): 154 hand-labeled, fictional resident concerns across 6 classes (five opportunity paths plus "outside this sample").
- **Evaluation:** leave-one-out accuracy is 84% (130/154). The heat paths score 23–25 out of 25 and food access 26/29; off-topic detection is the weak spot (7/25), so the agent adds an explicit scope check, a minimum word count, and a confidence floor. The full confusion matrix is in the app's **How it works → Model card**. Re-run with `node -e "import('./model.js').then(m=>console.log(m.evaluate()))"`.
- **Explainability:** for each prediction, the UI shows the probability of every class and the words that pushed it toward the winner.

The **agent** (`agent.js`) uses the model's confidence to plan each run:

1. **Classify** the concern with our model, and **check scope** with an explicit rule.
2. **Decide:** if the top two paths are close, ask the resident one clarifying question chosen for that pair, then re-classify with the answer. If the concern looks out of scope, or confidence is too low, stop honestly instead of guessing.
3. **Use tools:** read the chosen opportunity path, search the evidence library, and cross-check against the hand-written keyword rules.
4. **Brief:** write a cited brief with the uncertainty and one practical next step.

The discovery view shows every step. After each run, the app fires a `butterfly:agent-result` window event with `{ concern, result }` for other features to use.

## The demo flow

1. **Share a community concern.** The homepage form asks what is happening, who or where it affects, and optional context or ideas. Click **Try a sample concern** to run a fictional composite through the flow.
2. **Look for a thread.** A local, rule-based matcher compares the words shared with hand-written topic clues for the five sample opportunities (used as a cross-check on the model). A domain-specific primary cue plus at least two overlapping clues is required, so loose word matches do not become confident results.
3. **Read the discovery view.** The first possible connection shows a possible shared cause or gap, related source-supported problems, a potential intervention, real source links, uncertainty, risks, and one practical next step. Lower-scoring overlaps appear as other threads to explore.
4. **No match, honestly.** If nothing overlaps enough, the app says so, explains why, and offers five example concerns instead of inventing a result.
5. **Open the full evidence path.** Every match links into the existing portfolio detail, score breakdown, evidence ledger, and Markdown brief export.

Sample and example inputs are labeled **Sample input** or **Example input** in the discovery view. Community text stays in the browser and is never sent or stored.

## What's inside

| File | Purpose |
| --- | --- |
| `index.html` | App shell, concern form, hero, sample stats, discovery shell, portfolio, dialogs |
| `model.js` | Our Naive Bayes classifier: tokenizer, training, prediction, leave-one-out evaluation |
| `training-data.js` | Labeled training concerns, clarifying questions, answer hints |
| `agent.js` | Agent planner: classify, ask or stop, run tools, write the cited brief |
| `social.js` / `social.css` | Community feed: share an agent brief, "this affects me too" reactions, per-path signal totals (saved only in this browser) |
| `community.js` | Fictional sample concern, five example concerns, transparent weighted keyword matcher (used as a cross-check) |
| `data.js` | Local sample dataset: 11 sources, 4 opportunities, paths, scores, risks, next tests |
| `app.js` | Concern intake and validation, discovery rendering, portfolio search/filter/sort, detail view, export |
| `styles.css` | Core visual system and portfolio layout |
| `detail.css` | Detail view, score ring, evidence path, panels, source ledger |
| `overlays.css` | Dialogs, evidence library, responsive rules, motion |
| `community.css` | Warm community-research visual layer, discovery and form styles, readability overrides |
| `server.mjs` | Zero-dependency static file server (Node built-ins only) |

## The local sample

- **4 opportunity paths**, each with **5 nodes**: 2 source-supported anchors with real publisher links and 3 system-inferred steps. Every node is labeled **Source-supported** or **System-inferred**.
- **11 sources** cited across the portfolio (EPA, WHO, CDC, DOE, American Forests, and others).
- **10 domains** mapped, from urban forestry and public health to housing, energy, and mobility.
- Each opportunity includes uncertainty notes, unknowns, risks, and a concrete low-cost next test.

### Matching

The matcher in `community.js` is deliberately small and inspectable:

- Text is lowercased, stripped of accents and punctuation, tokenized, and lightly stemmed.
- Each opportunity has weighted topic clues, such as “older adults,” “apartment or housing,” or “night or sleep.”
- A match requires at least one domain-specific **primary cue**, at least **two overlapping clues**, and a minimum weighted score.
- Overlapping clue labels are shown in the result, so the reasoning is visible.
- There is no model, embedding, retrieval, geospatial, or network call. A keyword overlap is only a prompt to investigate.

### Scoring

The priority score is a fixed, transparent rubric:

| Component | Weight |
| --- | --- |
| Evidence strength | 30% |
| Potential impact | 20% |
| Cross-domain novelty | 15% |
| Feasibility / time to learn | 20% |
| Evidence certainty | 15% |

A risk drag of 0–8 points is subtracted. A higher score means a higher-priority test — **not** a higher chance of success or a causal estimate.

### Interactions

- Submit the concern form, or use **Try a sample concern** / any example card.
- **Edit concern** returns to the form with the text preserved.
- **Open the full evidence path** loads the matched opportunity in the portfolio and detail view.
- Search claims, domains, or sources; filter by theme; sort by score, uncertainty, impact, or feasibility.
- Use the **Evidence library** and **How it works** dialogs for sources and method details.
- **Copy brief** copies a Markdown summary; **Download .md** saves it.
- Press `/` to focus search, `Esc` to close dialogs. All controls are keyboard reachable and focus-visible.

## Data and limitations

The dataset is hand-curated to demonstrate a community-facing synthesis workflow. There are **no live model, retrieval, or geospatial calls** in this demo. Publisher links were selected as real reference material; source-strength labels are editorial judgments. The sample is not a local study, systematic review, or causal analysis. Before acting, speak with affected residents, check local conditions, and review the original sources.
