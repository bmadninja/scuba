/**
 * Option D logo mark + weight-split wordmark.
 *
 * Light variant (default): "scuba" weight-300 #94a3b8 / "Season.fun" weight-900 #0f172a
 * Dark variant: "scuba" rgba(255,255,255,0.3) / "Season.fun" #ffffff
 */

type LogoProps = {
  dark?: boolean;
  /** px width of the SVG mark (height scales 1:1). Default 32. */
  size?: number;
  className?: string;
};

export function Logo({ dark = false, size = 32, className = "" }: LogoProps) {
  const topColor = dark ? "rgba(255,255,255,0.35)" : "#94a3b8";
  const botColor = dark ? "#ffffff" : "#0f172a";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Option D SVG mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="18" cy="18" r="16" fill="#0089de" />
        {/* Primary wave — full white, asymmetric naturalistic shape */}
        <path
          d="M5 20 Q9 14 14 17 Q18 20 22 15 Q26 10 31 16"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Secondary wave — semi-transparent white */}
        <path
          d="M5 25 Q9 20 13 22 Q17 24 21 20 Q25 16 31 21"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Weight-split wordmark */}
      <div className="flex flex-col" style={{ lineHeight: 1.0 }}>
        <span
          style={{
            fontWeight: 300,
            letterSpacing: "0.08em",
            fontSize: "0.6875rem",
            color: topColor,
          }}
        >
          scuba
        </span>
        <span
          style={{
            fontWeight: 900,
            letterSpacing: "-0.05em",
            fontSize: "1.05rem",
            color: botColor,
          }}
        >
          Season.fun
        </span>
      </div>
    </div>
  );
}
