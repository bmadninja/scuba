import type { IucnStatus } from "@/lib/data/types";

// Flat status-pill style: tinted bg + colored text + solid code chip.
// Follows the site's pill family — no gradients.
type IucnTone = { bg: string; text: string; chip: string };

const FLAT_TONE: Record<IucnStatus["category"], IucnTone> = {
  EX: { bg: "#f1f5f9", text: "#1e293b", chip: "#1e293b" },
  EW: { bg: "#f1f5f9", text: "#1e293b", chip: "#334155" },
  CR: { bg: "#fdecea", text: "#c0392f", chip: "#b91c1c" },
  EN: { bg: "#fdecea", text: "#c0392f", chip: "#e23a3a" },
  VU: { bg: "#fcf2e2", text: "#b9751a", chip: "#e8962f" },
  NT: { bg: "#f3fce8", text: "#3f6212", chip: "#65a30d" },
  LC: { bg: "#e7f6ee", text: "#15824c", chip: "#15a05c" },
  DD: { bg: "#f1f5f9", text: "#64748b", chip: "#94a3b8" },
  NE: { bg: "#f1f5f9", text: "#94a3b8", chip: "#cbd5e1" },
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
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11.5px] font-semibold ${className}`}
      style={{ background: tone.bg, color: tone.text }}
    >
      <span
        aria-hidden
        className="rounded text-[10.5px] font-extrabold text-white"
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
