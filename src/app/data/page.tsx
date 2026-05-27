import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import sourcesData from "@/data/sources.json";
import methodologiesData from "@/data/methodologies.json";

export const metadata: Metadata = {
  title: "Reef data — what's live, what's a snapshot, what we can't see",
  description:
    "Plain English data freshness for scubaSeason.fun. NOAA Coral Reef Watch is live nightly; coral cover is a snapshot from named monitoring programs; some things we can't honestly show today.",
};

type Source = {
  id: string;
  name: string;
  url?: string;
  publisher?: string;
  sourceType?: string;
  license?: string;
  notes?: string;
};

type Methodology = {
  claimId: string;
  claimType: string;
  sourceIds: string[];
  confidence?: string;
  limitations?: string;
  lastReviewedAt?: string;
};

const sources = sourcesData as Source[];
const methodologies = methodologiesData as Methodology[];

const REGION_BASELINES: Array<{
  region: string;
  baseline: string;
  note: string;
}> = [
  {
    region: "Great Barrier Reef (Australia)",
    baseline: "1986",
    note: "AIMS Long Term Monitoring Program — the longest continuous reef survey record on Earth, going back to 1986. Annual cover updates per sector.",
  },
  {
    region: "Florida Keys & Caribbean US",
    baseline: "1995",
    note: "NOAA NCRMP + earlier Florida Reef Tract programs. Coverage solid since the mid 1990s; AGRRA fills wider Caribbean from ~1998.",
  },
  {
    region: "US Pacific (Hawaiʻi, Marianas, American Samoa)",
    baseline: "2012",
    note: "NCRMP Pacific cycle began in 2012. Earlier site level data exists but isn't standardized into a continuous time series.",
  },
  {
    region: "Indo Pacific (most sites)",
    baseline: "2014",
    note: "Most Indo Pacific reefs outside named jurisdictions only have a baseline from the start of the Third Global Coral Bleaching Event (2014–2017), when international monitoring effort spiked. For many sites that's the first quantitative measurement on record.",
  },
  {
    region: "Western Indian Ocean & many remote reefs",
    baseline: "Single survey",
    note: "Some sites have one survey ever. Treat the displayed cover as a single observation, not a trend.",
  },
];

export default function DataPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader activeHref="/data" />

      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0089de]">
          Reef data
        </p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
          What&rsquo;s live, what&rsquo;s a snapshot, what we can&rsquo;t see
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-700">
          scubaSeason mixes daily satellite data with much older in water
          survey snapshots. The labels next to every reef number on the site
          tell you which is which. This page lays out the whole picture.
        </p>

        <section id="live" className="mt-12 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            What&rsquo;s live every day
          </h2>
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
              NOAA Coral Reef Watch · 5&nbsp;km · v3.1
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[14px] leading-6 text-slate-800">
              <li>
                Bleaching Alert Area (no stress / watch / warning / alert 1
                / alert 2).
              </li>
              <li>Degree Heating Weeks (°C weeks of accumulated heat).</li>
              <li>SST anomaly vs. climatology (°C).</li>
            </ul>
            <p className="mt-3 text-[13px] leading-6 text-slate-700">
              Pulled nightly from NOAA&rsquo;s public ERDDAP endpoint
              against the lat/lng of every reef location on the site. Public
              domain, no API key.{" "}
              <a
                href="https://coralreefwatch.noaa.gov/"
                className="text-[#0089de] hover:underline"
                rel="noopener noreferrer"
                target="_blank"
              >
                NOAA Coral Reef Watch →
              </a>
            </p>
          </div>
        </section>

        <section id="snapshot" className="mt-12 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            What&rsquo;s a snapshot
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-700">
            Coral cover, bleaching %, fishing pressure, and historical
            baselines come from periodic data products — not continuous
            feeds. The freshness varies by region — and that variance is
            itself a fact worth knowing before you read the number.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-900">
                NCRMP + AGRRA · coral cover
              </p>
              <p className="mt-2 text-[13px] leading-6 text-slate-800">
                Jurisdiction-mean coral cover from NOAA&rsquo;s National
                Coral Reef Monitoring Program (US Atlantic + Pacific) and
                AGRRA (wider Caribbean). Reported at the jurisdiction
                scale, not the single dive site. Refreshed when a new
                biennial report is published.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-900">
                Global Fishing Watch · visible fishing
              </p>
              <p className="mt-2 text-[13px] leading-6 text-slate-800">
                Apparent fishing-effort hours within 50&nbsp;km of a dive
                location, AIS-derived. Small artisanal boats and any
                vessel running dark are not visible to GFW — a low number
                is not evidence of low pressure in artisanal-dominated
                regions.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-900">
                IUCN Red List · species threat category
              </p>
              <p className="mt-2 text-[13px] leading-6 text-slate-800">
                Each species page shows the current IUCN category
                (Critically Endangered, Endangered, Vulnerable, etc.) with
                population trend and last-assessed year. The category is a{" "}
                <strong>global</strong> extinction-risk classification —
                local abundance at a dive site can be very different.
              </p>
            </div>
          </div>
          <p className="mt-5 text-base leading-7 text-slate-700">
            And alongside the published programs above, per-site coral
            cover snapshots from AIMS LTMP / Reef Life Survey / GBRMPA Eye
            on the Reef remain the historical baseline for our older
            reef-health records. Their freshness varies by region:
          </p>
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-[13.5px]">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                <tr>
                  <th className="px-4 py-2.5">Region</th>
                  <th className="px-4 py-2.5">Earliest reliable baseline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {REGION_BASELINES.map((row) => (
                  <tr key={row.region} className="align-top">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {row.region}
                      <p className="mt-1 text-[12px] font-normal leading-5 text-slate-600">
                        {row.note}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-800">
                      {row.baseline}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-6 text-amber-900">
            <strong>Why 2014?</strong> It&rsquo;s when the Third Global
            Coral Bleaching Event (2014–2017) pulled international
            monitoring attention to reefs that had never been systematically
            surveyed before. For a lot of Indo Pacific sites, that&rsquo;s
            literally the first numeric observation on file. Older
            &ldquo;before&rdquo; values for those reefs don&rsquo;t exist —
            not because nothing happened before 2014, but because nobody was
            measuring.
          </p>
        </section>

        <section id="missing" className="mt-12 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            What we can&rsquo;t see today
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-700">
            Things people ask about that we deliberately don&rsquo;t claim,
            because the data isn&rsquo;t there yet or isn&rsquo;t resolved
            at site scale:
          </p>
          <ul className="mt-4 ml-5 list-disc space-y-2 text-[14px] leading-6 text-slate-700">
            <li>
              <strong>Artisanal fishing pressure</strong> in regions where
              small boats don&rsquo;t broadcast AIS. GFW only sees vessels
              on AIS, so the visible-fishing number can be near zero in
              places that are actually heavily fished.
            </li>
            <li>
              <strong>Site-level coral cover outside named jurisdictions</strong>{" "}
              — NCRMP covers US territories, AGRRA covers the Caribbean,
              AIMS covers the GBR. The Indo-Pacific outside Australia, and
              most of the Western Indian Ocean, has no equivalent
              published mean.
            </li>
            <li>
              <strong>Local population status</strong> for a species at a
              specific reef — IUCN categories are global. A Critically
              Endangered species can still be locally abundant where
              there&rsquo;s protection (and vice versa).
            </li>
            <li>
              <strong>Water clarity / turbidity</strong> at site resolution
              — global satellite products exist but don&rsquo;t resolve a
              single reef.
            </li>
            <li>
              <strong>Ocean acidification</strong> at the dive site scale —
              we have basin wide pH trends, not site by site values.
            </li>
            <li>
              <strong>Fish populations</strong> and biomass trends —
              sightings without effort denominators (how many divers, how
              many hours) can&rsquo;t support trend claims, so we
              don&rsquo;t make them.
            </li>
            <li>
              <strong>Disease prevalence</strong> (e.g. Stony Coral Tissue
              Loss Disease outside well monitored jurisdictions).
            </li>
            <li>
              <strong>Crown of thorns starfish</strong> outbreaks outside the
              GBR — AIMS publishes COTS for Australia; elsewhere it&rsquo;s
              anecdotal.
            </li>
          </ul>
        </section>

        <section id="sources" className="mt-12 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Sources
          </h2>
          <p className="mt-3 text-[14px] leading-6 text-slate-600">
            Every quantitative claim on the site links back to one of
            these. Full list from{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[12px]">
              src/data/sources.json
            </code>
            .
          </p>
          <ul className="mt-4 divide-y divide-slate-200 rounded-2xl border border-slate-200">
            {sources.map((s) => (
              <li key={s.id} className="px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[14px] font-semibold text-[#0089de] hover:underline"
                    >
                      {s.name}
                    </a>
                  ) : (
                    <span className="text-[14px] font-semibold text-slate-900">
                      {s.name}
                    </span>
                  )}
                  {s.publisher ? (
                    <span className="text-[12px] text-slate-500">
                      {s.publisher}
                    </span>
                  ) : null}
                  {s.license ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-600">
                      {s.license}
                    </span>
                  ) : null}
                </div>
                {s.notes ? (
                  <p className="mt-1 text-[12.5px] leading-5 text-slate-600">
                    {s.notes}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section id="methodology" className="mt-12 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Methodology
          </h2>
          <p className="mt-3 text-[14px] leading-6 text-slate-600">
            How each claim is constructed and the limitations we&rsquo;ll
            own up to. Full list from{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[12px]">
              src/data/methodologies.json
            </code>
            .
          </p>
          <ul className="mt-4 space-y-4">
            {methodologies.map((m) => (
              <li
                key={m.claimId}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-[14px] font-semibold text-slate-900">
                    {m.claimId}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider text-slate-600">
                    {m.claimType}
                  </span>
                  {m.confidence ? (
                    <span className="text-[11px] text-slate-500">
                      confidence: {m.confidence}
                    </span>
                  ) : null}
                </div>
                {m.limitations ? (
                  <p className="mt-2 text-[13px] leading-5 text-slate-700">
                    {m.limitations}
                  </p>
                ) : null}
                {m.sourceIds?.length ? (
                  <p className="mt-2 text-[11.5px] leading-5 text-slate-500">
                    Sources: {m.sourceIds.join(", ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-12 text-sm text-slate-500">
          Questions about a specific claim?{" "}
          <Link href="/faq" className="text-[#0089de] hover:underline">
            FAQ
          </Link>{" "}
          /{" "}
          <a
            href="mailto:hi@scubaseason.fun"
            className="text-[#0089de] hover:underline"
          >
            hi@scubaseason.fun
          </a>
          .
        </p>
      </main>
    </div>
  );
}
