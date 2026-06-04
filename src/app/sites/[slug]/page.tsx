import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { IucnBadge } from "@/components/iucn-badge";
import { underwaterPhotoUrl } from "@/lib/photo-quality";
import { siteSchema } from "@/lib/schema-org";
import { getAllSites, getSiteBySlug } from "@/lib/data/sites";
import { getLocationById } from "@/lib/data/locations";
import { getAllEncounters } from "@/lib/data/encounters";
import { getCoralCoverForLocation } from "@/lib/data/coral-cover";
import { getReefPressureByLocationId } from "@/lib/data/reef-pressure";
import { buildAtlasLocation } from "@/lib/atlas-location";
import { STATE_TEXT, skillText } from "@/lib/data/reef-state";
import { getSightingsBySiteId } from "@/lib/data/sightings";
import { getWrecksBySiteId } from "@/lib/data/wrecks";
import { getSourceById } from "@/lib/data/sources";
import { getMethodologyByClaimId } from "@/lib/data/methodologies";
import { getIucnStatus, IUCN_ENABLED } from "@/lib/data/iucn-status";
import { getSpeciesPhotoCredit } from "@/lib/data/species-photos";
import type { Site } from "@/lib/data/types";

const FISHING_LEVEL_LABEL: Record<string, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  "very-high": "Very high",
};

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CURRENT_COLOR: Record<string, string> = {
  none: "bg-slate-100 text-slate-700",
  mild: "bg-emerald-50 text-emerald-700",
  moderate: "bg-amber-50 text-amber-800",
  strong: "bg-rose-50 text-rose-700",
};

const RELIABILITY_LABEL: Record<string, string> = {
  "year-round": "Year round",
  seasonal: "Seasonal",
  rare: "Rare",
};

/**
 * One animal shown in "What you'll see". Combines a curated species entry
 * with this site's sighting-evidence record for the same animal, so a manta
 * ray shows up once — conservation status and live record count on one card.
 */
type Creature = {
  commonName: string;
  scientificName?: string;
  reliability?: "year-round" | "seasonal" | "rare";
  bestMonths?: number[];
  imageUrl?: string;
  lastConfirmedAt?: string | null;
  recentRecordCount?: number;
  proximityRadiusKm?: number;
};

type SightingRecord = ReturnType<typeof getSightingsBySiteId>[number];

/** Join key: scientific name when present, else normalised common name. */
function creatureKey(scientific: string | undefined, common: string): string {
  return (scientific || common).trim().toLowerCase();
}

function mergeCreatures(site: Site, sightings: SightingRecord[]): Creature[] {
  const byKey = new Map<string, Creature>();
  const order: string[] = [];

  for (const s of site.species) {
    const key = creatureKey(s.scientificName, s.commonName);
    if (!byKey.has(key)) order.push(key);
    byKey.set(key, {
      commonName: s.commonName,
      scientificName: s.scientificName,
      reliability: s.reliability,
      bestMonths: s.bestMonths,
      imageUrl: s.imageUrl,
    });
  }

  for (const ev of sightings) {
    const key = creatureKey(ev.speciesScientific, ev.speciesCommon);
    const existing = byKey.get(key);
    if (existing) {
      existing.lastConfirmedAt = ev.lastConfirmedAt;
      existing.recentRecordCount = ev.recentRecordCount;
      existing.proximityRadiusKm = ev.proximityRadiusKm;
    } else {
      order.push(key);
      byKey.set(key, {
        commonName: ev.speciesCommon,
        scientificName: ev.speciesScientific,
        lastConfirmedAt: ev.lastConfirmedAt,
        recentRecordCount: ev.recentRecordCount,
        proximityRadiusKm: ev.proximityRadiusKm,
      });
    }
  }

  return order.map((k) => byKey.get(k)!);
}


function formatLastConfirmed(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) { const m = Math.floor(diffDays / 30); return `${m} ${m === 1 ? "month" : "months"} ago`; }
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch {
    return iso;
  }
}

export function generateStaticParams() {
  return getAllSites().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = getSiteBySlug(slug);
  if (!site) return { title: "Dive site not found" };
  const location = getLocationById(site.locationId);
  const metadataImageUrl = underwaterPhotoUrl(site.heroImageUrl);
  const title = `${site.name} — ${location?.name ?? ""}`;
  const description = site.description.slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `/sites/${site.slug}` },
    openGraph: {
      title,
      description,
      url: `/sites/${site.slug}`,
      type: "article",
      images: [{ url: metadataImageUrl, width: 2000, height: 1100 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [metadataImageUrl],
    },
  };
}

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = getSiteBySlug(slug);
  if (!site) notFound();

  const location = getLocationById(site.locationId);
  const currentMonth = new Date().getUTCMonth() + 1;
  const inSeason = site.bestMonths.includes(currentMonth);
  const sightings = getSightingsBySiteId(site.id);
  const wrecks = getWrecksBySiteId(site.id);
  const sightingMethodIds = Array.from(
    new Set(sightings.flatMap((s) => s.methodologyClaimIds)),
  );
  const sightingMethods = sightingMethodIds
    .map(getMethodologyByClaimId)
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  const sightingSourceIds = Array.from(
    new Set([
      ...sightings.flatMap((s) => s.sourceIds),
      ...sightingMethods.flatMap((m) => m.sourceIds),
    ]),
  );
  const sightingSources = sightingSourceIds
    .map(getSourceById)
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const heroUrl = underwaterPhotoUrl(site.heroImageUrl);
  const coralCover = location ? getCoralCoverForLocation(location.id) : null;
  const reefPressure = location ? getReefPressureByLocationId(location.id) : null;
  const reefStamp =
    location &&
    (coralCover || (reefPressure && reefPressure.fishingPressure !== "unknown"))
      ? {
          locationName: location.name,
          locationSlug: location.slug,
          coralCoverPercent: coralCover?.current.coverPercent ?? null,
          coralCoverYear: coralCover?.current.year ?? null,
          fishingLevel:
            reefPressure && reefPressure.fishingPressure !== "unknown"
              ? FISHING_LEVEL_LABEL[reefPressure.fishingPressure]
              : null,
        }
      : null;

  const locationFull = location ? getLocationById(location.id) : null;
  const atlasLoc = locationFull ? buildAtlasLocation(locationFull) : null;
  const creatures = mergeCreatures(site, sightings);
  const hasSpeciesData = creatures.length > 0;

  // Build a lookup from normalised species name → encounter slug so each
  // creature card can link to its /where-to-see/[slug] page when a match exists.
  const encounterSlugBySpecies = new Map<string, string>();
  for (const enc of getAllEncounters()) {
    if (enc.speciesCommon) {
      encounterSlugBySpecies.set(enc.speciesCommon.toLowerCase(), enc.slug);
    }
    if (enc.speciesScientific) {
      for (const sci of enc.speciesScientific.split(",").map((s) => s.trim())) {
        if (sci) encounterSlugBySpecies.set(sci.toLowerCase(), enc.slug);
      }
    }
  }
  // Photo provenance for the creatures shown, so we can credit iNaturalist
  // photographers (most photos are CC-licensed and require attribution).
  const photoCredits = creatures
    .filter((c) => c.imageUrl)
    .map((c) => ({
      commonName: c.commonName,
      ...getSpeciesPhotoCredit(creatureKey(c.scientificName, c.commonName)),
    }))
    .filter((c) => c.imageUrl);
  const gear = site.siteSpecificGear;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12 text-slate-900">
      <JsonLd data={siteSchema(site, location)} />

      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
        <Link href="/" className="hover:text-[#0089de]">Atlas</Link>
        <span className="text-slate-300">/</span>
        {location ? (
          <>
            <Link href={`/locations/${location.slug}`} className="hover:text-[#0089de]">
              {location.name}
            </Link>
            <span className="text-slate-300">/</span>
          </>
        ) : null}
        <span className="font-medium text-slate-700">{site.name}</span>
      </nav>

      {location ? (
        <Link
          href={`/locations/${location.slug}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0089de] hover:text-[#1d5d90]"
        >
          ← Back to {location.name}
        </Link>
      ) : null}

      {/* Meta row */}
      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
        <span className="rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-[#1d5d90]">Dive site</span>
        {location ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
            {location.country}
          </span>
        ) : null}
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
          {site.depthRange.min}–{site.depthRange.max} m
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 capitalize text-slate-700">
          {skillText(site.skillLevel)}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 ${
            inSeason
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {inSeason ? "● In season" : "○ Off season"}
        </span>
        {atlasLoc ? (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
            {STATE_TEXT[atlasLoc.state]}
          </span>
        ) : null}
      </div>

      <h1 className="mt-3 mb-8 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        {site.name}
      </h1>

      {/* ── ABOUT ── */}
      <section>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroUrl}
          alt={site.name}
          className="mb-5 h-72 w-full rounded-2xl object-cover"
        />
        <p className="mb-5 max-w-2xl text-[15px] leading-7 text-slate-700">
          {site.description}
        </p>
        {site.notes ? (
          <div className="mb-5 rounded-2xl border border-slate-200 bg-[#f1f7fb] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1d5d90]">
              Briefing note
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{site.notes}</p>
          </div>
        ) : null}
        {reefStamp ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border border-slate-200 bg-[#f1f7fb] px-4 py-3 text-[13px] leading-6 text-slate-700">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#1d5d90]">
              Location reef science
            </span>
            {reefStamp.coralCoverPercent !== null ? (
              <span>
                coral cover {reefStamp.coralCoverPercent}%
                {reefStamp.coralCoverYear ? ` (${reefStamp.coralCoverYear})` : ""}
              </span>
            ) : null}
            {reefStamp.coralCoverPercent !== null && reefStamp.fishingLevel ? (
              <span className="text-slate-300">·</span>
            ) : null}
            {reefStamp.fishingLevel ? (
              <span>fishing {reefStamp.fishingLevel}</span>
            ) : null}
            <Link
              href={`/locations/${reefStamp.locationSlug}`}
              className="font-semibold text-[#0089de] hover:text-[#1d5d90]"
            >
              View {reefStamp.locationName} →
            </Link>
          </div>
        ) : null}
      </section>

      {/* ── WHAT YOU'LL SEE ── */}
      <section className="mt-12">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            What you&rsquo;ll see
          </h2>
          {(() => {
            const latestConfirmed = sightings
              .map((s) => s.lastConfirmedAt)
              .filter(Boolean)
              .sort()
              .at(-1);
            if (!latestConfirmed) return null;
            return (
              <time
                dateTime={latestConfirmed}
                className="text-[11px] font-medium text-slate-400"
              >
                Last confirmed {formatLastConfirmed(latestConfirmed)}
              </time>
            );
          })()}
        </div>

        {hasSpeciesData ? (
          <>
            {/* Method disclosure */}
            <details className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 [&_summary]:cursor-pointer">
              <summary className="flex items-center gap-2 text-sm font-semibold text-slate-800 marker:content-['']">
                <span className="flex size-5 items-center justify-center rounded-full bg-[#e8f0fe] text-[11px] font-bold text-[#1d5d90]">
                  i
                </span>
                How these readings are measured
              </summary>
              <div className="mt-3 space-y-3 text-[13px] leading-6 text-slate-600">
                <p>
                  Each row combines a <strong className="text-slate-800">global conservation status</strong> with this
                  atlas&rsquo;s own <strong className="text-slate-800">diver log record</strong> for the site.
                </p>
                <ol className="list-decimal space-y-1.5 pl-5">
                  <li>
                    <strong className="text-slate-800">Conservation status (CR · EN · VU · NT · LC)</strong> — the species&rsquo;
                    category on the IUCN Red List.
                  </li>
                  <li>
                    <strong className="text-slate-800">Global population trend</strong> — increasing, stable or decreasing.
                  </li>
                  <li>
                    <strong className="text-slate-800">Last seen and records</strong> — counted from diver sighting logs on a
                    rolling 24 month window.
                  </li>
                </ol>
              </div>
            </details>

            {/* One card per animal — curated species and the site's sighting
                evidence merged so each creature appears once. */}
            <ul className="space-y-3">
              {creatures.map((c) => {
                const iucn = IUCN_ENABLED ? getIucnStatus(c.scientificName) : null;
                const hasRecords =
                  typeof c.recentRecordCount === "number" && c.recentRecordCount > 0;
                const encounterSlug =
                  (c.scientificName &&
                    encounterSlugBySpecies.get(c.scientificName.toLowerCase())) ||
                  encounterSlugBySpecies.get(c.commonName.toLowerCase()) ||
                  null;
                return (
                  <li
                    key={creatureKey(c.scientificName, c.commonName)}
                    className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.imageUrl}
                        alt={c.commonName}
                        width={64}
                        height={64}
                        // A global img reset (from an imported stylesheet)
                        // overrides width to 0 on flex img children; min-width
                        // is not overridden, so it reliably holds the box.
                        style={{ width: 64, height: 64, minWidth: 64, minHeight: 64 }}
                        className="shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      // No photo: reserve the same space so the name and
                      // badges line up with the photographed cards above.
                      <div className="size-16 shrink-0 rounded-xl bg-slate-100" />
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex flex-col gap-2">
                        {encounterSlug ? (
                          <Link
                            href={`/where-to-see/${encounterSlug}`}
                            className="text-base font-bold text-slate-900 hover:text-[#0089de]"
                          >
                            {c.commonName}
                          </Link>
                        ) : (
                          <p className="text-base font-bold text-slate-900">{c.commonName}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          {iucn ? <IucnBadge status={iucn} /> : null}
                          {c.reliability ? (
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                              {RELIABILITY_LABEL[c.reliability] ?? c.reliability}
                            </span>
                          ) : null}
                        </div>
                        {hasRecords ? (
                          <p className="text-[12px] text-slate-500">
                            {c.recentRecordCount} record{c.recentRecordCount === 1 ? "" : "s"} within{" "}
                            {c.proximityRadiusKm} km
                            {c.lastConfirmedAt
                              ? ` · last confirmed ${formatLastConfirmed(c.lastConfirmedAt)}`
                              : ""}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                        {c.bestMonths && c.bestMonths.length > 0 && c.bestMonths.length < 12 ? (
                          <span className="rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-[11px] font-semibold text-[#1d5d90]">
                            Peak: {c.bestMonths.map((m) => MONTH_ABBR[m - 1]).join(" · ")}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Sources */}
            {sightingSources.length > 0 && (
              <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 [&_summary]:cursor-pointer">
                <summary className="text-[12px] font-semibold text-slate-500 marker:content-['']">
                  {sightingSources.length} source{sightingSources.length === 1 ? "" : "s"}
                </summary>
                <ul className="mt-2 space-y-1">
                  {sightingSources.map((src) => (
                    <li key={src.id} className="text-[12px] text-slate-600">
                      {src.url ? (
                        <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-[#0089de] hover:underline">
                          {src.name}
                        </a>
                      ) : (
                        src.name
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              No records yet
            </p>
            <p className="mx-auto mt-2.5 max-w-sm text-sm leading-6 text-slate-700">
              No recent sighting data for this site. Dived here? Log what you saw — it goes
              straight into the global record.
            </p>
          </div>
        )}

        {/* Photo credits — iNaturalist photos are mostly CC-licensed and
            require attribution to the photographer. */}
        {photoCredits.length > 0 ? (
          <details className="mt-4 [&_summary]:cursor-pointer">
            <summary className="text-[11px] font-medium text-slate-400 marker:content-['']">
              Photos via iNaturalist · credits
            </summary>
            <ul className="mt-2 space-y-1">
              {photoCredits.map((c) => (
                <li key={c.commonName} className="text-[11px] leading-5 text-slate-400">
                  {c.commonName}: {c.photographer ?? "iNaturalist contributor"} · {c.licenseLabel}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      {/* ── CONDITIONS ── */}
      <section className="mt-12">
        <h2 className="mb-5 text-xl font-bold tracking-tight text-slate-900">Conditions</h2>

        {/* Season calendar */}
        <div className="mb-6">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Season calendar
          </p>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
            {MONTH_ABBR.map((m, i) => {
              const isPeak = site.bestMonths.includes(i + 1);
              const isNow = currentMonth === i + 1;
              return (
                <div
                  key={m}
                  className={`rounded-lg px-1 py-2 text-center text-[11px] font-semibold ${
                    isPeak ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  } ${isNow ? "ring-2 ring-inset ring-[#0089de]" : ""}`}
                >
                  {m}
                </div>
              );
            })}
          </div>
        </div>

        {/* Conditions table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {["Month", "Water", "Visibility", "Current"].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {site.conditionsByMonth.map((c) => (
                  <tr
                    key={c.month}
                    className={`border-b border-slate-100 last:border-0 ${
                      c.month === currentMonth ? "bg-[#f1f7fb]" : ""
                    }`}
                  >
                    <td className="px-3 py-2.5 font-semibold text-slate-900">
                      {MONTH_ABBR[c.month - 1]}
                      {c.month === currentMonth && (
                        <span className="ml-1.5 inline-block size-1.5 rounded-full bg-[#0089de] align-middle" />
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {c.waterTempC.min}–{c.waterTempC.max} °C
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {c.visibilityM.min}–{c.visibilityM.max} m
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${CURRENT_COLOR[c.currentStrength]}`}
                      >
                        {c.currentStrength}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── GEAR & PLANNING ── */}
      {(gear.length > 0 || wrecks.length > 0 || location) && (
        <section className="mt-12">
          <h2 className="mb-5 text-xl font-bold tracking-tight text-slate-900">
            Gear &amp; planning
          </h2>

          {gear.length > 0 && (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Site gear
              </p>
              <ul className="divide-y divide-slate-100">
                {gear.map((item) => (
                  <li key={item.name} className="flex flex-wrap gap-1.5 py-2 text-[13px] text-slate-700">
                    <span className="font-semibold text-slate-900">{item.name}</span>
                    <span>— {item.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {wrecks.length > 0 && (
            <div className="mb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                The wreck
              </p>
              <ul className="space-y-3">
                {wrecks.map((w) => (
                  <li key={w.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="font-bold text-slate-900">{w.vesselName}</p>
                    <p className="mt-0.5 text-[12px] capitalize text-slate-500">
                      {w.vesselType} · Sunk {w.sunk}
                    </p>
                    <p className="mt-2 text-[13px] leading-6 text-slate-700">{w.history}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {location ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Book this trip
              </p>
              <h3 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900">
                Plan a trip to {location.name}
              </h3>
              <p className="mt-2 text-[13px] leading-6 text-slate-700">
                Hotels, liveaboards, dive operators and travel logistics for the whole region.
              </p>
              <Link
                href={`/locations/${location.slug}`}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0089de] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d5d90]"
              >
                Plan your trip →
              </Link>
            </div>
          ) : null}
        </section>
      )}

      {/* Planning helper */}
      {location ? (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Planning a trip?
          </p>
          <p className="mt-1.5 text-sm leading-6 text-slate-700">
            Hotels, dive operators, gear, and how to get here are on the{" "}
            <Link
              href={`/locations/${location.slug}`}
              className="font-semibold text-[#0089de] underline decoration-[#0089de]/30 underline-offset-2 hover:decoration-[#0089de]"
            >
              {location.name} location page
            </Link>
            .
          </p>
        </div>
      ) : null}
    </div>
  );
}
