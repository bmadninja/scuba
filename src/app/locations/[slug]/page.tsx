import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AffiliateLink } from "@/components/affiliate-link";
import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import { JsonLd } from "@/components/json-ld";
import { underwaterPhotoUrl } from "@/lib/photo-quality";
import { locationSchema } from "@/lib/schema-org";
import { getAllLocations, getLocationBySlug } from "@/lib/data/locations";
import { getSitesByLocationId } from "@/lib/data/sites";
import { getLocationDetailsById } from "@/lib/data/location-details";
import { getAllGear, getGearById } from "@/lib/data/gear";
import { getReefHealthByLocationId } from "@/lib/data/reef-health";
import { getSourceById } from "@/lib/data/sources";
import { getMethodologyByClaimId } from "@/lib/data/methodologies";
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

const ALERT_RING: Record<BleachingAlertLevel, string> = {
  "no-stress": "bg-emerald-50 text-emerald-800 ring-emerald-200",
  watch: "bg-amber-50 text-amber-800 ring-amber-200",
  warning: "bg-orange-50 text-orange-800 ring-orange-200",
  "alert-1": "bg-rose-50 text-rose-800 ring-rose-200",
  "alert-2": "bg-rose-100 text-rose-900 ring-rose-300",
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
  const details = getLocationDetailsById(location.id);
  const bestMonthsSet = new Set(location.bestMonths);

  const lodging = dedupePartnerLinks(sites.flatMap((s) => s.lodging));
  const operators = dedupePartnerLinks(sites.flatMap((s) => s.operators));
  const getThere = sites.map((s) => s.getThere).find((t) => t && t.trim().length > 0);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <JsonLd data={locationSchema(location, sites.length)} />
      <SiteHeader activeHref="/sites" />

      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0089de]">
          {location.country} · {location.region}
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
          {location.name}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
          {location.description}
        </p>

        {details ? (
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
            {details.extendedDescription}
          </p>
        ) : null}

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,_1.55fr)_minmax(0,_1fr)]">
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
              <ReefHealthPanel record={reefHealth} />
            ) : (
              <UnknownReefHealthPanel />
            )}

            <section>
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
                  Plan your trip
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
            </div>
            <AffiliateDisclosure />
          </aside>
        </div>
      </main>
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
      "Some loss since the 2010s, but the reef still has plenty to dive. Pick depth and shoulder-season carefully.",
  };
}

const VERDICT_STRIP: Record<Verdict["tone"], string> = {
  good: "bg-emerald-50 border-emerald-200 text-emerald-900",
  ok: "bg-sky-50 border-sky-200 text-sky-900",
  warn: "bg-amber-50 border-amber-200 text-amber-900",
  bad: "bg-rose-50 border-rose-200 text-rose-900",
};

const VERDICT_BADGE: Record<Verdict["tone"], string> = {
  good: "bg-emerald-600 text-white",
  ok: "bg-sky-600 text-white",
  warn: "bg-amber-600 text-white",
  bad: "bg-rose-600 text-white",
};

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

function ReefHealthPanel({
  record,
}: {
  record: NonNullable<ReturnType<typeof getReefHealthByLocationId>>[number];
}) {
  const observed = record.observed;
  const thermal = record.thermalStress;
  const projection = record.projection;
  const verdict = computeVerdict(record);

  const methods = record.methodologyClaimIds
    .map(getMethodologyByClaimId)
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  // Sources displayed in the drawer = sources directly cited by this
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

  return (
    <section>
      <div className="mb-6 flex items-end justify-between border-b border-slate-200 pb-3">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Reef health
        </h2>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          What you&rsquo;ll actually find
        </span>
      </div>

      {/* Verdict strip — the single-sentence takeaway */}
      <div
        className={`flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-start sm:gap-5 ${VERDICT_STRIP[verdict.tone]}`}
      >
        <span
          className={`shrink-0 self-start rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${VERDICT_BADGE[verdict.tone]}`}
        >
          {verdict.label}
        </span>
        <p className="text-[14px] leading-6">{verdict.headline}</p>
      </div>

      {/* Coral reef health — this site's trajectory */}
      {coverNow !== null ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
              Coral reef health
            </p>
            <Link
              href="/faq#coral-cover"
              className="text-[11px] font-medium text-slate-500 hover:text-[#0089de] hover:underline"
            >
              How is this calculated?
            </Link>
          </div>
          <div className="mt-4 space-y-2.5">
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
            const projection = computeCoverProjection({
              coverNow,
              coverBefore,
              surveyYear,
              historicalYear,
            });
            if (!projection) return null;
            return (
              <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-[12px] leading-5 text-rose-900">
                <span className="font-semibold">
                  On current trend, no live coral by ~{projection.zeroYear}.
                </span>{" "}
                Losing about {projection.perYear}% cover per year — roughly{" "}
                {projection.yearsLeft} years of reef left to see if nothing
                changes.
              </p>
            );
          })()}
        </div>
      ) : null}

      {/* Heat stress + dive outlook side by side */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {thermal ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
              Heat stress right now
            </p>
            <div
              className={`mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-bold uppercase tracking-wider ring-1 ring-inset ${ALERT_RING[thermal.alertLevel]}`}
            >
              {ALERT_LABEL[thermal.alertLevel]}
            </div>
            <p className="mt-3 text-[13px] leading-6 text-slate-700">
              {ALERT_CONSEQUENCE[thermal.alertLevel]}
            </p>
            <p className="mt-3 text-[11px] leading-5 text-slate-500">
              NOAA Coral Reef Watch · updated {formatSurveyDate(thermal.asOf)}
              {typeof thermal.degreeHeatingWeeks === "number"
                ? ` · ${thermal.degreeHeatingWeeks} °C-week heat dose`
                : ""}
            </p>
          </div>
        ) : null}

        {record.divingOutlook ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
              What to expect on a dive
            </p>
            <p className="mt-3 text-[13px] leading-6 text-slate-700">
              {record.divingOutlook}
            </p>
          </div>
        ) : null}
      </div>

      {projection ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
            Projection · {projection.scenario}
          </p>
          <p className="mt-3 text-[13px] leading-6 text-slate-700">
            {projection.statement}
          </p>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            Uncertainty: {projection.uncertainty}
          </p>
        </div>
      ) : null}

      <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-[12px] leading-5 text-slate-700">
        <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          Sources, methodology, and the raw numbers
        </summary>
        <div className="mt-3 space-y-3">
          {observed ? (
            <div>
              <p className="font-semibold text-slate-800">Raw observed numbers</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
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
          {thermal ? (
            <div>
              <p className="font-semibold text-slate-800">Raw thermal numbers</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                <li>
                  NOAA CRW alert level:{" "}
                  <strong>{ALERT_LABEL[thermal.alertLevel]}</strong>
                </li>
                {typeof thermal.degreeHeatingWeeks === "number" ? (
                  <li>
                    Degree Heating Weeks:{" "}
                    <strong>{thermal.degreeHeatingWeeks} °C-wk</strong>
                  </li>
                ) : null}
                {typeof thermal.sstAnomalyC === "number" ? (
                  <li>
                    SST anomaly: <strong>+{thermal.sstAnomalyC} °C</strong>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
          {methods.map((m) => (
            <div key={m.claimId}>
              <p className="font-semibold text-slate-800">How we summarise this</p>
              <p className="mt-1">{m.limitations}</p>
            </div>
          ))}
          {sources.length > 0 ? (
            <div>
              <p className="font-semibold text-slate-800">Sources</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
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
      </details>

      <p className="mt-3 text-[12px] leading-5 text-slate-500">
        Reef condition changes year to year. If you visit, consider supporting{" "}
        <Link href="/about" className="text-[#0089de] hover:underline">
          responsible-travel and conservation
        </Link>{" "}
        operators on the ground.
      </p>
    </section>
  );
}
