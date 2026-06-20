import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllSites, getSiteBySlug } from "@/lib/data/sites";
import { getLocationById } from "@/lib/data/locations";
import { getSightingsBySiteId } from "@/lib/data/sightings";
import { getIucnStatus, IUCN_ENABLED } from "@/lib/data/iucn-status";
import { IucnBadge } from "@/components/iucn-badge";
import { MethodologyDisclosure } from "@/components/methodology-disclosure";
import { getSpeciesPhotoCredit } from "@/lib/data/species-photos";
import { resizePhotoUrl } from "@/lib/photo-quality";

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
      ...(site.species ?? []).map((s) => s.commonName),
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
    ...(site.species ?? []).map((s) => s.commonName),
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
    ...(site.species ?? []).map((s) => ({ ...s, fromSite: true })),
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

  // Species photo — prefer site-specific credit, fall back to global scientific name key
  const speciesKey = scientificName?.toLowerCase() ?? commonName.toLowerCase();
  const photoCredit =
    getSpeciesPhotoCredit(`${site.slug}:${speciesKey}`) ??
    getSpeciesPhotoCredit(speciesKey);
  const photoUrl =
    ("imageUrl" in speciesEntry ? speciesEntry.imageUrl : undefined) ??
    photoCredit?.imageUrl ??
    null;

  // Best months seasonality from sighting data or curated data
  const seasonalityMonths =
    evidence.flatMap((e) => e.seasonalityMonths).length > 0
      ? Array.from(
          new Set(evidence.flatMap((e) => e.seasonalityMonths)),
        ).sort((a, b) => a - b)
      : ("bestMonths" in speciesEntry ? speciesEntry.bestMonths ?? [] : []);

  // Also seen at — search all sites in the database, sorted by reliability
  const RELIABILITY_RANK: Record<string, number> = { "year-round": 3, seasonal: 2, rare: 1 };
  const nearbySites = getAllSites()
    .filter((s) => s.id !== site.id)
    .filter((s) =>
      (s.species ?? []).some((sp) => sp.commonName.toLowerCase() === commonName.toLowerCase()),
    )
    .sort((a, b) => {
      const ra = a.species.find((sp) => sp.commonName.toLowerCase() === commonName.toLowerCase());
      const rb = b.species.find((sp) => sp.commonName.toLowerCase() === commonName.toLowerCase());
      return (RELIABILITY_RANK[rb?.reliability ?? ""] ?? 0) - (RELIABILITY_RANK[ra?.reliability ?? ""] ?? 0);
    })
    .slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      {/* Breadcrumb */}
      <nav
        className="mb-6 flex flex-wrap items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#8b9db8]"
        aria-label="Breadcrumb"
      >
        {location ? (
          <>
            <Link
              href={`/locations/${location.slug}`}
              className="hover:text-[#00d4ff]"
            >
              {location.name}
            </Link>
            <span className="text-[#8b9db8]">/</span>
          </>
        ) : null}
        <Link
          href={`/sites/${site.slug}`}
          className="hover:text-[#00d4ff]"
        >
          {site.name}
        </Link>
        <span className="text-[#8b9db8]">/</span>
        <span className="text-[#f0f4f8]">{commonName}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        {iucn ? (
          <div className="mb-3">
            <IucnBadge status={iucn} />
          </div>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight text-[#f0f4f8]">
          {commonName}
        </h1>
        {scientificName ? (
          <p className="mt-1 text-base italic text-[#8b9db8]">
            {scientificName}
          </p>
        ) : null}
        <p className="mt-2 text-sm text-[#aebcd0]">
          Sighting evidence at <strong>{site.name}</strong>
          {location ? `, ${location.name}` : ""}
        </p>
      </div>

      {/* Species photo */}
      {photoUrl ? (
        <div className="mb-8">
          <div className="overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resizePhotoUrl(photoUrl, 800) ?? photoUrl}
              alt={commonName}
              className="w-full object-cover"
              style={{ maxHeight: "22rem" }}
            />
          </div>
          {photoCredit ? (
            <p className="mt-1.5 text-right text-xs text-[#8b9db8]">
              {photoCredit.photographer
                ? `Photo: ${photoCredit.photographer}`
                : "iNaturalist"}
              {" · "}
              {photoCredit.licenseLabel}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Ecological description */}
      {speciesEntry.ecologicalDescription ? (
        <p className="mb-8 text-sm leading-relaxed text-[#aebcd0]">
          {speciesEntry.ecologicalDescription}
        </p>
      ) : null}

      {/* Sighting evidence */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-[#8b9db8]">
          Evidence at this site
        </h2>
        {evidence.length > 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#0a1628]">
            {evidence.map((ev, i) => (
              <div
                key={i}
                className="flex flex-col gap-1 border-b border-white/10 px-4 py-3 last:border-b-0 sm:flex-row sm:items-start sm:gap-4"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#f0f4f8]">
                    {ev.recentRecordCount} record
                    {ev.recentRecordCount === 1 ? "" : "s"} within{" "}
                    {ev.proximityRadiusKm} km
                  </p>
                  <p className="text-xs text-[#8b9db8]">
                    Confidence:{" "}
                    <span
                      className={`font-semibold ${
                        ev.confidence === "high"
                          ? "text-emerald-300"
                          : ev.confidence === "medium"
                            ? "text-amber-300"
                            : "text-[#8b9db8]"
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
                    className="text-xs text-[#8b9db8]"
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
                  <span className="text-xs text-[#8b9db8]">
                    No date on file
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 px-5 py-8 text-center">
            <p className="text-sm font-semibold text-[#aebcd0]">
              No confirmed records on file at this site
            </p>
            <p className="mt-1.5 text-xs text-[#8b9db8]">
              {commonName} is listed as a curated species here based on
              historical reports.
            </p>
          </div>
        )}
      </section>

      {/* 12-month seasonality calendar */}
      {seasonalityMonths.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-[#8b9db8]">
            Seasonality
          </h2>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
            {MONTH_ABBR.map((m, i) => {
              const isPeak = seasonalityMonths.includes(i + 1);
              const isNow = currentMonth === i + 1;
              return (
                <div
                  key={m}
                  className={`rounded-lg px-1 py-2 text-center text-xs font-semibold ${
                    isPeak
                      ? "bg-[#00d4ff] text-[#0a1628]"
                      : "bg-white/5 text-[#8b9db8]"
                  } ${isNow ? "ring-2 ring-inset ring-[#00d4ff]" : ""}`}
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

      {/* Also seen at other sites */}
      {nearbySites.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-[#8b9db8]">
            Also seen at other sites
          </h2>
          <ul className="space-y-2">
            {nearbySites.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/sites/${s.slug}/species/${speciesSlug}`}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0a1628] px-4 py-3 text-sm font-semibold text-[#f0f4f8] transition hover:border-[#00d4ff]/40 hover:text-[#00d4ff]"
                >
                  {s.name}
                  <span className="ml-auto text-[#8b9db8]">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

    </div>
  );
}
