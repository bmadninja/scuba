import type { PillarKey, PillarScore } from "@/lib/data/reef-state-pillars";

/**
 * Per-pillar evidence breakdown for a location's reef state (FR-13). Shows each
 * pillar's normalized read, its plain-English note, and whether it had data,
 * plus the overall confidence tier (FR-12). Purely presentational — the scores
 * come from getReefStateDetail. Pillars with no data render explicitly, never
 * omitted silently.
 */

const PILLAR_LABEL: Record<PillarKey, string> = {
  coral: "Coral cover",
  thermal: "Heat stress",
  fish: "Fish community",
  fishing: "Fishing pressure",
};

const PILLAR_ORDER: PillarKey[] = ["coral", "thermal", "fish", "fishing"];

/** Score → semantic color, matching the reef-state verdict palette. */
function scoreColor(score: number): string {
  if (score >= 0.7) return "#2E7D5B"; // healthy
  if (score >= 0.4) return "#B98A2E"; // moderate
  return "#C0412B"; // degraded
}

export function ReefStateBreakdown({
  pillars,
  tierLabel,
  overridden = false,
}: {
  pillars: PillarScore[];
  tierLabel: string;
  /** True when an editorial verdict is set from cited evidence the pillars
   *  can't read; the bars then show the computed signals, not the shown label. */
  overridden?: boolean;
}) {
  const byKey = new Map(pillars.map((p) => [p.key, p]));
  const rows = PILLAR_ORDER.map((k) => byKey.get(k)).filter(
    (p): p is PillarScore => Boolean(p),
  );

  return (
    <div
      style={{
        marginTop: "1rem",
        maxWidth: 680,
        border: "1px solid #E7E6E2",
        borderRadius: 16,
        background: "#FBFAF8",
        padding: "1rem 1.15rem 1.15rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          marginBottom: "0.85rem",
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace',
            fontSize: "0.6875rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#6B7280",
          }}
        >
          Evidence breakdown
        </span>
        <span
          style={{
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "#0E4F6E",
            background: "rgba(14,79,110,0.09)",
            borderRadius: 999,
            padding: "0.2rem 0.6rem",
          }}
        >
          {tierLabel}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
        {rows.map((p) => {
          const has = p.hasData && p.score !== null;
          const pct = has ? Math.round((p.score as number) * 100) : 0;
          const color = has ? scoreColor(p.score as number) : "#C4C9C4";
          return (
            <div key={p.key} style={{ display: "grid", gridTemplateColumns: "8.5rem 1fr", gap: "0.75rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#0E1C28" }}>
                {PILLAR_LABEL[p.key]}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <div
                  style={{
                    position: "relative",
                    flex: "0 0 84px",
                    height: 6,
                    borderRadius: 999,
                    background: "#EAE8E3",
                    overflow: "hidden",
                  }}
                  role="img"
                  aria-label={has ? `${PILLAR_LABEL[p.key]} score ${pct} of 100` : `${PILLAR_LABEL[p.key]} no data`}
                >
                  {has ? (
                    <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: color, borderRadius: 999 }} />
                  ) : null}
                </div>
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: has ? "#4A5568" : "#9AA0A6",
                    fontStyle: has ? "normal" : "italic",
                  }}
                >
                  {has ? p.note : "No data on file"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {overridden ? (
        <p
          style={{
            margin: "0.85rem 0 0",
            padding: "0.5rem 0.7rem",
            fontSize: "0.75rem",
            lineHeight: 1.5,
            color: "#7A5B14",
            background: "rgba(185,138,46,0.1)",
            border: "1px solid rgba(185,138,46,0.25)",
            borderRadius: 10,
          }}
        >
          <strong>Editorially adjusted.</strong> The verdict shown is set from
          cited published evidence (see the sources above); the bars below show
          the automatically computed signals, which may not capture that
          evidence.
        </p>
      ) : null}

      <p
        style={{
          margin: "0.9rem 0 0",
          fontSize: "0.6875rem",
          lineHeight: 1.5,
          color: "#8A8F94",
        }}
      >
        Each pillar is scored against its own reference — coral against
        biologically-anchored cover thresholds, fish against the survey
        program&rsquo;s own distribution, heat against NOAA Coral Reef Watch.
        Pillars with no survey on file do not vote.
      </p>
    </div>
  );
}
