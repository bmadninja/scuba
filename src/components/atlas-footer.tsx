import Link from "next/link";

/** Logo component — used in footer (dark variant only here) */
function LogoDark() {
  return (
    <div className="flex items-center gap-2.5">
      {/* Option D mark: solid #0089de circle + two white wave paths */}
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="18" cy="18" r="16" fill="#0089de" />
        {/* Primary wave */}
        <path
          d="M6 18 Q10 14, 14 18 Q18 22, 22 18 Q26 14, 30 18"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="1.0"
        />
        {/* Secondary wave */}
        <path
          d="M6 22 Q10 18, 14 22 Q18 26, 22 22 Q26 18, 30 22"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {/* Weight-split wordmark — dark variant */}
      <div className="flex flex-col leading-[1.0]">
        <span
          style={{
            fontWeight: 300,
            letterSpacing: "0.08em",
            fontSize: "0.6875rem",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          scuba
        </span>
        <span
          style={{
            fontWeight: 900,
            letterSpacing: "-0.05em",
            fontSize: "1.05rem",
            color: "#ffffff",
          }}
        >
          Season.fun
        </span>
      </div>
    </div>
  );
}

export function AtlasFooter() {
  return (
    <footer style={{ background: "#0b1e32" }}>
      <div className="mx-auto max-w-[1320px] px-7 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Column 1: Logo + tagline */}
          <div className="max-w-xs">
            <Link href="/" aria-label="scubaSeason.fun — home">
              <LogoDark />
            </Link>
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{
                fontStyle: "italic",
                fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              A data atlas for the living ocean.
            </p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
              Built from a diver&apos;s frustration — the kind you get when you
              can&apos;t find good conditions data before a trip.
            </p>
          </div>

          {/* Column 2: Site links */}
          <div>
            <p
              className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Site
            </p>
            <ul className="space-y-2.5">
              {[
                { href: "/", label: "Atlas" },
                { href: "/sites", label: "Sites" },
                { href: "/gear", label: "Gear" },
                { href: "/data", label: "Method" },
                { href: "/about", label: "About" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <p
              className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Contact
            </p>
            <a
              href="mailto:hello@scubaseason.fun"
              className="text-sm transition-colors"
              style={{ color: "#0089de" }}
            >
              hello@scubaseason.fun
            </a>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
              Spot a mistake or want to collaborate? Always happy to hear from
              you.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 flex flex-col gap-2 pt-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
            Thermal data: NOAA Coral Reef Watch v3.1 · refreshed nightly ·{" "}
            <Link href="/data" className="underline hover:text-white/60 transition-colors">
              All sources →
            </Link>
          </p>
          <p className="shrink-0 text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
            &copy; 2026 scubaSeason.fun
          </p>
        </div>
      </div>
    </footer>
  );
}
