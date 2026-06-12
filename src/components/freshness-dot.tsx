/**
 * FreshnessDot — 5 px circle indicating data currency.
 * Always paired with a text label (never dot alone).
 *
 * Fresh (#10b981): < 365 days
 * Stale (#e8962f): 365–1095 days
 * Cold (#e23a3a): > 1095 days or null
 */

type FreshnessDotProps = {
  /** Age in days. Null → Cold. */
  days: number | null;
  /** Show the text label next to the dot. Default true. */
  showLabel?: boolean;
  className?: string;
};

const TIERS: Array<{
  maxDays: number;
  color: string;
  label: string;
}> = [
  { maxDays: 365, color: "#10b981", label: "Fresh" },
  { maxDays: 1095, color: "#e8962f", label: "Stale" },
  { maxDays: Infinity, color: "#e23a3a", label: "Cold" },
];

export function FreshnessDot({
  days,
  showLabel = true,
  className = "",
}: FreshnessDotProps) {
  const tier =
    days === null
      ? TIERS[2]
      : TIERS.find((t) => days <= t.maxDays) ?? TIERS[2];

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: tier.color,
          flexShrink: 0,
        }}
      />
      {showLabel ? (
        <span className="text-xs font-medium" style={{ color: "#8b9db8" }}>
          {tier.label}
        </span>
      ) : null}
    </span>
  );
}
