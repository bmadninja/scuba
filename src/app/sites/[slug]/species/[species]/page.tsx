import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllSites, getSiteBySlug } from "@/lib/data/sites";
import { getLocationById } from "@/lib/data/locations";
import { getSightingsBySiteId } from "@/lib/data/sightings";
import { getAllEncounters } from "@/lib/data/encounters";
import { getIucnStatus, IUCN_ENABLED } from "@/lib/data/iucn-status";
import { IucnBadge } from "@/components/iucn-badge";
import { MethodologyDisclosure } from "@/components/methodology-disclosure";

const MONTH_ABBR = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

function slugifySpecies(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function generateStaticParams() {
  const params: { slug: string; species: string }[] = [];
  for (const site of getAllSites()) {
    const sightings = getSightingsBySiteId(site.id);
    const allSpecies = [
      ...site.species.map((s) => s.commonName),
      ...sightings.map((s) => s.speciesCommon),
    ];
    const unique = Array.from(new Set(allSpecies));
    for (const sp of unique) {
      params.push({ slug: site.slug, species: slugifySpecies(sp) });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; species: string }>;
}): Promise<Metadata> {
  const { slug, species: speciesSlug } = await params;
  const site = getSiteBySlug(slug);
  if (!site) return { title: "Not found" };
  const match = [
    ...site.species.map((s) => s.commonName),
  ].find((n) => slugifySpecies(n) === speciesSlug);
  return {
    title: match
      ? `${match} at ${site.name} | scubaSeason.fun`
      : `Species at ${site.name} | scubaSeason.fun`,
  };
}

export default async function SpeciesDetailPage({
  params,
}: {
  params: Promise<{ slug: string; species: string }>;
}) {
  const { slug, species: speciesSlug } = await params;
  const site = getSiteBySlug(slug);
  if (!site) notFound();

  const location = getLocationById(site.locationId);
  const sightings = getSightingsBySiteId(site.id);
  const currentMonth = new Date().getUTCMonth() + 1;

  // Find species by slug match
  const allSpeciesEntries = [
    ...site.species.map((s) => ({ ...s, fromSite: true })),
  ];
  const speciesEntry = allSpeciesEntries.find(
    (s) => slugifySpecies(s.commonName) === speciesSlug,
  );
  if (!speciesEntry) notFound();

  const commonName = speciesEntry.commonName;
  const scientificName = "scientificName" in speciesEntry ? speciesEntry.scientificName : undefined;

  // Get sighting evidence for this species at this site
  const evidence = sightings.filter(
    (s) =>
      s.speciesCommon.toLowerCase() === commonName.toLowerCase() ||
      (scientificName &&
        s.speciesScientific?.toLowerCase() === scientificName.toLowerCase()),
  );

  // IUCN status
  const iucn = IUCN_ENABLED ? getIucnStatus(scientificName) : null;

  // Find encounter page link
  const encounterSlug =
    getAllEncounters()
      .find(
        (e) =>
          e.speciesCommon?.toLowerCase() === commonName.toLowerCase() ||
          (scientificName &&
            e.speciesScientific?.toLowerCase() === scientificName.toLowerCase()),
      )
      ?.slug ?? null;

  // Best months seasonality from sighting data or curated data
  const seasonalityMonths =
    evidence.flatMap((e) => e.seasonalityMonths).length > 0
      ? Array.from(
          new Set(evidence.flatMap((e) => e.seasonalityMonths)),
        ).sort((a, b) => a - b)
      : ("bestMonths" in speciesEntry ? speciesEntry.bestMonths ?? [] : []);

  // Also seen at nearby sites (other sites in the same location)
  const nearbySites =
    location
      ? (await import("@/lib/data/sites"))
          .getSitesByLocationId(location.id)
          .filter((s) => s.id !== site.id)
          .filter((s) =>
            s.species.some(
              (sp) => sp.commonName.toLowerCase() === commonName.toLowerCase(),
            ),
          )
          .slice(0, 3)
      : [];

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      {/* Breadcrumb */}
      <nav
        className="mb-6 flex flex-wrap items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-[#0089de]">
          Atlas
        </Link>
        <span className="text-slate-300">/</span>
        {location ? (
          <>
            <Link
              href={`/locations/${location.slug}`}
              className="hover:text-[#0089de]"
            >
              {location.name}
            </Link>
            <span className="text-slate-300">/</span>
          </>
        ) : null}
        <Link
          href={`/sites/${site.slug}`}
          className="hover:text-[#0089de]"
        >
          {site.name}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700">{commonName}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        {iucn ? (
          <div className="mb-3">
            <IucnBadge status={iucn} />
          </div>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {commonName}
        </h1>
        {scientificName ? (
          <p className="mt-1 text-base italic text-slate-500">
            {scientificName}
          </p>
        ) : null}
        <p className="mt-2 text-sm text-slate-600">
          Sighting evidence at <strong>{site.name}</strong>
          {location ? `, ${location.name}` : ""}
        </p>
      </div>

      {/* Sighting evidence */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-slate-500">
          Evidence at this site
        </h2>
        {evidence.length > 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white">
            {evidence.map((ev, i) => (
              <div
                key={i}
                className="flex flex-col gap-1 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:flex-row sm:items-start sm:gap-4"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {ev.recentRecordCount} record
                    {ev.recentRecordCount === 1 ? "" : "s"} within{" "}
                    {ev.proximityRadiusKm} km
                  </p>
                  <p className="text-xs text-slate-500">
                    Confidence:{" "}
                    <span
                      className={`font-semibold ${
                        ev.confidence === "high"
                          ? "text-emerald-700"
                          : ev.confidence === "medium"
                            ? "text-amber-700"
                            : "text-slate-600"
                      }`}
                    >
                      {ev.confidence}
                    </span>
                    {ev.notes ? ` · ${ev.notes}` : ""}
                  </p>
                </div>
                {ev.lastConfirmedAt ? (
                  <time
                    dateTime={ev.lastConfirmedAt}
                    className="text-xs text-slate-400"
                  >
                    Last confirmed{" "}
                    {new Date(
                      ev.lastConfirmedAt + "T00:00:00Z",
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </time>
                ) : (
                  <span className="text-xs text-slate-400">
                    No date on file
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 px-5 py-8 text-center">
            <p className="text-sm font-semibold text-slate-700">
              No confirmed records on file at this site
            </p>
            <p className="mt-1.5 text-xs text-slate-500">
              {commonName} is listed as a curated species here based on
              historical reports.
            </p>
          </div>
        )}
      </section>

      {/* 12-month seasonality calendar */}
      {seasonalityMonths.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-slate-500">
            Seasonality
          </h2>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
            {MONTH_ABBR.map((m, i) => {
              const isPeak = seasonalityMonths.includes(i + 1);
              const isNow = currentMonth === i + 1;
              return (
                <div
                  key={m}
                  className={`rounded-lg px-1 py-2 text-center text-[11px] font-semibold ${
                    isPeak
                      ? "bg-[#0089de] text-white"
                      : "bg-slate-100 text-slate-500"
                  } ${isNow ? "ring-2 ring-inset ring-[#0f172a]" : ""}`}
                >
                  {m}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Methodology disclosure */}
      <MethodologyDisclosure className="mb-8">
        <p>
          Sighting evidence is compiled from iNaturalist observation records
          within a set proximity radius, filtered for quality-grade observations.
          &ldquo;Last confirmed&rdquo; is the date of the most recent
          research-grade record. Record count covers a rolling 24-month window.
          Confidence reflects record count, recency, and consistency of
          seasonal signal.
        </p>
      </MethodologyDisclosure>

      {/* Also seen nearby */}
      {nearbySites.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-slate-500">
            Also seen nearby
          </h2>
          <ul className="space-y-2">
            {nearbySites.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/sites/${s.slug}/species/${speciesSlug}`}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-[#0089de]/40 hover:text-[#0089de]"
                >
                  {s.name}
                  <span className="ml-auto text-slate-400">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Link to where-to-see */}
      {encounterSlug ? (
        <div className="rounded-xl border border-[#0089de]/20 bg-[#f1f7fb] px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#0089de]">
            Global encounter guide
          </p>
          <p className="mt-1.5 text-sm text-slate-700">
            See all atlas locations where {commonName} has been confirmed, with
            best seasons and confidence scores.
          </p>
          <Link
            href={`/where-to-see/${encounterSlug}`}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0089de] hover:text-[#1d5d90]"
          >
            View {commonName} encounter guide →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
