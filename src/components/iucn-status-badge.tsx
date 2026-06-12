/**
 * Compact inline IUCN status badge for use inside species cards and list rows.
 *
 * This is the small pill version — just the category code + label on a
 * tinted background. For the full attribution badge with trend/year data,
 * use the IucnBadge component in iucn-badge.tsx instead.
 *
 * Only renders for threatened categories (CR / EN / VU). Returns null for
 * NT, LC, DD, NE so callers do not need to gate on this.
 */

type Props = {
  /** IUCN category code, e.g. "CR". */
  category: string;
  /** Spelled-out label, e.g. "Critically Endangered". */
  label: string;
  /** Optional link to the IUCN assessment page. */
  assessmentUrl?: string | null;
};

type Tone = { bg: string; color: string };

const TONE: Partial<Record<string, Tone>> = {
  CR: { bg: "rgba(239,68,68,0.14)", color: "#fca5a5" },
  EN: { bg: "rgba(239,68,68,0.10)", color: "#fca5a5" },
  VU: { bg: "rgba(245,158,11,0.13)", color: "#fbbf24" },
};

export function IucnStatusBadge({ category, label, assessmentUrl }: Props) {
  const tone = TONE[category];
  // Only show badges for threatened categories; caller can still choose to
  // render LC/NT badges but by default we skip them.
  if (!tone) return null;

  const pill = (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        fontSize: "0.5625rem",
        fontWeight: 700,
        padding: "0.15rem 0.5rem",
        borderRadius: 999,
        whiteSpace: "nowrap",
        background: tone.bg,
        color: tone.color,
        letterSpacing: "0.02em",
      }}
    >
      <span
        style={{
          fontSize: "0.5rem",
          fontWeight: 800,
          background: tone.color,
          color: "#0a1628",
          borderRadius: 3,
          padding: "1px 4px",
          lineHeight: 1.4,
        }}
        aria-hidden="true"
      >
        {category}
      </span>
      {label}
    </span>
  );

  if (assessmentUrl) {
    return (
      <a
        href={assessmentUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`View ${label} assessment on the IUCN Red List`}
        style={{ display: "inline-block", textDecoration: "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        {pill}
      </a>
    );
  }

  return pill;
}
