import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AffiliateLink } from "@/components/affiliate-link";
import { JsonLd } from "@/components/json-ld";
import { siteSchema } from "@/lib/schema-org";
import { getAllSites, getSiteBySlug } from "@/lib/data/sites";
import { getLocationById } from "@/lib/data/locations";
import { getGearById } from "@/lib/data/gear";
import type {
  ConditionsMonth,
  PartnerLink,
  Site,
  SpeciesEntry,
} from "@/lib/data/types";

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

  const heroUrl =
    site.heroImageUrl ?? `https://picsum.photos/seed/${site.slug}/2000/1100`;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <JsonLd data={siteSchema(site, location)} />
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
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
            <span>{location?.country}</span>
            <span className="h-1 w-1 rounded-full bg-white/60" />
            <span>{location?.region}</span>
          </div>
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

      {/* Two-column body */}
      <main className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,_1.55fr)_minmax(0,_1fr)]">
          <article className="space-y-12 pt-10">
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

            <Section title="Conditions">
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Month</th>
                      <th className="px-4 py-3">Water</th>
                      <th className="px-4 py-3">Visibility</th>
                      <th className="px-4 py-3">Current</th>
                      <th className="px-4 py-3">Exposure</th>
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
                        <td className="px-4 py-3 text-slate-600">{c.suitRecommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Season calendar">
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
            </Section>

            <GearSection site={site} />

          </article>

          {/* Sticky Plan Your Trip */}
          <aside className="lg:sticky lg:top-6 lg:self-start lg:pt-10">
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                  Itinerary
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  Plan your trip
                </h2>
              </div>

              <PartnerBlock
                heading="Getting there"
                icon="✈"
                links={site.getThere}
                event="flight_click"
                siteId={site.id}
              />
              <PartnerBlock
                heading="Where to stay"
                icon="🏨"
                links={site.lodging}
                event="lodging_click"
                siteId={site.id}
              />
              <PartnerBlock
                heading="Who to dive with"
                icon="🤿"
                links={site.operators}
                event="operator_click"
                siteId={site.id}
              />

              </div>
          </aside>
        </div>
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

function PartnerBlock({
  heading,
  icon,
  links,
  event,
  siteId,
}: {
  heading: string;
  icon: string;
  links: PartnerLink[];
  event: "flight_click" | "lodging_click" | "operator_click";
  siteId: string;
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
              siteId={siteId}
              isAffiliate={l.isAffiliate}
              className="group block rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition hover:border-[#0089de] hover:bg-[#e8f0fe]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium leading-snug">{l.label}</span>
                <span className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#0089de]">
                  →
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <span>{l.partner}</span>
                {l.isAffiliate ? (
                  <span className="rounded bg-[#e8f0fe] px-1 py-px text-[#1d5d90]">
                    partner
                  </span>
                ) : null}
              </div>
            </AffiliateLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GearSection({ site }: { site: Site }) {
  const baseKit = site.gearIds
    .map((id) => getGearById(id))
    .filter((g): g is NonNullable<ReturnType<typeof getGearById>> => g !== null);

  return (
    <Section title="Gear" kicker="Tier A: base kit · Tier B: site-specific">
      <div className="space-y-8">
        {baseKit.length ? (
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Tier A — Base kit
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {baseKit.map((g) => (
                <li
                  key={g.id}
                  className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#0089de]/50 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{g.name}</div>
                      <div className="text-xs capitalize text-slate-500">
                        {g.category.replace("-", " ")}
                      </div>
                    </div>
                    <div className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      ${g.priceRangeUsd.min}–${g.priceRangeUsd.max}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{g.description}</p>
                  {g.partners[0] ? (
                    <AffiliateLink
                      url={g.partners[0].url}
                      event="gear_click"
                      partner={g.partners[0].partner}
                      query={g.name}
                      productId={g.partners[0].productId}
                      siteId={site.id}
                      isAffiliate={true}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#0089de] transition hover:text-[#1d5d90]"
                    >
                      Shop on {g.partners[0].partner}
                      <span className="transition group-hover:translate-x-0.5">→</span>
                    </AffiliateLink>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">
            Tier B — Site-specific extras
          </p>
          <ul className="space-y-2">
            {site.siteSpecificGear.map((item) => (
              <li
                key={item.name}
                className="rounded-xl border-l-4 border-amber-400 bg-amber-50 px-4 py-3"
              >
                <div className="font-semibold text-amber-900">{item.name}</div>
                <div className="mt-1 text-sm leading-6 text-amber-900/80">
                  {item.reason}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
