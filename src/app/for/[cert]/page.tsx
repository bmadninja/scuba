import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { JsonLd } from "@/components/json-ld";
import { certLandingSchema } from "@/lib/schema-org";
import { getAllLocations } from "@/lib/data/locations";
import { getAllSites } from "@/lib/data/sites";
import { getAllEncounters } from "@/lib/data/encounters";
import { getAllGear } from "@/lib/data/gear";
import type {
  EncounterDifficulty,
  SkillLevel,
  Site,
} from "@/lib/data/types";

const CERT_ORDER: SkillLevel[] = [
  "never-dived",
  "open-water",
  "advanced",
  "rescue",
  "divemaster",
  "tech",
];

const CERT_LABELS: Record<SkillLevel, string> = {
  "never-dived": "Never-dived / try-dive",
  "open-water": "Open Water",
  advanced: "Advanced Open Water",
  rescue: "Rescue divers",
  divemaster: "Divemasters",
  tech: "Technical divers",
};

const CERT_INTROS: Record<SkillLevel, string> = {
  "never-dived":
    "You haven't been certified yet. The right first trip is shallow, warm, and surrounded by patient instructors — discover-scuba and try-dive programmes let you breathe underwater under direct supervision before committing to Open Water.",
  "open-water":
    "Open Water divers are limited to 18 m / 60 ft and direct ascent to the surface. The trips below stay within that envelope, with mild currents and forgiving viz so you can build dives without overrunning your training.",
  advanced:
    "Advanced Open Water unlocks 30 m / 100 ft, deeper wreck penetration with a guide, and mild-current drift dives. These destinations reward a confident AOW with bucket-list animals at depth.",
  rescue:
    "Rescue divers handle current, navigation, and incident management. These trips lean into demanding entries, exposed sites, and the conditions where rescue-level skill actually matters.",
  divemaster:
    "Divemasters guide other divers and manage dive plans in real time. These itineraries pair challenging sites with the kind of operator that briefs at a professional level.",
  tech: "Technical divers run staged decompression, mixed gas, and overhead environments. The destinations below have the gas blending, support, and wrecks or walls that justify the kit.",
};

const SKILL_RANK: Record<SkillLevel, number> = {
  "never-dived": 0,
  "open-water": 1,
  advanced: 2,
  rescue: 3,
  divemaster: 4,
  tech: 5,
};

const DIFFICULTY_FOR_CERT: Record<SkillLevel, EncounterDifficulty[]> = {
  "never-dived": ["beginner"],
  "open-water": ["beginner"],
  advanced: ["beginner", "intermediate"],
  rescue: ["beginner", "intermediate", "advanced"],
  divemaster: ["intermediate", "advanced", "expert"],
  tech: ["advanced", "expert"],
};

export function generateStaticParams() {
  return CERT_ORDER.map((cert) => ({ cert }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cert: string }>;
}): Promise<Metadata> {
  const { cert } = await params;
  if (!CERT_ORDER.includes(cert as SkillLevel)) {
    return { title: "Certification level not found" };
  }
  const label = CERT_LABELS[cert as SkillLevel];
  const title = `Best dive trips for ${label} | scubaSeason.fun`;
  const description = CERT_INTROS[cert as SkillLevel];
  return {
    title,
    description,
    alternates: { canonical: `/for/${cert}` },
    openGraph: { title, description },
  };
}

export default async function CertLandingPage({
  params,
}: {
  params: Promise<{ cert: string }>;
}) {
  const { cert: certParam } = await params;
  if (!CERT_ORDER.includes(certParam as SkillLevel)) notFound();
  const cert = certParam as SkillLevel;
  const label = CERT_LABELS[cert];
  const maxRank = SKILL_RANK[cert];

  // For each location, derive minSkillRank from its sites — locations with a
  // floor at or below this cert's rank fit. Mirrors src/app/page.tsx.
  const sitesByLocation = new Map<string, Site[]>();
  for (const s of getAllSites()) {
    const list = sitesByLocation.get(s.locationId) ?? [];
    list.push(s);
    sitesByLocation.set(s.locationId, list);
  }
  const locations = getAllLocations()
    .map((l) => {
      const sites = sitesByLocation.get(l.id) ?? [];
      if (sites.length === 0) return null;
      let minRank = 99;
      for (const s of sites) {
        if (SKILL_RANK[s.skillLevel] < minRank) minRank = SKILL_RANK[s.skillLevel];
      }
      if (minRank > maxRank) return null;
      return { location: l, minRank, sites };
    })
    .filter((x): x is { location: ReturnType<typeof getAllLocations>[number]; minRank: number; sites: Site[] } => Boolean(x))
    .sort((a, b) => a.minRank - b.minRank)
    .slice(0, 12);

  const matchedDifficulties = DIFFICULTY_FOR_CERT[cert];
  const encounters = getAllEncounters()
    .filter((e) => matchedDifficulties.includes(e.difficulty))
    .slice(0, 8);

  const gear = getAllGear().filter((g) => g.levels.includes(cert)).slice(0, 8);

  const isBeginnerSafety = cert === "never-dived" || cert === "open-water";

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <JsonLd
        data={certLandingSchema({
          cert,
          certLabel: label,
          description: CERT_INTROS[cert],
          locations: locations.map((x) => ({
            name: x.location.name,
            slug: x.location.slug,
          })),
        })}
      />
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        <Link
          href="/sites"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 hover:text-[#0089de]"
        >
          ← All dive sites
        </Link>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
          Best dive trips for {label}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
          {CERT_INTROS[cert]}
        </p>

        {isBeginnerSafety ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
            <p className="font-semibold">Safety first.</p>
            <p className="mt-1">
              {cert === "never-dived"
                ? "Always dive under direct instructor supervision until you're certified. Read DAN's pre-dive medical guidance before booking — pulmonary, cardiac and ENT conditions can disqualify you from diving."
                : "Mind depth and current limits in your training. If a site exceeds 18 m or has a current you can't kick into, sit it out."}{" "}
              <a
                href="https://dan.org/health-medicine/"
                target="_blank"
                rel="noreferrer noopener"
                className="font-semibold underline"
              >
                DAN health &amp; safety guidance →
              </a>
            </p>
          </div>
        ) : null}

        <section className="mt-8 border-t border-slate-200 pt-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
            Locations that fit your level
          </h2>
          {locations.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No locations in the atlas match this level yet.
            </p>
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {locations.map(({ location: l, sites }) => (
                <li
                  key={l.id}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <Link
                    href={`/locations/${l.slug}`}
                    className="font-semibold text-slate-900 hover:text-[#0089de]"
                  >
                    {l.name}
                  </Link>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">
                    {l.country} · {sites.length} sites
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">
                    {l.description}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {encounters.length > 0 ? (
          <section className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
              What you&rsquo;ll typically see at this level
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {encounters.map((e) => (
                <li
                  key={e.id}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <Link
                    href={`/where-to-see/${e.slug}`}
                    className="font-semibold text-slate-900 hover:text-[#0089de]"
                  >
                    {e.name}
                  </Link>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">
                    {e.difficulty}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">
                    {e.shortDescription}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {gear.length > 0 ? (
          <section className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
              Recommended gear
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {gear.map((g) => (
                <li
                  key={g.id}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <p className="font-semibold text-slate-900">{g.name}</p>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">
                    {g.category} · {g.tier}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">
                    {g.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-8 border-t border-slate-200 pt-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
            Plan a trip
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/plan?cert=${cert}`}
              className="rounded-full bg-[#0089de] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0070c0]"
            >
              Build a trip at this level →
            </Link>
            <Link
              href={`/sites?cert=${cert}`}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#0089de] hover:text-[#0089de]"
            >
              Browse all sites for {label} →
            </Link>
          </div>
        </section>

        <section className="mt-10 border-t border-slate-200 pt-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
            Methodology
          </h2>
          <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            <summary className="cursor-pointer font-semibold text-slate-900">
              How we matched locations to your level
            </summary>
            <p className="mt-3">
              For each location we take the lowest skill floor across its
              sites. A location qualifies for {label} when that floor is at or
              below your certification rank — meaning at least one site there
              is dive-able for you. Encounters are matched to your level
              through the editorial difficulty rating, not a per-dive risk
              score. Always confirm site-specific requirements with your
              operator&rsquo;s morning briefing.
            </p>
          </details>
        </section>
      </main>
    </div>
  );
}
