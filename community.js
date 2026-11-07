import { opportunities } from "./data.js";

/* -------------------------------------------------------------------------- */
/* Local concern matching                                                     */
/*                                                                            */
/* This is deliberately small and transparent: it compares the words a person */
/* shares with a hand-written set of topic clues for each sample opportunity.  */
/* There is no model, API, embedding, or network request. A keyword overlap is */
/* a prompt to investigate, not evidence of a causal relationship.            */
/* -------------------------------------------------------------------------- */

export const sampleConcern = {
  id: "sample-senior-heat",
  label: "Too hot at home, and afraid of the bill",
  concern:
    "My grandmother lives in an older apartment building. During hot nights her apartment stays warm even with a fan, and she keeps the lights off because the electricity bill is already too high.",
  who: "Older adults on fixed incomes in a low-rise apartment complex near our neighborhood.",
  context:
    "Neighbors say the shared community room is closed on weekends. We want to know whether shade, a cooler common room, or help with cooling costs could make a difference.",
};

export const concernExamples = [
  {
    id: "example-school-shade",
    label: "A hot walk to school",
    preview:
      "The walk to school has almost no shade, and some families drive instead.",
    concern:
      "The walk to school has almost no shade. Children arrive hot and tired, and some families drive even though they live close by.",
    who: "Elementary school children and families in the neighborhoods around our local public school.",
    context:
      "Parents have asked about trees and water at the crossing. The city is repaving the street this year.",
  },
  {
    id: "example-canopy-data",
    label: "Tree maps miss the hottest blocks",
    preview:
      "Planting lists seem based on tree cover alone, not heat and health together.",
    concern:
      "The city keeps publishing tree-planting lists, but they seem based on tree cover alone. The hottest blocks with the most health problems are not at the top.",
    who: "Residents in the older, lower-income blocks on the east side of town.",
    context:
      "We have a county heat map and ZIP-code-level asthma data. Could they be used together to choose planting and outreach sites?",
  },
  {
    id: "example-overnight-refuge",
    label: "Nowhere cool to sleep",
    preview:
      "The daytime cooling center closes at 5 p.m., leaving people without housing exposed overnight.",
    concern:
      "People without housing have nowhere cool to sleep during heat alerts. The daytime cooling center closes at 5 p.m.",
    who: "Unhoused neighbors and people living in cars near the downtown library.",
    context:
      "A library and a church have offered space. The missing pieces seem to be staff, transport, and late-night hours.",
  },
  {
    id: "example-senior-ac",
    label: "Fixed income, no air conditioning",
    preview:
      "Older residents avoid turning on the AC because the electric bill is already too high.",
    concern:
      "Older residents in our building avoid turning on the air conditioning because the electric bill is already too high.",
    who: "Seniors on fixed incomes in a subsidized apartment building.",
    context:
      "The common room has air conditioning but is only open on weekday afternoons. The roof is old and the top floors are hottest.",
  },
  {
    id: "example-playground-heat",
    label: "A playground too hot to use",
    preview:
      "Children stay inside at recess because the playground has little shade.",
    concern:
      "The school playground is too hot to use during afternoon recess, and there is very little shade.",
    who: "Young children at our neighborhood school.",
    context:
      "Teachers move recess indoors on hot days. Could shade sails or trees help?",
  },
];

const CUE_CONFIG = {
  "canopy-index": {
    cues: [
      {
        label: "trees or canopy",
        weight: 3,
        primary: true,
        terms: ["tree", "trees", "canopy", "tree cover", "green cover", "greenery", "sapling"],
      },
      {
        label: "heat or hot days",
        weight: 2,
        terms: [
          "heat",
          "hot",
          "hotter",
          "heatwave",
          "heat wave",
          "high temperature",
          "high temperatures",
          "swelter",
          "too warm",
        ],
      },
      {
        label: "maps, data, or ranking",
        weight: 2,
        primary: true,
        terms: [
          "map",
          "maps",
          "mapping",
          "data",
          "dataset",
          "index",
          "dashboard",
          "satellite",
          "gis",
          "model",
          "ranking",
          "rank",
          "prioritize",
          "prioritization",
          "tree planting list",
          "planting list",
        ],
      },
      {
        label: "vulnerability or equity",
        weight: 2,
        terms: [
          "vulnerable",
          "vulnerability",
          "equity",
          "inequity",
          "redlining",
          "low income",
          "low-income",
          "poorer",
          "disadvantaged",
          "health problem",
          "health problems",
          "asthma",
          "er visit",
          "er visits",
        ],
      },
      {
        label: "planting or greening",
        weight: 2,
        primary: true,
        terms: ["plant", "planting", "tree planting", "green the block", "green space"],
      },
      {
        label: "neighborhood scale",
        weight: 1,
        terms: [
          "neighborhood",
          "neighbourhood",
          "block",
          "blocks",
          "street",
          "streets",
          "zip code",
          "census tract",
          "citywide",
        ],
      },
    ],
  },

  "senior-cool-bundles": {
    cues: [
      {
        label: "older adults",
        weight: 3,
        primary: true,
        terms: [
          "older adult",
          "older adults",
          "older people",
          "older resident",
          "older residents",
          "senior",
          "seniors",
          "elderly",
          "grandmother",
          "grandfather",
          "grandparent",
          "grandparents",
          "aging",
          "retired",
        ],
      },
      {
        label: "apartment or housing",
        weight: 2,
        primary: true,
        terms: [
          "apartment",
          "apartments",
          "apartment building",
          "senior housing",
          "subsidized housing",
          "public housing",
          "affordable housing",
          "housing complex",
          "residence",
          "residential",
          "assisted living",
          "care home",
          "nursing home",
          "mobile home",
          "trailer",
          "subsidized",
        ],
      },
      {
        label: "indoor heat",
        weight: 2,
        primary: true,
        terms: [
          "bedroom",
          "top floor",
          "upper floor",
          "stuffy",
          "stays warm",
          "stays hot",
          "hot room",
          "hot apartment",
          "no air conditioning",
          "no ac",
          "without ac",
          "fan",
        ],
      },
      {
        label: "cooling or roof improvements",
        weight: 2,
        terms: [
          "cool roof",
          "roof",
          "air conditioning",
          "air conditioner",
          "ac",
          "weatherization",
          "insulation",
          "shade",
          "cooling cost",
          "cooling costs",
          "cool room",
        ],
      },
      {
        label: "energy bills",
        weight: 2,
        terms: [
          "energy bill",
          "energy bills",
          "electric bill",
          "electric bills",
          "electricity bill",
          "electricity bills",
          "utility bill",
          "utility bills",
          "power bill",
          "energy burden",
          "energy cost",
          "energy costs",
          "fixed income",
          "afford",
        ],
      },
      {
        label: "shared cool space",
        weight: 1,
        terms: ["community room", "common room", "day room", "lounge", "shared space"],
      },
      {
        label: "heat or hot days",
        weight: 1,
        terms: ["heat", "hot", "heatwave", "heat wave", "high temperature", "warm"],
      },
    ],
  },

  "shade-school-routes": {
    cues: [
      {
        label: "school or students",
        weight: 3,
        primary: true,
        terms: [
          "school",
          "schools",
          "student",
          "students",
          "child",
          "children",
          "kid",
          "kids",
          "class",
          "classes",
          "classroom",
          "pupil",
          "pupils",
          "recess",
        ],
      },
      {
        label: "walking or routes",
        weight: 2,
        terms: [
          "walk",
          "walking",
          "commute",
          "commuting",
          "school run",
          "route",
          "routes",
          "bike",
          "biking",
          "crossing",
          "crosswalk",
          "sidewalk",
          "traffic",
          "parent",
          "parents",
          "family",
          "families",
        ],
      },
      {
        label: "shade or canopy",
        weight: 2,
        terms: ["shade", "shaded", "tree", "trees", "canopy", "covered", "sun"],
      },
      {
        label: "heat or hot days",
        weight: 2,
        terms: ["heat", "hot", "heatwave", "heat wave", "high temperature", "sunny", "sweat"],
      },
      {
        label: "playground",
        weight: 1,
        primary: true,
        terms: ["playground", "play area", "schoolyard"],
      },
      {
        label: "safety concerns",
        weight: 1,
        terms: ["safe", "safety", "unsafe", "dangerous", "speeding", "air quality", "pollution"],
      },
    ],
  },

  "overnight-cool-refuge": {
    cues: [
      {
        label: "night or sleep",
        weight: 3,
        primary: true,
        terms: ["night", "nights", "overnight", "sleep", "sleeping", "nighttime", "bedtime"],
      },
      {
        label: "cooling spaces",
        weight: 2,
        primary: true,
        terms: [
          "cooling center",
          "cooling centre",
          "cool refuge",
          "refuge",
          "cool space",
          "community center",
          "community centre",
          "library",
          "faith",
          "church",
          "mosque",
          "temple",
          "shelter",
          "drop in",
          "drop-in",
        ],
      },
      {
        label: "no cooling at home",
        weight: 2,
        terms: [
          "no air conditioning",
          "no ac",
          "without ac",
          "power outage",
          "electricity outage",
          "hot apartment",
          "hot room",
          "no cooling",
        ],
      },
      {
        label: "unhoused or high-risk neighbors",
        weight: 2,
        primary: true,
        terms: [
          "unhoused",
          "homeless",
          "housing insecure",
          "living outside",
          "living in a car",
          "living in cars",
          "car",
          "older adult",
          "older adults",
          "senior",
          "seniors",
          "disabled",
          "disability",
          "low income",
          "low-income",
        ],
      },
      {
        label: "transport or access",
        weight: 1,
        terms: [
          "transport",
          "transportation",
          "ride",
          "rides",
          "bus",
          "lift",
          "access",
          "reach",
          "distance",
          "open late",
          "hours",
        ],
      },
      {
        label: "heat or heat alerts",
        weight: 1,
        terms: [
          "heat",
          "hot",
          "heatwave",
          "heat wave",
          "heat alert",
          "heat alerts",
          "high temperature",
          "swelter",
        ],
      },
    ],
  },
};

const MIN_MATCH_SCORE = 3;

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9']+/g, " ")
    .trim();
}

function stem(word) {
  if (word.length <= 3) return word;
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith("sses")) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function tokenize(value) {
  return normalizeText(value)
    .split(" ")
    .filter(Boolean)
    .map(stem);
}

function includesPhrase(tokens, phrase) {
  const phraseTokens = tokenize(phrase);
  if (!phraseTokens.length) return false;
  for (let index = 0; index <= tokens.length - phraseTokens.length; index += 1) {
    if (phraseTokens.every((token, offset) => token === tokens[index + offset])) {
      return true;
    }
  }
  return false;
}

function strengthFor(score, cueCount) {
  if (score >= 7 && cueCount >= 3) {
    return {
      id: "strong",
      label: "Several topic clues overlap",
      plain: "This is the closest sample thread to the words you shared.",
    };
  }
  if (score >= 4) {
    return {
      id: "moderate",
      label: "Some topic clues overlap",
      plain: "There is a partial overlap with this sample thread.",
    };
  }
  return {
    id: "light",
    label: "One topic clue overlaps",
    plain: "This is a light overlap — worth a look, not a conclusion.",
  };
}

/**
 * Match a community concern against the four local sample opportunities.
 *
 * @param {{ concern?: string, who?: string, context?: string }} input
 * @returns {Array<{ opportunityId: string, score: number, cueLabels: string[], cueCount: number, strength: object }>}
 */
export function matchConcern(input = {}) {
  const tokens = tokenize(
    [input.concern, input.who, input.context].filter(Boolean).join(" "),
  );
  const order = new Map(opportunities.map((opportunity, index) => [opportunity.id, index]));

  return opportunities
    .map((opportunity) => {
      const config = CUE_CONFIG[opportunity.id];
      if (!config) return null;

      const hits = config.cues.filter((cue) =>
        cue.terms.some((term) => includesPhrase(tokens, term)),
      );
      const score = hits.reduce((total, cue) => total + cue.weight, 0);
      const hasPrimaryCue = hits.some((cue) => cue.primary);

      return {
        opportunityId: opportunity.id,
        score,
        cueLabels: hits.map((cue) => cue.label),
        cueCount: hits.length,
        hasPrimaryCue,
        strength: strengthFor(score, hits.length),
      };
    })
    .filter(
      (match) =>
        match &&
        match.hasPrimaryCue &&
        match.cueCount >= 2 &&
        match.score >= MIN_MATCH_SCORE,
    )
    .sort(
      (a, b) =>
        b.score - a.score ||
        (order.get(a.opportunityId) ?? 0) - (order.get(b.opportunityId) ?? 0),
    );
}
