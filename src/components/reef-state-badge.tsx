import type { ReefState } from "@/lib/data/reef-state";
import { STATE_TEXT, STATE_DEF } from "@/lib/data/reef-state";

const STATE_COLOR: Record<ReefState, string> = {
  thriving: "#10b981",
  pressure: "#f59e0b",
  change:   "#f43f5e",
};

const STATE_BG: Record<ReefState, string> = {
  thriving: "rgba(16,185,129,0.14)",
  pressure: "rgba(245,158,11,0.14)",
  change:   "rgba(244,63,94,0.14)",
};

export function ReefStateBadge({
  state,
  size = "md",
  showTooltip = true,
}: {
  state: ReefState;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}) {
  const color = STATE_COLOR[state];
  const bg    = STATE_BG[state];
  const label = STATE_TEXT[state];
  const def   = STATE_DEF[state];

  const fontSize  = size === "sm" ? "0.5625rem" : size === "lg" ? "0.75rem" : "0.625rem";
  const dotSize   = size === "sm" ? 5 : size === "lg" ? 8 : 6;
  const padding   = size === "sm" ? "0.2rem 0.55rem" : size === "lg" ? "0.4rem 0.85rem" : "0.25rem 0.65rem";

  const badge = (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding,
        borderRadius: 999,
        background: bg,
        color,
        whiteSpace: "nowrap",
        fontFamily: "var(--atlas-mono, ui-monospace, monospace)",
      }}
    >
      <span
        aria-hidden
        style={{ width: dotSize, height: dotSize, borderRadius: "50%", background: color, flexShrink: 0 }}
      />
      {label}
    </span>
  );

  if (!showTooltip) return badge;

  return (
    <span style={{ position: "relative", display: "inline-flex" }} className="reef-badge-wrap">
      {badge}
      <span className="reef-badge-tip" role="tooltip">
        <strong style={{ display: "block", marginBottom: 4, color: "#f0f4f8" }}>{label}</strong>
        {def.short}
      </span>
      <style>{`
        .reef-badge-wrap:hover .reef-badge-tip,
        .reef-badge-wrap:focus-within .reef-badge-tip { opacity:1; pointer-events:auto; transform:translateY(0); }
        .reef-badge-tip {
          position:absolute; top:calc(100% + 8px); left:0; z-index:100;
          background:#0a1628; border:1px solid rgba(0,212,255,0.18);
          border-radius:8px; padding:10px 13px;
          width:240px; font-size:12px; line-height:1.55;
          color:#aebcd0; font-weight:400; letter-spacing:0; text-transform:none;
          font-family:var(--atlas-sans, system-ui, sans-serif);
          box-shadow:0 8px 24px -4px rgba(0,0,0,0.35);
          opacity:0; pointer-events:none;
          transform:translateY(6px);
          transition:opacity 0.15s, transform 0.15s;
          white-space:normal;
        }
      `}</style>
    </span>
  );
}
