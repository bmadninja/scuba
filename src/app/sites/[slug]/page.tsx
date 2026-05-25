import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AffiliateLink } from "@/components/affiliate-link";
import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import { JsonLd } from "@/components/json-ld";
import { siteSchema } from "@/lib/schema-org";
import { getAllSites, getSiteBySlug } from "@/lib/data/sites";
import { getLocationById } from "@/lib/data/locations";
import { getGearById } from "@/lib/data/gear";
import {
  formatLastConfirmed,
  getSightingsBySiteId,
} from "@/lib/data/sightings";
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
      images: site.heroImageUrl ? [{ url: site.heroImageUrl, width: 2000, height: 1100 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: site.heroImageUrl ? [site.heroImageUrl] : undefined,
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
  const sightingSourceIds = Array.from(
    new Set(sightings.flatMap((s) => s.sourceIds)),
  );
  const sightingMethodIds = Array.from(
    new Set(sightings.flatMap((s) => s.methodologyClaimIds)),
  );
  const sightingSources = sightingSourceIds
    .map(getSourceById)
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const sightingMethods = sightingMethodIds
    .map(getMethodologyByClaimId)
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  const heroUrl =
    site.heroImageUrl ??
    "https://upload.wikimedia.org/wikipedia/commons/c/c7/Diving_the_Cenotes_in_Yucatan%2C_Mexico_%2841791832870%29.jpg";

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <JsonLd data={siteSchema(site, location)} />
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-slate-900">
              scubaSeason<span className="text-[#0089de]">.fun</span>
            </span>
          </Link>
          <nav className="hidden gap-6 text-sm font-medium text-slate-700 sm:flex">
            <Link href="/sites" className="hover:text-[#0089de]">
              Dive sites
            </Link>
            <Link href="/about" className="hover:text-[#0089de]">
              About
            </Link>
          </nav>
        </div>
      </header>
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
              className="group inline-flex w-fit items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/85 transition hover:text-white"
            >
              <span aria-hidden className="transition group-hover:-translate-x-0.5">←</span>
              <span>{location.name}</span>
              <span className="h-1 w-1 rounded-full bg-white/60" />
              <span>{location.country}</span>
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
                      {s.scientificName ? (
                        <div className="text-xs italic text-slate-500">
                          {s.scientificName}
                        </div>
                      ) : null}
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
                        {s.speciesScientific ? (
                          <div className="text-xs italic text-slate-500">
                            {s.speciesScientific}
                          </div>
                        ) : null}
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
