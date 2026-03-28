import scubaSeasons from "@/data/scuba-seasons.json";

export type ScubaSeasonWindow = {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
};

export type ScubaSeasonEntry = {
  id: string;
  site: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  diveStyle?: string;
  season: ScubaSeasonWindow;
  notes: string;
};

export type ScubaGlobeMarker = {
  id: string;
  site: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  label: string;
  color: string;
  notes: string;
  seasonLabel: string;
  season: ScubaSeasonWindow;
  isInSeason: boolean;
  sightings: Array<{
    name: string;
    likelihood: "High" | "Medium" | "Occasional";
  }>;
  diveStyle: string;
  experienceLevel: string;
  conditions: string;
  gear: string[];
  waterTemp: string;
  suitRecommendation: string;
  gettingThere: string;
  stay: string;
  tripMode: "liveaboard" | "resort";
  experienceTags: Array<"beginner" | "intermediate" | "advanced">;
  interestTags: string[];
  animalTags: string[];
};

const scubaEntries = scubaSeasons as ScubaSeasonEntry[];
const IN_SEASON_COLOR = "#2f5d39";
const OUT_OF_SEASON_COLOR = "#6b1f2c";

type SiteDetailOverride = {
  sightings?: Array<{
    name: string;
    likelihood: "High" | "Medium" | "Occasional";
  }>;
  experienceLevel?: string;
  conditions?: string;
  gear?: string[];
  waterTemp?: string;
  suitRecommendation?: string;
  gettingThere?: string;
  stay?: string;
};

const formatMonthDay = (month: number, day: number) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2024, month - 1, day)));

const getDayOfYear = (month: number, day: number) => {
  const date = new Date(Date.UTC(2024, month - 1, day));
  const startOfYear = new Date(Date.UTC(2024, 0, 1));

  return Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000) + 1;
};

export const formatSeasonWindow = (season: ScubaSeasonWindow) =>
  `${formatMonthDay(season.startMonth, season.startDay)} - ${formatMonthDay(season.endMonth, season.endDay)}`;

export const isDateInSeason = (date: Date, season: ScubaSeasonWindow) => {
  const targetDayOfYear = getDayOfYear(date.getUTCMonth() + 1, date.getUTCDate());
  const startDayOfYear = getDayOfYear(season.startMonth, season.startDay);
  const endDayOfYear = getDayOfYear(season.endMonth, season.endDay);

  if (startDayOfYear <= endDayOfYear) {
    return targetDayOfYear >= startDayOfYear && targetDayOfYear <= endDayOfYear;
  }

  return targetDayOfYear >= startDayOfYear || targetDayOfYear <= endDayOfYear;
};

const SITE_SIGHTINGS: Record<
  string,
  Array<{ name: string; likelihood: "High" | "Medium" | "Occasional" }>
> = {
  "ari-atoll-maldives": [
    { name: "Reef manta rays", likelihood: "High" },
    { name: "Whale sharks", likelihood: "Medium" },
    { name: "Grey reef sharks", likelihood: "Occasional" }
  ],
  "raja-ampat-indonesia": [
    { name: "Oceanic manta rays", likelihood: "High" },
    { name: "Pygmy seahorses", likelihood: "Medium" },
    { name: "Wobbegong sharks", likelihood: "Medium" }
  ],
  "komodo-national-park-indonesia": [
    { name: "Reef manta rays", likelihood: "High" },
    { name: "White-tip reef sharks", likelihood: "Medium" },
    { name: "Turtles on current-swept reefs", likelihood: "Medium" }
  ],
  "malapascua-philippines": [
    { name: "Thresher sharks", likelihood: "High" },
    { name: "Mandarinfish", likelihood: "Medium" },
    { name: "Nudibranch macro life", likelihood: "Medium" }
  ],
  "tubbataha-philippines": [
    { name: "Grey reef sharks", likelihood: "High" },
    { name: "Schooling jacks and barracuda", likelihood: "High" },
    { name: "Whale sharks", likelihood: "Occasional" }
  ],
  "similan-islands-thailand": [
    { name: "Napoleon wrasse", likelihood: "Medium" },
    { name: "Whale sharks", likelihood: "Occasional" },
    { name: "Leopard sharks", likelihood: "Occasional" }
  ],
  "sipadan-malaysia": [
    { name: "Green and hawksbill turtles", likelihood: "High" },
    { name: "Barracuda tornadoes", likelihood: "High" },
    { name: "Bumphead parrotfish", likelihood: "Medium" }
  ],
  "brothers-egypt": [
    { name: "Oceanic whitetips", likelihood: "Medium" },
    { name: "Scalloped hammerheads", likelihood: "Occasional" },
    { name: "Grey reef sharks", likelihood: "Medium" }
  ],
  "cozumel-mexico": [
    { name: "Eagle rays", likelihood: "Medium" },
    { name: "Splendid toadfish", likelihood: "Medium" },
    { name: "Large sponges and sea fans", likelihood: "High" }
  ],
  "socorro-mexico": [
    { name: "Giant Pacific mantas", likelihood: "High" },
    { name: "Bottlenose dolphins", likelihood: "Medium" },
    { name: "Silky and Galapagos sharks", likelihood: "Medium" }
  ],
  "cocos-costa-rica": [
    { name: "Scalloped hammerheads", likelihood: "High" },
    { name: "Tiger sharks", likelihood: "Occasional" },
    { name: "Giant mantas", likelihood: "Occasional" }
  ],
  "wolf-galapagos-ecuador": [
    { name: "Scalloped hammerheads", likelihood: "High" },
    { name: "Whale sharks", likelihood: "Medium" },
    { name: "Silky sharks", likelihood: "Medium" }
  ],
  "darwin-galapagos-ecuador": [
    { name: "Scalloped hammerheads", likelihood: "High" },
    { name: "Silky sharks", likelihood: "Medium" },
    { name: "Whale sharks", likelihood: "Medium" }
  ],
  "fernando-de-noronha-brazil": [
    { name: "Spinner dolphins", likelihood: "High" },
    { name: "Sea turtles", likelihood: "High" },
    { name: "Reef sharks", likelihood: "Occasional" }
  ],
  "blue-corner-palau": [
    { name: "Grey reef sharks", likelihood: "High" },
    { name: "Schooling barracuda", likelihood: "High" },
    { name: "Napoleon wrasse", likelihood: "Medium" }
  ],
  "manta-ridge-yap": [
    { name: "Reef manta rays", likelihood: "High" },
    { name: "Cleaner wrasse stations", likelihood: "High" },
    { name: "Eagle rays", likelihood: "Occasional" }
  ],
  "chuuk-lagoon-fsm": [
    { name: "WWII cargo holds and machinery", likelihood: "High" },
    { name: "Soft coral on wreck superstructure", likelihood: "Medium" },
    { name: "Batfish and resident reef fish", likelihood: "Medium" }
  ],
  "president-coolidge-vanuatu": [
    { name: "Massive intact wreck structure", likelihood: "High" },
    { name: "Historic military artifacts", likelihood: "High" },
    { name: "Resident lionfish and schooling fish", likelihood: "Medium" }
  ],
  "gozo-malta": [
    { name: "Arches and caverns", likelihood: "High" },
    { name: "Mediterranean wrecks", likelihood: "Medium" },
    { name: "Blue-water swim-throughs", likelihood: "High" }
  ],
  "silfra-iceland": [
    { name: "Freshwater fissure geology", likelihood: "High" },
    { name: "Near-perfect visibility", likelihood: "High" },
    { name: "Tectonic plates scenery", likelihood: "High" }
  ]
};

const SITE_DETAILS: Record<string, SiteDetailOverride> = {
  "raja-ampat-indonesia": {
    experienceLevel: "Intermediate to advanced. Many signature sites are drift dives with current management.",
    conditions: "Warm water, nutrient-rich current, and sites that can swing from easy reef dives to challenging drift entries.",
    gear: ["Reef hook for current-exposed sites", "Wide-angle lens plus macro option"],
    waterTemp: "82 to 86 F (28 to 30 C)",
    suitRecommendation: "3 mm wetsuit or a full skin if you run warm",
    gettingThere: "Fly to Sorong, then connect onward by ferry or resort transfer toward Waisai or your liveaboard departure point.",
    stay: "Good base options are Waisai and resort properties on Waigeo or Gam if you are not doing a liveaboard."
  },
  "sipadan-malaysia": {
    experienceLevel: "Intermediate to advanced. Best known sites are deep, current-prone and tightly permit-controlled.",
    conditions: "Warm tropical water with schooling pelagics, turtles, and occasional strong current around drop-offs.",
    gear: ["Surface marker buoy", "Reef-safe gloves only if operator rules allow for current handling"],
    waterTemp: "80 to 84 F (27 to 29 C)",
    suitRecommendation: "3 mm wetsuit for most divers",
    gettingThere: "Fly to Tawau, transfer by road to Semporna, then continue by boat to Mabul/Kapalai-area resorts and day boats for Sipadan permits.",
    stay: "Most divers stay in Semporna for budget logistics or on Mabul/Kapalai resorts for easier early departures."
  },
  "socorro-mexico": {
    experienceLevel: "Advanced. Remote offshore diving with blue-water entries, current and exposed surface conditions.",
    conditions: "Open-ocean conditions, giant mantas, dolphins, shark action and long-range crossings.",
    gear: ["Nautilus or personal locator if your operator recommends it", "Good seasickness prep"],
    waterTemp: "70 to 78 F (21 to 26 C)",
    suitRecommendation: "5 mm wetsuit for most divers",
    gettingThere: "Fly to Cabo San Lucas or San Jose del Cabo, then board a liveaboard from Cabo San Lucas marina.",
    stay: "Overnight in Cabo San Lucas before and after the trip; marina-adjacent hotels make logistics easier."
  },
  "cocos-costa-rica": {
    experienceLevel: "Advanced. Strong current, surge and long liveaboard crossings are normal.",
    conditions: "Powerful current, schooling hammerheads, lower visibility in the most action-packed season and rougher surface intervals.",
    gear: ["Reef hook if your operator uses them", "Seasickness medication"],
    waterTemp: "75 to 82 F (24 to 28 C)",
    suitRecommendation: "5 mm wetsuit if you get cold easily, otherwise a 3 mm to 5 mm suit works",
    gettingThere: "Fly to San Jose, overnight if needed, then transfer to Puntarenas for your liveaboard departure.",
    stay: "Airport hotels in San Jose or simple Puntarenas overnight stops work best for embarkation timing."
  },
  "brothers-egypt": {
    experienceLevel: "Advanced. Deep walls and offshore current diving are the draw here.",
    conditions: "Blue-water pelagic diving with current, exposed pickup conditions and variable thermoclines.",
    gear: ["SMB and reel", "Reef hook depending on operator style"],
    waterTemp: "72 to 82 F (22 to 28 C)",
    suitRecommendation: "3 mm to 5 mm wetsuit depending on season and cold tolerance",
    gettingThere: "Most trips route through Hurghada or Marsa Alam, then continue by liveaboard to offshore southern Red Sea itineraries.",
    stay: "One-night transit stays in Hurghada or Marsa Alam are the easiest pre-boarding option."
  },
  "similan-islands-thailand": {
    experienceLevel: "Beginner to advanced depending on site. Boulder fields and exposed offshore pinnacles can be very different experiences.",
    conditions: "Warm clear water in season, with easier reef sites and more current-prone offshore highlights like Richelieu Rock.",
    gear: ["Surface marker buoy", "Torch for swim-throughs"],
    waterTemp: "81 to 85 F (27 to 29 C)",
    suitRecommendation: "3 mm wetsuit or shorty for most divers",
    gettingThere: "Fly into Phuket or Khao Lak access points, then transfer to the pier for day boats or liveaboards.",
    stay: "Khao Lak is the most practical land base for Similan departures."
  },
  "silfra-iceland": {
    experienceLevel: "Drysuit certified or experienced drysuit divers only.",
    conditions: "Very cold freshwater, almost surreal visibility, calm water but strict thermal and certification requirements.",
    gear: ["Dry gloves", "Cold-water hood"],
    waterTemp: "35 to 39 F (2 to 4 C)",
    suitRecommendation: "Drysuit with proper thermal undergarments is required",
    gettingThere: "Base in Reykjavik and join a day trip or self-drive to Thingvellir National Park.",
    stay: "Reykjavik is the easiest base; some divers split time with Golden Circle countryside lodges."
  },
  "bonaire-national-marine-park-bonaire": {
    experienceLevel: "Beginner to advanced. Bonaire is especially friendly for independent shore divers.",
    conditions: "Easy entry sites, generally calm leeward conditions and strong reef health for self-paced diving.",
    gear: ["Shore-diving booties", "Truck-friendly gear bins"],
    waterTemp: "79 to 84 F (26 to 29 C)",
    suitRecommendation: "3 mm wetsuit or shorty for most divers",
    gettingThere: "Fly into Bonaire directly or connect through major Caribbean hubs, then rent a pickup for shore-diving freedom.",
    stay: "Stay near Kralendijk or along the leeward coast for the most convenient shore-diving access."
  },
  "cozumel-mexico": {
    experienceLevel: "Open Water to advanced, though comfort with drift diving makes the trip much better.",
    conditions: "Fast drifts, bright coral, swim-throughs and reliable boat diving on the lee side of the island.",
    gear: ["SMB", "Good finning control for drift entries"],
    waterTemp: "78 to 82 F (26 to 28 C)",
    suitRecommendation: "3 mm wetsuit or lightweight full suit for most divers",
    gettingThere: "Fly to Cozumel directly or connect through Cancun and ferry over to the island.",
    stay: "San Miguel and the southwest coast are the simplest hotel bases for dive operators and marina access."
  },
  "komodo-national-park-indonesia": {
    experienceLevel: "Intermediate to advanced. Some manta sites are easy, but many famous sites have serious current.",
    conditions: "Strong tidal movement, cooler upwellings on some sites, mantas, reefs and dramatic topography.",
    gear: ["Reef hook for current sites", "SMB"],
    waterTemp: "73 to 82 F (23 to 28 C)",
    suitRecommendation: "3 mm wetsuit for most dives, 5 mm if you run cold or expect cooler upwellings",
    gettingThere: "Fly to Labuan Bajo and dive from town-based operators or a liveaboard.",
    stay: "Labuan Bajo is the standard base; harbor-front hotels simplify early departures."
  },
  "malapascua-philippines": {
    experienceLevel: "Open Water works for some dives, but the signature thresher experience is best for confident divers handling early deep profiles.",
    conditions: "Calm to moderate conditions with very early departures to Monad Shoal and occasional changing visibility.",
    gear: ["Good buoyancy control for shark etiquette", "Torch for dawn prep and boat loading"],
    waterTemp: "79 to 84 F (26 to 29 C)",
    suitRecommendation: "3 mm wetsuit for most divers",
    gettingThere: "Fly to Cebu, transfer by road to Maya port, then take the island boat to Malapascua.",
    stay: "Most divers stay beachfront on Malapascua itself to keep dawn departures easy."
  },
  "ningaloo-australia": {
    experienceLevel: "Beginner to intermediate for many reef dives, but offshore encounters vary with weather and operator style.",
    conditions: "Clear water, whale shark season in parts of the year and easy reef access near Exmouth and Coral Bay.",
    gear: ["Sun protection for boat days", "Wide-angle camera if you like animal encounters"],
    waterTemp: "72 to 79 F (22 to 26 C)",
    suitRecommendation: "3 mm to 5 mm wetsuit depending on the month and your cold tolerance",
    gettingThere: "Fly to Learmonth for Exmouth or connect overland; Coral Bay works better by road trip or regional transfer.",
    stay: "Exmouth suits divers wanting more operators and day-trip flexibility; Coral Bay is smaller and more laid-back."
  }
};

const inferSightings = (entry: ScubaSeasonEntry) => {
  const curated = SITE_SIGHTINGS[entry.id];

  if (curated) {
    return curated;
  }

  const text = `${entry.site} ${entry.region} ${entry.notes}`.toLowerCase();
  const sightings: Array<{
    name: string;
    likelihood: "High" | "Medium" | "Occasional";
  }> = [];

  if (text.includes("thresher")) sightings.push({ name: "Thresher sharks", likelihood: "High" });
  if (text.includes("hammerhead")) sightings.push({ name: "Scalloped hammerheads", likelihood: "High" });
  if (text.includes("whitetip")) sightings.push({ name: "Oceanic whitetips", likelihood: "Medium" });
  if (text.includes("whale shark")) sightings.push({ name: "Whale sharks", likelihood: "Medium" });
  if (text.includes("shark") && sightings.length === 0) {
    sightings.push({ name: "Grey reef sharks", likelihood: "Medium" });
  }
  if (text.includes("manta")) sightings.push({ name: "Reef or oceanic manta rays", likelihood: "Medium" });
  if (text.includes("wreck")) sightings.push({ name: "Wreck structure and artifacts", likelihood: "High" });
  if (text.includes("macro")) sightings.push({ name: "Macro life and critters", likelihood: "Medium" });
  if (text.includes("drift") || text.includes("current") || text.includes("pass")) {
    sightings.push({ name: "Fast-moving fish schools in current", likelihood: "Medium" });
  }
  if (text.includes("cavern") || text.includes("cenote") || text.includes("fissure")) {
    sightings.push({ name: "Geology and exceptional visibility", likelihood: "High" });
  }
  if (text.includes("reef")) sightings.push({ name: "Reef fish schools and hard coral", likelihood: "Medium" });
  if (text.includes("pelagic")) sightings.push({ name: "Large pelagics in blue water", likelihood: "Medium" });

  if (sightings.length === 0) {
    sightings.push(
      { name: "Signature species for the region", likelihood: "Medium" },
      { name: "Photogenic topography and reef structure", likelihood: "High" },
      { name: "Best visibility and sea state in season", likelihood: "High" }
    );
  }

  return sightings.slice(0, 3);
};

const inferDiveStyle = (entry: ScubaSeasonEntry) => {
  const text = `${entry.site} ${entry.notes}`.toLowerCase();

  if (text.includes("liveaboard") || text.includes("remote") || text.includes("offshore")) {
    return "Liveaboard";
  }

  if (text.includes("shore")) {
    return "Shore / resort-based";
  }

  if (text.includes("island") || text.includes("reef") || text.includes("day boat")) {
    return "Resort / day-boat";
  }

  return "Resort / day-boat";
};

const inferTripMode = (
  entry: ScubaSeasonEntry,
): "liveaboard" | "resort" => {
  const text = `${entry.site} ${entry.notes} ${entry.diveStyle ?? ""}`.toLowerCase();

  if (
    text.includes("liveaboard") ||
    text.includes("remote") ||
    text.includes("offshore")
  ) {
    return "liveaboard";
  }

  return "resort";
};

const inferExperienceLevel = (entry: ScubaSeasonEntry) => {
  const text = `${entry.site} ${entry.notes}`.toLowerCase();

  if (
    text.includes("current") ||
    text.includes("drift") ||
    text.includes("offshore") ||
    text.includes("liveaboard") ||
    text.includes("shark")
  ) {
    return "Intermediate to advanced. Expect current, blue-water or more demanding boat diving.";
  }

  if (text.includes("wreck") || text.includes("wall")) {
    return "Open Water to advanced depending on depth and penetration plans.";
  }

  return "Beginner to intermediate. Good for divers who are comfortable with standard boat or shore dives.";
};

const inferExperienceTags = (
  experienceLevel: string,
): Array<"beginner" | "intermediate" | "advanced"> => {
  const text = experienceLevel.toLowerCase();
  const tags = new Set<"beginner" | "intermediate" | "advanced">();

  if (
    text.includes("beginner") ||
    text.includes("open water") ||
    text.includes("entry")
  ) {
    tags.add("beginner");
  }

  if (text.includes("intermediate")) {
    tags.add("intermediate");
  }

  if (
    text.includes("advanced") ||
    text.includes("drysuit") ||
    text.includes("deep") ||
    text.includes("current")
  ) {
    tags.add("advanced");
  }

  if (tags.size === 0) {
    tags.add("intermediate");
  }

  return Array.from(tags);
};

const inferConditions = (entry: ScubaSeasonEntry) => {
  const text = `${entry.site} ${entry.region} ${entry.notes}`.toLowerCase();

  if (text.includes("cold") || text.includes("fissure") || text.includes("iceland")) {
    return "Cold-water conditions with a bigger thermal requirement than tropical destinations.";
  }

  if (text.includes("current") || text.includes("drift") || text.includes("pass")) {
    return "Expect moving water and timing-sensitive entries rather than relaxed, static reef dives.";
  }

  if (text.includes("wreck")) {
    return "Conditions are usually chosen for wreck access, visibility and manageable surface pickup.";
  }

  return "Usually best in the listed season for calmer seas, stronger visibility and easier boat logistics.";
};

const inferExposure = (entry: ScubaSeasonEntry) => {
  const text = `${entry.id} ${entry.site} ${entry.region} ${entry.country} ${entry.notes}`.toLowerCase();

  if (text.includes("cold") || text.includes("iceland") || text.includes("fissure")) {
    return {
      waterTemp: "35 to 39 F (2 to 4 C)",
      suitRecommendation: "Drysuit with thermal undergarments is required",
    };
  }

  if (
    text.includes("cenote") ||
    text.includes("the-pit") ||
    text.includes("channel-islands-usa") ||
    text.includes("milford-sound") ||
    text.includes("poor-knights") ||
    text.includes("gozo") ||
    text.includes("vis-croatia") ||
    text.includes("medes-islands") ||
    text.includes("kornati") ||
    text.includes("azores") ||
    text.includes("sardinia")
  ) {
    return {
      waterTemp: "60 to 75 F (16 to 24 C)",
      suitRecommendation: "5 mm wetsuit for most divers, with a hood in the colder part of the season",
    };
  }

  if (
    text.includes("galapagos") ||
    text.includes("malpelo") ||
    text.includes("south-africa") ||
    text.includes("upwelling")
  ) {
    return {
      waterTemp: "64 to 75 F (18 to 24 C)",
      suitRecommendation: "5 mm to 7 mm wetsuit depending on the month and your cold tolerance",
    };
  }

  if (
    text.includes("red sea") ||
    text.includes("aqaba") ||
    text.includes("oman") ||
    text.includes("fujairah") ||
    text.includes("jeddah") ||
    text.includes("egypt")
  ) {
    return {
      waterTemp: "72 to 82 F (22 to 28 C)",
      suitRecommendation: "3 mm to 5 mm wetsuit depending on season and cold tolerance",
    };
  }

  return {
    waterTemp: "78 to 84 F (26 to 29 C)",
    suitRecommendation: "3 mm wetsuit for most divers, or a shorty if you run warm",
  };
};

const inferGear = (entry: ScubaSeasonEntry) => {
  const text = `${entry.site} ${entry.region} ${entry.notes}`.toLowerCase();
  const gear: string[] = [];

  if (text.includes("cold") || text.includes("iceland")) {
    return ["Dry gloves", "Cold-water hood"];
  }

  if (text.includes("current") || text.includes("drift") || text.includes("pass")) {
    gear.push("SMB and spool", "Reef hook if operator guidance supports it");
  }

  if (text.includes("wreck")) {
    gear.push("Torch", "Good trim setup");
  }

  if (text.includes("macro")) {
    gear.push("Pointer or muck stick only where allowed");
  }

  return gear.slice(0, 3);
};

const inferGettingThere = (entry: ScubaSeasonEntry) =>
  `Plan around the nearest practical gateway to ${entry.site}, then a regional transfer or boat leg to the dive base. This is a good place to surface the nearest airport, transfer time and whether the trip is day-boat or liveaboard based.`;

const inferStay = (entry: ScubaSeasonEntry) =>
  `Best hotel strategy is usually staying close to the main departure marina or dive-town base for ${entry.site}, so early check-ins and gear handling are easier.`;

const inferInterestTags = (
  entry: ScubaSeasonEntry,
  sightings: Array<{ name: string; likelihood: "High" | "Medium" | "Occasional" }>,
): string[] => {
  const text = `${entry.site} ${entry.region} ${entry.notes} ${sightings.map((item) => item.name).join(" ")}`.toLowerCase();
  const tags = new Set<string>();

  if (text.includes("wreck")) {
    tags.add("Wrecks");
  }

  if (text.includes("macro") || text.includes("seahorse")) {
    tags.add("Macro & critters");
  }

  if (
    text.includes("reef") ||
    text.includes("coral") ||
    text.includes("barracuda") ||
    text.includes("reef fish")
  ) {
    tags.add("Coral reefs");
  }

  if (
    text.includes("cavern") ||
    text.includes("fissure") ||
    text.includes("arch") ||
    text.includes("geology") ||
    text.includes("swim-through")
  ) {
    tags.add("Dramatic topography");
  }

  if (tags.size === 0) {
    tags.add("Coral reefs");
  }

  return Array.from(tags);
};

const inferAnimalTags = (
  entry: ScubaSeasonEntry,
  sightings: Array<{ name: string; likelihood: "High" | "Medium" | "Occasional" }>,
) => {
  const text = `${entry.site} ${entry.region} ${entry.notes} ${sightings.map((item) => item.name).join(" ")}`.toLowerCase();
  const tags = new Set<string>();

  if (
    text.includes("shark") ||
    text.includes("hammerhead") ||
    text.includes("thresher") ||
    text.includes("whitetip") ||
    text.includes("wobbegong")
  ) {
    tags.add("Sharks");
  }

  if (
    text.includes("whale shark") ||
    text.includes("humpback") ||
    text.includes("whale ")
  ) {
    tags.add("Whales");
  }

  if (text.includes("manta")) {
    tags.add("Mantas");
  }

  if (text.includes("dolphin")) {
    tags.add("Dolphins");
  }

  if (text.includes("turtle")) {
    tags.add("Turtles");
  }

  if (text.includes("dugong") || text.includes("manatee")) {
    tags.add("Dugongs");
  }

  return Array.from(tags);
};

export const getScubaGlobeData = (date = new Date()) => {
  const markers: ScubaGlobeMarker[] = scubaEntries.map((entry) => {
    const isInSeason = isDateInSeason(date, entry.season);
    const seasonWindow = formatSeasonWindow(entry.season);
    const override = SITE_DETAILS[entry.id];
    const sightings = override?.sightings ?? inferSightings(entry);
    const experienceLevel =
      override?.experienceLevel ?? inferExperienceLevel(entry);
    const inferredExposure = inferExposure(entry);
    const exposure = {
      waterTemp: override?.waterTemp ?? inferredExposure.waterTemp,
      suitRecommendation:
        override?.suitRecommendation ?? inferredExposure.suitRecommendation,
    };

    return {
      id: entry.id,
      site: entry.site,
      country: entry.country,
      region: entry.region,
      lat: entry.lat,
      lng: entry.lng,
      color: isInSeason ? IN_SEASON_COLOR : OUT_OF_SEASON_COLOR,
      notes: entry.notes,
      seasonLabel: seasonWindow,
      season: entry.season,
      isInSeason,
      sightings,
      diveStyle: entry.diveStyle ?? inferDiveStyle(entry),
      experienceLevel,
      conditions: override?.conditions ?? inferConditions(entry),
      gear: override?.gear ?? inferGear(entry),
      waterTemp: exposure.waterTemp,
      suitRecommendation: exposure.suitRecommendation,
      gettingThere: override?.gettingThere ?? inferGettingThere(entry),
      stay: override?.stay ?? inferStay(entry),
      tripMode: inferTripMode(entry),
      experienceTags: inferExperienceTags(experienceLevel),
      interestTags: inferInterestTags(entry, sightings),
      animalTags: inferAnimalTags(entry, sightings),
      label: `${entry.site}, ${entry.country} • ${entry.region}
${isInSeason ? "In season" : "Out of season"} (${seasonWindow})
${entry.notes}`,
    };
  });

  return {
    markers,
    highlightedCountries: Array.from(
      new Set(
        markers
          .filter((marker) => marker.isInSeason)
          .map((marker) => marker.country)
      )
    )
  };
};
