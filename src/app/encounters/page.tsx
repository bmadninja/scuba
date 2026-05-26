import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import type { Metadata } from "next";
import { getBucketListEncounters } from "@/lib/data/encounters";

export const metadata: Metadata = {
  title: "Bucket-list encounters | scubaSeason.fun",
  description:
    "Sardine run, hammerhead schools, whale shark aggregations, manta cleaning, blackwater, coral spawning, and more — with sources, ethics, and the truth about when you can actually see them.",
};

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DIFFICULTY_RING: Record<string, string> = {
  beginner: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  intermediate: "bg-amber-50 text-amber-800 ring-amber-200",
  advanced: "bg-orange-50 text-orange-800 ring-orange-200",
  expert: "bg-rose-50 text-rose-800 ring-rose-200",
};

export default function EncountersIndexPage() {
  const encounters = getBucketListEncounters();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader activeHref="/encounters" />

      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0089de]">
            Bucket list
          </p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
            Encounters worth a flight
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
            Big seasonal moments — sardine run, hammerhead schools, whale
            sharks, coral spawning. Each page tells you when it actually
            happens, what skill it needs, and how confident the evidence is.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {encounters.map((e) => (
            <Link
              key={e.id}
              href={`/encounters/${e.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-[#0089de]/40 hover:shadow-md"
            >
              {e.heroImageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={e.heroImageUrl}
                  alt={e.name}
                  className="h-44 w-full object-cover transition group-hover:scale-[1.02]"
                />
              ) : (
                <div className="h-44 w-full bg-gradient-to-br from-[#cfe6f7] to-[#0089de]" />
              )}
              <div className="flex flex-1 flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {e.category.replace(/-/g, " ")}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${DIFFICULTY_RING[e.difficulty]}`}
                >
                  {e.difficulty}
                </span>
              </div>
              <h2 className="mt-1 text-xl font-bold text-slate-900 group-hover:text-[#0089de]">
                {e.name}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                {e.shortDescription}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {e.bestMonths.length === 12 ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                    Year-round
                  </span>
                ) : (
                  e.bestMonths.map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700"
                    >
                      {MONTH_ABBR[m - 1]}
                    </span>
                  ))
                )}
              </div>
              <p className="mt-auto pt-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Confidence: {e.confidence}
              </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
