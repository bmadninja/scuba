/**
 * Scuba Season wordmark — Source Serif 4 editorial face.
 * Text only; no SVG icon (per design system: no icons in UI).
 * dark=true renders white text for use on dark or photo backgrounds.
 */

type LogoProps = {
  dark?: boolean;
  /** Approximate target width in px — used to scale font size. Default 28. */
  size?: number;
  className?: string;
};

export function Logo({ dark = false, size = 28, className = "" }: LogoProps) {
  const color = dark ? "#FFFFFF" : "#0E1C28";
  // Scale font proportionally: size 28 → 1.125rem (18px)
  const fontSize = Math.max(14, Math.round(size * 0.643)) + "px";

  return (
    <span
      className={className}
      style={{
        fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif',
        fontWeight: 400,
        fontSize,
        letterSpacing: "-0.01em",
        lineHeight: 1,
        color,
        transition: "color 200ms ease",
      }}
    >
      Scuba Season
    </span>
  );
}
