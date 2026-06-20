import Link from "next/link";

export function AtlasFooter() {
  return (
    <footer style={{ background: "#14191E" }}>
      <style>{`
        .footer-link { color: rgba(255,255,255,0.65); text-decoration: none; transition: color 150ms ease; }
        .footer-link:hover { color: #F6C700; }
        .footer-link:focus-visible { outline: 2px solid #F6C700; outline-offset: 2px; border-radius: 1px; }
      `}</style>
      <div className="mx-auto max-w-[1320px] px-7 py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Column 1: Wordmark + mission */}
          <div className="max-w-xs">
            <Link
              href="/"
              className="footer-link"
              aria-label="Scuba Season — home"
              style={{ color: "#FFFFFF" }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif',
                  fontWeight: 400,
                  fontSize: "1.25rem",
                  letterSpacing: "-0.01em",
                  color: "#FFFFFF",
                }}
              >
                Scuba Season
              </span>
            </Link>
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              We put real reef science in every diver's hands so the ocean gets more defenders and fewer disappointed visitors.
            </p>
          </div>

          {/* Column 2: Nav links */}
          <div>
            <p
              className="mb-4 text-xs font-medium uppercase tracking-[0.14em]"
              style={{
                color: "rgba(255,255,255,0.35)",
                fontFamily: 'var(--font-mono), "IBM Plex Mono", ui-monospace, monospace',
              }}
            >
              Explore
            </p>
            <ul className="space-y-2.5">
              {[
                { href: "/locations", label: "Explore reefs" },
                { href: "/data",      label: "Method" },
                { href: "/about",     label: "About" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="footer-link text-sm"
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
              className="mb-4 text-xs font-medium uppercase tracking-[0.14em]"
              style={{
                color: "rgba(255,255,255,0.35)",
                fontFamily: 'var(--font-mono), "IBM Plex Mono", ui-monospace, monospace',
              }}
            >
              Get in touch
            </p>
            <a
              href="mailto:hello@scubaseason.fun"
              className="footer-link text-sm"
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
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            Data licensed CC BY-NC &middot; Sources: 63 datasets &middot; &copy; 2026 Scuba Season
          </p>
        </div>
      </div>
    </footer>
  );
}
