import type { Metadata } from "next";
import { Suspense } from "react";
import { AtlasExplorer } from "@/components/atlas-explorer";
import type { FilterLocation } from "@/components/atlas-filter-rail";
import { getAllAtlasLocations } from "@/lib/atlas-location";
import { getAllLocations } from "@/lib/data/locations";
import sourcesData from "@/data/sources.json";

export const metadata: Metadata = {
  title: "scubaSeason.fun — a data atlas for the living ocean",
  description:
    "Browse every tracked reef by coral health, thermal stress and survey freshness. Built on ongoing science and daily monitoring, not a one-time write-up.",
};

// Decorative 14-bar sparkline representing global thermal stress trend (last 14 days).
// Heights as percentages — static visual; real time-series data is not stored per-day.
const SPARKLINE_H = [30, 24, 38, 32, 42, 48, 36, 44, 56, 50, 62, 66, 58, 72];

export default function Home() {
  const allLocs = getAllAtlasLocations();
  // Raw locations carry lat/lng and countryCode, which the atlas type does not expose.
  const rawBySlug = new Map(getAllLocations().map((l) => [l.slug, l]));

  // Current month (1-12). Date.now() in a Server Component is evaluated at request time.
  const currentMonth = new Date().getUTCMonth() + 1;
  const inSeason = (months: number[]) => months.includes(currentMonth);

  // Filter rail / explorer data — carry every facet plus the geo the globe needs.
  const filterLocs: FilterLocation[] = allLocs.flatMap((l) => {
    const raw = rawBySlug.get(l.slug);
    if (!raw) return [];
    const loc: FilterLocation = {
      slug: l.slug,
      name: l.name,
      country: l.country,
      hook: l.hook,
      state: l.state,
      cover: l.cover,
      coverYear: l.coverYear,
      season: l.season,
      skill: l.skill,
      heroImageUrl: l.heroImageUrl,
      inSeason: inSeason(l.bestMonths),
      region: l.region,
      bestMonths: l.bestMonths,
      heatLevel: l.heatLevel,
      lastSurveyDays: l.lastSurveyDays,
      lat: raw.lat,
      lng: raw.lng,
      countryCode: raw.countryCode,
      animalTags: l.animalTags ?? [],
    };
    return [loc];
  });

  const regions = Array.from(new Set(allLocs.map((l) => l.region))).sort();
  const skills = ["Beginner", "Open water", "Advanced", "Technical"];

  const reefCount = allLocs.length;
  const sourceCount = (sourcesData as unknown[]).length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* HERO — headline + stats left, live panel right */}
      <section className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        {/* Left column */}
        <div className="lg:flex-1">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            A data atlas for the living ocean.
          </h1>
          <p className="mt-4 text-lg leading-7 text-slate-600">
            Built on ongoing science and daily monitoring, not a one-time write-up.
          </p>

          {/* Stat row */}
          <div className="mt-6 flex items-stretch divide-x divide-slate-200">
            {[
              { value: String(reefCount), label: "REEFS TRACKED" },
              { value: "Nightly", label: "NOAA THERMAL SYNC" },
              { value: String(sourceCount), label: "DATA SOURCES" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-0.5 px-5 first:pl-0">
                <span className="text-xl font-extrabold leading-none text-[#0e2742]">
                  {value}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#718498]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — live status panel */}
        <div className="rounded-2xl border border-[#cde9d6] bg-[#eef8f1] p-[18px] lg:w-[340px] lg:shrink-0">
          <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#1f8a56]">
            <span className="live-dot h-2 w-2 rounded-full bg-[#15a05c]" aria-hidden />
            Live · NOAA Coral Reef Watch
          </p>
          <p className="mt-2 text-base font-extrabold leading-snug text-[#0e2742]">
            Thermal stress, refreshed nightly
          </p>
          <p className="mt-1.5 text-[13px] leading-5 text-[#3d5168]">
            Pulled from NOAA&apos;s 5 km satellite feed against every reef on the atlas.
          </p>

          {/* Sparkline */}
          <div className="my-3 flex h-10 items-end gap-[2px]" aria-hidden>
            {SPARKLINE_H.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-[2px]"
                style={{
                  height: `${h}%`,
                  background: "linear-gradient(180deg,#3fb574,#1c7a4a)",
                }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#718498]">
            <span>14 days ago</span>
            <span>Updated nightly</span>
          </div>
        </div>
      </section>

      {/* THE EXPLORER — centerpiece */}
      <Suspense fallback={null}>
        <AtlasExplorer locations={filterLocs} regions={regions} skills={skills} />
      </Suspense>
    </main>
  );
}
