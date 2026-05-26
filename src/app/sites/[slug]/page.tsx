import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AffiliateLink } from "@/components/affiliate-link";
import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import { JsonLd } from "@/components/json-ld";
import { underwaterPhotoUrl } from "@/lib/photo-quality";
import { siteSchema } from "@/lib/schema-org";
import { getAllSites, getSiteBySlug } from "@/lib/data/sites";
import { getLocationById } from "@/lib/data/locations";
import { getGearById } from "@/lib/data/gear";
import {
  formatLastConfirmed,
  getSightingsBySiteId,
} from "@/lib/data/sightings";
import { getWrecksBySiteId } from "@/lib/data/wrecks";
import { getSourceById } from "@/lib/data/sources";
import { getMethodologyByClaimId } from "@/lib/data/methodologies";
import type {
  ConditionsMonth,
  Site,
  SpeciesEntry,
} from "@/lib/data/types";

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const CONFIDENCE_RING: Record<"high" | "medium" | "low", string> = {
  high: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  medium: "bg-amber-50 text-amber-800 ring-amber-200",
  low: "bg-orange-50 text-orange-800 ring-orange-200",
};

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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CURRENT_COLOR: Record<ConditionsMonth["currentStrength"], string> = {
  none: "bg-slate-100 text-slate-700",
  mild: "bg-emerald-50 text-emerald-700",
  moderate: "bg-amber-50 text-amber-800",
  strong: "bg-rose-50 text-rose-700",
};

const RELIABILITY_COLOR: Record<SpeciesEntry["reliability"], string> = {
  "year-round": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  seasonal: "bg-amber-50 text-amber-800 ring-amber-200",
  rare: "bg-slate-100 text-slate-600 ring-slate-200",
};

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
  // Surface the methodology's full source list in the drawer, not just
  // the per-record sourceIds — that way new registry entries cited by
  // the methodology note appear here without rewriting every record.
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

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <JsonLd data={siteSchema(site, location)} />
      <SiteHeader activeHref="/sites" />
      {/* Photo hero */}
      <section className="relative h-[58vh] min-h-[420px] w-full overflow-hidden">
        <Image
          src={heroUrl}
          alt={site.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/55" />
        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-12 text-white">
          {location ? (
            <Link
              href={`/locations/${location.slug}`}
              className="group inline-flex w-fit max-w-full items-center gap-2 rounded-full bg-slate-950/45 px-3 py-1.5 text-sm font-semibold text-white shadow-sm ring-1 ring-white/20 backdrop-blur-md transition hover:bg-slate-950/65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label={`Back to the ${location.name} location guide`}
            >
              <ArrowLeft
                aria-hidden
                className="h-3.5 w-3.5 shrink-0 transition group-hover:-translate-x-0.5"
              />
              <span className="truncate">Location guide</span>
              <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-white/50" />
              <span className="truncate text-xs font-medium text-white/78">
                {location.name}
              </span>
            </Link>
          ) : null}
          <h1 className="mt-3 max-w-3xl text-[clamp(2.25rem,5vw,4rem)] font-bold leading-[1.05] tracking-tight">
            {site.name}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Pill>
              {site.depthRange.min}–{site.depthRange.max} m
            </Pill>
            <Pill className="capitalize">{site.skillLevel.replace("-", " ")}+</Pill>
            {site.diveTypes.slice(0, 2).map((t) => (
              <Pill key={t} className="capitalize">
                {t.replace("-", " ")}
              </Pill>
            ))}
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                inSeason
                  ? "bg-emerald-500 text-white"
                  : "bg-white/15 text-white ring-1 ring-inset ring-white/30"
              }`}
            >
              {inSeason ? "● In season now" : "○ Out of season"}
            </span>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-4xl px-6 pb-24">
        <article className="space-y-12 pt-10">
          {location ? (
            <div className="rounded-2xl border border-slate-200 bg-[#f5faff] px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
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

          <Section title="Overview">
            <p className="text-lg leading-8 text-slate-700">{site.description}</p>
            {site.notes ? (
              <div className="mt-5 rounded-xl border-l-4 border-[#0089de] bg-[#e8f0fe] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#1d5d90]">
                  Briefing note
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{site.notes}</p>
              </div>
            ) : null}
          </Section>

          <Section
            title="What you'll see"
            kicker={`${site.species.length} species curated`}
          >
            <ul className="grid gap-2 sm:grid-cols-2">
              {site.species.map((s) => (
                <li
                  key={s.commonName}
                  className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#0089de]/40 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{s.commonName}</div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${RELIABILITY_COLOR[s.reliability]}`}
                    >
                      {s.reliability}
                    </span>
                  </div>
                  {s.bestMonths && s.bestMonths.length > 0 ? (
                    <div className="mt-2 text-[11px] text-slate-500">
                      Peak: {s.bestMonths.map((m) => MONTHS[m - 1]).join(" · ")}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </Section>

          {sightings.length > 0 ? (
            <Section
              title="Sightings evidence"
              kicker={`${sightings.length} record${sightings.length === 1 ? "" : "s"} on file`}
            >
              <ul className="grid gap-3 sm:grid-cols-2">
                {sightings.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {s.speciesCommon}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${CONFIDENCE_RING[s.confidence]}`}
                      >
                        {s.confidence} confidence
                      </span>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px] leading-5">
                      <dt className="text-slate-500">Last confirmed</dt>
                      <dd className="text-slate-800">
                        {formatLastConfirmed(s.lastConfirmedAt)}
                      </dd>
                      <dt className="text-slate-500">Recent records</dt>
                      <dd className="text-slate-800">
                        {s.recentRecordCount} within {s.proximityRadiusKm} km
                      </dd>
                      {s.seasonalityMonths.length > 0 &&
                      s.seasonalityMonths.length < 12 ? (
                        <>
                          <dt className="text-slate-500">Cluster months</dt>
                          <dd className="text-slate-800">
                            {s.seasonalityMonths
                              .map((m) => MONTH_ABBR[m - 1])
                              .join(", ")}
                          </dd>
                        </>
                      ) : null}
                      {s.seasonalityMonths.length === 12 ? (
                        <>
                          <dt className="text-slate-500">Cluster months</dt>
                          <dd className="text-slate-800">Year-round</dd>
                        </>
                      ) : null}
                    </dl>
                    {s.notes ? (
                      <p className="mt-2 text-[12px] leading-5 text-slate-600">
                        {s.notes}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>

              <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-[12px] leading-5 text-slate-700">
                <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Sources & methodology
                </summary>
                <div className="mt-3 space-y-3">
                  {sightingMethods.map((m) => (
                    <div key={m.claimId}>
                      <p className="font-semibold text-slate-800">
                        How we summarise this
                      </p>
                      <p className="mt-1">{m.limitations}</p>
                    </div>
                  ))}
                  {sightingSources.length > 0 ? (
                    <div>
                      <p className="font-semibold text-slate-800">Sources</p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-5">
                        {sightingSources.map((src) => (
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
                              <span className="text-slate-500">
                                {" "}
                                — {src.publisher}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </details>
            </Section>
          ) : null}

          {wrecks.length > 0 ? (
            <Section
              title="The wreck"
              kicker={wrecks.length === 1 ? "Ship history" : `${wrecks.length} wrecks here`}
            >
              <ul className="grid gap-4">
                {wrecks.map((w) => (
                  <WreckCard key={w.id} record={w} />
                ))}
              </ul>
              <p className="mt-3 text-[12px] leading-5 text-slate-500">
                Vessel histories sourced from the Naval History and Heritage
                Command (DANFS), NOAA ENC Direct, and editorial research.
                Bathymetry per GEBCO. See the{" "}
                <Link href="/about" className="text-[#0089de] hover:underline">
                  methodology
                </Link>{" "}
                for limits.
              </p>
            </Section>
          ) : null}

          <Section title="Conditions">
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3">Water</th>
                    <th className="px-4 py-3">Visibility</th>
                    <th className="px-4 py-3">Current</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {site.conditionsByMonth.map((c) => (
                    <tr
                      key={c.month}
                      className={c.month === currentMonth ? "bg-[#e8f0fe]/40" : ""}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {MONTHS[c.month - 1]}
                        {c.month === currentMonth ? (
                          <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-[#0089de] align-middle" />
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {c.waterTempC.min}–{c.waterTempC.max} °C
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {c.visibilityM.min}–{c.visibilityM.max} m
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${CURRENT_COLOR[c.currentStrength]}`}
                        >
                          {c.currentStrength}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Season calendar">
            {site.bestMonths.length === 12 ? (
              <div className="flex items-center gap-3 rounded-lg bg-[#e8f0fe] px-4 py-3 text-sm font-medium text-[#0089de]">
                <span className="inline-block h-2 w-2 rounded-full bg-[#0089de]" />
                Divable year-round — no distinct peak season
              </div>
            ) : (
              <>
                <div className="flex gap-1.5">
                  {MONTHS.map((m, i) => {
                    const isPeak = site.bestMonths.includes(i + 1);
                    const isNow = currentMonth === i + 1;
                    return (
                      <div
                        key={m}
                        className={`relative flex-1 rounded-lg py-3 text-center text-xs font-semibold tracking-wide transition ${
                          isPeak
                            ? "bg-[#0089de] text-white"
                            : "bg-slate-100 text-slate-500"
                        } ${isNow ? "outline outline-2 outline-offset-2 outline-[#0089de]" : ""}`}
                      >
                        {m}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Peak season highlighted · current month outlined
                </p>
              </>
            )}
          </Section>

          {site.siteSpecificGear.length > 0 ? <SiteGearSection site={site} /> : null}

          {location ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                Next step
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                Book your trip to {location.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Hotels, liveaboards, dive operators, gear recommendations, and travel
                logistics for the whole region.
              </p>
              <Link
                href={`/locations/${location.slug}`}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0089de] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d5d90]"
              >
                Plan your trip →
              </Link>
            </div>
          ) : null}

          <AffiliateDisclosure />
        </article>
      </main>
    </div>
  );
}

function Pill({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white ring-1 ring-inset ring-white/30 backdrop-blur ${className}`}
    >
      {children}
    </span>
  );
}

function Section({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4 border-b border-slate-200 pb-3">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
        {kicker ? (
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {kicker}
          </span>
        ) : null}
      </div>
      <div>{children}</div>
    </section>
  );
}

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

function SiteGearSection({ site }: { site: Site }) {
  return (
    <Section title="Gear for this site" kicker="Beyond the basic kit">
      <ul className="space-y-2">
        {site.siteSpecificGear.map((item) => {
          const gear = item.gearId ? getGearById(item.gearId) : undefined;
          const partner = gear?.partners[0];
          const label = item.name;
          const icon = (gear && CATEGORY_ICON[gear.category]) ?? "•";
          return (
            <li key={item.name} className="flex gap-2 text-sm leading-6 text-slate-700">
              <span aria-hidden className="text-lg leading-6">{icon}</span>
              <span>
                {partner ? (
                  <AffiliateLink
                    url={partner.url}
                    event="gear_click"
                    partner={partner.partner}
                    productId={partner.productId || undefined}
                    siteId={site.id}
                    isAffiliate={true}
                    className="font-semibold text-[#0089de] underline decoration-[#0089de]/30 underline-offset-2 hover:decoration-[#0089de]"
                  >
                    {label}
                  </AffiliateLink>
                ) : (
                  <span className="font-semibold text-slate-900">{label}</span>
                )}
                <span className="text-slate-600"> — {item.reason}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

const VESSEL_TYPE_LABEL: Record<string, string> = {
  freighter: "Freighter",
  tanker: "Tanker",
  warship: "Warship",
  submarine: "Submarine",
  aircraft: "Aircraft",
  ferry: "Ferry",
  fishing: "Fishing vessel",
  "cable-layer": "Cable-layer",
  research: "Research vessel",
  tug: "Tug",
  other: "Structure",
};

const SUNK_CAUSE_LABEL: Record<string, string> = {
  "wartime-attack": "Sunk in wartime",
  "scuttled-artificial-reef": "Scuttled as artificial reef",
  "scuttled-disposal": "Scuttled / disposed",
  accident: "Accident",
  storm: "Lost in storm",
  unknown: "Cause unknown",
};

const PROTECTION_LABEL: Record<string, string> = {
  none: "No formal protection",
  "underwater-cultural-heritage": "Underwater cultural heritage",
  "national-marine-sanctuary": "National marine sanctuary",
  "war-grave": "War grave",
  "restricted-access": "Restricted access",
};

const PROTECTION_TONE: Record<string, string> = {
  none: "bg-slate-100 text-slate-600",
  "underwater-cultural-heritage": "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
  "national-marine-sanctuary": "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200",
  "war-grave": "bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-200",
  "restricted-access": "bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-300",
};

function fmtSunk(iso: string): string {
  if (/^\d{4}$/.test(iso)) return iso;
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const d = new Date(iso + "T00:00:00Z");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  }
  return iso;
}

function WreckCard({
  record,
}: {
  record: NonNullable<ReturnType<typeof getWrecksBySiteId>>[number];
}) {
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
            {VESSEL_TYPE_LABEL[record.vesselType] ?? record.vesselType}
            {record.nationality ? ` · ${record.nationality}` : ""}
          </p>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
            {record.vesselName}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${PROTECTION_TONE[record.protectionStatus]}`}
        >
          {PROTECTION_LABEL[record.protectionStatus] ?? record.protectionStatus}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px] leading-5 sm:grid-cols-4">
        {record.builtYear ? (
          <>
            <dt className="text-slate-500">Built</dt>
            <dd className="font-semibold text-slate-800">{record.builtYear}</dd>
          </>
        ) : null}
        <dt className="text-slate-500">Sunk</dt>
        <dd className="font-semibold text-slate-800">{fmtSunk(record.sunk)}</dd>
        {record.lengthM ? (
          <>
            <dt className="text-slate-500">Length</dt>
            <dd className="font-semibold text-slate-800">{record.lengthM} m</dd>
          </>
        ) : null}
        {record.tonnage ? (
          <>
            <dt className="text-slate-500">Tonnage</dt>
            <dd className="font-semibold text-slate-800">{record.tonnage.toLocaleString()}</dd>
          </>
        ) : null}
        {record.depthRangeM ? (
          <>
            <dt className="text-slate-500">Diveable depth</dt>
            <dd className="font-semibold text-slate-800">
              {record.depthRangeM.min}–{record.depthRangeM.max} m
            </dd>
          </>
        ) : null}
        <dt className="text-slate-500">How she sank</dt>
        <dd className="font-semibold text-slate-800">
          {SUNK_CAUSE_LABEL[record.sunkCause] ?? record.sunkCause}
        </dd>
      </dl>

      <p className="mt-4 text-[13px] leading-6 text-slate-700">{record.history}</p>

      {record.notableFeatures && record.notableFeatures.length > 0 ? (
        <>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Notable features
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {record.notableFeatures.map((f) => (
              <li
                key={f}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700"
              >
                {f}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </li>
  );
}
