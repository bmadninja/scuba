import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { PlanetGlobePanel } from "@/components/planet-globe-panel";
import type { FeaturedLocation } from "@/components/planet-globe-panel";
import { isUnderwaterQualityPhoto } from "@/lib/photo-quality";
import { getScubaGlobeData } from "@/lib/scuba-globe";
import { getAllSites } from "@/lib/data/sites";
import { getAllLocations } from "@/lib/data/locations";
import {
  getAllReefHealth,
  getReefHealthByLocationId,
} from "@/lib/data/reef-health";
import {
  getAllEncounters,
  getEncountersByLocationId,
} from "@/lib/data/encounters";
import type { BleachingAlertLevel, Site } from "@/lib/data/types";

type ReefCondition = "thriving" | "stressed" | "critical" | "unknown";

const REEF_CONDITION_FROM_ALERT: Record<BleachingAlertLevel, ReefCondition> = {
  "no-stress": "thriving",
  watch: "thriving",
  warning: "stressed",
  "alert-1": "stressed",
  "alert-2": "critical",
};

const COUNTRY_TO_CONTINENT: Record<string, string> = {
  // Asia (incl. Middle East)
  Cambodia: "Asia", China: "Asia", India: "Asia", Indonesia: "Asia",
  Japan: "Asia", Jordan: "Asia", Malaysia: "Asia", Maldives: "Asia",
  Myanmar: "Asia", Oman: "Asia", Philippines: "Asia", "Saudi Arabia": "Asia",
  "South Korea": "Asia", "Sri Lanka": "Asia", Taiwan: "Asia",
  Thailand: "Asia", "United Arab Emirates": "Asia", Vietnam: "Asia",
  // Europe
  Croatia: "Europe", Iceland: "Europe", Italy: "Europe", Malta: "Europe",
  Portugal: "Europe", Spain: "Europe",
  // Africa
  "Cape Verde": "Africa", Comoros: "Africa", Djibouti: "Africa",
  Egypt: "Africa", Eritrea: "Africa", Kenya: "Africa", Madagascar: "Africa",
  Mozambique: "Africa", Seychelles: "Africa", "South Africa": "Africa",
  Sudan: "Africa", "São Tomé and Príncipe": "Africa", Tanzania: "Africa",
  // North America & Caribbean
  Bahamas: "North America", Belize: "North America", Bonaire: "North America",
  "Cayman Islands": "North America", Cuba: "North America",
  Curaçao: "North America", "Dominican Republic": "North America",
  Grenada: "North America", Honduras: "North America", Mexico: "North America",
  Saba: "North America", "Saint Lucia": "North America",
  "Sint Eustatius": "North America", "Trinidad and Tobago": "North America",
  "United States": "North America",
  // South & Central America
  Brazil: "South America", Colombia: "South America",
  "Costa Rica": "South America", Ecuador: "South America",
  Panama: "South America", Venezuela: "South America",
  // Oceania
  Australia: "Oceania", "Federated States of Micronesia": "Oceania",
  Fiji: "Oceania", "French Polynesia": "Oceania", "New Zealand": "Oceania",
  Niue: "Oceania", Palau: "Oceania", "Papua New Guinea": "Oceania",
  "Solomon Islands": "Oceania", Vanuatu: "Oceania",
};

const SKILL_TO_EXPERIENCE: Record<
  Site["skillLevel"],
  "beginner" | "intermediate" | "advanced"
> = {
  "never-dived": "beginner",
  "open-water": "beginner",
  advanced: "intermediate",
  rescue: "advanced",
  divemaster: "advanced",
  tech: "advanced",
};

const SKILL_RANK: Record<Site["skillLevel"], number> = {
  "never-dived": 0,
  "open-water": 1,
  advanced: 2,
  rescue: 3,
  divemaster: 4,
  tech: 5,
};

const deriveTags = (site: Site, regionText: string) => {
  const text = `${site.name} ${site.description} ${regionText} ${site.species
    .map((s) => s.commonName)
    .join(" ")}`.toLowerCase();

  const interestTags: string[] = [];
  if (site.diveTypes.includes("large-pelagics")) interestTags.push("Big animals");
  if (site.diveTypes.includes("coral")) interestTags.push("Coral reefs");
  if (site.diveTypes.includes("macro")) interestTags.push("Macro & critters");
  if (site.diveTypes.includes("wrecks")) interestTags.push("Wrecks");
  if (site.diveTypes.includes("geology"))
    interestTags.push("Dramatic topography");

  const animalTags: string[] = [];
  if (
    text.includes("shark") || text.includes("hammerhead") ||
    text.includes("thresher") || text.includes("whitetip")
  ) animalTags.push("Sharks");
  if (text.includes("whale")) animalTags.push("Whales");
  if (text.includes("manta")) animalTags.push("Mantas");
  if (text.includes("dolphin")) animalTags.push("Dolphins");
  if (text.includes("turtle")) animalTags.push("Turtles");
  if (text.includes("dugong") || text.includes("manatee")) animalTags.push("Dugongs");

  const tripMode: "liveaboard" | "resort" =
    text.includes("liveaboard") || text.includes("remote") || text.includes("offshore")
      ? "liveaboard"
      : "resort";

  return { interestTags, animalTags, tripMode };
};

export default function Home() {
  const initialMonth = new Date().getUTCMonth() + 1;
  const { markers, highlightedCountries } = getScubaGlobeData();
  const reefHealthRecords = getAllReefHealth();

  const sitesByLocation = new Map<string, Site[]>();
  for (const s of getAllSites()) {
    const list = sitesByLocation.get(s.locationId) ?? [];
    list.push(s);
    sitesByLocation.set(s.locationId, list);
  }

  const featuredLocations: FeaturedLocation[] = getAllLocations()
    .map((location) => {
      const sites = sitesByLocation.get(location.id) ?? [];
      if (sites.length === 0) return null;
      const continent = COUNTRY_TO_CONTINENT[location.country] ?? "Other";

      const interestSet = new Set<string>();
      const animalSet = new Set<string>();
      const tripModeSet = new Set<"liveaboard" | "resort">();
      const experienceSet = new Set<"beginner" | "intermediate" | "advanced">();
      const skillSet = new Set<string>();
      let topRank = -Infinity;
      let topSiteImageUrl: string | undefined;
      let minSkillRank = 99;
      let topQualityRank = -Infinity;
      let topQualityImageUrl: string | undefined;

      const reefRecords = getReefHealthByLocationId(location.id);
      let worstAlert: BleachingAlertLevel | undefined;
      const alertRank: Record<BleachingAlertLevel, number> = {
        "no-stress": 0, watch: 1, warning: 2, "alert-1": 3, "alert-2": 4,
      };
      let coralCoverPercent: number | undefined;
      let coralCoverDate: string | undefined;
      let bleachedPercent: number | undefined;
      for (const r of reefRecords) {
        const alert = r.thermalStress?.alertLevel;
        if (alert && (!worstAlert || alertRank[alert] > alertRank[worstAlert])) {
          worstAlert = alert;
        }
        const cover = r.observed?.coralCoverPercent;
        if (cover !== undefined && (coralCoverPercent === undefined || cover > coralCoverPercent)) {
          coralCoverPercent = cover;
          coralCoverDate = r.observed?.surveyDate;
        }
        const bleached = r.observed?.bleachedPercent;
        if (bleached !== undefined && (bleachedPercent === undefined || bleached > bleachedPercent)) {
          bleachedPercent = bleached;
        }
      }
      const reefCondition: ReefCondition =
        worstAlert ? REEF_CONDITION_FROM_ALERT[worstAlert] : "unknown";

      for (const s of sites) {
        const { interestTags, animalTags, tripMode } = deriveTags(
          s,
          location.region,
        );
        interestTags.forEach((t) => interestSet.add(t));
        animalTags.forEach((t) => animalSet.add(t));
        tripModeSet.add(tripMode);
        experienceSet.add(SKILL_TO_EXPERIENCE[s.skillLevel]);
        skillSet.add(s.skillLevel);
        if (SKILL_RANK[s.skillLevel] < minSkillRank) {
          minSkillRank = SKILL_RANK[s.skillLevel];
        }
        if (s.editorialRank > topRank) {
          topRank = s.editorialRank;
          topSiteImageUrl = s.heroImageUrl;
        }
        if (
          s.editorialRank > topQualityRank &&
          s.heroImageUrl &&
          isUnderwaterQualityPhoto(s.heroImageUrl)
        ) {
          topQualityRank = s.editorialRank;
          topQualityImageUrl = s.heroImageUrl;
        }
      }

      const heroImageUrl =
        location.heroImageUrl ?? topQualityImageUrl ?? topSiteImageUrl;

      return {
        id: location.id,
        slug: location.slug,
        name: location.name,
        description: location.description,
        ...(heroImageUrl !== undefined ? { heroImageUrl } : {}),
        country: location.country,
        continent,
        bestMonths: location.bestMonths,
        editorialRank: topRank === -Infinity ? 0 : topRank,
        siteCount: sites.length,
        skillLevels: Array.from(skillSet),
        minSkillRank: minSkillRank === 99 ? 5 : minSkillRank,
        experiences: Array.from(experienceSet),
        interestTags: Array.from(interestSet),
        animalTags: Array.from(animalSet),
        encounters: getEncountersByLocationId(location.id).map((e) => ({
          id: e.id,
          slug: e.slug,
          name: e.name,
        })),
        tripModes: Array.from(tripModeSet),
        reefCondition,
        ...(coralCoverPercent !== undefined ? { coralCoverPercent } : {}),
        ...(coralCoverDate !== undefined ? { coralCoverDate } : {}),
        ...(bleachedPercent !== undefined ? { bleachedPercent } : {}),
      };
    })
    .filter((l): l is FeaturedLocation => l !== null);

  const urgentAlertCount = reefHealthRecords.filter((record) =>
    ["warning", "alert-1", "alert-2"].includes(
      record.thermalStress?.alertLevel ?? "",
    ),
  ).length;
  const observedRecordCount = reefHealthRecords.filter(
    (record) => record.observed !== undefined,
  ).length;
  const monitoringGapCount = featuredLocations.filter(
    (location) => location.reefCondition === "unknown",
  ).length;

  return (
    <div className="min-h-screen bg-[#f7fbfd] text-slate-900">
      <SiteHeader />

      <section className="border-b border-slate-200 bg-[#f7fbfd]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(460px,1.1fr)] lg:items-end">
            <div>
              <span className="inline-flex rounded-full bg-[#e7f2f8] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1d5d90]">
                Public reef-change atlas
              </span>
              <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Track the reefs changing in our lifetime.
              </h1>
            </div>
            <div className="max-w-2xl lg:justify-self-end">
              <p className="text-base leading-7 text-slate-600">
                scubaSeason combines satellite heat alerts, reef-health
                surveys, diver-visible field notes, and monitoring gaps so
                civilians can understand where the ocean needs eyes underwater.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <div className="border-l border-[#0089de]/30 pl-3">
                  <p className="font-bold text-slate-950">{urgentAlertCount}</p>
                  <p className="text-xs text-slate-500">heat alerts</p>
                </div>
                <div className="border-l border-[#0089de]/30 pl-3">
                  <p className="font-bold text-slate-950">{observedRecordCount}</p>
                  <p className="text-xs text-slate-500">reef records</p>
                </div>
                <div className="border-l border-[#0089de]/30 pl-3">
                  <p className="font-bold text-slate-950">{monitoringGapCount}</p>
                  <p className="text-xs text-slate-500">data gaps</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <SignalCard
              label="Reef alerts"
              title="Where heat stress is rising"
              body="Track NOAA-style thermal stress alongside dated in-water reef surveys."
            />
            <SignalCard
              label="Evidence gaps"
              title="Where we need recent eyes"
              body="Find places with weak or missing diver-visible evidence before they fade into old data."
            />
            <SignalCard
              label="Reef missions"
              title="How divers could help"
              body="Prototype photo tasks show what locals and visiting divers could safely collect next."
            />
          </div>

          <div>
            <Suspense fallback={null}>
              <PlanetGlobePanel
                initialMonth={initialMonth}
                markers={markers}
                highlightedCountries={highlightedCountries}
                featuredLocations={featuredLocations}
                allEncounters={getAllEncounters()}
              />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  );
}

function SignalCard({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1d5d90]">
        {label}
      </p>
      <h2 className="mt-1 text-sm font-bold text-slate-950">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-slate-600">{body}</p>
    </div>
  );
}
