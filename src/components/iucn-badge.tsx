import type { IucnStatus } from "@/lib/data/types";

// Flat status-pill style: tinted bg + colored text + solid code chip.
// Follows the site's pill family — no gradients.
type IucnTone = { bg: string; text: string; chip: string };

const FLAT_TONE: Record<IucnStatus["category"], IucnTone> = {
  EX: { bg: "rgba(255,255,255,0.06)", text: "#aebcd0", chip: "#aebcd0" },
  EW: { bg: "rgba(255,255,255,0.06)", text: "#aebcd0", chip: "#8b9db8" },
  CR: { bg: "rgba(239,68,68,0.12)", text: "#fca5a5", chip: "#ef4444" },
  EN: { bg: "rgba(239,68,68,0.12)", text: "#fca5a5", chip: "#f87171" },
  VU: { bg: "rgba(245,158,11,0.12)", text: "#fbbf24", chip: "#f59e0b" },
  NT: { bg: "rgba(132,204,22,0.12)", text: "#bef264", chip: "#84cc16" },
  LC: { bg: "rgba(16,185,129,0.12)", text: "#6ee7b7", chip: "#10b981" },
  DD: { bg: "rgba(255,255,255,0.06)", text: "#8b9db8", chip: "#8b9db8" },
  NE: { bg: "rgba(255,255,255,0.06)", text: "#8b9db8", chip: "#8b9db8" },
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
  noLink = false,
}: {
  status: IucnStatus;
  className?: string;
  noLink?: boolean;
}) {
  const tone = FLAT_TONE[status.category] ?? FLAT_TONE.NE;
  const trend = status.populationTrend ? TREND_LABEL[status.populationTrend] : null;
  const inner = (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${className}`}
      style={{ background: tone.bg, color: tone.text }}
    >
      <span
        aria-hidden
        className="rounded text-xs font-extrabold text-white"
        style={{ background: tone.chip, padding: "3px 6px" }}
      >
        {status.category}
      </span>
      <span>{status.categoryLabel}</span>
      {trend ? (
        <span className="font-normal opacity-90">· {trend}</span>
      ) : null}
      {status.lastAssessedYear ? (
        <span className="font-normal opacity-80">· assessed {status.lastAssessedYear}</span>
      ) : null}
    </span>
  );
  if (status.assessmentUrl && !noLink) {
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
    <p className="mt-2 text-xs leading-5 text-[#8b9db8]">
      Threat category from the{" "}
      <a
        href="https://www.iucnredlist.org/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#00d4ff] hover:underline"
      >
        IUCN Red List of Threatened Species
      </a>
      . A category reflects extinction risk globally — local abundance at
      a dive site can be very different.
    </p>
  );
}
