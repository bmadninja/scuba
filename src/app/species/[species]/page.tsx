import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllSites } from "@/lib/data/sites";
import { getLocationById } from "@/lib/data/locations";
import { getIucnStatus, IUCN_ENABLED } from "@/lib/data/iucn-status";
import { IucnBadge } from "@/components/iucn-badge";
import { MethodologyDisclosure } from "@/components/methodology-disclosure";
import { getSpeciesPhotoCredit } from "@/lib/data/species-photos";
import { resizePhotoUrl } from "@/lib/photo-quality";

const MONTH_ABBR = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

const RELIABILITY_RANK: Record<string, number> = {
  "year-round": 3,
  seasonal: 2,
  rare: 1,
};

const RELIABILITY_LABEL: Record<string, string> = {
  "year-round": "Year-round",
  seasonal: "Seasonal",
  rare: "Rare",
};

function slugifySpecies(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

type SpeciesSiteEntry = {
  site: ReturnType<typeof getAllSites>[number];
  spEntry: NonNullable<ReturnType<typeof getAllSites>[number]["species"]>[number];
};

function buildSpeciesIndex(): Map<string, { commonName: string; entries: SpeciesSiteEntry[] }> {
  const index = new Map<string, { commonName: string; entries: SpeciesSiteEntry[] }>();
  for (const site of getAllSites()) {
    for (const sp of site.species ?? []) {
      const key = slugifySpecies(sp.commonName);
      if (!index.has(key)) {
        index.set(key, { commonName: sp.commonName, entries: [] });
      }
      index.get(key)!.entries.push({ site, spEntry: sp });
    }
  }
  return index;
}

export async function generateStaticParams() {
  const index = buildSpeciesIndex();
  return Array.from(index.keys()).map((species) => ({ species }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ species: string }>;
}): Promise<Metadata> {
  const { species: speciesSlug } = await params;
  const index = buildSpeciesIndex();
  const entry = index.get(speciesSlug);
  if (!entry) return { title: "Species not found" };
  const { commonName, entries } = entry;
  const siteCount = entries.length;
  return {
    title: `${commonName} — confirmed at ${siteCount} dive site${siteCount === 1 ? "" : "s"} | Scuba Season`,
    description: `See which dive sites have confirmed ${commonName} sightings, how reliable the sightings are, and the best months to go.`,
    alternates: { canonical: `/species/${speciesSlug}` },
  };
}

export default async function SpeciesPage({
  params,
}: {
  params: Promise<{ species: string }>;
}) {
  const { species: speciesSlug } = await params;
  const index = buildSpeciesIndex();
  const entry = index.get(speciesSlug);
  if (!entry) notFound();

  const { commonName, entries } = entry;

  // Sort sites: year-round first, then seasonal, then rare; alpha within tier
  const sortedEntries = [...entries].sort((a, b) => {
    const ra = RELIABILITY_RANK[a.spEntry.reliability ?? ""] ?? 0;
    const rb = RELIABILITY_RANK[b.spEntry.reliability ?? ""] ?? 0;
    if (rb !== ra) return rb - ra;
    return a.site.name.localeCompare(b.site.name);
  });

  // Scientific name — prefer most common value across entries
  const sciNameCounts = new Map<string, number>();
  for (const e of entries) {
    const sci = e.spEntry.scientificName;
    if (sci) sciNameCounts.set(sci, (sciNameCounts.get(sci) ?? 0) + 1);
  }
  const scientificName = sciNameCounts.size > 0
    ? [...sciNameCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
    : undefined;

  // Ecological description — first non-null
  const ecologicalDescription = entries.find((e) => e.spEntry.ecologicalDescription)?.spEntry.ecologicalDescription;

  // Photo — prefer site-specific credit keyed to scientific/common name
  const speciesKey = scientificName?.toLowerCase() ?? commonName.toLowerCase();
  const photoCredit = getSpeciesPhotoCredit(speciesKey);
  const photoUrl =
    entries.find((e) => "imageUrl" in e.spEntry && e.spEntry.imageUrl)?.spEntry.imageUrl ??
    photoCredit?.imageUrl ??
    null;

  // IUCN
  const iucn = IUCN_ENABLED ? getIucnStatus(scientificName) : null;

  // Aggregated seasonality — union of bestMonths across all entries
  const allMonths = new Set<number>();
  for (const e of entries) {
    for (const m of e.spEntry.bestMonths ?? []) allMonths.add(m);
  }
  const seasonalityMonths = Array.from(allMonths).sort((a, b) => a - b);

  const currentMonth = new Date().getUTCMonth() + 1;

  return (
    <div
      className="mx-auto w-full max-w-3xl px-6 py-12"
      style={{ background: "var(--color-paper)" }}
    >
      {/* Breadcrumb */}
      <nav
        className="mb-6 text-xs font-semibold uppercase tracking-[0.1em]"
        style={{ color: "var(--color-ink-2)" }}
        aria-label="Breadcrumb"
      >
        <Link
          href="/locations"
          style={{ color: "var(--color-ink-2)", textDecoration: "none" }}
        >
          ← Atlas
        </Link>
      </nav>

      {/* Header */}
      <div className="mb-6">
        {iucn ? (
          <div className="mb-3">
            <IucnBadge status={iucn} />
          </div>
        ) : null}
        <h1
          style={{
            fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
            fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
            fontWeight: 300,
            letterSpacing: "-0.025em",
            color: "var(--color-ink)",
            lineHeight: 1.1,
          }}
        >
          {commonName}
        </h1>
        {scientificName ? (
          <p className="mt-1 text-base italic" style={{ color: "var(--color-ink-2)" }}>
            {scientificName}
          </p>
        ) : null}
        <p className="mt-2 text-sm" style={{ color: "var(--color-ink-2)" }}>
          Confirmed at{" "}
          <strong style={{ color: "var(--color-ink)" }}>
            {entries.length} dive site{entries.length === 1 ? "" : "s"}
          </strong>{" "}
          in the atlas
        </p>
      </div>

      {/* Photo */}
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
            <p className="mt-1.5 text-right text-xs" style={{ color: "var(--color-ink-2)" }}>
              {photoCredit.photographer ? `Photo: ${photoCredit.photographer}` : "iNaturalist"}
              {" · "}
              {photoCredit.licenseLabel}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Ecological description */}
      {ecologicalDescription ? (
        <p className="mb-8 text-sm leading-relaxed" style={{ color: "var(--color-ink-2)" }}>
          {ecologicalDescription}
        </p>
      ) : null}

      {/* Seasonality */}
      {seasonalityMonths.length > 0 ? (
        <section className="mb-8">
          <h2
            className="mb-3 text-sm font-bold uppercase tracking-[0.1em]"
            style={{ color: "var(--color-ink-2)", fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace" }}
          >
            Best months across all sites
          </h2>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
            {MONTH_ABBR.map((m, i) => {
              const isPeak = seasonalityMonths.includes(i + 1);
              const isNow = currentMonth === i + 1;
              return (
                <div
                  key={m}
                  className="rounded-lg px-1 py-2 text-center text-xs font-semibold"
                  style={{
                    background: isPeak ? "var(--color-ocean)" : "rgba(14,28,40,0.05)",
                    color: isPeak ? "#ffffff" : "var(--color-ink-2)",
                    outline: isNow ? "2px solid var(--color-ocean)" : "none",
                    outlineOffset: "2px",
                  }}
                >
                  {m}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Where to see it */}
      <section className="mb-8">
        <h2
          className="mb-3 text-sm font-bold uppercase tracking-[0.1em]"
          style={{ color: "var(--color-ink-2)", fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace" }}
        >
          Where to see it
        </h2>
        <ul className="space-y-2">
          {sortedEntries.map(({ site, spEntry }) => {
            const location = getLocationById(site.locationId);
            const reliability = spEntry.reliability;
            const reliabilityColor =
              reliability === "year-round"
                ? "var(--color-improving)"
                : reliability === "seasonal"
                  ? "var(--color-stable)"
                  : "var(--color-ink-2)";
            return (
              <li key={site.id}>
                <Link
                  href={`/sites/${site.slug}/species/${speciesSlug}`}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition hover:bg-gray-50"
                  style={{
                    border: "1px solid var(--color-hairline)",
                    textDecoration: "none",
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold" style={{ color: "var(--color-ink)" }}>
                      {site.name}
                    </span>
                    {location ? (
                      <span className="block text-xs" style={{ color: "var(--color-ink-2)" }}>
                        {location.name}, {location.country}
                      </span>
                    ) : null}
                  </span>
                  {reliability ? (
                    <span
                      className="shrink-0 text-xs font-semibold"
                      style={{ color: reliabilityColor }}
                    >
                      {RELIABILITY_LABEL[reliability] ?? reliability}
                    </span>
                  ) : null}
                  <span style={{ color: "var(--color-ink-2)" }}>→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <MethodologyDisclosure className="mb-8">
        <p>
          Reliability ratings are based on how consistently divers have reported
          this species at each site. Year-round means confirmed across multiple
          seasons. Seasonal means reliable during specific months only. Rare means
          occasional or unverified records. All sightings are cross-referenced
          against iNaturalist quality-grade observations.
        </p>
      </MethodologyDisclosure>
    </div>
  );
}
