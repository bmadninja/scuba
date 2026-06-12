/**
 * SeasonalityStrip — month-by-month visibility heatmap for a species or location.
 *
 * intensity values (per month):
 *   "peak"     → full highlight
 *   "good"     → medium highlight
 *   "possible" → faint highlight
 *   "unlikely" → muted / off
 *   "unknown"  → very subtle, dotted
 */

export type SeasonalityLevel = "peak" | "good" | "possible" | "unlikely" | "unknown";

export type SeasonalityMonth = {
  month: number; // 1–12
  level: SeasonalityLevel;
};

const ABBR = ["J","F","M","A","M","J","J","A","S","O","N","D"];

const LEVEL_STYLE: Record<SeasonalityLevel, { bg: string; color: string; border?: string }> = {
  peak:     { bg: "rgba(0,212,255,0.85)",  color: "#030712" },
  good:     { bg: "rgba(0,212,255,0.38)",  color: "#f0f4f8" },
  possible: { bg: "rgba(0,212,255,0.14)",  color: "#aebcd0" },
  unlikely: { bg: "rgba(255,255,255,0.05)", color: "#8b9db8" },
  unknown:  { bg: "rgba(255,255,255,0.04)", color: "#8b9db8", border: "1px dashed rgba(255,255,255,0.12)" },
};

const LEVEL_LABEL: Record<SeasonalityLevel, string> = {
  peak:     "Peak",
  good:     "Good",
  possible: "Possible",
  unlikely: "Unlikely",
  unknown:  "Unknown",
};

/** Convert a bestMonths array (1-indexed) into SeasonalityMonth[] using a simple
 *  two-tier model: listed months = "good", unlisted = "unlikely". */
export function bestMonthsToSeasonality(bestMonths: number[]): SeasonalityMonth[] {
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    level: bestMonths.includes(i + 1) ? "good" : "unlikely",
  }));
}

/** Convert a sighting's seasonalityMonths + confidence into SeasonalityMonth[]. */
export function sightingToSeasonality(
  seasonalityMonths: number[],
  confidence: "high" | "medium" | "low",
): SeasonalityMonth[] {
  if (seasonalityMonths.length === 0) {
    const level = confidence === "high" ? "possible" : "unknown";
    return Array.from({ length: 12 }, (_, i) => ({ month: i + 1, level }));
  }
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    if (!seasonalityMonths.includes(m)) return { month: m, level: "unlikely" as SeasonalityLevel };
    if (confidence === "high") return { month: m, level: "peak" as SeasonalityLevel };
    if (confidence === "medium") return { month: m, level: "good" as SeasonalityLevel };
    return { month: m, level: "possible" as SeasonalityLevel };
  });
}

export function SeasonalityStrip({
  data,
  currentMonth,
  showLegend = false,
  compact = false,
}: {
  data: SeasonalityMonth[];
  currentMonth?: number;
  showLegend?: boolean;
  compact?: boolean;
}) {
  const cellH = compact ? 22 : 28;
  const fontSize = compact ? "0.5rem" : "0.5625rem";

  return (
    <div>
      <div style={{ display: "flex", gap: 2 }}>
        {data.map(({ month, level }) => {
          const style = LEVEL_STYLE[level];
          const isCurrent = month === currentMonth;
          return (
            <div
              key={month}
              title={`${new Date(2000, month - 1).toLocaleString("en", { month: "long" })}: ${LEVEL_LABEL[level]}`}
              style={{
                flex: 1,
                height: cellH,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: style.bg,
                border: isCurrent
                  ? "2px solid #00d4ff"
                  : style.border ?? "none",
                fontSize,
                fontWeight: 700,
                fontFamily: "var(--atlas-mono, ui-monospace, monospace)",
                color: style.color,
                letterSpacing: "0.04em",
                cursor: "default",
                transition: "opacity 0.1s",
                boxSizing: "border-box",
              }}
            >
              {ABBR[month - 1]}
            </div>
          );
        })}
      </div>

      {showLegend && (
        <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
          {(["peak", "good", "possible", "unlikely"] as SeasonalityLevel[]).map((level) => {
            const s = LEVEL_STYLE[level];
            return (
              <span
                key={level}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "0.5625rem",
                  color: "#8b9db8",
                  fontFamily: "var(--atlas-mono, ui-monospace, monospace)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: s.bg,
                    border: s.border ?? "none",
                    flexShrink: 0,
                  }}
                />
                {LEVEL_LABEL[level]}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
