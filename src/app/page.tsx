import Link from "next/link";
import { PlanetGlobePanel } from "@/components/planet-globe-panel";
import type { FeaturedLocation } from "@/components/planet-globe-panel";
import { isUnderwaterQualityPhoto } from "@/lib/photo-quality";
import { getScubaGlobeData } from "@/lib/scuba-globe";
import { getAllSites } from "@/lib/data/sites";
import { getAllLocations } from "@/lib/data/locations";
import { getReefHealthByLocationId } from "@/lib/data/reef-health";
import { getEncountersByLocationId } from "@/lib/data/encounters";
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

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-slate-900">
              scubaSeason<span className="text-[#0089de]">.fun</span>
            </span>
          </Link>
          <nav className="hidden gap-6 text-sm font-medium text-slate-700 sm:flex">
            <Link href="/sites" className="hover:text-[#0089de]">
              Dive sites
            </Link>
            <Link href="/encounters" className="hover:text-[#0089de]">
              Encounters
            </Link>
            <Link href="/about" className="hover:text-[#0089de]">
              About
            </Link>
            <Link href="/faq" className="hover:text-[#0089de]">
              FAQ
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-[#f1f7fb] to-white">
        <div className="mx-auto w-full max-w-6xl px-6 pt-14 pb-8 text-center">
          <span className="inline-block rounded-full bg-[#e8f0fe] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#1d5d90]">
            A data atlas for the living ocean
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.1] tracking-tight text-slate-900">
            See the reefs before they change.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Coral cover, thermal stress, species seasonality &mdash; surfaced from
            NOAA Coral Reef Watch, in-situ surveys, and citizen science.
            Filter by month, certification, what you want to see, and reef condition.
          </p>
        </div>

        <div className="mx-auto w-full max-w-6xl px-6 pb-14">
          <PlanetGlobePanel
            initialMonth={initialMonth}
            markers={markers}
            highlightedCountries={highlightedCountries}
            featuredLocations={featuredLocations}
          />
        </div>
      </section>
    </div>
  );
}
