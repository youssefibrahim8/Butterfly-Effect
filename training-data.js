// Labeled training set for Butterfly Effect's own concern classifier.
// Each example is a fictional, hand-written resident concern labeled with the
// opportunity path it best fits. "out-of-scope" teaches the model to say no.

export const LABELS = [
  "canopy-index",
  "senior-cool-bundles",
  "shade-school-routes",
  "overnight-cool-refuge",
  "out-of-scope",
];

export const trainingData = [
  // canopy-index: using maps / data to prioritize trees and heat outreach
  ["canopy-index", "The city tree planting list is based on tree cover only and ignores which blocks have the most heat illness."],
  ["canopy-index", "We have a heat map and asthma data by ZIP code. Can we combine them to decide where to plant trees first?"],
  ["canopy-index", "Our neighborhood has almost no tree canopy but it never shows up on the city's priority ranking."],
  ["canopy-index", "Satellite surface temperature maps show our blocks are the hottest, but nobody uses that data for planning."],
  ["canopy-index", "How do we rank which streets need trees most when health and income data are spread across different websites?"],
  ["canopy-index", "The urban forestry plan picks sites by available space, not by where vulnerable people live."],
  ["canopy-index", "Wealthier areas get new trees every year while the hot low income east side keeps getting skipped."],
  ["canopy-index", "I want to build an index that combines canopy cover, heat, and social vulnerability to guide planting."],
  ["canopy-index", "The tree equity score and the vulnerability index tell different stories and the council does not know which to trust."],
  ["canopy-index", "Our block is a concrete heat island with no green cover and we need evidence to ask the city for trees."],
  ["canopy-index", "Could a data dashboard help the city choose planting and outreach sites based on heat risk?"],
  ["canopy-index", "Tree cover maps are years old and miss the new parking lots that made our area hotter."],
  ["canopy-index", "Community groups need a simple map showing where heat, poverty, and missing trees overlap."],
  ["canopy-index", "The greening budget is limited, so we need a fair way to prioritize neighborhoods."],
  ["canopy-index", "Planting lists ignore where people with heart and lung conditions actually live."],

  // senior-cool-bundles: older adults overheating at home, energy costs
  ["senior-cool-bundles", "My grandmother's apartment stays hot at night even with a fan and she cannot afford to run the air conditioner."],
  ["senior-cool-bundles", "Seniors in our building avoid using AC because the electricity bill is already too high."],
  ["senior-cool-bundles", "Older residents on fixed incomes live on the top floor under an old roof and it gets dangerously hot."],
  ["senior-cool-bundles", "The common room has air conditioning but it is closed on weekends when the heat is worst."],
  ["senior-cool-bundles", "My elderly neighbor felt dizzy and confused during the heat wave and lives alone in her apartment."],
  ["senior-cool-bundles", "Our senior housing complex has no shade around it and the units bake all afternoon."],
  ["senior-cool-bundles", "Retirees keep their windows closed for safety and the apartments become ovens in summer."],
  ["senior-cool-bundles", "Grandparents in subsidized housing worry more about the energy bill than about overheating."],
  ["senior-cool-bundles", "Many older adults take medication that makes heat more dangerous and their homes have no cooling."],
  ["senior-cool-bundles", "Nobody checks on isolated seniors in our building during hot weather."],
  ["senior-cool-bundles", "The low-rise apartment building for older people has a dark roof and the top floor reaches thirty degrees at night."],
  ["senior-cool-bundles", "My grandfather sleeps badly in summer because his bedroom never cools down and the utility costs scare him."],
  ["senior-cool-bundles", "Elderly tenants cannot sleep in hot apartments and the landlord will not install cooling."],
  ["senior-cool-bundles", "Fixed income seniors have to choose between paying for cooling and paying for food."],
  ["senior-cool-bundles", "Indoor heat in older apartments is hurting the health of elderly residents in our area."],

  // shade-school-routes: kids walking/playing outdoors without shade
  ["shade-school-routes", "The walk to school has almost no shade and children arrive hot and tired."],
  ["shade-school-routes", "Kids wait at the bus stop in full sun with no shelter or water."],
  ["shade-school-routes", "The schoolyard is all asphalt and too hot to use at recess."],
  ["shade-school-routes", "Families drive their kids a few blocks to school because the sidewalk is too hot to walk."],
  ["shade-school-routes", "The playground slide burns children's hands in June and there are no trees nearby."],
  ["shade-school-routes", "Teachers move recess indoors on hot days because there is no shade outside."],
  ["shade-school-routes", "Students walking home in the afternoon heat have nowhere to stop and cool down."],
  ["shade-school-routes", "The crossing guard stands in the sun for hours and children line up on hot pavement."],
  ["shade-school-routes", "Could shade sails or street trees make the route to our elementary school safer in summer?"],
  ["shade-school-routes", "Children at our school get headaches after outdoor gym class in the heat."],
  ["shade-school-routes", "The city is repaving the street to the school and we want them to add trees and water fountains."],
  ["shade-school-routes", "Kids biking to school in the morning are already sweaty and exhausted before class starts."],
  ["shade-school-routes", "The park next to the school has no shade so students avoid it after class."],
  ["shade-school-routes", "Outdoor sports practice at the school field is cancelled on hot days because there is no cover."],
  ["shade-school-routes", "Parents say the sidewalks near the school are hot and unshaded during pickup."],

  // overnight-cool-refuge: unhoused people, nowhere cool at night
  ["overnight-cool-refuge", "People without housing have nowhere cool to sleep during heat alerts."],
  ["overnight-cool-refuge", "The cooling center closes at 5 pm but nights are still dangerously hot."],
  ["overnight-cool-refuge", "Unhoused neighbors sleep in cars and tents downtown during the heat wave."],
  ["overnight-cool-refuge", "Homeless people near the library have no place to go when it is hot at night."],
  ["overnight-cool-refuge", "A church offered space for an overnight cooling shelter but needs staff and transport."],
  ["overnight-cool-refuge", "Shelters are full during heat emergencies and people end up sleeping outside."],
  ["overnight-cool-refuge", "People living in encampments get heat exhaustion and there is no water or shade overnight."],
  ["overnight-cool-refuge", "The library could stay open late as a cooling space but nobody has organized it."],
  ["overnight-cool-refuge", "Outreach workers say unhoused people avoid the cooling center because they cannot bring their belongings."],
  ["overnight-cool-refuge", "There is no late night transport to cooling centers for people without homes."],
  ["overnight-cool-refuge", "Heat alerts are posted online but homeless residents never hear about them."],
  ["overnight-cool-refuge", "People sleeping rough downtown have nowhere to escape the heat after dark."],
  ["overnight-cool-refuge", "Our drop-in centre closes in the evening and people without housing are left in the heat all night."],
  ["overnight-cool-refuge", "We need an overnight refuge with fans, water, and safe storage during heat emergencies."],
  ["overnight-cool-refuge", "Someone living in their car nearly died during the last hot night."],

  // out-of-scope: concerns this sample cannot honestly address
  ["out-of-scope", "There are huge potholes on our street and the city never fixes them."],
  ["out-of-scope", "The bus comes every forty minutes and is always late."],
  ["out-of-scope", "Loud parties next door keep the whole street awake on weekends."],
  ["out-of-scope", "Our basement floods every spring when the snow melts."],
  ["out-of-scope", "Rent has gone up so much that families are moving out of the neighborhood."],
  ["out-of-scope", "There is no grocery store within walking distance so we buy food at the gas station."],
  ["out-of-scope", "The sidewalks are icy all winter and older people are afraid to walk."],
  ["out-of-scope", "Our school does not have enough laptops for students to do homework."],
  ["out-of-scope", "Cars speed through the residential street and someone is going to get hurt."],
  ["out-of-scope", "Garbage pickup keeps getting missed and the bins overflow."],
  ["out-of-scope", "Young people have nothing to do after school because the youth centre closed."],
  ["out-of-scope", "The wifi at the public library is too slow to apply for jobs online."],
  ["out-of-scope", "Our apartment has mould and the landlord ignores repair requests."],
  ["out-of-scope", "There are not enough family doctors and the clinic wait list is two years."],
  ["out-of-scope", "Stray dogs in the park scare the kids."],

  // --- Round 2: more varied phrasing, including Canadian / Ottawa wording ---
  ["canopy-index", "Which wards in Ottawa have the least tree canopy and the most heat-related ER visits?"],
  ["canopy-index", "The city's urban forest plan should use heat vulnerability data to decide where trees go first."],
  ["canopy-index", "Our neighbourhood lost dozens of trees after the storm and nobody is tracking where replanting is most needed."],
  ["canopy-index", "I'd like to compare a canopy map with census income data to show the council where heat risk is highest."],
  ["canopy-index", "Big parking lots and no greenery make our area noticeably hotter than the leafy suburbs."],
  ["canopy-index", "Tree planting money keeps going to neighbourhoods that already have lots of trees."],
  ["canopy-index", "We want evidence about which blocks should get shade trees first based on heat and health."],
  ["canopy-index", "A map of hot spots and missing trees would help our community association lobby the city."],
  ["canopy-index", "The heat island effect downtown is getting worse and planting decisions ignore it."],
  ["canopy-index", "How can we prioritize greening across the city fairly using public data?"],

  ["senior-cool-bundles", "My grandmother in a seniors' building in Vanier keeps her blinds closed but her unit is still stifling."],
  ["senior-cool-bundles", "Older tenants in our co-op can't afford window air conditioners or the hydro bill to run them."],
  ["senior-cool-bundles", "During the heat warning my elderly neighbour stayed inside her hot apartment all day and felt faint."],
  ["senior-cool-bundles", "Pensioners in the high-rise have no cooling and the hallways trap the heat."],
  ["senior-cool-bundles", "Our seniors' residence has one air-conditioned lounge and it closes at night."],
  ["senior-cool-bundles", "My grandpa refuses to turn on the AC because he is worried about his hydro costs."],
  ["senior-cool-bundles", "Isolated older people in apartments overheat and nobody does wellness checks."],
  ["senior-cool-bundles", "The top floor of my nana's building is so hot she sleeps on the couch in the lobby."],
  ["senior-cool-bundles", "Seniors with heart conditions live in units that never cool down at night."],
  ["senior-cool-bundles", "Low-income older adults have to choose between cooling their home and buying medication."],

  ["shade-school-routes", "Students walking to the high school along the main road have no shade at all in June."],
  ["shade-school-routes", "The daycare yard is all rubber matting and gets too hot for the toddlers to play outside."],
  ["shade-school-routes", "Kids at our school get sunburned waiting for the bus because the shelter was removed."],
  ["shade-school-routes", "The walk from the subdivision to the elementary school is a long stretch of hot sidewalk."],
  ["shade-school-routes", "There's no water fountain or shade along the route children take to school."],
  ["shade-school-routes", "Summer camp kids at the park have nowhere shaded to sit between activities."],
  ["shade-school-routes", "The splash pad is closed and the schoolyard has no trees, so kids have nowhere to cool off at recess."],
  ["shade-school-routes", "Teachers say students are exhausted after walking home in the afternoon sun."],
  ["shade-school-routes", "Parents want trees planted along the walking route to the school."],
  ["shade-school-routes", "Outdoor recess is being cut short because the pavement is too hot."],

  ["overnight-cool-refuge", "People sleeping outside in the ByWard Market have nowhere to cool down at night during heat warnings."],
  ["overnight-cool-refuge", "Cooling centres in our city close in the evening, but unhoused people need somewhere overnight."],
  ["overnight-cool-refuge", "Someone in the tent encampment by the river got heat stroke after a hot night."],
  ["overnight-cool-refuge", "The shelter has no air conditioning and is turning people away during the heat wave."],
  ["overnight-cool-refuge", "People living in their vehicles have no safe, cool place to sleep in summer."],
  ["overnight-cool-refuge", "Outreach teams hand out water but there is no overnight cooling space for people without homes."],
  ["overnight-cool-refuge", "Unhoused people avoid cooling centres because pets and belongings aren't allowed."],
  ["overnight-cool-refuge", "A community centre could open overnight during extreme heat if there were volunteers."],
  ["overnight-cool-refuge", "Homeless neighbours don't hear about heat alerts or where to go at night."],
  ["overnight-cool-refuge", "We need a late-night cooling refuge near downtown for people sleeping rough."],

  ["out-of-scope", "Snow plows leave huge banks at the end of our driveway every winter."],
  ["out-of-scope", "The LRT keeps breaking down and people are late for work."],
  ["out-of-scope", "Our hockey arena needs new boards and the change rooms are falling apart."],
  ["out-of-scope", "There is graffiti on every wall along the bike path."],
  ["out-of-scope", "The community garden lost its funding and the plots are overgrown."],
  ["out-of-scope", "Parking downtown is too expensive for families visiting the museum."],
  ["out-of-scope", "Our street has no crosswalk and kids have to run across four lanes."],
  ["out-of-scope", "Childcare spaces are full and the waitlist is over a year."],
  ["out-of-scope", "Tenants in our building keep getting renovictions."],
  ["out-of-scope", "There's broken glass all over the basketball court."],
];

// Which clarifying question resolves confusion between two paths.
// Keyed by the two labels in alphabetical order, joined with "|".
export const clarifiers = {
  "senior-cool-bundles|shade-school-routes": {
    question: "Is the heat exposure mainly indoors at home, or outdoors on the way somewhere?",
    choices: ["Indoors at home", "Outdoors, walking or playing", "Both"],
  },
  "overnight-cool-refuge|senior-cool-bundles": {
    question: "Do the people affected have a home they can stay in?",
    choices: ["Yes, they have housing", "No, they are unhoused or in cars", "Not sure"],
  },
  "canopy-index|shade-school-routes": {
    question: "Are you looking for data to decide where to act, or a direct fix on one route or yard?",
    choices: ["Data to prioritize areas", "A direct fix for one place", "Not sure"],
  },
  "canopy-index|senior-cool-bundles": {
    question: "Are you looking for data to prioritize neighborhoods, or help for specific residents' homes?",
    choices: ["Data to prioritize areas", "Help for specific homes", "Not sure"],
  },
  "canopy-index|overnight-cool-refuge": {
    question: "Is the main problem where to plant trees, or where people can go to cool off?",
    choices: ["Where to plant trees", "Where people can cool off", "Not sure"],
  },
  "overnight-cool-refuge|shade-school-routes": {
    question: "Who is most affected: children on school trips, or people without housing?",
    choices: ["Children going to school", "People without housing", "Both"],
  },
};

// Extra words appended to the concern for each clarifier answer, so the model
// can re-classify with the new detail.
export const answerHints = {
  "Indoors at home": "indoors apartment home bedroom night",
  "Outdoors, walking or playing": "outdoors walk sidewalk playground school",
  "Yes, they have housing": "apartment home housing residents",
  "No, they are unhoused or in cars": "unhoused homeless sleeping cars shelter",
  "Data to prioritize areas": "data map index rank prioritize planting",
  "A direct fix for one place": "school route shade playground",
  "Help for specific homes": "apartment seniors home cooling bill",
  "Where to plant trees": "trees canopy planting map",
  "Where people can cool off": "cooling center shelter overnight",
  "Children going to school": "children school walk recess",
  "People without housing": "unhoused homeless shelter overnight",
};
