import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { certLandingSchema } from "@/lib/schema-org";
import { getAllLocations } from "@/lib/data/locations";
import { getAllSites } from "@/lib/data/sites";
import { getAllGear } from "@/lib/data/gear";
import type {
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
  "never-dived": "Never dived / try dive",
  "open-water": "Open Water",
  advanced: "Advanced Open Water",
  rescue: "Rescue divers",
  divemaster: "Divemasters",
  tech: "Technical divers",
};

const CERT_INTROS: Record<SkillLevel, string> = {
  "never-dived":
    "You haven't been certified yet. The right first trip is shallow, warm, and surrounded by patient instructors — discover scuba and try dive programmes let you breathe underwater under direct supervision before committing to Open Water.",
  "open-water":
    "Open Water divers are limited to 18 m / 60 ft and direct ascent to the surface. The trips below stay within that envelope, with mild currents and forgiving viz so you can build dives without overrunning your training.",
  advanced:
    "Advanced Open Water unlocks 30 m / 100 ft, deeper wreck penetration with a guide, and mild current drift dives. These destinations reward a confident AOW with bucket list animals at depth.",
  rescue:
    "Rescue divers handle current, navigation, and incident management. These trips lean into demanding entries, exposed sites, and the conditions where rescue level skill actually matters.",
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

  const gear = getAllGear().filter((g) => g.levels.includes(cert)).slice(0, 8);

  const isBeginnerSafety = cert === "never-dived" || cert === "open-water";

  return (
    <>
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

      <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/locations"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4A5568] hover:text-[#0E4F6E]"
        >
          ← All locations
        </Link>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#0E1C28]">
          Best dive trips for {label}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[#4A5568]">
          {CERT_INTROS[cert]}
        </p>

        {isBeginnerSafety ? (
          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm leading-6 text-amber-300">
            <p className="font-semibold">Safety first.</p>
            <p className="mt-1">
              {cert === "never-dived"
                ? "Always dive under direct instructor supervision until you're certified. Read DAN's medical guidance before booking — pulmonary, cardiac and ENT conditions can disqualify you from diving."
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

        <section className="mt-8 border-t border-[#E7E6E2] pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E4F6E]">
            Locations that fit your level
          </h2>
          {locations.length === 0 ? (
            <p className="mt-3 text-sm text-[#4A5568]">
              No locations in the atlas match this level yet.
            </p>
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {locations.map(({ location: l, sites }) => (
                <li
                  key={l.id}
                  className="rounded-xl border border-[#E7E6E2] bg-white p-4"
                >
                  <Link
                    href={`/locations/${l.slug}`}
                    className="font-semibold text-[#0E1C28] hover:text-[#0E4F6E]"
                  >
                    {l.name}
                  </Link>
                  <p className="text-xs uppercase tracking-wider text-[#4A5568]">
                    {l.country} · {sites.length} sites
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#4A5568]">
                    {l.description}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {gear.length > 0 ? (
          <section className="mt-8 border-t border-[#E7E6E2] pt-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E4F6E]">
              Recommended gear
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {gear.map((g) => (
                <li
                  key={g.id}
                  className="rounded-xl border border-[#E7E6E2] bg-white p-4"
                >
                  <p className="font-semibold text-[#0E1C28]">{g.name}</p>
                  <p className="text-xs uppercase tracking-wider text-[#4A5568]">
                    {g.category} · {g.tier}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#4A5568]">
                    {g.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-10 border-t border-[#E7E6E2] pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E4F6E]">
            Methodology
          </h2>
          <details className="mt-3 rounded-xl border border-[#E7E6E2] bg-[#F8F7F4] p-4 text-sm leading-6 text-[#4A5568]">
            <summary className="cursor-pointer font-semibold text-[#0E1C28]">
              How we matched locations to your level
            </summary>
            <p className="mt-3">
              For each location we take the lowest skill floor across its
              sites. A location qualifies for {label} when that floor is at or
              below your certification rank — meaning at least one site there
              is diveable for you. Encounters are matched to your level
              through the editorial difficulty rating, not a per dive risk
              score. Always confirm site specific requirements with your
              operator&rsquo;s morning briefing.
            </p>
          </details>
        </section>
      </div>
      </div>
    </>
  );
}
