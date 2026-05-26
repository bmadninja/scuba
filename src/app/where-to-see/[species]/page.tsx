import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { JsonLd } from "@/components/json-ld";
import { speciesLandingSchema } from "@/lib/schema-org";
import {
  getAllEncounters,
  getEncounterBySlug,
} from "@/lib/data/encounters";
import { getLocationById } from "@/lib/data/locations";
import { getSitesByLocationId } from "@/lib/data/sites";
import { getMethodologyByClaimId } from "@/lib/data/methodologies";

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DIFFICULTY_RING: Record<string, string> = {
  beginner: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  intermediate: "bg-amber-50 text-amber-800 ring-amber-200",
  advanced: "bg-orange-50 text-orange-800 ring-orange-200",
  expert: "bg-rose-50 text-rose-800 ring-rose-200",
};

export function generateStaticParams() {
  return getAllEncounters().map((e) => ({ species: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ species: string }>;
}): Promise<Metadata> {
  const { species } = await params;
  const e = getEncounterBySlug(species);
  if (!e) return { title: "Species not found" };
  const title = `Where to see ${e.name} in 2026 | scubaSeason.fun`;
  return {
    title,
    description: e.shortDescription,
    alternates: { canonical: `/where-to-see/${e.slug}` },
    openGraph: {
      title,
      description: e.shortDescription,
      images: e.heroImageUrl ? [e.heroImageUrl] : undefined,
    },
  };
}

export default async function SpeciesLandingPage({
  params,
}: {
  params: Promise<{ species: string }>;
}) {
  const { species } = await params;
  const e = getEncounterBySlug(species);
  if (!e) notFound();

  // Resolve atlas locations from regions (primary + secondary first; emerging/closed at the end)
  const statusOrder = { primary: 0, secondary: 1, emerging: 2, closed: 3 };
  const atlasLocations = e.regions
    .slice()
    .sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
    .flatMap((r) => {
      const ids = [
        r.inAtlasLocationId,
        ...(r.nearbyAtlasLocationIds ?? []),
      ].filter(Boolean) as string[];
      return ids.map((id) => ({
        location: getLocationById(id),
        regionName: r.name,
        regionCountry: r.country,
        status: r.status,
        whyHere: r.whyHere,
        statusNote: r.statusNote,
      }));
    })
    .filter((entry) => entry.location)
    .filter(
      // de-dupe by location id, keep first occurrence (best status)
      (entry, i, arr) =>
        arr.findIndex((x) => x.location!.id === entry.location!.id) === i,
    );

  const allSites = atlasLocations.flatMap((entry) =>
    getSitesByLocationId(entry.location!.id).map((s) => ({
      site: s,
      location: entry.location!,
    })),
  );
  // Top 6 sites by editorialRank
  const topSites = allSites
    .slice()
    .sort((a, b) => b.site.editorialRank - a.site.editorialRank)
    .slice(0, 6);

  const methodology = getMethodologyByClaimId("sighting-occurrence-cluster");

  const primary = e.regions.find((r) => r.status === "primary") ?? e.regions[0];
  const planLink = primary?.inAtlasLocationId
    ? `/plan?location=${
        getLocationById(primary.inAtlasLocationId)?.slug ?? ""
      }`
    : "/plan";

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <JsonLd
        data={speciesLandingSchema(
          e,
          atlasLocations.map((a) => ({
            name: a.location!.name,
            slug: a.location!.slug,
          })),
        )}
      />
      <SiteHeader />

      {e.heroImageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={e.heroImageUrl}
          alt={`Underwater photograph of ${e.name}`}
          className="h-72 w-full object-cover sm:h-96"
        />
      ) : null}

      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <Link
          href="/encounters"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 hover:text-[#0089de]"
        >
          ← All encounters
        </Link>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
          Where to see {e.name} in 2026
        </h1>
        {e.speciesCommon ? (
          <p className="mt-1 text-base text-slate-600">
            {e.speciesCommon}
            {e.speciesScientific ? (
              <span className="italic text-slate-500">
                {" "}
                · {e.speciesScientific}
              </span>
            ) : null}
          </p>
        ) : null}

        <p className="mt-6 text-base leading-7 text-slate-700">
          {e.shortDescription}
        </p>

        <section className="mt-8 border-t border-slate-200 pt-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
            Best months
          </h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {e.bestMonths.length === 12 ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
                Year-round
              </span>
            ) : (
              MONTH_ABBR.map((m, i) => {
                const active = e.bestMonths.includes(i + 1);
                return (
                  <Link
                    key={m}
                    href={`/dive-in/${[
                      "january","february","march","april","may","june",
                      "july","august","september","october","november","december",
                    ][i]}`}
                    className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                      active
                        ? "bg-[#0089de] text-white hover:bg-[#0070c0]"
                        : "border border-slate-200 text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    {m}
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-8 border-t border-slate-200 pt-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
            Difficulty &amp; experience
          </h2>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset ${DIFFICULTY_RING[e.difficulty]}`}
              >
                {e.difficulty}
              </span>
              <span className="text-[11px] uppercase tracking-wider text-slate-500">
                Required level
              </span>
            </div>
            <p className="mt-2">{e.requiredExperience}</p>
          </div>
        </section>

        {atlasLocations.length > 0 ? (
          <section className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
              Best locations
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {atlasLocations.map((entry) => {
                const loc = entry.location!;
                return (
                  <li
                    key={loc.id}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/locations/${loc.slug}`}
                          className="font-semibold text-slate-900 hover:text-[#0089de]"
                        >
                          {loc.name}
                        </Link>
                        <p className="text-[11px] uppercase tracking-wider text-slate-500">
                          {loc.country}
                        </p>
                      </div>
                      {entry.status !== "primary" ? (
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 ring-1 ring-inset ring-slate-200">
                          {entry.status}
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800 ring-1 ring-inset ring-emerald-200">
                          primary
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {entry.whyHere}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {topSites.length > 0 ? (
          <section className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
              Sites at these locations
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {topSites.map(({ site, location }) => (
                <li
                  key={site.id}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <Link
                    href={`/sites/${site.slug}`}
                    className="font-semibold text-slate-900 hover:text-[#0089de]"
                  >
                    {site.name}
                  </Link>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">
                    {location.name}, {location.country}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">
                    {site.description}
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
              href={planLink}
              className="rounded-full bg-[#0089de] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0070c0]"
            >
              Build a trip around this encounter →
            </Link>
            <Link
              href={`/encounters/${e.slug}`}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#0089de] hover:text-[#0089de]"
            >
              Operators &amp; ethics →
            </Link>
          </div>
        </section>

        <section className="mt-8 border-t border-slate-200 pt-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
            Methodology
          </h2>
          <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            <summary className="cursor-pointer font-semibold text-slate-900">
              How we picked these locations
            </summary>
            <p className="mt-3">
              We use the{" "}
              <code className="rounded bg-white px-1 text-[12px] ring-1 ring-inset ring-slate-200">
                sighting-occurrence-cluster
              </code>{" "}
              methodology: encounter regions are ranked from primary to closed
              based on documented occurrence records, operator continuity, and
              regulator permit status. We never publish per-trip sighting
              probabilities — &ldquo;best&rdquo; here means the most reliably
              documented region for this encounter, not a guarantee.
            </p>
            {methodology ? (
              <p className="mt-3 text-[12px] text-slate-600">
                {methodology.limitations}
              </p>
            ) : null}
            <p className="mt-3 text-[12px] text-slate-600">
              {e.limitations}
            </p>
          </details>
        </section>
      </main>
    </div>
  );
}
