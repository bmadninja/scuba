import Link from "next/link";

type Variant = "live" | "snapshot" | "presence";

type CommonProps = {
  className?: string;
};

type LiveProps = CommonProps & {
  variant: "live";
  /** Source short label, defaults to "NOAA CRW". */
  source?: string;
  /** ISO date string (YYYY-MM-DD) or full ISO timestamp. */
  updatedAt?: string;
};

type SnapshotProps = CommonProps & {
  variant: "snapshot";
  surveyMethod: string;
  /** ISO date string (YYYY-MM-DD). */
  surveyDate?: string;
};

type PresenceProps = CommonProps & {
  variant: "presence";
  /** Defaults to "GBIF/OBIS". */
  source?: string;
};

export type DataFreshnessLabelProps = LiveProps | SnapshotProps | PresenceProps;

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date((iso.length === 10 ? iso + "T00:00:00Z" : iso));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function yearsAgo(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso.length === 10 ? iso + "T00:00:00Z" : iso);
  if (Number.isNaN(d.getTime())) return null;
  const now = Date.now();
  const years = (now - d.getTime()) / (365.25 * 24 * 3600 * 1000);
  return Math.floor(years);
}

const PILL_BASE =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.1em] ring-1 ring-inset";

const TONE: Record<Variant, string> = {
  live: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  snapshot: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  presence: "bg-white/10 text-[#8b9db8] ring-white/10",
};

export function DataFreshnessLabel(props: DataFreshnessLabelProps) {
  const className = `${PILL_BASE} ${TONE[props.variant]} ${props.className ?? ""}`;
  if (props.variant === "live") {
    const src = props.source ?? "NOAA CRW";
    return (
      <Link href="/data" className={className} title="What's live vs snapshot">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
        Live · {src} · updated {fmtDate(props.updatedAt)}
      </Link>
    );
  }
  if (props.variant === "snapshot") {
    const years = yearsAgo(props.surveyDate);
    const ageNote = years !== null && years > 2 ? ` (${years} years ago)` : "";
    return (
      <Link href="/data" className={className} title="What's live vs snapshot">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
        Snapshot · {props.surveyMethod} · surveyed {fmtDate(props.surveyDate)}
        {ageNote}
      </Link>
    );
  }
  return (
    <Link href="/data" className={className} title="What's live vs snapshot">
      <span className="h-1.5 w-1.5 rounded-full bg-[#8b9db8]" aria-hidden />
      Presence data · {props.source ?? "GBIF/OBIS"} · no population trend
    </Link>
  );
}
