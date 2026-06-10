/**
 * scubaseason logo — Kimi rebrand.
 *
 * Aqua water-drop mark + single-line wordmark: "scuba" (ivory) · "season" (aqua),
 * set in the Space Grotesk display face. The whole site sits on a dark surface,
 * so both variants use the ivory/aqua treatment; `dark` is kept for API
 * compatibility and only nudges the "scuba" weight on photo overlays.
 */

type LogoProps = {
  dark?: boolean;
  /** px width of the SVG mark (height scales 1:1). Default 32. */
  size?: number;
  className?: string;
};

export function Logo({ dark = false, size = 28, className = "" }: LogoProps) {
  const scubaColor = dark ? "rgba(255,255,255,0.92)" : "#f0f4f8";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Water-drop mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#00d4ff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 2C8 6 4 10 4 14c0 4.4 3.6 8 8 8s8-3.6 8-8c0-4-4-8-8-12z" />
        <path d="M12 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
      </svg>

      {/* Wordmark — single line, Space Grotesk display */}
      <span
        style={{
          fontFamily: 'var(--font-serif), "Space Grotesk", system-ui, sans-serif',
          fontWeight: 700,
          fontSize: "1.25rem",
          letterSpacing: "-0.01em",
          lineHeight: 1,
        }}
      >
        <span style={{ color: scubaColor }}>scuba</span>
        <span style={{ color: "#00d4ff" }}>season</span>
      </span>
    </div>
  );
}
