import type { IucnStatus } from "@/lib/data/types";

// IUCN visual standard: red for threatened categories, orange for NT,
// green for LC, grey for DD/NE.
const TONE: Record<IucnStatus["category"], string> = {
  EX: "bg-black text-white ring-black",
  EW: "bg-black text-white ring-black",
  CR: "bg-rose-700 text-white ring-rose-800",
  EN: "bg-orange-600 text-white ring-orange-700",
  VU: "bg-amber-500 text-white ring-amber-600",
  NT: "bg-lime-600 text-white ring-lime-700",
  LC: "bg-emerald-600 text-white ring-emerald-700",
  DD: "bg-slate-400 text-white ring-slate-500",
  NE: "bg-slate-300 text-slate-700 ring-slate-400",
};

const TREND_LABEL: Record<NonNullable<IucnStatus["populationTrend"]>, string> = {
  increasing: "population increasing",
  decreasing: "population decreasing",
  stable: "population stable",
  unknown: "population trend unknown",
};

export function IucnBadge({
  status,
  className = "",
}: {
  status: IucnStatus;
  className?: string;
}) {
  const tone = TONE[status.category] ?? TONE.NE;
  const trend = status.populationTrend ? TREND_LABEL[status.populationTrend] : null;
  const inner = (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.08em] ring-1 ring-inset ${tone} ${className}`}
    >
      <span aria-hidden className="font-mono text-[10px] opacity-90">
        {status.category}
      </span>
      <span>{status.categoryLabel}</span>
      {trend ? (
        <span className="font-normal normal-case tracking-normal opacity-90">
          · {trend}
        </span>
      ) : null}
      {status.lastAssessedYear ? (
        <span className="font-normal normal-case tracking-normal opacity-80">
          · assessed {status.lastAssessedYear}
        </span>
      ) : null}
    </span>
  );
  if (status.assessmentUrl) {
    return (
      <a
        href={status.assessmentUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="View on IUCN Red List"
        className="inline-block"
      >
        {inner}
      </a>
    );
  }
  return inner;
}

export function IucnAttribution() {
  return (
    <p className="mt-2 text-[11px] leading-5 text-slate-500">
      Threat category from the{" "}
      <a
        href="https://www.iucnredlist.org/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#0089de] hover:underline"
      >
        IUCN Red List of Threatened Species
      </a>
      . A category reflects extinction risk globally — local abundance at
      a dive site can be very different.
    </p>
  );
}
