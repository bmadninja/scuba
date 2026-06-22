// Accepts both the design-layer vocab (improving/stable/declining, used by the
// explore reef-card via toHealthState) and the data-layer vocab
// (thriving/pressure/change, used directly by the homepage state trio + mosaic).
type ReefState =
  | "improving"
  | "stable"
  | "declining"
  | "thriving"
  | "pressure"
  | "change";

interface Props {
  state: ReefState | null | undefined;
  /** When true: adds semi-transparent white background for legibility on photos. */
  onPhoto?: boolean;
}

const STATE_COLOR: Record<ReefState, string> = {
  improving: "#2E7D5B",
  stable:    "#B98A2E",
  declining: "#C0412B",
  thriving:  "#10b981",
  pressure:  "#f59e0b",
  change:    "#f43f5e",
};

const STATE_LABEL: Record<ReefState, string> = {
  improving: "Improving",
  stable:    "Stable",
  declining: "Declining",
  thriving:  "Thriving",
  pressure:  "Under pressure",
  change:    "Witnessing change",
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
