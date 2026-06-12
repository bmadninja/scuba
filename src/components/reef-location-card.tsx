import Link from "next/link";
import { STATE_TEXT } from "@/lib/data/reef-state";
import type { ReefState } from "@/lib/data/reef-state";
import { HeroPhoto } from "@/components/hero-photo";

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
  thriving: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/20",
  pressure: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/25",
  change: "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/20",
};

const SKILL_BADGE: Record<string, string> = {
  "Beginner":   "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/20",
  "Open water": "bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/20",
  "Advanced":   "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/20",
  "Technical":  "bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-500/20",
};

export function ReefLocationCard({ r }: { r: ReefLocationCardData }) {
  // Witnessing change cards do NOT lift on hover — only Thriving and Under pressure do
  const hoverClasses =
    r.state === "change"
      ? "group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a1628]"
      : "group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a1628] transition hover:-translate-y-[3px] hover:border-[#00d4ff]/40 hover:shadow-[0_1px_2px_rgba(16,40,70,.03),0_14px_30px_-20px_rgba(16,40,70,.18)]";

  return (
    <Link
      href={`/locations/${r.slug}`}
      className={hoverClasses}
      style={{ boxShadow: "0 1px 2px rgba(16,40,70,.03), 0 12px 30px -20px rgba(16,40,70,.12)" }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#0a1628]">
        <HeroPhoto
          url={r.heroImageUrl}
          alt={r.name}
          seed={r.slug ?? r.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute left-2 top-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATE_BADGE[r.state]}`}>
            {STATE_TEXT[r.state]}
          </span>
        </div>
      </div>

      <div className="flex flex-col p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-[#f0f4f8] group-hover:text-[#00d4ff]">
          {r.name}
        </h3>
        <p className="mt-0.5 text-xs text-[#8b9db8]">{r.country}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {r.skill && (
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${SKILL_BADGE[r.skill] ?? "bg-white/10 text-[#8b9db8] ring-1 ring-inset ring-white/10"}`}>
              {r.skill}
            </span>
          )}
          {r.inSeason ? (
            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/20">
              In season
            </span>
          ) : (
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-xs font-medium text-[#8b9db8] ring-1 ring-inset ring-white/10">
              Off season
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
