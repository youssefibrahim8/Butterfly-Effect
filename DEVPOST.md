# Butterfly Effect: Devpost submission and demo script

## Devpost fields (copy and paste)

**Name:** Butterfly Effect

**Tagline:** Describe a problem on your street. Our own AI agent finds the evidence, asks when it's unsure, and gives you one next step.

**Track:** AI Agents

### Inspiration
People notice local problems first: the walk to school with no shade, a grandparent whose apartment never cools down at night, neighbours with nowhere cool to go during a heat warning. What they usually lack is a way to connect that observation to real evidence and to something they could actually try. We wanted an agent that does the first round of research for them and is honest about what it doesn't know.

### What it does
You describe a concern in plain words. Our agent:
1. **Reads it with our own trained model**, a Naive Bayes classifier we wrote from scratch, which scores the concern against four researched heat and health interventions plus "outside this sample".
2. **Decides what to do next.** If the model is torn between two paths, the agent asks you one clarifying question chosen for that pair (for example, "Do the people affected have a home they can stay in?") and re-classifies with your answer. If the concern is off-topic or the model isn't confident, it stops and says so instead of inventing a result.
3. **Uses tools**: it reads the chosen opportunity path, searches an evidence library of 11 real publications (EPA, WHO, CDC, US DOE, and others), and cross-checks itself against a second, hand-written keyword method.
4. **Writes a cited brief**: what it found, why, what's uncertain, and one low-cost next step, keeping community input, source-supported claims, and system-inferred ideas visibly separate.

Every step is shown on screen, along with the model's probability for each path and the words that drove its decision.

5. **Builds community signal**: you can add your concern and its brief to a community feed, where neighbours mark "this affects me too". Signals are totalled per intervention, with fictional sample posts clearly separated from real ones, so a group can see which problems many people share.

### How we built it
- Plain HTML, CSS, and JavaScript, with a zero-dependency Node server. It runs fully offline in the browser.
- **Our own AI, no external API:** multinomial Naive Bayes over words and word pairs, with Laplace smoothing, trained in the browser on 125 hand-labeled, fictional resident concerns.
- **Measured honestly:** 85% leave-one-out accuracy (106/125). The app shows the full confusion matrix in its model card.
- **Agent logic:** the agent uses the model's confidence and margin to choose between asking, stopping, or investigating, then runs its tools and writes the brief.

### Challenges we ran into
- **Off-topic detection:** with little data, the model catches off-topic concerns only 8 of 25 times. We added an explicit scope check, a minimum word count, and a confidence floor so the agent stops honestly instead of guessing.
- **Vague concerns** are sensitive to wording, which is exactly why the agent asks a question when it's unsure.

### Accomplishments we're proud of
- An agent that asks before guessing and is willing to say "no match".
- An AI we built and trained ourselves, with its accuracy and weaknesses published in the app.
- Real, linked sources for every supported claim.

### What we learned
How a text classifier actually works inside (word probabilities, smoothing, why bigrams help), how to evaluate a model fairly with leave-one-out, and that being honest about uncertainty makes a tool more useful, not less.

### What's next
- More and real training data, collected with community groups.
- Canadian and Ottawa sources in the evidence library.
- A community feed where residents with the same concern can add their voice, so a cluster of reports becomes a case to bring to the city.

### Built with
JavaScript, HTML, CSS, Node.js, Naive Bayes (from scratch)

---

## 2-minute demo script

Start the server first with `node server.mjs` and open the URL it prints. Close other tabs.

1. **Problem (15s).** "People notice heat problems on their street first, but they don't know what the evidence says or what to try. Butterfly Effect is an AI agent that does that first round of research."

2. **The agent asks (30s).** In the form, type:
   - What is happening: `People in our area feel sick on hot days.`
   - Who or where: `People in Vanier, Ottawa`

   Click **Investigate this concern**. "Our model is torn between two paths, so instead of guessing, the agent asks." Click **Yes, they have housing**.

3. **Show the reasoning (30s).** Point at the step list: classify, scope check, re-classify with the answer, read the path, search evidence, cross-check, write the brief. Then the probability bars and "Words that drove it". "This is our own model, trained from scratch. No API."

4. **The brief (20s).** Scroll to the brief and sources. "Every supported claim links to a real source, and it tells you what's uncertain and one low-cost next step."

4b. **Community feed (15s).** In the panel under the result, click **Add to local feed**, then **This affects me too** on a post. "When residents report the same kind of problem, the signals add up, so a group can bring a stronger case to the city. Sample posts are labeled fictional, and support isn't treated as proof."

5. **Honest no (15s).** Click **Edit concern** and type `The soccer field has no lights so we cannot play after dark.` with `Residents in Vanier, Ottawa`. "It's outside what we trained on, so it says so instead of making something up."

6. **Model card (10s).** Open **How it works** and show the model card. "85% leave-one-out accuracy, and here's exactly where it gets confused."

**Close:** "We built and trained the AI ourselves, it knows when it's unsure, and it shows its work."

### Likely judge questions
- **"Is this really AI?"** Yes: it's a statistical model that learns word probabilities from labeled examples. We wrote training, prediction, and evaluation ourselves (`model.js`). It's small on purpose, so it runs anywhere and we can explain every decision.
- **"What makes it an agent?"** It chooses its own next action based on the model's confidence: ask, stop, or investigate with tools. Then it acts on your answer.
- **"Is the data real?"** The training concerns are fictional, written by us. The 11 evidence sources are real publications with links.
- **"What's the weakest part?"** Off-topic detection, which is why we added explicit checks. More real data is the next step.
