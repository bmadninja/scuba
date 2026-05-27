import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { PlanForm } from "./plan-form";
import { getAllLocations, getLocationBySlug } from "@/lib/data/locations";
import { getSitesByLocationId } from "@/lib/data/sites";
import { getAllGear } from "@/lib/data/gear";
import { getTripCostByLocationId } from "@/lib/data/trip-costs";
import { getReefHealthByLocationId } from "@/lib/data/reef-health";
import type {
  BleachingAlertLevel,
  CostRange,
  FlightHub,
  LodgingTier,
  PartnerLink,
} from "@/lib/data/types";

export const metadata: Metadata = {
  title: "Build a dive trip | scubaSeason.fun",
  description:
    "Stitch a 5–10 day dive trip together: destination, certification, lodging tier, and home airport. Get an estimated cost range and a shareable URL.",
};

const SKILL_RANK: Record<string, number> = {
  "never-dived": 0,
  "open-water": 1,
  advanced: 2,
  rescue: 3,
  divemaster: 4,
  tech: 5,
};

const HUB_LABELS: Record<FlightHub, string> = {
  "us-west": "US West Coast",
  "us-east": "US East Coast",
  europe: "Europe",
  asia: "Asia",
  oceania: "Australia / NZ",
};

const TIER_LABELS: Record<LodgingTier, string> = {
  budget: "Budget",
  mid: "Mid-range",
  upscale: "Upscale",
  luxury: "Luxury",
  liveaboard: "Liveaboard",
};

const VERDICT_TONE: Record<string, string> = {
  thriving: "bg-emerald-50 border-emerald-200 text-emerald-900",
  ok: "bg-sky-50 border-sky-200 text-sky-900",
  warn: "bg-amber-50 border-amber-200 text-amber-900",
  bad: "bg-rose-50 border-rose-200 text-rose-900",
};

const ALERT_TO_TONE: Record<BleachingAlertLevel, "thriving" | "ok" | "warn" | "bad"> = {
  "no-stress": "thriving",
  watch: "thriving",
  warning: "warn",
  "alert-1": "warn",
  "alert-2": "bad",
};

function fmtUsd(n: number): string {
  return "$" + Math.round(n).toLocaleString();
}

function rangeStr(r: CostRange): string {
  return `${fmtUsd(r.min)}–${fmtUsd(r.max)}`;
}

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const get = (k: string): string => {
    const v = params[k];
    if (Array.isArray(v)) return v[0] ?? "";
    return v ?? "";
  };

  const locationSlug = get("location");
  const days = Math.max(2, Math.min(21, Number(get("days") || 7)));
  const hub: FlightHub = (
    ["us-west", "us-east", "europe", "asia", "oceania"].includes(get("hub"))
      ? get("hub")
      : "us-east"
  ) as FlightHub;
  const tier: LodgingTier = (
    ["budget", "mid", "upscale", "luxury", "liveaboard"].includes(get("tier"))
      ? get("tier")
      : "mid"
  ) as LodgingTier;
  const cert = get("cert");

  const allLocations = getAllLocations();
  const location = locationSlug ? getLocationBySlug(locationSlug) : null;

  return (
    <div className="min-h-screen bg-white text-slate-900">
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
            <Link href="/encounters" className="hover:text-[#0089de]">
              Encounters
            </Link>
            <Link href="/plan" className="text-[#0089de]">
              Plan a trip
            </Link>
            <Link href="/about" className="hover:text-[#0089de]">
              About
            </Link>
            <Link href="/faq" className="hover:text-[#0089de]">
              FAQ
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0089de]">
          Plan a trip
        </p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
          Build a dive trip
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
          Pick a destination, a certification, a tier, and a home hub. We&rsquo;ll
          stitch the rough budget, the dive sites, and the operators — and give
          you a URL to share.
        </p>

        <Suspense fallback={null}>
          <PlanForm
            allLocations={allLocations.map((l) => ({
              slug: l.slug,
              name: l.name,
              country: l.country,
            }))}
          />
        </Suspense>

        {!location ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-700">
              Pick a destination to start.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Or jump into the catalogue —{" "}
              <Link href="/sites" className="text-[#0089de] hover:underline">
                browse dive sites
              </Link>{" "}
              and come back.
            </p>
          </div>
        ) : (
          <Plan
            location={location}
            days={days}
            hub={hub}
            tier={tier}
            cert={cert}
          />
        )}
      </main>
    </div>
  );
}

function Plan({
  location,
  days,
  hub,
  tier,
  cert,
}: {
  location: NonNullable<ReturnType<typeof getLocationBySlug>>;
  days: number;
  hub: FlightHub;
  tier: LodgingTier;
  cert: string;
}) {
  const sites = getSitesByLocationId(location.id);
  const cost = getTripCostByLocationId(location.id);
  const reef = getReefHealthByLocationId(location.id)[0] ?? null;

  // Pick the top 3-6 sites at this location, optionally filtered by cert.
  const certRank = cert ? (SKILL_RANK[cert] ?? null) : null;
  const fitSites = sites
    .filter((s) => {
      if (certRank === null) return true;
      const sRank = SKILL_RANK[s.skillLevel] ?? 99;
      return sRank <= certRank;
    })
    .sort((a, b) => b.editorialRank - a.editorialRank)
    .slice(0, 6);

  // Aggregate partners across the location's sites.
  const lodging = dedupePartners(
    sites.flatMap((s) => s.lodging).filter((l) => !tier || l.priceLevel === undefined || true),
  ).slice(0, 5);
  const operators = dedupePartners(sites.flatMap((s) => s.operators)).slice(0, 5);

  // Cost math
  let total: CostRange | null = null;
  const breakdown: { label: string; range: CostRange; sub?: string }[] = [];
  if (cost) {
    const flight = cost.flightUsdFromHub[hub];
    const lodgingPerNight = cost.perNightLodgingUsd[tier];
    const isLiveaboard = tier === "liveaboard";
    const lodgingNights = Math.max(0, days - 1); // leave 1 travel night
    const lodgingTotal: CostRange | undefined = lodgingPerNight
      ? { min: lodgingPerNight.min * lodgingNights, max: lodgingPerNight.max * lodgingNights }
      : undefined;
    // Liveaboard packages typically include dives; otherwise add dive days.
    const diveDays = isLiveaboard ? 0 : Math.max(0, days - 2); // travel days
    const diving: CostRange | undefined = (!isLiveaboard && cost.diveDayUsd && diveDays > 0)
      ? { min: cost.diveDayUsd.min * diveDays, max: cost.diveDayUsd.max * diveDays }
      : undefined;
    const transfers = cost.localTransfersUsd;
    const parkFees = cost.parkFeesUsd;

    if (flight) {
      breakdown.push({ label: "Round-trip flight", range: flight, sub: `${HUB_LABELS[hub]} → ${location.country}` });
    }
    if (lodgingTotal) {
      breakdown.push({
        label: isLiveaboard
          ? `Liveaboard (${lodgingNights} nights)`
          : `${TIER_LABELS[tier]} lodging (${lodgingNights} nights)`,
        range: lodgingTotal,
        sub: lodgingPerNight ? `${rangeStr(lodgingPerNight)} / night` : undefined,
      });
    }
    if (diving) {
      breakdown.push({
        label: `Diving (${diveDays} days)`,
        range: diving,
        sub: cost.diveDayUsd ? `${rangeStr(cost.diveDayUsd)} / day · 2-tank package` : undefined,
      });
    }
    if (transfers) {
      breakdown.push({ label: "Local transfers", range: transfers });
    }
    if (parkFees) {
      breakdown.push({ label: "Park & permit fees", range: { min: parkFees, max: parkFees } });
    }
    total = breakdown.reduce(
      (acc, b) => ({ min: acc.min + b.range.min, max: acc.max + b.range.max }),
      { min: 0, max: 0 },
    );
  }

  // Reef-health verdict callout
  const reefAlert = reef?.thermalStress?.alertLevel;
  const verdictTone = reefAlert ? ALERT_TO_TONE[reefAlert] : null;
  const verdictText = reef
    ? buildVerdictText(reef.observed?.coralCoverPercent, reef.observed?.mortalityPercent, reefAlert)
    : null;

  const allGear = getAllGear();
  const basicGear = allGear.filter((g) => g.tier === "basic").slice(0, 6);

  return (
    <div className="mt-10 space-y-8">
      {/* Plan header */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
              Your trip
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {days} days in {location.name}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              From {HUB_LABELS[hub]} · {TIER_LABELS[tier]}
              {cert ? ` · ${cert.replace("-", " ")} cert` : ""}
            </p>
          </div>
          <Link
            href={`/locations/${location.slug}`}
            className="text-sm font-semibold text-[#0089de] hover:underline"
          >
            Full location page →
          </Link>
        </div>
      </section>

      {/* Reef-health verdict */}
      {verdictText && verdictTone ? (
        <div
          className={`flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-start sm:gap-5 ${VERDICT_TONE[verdictTone]}`}
        >
          <span className="shrink-0 self-start rounded-full bg-white/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-900">
            Reef status
          </span>
          <p className="text-[14px] leading-6">{verdictText}</p>
        </div>
      ) : null}

      {/* Cost estimate */}
      {total && cost ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
            Estimated cost
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {rangeStr(total)}
            <span className="ml-2 text-sm font-medium text-slate-500">per traveller</span>
          </p>
          <table className="mt-4 w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {breakdown.map((b) => (
                <tr key={b.label}>
                  <td className="py-2 pr-4 align-top">
                    <div className="font-semibold text-slate-800">{b.label}</div>
                    {b.sub ? (
                      <div className="text-[11px] text-slate-500">{b.sub}</div>
                    ) : null}
                  </td>
                  <td className="py-2 text-right font-semibold text-slate-800">
                    {rangeStr(b.range)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cost.notes ? (
            <p className="mt-4 text-[12px] leading-5 text-slate-500">{cost.notes}</p>
          ) : null}
          <p className="mt-3 text-[11px] text-slate-500">
            Editorial range, not live prices. Book operators directly to confirm.
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-sm text-slate-600">
          We don&rsquo;t yet have a trip-cost record on file for{" "}
          <strong>{location.name}</strong>. You can still review sites,
          operators, and gear below.
        </section>
      )}

      {/* Dive sites */}
      <section>
        <h3 className="text-lg font-bold tracking-tight text-slate-900">
          Sites you&rsquo;d dive {cert ? `at ${cert.replace("-", " ")}` : ""}
        </h3>
        <p className="mt-1 text-[12px] text-slate-500">
          Sorted by editorial rank.
        </p>
        {fitSites.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-6 text-sm text-slate-600">
            No sites at this location fit the cert filter. Try widening it.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {fitSites.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/sites/${s.slug}`}
                  className="block rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-[#0089de]/40 hover:shadow-sm"
                >
                  <div className="font-semibold text-slate-900">{s.name}</div>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-500">
                    {s.depthRange.min}–{s.depthRange.max} m ·{" "}
                    {s.skillLevel.replace("-", " ")}+
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Where to stay */}
      {lodging.length > 0 ? (
        <section>
          <h3 className="text-lg font-bold tracking-tight text-slate-900">
            Where to stay
          </h3>
          <p className="mt-1 text-[12px] text-slate-500">
            Partner-aggregated options. Disclosure: affiliate links may apply.
          </p>
          <ul className="mt-3 space-y-2">
            {lodging.map((l, i) => (
              <li key={`${l.partner}-${l.label}-${i}`}>
                <a
                  href={l.url}
                  target="_blank"
                  rel={l.isAffiliate ? "nofollow sponsored noopener" : "nofollow noopener"}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-[#0089de]/40"
                >
                  <span className="font-semibold text-slate-900">{l.label}</span>
                  <span className="text-[11px] uppercase tracking-wider text-slate-500">
                    {l.partner} →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Operators */}
      {operators.length > 0 ? (
        <section>
          <h3 className="text-lg font-bold tracking-tight text-slate-900">
            Who to dive with
          </h3>
          <ul className="mt-3 space-y-2">
            {operators.map((o, i) => (
              <li key={`${o.partner}-${o.label}-${i}`}>
                <a
                  href={o.url}
                  target="_blank"
                  rel={o.isAffiliate ? "nofollow sponsored noopener" : "nofollow noopener"}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-[#0089de]/40"
                >
                  <span className="font-semibold text-slate-900">{o.label}</span>
                  <span className="text-[11px] uppercase tracking-wider text-slate-500">
                    {o.partner} →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Basic kit */}
      <section>
        <h3 className="text-lg font-bold tracking-tight text-slate-900">
          Basic kit
        </h3>
        <p className="mt-1 text-[12px] text-slate-500">
          Rent on day one; replace gradually after that.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {basicGear.map((g) => (
            <li
              key={g.id}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="font-semibold text-slate-900">{g.name}</div>
              <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-500">
                {g.category.replace("-", " ")} · ${g.priceRangeUsd.min}–$
                {g.priceRangeUsd.max}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-[11px] text-slate-500">
        Built from scubaSeason editorial data. See{" "}
        <Link href="/about" className="text-[#0089de] hover:underline">
          editorial independence
        </Link>{" "}
        for how we keep affiliate links out of recommendations.
      </p>
    </div>
  );
}

function dedupePartners(list: PartnerLink[]): PartnerLink[] {
  const seen = new Set<string>();
  const out: PartnerLink[] = [];
  for (const p of list) {
    const key = `${p.partner}|${p.label}|${p.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

function buildVerdictText(
  cover: number | undefined,
  mortality: number | undefined,
  alert: BleachingAlertLevel | undefined,
): string | null {
  if (!alert && cover === undefined) return null;
  const stressed = alert === "warning" || alert === "alert-1" || alert === "alert-2";
  if (cover !== undefined && cover < 20 && (mortality ?? 0) >= 8) {
    return "Severely degraded reef. Fish and topography may still be worth diving, but expect very different photos from the older guidebooks.";
  }
  if (cover !== undefined && cover < 30 && (mortality ?? 0) >= 8) {
    return "Reef is shrinking — losing coral faster than recovering. If this destination is on your list, sooner beats later.";
  }
  if (stressed) {
    return "Under heat stress right now. Plan a trip this year rather than next.";
  }
  if (cover !== undefined && cover >= 40) {
    return "One of the few reefs whose live coral has held up over the last decade. Plan with confidence.";
  }
  return "Mixed condition — pick depth and shoulder season carefully.";
}
