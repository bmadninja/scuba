import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { SetNavBreadcrumb } from "@/components/set-nav-breadcrumb";
import { underwaterPhotoUrl } from "@/lib/photo-quality";
import { siteSchema } from "@/lib/schema-org";
import { getAllSites, getSiteBySlug } from "@/lib/data/sites";
import { getLocationById } from "@/lib/data/locations";
import { getGearById } from "@/lib/data/gear";
import { getSightingsBySiteId } from "@/lib/data/sightings";
import { getIucnStatus, IUCN_ENABLED } from "@/lib/data/iucn-status";
import { getSpeciesPhotoCredit } from "@/lib/data/species-photos";
import { skillText } from "@/lib/data/reef-state";
import { SitePageBody } from "./site-page-body";
import type {
  ConditionCard,
  EncounterRow,
  GearGroup,
  GearItem,
  GetThereView,
  OperatorItem,
  TripFact,
} from "./site-page-body";
import type { Site } from "@/lib/data/types";

const MONTH_LETTERS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const IUCN_BADGE: Record<string, { bg: string; color: string }> = {
  EX: { bg: "#fdecec", color: "#b91c1c" },
  EW: { bg: "#fdecec", color: "#b91c1c" },
  CR: { bg: "#fdecec", color: "#b91c1c" },
  EN: { bg: "#fdecec", color: "#c0392f" },
  VU: { bg: "#fcf2e2", color: "#b9751a" },
  NT: { bg: "#f3fce8", color: "#3f6212" },
  LC: { bg: "#e7f6ee", color: "#15824c" },
};

const IUCN_LABEL: Record<string, string> = {
  EX: "Extinct",
  EW: "Extinct in the wild",
  CR: "Critically endangered",
  EN: "Endangered",
  VU: "Vulnerable",
  NT: "Near threatened",
  LC: "Least concern",
  DD: "Data deficient",
  NE: "Not evaluated",
};

// ─── Plain-language helpers ───────────────────────────────────────────────────

function getSpeciesIcon(_name: string): string {
  return "";
}

function siteGearIcon(_name: string): string {
  return "";
}

function gearShopUrl(gearId?: string): string | null {
  if (!gearId) return null;
  const g = getGearById(gearId);
  if (!g) return null;
  const amazon = g.partners.find((p) => p.partner === "amazon") ?? g.partners[0];
  return amazon?.url ?? null;
}

function wetsuitForTemp(minTempC: number | null): { name: string; note: string; gearId?: string } {
  if (minTempC === null) return { name: "Wetsuit", note: "match to the water" };
  if (minTempC >= 28) return { name: "3mm shorty or dive skin", note: "warm water", gearId: "wetsuit-bare-3mm-full" };
  if (minTempC >= 24) return { name: "3mm full wetsuit", note: "warm water", gearId: "wetsuit-bare-3mm-full" };
  if (minTempC >= 19) return { name: "5mm full wetsuit", note: "cooler water" };
  return { name: "7mm wetsuit or drysuit", note: "cold water" };
}

function depthSuitability(min: number, max: number): string | null {
  if (max <= 18) return "Good for beginners";
  if (max <= 30) return "Open water and up";
  return "Advanced depths";
}

// Whole days since an ISO date. Isolated in a plain helper so the render
// body stays free of direct impure-clock reads (lint: react-hooks/purity).
function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

const CURRENT_VALUE: Record<string, string> = {
  none: "Usually still",
  mild: "Usually gentle",
  moderate: "Can be moderate",
  strong: "Often strong",
};

// ─── Encounter-odds derivation ────────────────────────────────────────────────

type Creature = {
  commonName: string;
  scientificName?: string;
  reliability?: "year-round" | "seasonal" | "rare";
  imageUrl?: string;
  lastConfirmedAt?: string | null;
  recentRecordCount?: number;
};

function creatureKey(scientific: string | undefined, common: string): string {
  return (scientific || common).trim().toLowerCase();
}

// Resolve a real species photo: per-site iNaturalist record first, then the
// global credit, then any curated imageUrl on the species. Normalises the iNat
// size token to a small crop — these render as 40px thumbnails, so a full
// large/medium image is wasted bytes. Null falls back to an emoji icon.
function resolveSpeciesPhoto(
  siteSlug: string,
  key: string,
  fallback: string | undefined,
): string | null {
  const url =
    getSpeciesPhotoCredit(`${siteSlug}:${key}`)?.imageUrl ??
    getSpeciesPhotoCredit(key)?.imageUrl ??
    fallback ??
    null;
  if (!url) return null;
  // iNat URLs carry a size token (square/small/medium/large); request a small crop.
  return url.replace(/\/(square|small|medium|large)\.(jpe?g|png)/i, "/small.$2");
}

type SightingRecord = ReturnType<typeof getSightingsBySiteId>[number];

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
      imageUrl: s.imageUrl,
    });
  }

  for (const ev of sightings) {
    const key = creatureKey(ev.speciesScientific, ev.speciesCommon);
    const existing = byKey.get(key);
    if (existing) {
      existing.lastConfirmedAt = ev.lastConfirmedAt;
      existing.recentRecordCount = ev.recentRecordCount;
    } else {
      order.push(key);
      byKey.set(key, {
        commonName: ev.speciesCommon,
        scientificName: ev.speciesScientific,
        lastConfirmedAt: ev.lastConfirmedAt,
        recentRecordCount: ev.recentRecordCount,
      });
    }
  }

  return order.map((k) => byKey.get(k)!);
}

// Composite likelihood score from the evidence we hold: how many recent
// records, how reliable the curated entry calls it, and whether there is a
// confirmed record on file. Deliberately ordinal — never a false precision.
function likelihoodScore(c: Creature): number {
  let score = 0;
  const n = c.recentRecordCount ?? 0;
  if (n >= 80) score += 60;
  else if (n >= 40) score += 48;
  else if (n >= 15) score += 34;
  else if (n >= 5) score += 22;
  else if (n >= 1) score += 12;

  if (c.reliability === "year-round") score += 35;
  else if (c.reliability === "seasonal") score += 18;
  else if (c.reliability === "rare") score += 4;

  if (c.lastConfirmedAt) score += 5;
  return Math.min(score, 98);
}

type ChanceTier = {
  label: string;
  color: string;
  fillColor: string;
  fill: number;
  frequency: string;
};

function chanceTier(score: number): ChanceTier {
  if (score >= 80) return { label: "Almost always", color: "#15824c", fillColor: "#15a05c", fill: 95, frequency: "Nearly every dive" };
  if (score >= 60) return { label: "Very likely", color: "#15824c", fillColor: "#15a05c", fill: 85, frequency: "Most dives" };
  if (score >= 42) return { label: "Likely", color: "#15824c", fillColor: "#10b981", fill: 60, frequency: "About 6 in 10 dives" };
  if (score >= 24) return { label: "Sometimes", color: "#b9751a", fillColor: "#e8962f", fill: 35, frequency: "About 1 in 3 dives" };
  return { label: "Rare", color: "#64748b", fillColor: "#94a3b8", fill: 15, frequency: "Now and then" };
}

// ─── Static generation + metadata ─────────────────────────────────────────────

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
      images: metadataImageUrl
        ? [{ url: metadataImageUrl, width: 2000, height: 1100 }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: metadataImageUrl ? [metadataImageUrl] : undefined,
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
  const _rawSiteHeroUrl = underwaterPhotoUrl(site.heroImageUrl);
  const heroPhotoUrl = _rawSiteHeroUrl
    ? `/_next/image?url=${encodeURIComponent(_rawSiteHeroUrl)}&w=1200&q=80`
    : null;
  const bestMonthsSet = new Set(site.bestMonths);

  // --- Hero chips: most-recent confirmed sighting + peak season --------------
  const latestSighting = sightings
    .filter((s) => s.lastConfirmedAt)
    .sort((a, b) => (b.lastConfirmedAt ?? "").localeCompare(a.lastConfirmedAt ?? ""))[0] ?? null;

  const confirmDays = daysSince(latestSighting?.lastConfirmedAt);
  const confirmRelative =
    confirmDays === null
      ? null
      : confirmDays <= 0
        ? "today"
        : confirmDays === 1
          ? "1 day ago"
          : confirmDays < 30
            ? `${confirmDays} days ago`
            : confirmDays < 365
              ? `${Math.floor(confirmDays / 30)} ${Math.floor(confirmDays / 30) === 1 ? "month" : "months"} ago`
              : `${Math.floor(confirmDays / 365)} ${Math.floor(confirmDays / 365) === 1 ? "year" : "years"} ago`;
  const confirmChip =
    latestSighting && confirmRelative ? `${latestSighting.speciesCommon} confirmed ${confirmRelative}` : null;

  // --- Conditions (this month, plain words) ----------------------------------
  const condMonth =
    site.conditionsByMonth.find((c) => c.month === currentMonth) ?? site.conditionsByMonth[0] ?? null;
  const minWaterTemp =
    site.conditionsByMonth.length > 0
      ? Math.min(...site.conditionsByMonth.flatMap((c) => [c.waterTempC.min, c.waterTempC.max]))
      : null;
  const maxWaterTemp =
    site.conditionsByMonth.length > 0
      ? Math.max(...site.conditionsByMonth.flatMap((c) => [c.waterTempC.min, c.waterTempC.max]))
      : null;

  const conditions: ConditionCard[] = [
    {
      icon: "",
      label: "Depth",
      value: `${site.depthRange.min} to ${site.depthRange.max} m`,
      sub: depthSuitability(site.depthRange.min, site.depthRange.max),
    },
    {
      icon: "",
      label: "Current",
      value: condMonth ? (CURRENT_VALUE[condMonth.currentStrength] ?? "Variable") : "Variable",
      sub: "Can pick up on the edge",
    },
    {
      icon: "",
      label: "Visibility",
      value: condMonth ? `${condMonth.visibilityM.min} to ${condMonth.visibilityM.max} m` : "Varies",
      sub: "Clearest in the calm season",
    },
    {
      icon: "",
      label: "Water",
      value:
        minWaterTemp !== null && maxWaterTemp !== null
          ? `${minWaterTemp} to ${maxWaterTemp}°C`
          : "Varies",
      sub: condMonth?.suitRecommendation ?? null,
    },
  ];

  // --- Encounter odds (per species, most-likely first) -----------------------
  const creatures = mergeCreatures(site, sightings);
  const encounters: EncounterRow[] = creatures
    .map((c) => {
      const score = likelihoodScore(c);
      const tier = chanceTier(score);
      const iucn = IUCN_ENABLED ? getIucnStatus(c.scientificName) : null;
      return { c, score, tier, iucn };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ c, tier, iucn }, i): EncounterRow => ({
      key: `${creatureKey(c.scientificName, c.commonName)}-${i}`,
      icon: getSpeciesIcon(c.commonName),
      imageUrl: resolveSpeciesPhoto(
        site.slug,
        creatureKey(c.scientificName, c.commonName),
        c.imageUrl,
      ),
      name: c.commonName,
      where: null,
      chanceLabel: tier.label,
      chanceColor: tier.color,
      fillPct: tier.fill,
      fillColor: tier.fillColor,
      frequency: tier.frequency,
      iucnLabel: iucn ? (IUCN_LABEL[iucn.category] ?? null) : null,
      iucnBadge: iucn ? (IUCN_BADGE[iucn.category] ?? null) : null,
    }));

  // --- Gear (two layers) -----------------------------------------------------
  const wetsuit = wetsuitForTemp(minWaterTemp);
  const basicItems: GearItem[] = [
    { icon: "", name: "Mask and fins", extra: null, shopUrl: gearShopUrl("mask-cressi-f1") },
    { icon: "", name: "BCD and regulator", extra: null, shopUrl: gearShopUrl("bcd-scubapro-hydros-pro") },
    { icon: "", name: wetsuit.name, extra: wetsuit.note, shopUrl: gearShopUrl(wetsuit.gearId) },
    { icon: "", name: "Dive computer", extra: null, shopUrl: gearShopUrl("computer-shearwater-peregrine") },
  ];

  const siteGearItems: GearItem[] = site.siteSpecificGear
    .filter((g) => g && g.name)
    .map((g) => ({
      icon: siteGearIcon(g.name),
      name: g.name,
      extra: g.reason,
      shopUrl: gearShopUrl(g.gearId),
    }));

  const gearGroups: GearGroup[] = [{ label: "Basic kit", items: basicItems }];
  if (siteGearItems.length > 0) {
    gearGroups.push({ label: "For this site", items: siteGearItems.slice(0, 4) });
  }

  // --- Plan your dive --------------------------------------------------------
  const tripFacts: TripFact[] = [
    { icon: "", label: "Certification", value: `${skillText(site.skillLevel)} and up` },
  ];

  const monthCells = MONTH_LETTERS.map((letter, i) => ({
    letter,
    on: bestMonthsSet.has(i + 1),
    now: i + 1 === currentMonth,
  }));

  const getThere: GetThereView = site.getThereStructured
    ? {
        kind: "structured",
        nearestHubName: site.getThereStructured.nearestHubName,
        nearestHubDescription: site.getThereStructured.nearestHubDescription,
        transferToSitesName: site.getThereStructured.transferToSitesName,
        transferToSitesDescription: site.getThereStructured.transferToSitesDescription,
        liveaboardDescription: site.getThereStructured.liveaboardDescription ?? null,
      }
    : site.getThere && site.getThere.trim().length > 0
      ? { kind: "prose", text: site.getThere }
      : null;

  const isGenericSearchUrl = (url: string) =>
    !url || url.includes("dive-shop-search") || url.includes("/dive-shop");
  const operators: OperatorItem[] = site.operators
    .filter((op) => op.isAffiliate || !isGenericSearchUrl(op.url))
    .slice(0, 6)
    .map((op) => ({
      partner: op.partner,
      label: op.label,
      url: op.url,
      productId: op.productId,
      isAffiliate: op.isAffiliate,
      detail: null,
    }));

  return (
    <>
      <JsonLd data={siteSchema(site, location)} />
      <SetNavBreadcrumb
        items={[
          ...(location ? [{ label: location.name, href: `/locations/${location.slug}` }] : []),
          { label: site.name },
        ]}
      />

      {/* ── HERO ── */}
      <section style={{ position: "relative", height: "54vh", minHeight: 420, overflow: "hidden" }}>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(155deg,#04243a 0%,#0a4a63 30%,#0a6b7a 55%,#0a8a7a 80%,#0a7060 100%)",
          }}
        />
        {heroPhotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroPhotoUrl}
            alt={`Underwater at ${site.name}`}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            loading="eager"
            decoding="sync"
            fetchPriority="high"
          />
        )}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom,rgba(4,18,32,0.12) 0%,rgba(4,18,32,0.04) 38%,rgba(4,18,32,0.4) 72%,rgba(4,18,32,0.78) 100%)",
          }}
        />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 3rem 2.5rem", maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            {confirmChip ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.35rem 0.85rem",
                  borderRadius: 999,
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  background: "rgba(16,185,129,0.22)",
                  border: "1px solid rgba(16,185,129,0.45)",
                  color: "#bbf7d0",
                  backdropFilter: "blur(8px)",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {confirmChip}
              </span>
            ) : null}
            {inSeason ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.35rem 0.85rem",
                  borderRadius: 999,
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  color: "rgba(255,255,255,0.9)",
                  backdropFilter: "blur(8px)",
                }}
              >
                Peak season now
              </span>
            ) : null}
          </div>
          <h1
            style={{
              fontSize: "clamp(2.5rem,5vw,4.25rem)",
              fontWeight: 800,
              letterSpacing: "-0.035em",
              lineHeight: 1.02,
              color: "#fff",
              textShadow: "0 2px 18px rgba(4,18,32,0.5)",
              margin: 0,
            }}
          >
            {site.name}
          </h1>
          <p style={{ fontSize: "0.9rem", fontWeight: 500, letterSpacing: "0.02em", color: "rgba(255,255,255,0.8)", marginTop: "0.6rem", textTransform: "uppercase" }}>
            {location ? location.name : "Dive site"}
            {location?.country ? ` · ${location.country}` : ""}
          </p>
        </div>
      </section>

      {/* ── BODY (client) ── */}
      <SitePageBody
        siteId={site.id}
        siteSlug={site.slug}
        intro={site.description || null}
        conditions={conditions}
        encounters={encounters}
        speciesIndexHref={`/sites/${site.slug}/species`}
        gearGroups={gearGroups}
        tripTitle={`Dive ${site.name}`}
        tripFacts={tripFacts}
        monthCells={monthCells}
        getThere={getThere}
        operators={operators}
      />
    </>
  );
}
