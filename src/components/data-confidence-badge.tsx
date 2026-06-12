/**
 * DataConfidenceBadge — small trust/provenance chip shown next to data points.
 *
 * variant examples:
 *   "live"        → "Live nightly"
 *   "recent"      → "Recent sightings"
 *   "thin"        → "Thin data"
 *   "survey-2022" → "Survey from 2022"
 *   "high"        → "High confidence"
 *   "limited"     → "Limited records"
 *   "snapshot"    → "Snapshot"
 */

export type DataConfidenceVariant =
  | "live"
  | "recent"
  | "thin"
  | "limited"
  | "high"
  | "snapshot"
  | { label: string; survey?: string };

const PRESET: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  live:     { label: "Live nightly",      color: "#6ee7b7", bg: "rgba(16,185,129,0.13)", dot: "#10b981" },
  recent:   { label: "Recent sightings",  color: "#6ee7b7", bg: "rgba(16,185,129,0.13)", dot: "#10b981" },
  high:     { label: "High confidence",   color: "#93c5fd", bg: "rgba(59,130,246,0.13)", dot: "#3b82f6" },
  thin:     { label: "Thin data",         color: "#fcd34d", bg: "rgba(245,158,11,0.13)", dot: "#f59e0b" },
  limited:  { label: "Limited records",   color: "#fcd34d", bg: "rgba(245,158,11,0.13)", dot: "#f59e0b" },
  snapshot: { label: "Snapshot",          color: "#8b9db8", bg: "rgba(139,157,184,0.12)", dot: "#8b9db8" },
};

function surveyBadge(year: string) {
  return {
    label: `Survey from ${year}`,
    color: "#8b9db8",
    bg: "rgba(139,157,184,0.12)",
    dot: "#8b9db8",
  };
}

export function DataConfidenceBadge({
  variant,
  className,
}: {
  variant: DataConfidenceVariant;
  className?: string;
}) {
  let cfg: { label: string; color: string; bg: string; dot: string };

  if (typeof variant === "string") {
    if (variant.startsWith("survey-")) {
      cfg = surveyBadge(variant.replace("survey-", ""));
    } else {
      cfg = PRESET[variant] ?? { label: variant, color: "#8b9db8", bg: "rgba(255,255,255,0.08)", dot: "#8b9db8" };
    }
  } else {
    const base = variant.survey ? surveyBadge(variant.survey) : PRESET.snapshot;
    cfg = { ...base, label: variant.label };
  }

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: "0.5625rem",
        fontWeight: 700,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        padding: "0.2rem 0.5rem",
        borderRadius: 999,
        background: cfg.bg,
        color: cfg.color,
        whiteSpace: "nowrap",
        fontFamily: "var(--atlas-mono, ui-monospace, monospace)",
      }}
    >
      <span
        aria-hidden
        style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }}
      />
      {cfg.label}
    </span>
  );
}

/** Derive a DataConfidenceVariant from survey age in days. */
export function confidenceFromDays(days: number | null): DataConfidenceVariant {
  if (days === null) return "thin";
  if (days <= 45) return "live";
  if (days <= 180) return "recent";
  if (days <= 730) return "high";
  return "limited";
}
