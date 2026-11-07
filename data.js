export const meta = {
  version: "MVP 0.1",
  datasetLabel: "Urban heat · health · shade · canopy",
  updated: "November 2026",
  weights: [
    {
      key: "evidence",
      label: "Evidence strength",
      weight: 0.3,
      description:
        "How credible, relevant, and consistent the reported anchors are for the claims they support.",
    },
    {
      key: "impact",
      label: "Potential impact",
      weight: 0.2,
      description:
        "The severity and scale of the problem the hypothesis could address if it holds.",
    },
    {
      key: "novelty",
      label: "Cross-domain novelty",
      weight: 0.15,
      description:
        "How much the path connects problems, data, or partners that usually sit in separate silos.",
    },
    {
      key: "feasibility",
      label: "Feasibility / time to learn",
      weight: 0.2,
      description:
        "Whether a meaningful, ethical test can be run with realistic partners, data, and time.",
    },
    {
      key: "certainty",
      label: "Evidence certainty",
      weight: 0.15,
      description:
        "Confidence in the whole path — not just the individual source claims — including local fit.",
    },
  ],
  riskPenaltyMax: 8,
  scoreNote:
    "Priority score = Σ(component × fixed weight) − risk drag. It is a prioritization aid, not a probability of success or a causal estimate.",
};

export const sources = [
  {
    id: "epa-heat",
    short: "EPA heat islands",
    title: "Heat Island Effect",
    publisher: "U.S. Environmental Protection Agency",
    year: "2025",
    type: "Government resource",
    strength: "Moderate",
    url: "https://www.epa.gov/heatislands/what-are-heat-islands",
    summary:
      "Overview of urban heat islands: how dense surfaces and lost vegetation raise temperatures, and how heat relates to energy demand, air quality, and health.",
  },
  {
    id: "epa-trees",
    short: "EPA trees & cooling",
    title: "Using Trees and Vegetation to Reduce Heat Islands",
    publisher: "U.S. Environmental Protection Agency",
    year: "2025",
    type: "Government resource",
    strength: "Moderate–strong",
    url: "https://www.epa.gov/heatislands/using-trees-and-vegetation-reduce-heat-islands",
    summary:
      "Trees and vegetation cool urban surfaces through shade and evapotranspiration. Benefits vary with species, placement, water, maintenance, and time.",
  },
  {
    id: "who-heat",
    short: "WHO heat & health",
    title: "Heat and health",
    publisher: "World Health Organization",
    year: "2026",
    type: "Global health guidance",
    strength: "Strong",
    url: "https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health",
    summary:
      "Heat is a leading weather-related health hazard and can worsen cardiovascular, respiratory, kidney, and mental health conditions. Older adults and people with limited cooling are especially vulnerable.",
  },
  {
    id: "cdc-heat",
    short: "CDC heat & health",
    title: "About Heat and Your Health",
    publisher: "U.S. Centers for Disease Control and Prevention",
    year: "2026",
    type: "Public health guidance",
    strength: "Moderate–strong",
    url: "https://www.cdc.gov/heat-health/about/index.html",
    summary:
      "Practical guidance on staying cool and hydrated during heat events, with elevated risk for older adults, young children, pregnant people, and people with chronic conditions.",
  },
  {
    id: "doe-cool-roofs",
    short: "DOE cool roofs",
    title: "Consumer Guide to Cool Roofs",
    publisher: "U.S. Department of Energy",
    year: "2021",
    type: "Technical guidance (PDF)",
    strength: "Moderate",
    url: "https://www.energy.gov/sites/default/files/2021-08/ES-CoolRoofs_080921.pdf",
    summary:
      "Cool roofs reflect sunlight and can lower roof temperatures and cooling energy use in warm climates. Savings depend on building type, insulation, climate, and maintenance.",
  },
  {
    id: "tree-equity",
    short: "Tree Equity Score",
    title: "Tree Equity Score",
    publisher: "American Forests",
    year: "n.d.",
    type: "Data tool / methodology",
    strength: "Moderate",
    url: "https://www.americanforests.org/tree-equity-score/",
    summary:
      "A neighborhood-level tool combining tree canopy, surface temperature, income, employment, race, age, language, and health factors. In U.S. cities, tree cover is unevenly distributed.",
  },
  {
    id: "svi",
    short: "CDC/ATSDR SVI",
    title: "CDC/ATSDR Social Vulnerability Index",
    publisher: "CDC / Agency for Toxic Substances and Disease Registry",
    year: "2024",
    type: "Data tool / index",
    strength: "Moderate",
    url: "https://www.atsdr.cdc.gov/place-health/php/svi/index.html",
    summary:
      "A census-based index of social vulnerability used to target preparedness, outreach, and resources. It measures social conditions, not heat exposure or individual risk.",
  },
  {
    id: "hoffmann",
    short: "Hoffmann et al. 2020",
    title:
      "The Effects of Historical Housing Policies on Resident Exposure to Intra-Urban Heat: A Study of 108 US Urban Areas",
    publisher: "Climate (MDPI) · Hoffmann, Shandas & Pendleton",
    year: "2020",
    type: "Peer-reviewed study",
    strength: "Moderate",
    url: "https://www.mdpi.com/2225-1154/8/1/12",
    summary:
      "Across 108 U.S. urban areas, formerly redlined neighborhoods tended to have higher land-surface temperatures. This is an observed association, not proof that housing policy caused the temperature difference.",
  },
  {
    id: "who-green",
    short: "WHO green space",
    title: "Urban green spaces and health: a review of evidence",
    publisher: "WHO Regional Office for Europe",
    year: "2016",
    type: "Evidence review",
    strength: "Moderate",
    url: "https://www.who.int/europe/publications/i/item/WHO-EURO-2016-3352-43111-60341",
    summary:
      "Urban green space is associated with physical activity, mental health, and reduced exposure to heat, noise, and air pollution. Effect sizes and mechanisms vary by context.",
  },
  {
    id: "doe-lead",
    short: "DOE LEAD tool",
    title: "Low-Income Energy Affordability Data (LEAD) Tool",
    publisher: "U.S. Department of Energy",
    year: "2025",
    type: "Data tool / benchmark",
    strength: "Moderate",
    url: "https://www.energy.gov/scep/low-income-energy-affordability-data-lead-tool",
    summary:
      "Energy burden is the share of household income spent on energy. Nationally, low-income households average about 6%, roughly three times the non-low-income average, with wide local variation.",
  },
  {
    id: "cdc-cooling",
    short: "CDC cooling centers",
    title:
      "Use of Cooling Centers to Prevent Heat-Related Illness: Summary of Evidence and Strategies for Implementation",
    publisher: "CDC Climate and Health Program",
    year: "2017",
    type: "Evidence summary",
    strength: "Limited–moderate",
    url: "https://stacks.cdc.gov/view/cdc/47657",
    summary:
      "Cool environments are linked to reduced heat mortality, but evidence on cooling-center utilization and effectiveness is limited. Awareness, transport, trust, hours, and safety shape access.",
  },
];

const opportunitiesRaw = [
  {
    id: "canopy-index",
    title: "Canopy-vulnerability index for compound heat risk",
    shortTitle: "Canopy-vulnerability index",
    tagline:
      "Turn canopy data into compound-risk targeting — not another canopy-only map.",
    track: "Data & targeting",
    domains: ["Urban heat", "Public health", "Tree canopy", "Equity", "Data"],
    hypothesis:
      "If we combine canopy gaps, surface heat, and health vulnerability at block scale, then planting and outreach can be aimed at compound-risk places rather than canopy scores alone — because heat risk is shaped by both exposure and sensitivity.",
    scores: {
      evidence: 78,
      impact: 76,
      novelty: 82,
      feasibility: 88,
      certainty: 62,
      risk: 4,
    },
    uncertaintyNote:
      "The inputs are measurable, but the combination relies on proxies. Canopy and surface temperature do not capture indoor heat or personal exposure, and small-area health data can be sparse.",
    unknowns: [
      "Whether canopy or surface temperature better predicts local heat illness.",
      "Whether health and energy data are complete enough at block scale.",
      "Whether adding energy burden materially changes the site ranking.",
    ],
    path: [
      {
        phase: "Signal",
        kind: "reported",
        domain: "Urban heat",
        title: "Heat and canopy are uneven at small scales",
        claim:
          "Urban heat islands raise temperatures and heat-related risks. Canopy and surface cover vary sharply block to block, and tree cover is uneven across U.S. neighborhoods.",
        sources: ["epa-heat", "tree-equity"],
        edge: "raises",
      },
      {
        phase: "Gap",
        kind: "inferred",
        domain: "Data & equity",
        title: "Current targeting may miss compound risk",
        claim:
          "Planting and outreach are often ranked by canopy gain, cost, or surface temperature alone — not by where heat exposure overlaps with health and energy vulnerability.",
        edge: "checked against",
      },
      {
        phase: "Evidence anchor",
        kind: "reported",
        domain: "Public health",
        title: "Canopy, heat, and vulnerability can be joined",
        claim:
          "Tree Equity Score combines canopy, surface temperature, income, age, race, and health factors. Historical redlining is associated with hotter neighborhoods in many U.S. cities.",
        sources: ["tree-equity", "svi", "hoffmann"],
        edge: "motivates",
      },
      {
        phase: "Opportunity",
        kind: "inferred",
        domain: "Data & equity",
        title: "Build a compound heat-vulnerability index",
        claim:
          "Join block-level canopy gaps, land-surface temperature, heat-related ER visits, and energy burden. Use it to rank 50 planting and outreach sites — and publish the method and uncertainty.",
        edge: "would be tested by",
      },
      {
        phase: "Outcome to test",
        kind: "inferred",
        domain: "Health & canopy",
        title: "Does compound targeting outperform canopy-only ranking?",
        claim:
          "Measure whether ranked sites reach more heat-vulnerable residents and deliver greater cooling per dollar — while treating the result as local evidence, not proof of causation.",
      },
    ],
    risks: [
      {
        severity: "High",
        title: "Ecological fallacy",
        detail:
          "A block-level index can imply that every resident faces the same risk and hide variation by age, housing, occupation, and behavior.",
        mitigation:
          "Publish uncertainty, suppress small counts, and validate against household or individual-level data where available.",
      },
      {
        severity: "Medium",
        title: "Proxy bias",
        detail:
          "Canopy and surface temperature are imperfect measures of personal heat exposure, especially indoors and at night.",
        mitigation:
          "Pair the index with indoor sensors and heat-illness data; test how rankings change with different proxies.",
      },
      {
        severity: "Medium",
        title: "Small-area data privacy",
        detail:
          "Health and energy data at fine scales can be noisy, incomplete, or re-identifiable.",
        mitigation:
          "Set minimum cell sizes, use suppression or privacy-preserving aggregation, and involve data stewards early.",
      },
      {
        severity: "Low",
        title: "Stigmatizing neighborhoods",
        detail:
          "Deficit-only maps can reinforce stigma and miss existing community assets.",
        mitigation:
          "Co-design with residents and publish assets, not just vulnerability.",
      },
    ],
    test: {
      title: "Retrospective validation, then a targeted pilot",
      timeframe: "6 weeks + pilot",
      design:
        "Rank blocks with the index, then compare those rankings with held-out heat-related ER visits and indoor temperature samples from the last three summers. Only then run a planting and outreach pilot.",
      measures: [
        "Rank correlation with held-out ER visits",
        "Index sensitivity to weights",
        "Agreement with resident heat reports",
        "Planting-site overlap",
      ],
      killCriteria:
        "Abandon or redesign if the index does not outperform a canopy-only ranking on held-out outcomes, or if privacy constraints make block-level targeting infeasible.",
    },
  },
  {
    id: "senior-cool-bundles",
    title: "Cool-canopy bundles for senior housing",
    shortTitle: "Senior housing bundles",
    tagline:
      "Bring shade, roof reflectivity, and a cool room to the same heat-vulnerable doorstep.",
    track: "Housing & energy",
    domains: ["Urban heat", "Public health", "Housing", "Energy", "Tree canopy"],
    hypothesis:
      "If shade, cool roofs, and a staffed cooling room are bundled at heat-vulnerable senior housing, then indoor heat and energy burden may fall more reliably than with any single measure — because exposure, building performance, and access to cooling interact.",
    scores: {
      evidence: 84,
      impact: 88,
      novelty: 68,
      feasibility: 66,
      certainty: 56,
      risk: 6,
    },
    uncertaintyNote:
      "Heat-health evidence is strong, but the bundle effect, resident uptake, and long-run maintenance are not established. Trees may take years to deliver meaningful shade.",
    unknowns: [
      "How much indoor cooling comes from shade versus roof reflectivity at each site.",
      "Whether residents will use a shared cooling room.",
      "Who pays for tree and equipment maintenance after the pilot.",
    ],
    path: [
      {
        phase: "Signal",
        kind: "reported",
        domain: "Public health",
        title: "Heat is a serious risk for older adults",
        claim:
          "Heat can worsen cardiovascular, respiratory, kidney, and mental health conditions. People aged 65+ and those with limited cooling access are at higher risk.",
        sources: ["who-heat", "cdc-heat"],
        edge: "raises",
      },
      {
        phase: "Gap",
        kind: "inferred",
        domain: "Housing & energy",
        title: "Single measures may miss overlapping burdens",
        claim:
          "A tree program, a weatherization program, and a health outreach team may each target the same neighborhood without coordinating — or miss the sites where heat, age, and energy burden overlap.",
        edge: "checked against",
      },
      {
        phase: "Evidence anchor",
        kind: "reported",
        domain: "Canopy & energy",
        title: "Shade and cool roofs reduce heat exposure",
        claim:
          "Trees cool through shade and evapotranspiration; cool roofs reflect sunlight and can cut cooling demand in warm climates. Low-income households face higher energy burdens on average.",
        sources: ["epa-trees", "doe-cool-roofs", "doe-lead"],
        edge: "motivates",
      },
      {
        phase: "Opportunity",
        kind: "inferred",
        domain: "Housing & energy",
        title: "Bundle cooling at senior-housing sites",
        claim:
          "Sequence cool roofs, temporary shade, and a staffed cooling room at 10 sites while trees mature. Pair the physical work with resident outreach and funded maintenance.",
        edge: "would be tested by",
      },
      {
        phase: "Outcome to test",
        kind: "inferred",
        domain: "Health & energy",
        title: "Test indoor heat, energy, and wellbeing together",
        claim:
          "Track indoor temperature, peak cooling demand, resident-reported heat symptoms, cooling-room use, and maintenance cost against matched sites.",
      },
    ],
    risks: [
      {
        severity: "High",
        title: "Tree benefits arrive slowly",
        detail:
          "New trees may take years to produce meaningful shade, while heat risk is immediate.",
        mitigation:
          "Sequence cool roofs, temporary shade, and cooling rooms first; plant for medium-term canopy.",
      },
      {
        severity: "High",
        title: "Low trust or low uptake",
        detail:
          "Residents may avoid shared cooling rooms because of safety, stigma, language, mobility, or past experiences.",
        mitigation:
          "Co-design with residents and building staff; offer familiar, staffed spaces and transport support.",
      },
      {
        severity: "Medium",
        title: "Building constraints",
        detail:
          "Roof condition, tenure, lease terms, and historic-preservation rules can block cool roofs or retrofits.",
        mitigation:
          "Screen sites for structural and ownership feasibility before scoring them.",
      },
      {
        severity: "Medium",
        title: "Displacement risk",
        detail:
          "Visible improvements can raise rents or property values, undermining the intended benefit.",
        mitigation:
          "Pair upgrades with tenant protections, anti-displacement commitments, and affordable-housing partners.",
      },
    ],
    test: {
      title: "Stepped-wedge pilot across senior-housing sites",
      timeframe: "2 summers",
      design:
        "Work with 6–8 senior-housing sites. Install cool roofs and cooling rooms first, then stagger tree planting and shade. Compare treated and not-yet-treated sites with indoor sensors, energy data, and resident surveys.",
      measures: [
        "Indoor temperature and humidity",
        "Peak cooling demand",
        "Resident heat symptoms / wellbeing",
        "Cooling-room attendance",
        "Maintenance cost",
      ],
      killCriteria:
        "Stop if indoor heat does not improve at treated sites after one summer, if cooling-room use stays persistently low, or if maintenance costs exceed the program budget.",
    },
  },
  {
    id: "shade-school-routes",
    title: "Shade-first school commute corridors",
    shortTitle: "Shade-first school routes",
    tagline:
      "Make the walk to school cooler, safer, and more walkable on hot days.",
    track: "Schools & mobility",
    domains: ["Urban heat", "Public health", "Mobility", "Tree canopy", "Children"],
    hypothesis:
      "If the hottest school walking routes get continuous shade and cooling supports, then more children may walk safely on hot days with lower heat exposure — because shade changes both comfort and route usability.",
    scores: {
      evidence: 80,
      impact: 78,
      novelty: 72,
      feasibility: 70,
      certainty: 52,
      risk: 5,
    },
    uncertaintyNote:
      "The cooling value of shade is well supported, but the behavior change is not. Walking is shaped by distance, traffic, school policy, weather, and family routines.",
    unknowns: [
      "Whether shade changes walking behavior or only comfort.",
      "Which routes families actually use.",
      "How much cooling temporary shade provides at street level.",
    ],
    path: [
      {
        phase: "Signal",
        kind: "reported",
        domain: "Canopy & mobility",
        title: "Shade is scarce on many daily routes",
        claim:
          "Trees and vegetation cool streets, but canopy is unevenly distributed. Many neighborhoods with less tree cover also have higher heat exposure.",
        sources: ["epa-trees", "tree-equity"],
        edge: "raises",
      },
      {
        phase: "Gap",
        kind: "inferred",
        domain: "Mobility & heat",
        title: "Route-level shade is rarely mapped",
        claim:
          "Heat plans, school travel plans, and tree planting often use different maps, so the hottest walking routes may not be prioritized for shade.",
        edge: "checked against",
      },
      {
        phase: "Evidence anchor",
        kind: "reported",
        domain: "Public health",
        title: "Shade and green space support healthier travel",
        claim:
          "Shade can sharply reduce perceived heat, and urban green space is associated with physical activity and better mental health. The size and mechanism of these benefits vary.",
        sources: ["who-heat", "who-green"],
        edge: "motivates",
      },
      {
        phase: "Opportunity",
        kind: "inferred",
        domain: "Mobility & canopy",
        title: "Build shade-first school corridors",
        claim:
          "Map the 20 hottest school walk routes; add trees, temporary shade, water, and safe crossings; pair the work with Safe Routes to School programming and family outreach.",
        edge: "would be tested by",
      },
      {
        phase: "Outcome to test",
        kind: "inferred",
        domain: "Health & mobility",
        title: "Test comfort, walking, and route safety",
        claim:
          "Compare shade, surface temperature, observed walking, parent-reported barriers, and safety before and after — across matched routes.",
      },
    ],
    risks: [
      {
        severity: "High",
        title: "Tree survival and maintenance",
        detail:
          "Young trees need watering, protection, and years to canopy; many planting programs lose trees early.",
        mitigation:
          "Fund maintenance, choose climate-suited species, and pair trees with temporary shade.",
      },
      {
        severity: "Medium",
        title: "Safety trade-offs",
        detail:
          "Trees and shade structures can conflict with sightlines, sidewalks, utilities, or traffic safety.",
        mitigation:
          "Audit routes with families and traffic engineers; start with quick-build trials.",
      },
      {
        severity: "Medium",
        title: "Behavior confounds",
        detail:
          "Walking is shaped by distance, traffic, school policy, and weather, not heat alone.",
        mitigation:
          "Compare matched routes, track mode shift before and after, and include parent surveys.",
      },
      {
        severity: "Medium",
        title: "Uneven reach",
        detail:
          "Route improvements may benefit families with more flexibility, not those most heat-exposed.",
        mitigation:
          "Prioritize routes serving heat-vulnerable students and add water and cooling supports.",
      },
    ],
    test: {
      title: "Quick-build trial on matched school routes",
      timeframe: "2 school terms",
      design:
        "Install temporary shade, water, and safe-crossing improvements on 8 high-heat routes before summer. Compare with matched routes, and add tree planting where maintenance is funded.",
      measures: [
        "Route surface temperature",
        "Walk / bike counts",
        "Parent-reported barriers",
        "Tree survival",
        "Heat symptoms",
      ],
      killCriteria:
        "Stop if route temperatures do not fall, walking does not increase after two school terms, or safety incidents rise.",
    },
  },
  {
    id: "overnight-cool-refuge",
    title: "Overnight cooling refuge network",
    shortTitle: "Overnight cooling refuges",
    tagline:
      "Make safe, cool sleep possible when the night stays dangerously hot.",
    track: "Night & access",
    domains: ["Urban heat", "Public health", "Equity", "Social infrastructure"],
    hypothesis:
      "If trusted community sites stay open overnight during heat alerts with transport help, then people without home cooling may get safer nighttime recovery — because access and trust, not just building availability, shape use.",
    scores: {
      evidence: 62,
      impact: 84,
      novelty: 76,
      feasibility: 64,
      certainty: 42,
      risk: 7,
    },
    uncertaintyNote:
      "The health rationale is clear, but the intervention is not well evidenced. Cooling-center use is often low, and reaching people with the least access is the central unknown.",
    unknowns: [
      "Whether people who most need refuge can reach it.",
      "Whether overnight use reduces ER visits or improves sleep.",
      "What staffing and transport model is financially viable.",
    ],
    path: [
      {
        phase: "Signal",
        kind: "reported",
        domain: "Health & housing",
        title: "Night heat prevents recovery",
        claim:
          "Extended high day and night temperatures create cumulative stress on the body. People without cooling or quality housing are disproportionately exposed.",
        sources: ["who-heat", "cdc-heat"],
        edge: "raises",
      },
      {
        phase: "Gap",
        kind: "inferred",
        domain: "Access & equity",
        title: "Cooling options may not fit the night",
        claim:
          "Many cooling centers operate daytime hours; transport, awareness, trust, and safety can block access even when a site is open.",
        edge: "checked against",
      },
      {
        phase: "Evidence anchor",
        kind: "reported",
        domain: "Public health",
        title: "Cool spaces can help, but use is uneven",
        claim:
          "Cool environments are associated with lower heat mortality, but evidence on cooling-center effectiveness is limited. Utilization is often low, and access barriers matter.",
        sources: ["cdc-cooling", "who-heat"],
        edge: "motivates",
      },
      {
        phase: "Opportunity",
        kind: "inferred",
        domain: "Access & equity",
        title: "Fund a small overnight refuge network",
        claim:
          "Support 2–3 trusted libraries, community centers, or faith spaces to stay open overnight during heat alerts, with transport vouchers, peer navigators, and low-barrier entry.",
        edge: "would be tested by",
      },
      {
        phase: "Outcome to test",
        kind: "inferred",
        domain: "Health & access",
        title: "Test reach, use, and a health signal",
        claim:
          "Measure overnight visits, transport use, ER visits during alerts, and resident-reported sleep and wellbeing against matched heat-alert nights.",
      },
    ],
    risks: [
      {
        severity: "High",
        title: "Low uptake",
        detail:
          "Cooling centers are often underused; opening at night does not guarantee reach or trust.",
        mitigation:
          "Invest in trusted outreach, transport, and low-barrier entry; measure who is and is not reached.",
      },
      {
        severity: "High",
        title: "Staffing and safety",
        detail:
          "Overnight operation creates liability, staffing, and safety challenges.",
        mitigation:
          "Partner with experienced providers, start with 2–3 sites, and publish clear operating standards.",
      },
      {
        severity: "Medium",
        title: "Trust and privacy",
        detail:
          "People may avoid formal shelters due to immigration, policing, or stigma concerns.",
        mitigation:
          "Use familiar community sites and peer navigators; avoid collecting unnecessary personal data.",
      },
      {
        severity: "Medium",
        title: "Limited causal evidence",
        detail:
          "Evidence that cooling centers reduce morbidity or mortality is limited and context-dependent.",
        mitigation:
          "Pre-register outcomes and compare with matched heat-alert nights and nearby sites.",
      },
    ],
    test: {
      title: "Two-site pilot during heat alerts",
      timeframe: "2 heat seasons",
      design:
        "Pilot 2–3 trusted sites during heat alerts with transport vouchers and peer navigators. Compare visits, ER use, and resident-reported sleep with matched nights and nearby sites.",
      measures: [
        "Overnight visits",
        "Transport vouchers used",
        "ER visits during alerts",
        "Sleep / wellbeing reports",
        "Staffing cost per guest-night",
      ],
      killCriteria:
        "Stop if sites serve very few of the target population, if safe staffing cannot be sustained, or if no measurable benefit appears across two heat seasons.",
    },
  },
];

export const opportunities = opportunitiesRaw;
