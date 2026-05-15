import Link from "next/link";
import type { Location, Site } from "@/lib/data/types";

export function SiteCard({
  site,
  location,
  inSeason,
}: {
  site: Site;
  location?: Location | null;
  inSeason: boolean;
}) {
  return (
    <Link
      href={`/sites/${site.slug}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-[#0089de]/40 hover:shadow-md"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={
          site.heroImageUrl ??
          `https://picsum.photos/seed/${site.slug}/800/440`
        }
        alt={site.name}
        className="h-44 w-full object-cover transition group-hover:scale-[1.02]"
      />
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {location?.country ?? "—"}
          </p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              inSeason
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {inSeason ? "● In season" : "○ Off season"}
          </span>
        </div>
        <h3 className="mt-1 text-lg font-bold text-slate-900 group-hover:text-[#0089de]">
          {site.name}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
          {site.description}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
            {site.depthRange.min}–{site.depthRange.max} m
          </span>
          <span className="inline-block rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[11px] font-semibold capitalize text-[#1d5d90]">
            {site.skillLevel.replace("-", " ")}+
          </span>
          {site.diveTypes.slice(0, 1).map((t) => (
            <span
              key={t}
              className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-700"
            >
              {t.replace("-", " ")}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
