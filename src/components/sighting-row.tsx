/**
 * SightingRow — a single confirmed sighting entry.
 *
 * Color rules (dot):
 *  - ≤30 days: #10b981 (green)
 *  - 31–90 days: #e8962f (amber)
 *  - >90 days or null: #94a3b8 (slate)
 */

type SightingRowProps = {
  speciesCommon: string;
  speciesScientific?: string;
  siteName?: string;
  /** ISO date string YYYY-MM-DD. */
  date: string | null;
  /** iNaturalist observation ID (numeric string). */
  obsId?: string;
  className?: string;
};

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function dotColor(days: number | null): string {
  if (days === null) return "#94a3b8";
  if (days <= 30) return "#10b981";
  if (days <= 90) return "#e8962f";
  return "#94a3b8";
}

function fmtRelative(days: number | null, iso: string | null): string {
  if (days === null || iso === null) return "No date on file";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function SightingRow({
  speciesCommon,
  speciesScientific,
  siteName,
  date,
  obsId,
  className = "",
}: SightingRowProps) {
  const days = daysSince(date);
  const color = dotColor(days);
  const relative = fmtRelative(days, date);

  return (
    <div
      className={`flex items-start gap-3 border-b border-slate-100 py-3 last:border-b-0 ${className}`}
    >
      {/* Color dot */}
      <span
        aria-hidden="true"
        style={{
          marginTop: 3,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p
          style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a" }}
        >
          {speciesCommon}
        </p>
        <p
          style={{
            fontSize: "0.75rem",
            color: "#64748b",
            fontStyle: speciesScientific ? "italic" : "normal",
          }}
        >
          {speciesScientific ? speciesScientific : null}
          {siteName ? (
            <span style={{ fontStyle: "normal" }}>
              {speciesScientific ? " · " : ""}
              {siteName}
            </span>
          ) : null}
        </p>
        {obsId ? (
          <a
            href={`https://www.inaturalist.org/observations/${obsId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily:
                "var(--font-mono), 'IBM Plex Mono', 'Courier New', monospace",
              fontSize: "0.6875rem",
              color: "#94a3b8",
              textDecoration: "none",
            }}
          >
            obs/{obsId} →
          </a>
        ) : null}
      </div>

      {/* Date */}
      <time
        dateTime={date ?? undefined}
        style={{ fontSize: "0.75rem", color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}
      >
        {relative}
      </time>
    </div>
  );
}
