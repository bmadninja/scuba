import Link from "next/link";
import { STATE_TEXT, freshness } from "@/lib/data/reef-state";
import type { ReefState } from "@/lib/data/reef-state";
import { underwaterPhotoUrl } from "@/lib/photo-quality";

export type ReefLocationCardData = {
  slug: string;
  name: string;
  country: string;
  hook: string;
  state: ReefState;
  cover: string | null;
  coverYear?: number | null;
  season: string;
  skill: string;
  heroImageUrl?: string;
  inSeason?: boolean;
  lastSurveyDays?: number | null;
};

const STATE_BADGE: Record<ReefState, string> = {
  thriving: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  pressure: "bg-[#eaf1fe] text-[#1f57c8] ring-1 ring-inset ring-[#2f6ced]/20",
  change: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
};

const FRESHNESS_DOT: Record<string, string> = {
  fresh: "#15a05c",
  stale: "#e8962f",
  cold: "#e23a3a",
};

const SKILL_BADGE: Record<string, string> = {
  "Beginner":   "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  "Open water": "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  "Advanced":   "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  "Technical":  "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
};

export function ReefLocationCard({ r }: { r: ReefLocationCardData }) {
  const surveyFreshness = r.lastSurveyDays != null ? freshness(r.lastSurveyDays) : null;
  const surveyYear =
    r.lastSurveyDays != null
      ? new Date().getFullYear() - Math.floor(r.lastSurveyDays / 365)
      : null;

  return (
    <Link
      href={`/locations/${r.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-[3px] hover:border-[#0089de]/40 hover:shadow-[0_1px_2px_rgba(16,40,70,.03),0_14px_30px_-20px_rgba(16,40,70,.18)]"
      style={{ boxShadow: "0 1px 2px rgba(16,40,70,.03), 0 12px 30px -20px rgba(16,40,70,.12)" }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f1f7fb]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={underwaterPhotoUrl(r.heroImageUrl)}
          alt={r.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATE_BADGE[r.state]}`}>
            {STATE_TEXT[r.state]}
          </span>
          {r.inSeason ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
              In season now
            </span>
          ) : null}
        </div>
        {/* Skill badge — bottom-right of image */}
        <span
          className={`absolute bottom-3 right-3 rounded-full px-2.5 py-1 text-xs font-medium ${SKILL_BADGE[r.skill] ?? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"}`}
        >
          {r.skill}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-[#0089de]">
          {r.name}
        </h3>
        <p className="mt-0.5 text-sm text-slate-500">{r.country}</p>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{r.hook}</p>

        {/* Freshness line */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-2.5 text-[11px] text-slate-600">
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#15a05c]" aria-hidden />
            Thermal: today
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: surveyFreshness ? FRESHNESS_DOT[surveyFreshness.k] : "#e23a3a" }}
              aria-hidden
            />
            {surveyYear
              ? `Last eyes underwater: ${surveyYear}`
              : "Last eyes underwater: unknown"}
          </span>
        </div>

        <dl className={`mt-3 grid gap-2 border-t border-slate-100 pt-3 text-xs ${r.cover ? "grid-cols-2" : "grid-cols-1"}`}>
          {r.cover ? (
            <div>
              <dt className="text-slate-500">
                Coral cover{r.coverYear ? ` · ${r.coverYear}` : ""}
              </dt>
              <dd className="mt-0.5 font-semibold text-slate-900">{r.cover}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-slate-500">Best season</dt>
            <dd className="mt-0.5 font-semibold text-slate-900">{r.season}</dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}
