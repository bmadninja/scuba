import type { IucnStatus } from "@/lib/data/types";

const TREND_LABEL: Record<NonNullable<IucnStatus["populationTrend"]>, string> = {
  increasing: "population increasing",
  decreasing: "population decreasing",
  stable: "population stable",
  unknown: "population trend unknown",
};

const CATEGORY_CLASS: Record<IucnStatus["category"], string> = {
  EX: "ex",
  EW: "ew",
  CR: "cr",
  EN: "en",
  VU: "vu",
  NT: "nt",
  LC: "lc",
  DD: "dd",
  NE: "ne",
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
  const categoryClass = CATEGORY_CLASS[status.category] ?? "ne";
  const trend = status.populationTrend ? TREND_LABEL[status.populationTrend] : null;
  const inner = (
    <span
      className={`iucn-badge ${categoryClass} ${className}`}
    >
      <span className="code" aria-hidden>
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
