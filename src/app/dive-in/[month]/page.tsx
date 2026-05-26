import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { JsonLd } from "@/components/json-ld";
import { monthLandingSchema } from "@/lib/schema-org";
import { getAllLocations } from "@/lib/data/locations";
import { getAllSites } from "@/lib/data/sites";
import { getAllEncounters } from "@/lib/data/encounters";

const MONTHS = [
  "january","february","march","april","may","june",
  "july","august","september","october","november","december",
];
const MONTH_LABELS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const CERT_OPTIONS: { value: string; label: string }[] = [
  { value: "never-dived", label: "Try dive" },
  { value: "open-water", label: "Open Water" },
  { value: "advanced", label: "Advanced" },
  { value: "rescue", label: "Rescue" },
  { value: "divemaster", label: "Divemaster" },
  { value: "tech", label: "Tech" },
];

export function generateStaticParams() {
  return MONTHS.map((month) => ({ month }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ month: string }>;
}): Promise<Metadata> {
  const { month } = await params;
  const idx = MONTHS.indexOf(month.toLowerCase());
  if (idx === -1) return { title: "Month not found" };
  const label = MONTH_LABELS[idx];
  const title = `Where to dive in ${label} 2026 | scubaSeason.fun`;
  const description = `Best scuba destinations, encounters and dive sites in season for ${label} 2026 — ranked by documented seasonality, not marketing copy.`;
  return {
    title,
    description,
    alternates: { canonical: `/dive-in/${month.toLowerCase()}` },
    openGraph: { title, description },
  };
}

export default async function MonthLandingPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  const idx = MONTHS.indexOf(month.toLowerCase());
  if (idx === -1) notFound();
  const m = idx + 1;
  const label = MONTH_LABELS[idx];

  const locations = getAllLocations()
    .filter((l) => l.bestMonths.includes(m))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  const encounters = getAllEncounters().filter((e) => e.bestMonths.includes(m));

  const sites = getAllSites()
    .filter((s) => s.bestMonths.includes(m))
    .slice()
    .sort((a, b) => b.editorialRank - a.editorialRank)
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <JsonLd
        data={monthLandingSchema({
          month: m,
          monthName: label,
          locations: locations.map((l) => ({ name: l.name, slug: l.slug })),
        })}
      />
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        <Link
          href="/sites"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 hover:text-[#0089de]"
        >
          ← All dive sites
        </Link>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
          Where to dive in {label} 2026
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
          In season this month: {locations.length} curated locations,{" "}
          {encounters.length} bucket-list encounters and the top dive sites
          where {label}&rsquo;s conditions and wildlife align. Rankings come
          from documented seasonality and operator continuity — not marketing
          calendars.
        </p>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
              In-season locations
            </h2>
            {locations.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No locations peak in {label}. Try a neighbouring month.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {locations.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/locations/${l.slug}`}
                      className="block rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-[#0089de]"
                    >
                      <p className="font-semibold text-slate-900">{l.name}</p>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">
                        {l.country}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
              In-season encounters
            </h2>
            {encounters.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No bucket-list encounters peak in {label}.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {encounters.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/where-to-see/${e.slug}`}
                      className="block rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-[#0089de]"
                    >
                      <p className="font-semibold text-slate-900">{e.name}</p>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">
                        {e.difficulty}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
              In-season sites
            </h2>
            {sites.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No top-ranked sites peak in {label}.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {sites.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/sites/${s.slug}`}
                      className="block rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-[#0089de]"
                    >
                      <p className="font-semibold text-slate-900">{s.name}</p>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">
                        {s.skillLevel.replace("-", " ")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="mt-10 border-t border-slate-200 pt-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
            Filter by certification
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {CERT_OPTIONS.map((c) => (
              <Link
                key={c.value}
                href={`/sites?month=${m}&cert=${c.value}`}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-[#0089de] hover:text-[#0089de]"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 border-t border-slate-200 pt-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
            Thermal stress this month
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
            Some reefs are currently under NOAA Coral Reef Watch bleaching
            alert. If you&rsquo;re flexible, skip stressed reefs and steer
            toward locations whose latest survey looks better.{" "}
            <Link
              href={`/sites?month=${m}`}
              className="font-semibold text-[#0089de] hover:underline"
            >
              See in-season sites with current reef condition →
            </Link>
          </p>
        </section>

        <section className="mt-10 border-t border-slate-200 pt-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
            Methodology
          </h2>
          <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            <summary className="cursor-pointer font-semibold text-slate-900">
              How we picked &ldquo;in season&rdquo;
            </summary>
            <p className="mt-3">
              A location, encounter or site is &ldquo;in season&rdquo; for{" "}
              {label} when its curated{" "}
              <code className="rounded bg-white px-1 text-[12px] ring-1 ring-inset ring-slate-200">
                bestMonths
              </code>{" "}
              array includes month {m}. Best-months come from operator
              calendars, climatological reanalysis, and (where applicable) the{" "}
              <code className="rounded bg-white px-1 text-[12px] ring-1 ring-inset ring-slate-200">
                sighting-occurrence-cluster
              </code>{" "}
              methodology for species. Reef condition framing follows{" "}
              <code className="rounded bg-white px-1 text-[12px] ring-1 ring-inset ring-slate-200">
                reef-health-aims-noaa
              </code>
              .
            </p>
          </details>
        </section>
      </main>
    </div>
  );
}
