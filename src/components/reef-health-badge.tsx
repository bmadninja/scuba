type ReefState = "improving" | "stable" | "declining";

interface Props {
  state: ReefState | null | undefined;
  /** When true: adds semi-transparent white background for legibility on photos. */
  onPhoto?: boolean;
}

const STATE_COLOR: Record<ReefState, string> = {
  improving: "#2E7D5B",
  stable:    "#B98A2E",
  declining: "#C0412B",
};

const STATE_LABEL: Record<ReefState, string> = {
  improving: "Improving",
  stable:    "Stable",
  declining: "Declining",
};

export function ReefHealthBadge({ state, onPhoto = false }: Props) {
  if (!state) return null;

  const color = STATE_COLOR[state];
  const label = STATE_LABEL[state];

  return (
    <span
      aria-label={`Reef health: ${state}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontFamily: 'var(--font-mono), "IBM Plex Mono", ui-monospace, monospace',
        fontSize: "11px",
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        padding: "3px 8px",
        borderRadius: "2px",
        border: `1px solid ${color}`,
        color,
        background: onPhoto ? "rgba(255,255,255,0.12)" : "transparent",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export default ReefHealthBadge;
