/**
 * LiveBadge — green dot with glow, pill background.
 * Used for sections backed by nightly synced / live data.
 */

type LiveBadgeProps = {
  label?: string;
  className?: string;
};

export function LiveBadge({ label = "Live", className = "" }: LiveBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${className}`}
      style={{
        background: "rgba(21,160,92,0.1)",
        border: "1px solid rgba(21,160,92,0.2)",
        color: "#15804d",
        fontSize: "0.75rem",
      }}
    >
      <span
        aria-hidden="true"
        className="live-dot"
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#10b981",
          boxShadow: "0 0 0 3px rgba(21,160,92,0.25)",
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}
