/**
 * StatStrip — compact horizontal strip of labeled statistics.
 * Hairline dividers between items. Scrolls horizontally on mobile.
 * Values are static — no count-up animation.
 */

export type StatItem = {
  label: string;
  value: string;
  note?: string;
};

type StatStripProps = {
  stats: StatItem[];
  className?: string;
};

export function StatStrip({ stats, className = "" }: StatStripProps) {
  return (
    <div
      className={`flex overflow-x-auto ${className}`}
      style={{
        background: "rgba(14,28,40,0.04)",
        borderRadius: 6,
        scrollbarWidth: "none",
      }}
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="flex shrink-0 flex-col justify-center px-5 py-3"
          style={{
            borderRight: i < stats.length - 1 ? "1px solid var(--color-hairline)" : "none",
          }}
        >
          <span
            style={{
              fontSize: "0.5875rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-ink-2)",
              whiteSpace: "nowrap",
            }}
          >
            {stat.label}
          </span>
          <span
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--color-ink)",
              lineHeight: 1.2,
              marginTop: 2,
              whiteSpace: "nowrap",
            }}
          >
            {stat.value}
          </span>
          {stat.note ? (
            <span
              style={{
                fontSize: "0.6875rem",
                color: "var(--color-ink-2)",
                marginTop: 1,
                whiteSpace: "nowrap",
              }}
            >
              {stat.note}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
