import Link from "next/link";

/** Footer logo — Kimi droplet mark + single-line wordmark. */
function LogoDark() {
  return (
    <div className="flex items-center gap-2">
      <svg
        width="28"
        height="28"
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
      <span
        style={{
          fontFamily: 'var(--font-serif), "Space Grotesk", system-ui, sans-serif',
          fontWeight: 700,
          fontSize: "1.25rem",
          letterSpacing: "-0.01em",
          lineHeight: 1,
        }}
      >
        <span style={{ color: "#f0f4f8" }}>scuba</span>
        <span style={{ color: "#00d4ff" }}>season</span>
        <span style={{ color: "rgba(255,255,255,0.4)" }}>.fun</span>
      </span>
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
              A free, public reef atlas. Science backed, honestly labelled, free
              to read.
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
                { href: "/locations", label: "Find a reef" },
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
              Get in touch
            </p>
            <a
              href="mailto:hello@scubaseason.fun"
              className="text-sm transition-colors"
              style={{ color: "#00d4ff" }}
            >
              hello@scubaseason.fun
            </a>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
              Spotted wrong data? Want to collaborate? All of it welcome.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
            &copy; 2026 scubaSeason.fun · Live data from NOAA, Reef Check,
            iNaturalist and 60 more public sources
          </p>
        </div>
      </div>
    </footer>
  );
}
