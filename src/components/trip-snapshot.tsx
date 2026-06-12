/**
 * TripSnapshot — compact decision block near the top of location/site pages.
 * Lets a user decide in ~10 seconds whether this location is worth exploring.
 */

import { ReefStateBadge } from "./reef-state-badge";
import { DataConfidenceBadge } from "./data-confidence-badge";
import type { ReefState } from "@/lib/data/reef-state";
import type { DataConfidenceVariant } from "./data-confidence-badge";

export type GoSignal = "yes" | "maybe" | "not-ideal";

export type TripSnapshotProps = {
  goNow: GoSignal;
  goNowReason: string;
  bestMonths: string;
  bestFor: string[];           // e.g. ["sharks", "turtles", "wrecks"]
  skillLevel: string;
  reefState: ReefState;
  dataConfidence: DataConfidenceVariant;
  dataConfidenceNote: string;
  tripEffort: string | null;   // e.g. "Direct flight + 1h boat"
};

const GO_CONFIG: Record<GoSignal, { label: string; color: string; bg: string }> = {
  "yes":      { label: "Yes",       color: "#6ee7b7", bg: "rgba(16,185,129,0.14)" },
  "maybe":    { label: "Maybe",     color: "#fcd34d", bg: "rgba(245,158,11,0.14)" },
  "not-ideal":{ label: "Not ideal", color: "#f87171", bg: "rgba(244,63,94,0.14)"  },
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.7rem 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b9db8", fontFamily: "var(--atlas-mono,ui-monospace,monospace)", minWidth: 110, paddingTop: 1, flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: "0.8125rem", color: "#f0f4f8", fontWeight: 500, lineHeight: 1.45, flex: 1 }}>
        {children}
      </span>
    </div>
  );
}

export function TripSnapshot(props: TripSnapshotProps) {
  const go = GO_CONFIG[props.goNow];

  return (
    <div
      style={{
        border: "1px solid rgba(0,212,255,0.18)",
        borderRadius: "1rem",
        background: "#0a1628",
        overflow: "hidden",
        marginBottom: "2.5rem",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "0.9rem 1.25rem 0.75rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#8b9db8",
            fontFamily: "var(--atlas-mono,ui-monospace,monospace)",
          }}
        >
          Trip snapshot
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <DataConfidenceBadge variant={props.dataConfidence} />
        </div>
      </div>

      {/* Go now row — always first, visually prominent */}
      <div
        style={{
          padding: "0.85rem 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          background: "rgba(255,255,255,0.025)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b9db8", fontFamily: "var(--atlas-mono,ui-monospace,monospace)", minWidth: 110, flexShrink: 0 }}>
          Go now?
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "0.25rem 0.75rem",
            borderRadius: 999,
            background: go.bg,
            color: go.color,
            fontSize: "0.75rem",
            fontWeight: 700,
            fontFamily: "var(--atlas-mono,ui-monospace,monospace)",
            letterSpacing: "0.06em",
          }}
        >
          {go.label}
        </span>
        <span style={{ fontSize: "0.75rem", color: "#aebcd0", lineHeight: 1.4 }}>
          {props.goNowReason}
        </span>
      </div>

      {/* Rows */}
      <div style={{ padding: "0 1.25rem 0.5rem" }}>
        <Row label="Best months">{props.bestMonths}</Row>

        {props.bestFor.length > 0 && (
          <Row label="Best for">
            <span style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {props.bestFor.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "0.1rem 0.55rem",
                    borderRadius: 999,
                    background: "rgba(0,212,255,0.1)",
                    color: "#00d4ff",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    fontFamily: "var(--atlas-mono,ui-monospace,monospace)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {tag}
                </span>
              ))}
            </span>
          </Row>
        )}

        <Row label="Skill level">{props.skillLevel}</Row>

        <Row label="Reef state">
          <ReefStateBadge state={props.reefState} size="sm" />
        </Row>

        <Row label="Data confidence">
          <span style={{ fontSize: "0.8125rem", color: "#aebcd0" }}>
            {props.dataConfidenceNote}
          </span>
        </Row>

        {props.tripEffort && (
          <Row label="Trip effort">{props.tripEffort}</Row>
        )}
      </div>
    </div>
  );
}
