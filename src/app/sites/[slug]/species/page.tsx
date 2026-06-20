import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllSites, getSiteBySlug } from "@/lib/data/sites";
import { getLocationById } from "@/lib/data/locations";
import { getSightingsBySiteId } from "@/lib/data/sightings";
import { getIucnStatus, IUCN_ENABLED } from "@/lib/data/iucn-status";
import { getSpeciesPhotoCredit } from "@/lib/data/species-photos";
import {
  classifySpecies,
  SPECIES_GROUP_ICON,
  SPECIES_GROUP_LABELS,
  SPECIES_GROUP_ORDER,
  type SpeciesGroup,
} from "@/lib/data/species-taxonomy";
import {
  SpeciesListClient,
  type SpeciesRow,
} from "@/components/species-list-client";
import type { IucnStatus, Site } from "@/lib/data/types";

type SightingRecord = ReturnType<typeof getSightingsBySiteId>[number];

function speciesSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function speciesKey(scientific: string | undefined, common: string): string {
  return (scientific || common).trim().toLowerCase();
}

// IUCN label tones — light design system (plain English labels, no codes in UI)
const IUCN_TONE: Record<IucnStatus["category"], { bg: string; text: string }> = {
  EX: { bg: "rgba(74,85,104,0.10)", text: "var(--color-ink-2)" },
  EW: { bg: "rgba(74,85,104,0.10)", text: "var(--color-ink-2)" },
  CR: { bg: "rgba(192,65,43,0.12)", text: "var(--color-declining)" },
  EN: { bg: "rgba(192,65,43,0.10)", text: "var(--color-declining)" },
  VU: { bg: "rgba(185,138,46,0.12)", text: "var(--color-stable)" },
  NT: { bg: "rgba(46,125,91,0.10)", text: "var(--color-improving)" },
  LC: { bg: "rgba(46,125,91,0.12)", text: "var(--color-improving)" },
  DD: { bg: "rgba(74,85,104,0.08)", text: "var(--color-ink-2)" },
  NE: { bg: "rgba(74,85,104,0.08)", text: "var(--color-ink-2)" },
};

/**
 * Likelihood model derived from real data only.
 *
 * We deliberately carry no stored probability (see SightingEvidence docs), so
 * the chance label, bar and frequency are computed from the curated
 * `reliability` band, refined by how many recent records a site has logged for
 * the animal. When neither signal exists, the bar and frequency are omitted and
 * the row degrades to "Recorded here".
 *
 * Returned `score` drives the most-likely-first sort.
 */
type Likelihood = {
  score: number;
  barPct: number | null;
  chanceLabel: string | null;
  chanceColor: string;
  frequency: string | null;
};

function deriveLikelihood(
  reliability: Site["species"][number]["reliability"] | undefined,
  recentRecordCount: number | undefined,
): Likelihood {
  const records = recentRecordCount ?? 0;

  // Base band from curated reliability.
  let base: number | null;
  if (reliability === "year-round") base = 85;
  else if (reliability === "seasonal") base = 50;
  else if (reliability === "rare") base = 20;
  else base = null;

  // Refine within band by record volume (gentle, capped nudges).
  let pct: number | null = base;
  if (pct !== null && records > 0) {
    pct = Math.min(96, pct + Math.min(12, records));
  } else if (pct === null && records > 0) {
    // No curated band but we do have records — derive a modest signal so the
    // row still sorts and shows a bar rather than going fully unknown.
    pct = Math.min(80, 30 + Math.min(40, records * 4));
  }

  if (pct === null) {
    // No signal at all. Keep the row, but show no bar/frequency.
    return {
      score: 0,
      barPct: null,
      chanceLabel: null,
      chanceColor: "var(--color-ink-2)",
      frequency: null,
    };
  }

  let chanceLabel: string;
  let chanceColor: string;
  let frequency: string;
  if (pct >= 80) {
    chanceLabel = "Almost always";
    chanceColor = "var(--color-improving)";
    frequency = "Nearly every dive";
  } else if (pct >= 65) {
    chanceLabel = "Very likely";
    chanceColor = "var(--color-improving)";
    frequency = "Most dives";
  } else if (pct >= 45) {
    chanceLabel = "Likely";
    chanceColor = "var(--color-improving)";
    frequency = "About half of dives";
  } else if (pct >= 25) {
    chanceLabel = "Sometimes";
    chanceColor = "var(--color-stable)";
    frequency = "About 1 in 3 dives";
  } else {
    chanceLabel = "Now and then";
    chanceColor = "var(--color-ink-2)";
    frequency = "Only now and then";
  }

  return { score: pct, barPct: pct, chanceLabel, chanceColor, frequency };
}

/** Merge curated species + sighting evidence into one row per animal. */
type Merged = {
  commonName: string;
  scientificName?: string;
  reliability?: Site["species"][number]["reliability"];
  recentRecordCount?: number;
  imageUrl?: string;
  notes?: string;
};

function mergeSpecies(site: Site, sightings: SightingRecord[]): Merged[] {
  const byKey = new Map<string, Merged>();
  const order: string[] = [];

  for (const s of (site.species ?? [])) {
    const key = speciesKey(s.scientificName, s.commonName);
    if (!byKey.has(key)) order.push(key);
    byKey.set(key, {
      commonName: s.commonName,
      scientificName: s.scientificName,
      reliability: s.reliability,
      imageUrl: s.imageUrl,
    });
  }

  for (const ev of sightings) {
    const key = speciesKey(ev.speciesScientific, ev.speciesCommon);
    const existing = byKey.get(key);
    if (existing) {
      existing.recentRecordCount = ev.recentRecordCount;
      if (ev.notes && !existing.notes) existing.notes = ev.notes;
    } else {
      order.push(key);
      byKey.set(key, {
        commonName: ev.speciesCommon,
        scientificName: ev.speciesScientific,
        recentRecordCount: ev.recentRecordCount,
        notes: ev.notes,
      });
    }
  }

  return order.map((k) => byKey.get(k)!);
}

/** Per-site photo first, then global fallback (mirrors the site page). */
function resolvePhoto(
  siteSlug: string,
  scientific: string | undefined,
  common: string,
  curatedUrl: string | undefined,
): string | undefined {
  if (curatedUrl) return curatedUrl;
  const key = speciesKey(scientific, common);
  const perSite = getSpeciesPhotoCredit(`${siteSlug}:${key}`);
  if (perSite?.imageUrl) return perSite.imageUrl;
  const global = getSpeciesPhotoCredit(key);
  return global?.imageUrl;
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
  if (!site) return { title: "Species not found" };
  const location = getLocationById(site.locationId);
  const title = `Marine life at ${site.name} — every recorded species`;
  return {
    title,
    description: `The full list of marine life divers have recorded at ${site.name}${
      location ? `, ${location.name}` : ""
    }, most likely first.`,
    alternates: { canonical: `/sites/${site.slug}/species` },
  };
}

export default async function SiteAllSpeciesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = getSiteBySlug(slug);
  if (!site) notFound();

  const location = getLocationById(site.locationId);
  const sightings = getSightingsBySiteId(site.id);
  const merged = mergeSpecies(site, sightings);

  // Build fully resolved rows on the server, then sort most-likely-first.
  const rows: SpeciesRow[] = merged
    .map((m) => {
      const group: SpeciesGroup = classifySpecies(m.commonName, m.scientificName);
      const iucn = IUCN_ENABLED ? getIucnStatus(m.scientificName) : null;
      const tone = iucn ? IUCN_TONE[iucn.category] : null;
      const likelihood = deriveLikelihood(m.reliability, m.recentRecordCount);
      const imageUrl = resolvePhoto(
        site.slug,
        m.scientificName,
        m.commonName,
        m.imageUrl,
      );
      return {
        row: {
          key: speciesKey(m.scientificName, m.commonName),
          href: `/sites/${site.slug}/species/${speciesSlug(m.commonName)}`,
          commonName: m.commonName,
          scientificName: m.scientificName,
          group,
          icon: SPECIES_GROUP_ICON[group],
          imageUrl,
          iucnLabel: iucn ? iucn.categoryLabel : null,
          iucnBg: tone ? tone.bg : null,
          iucnText: tone ? tone.text : null,
          chanceLabel: likelihood.chanceLabel,
          chanceColor: likelihood.chanceColor,
          barPct: likelihood.barPct,
          frequency: likelihood.frequency,
          where: m.notes ?? null,
        } satisfies SpeciesRow,
        score: likelihood.score,
        name: m.commonName,
      };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map((x) => x.row);

  // Pills: "All" plus every group present in the data, in canonical order.
  const present = new Set(rows.map((r) => r.group));
  const pills: { id: SpeciesGroup | "all"; label: string }[] = [
    { id: "all", label: "All" },
    ...SPECIES_GROUP_ORDER.filter((g) => present.has(g)).map((g) => ({
      id: g,
      label: SPECIES_GROUP_LABELS[g],
    })),
  ];

  return (
    <div
      style={{
        maxWidth: 920,
        margin: "0 auto",
        padding: "3rem 1.5rem 5rem",
        background: "var(--color-paper)",
      }}
    >
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.8125rem",
          color: "var(--color-ink-2)",
          flexWrap: "wrap",
          marginBottom: "2rem",
        }}
      >
        {location ? (
          <>
            <Link
              href={`/locations/${location.slug}`}
              style={{ color: "var(--color-ink-2)", textDecoration: "none" }}
            >
              {location.name}
            </Link>
            <span style={{ color: "var(--color-hairline)" }}>/</span>
          </>
        ) : null}
        <Link
          href={`/sites/${site.slug}`}
          style={{ color: "var(--color-ink-2)", textDecoration: "none" }}
        >
          {site.name}
        </Link>
        <span style={{ color: "var(--color-hairline)" }}>/</span>
        <span style={{ color: "var(--color-ink)", fontWeight: 600 }}>All species</span>
      </nav>

      {/* Eyebrow */}
      <p
        style={{
          fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
          fontSize: "0.6875rem",
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--color-ink-2)",
          marginBottom: "0.6rem",
        }}
      >
        {site.name}
        {location ? ` · ${location.name}` : ""}
      </p>

      <SpeciesListClient rows={rows} pills={pills} siteName={site.name} />

      {/* What the labels mean → Method */}
      <p style={{ marginTop: "1.5rem", fontSize: "0.8125rem", color: "var(--color-ink-2)" }}>
        <Link
          href="/data#sources"
          style={{ color: "var(--color-ocean)", fontWeight: 600, textDecoration: "none" }}
        >
          What the labels mean
        </Link>
      </p>
    </div>
  );
}
