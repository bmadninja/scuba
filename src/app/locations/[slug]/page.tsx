import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AffiliateLink } from "@/components/affiliate-link";
import { JsonLd } from "@/components/json-ld";
import { underwaterPhotoUrl } from "@/lib/photo-quality";
import { locationSchema } from "@/lib/schema-org";
import { getAllLocations, getLocationBySlug } from "@/lib/data/locations";
import { buildAtlasLocation } from "@/lib/atlas-location";
import { getSitesByLocationId } from "@/lib/data/sites";
import { getEncountersByLocationId } from "@/lib/data/encounters";
import { getLocationDetailsById } from "@/lib/data/location-details";
import { getAllGear, getGearById } from "@/lib/data/gear";
import { getReefHealthByLocationId } from "@/lib/data/reef-health";
import { getReefPressureByLocationId } from "@/lib/data/reef-pressure";
import { getWaterQualityByLocationId } from "@/lib/data/water-quality";
import { getCoralCoverForLocation } from "@/lib/data/coral-cover";
import { getFishingPressureForLocation, getFishingPressureLastBuiltAt } from "@/lib/data/fishing-pressure";
import { getSightingsBySiteId } from "@/lib/data/sightings";
import { getSourceById } from "@/lib/data/sources";
import { getMethodologyByClaimId } from "@/lib/data/methodologies";
import { DataFreshnessLabel } from "@/components/data-freshness-label";
import { StatStrip } from "@/components/stat-strip";
import { EditorialHook } from "@/components/editorial-hook";
import { SightingRow } from "@/components/sighting-row";
import { LiveBadge } from "@/components/live-badge";
import { STATE_TEXT, STATE_DEF, freshness, getLastSurveyDays, getReefState, bestMonthsText } from "@/lib/data/reef-state";
import { HowCalculated } from "./how-calculated";
import type {
  BleachingAlertLevel,
  PartnerLink,
  Site,
} from "@/lib/data/types";

const ALERT_LABEL: Record<BleachingAlertLevel, string> = {
  "no-stress": "No stress",
  watch: "Watch",
  warning: "Warning",
  "alert-1": "Alert level 1",
  "alert-2": "Alert level 2",
};

const STATE_PILL: Record<string, string> = {
  thriving: "bg-emerald-50 text-emerald-700",
  pressure: "bg-[#e0f0fc] text-[#0369a1]",
  change: "bg-rose-50 text-rose-700",
};

const STATE_DOT: Record<string, string> = {
  thriving: "bg-emerald-500",
  pressure: "bg-[#0089de]",
  change: "bg-rose-500",
};

const formatSurveyDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function generateStaticParams() {
  return getAllLocations().map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const location = getLocationBySlug(slug);
  if (!location) return { title: "Location not found" };
  const metadataImageUrl = underwaterPhotoUrl(location.heroImageUrl);
  const title = `${location.name}, ${location.country}`;
  const description = location.description.slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `/locations/${location.slug}` },
    openGraph: {
      title,
      description,
      url: `/locations/${location.slug}`,
      type: "article",
      images: [{ url: metadataImageUrl }],
    },
  };
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const location = getLocationBySlug(slug);
  if (!location) notFound();

  const sites = getSitesByLocationId(location.id);
  const reefHealth = getReefHealthByLocationId(location.id)[0] ?? null;
  const reefPressure = getReefPressureByLocationId(location.id);
  const waterQuality = getWaterQualityByLocationId(location.id);
  const coralCover = getCoralCoverForLocation(location.id);
  const fishingPressure = getFishingPressureForLocation(location.id);
  const details = getLocationDetailsById(location.id);
  const bestMonthsSet = new Set(location.bestMonths);

  const lodging = dedupePartnerLinks(sites.flatMap((s) => s.lodging));
  const operators = dedupePartnerLinks(sites.flatMap((s) => s.operators));
  const getThere = sites.map((s) => s.getThere).find((t) => t && t.trim().length > 0);

  const atlasLoc = buildAtlasLocation(location);
  const encounters = getEncountersByLocationId(location.id);
  const isWitnessing = atlasLoc.state === "change";

  // Aggregate all sightings across child sites for the live feed
  const allSightings = sites
    .flatMap((s) =>
      getSightingsBySiteId(s.id).map((sv) => ({
        ...sv,
        siteName: s.name,
        siteSlug: s.slug,
      })),
    )
    .filter((sv) => sv.lastConfirmedAt !== null)
    .sort((a, b) => {
      const da = a.lastConfirmedAt ? new Date(a.lastConfirmedAt).getTime() : 0;
      const db = b.lastConfirmedAt ? new Date(b.lastConfirmedAt).getTime() : 0;
      return db - da;
    })
    .slice(0, 10);

  // Most recent sighting for the StatStrip
  const latestSighting = allSightings[0] ?? null;

  // StatStrip data
  const statItems = [
    { label: "Dive sites", value: String(sites.length) },
    {
      label: "Reef state",
      value: STATE_TEXT[atlasLoc.state],
    },
    ...(atlasLoc.cover
      ? [
          {
            label: "Coral cover",
            value: atlasLoc.cover,
            note: atlasLoc.coverYear ? `${atlasLoc.coverYear} survey` : undefined,
          },
        ]
      : []),
    {
      label: "Best season",
      value: bestMonthsText(location.bestMonths),
    },
    ...(latestSighting
      ? [
          {
            label: "Last confirmed",
            value: latestSighting.speciesCommon,
            note: latestSighting.lastConfirmedAt
              ? new Date(
                  latestSighting.lastConfirmedAt + "T00:00:00Z",
                ).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                })
              : undefined,
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <JsonLd data={locationSchema(location, sites.length)} />

        {/* Breadcrumb / back nav */}
        <nav className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <Link href="/" className="transition hover:text-[#0089de]">
            ← Atlas
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">{location.country}</span>
        </nav>

        {/* State chip */}
        <div className="mt-4">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold ${STATE_PILL[atlasLoc.state]}`}
          >
            <span className={`h-2 w-2 rounded-full ${STATE_DOT[atlasLoc.state]}`} aria-hidden />
            {STATE_TEXT[atlasLoc.state]}
          </span>
        </div>

        {/* Location name */}
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          {location.name}
        </h1>

        {/* Metadata row */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
          <span>{location.country}</span>
          <span className="text-slate-300">·</span>
          <span>{location.region}</span>
          <span className="text-slate-300">·</span>
          <span>Best diving {atlasLoc.season}</span>
        </div>

        {/* Stat strip */}
        <StatStrip stats={statItems} className="mt-5" />

        {/* Jump nav */}
        <div className="mt-6 flex gap-6 border-b border-slate-200 text-sm font-semibold">
          <a href="#overview" className="border-b-2 border-[#0089de] pb-3 text-slate-900">
            Overview
          </a>
          <a href="#conditions" className="border-b-2 border-transparent pb-3 text-slate-500 transition hover:text-slate-900">
            Conditions
          </a>
          <a href="#sites" className="border-b-2 border-transparent pb-3 text-slate-500 transition hover:text-slate-900">
            Dive sites
          </a>
        </div>

        {/* Witnessing change — honest label first */}
        {isWitnessing && (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4">
            <p className="text-sm font-semibold text-rose-800">
              This reef is experiencing documented loss. Survey data, depth, and species records are current.
            </p>
          </div>
        )}

        {/* Overview */}
        <section id="overview" className="pt-8">
          {/* Editorial hook — appears BEFORE reef science for thriving/pressure, AFTER for witnessing change */}
          {!isWitnessing && details?.extendedDescription ? (
            <EditorialHook text={details.extendedDescription} className="mb-6" />
          ) : null}
          <p className="max-w-3xl text-base leading-7 text-slate-700">
            {location.description}
          </p>
          {isWitnessing && details?.extendedDescription ? (
            <EditorialHook text={details.extendedDescription} className="mt-6" />
          ) : null}
        </section>

        {/* Species highlights strip — top 3 recently confirmed species */}
        {allSightings.length > 0 && (() => {
          const highlighted = allSightings
            .filter((sv) => sv.lastConfirmedAt)
            .slice(0, 6)
            .reduce<typeof allSightings>((acc, sv) => {
              if (!acc.find((x) => x.speciesCommon === sv.speciesCommon)) {
                acc.push(sv);
              }
              return acc;
            }, [])
            .slice(0, 3);

          if (highlighted.length === 0) return null;

          return (
            <section className="mt-10 border-t border-slate-200 pt-8">
              <h2 className="mb-4 text-lg font-bold text-slate-900">Notable species here</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {highlighted.map((sv, i) => (
                  <div
                    key={`${sv.speciesCommon}-${i}`}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <p className="text-sm font-bold text-slate-900">{sv.speciesCommon}</p>
                    {sv.speciesScientific ? (
                      <p className="mt-0.5 text-[11px] italic text-slate-500">
                        {sv.speciesScientific}
                      </p>
                    ) : null}
                    <p className="mt-2 text-[11px] text-slate-500">
                      {sv.siteName && (
                        <>
                          <span className="font-medium text-slate-700">{sv.siteName}</span>
                          {" · "}
                        </>
                      )}
                      {sv.lastConfirmedAt
                        ? new Date(sv.lastConfirmedAt + "T00:00:00Z").toLocaleDateString(
                            "en-US",
                            { month: "short", year: "numeric", timeZone: "UTC" },
                          )
                        : "No date on file"}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          );
        })()}

        {/* Live sightings feed */}
        {allSightings.length > 0 && (
          <section className="mt-10 border-t border-slate-200 pt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Recent sightings</h2>
              <LiveBadge label="Nightly sync" />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4">
              {allSightings.map((sv, i) => (
                <SightingRow
                  key={`${sv.siteId}-${sv.speciesCommon}-${i}`}
                  speciesCommon={sv.speciesCommon}
                  speciesScientific={sv.speciesScientific}
                  siteName={sv.siteName}
                  date={sv.lastConfirmedAt}
                />
              ))}
            </div>
          </section>
        )}

        {/* Conditions section */}
        <section id="conditions" className="mt-10 border-t border-slate-200 pt-10">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Conditions
          </p>

        <div className="mt-0 grid gap-10 lg:grid-cols-[minmax(0,_1.55fr)_minmax(0,_1fr)]">
          <div className="space-y-12">
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Good season
              </h2>
              <div className="mt-3 grid max-w-3xl grid-cols-12 gap-1">
                {MONTH_NAMES.map((m, i) => {
                  const monthNum = i + 1;
                  const on = bestMonthsSet.has(monthNum);
                  return (
                    <div
                      key={m}
                      className={`flex flex-col items-center rounded-md px-1 py-2 text-[11px] font-semibold ${
                        on
                          ? "bg-[#0089de] text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                      title={on ? "In season" : "Off season"}
                    >
                      {m}
                    </div>
                  );
                })}
              </div>
              {details?.seasonNotes ? (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  {details.seasonNotes}
                </p>
              ) : null}
            </section>

            {details ? (
              <section className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                    Trip duration
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {details.tripDuration}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                    Dive style
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {details.diveStyle}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                    Dive level
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {details.diveLevel}
                  </p>
                </div>
              </section>
            ) : null}

            {reefHealth ? (
              <ReefHealthPanel
                record={reefHealth}
                reefPressure={reefPressure}
                waterQuality={waterQuality}
                coralCoverSnapshot={coralCover}
                fishingPressure={fishingPressure}
                lastSurveyDays={getLastSurveyDays(location.id)}
                gfwLastBuiltAt={getFishingPressureLastBuiltAt()}
              />
            ) : (
              <UnknownReefHealthPanel />
            )}

            <section id="sites">
              <div className="mb-6 flex items-end justify-between border-b border-slate-200 pb-3">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Dive sites here
                </h2>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {sites.length} curated
                </span>
              </div>

              {sites.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    Dive sites for this location are still being curated.
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    We&rsquo;re working through our top destinations first. Check back soon,
                    or browse{" "}
                    <Link href="/" className="font-semibold text-[#0089de] hover:underline">
                      the globe
                    </Link>{" "}
                    for areas with sites already mapped.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sites.map((s) => (
                    <Link
                      key={s.id}
                      href={`/sites/${s.slug}`}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-[#0089de]/40 hover:shadow-md"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={underwaterPhotoUrl(s.heroImageUrl)}
                        alt={s.name}
                        className="h-44 w-full object-cover transition group-hover:scale-[1.02]"
                      />
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0089de]">
                          {s.name}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-3">
                          {s.description.slice(0, 140)}…
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            {s.depthRange.min}–{s.depthRange.max} m
                          </span>
                          <span className="inline-block rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[11px] font-semibold capitalize text-[#1d5d90]">
                            {s.skillLevel.replace("-", " ")}+
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <GearSection locationId={location.id} sites={sites} />

            {encounters.length > 0 ? (
              <section>
                <div className="mb-6 flex items-end justify-between border-b border-slate-200 pb-3">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Wildlife encounters here
                  </h2>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {encounters.length} encounter{encounters.length === 1 ? "" : "s"}
                  </span>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {encounters.map((enc) => (
                    <li key={enc.id}>
                      <Link
                        href={`/where-to-see/${enc.slug}`}
                        className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#0089de]/40 hover:shadow-sm"
                      >
                        {enc.heroImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={enc.heroImageUrl}
                            alt={enc.name}
                            width={56}
                            height={56}
                            style={{ width: 56, height: 56, minWidth: 56 }}
                            className="shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="size-14 shrink-0 rounded-lg bg-slate-100" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 group-hover:text-[#0089de]">
                            {enc.name}
                          </p>
                          {enc.speciesCommon ? (
                            <p className="mt-0.5 text-[12px] text-slate-500">{enc.speciesCommon}</p>
                          ) : null}
                          <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-slate-600">
                            {enc.shortDescription}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {details && details.quotes.length > 0 ? (
              <section>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  What divers say
                </h2>
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {details.quotes.map((q, i) => (
                    <figure
                      key={i}
                      className="rounded-2xl border border-slate-200 bg-white p-6"
                    >
                      <blockquote className="text-base italic leading-7 text-slate-800">
                        &ldquo;{q.text}&rdquo;
                      </blockquote>
                      {q.attribution ? (
                        <figcaption className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          — {q.attribution}
                        </figcaption>
                      ) : null}
                    </figure>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                  Itinerary
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  {isWitnessing ? "Plan thoughtfully" : "Plan your trip"}
                </h2>
              </div>

              {getThere ? (
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <span className="text-base">✈</span>
                    Getting there
                  </p>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-700">
                    {getThere}
                  </p>
                </div>
              ) : null}

              <LodgingBlock lodging={lodging} locationId={location.id} />
              <PartnerBlock
                heading="Who to dive with"
                icon="🤿"
                links={operators}
                event="operator_click"
                locationId={location.id}
              />
              {!operators.length && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <span className="text-base">🤿</span>
                    Who to dive with
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    We&rsquo;re still curating verified operators here. Search for local dive
                    centres to arrange guided dives, try-dive experiences, or certification
                    courses.
                  </p>
                  <a
                    href={`https://www.padi.com/dive-shop-search?q=${encodeURIComponent(location.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0089de] hover:underline"
                  >
                    Find PADI operators near {location.name} →
                  </a>
                </div>
              )}
            </div>
          </aside>
        </div>
        </section>{/* end #conditions */}
    </div>
  );
}

function dedupePartnerLinks(links: PartnerLink[]): PartnerLink[] {
  const seen = new Set<string>();
  const out: PartnerLink[] = [];
  for (const l of links) {
    const key = `${l.partner}::${l.label}::${l.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(l);
  }
  return out;
}

const TIER_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: "Budget",
  2: "Mid-range",
  3: "Upscale",
  4: "Luxury",
};

function TierBadge({ level }: { level: 1 | 2 | 3 | 4 }) {
  return (
    <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
      <span className="text-emerald-700">
        <span>{"$".repeat(level)}</span>
        <span className="text-slate-300">{"$".repeat(4 - level)}</span>
      </span>
      <span>{TIER_LABELS[level]}</span>
    </span>
  );
}

function LodgingBlock({
  lodging,
  locationId,
}: {
  lodging: PartnerLink[];
  locationId: string;
}) {
  if (!lodging.length) return null;
  const hotels = lodging.filter((l) => (l.kind ?? "hotel") === "hotel");
  const liveaboards = lodging.filter((l) => l.kind === "liveaboard");
  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <span className="text-base">🏨</span>
        Where to stay
      </p>
      {hotels.length ? (
        <LodgingTierGroup
          subheading="Hotels & resorts"
          links={hotels}
          locationId={locationId}
        />
      ) : null}
      {liveaboards.length ? (
        <LodgingTierGroup
          subheading="Liveaboards"
          links={liveaboards}
          locationId={locationId}
        />
      ) : null}
    </div>
  );
}

function LodgingTierGroup({
  subheading,
  links,
  locationId,
}: {
  subheading: string;
  links: PartnerLink[];
  locationId: string;
}) {
  const sorted = [...links].sort(
    (a, b) => (a.priceLevel ?? 3) - (b.priceLevel ?? 3),
  );
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {subheading}
      </p>
      <ul className="mt-1.5 space-y-1.5">
        {sorted.map((l) => (
          <li key={`${l.partner}-${l.label}`}>
            <AffiliateLink
              url={l.url || "#"}
              event="lodging_click"
              partner={l.partner}
              query={l.label}
              productId={l.productId}
              siteId={locationId}
              isAffiliate={l.isAffiliate}
              className="group block rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition hover:border-[#0089de] hover:bg-[#e8f0fe]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium leading-snug">{l.label}</span>
                <span className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#0089de]">
                  →
                </span>
              </div>
              {l.priceLevel ? (
                <div className="mt-1">
                  <TierBadge level={l.priceLevel} />
                </div>
              ) : null}
            </AffiliateLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PartnerBlock({
  heading,
  icon,
  links,
  event,
  locationId,
}: {
  heading: string;
  icon: string;
  links: PartnerLink[];
  event: "flight_click" | "lodging_click" | "operator_click";
  locationId: string;
}) {
  if (!links.length) return null;
  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <span className="text-base">{icon}</span>
        {heading}
      </p>
      <ul className="mt-2.5 space-y-1.5">
        {links.map((l) => (
          <li key={`${l.partner}-${l.label}`}>
            <AffiliateLink
              url={l.url || "#"}
              event={event}
              partner={l.partner}
              query={l.label}
              productId={l.productId}
              siteId={locationId}
              isAffiliate={l.isAffiliate}
              className="group block rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition hover:border-[#0089de] hover:bg-[#e8f0fe]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium leading-snug">{l.label}</span>
                <span className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#0089de]">
                  →
                </span>
              </div>
            </AffiliateLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

const BASIC_CATEGORIES = ["mask", "wetsuit", "bcd", "regulator", "fins", "computer"] as const;
const CATEGORY_NAME: Record<string, string> = {
  mask: "Mask",
  wetsuit: "Wetsuit",
  bcd: "BCD",
  regulator: "Regulator",
  fins: "Fins",
  computer: "Dive computer",
  snorkel: "Snorkel",
  boots: "Boots",
  drysuit: "Drysuit",
  light: "Dive light",
  "reel-smb": "SMB & reel",
  "reef-hook": "Reef hook",
  gloves: "Gloves",
  hood: "Hood",
  bag: "Dive bag",
  specialty: "Specialty",
};
const CATEGORY_ICON: Record<string, string> = {
  mask: "🥽",
  wetsuit: "🧥",
  bcd: "🎒",
  regulator: "🫁",
  fins: "🦶",
  computer: "⌚",
  snorkel: "🤿",
  boots: "👟",
  drysuit: "🧥",
  light: "🔦",
  "reel-smb": "🎈",
  "reef-hook": "⚓",
  gloves: "🧤",
  hood: "🪖",
  bag: "🧳",
  specialty: "🛠️",
};

function GearSection({
  locationId,
  sites,
}: {
  locationId: string;
  sites: Site[];
}) {
  const basics = BASIC_CATEGORIES.map((cat) =>
    getAllGear().find((g) => g.tier === "basic" && g.category === cat),
  ).filter((g): g is NonNullable<ReturnType<typeof getGearById>> => Boolean(g));

  const siteNameById = new Map(sites.map((s) => [s.id, s.name] as const));
  const seenAddOns = new Set<string>();
  const addOns: { name: string; reason: string; gearId?: string; siteName: string; siteId: string }[] = [];
  for (const s of sites) {
    for (const item of s.siteSpecificGear) {
      const key = `${item.name}::${item.gearId ?? ""}`;
      if (seenAddOns.has(key)) continue;
      seenAddOns.add(key);
      addOns.push({ ...item, siteName: siteNameById.get(s.id) ?? "", siteId: s.id });
    }
  }

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4 border-b border-slate-200 pb-3">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Gear</h2>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          What to bring
        </span>
      </div>
      <div className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-semibold text-slate-900">Basic kit</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {basics.map((g) => {
              const partner = g.partners[0];
              const label = CATEGORY_NAME[g.category] ?? g.category;
              const icon = CATEGORY_ICON[g.category] ?? "•";
              return (
                <li key={g.id} className="flex items-center gap-2 text-sm leading-6 text-slate-700">
                  <span aria-hidden className="text-lg">{icon}</span>
                  {partner ? (
                    <AffiliateLink
                      url={partner.url}
                      event="gear_click"
                      partner={partner.partner}
                      productId={partner.productId || undefined}
                      siteId={locationId}
                      isAffiliate={true}
                      className="font-semibold text-[#0089de] underline decoration-[#0089de]/30 underline-offset-2 hover:decoration-[#0089de]"
                    >
                      {label}
                    </AffiliateLink>
                  ) : (
                    <span className="font-semibold text-slate-900">{label}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {addOns.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-900">
              Site-specific add-ons
            </p>
            <p className="mb-3 text-xs text-slate-500">
              Some dive sites here call for extra gear. Check the individual site page for full
              context.
            </p>
            <ul className="space-y-2">
              {addOns.map((item) => {
                const gear = item.gearId ? getGearById(item.gearId) : undefined;
                const partner = gear?.partners[0];
                const label = item.name;
                const icon = (gear && CATEGORY_ICON[gear.category]) ?? "•";
                return (
                  <li
                    key={`${item.siteId}-${item.name}`}
                    className="flex gap-2 text-sm leading-6 text-slate-700"
                  >
                    <span aria-hidden className="text-lg leading-6">{icon}</span>
                    <span>
                      {partner ? (
                        <AffiliateLink
                          url={partner.url}
                          event="gear_click"
                          partner={partner.partner}
                          productId={partner.productId || undefined}
                          siteId={item.siteId}
                          isAffiliate={true}
                          className="font-semibold text-[#0089de] underline decoration-[#0089de]/30 underline-offset-2 hover:decoration-[#0089de]"
                        >
                          {label}
                        </AffiliateLink>
                      ) : (
                        <span className="font-semibold text-slate-900">{label}</span>
                      )}
                      <span className="text-slate-600"> — {item.reason}</span>
                      {item.siteName ? (
                        <span className="text-slate-400"> · {item.siteName}</span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}


function UnknownReefHealthPanel() {
  return (
    <section>
      <div className="mb-6 flex items-end justify-between border-b border-slate-200 pb-3">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Reef health
        </h2>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          No survey on file
        </span>
      </div>
      <p className="text-sm leading-6 text-slate-600">
        We don&rsquo;t yet have a survey or thermal-stress record on file for this
        location. That doesn&rsquo;t mean the reef is healthy — it means we can&rsquo;t
        say either way.
      </p>
    </section>
  );
}

/**
 * Linear extrapolation of live coral cover to zero, based on the most recent
 * two surveys on file. Returns null when we can't responsibly project — no
 * historical survey, same-year surveys, or the reef is stable / recovering.
 */
function computeCoverProjection({
  coverNow,
  coverBefore,
  surveyYear,
  historicalYear,
}: {
  coverNow: number | null;
  coverBefore: number | null;
  surveyYear: number | null;
  historicalYear: number | null;
}): { zeroYear: number; perYear: string; yearsLeft: number } | null {
  if (
    coverNow === null ||
    coverBefore === null ||
    surveyYear === null ||
    historicalYear === null
  ) {
    return null;
  }
  const span = surveyYear - historicalYear;
  if (span <= 0) return null;
  const perYear = (coverBefore - coverNow) / span;
  if (perYear <= 0) return null; // stable or recovering — no doom projection
  const yearsLeft = Math.max(1, Math.round(coverNow / perYear));
  return {
    zeroYear: surveyYear + yearsLeft,
    perYear: perYear.toFixed(1),
    yearsLeft,
  };
}

type Verdict = {
  label: string;
  headline: string;
  tone: "good" | "ok" | "warn" | "bad";
};

function computeVerdict(record: {
  observed?: { coralCoverPercent?: number; mortalityPercent?: number };
  thermalStress?: { alertLevel?: BleachingAlertLevel };
}): Verdict {
  const cover = record.observed?.coralCoverPercent ?? null;
  const mortality = record.observed?.mortalityPercent ?? null;
  const alert = record.thermalStress?.alertLevel ?? "no-stress";
  const stressed =
    alert === "alert-1" || alert === "alert-2" || alert === "warning";

  if (cover !== null && cover < 20 && (mortality ?? 0) >= 8) {
    return {
      label: "Severely degraded",
      tone: "bad",
      headline:
        "This reef has lost most of its live coral. Fish life and topography may still be worth diving, but expect a very different reef from the older photos.",
    };
  }
  if (cover !== null && cover < 30 && (mortality ?? 0) >= 8) {
    return {
      label: "Shrinking",
      tone: "bad",
      headline:
        "This reef is losing coral faster than it's recovering. If it's on your list, go sooner — and manage expectations on coral colour.",
    };
  }
  if (stressed && cover !== null && cover < 40) {
    return {
      label: "At risk now",
      tone: "warn",
      headline:
        "This reef is under heat stress right now and has thinned over the last decade. Plan a trip this year rather than next.",
    };
  }
  if (cover !== null && cover >= 40 && !stressed) {
    return {
      label: "Holding steady",
      tone: "good",
      headline:
        "One of the few reefs whose live coral has held up over the last decade. Plan with confidence.",
    };
  }
  return {
    label: "Mixed",
    tone: "ok",
    headline:
      "Some loss since the 2010s, but the reef still has plenty to dive. Pick your depth and shoulder season carefully.",
  };
}

const ALERT_CONSEQUENCE: Record<BleachingAlertLevel, string> = {
  "no-stress": "No abnormal heat right now. Corals stay coloured.",
  watch: "Mild warmth. Worth watching — no bleaching yet.",
  warning: "Reefs at this level can start losing colour within weeks.",
  "alert-1": "Bleaching likely. Some coral mortality typically follows.",
  "alert-2":
    "Severe bleaching expected. Significant coral mortality is likely.",
};

function CoverBar({
  label,
  percent,
  tone,
  sublabel,
}: {
  label: string;
  percent: number;
  tone: "now" | "healthy" | "before";
  sublabel?: string;
}) {
  const fill =
    tone === "healthy"
      ? "bg-emerald-500"
      : tone === "before"
        ? "bg-slate-400"
        : "bg-[#0089de]";
  const width = Math.max(0, Math.min(100, percent));
  return (
    <div className="flex items-center gap-3 text-[12px] leading-5">
      <div className="w-36 shrink-0 text-slate-700">
        <div className="font-semibold">{label}</div>
        {sublabel ? (
          <div className="text-[11px] text-slate-500">{sublabel}</div>
        ) : null}
      </div>
      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full ${fill} transition-all`}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="w-12 shrink-0 text-right font-semibold text-slate-800">
        {percent}%
      </div>
    </div>
  );
}

const SIGNAL_TONE: Record<"good" | "ok" | "warn" | "bad" | "neutral", string> = {
  good: "bg-emerald-50 text-emerald-700",
  ok: "bg-sky-50 text-sky-700",
  warn: "bg-amber-50 text-amber-800",
  bad: "bg-rose-50 text-rose-700",
  neutral: "bg-slate-100 text-slate-600",
};

const ALERT_TONE: Record<BleachingAlertLevel, "good" | "ok" | "warn" | "bad"> = {
  "no-stress": "good",
  watch: "ok",
  warning: "warn",
  "alert-1": "bad",
  "alert-2": "bad",
};

const FISHING_SIGNAL: Record<
  string,
  { label: string; tone: "good" | "ok" | "warn" | "bad" | "neutral" }
> = {
  low: { label: "Low", tone: "good" },
  moderate: { label: "Moderate", tone: "ok" },
  high: { label: "High", tone: "warn" },
  "very-high": { label: "Very high", tone: "bad" },
  unknown: { label: "Not enough data", tone: "neutral" },
};

const FRESHNESS_TONE: Record<string, "good" | "warn" | "neutral"> = {
  fresh: "good",
  stale: "warn",
  cold: "neutral",
};

/** One clean product-styled key-signal card. */
function SignalCard({
  label,
  value,
  badgeTone,
  note,
}: {
  label: string;
  value: string;
  badgeTone?: "good" | "ok" | "warn" | "bad" | "neutral";
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#0089de]/40 hover:shadow-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      {badgeTone ? (
        <span
          className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${SIGNAL_TONE[badgeTone]}`}
        >
          {value}
        </span>
      ) : (
        <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      )}
      {note ? (
        <p className="mt-2.5 text-[13px] leading-5 text-slate-600">{note}</p>
      ) : null}
    </div>
  );
}

function ReefHealthPanel({
  record,
  reefPressure,
  waterQuality,
  coralCoverSnapshot,
  fishingPressure,
  lastSurveyDays,
  gfwLastBuiltAt,
}: {
  record: NonNullable<ReturnType<typeof getReefHealthByLocationId>>[number];
  reefPressure: ReturnType<typeof getReefPressureByLocationId>;
  waterQuality: ReturnType<typeof getWaterQualityByLocationId>;
  coralCoverSnapshot: ReturnType<typeof getCoralCoverForLocation>;
  fishingPressure: ReturnType<typeof getFishingPressureForLocation>;
  lastSurveyDays: number | null;
  gfwLastBuiltAt: string;
}) {
  const fishingPressureLevel = reefPressure?.fishingPressure ?? null;
  const observed = record.observed;
  const thermal = record.thermalStress;
  const projection = record.projection;
  const verdict = computeVerdict(record);
  const state = record.locationId ? getReefState(record.locationId) : null;

  const methods = record.methodologyClaimIds
    .map(getMethodologyByClaimId)
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  // Sources displayed in the disclosure = sources directly cited by this
  // record PLUS sources referenced by the methodology notes that govern
  // its claims. That way registry expansions surface here.
  const sourceIds = Array.from(
    new Set([
      ...(observed?.sourceIds ?? []),
      ...(thermal?.sourceIds ?? []),
      ...(projection?.sourceIds ?? []),
      ...methods.flatMap((m) => m.sourceIds),
    ]),
  );
  const sources = sourceIds
    .map(getSourceById)
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const coverNow = observed?.coralCoverPercent ?? null;
  const coverBefore = observed?.historicalCoralCoverPercent ?? null;
  const historicalYear = observed?.historicalSurveyDate
    ? new Date(observed.historicalSurveyDate + "T00:00:00Z").getUTCFullYear()
    : null;
  const surveyYear = observed?.surveyDate
    ? new Date(observed.surveyDate + "T00:00:00Z").getUTCFullYear()
    : null;

  const coverTrend =
    coverNow !== null && coverBefore !== null
      ? Math.round((coverNow - coverBefore) * 10) / 10
      : null;
  const coverNote =
    coverTrend !== null
      ? `${coverBefore}% ${historicalYear ?? "then"} → ${coverNow}% ${surveyYear ?? "now"}${
          coverTrend < 0
            ? `, down ${Math.abs(coverTrend)} points`
            : coverTrend > 0
              ? `, up ${coverTrend} points`
              : ", holding steady"
        }`
      : surveyYear
        ? `Live hard coral, surveyed ${surveyYear}`
        : "Live hard coral cover";

  const surveyStamp =
    surveyYear && observed?.surveyMethod
      ? `Surveyed ${surveyYear} · ${observed.surveyMethod}`
      : surveyYear
        ? `Surveyed ${surveyYear}`
        : null;

  const fish = FISHING_SIGNAL[fishingPressureLevel ?? "unknown"] ?? FISHING_SIGNAL.unknown;
  const fresh =
    lastSurveyDays !== null ? freshness(lastSurveyDays) : null;

  // Fishing pressure — fold the single most useful GFW number (trend vs the
  // historical baseline year) into the one fishing card.
  const gfwTrend =
    fishingPressure?.historical &&
    fishingPressure.historical.fishingHours > 0
      ? Math.round(
          ((fishingPressure.current.fishingHours -
            fishingPressure.historical.fishingHours) /
            fishingPressure.historical.fishingHours) *
            100,
        )
      : null;
  const fishingNote =
    gfwTrend !== null && fishingPressure
      ? `Visible fishing ${
          gfwTrend > 0
            ? `up ${gfwTrend}%`
            : gfwTrend < 0
              ? `down ${Math.abs(gfwTrend)}%`
              : "flat"
        } vs ${fishingPressure.historical!.year}. Global Fishing Watch · ${fishingPressure.current.year}.`
      : fishingPressure
        ? `Global Fishing Watch · ${fishingPressure.current.year}.`
        : "Visible fishing activity near the reef from satellite tracking.";

  // Protection — promote MPA status from the old ReefPressurePanel.
  const mpa = reefPressure
    ? MPA_STATUS[reefPressure.mpaStatus] ?? MPA_STATUS["no-protection"]
    : null;
  const mpaNote =
    reefPressure && reefPressure.mpaName
      ? `${reefPressure.mpaName}${
          reefPressure.mpaSinceYear ? ` · since ${reefPressure.mpaSinceYear}` : ""
        }`
      : mpa
        ? mpa.copy
        : null;

  // Water quality — promote the single highest-severity event (or
  // microplastics) from the old WaterQualityPanel, only if a record exists.
  const WQ_ORDER: Record<string, number> = { watch: 1, concerning: 2, severe: 3 };
  const worstEvent =
    waterQuality && waterQuality.events.length > 0
      ? [...waterQuality.events].sort(
          (a, b) => (WQ_ORDER[b.severity] ?? 0) - (WQ_ORDER[a.severity] ?? 0),
        )[0]
      : null;
  const wqSignal = worstEvent
    ? {
        value: WQ_SEVERITY_LABEL[worstEvent.severity] ?? worstEvent.severity,
        tone:
          worstEvent.severity === "severe"
            ? ("bad" as const)
            : worstEvent.severity === "concerning"
              ? ("warn" as const)
              : ("ok" as const),
        note: worstEvent.title,
      }
    : waterQuality?.microplasticsLevel
      ? {
          value: WQ_MICROPLASTICS_LABEL[waterQuality.microplasticsLevel],
          tone:
            waterQuality.microplasticsLevel === "very-high"
              ? ("bad" as const)
              : waterQuality.microplasticsLevel === "high"
                ? ("warn" as const)
                : waterQuality.microplasticsLevel === "moderate"
                  ? ("ok" as const)
                  : ("good" as const),
          note: "Ambient microplastics in the water column.",
        }
      : null;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between border-b border-slate-200 pb-3">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Reef health
        </h2>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Updated from ongoing science
          </span>
          {observed?.surveyDate ? (
            <DataFreshnessLabel
              variant="snapshot"
              surveyMethod={observed.surveyMethod ?? "field survey"}
              surveyDate={observed.surveyDate}
            />
          ) : null}
        </div>
      </div>

      <p className="max-w-2xl text-[13px] leading-6 text-slate-600">
        These signals come from ongoing surveys and daily satellite
        monitoring, not a one-time write-up.
      </p>

      {/* Key signals — clean, digestible */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {state ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#0089de]/40 hover:shadow-md sm:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Reef state
            </p>
            <span
              className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${STATE_PILL[state]}`}
            >
              <span className={`h-2 w-2 rounded-full ${STATE_DOT[state]}`} aria-hidden />
              {STATE_TEXT[state]}
            </span>
            <p className="mt-2.5 max-w-2xl text-[13px] leading-6 text-slate-600">
              {STATE_DEF[state].short}
            </p>
          </div>
        ) : null}

        {coverNow !== null ? (
          <SignalCard
            label="Coral cover now"
            value={`${coverNow}%`}
            note={surveyStamp ? `${coverNote}. ${surveyStamp}.` : coverNote}
          />
        ) : null}

        {thermal ? (
          <SignalCard
            label="Heat stress right now"
            value={ALERT_LABEL[thermal.alertLevel]}
            badgeTone={ALERT_TONE[thermal.alertLevel]}
            note={`${ALERT_CONSEQUENCE[thermal.alertLevel]} NOAA Coral Reef Watch · updated ${formatSurveyDate(thermal.asOf)}.`}
          />
        ) : null}

        <SignalCard
          label="Fishing pressure"
          value={fish.label}
          badgeTone={fish.tone}
          note={fishingNote}
        />

        {mpa ? (
          <SignalCard
            label="Protection status"
            value={mpa.label}
            badgeTone={mpa.tone}
            note={mpaNote ?? undefined}
          />
        ) : null}

        {wqSignal ? (
          <SignalCard
            label="Water quality"
            value={wqSignal.value}
            badgeTone={wqSignal.tone}
            note={wqSignal.note}
          />
        ) : null}

        {fresh ? (
          <SignalCard
            label="Last eyes underwater"
            value={fresh.label}
            badgeTone={FRESHNESS_TONE[fresh.k]}
            note={
              lastSurveyDays !== null
                ? `Most recent survey about ${Math.round(lastSurveyDays / 30)} months ago — ${fresh.note}.`
                : fresh.note
            }
          />
        ) : null}
      </div>

      {record.divingOutlook ? (
        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700">
            What to expect on a dive
          </p>
          <p className="mt-2 text-[14px] leading-6 text-sky-900">
            {record.divingOutlook}
          </p>
        </div>
      ) : null}

      {reefPressure?.visitorImpactNote ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            What you can do
          </p>
          <p className="mt-2 text-[14px] leading-6 text-emerald-900">
            {reefPressure.visitorImpactNote}
          </p>
        </div>
      ) : null}

      {/* How this is calculated — raw methodology lives here */}
      <HowCalculated>
        <div className="space-y-5">
          <p className="text-[13px] leading-6 text-slate-600">
            {verdict.headline}
          </p>

          {coverNow !== null ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                  Coral cover trajectory
                </p>
                {observed?.surveyMethod ? (
                  <DataFreshnessLabel
                    variant="snapshot"
                    surveyMethod={observed.surveyMethod}
                    surveyDate={observed.surveyDate}
                  />
                ) : null}
              </div>
              <div className="mt-3 space-y-2.5">
                {coverBefore !== null ? (
                  <CoverBar
                    label="A decade ago"
                    sublabel={historicalYear ? `Survey ${historicalYear}` : undefined}
                    percent={coverBefore}
                    tone="before"
                  />
                ) : null}
                <CoverBar
                  label="Today"
                  sublabel={surveyYear ? `Survey ${surveyYear}` : undefined}
                  percent={coverNow}
                  tone="now"
                />
              </div>
              {(() => {
                const proj = computeCoverProjection({
                  coverNow,
                  coverBefore,
                  surveyYear,
                  historicalYear,
                });
                if (!proj) return null;
                return (
                  <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[12px] leading-5 text-rose-900">
                    <span className="font-semibold">
                      On current trend, no live coral by about {proj.zeroYear}.
                    </span>{" "}
                    Losing roughly {proj.perYear}% cover per year — about{" "}
                    {proj.yearsLeft} years of reef left if nothing changes.
                  </p>
                );
              })()}
            </div>
          ) : null}

          {observed ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                Raw observed numbers
              </p>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[13px]">
                {typeof observed.coralCoverPercent === "number" ? (
                  <li>
                    Coral cover: <strong>{observed.coralCoverPercent}%</strong> (survey{" "}
                    {formatSurveyDate(observed.surveyDate)}, {observed.surveyMethod})
                  </li>
                ) : null}
                {typeof observed.bleachedPercent === "number" ? (
                  <li>
                    Bleached: <strong>{observed.bleachedPercent}%</strong>
                  </li>
                ) : null}
                {typeof observed.mortalityPercent === "number" ? (
                  <li>
                    Recent mortality: <strong>{observed.mortalityPercent}%</strong>
                  </li>
                ) : null}
                {observed.notes ? <li>{observed.notes}</li> : null}
              </ul>
            </div>
          ) : null}

          {coralCoverSnapshot ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                Jurisdiction scale reference
              </p>
              <p className="mt-1.5 text-[13px] leading-6">
                The headline coral cover above is the site survey on file. For
                wider context, {coralCoverSnapshot.program} reports a{" "}
                {coralCoverSnapshot.label} mean of{" "}
                <strong>{coralCoverSnapshot.current.coverPercent}%</strong> in{" "}
                {coralCoverSnapshot.current.year}
                {coralCoverSnapshot.historical
                  ? `, against ${coralCoverSnapshot.historical.coverPercent}% in ${coralCoverSnapshot.historical.year}`
                  : ""}
                . {coralCoverSnapshot.method}.
                {coralCoverSnapshot.notes ? ` ${coralCoverSnapshot.notes}` : ""}{" "}
                Reported at the jurisdiction scale, not this single reef.{" "}
                <a
                  href={coralCoverSnapshot.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0089de] hover:underline"
                >
                  {coralCoverSnapshot.sourceLabel} →
                </a>
              </p>
            </div>
          ) : null}

          {thermal ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                  Thermal stress mechanics
                </p>
                {thermal.source === "noaa-crw-live" ? (
                  <DataFreshnessLabel
                    variant="live"
                    source="NOAA CRW"
                    updatedAt={thermal.fetchedAt ?? thermal.asOf}
                  />
                ) : (
                  <DataFreshnessLabel
                    variant="snapshot"
                    surveyMethod="NOAA CRW (scaffolding)"
                    surveyDate={thermal.asOf}
                  />
                )}
              </div>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[13px]">
                <li>
                  NOAA Coral Reef Watch alert level:{" "}
                  <strong>{ALERT_LABEL[thermal.alertLevel]}</strong> — updated{" "}
                  {formatSurveyDate(thermal.asOf)}
                </li>
                {typeof thermal.degreeHeatingWeeks === "number" ? (
                  <li>
                    Degree Heating Weeks:{" "}
                    <strong>{thermal.degreeHeatingWeeks} °C-wk</strong> (cumulative heat dose)
                  </li>
                ) : null}
                {typeof thermal.sstAnomalyC === "number" ? (
                  <li>
                    Sea surface temperature anomaly:{" "}
                    <strong>+{thermal.sstAnomalyC} °C</strong>
                  </li>
                ) : null}
                <li>
                  Alert scale: no stress → watch → warning → alert level 1 →
                  alert level 2. Bleaching becomes likely at alert level 1.
                </li>
              </ul>
            </div>
          ) : null}

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                Fishing pressure method
              </p>
              <DataFreshnessLabel
                variant="live"
                source="Global Fishing Watch"
                updatedAt={fishingPressure?.fetchedAt ?? gfwLastBuiltAt}
              />
            </div>
            <p className="mt-1.5 text-[13px] leading-6">
              Fishing pressure is a proxy from Global Fishing Watch satellite
              AIS tracking, counting visible fishing hours within a fixed radius
              of the reef and comparing recent activity to a historical baseline.
            </p>
            {fishingPressure ? (
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[13px]">
                <li>
                  Apparent fishing hours within {fishingPressure.radiusKm} km:{" "}
                  <strong>
                    {fishingPressure.current.fishingHours.toLocaleString()} h
                  </strong>{" "}
                  in {fishingPressure.current.year}
                  {fishingPressure.historical
                    ? `, against ${fishingPressure.historical.fishingHours.toLocaleString()} h in ${fishingPressure.historical.year}`
                    : ""}
                  .
                </li>
                {reefPressure && reefPressure.topPressures.length > 0 ? (
                  <li>
                    Dominant pressures: {reefPressure.topPressures.join(", ")}.
                  </li>
                ) : null}
              </ul>
            ) : null}
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[12px] leading-5 text-amber-900">
              <strong>Important caveat.</strong> GFW only sees vessels
              broadcasting AIS. Small artisanal boats, most under 12 metre
              vessels, and any operator deliberately running dark are invisible
              here. A low number is not evidence of low fishing pressure in
              artisanal dominated regions.
            </p>
          </div>

          {mpa ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                Protection status
              </p>
              <p className="mt-1.5 text-[13px] leading-6">{mpa.copy}</p>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[13px]">
                {reefPressure?.mpaName ? (
                  <li>
                    {reefPressure.mpaName}
                    {reefPressure.mpaSinceYear
                      ? ` · designated ${reefPressure.mpaSinceYear}`
                      : ""}
                    .
                  </li>
                ) : null}
                {typeof reefPressure?.greenFinsOperatorCount === "number" &&
                reefPressure.greenFinsOperatorCount > 0 ? (
                  <li>
                    {reefPressure.greenFinsOperatorCount} Green Fins verified
                    operator
                    {reefPressure.greenFinsOperatorCount === 1 ? "" : "s"} known
                    at this location.
                  </li>
                ) : null}
              </ul>
              <p className="mt-1.5 text-[12px] leading-5 text-slate-500">
                Protection status sourced from Protected Planet / WDPA and
                refined with the Marine Protection Atlas.
              </p>
            </div>
          ) : null}

          {waterQuality && waterQuality.events.length > 0 ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                Pollution and water quality
              </p>
              <ul className="mt-1.5 space-y-2 text-[13px] leading-6">
                {waterQuality.events.map((e, i) => (
                  <li key={i}>
                    <strong>
                      {e.title} ({WQ_SEVERITY_LABEL[e.severity] ?? e.severity})
                    </strong>{" "}
                    — since {e.since}
                    {e.worstMonths && e.worstMonths.length > 0
                      ? `, worst ${e.worstMonths
                          .map((m) => MONTH_NAMES[m - 1])
                          .join(", ")}`
                      : ""}
                    . {e.description}
                  </li>
                ))}
              </ul>
              {waterQuality.microplasticsLevel ? (
                <p className="mt-1.5 text-[13px] leading-6">
                  {WQ_MICROPLASTICS_LABEL[waterQuality.microplasticsLevel]} in
                  the water column.
                </p>
              ) : null}
              {waterQuality.divingImpactNote ? (
                <p className="mt-1.5 text-[13px] leading-6 text-slate-600">
                  {waterQuality.divingImpactNote}
                </p>
              ) : null}
            </div>
          ) : null}

          {state ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                How the reef state is classified
              </p>
              <p className="mt-1.5 text-[13px] leading-6">
                {STATE_DEF[state].signal}
              </p>
            </div>
          ) : null}

          {projection ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                Projection · {projection.scenario}
              </p>
              <p className="mt-1.5 text-[13px] leading-6">{projection.statement}</p>
              <p className="mt-1 text-[12px] text-slate-500">
                Uncertainty: {projection.uncertainty}
              </p>
            </div>
          ) : null}

          {methods.map((m) => (
            <div key={m.claimId}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                How we summarise this
              </p>
              <p className="mt-1.5 text-[13px] leading-6">{m.limitations}</p>
            </div>
          ))}

          {sources.length > 0 ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                Sources
              </p>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[13px]">
                {sources.map((src) => (
                  <li key={src.id}>
                    {src.url ? (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-[#0089de] hover:underline"
                      >
                        {src.name}
                      </a>
                    ) : (
                      src.name
                    )}
                    {src.publisher ? (
                      <span className="text-slate-500"> — {src.publisher}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </HowCalculated>

      <p className="mt-3 text-[12px] leading-5 text-slate-500">
        Reef condition changes year to year. If you visit, consider supporting{" "}
        <Link href="/about" className="text-[#0089de] hover:underline">
          responsible travel and conservation
        </Link>{" "}
        operators on the ground.
      </p>
    </section>
  );
}

const MPA_STATUS: Record<string, { label: string; tone: "good" | "ok" | "warn"; copy: string }> = {
  "no-protection": {
    label: "No formal protection",
    tone: "warn",
    copy: "This site sits outside any designated marine protected area. Operator and community choices carry most of the conservation weight here.",
  },
  "designated-multi-use": {
    label: "Multi-use MPA",
    tone: "ok",
    copy: "Inside a designated MPA that permits regulated fishing and other uses. Worth checking which zones at this location are no-take.",
  },
  "strict-mpa": {
    label: "Strict MPA",
    tone: "good",
    copy: "Inside a strict marine protected area with active enforcement.",
  },
  "no-take": {
    label: "No-take reserve",
    tone: "good",
    copy: "Fully no-take — no fishing of any kind. The strongest protection tier.",
  },
};

const WQ_SEVERITY_LABEL: Record<string, string> = {
  watch: "WATCH",
  concerning: "CONCERNING",
  severe: "SEVERE",
};

const WQ_MICROPLASTICS_LABEL: Record<string, string> = {
  low: "Low microplastics",
  moderate: "Moderate microplastics",
  high: "High microplastics",
  "very-high": "Very high microplastics",
};
