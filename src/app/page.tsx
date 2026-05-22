import Link from "next/link";
import { PlanetGlobePanel } from "@/components/planet-globe-panel";
import type { FeaturedSite } from "@/components/planet-globe-panel";
import { getScubaGlobeData } from "@/lib/scuba-globe";
import { getAllSites } from "@/lib/data/sites";
import { getLocationById } from "@/lib/data/locations";
import type { Site } from "@/lib/data/types";

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

  const featuredSites = getAllSites()
    .map((s) => {
      const location = getLocationById(s.locationId);
      if (!location) return null;
      const continent = COUNTRY_TO_CONTINENT[location.country] ?? "Other";
      const { interestTags, animalTags, tripMode } = deriveTags(
        s,
        location.region,
      );
      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        description: s.description,
        ...(s.heroImageUrl !== undefined ? { heroImageUrl: s.heroImageUrl } : {}),
        country: location.country,
        continent,
        skillLevel: s.skillLevel,
        bestMonths: s.bestMonths,
        editorialRank: s.editorialRank,
        experience: SKILL_TO_EXPERIENCE[s.skillLevel],
        interestTags,
        animalTags,
        tripMode,
      };
    })
    .filter((s) => s !== null);

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
            <Link href="/about" className="hover:text-[#0089de]">
              About
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-[#f1f7fb] to-white">
        <div className="mx-auto w-full max-w-6xl px-6 pt-14 pb-8 text-center">
          <span className="inline-block rounded-full bg-[#e8f0fe] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#1d5d90]">
            Dive smarter. Travel further.
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.1] tracking-tight text-slate-900">
            The ocean&rsquo;s in season somewhere.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Pick a month. We&rsquo;ll show you where the water&rsquo;s warm, the viz is wide,
            and the big animals are showing up.
          </p>
        </div>

        <div className="mx-auto w-full max-w-6xl px-6 pb-14">
          <PlanetGlobePanel
            initialMonth={initialMonth}
            markers={markers}
            highlightedCountries={highlightedCountries}
            featuredSites={featuredSites}
          />
        </div>
      </section>
    </div>
  );
}
