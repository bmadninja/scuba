/**
 * EvidenceDot — four-state sighting confidence indicator.
 *
 * Renders a coloured dot paired with a text label so the evidence quality
 * is never conveyed by colour alone (accessibility). Used on SiteCard and
 * the site detail page meta row.
 *
 * States:
 *   high   → filled emerald   "Confirmed sighting on record"
 *   medium → filled amber     "Likely"
 *   low    → filled orange    "Uncertain"
 *   null   → filled slate     "No sighting records yet"
 */

const DOT_CLASS: Record<string, string> = {
  high: "bg-emerald-500",
  medium: "bg-amber-500",
  low: "bg-orange-500",
};

const LABEL: Record<string, string> = {
  high: "Confirmed sighting on record",
  medium: "Likely",
  low: "Uncertain",
};

const NO_RECORDS_TOOLTIP =
  "No confirmed occurrence records clustered near this site yet. We are backfilling sighting evidence site by site.";

interface EvidenceDotProps {
  /** Sighting confidence level, or null when no records exist. */
  confidence: "high" | "medium" | "low" | null | undefined;
  /** Extra classes applied to the outer wrapper element. */
  className?: string;
  /**
   * When true (default on SiteCard), show the "backfilling" tooltip on
   * the no-records state via the HTML title attribute.
   */
  showTooltip?: boolean;
  /**
   * Whether to render the text label alongside the dot.
   * Default true. Set to false when surrounding context (e.g. species name)
   * already conveys the information — dot-only for visual indicator use.
   */
  showLabel?: boolean;
}

export function EvidenceDot({
  confidence,
  className = "",
  showTooltip = false,
  showLabel = true,
}: EvidenceDotProps) {
  const hasRecords = confidence != null;
  const dotClass = hasRecords ? DOT_CLASS[confidence] : "bg-slate-300";
  const label = hasRecords ? (LABEL[confidence] ?? confidence) : "No sighting records yet";

  return (
    <span
      className={`flex items-center gap-1.5 ${className}`}
      title={!hasRecords && showTooltip ? NO_RECORDS_TOOLTIP : undefined}
    >
      <span
        className={`inline-block size-1.5 shrink-0 rounded-full ${dotClass}`}
        aria-hidden="true"
      />
      {showLabel && <span>{label}</span>}
    </span>
  );
}
