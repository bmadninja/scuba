"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useNavContext } from "@/components/nav-context";

type SearchEntry = {
  slug: string;
  name: string;
  country: string;
  region: string;
  state: string;
};

const NAV = [
  { href: "/locations", label: "Explore",  key: "explore" },
  { href: "/data",      label: "Method",   key: "method"  },
  { href: "/about",     label: "About",    key: "about"   },
];

const STATE_TEXT: Record<string, string> = {
  thriving: "Thriving",
  pressure: "Under pressure",
  change: "Witnessing change",
};

const STATE_PILL: Record<string, string> = {
  thriving: "bg-emerald-50 text-emerald-700",
  pressure: "bg-amber-50 text-amber-700",
  change: "bg-rose-50 text-rose-700",
};

type AtlasNavProps = {
  entries?: SearchEntry[];
  variant?: "default" | "hero";
};

/** Wordmark — text only, no SVG icons per design system rules. */
function Wordmark() {
  return (
    <span
      style={{
        fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif',
        fontWeight: 400,
        fontSize: "1.125rem",
        letterSpacing: "-0.01em",
        lineHeight: 1,
        color: "#0E1C28",
      }}
    >
      Scuba Season
    </span>
  );
}

export function AtlasNav({ entries = [], variant: _variant = "default" }: AtlasNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { breadcrumbs, hideLayoutNav } = useNavContext();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close drawer on route change (setState in effect is intentional here — syncing
  // drawer closed state to navigation events, an external system trigger)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Trap body scroll when drawer open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const active =
    NAV.find((n) =>
      n.href === "/" ? pathname === "/" : pathname.startsWith(n.href),
    )?.key ?? "";

  const query = q.trim().toLowerCase();
  const results = query
    ? entries
        .filter((r) =>
          (r.name + " " + r.country + " " + r.region)
            .toLowerCase()
            .includes(query),
        )
        .slice(0, 8)
    : [];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (r: SearchEntry) => {
    setOpen(false);
    setQ("");
    router.push(`/locations/${r.slug}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[sel];
      if (r) {
        go(r);
      } else if (q.trim()) {
        setOpen(false);
        router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        setQ("");
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  if (hideLayoutNav) return null;

  const linkColor = "#0E1C28";
  const linkHoverColor = "#0E1C28";

  return (
    <>
      <header
        className="sticky top-0 z-50 bg-white border-b border-[#E7E6E2]"
      >
        <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-4 py-3 sm:gap-6 sm:px-8">
          {/* Wordmark */}
          <Link
            href="/"
            className="shrink-0 focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
            aria-label="Scuba Season — home"
          >
            <Wordmark />
          </Link>

          {/* Breadcrumbs (location / site pages) */}
          {breadcrumbs.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              className="hidden items-center sm:flex"
              style={{
                gap: "0.5rem",
                fontSize: "0.8125rem",
                color: "rgba(14,28,40,0.5)",
                marginLeft: "0.5rem",
              }}
            >
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-0.5">
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      style={{
                        color: "rgba(14,28,40,0.25)",
                        marginRight: "0.25rem",
                      }}
                    >
                      /
                    </span>
                  )}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      style={{
                        color: "rgba(14,28,40,0.5)",
                        textDecoration: "none",
                      }}
                      className="hover:text-[#0E4F6E] transition-colors focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span style={{ color: "#0E1C28", fontWeight: 500 }}>
                      {crumb.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          )}

          {/* Desktop search input */}
          <div
            ref={wrapRef}
            className="relative ml-auto hidden sm:block"
            style={{ width: "100%", maxWidth: "260px" }}
          >
            <input
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setSel(0);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder="Search reefs..."
              aria-label="Search reefs"
              className="w-full rounded-sm pr-4 focus:outline-none border"
              style={{
                padding: "0.45rem 1rem",
                fontSize: "0.8125rem",
                background: "rgba(14,28,40,0.04)",
                border: "1px solid #E7E6E2",
                color: "#0E1C28",
                fontFamily: "inherit",
              }}
            />

            {open && query && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-sm border border-[#E7E6E2] bg-white shadow-[0_8px_40px_rgba(14,28,40,0.12)]">
                {results.length ? (
                  <ul className="max-h-80 overflow-y-auto py-1">
                    {results.map((r, i) => (
                      <li key={r.slug}>
                        <button
                          type="button"
                          onMouseEnter={() => setSel(i)}
                          onClick={() => go(r)}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2 ${
                            i === sel ? "bg-[#F5F4F0]" : ""
                          }`}
                        >
                          <span
                            className={`shrink-0 rounded-sm px-2 py-0.5 text-xs font-medium ${
                              STATE_PILL[r.state] ?? "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {STATE_TEXT[r.state] ?? r.state}
                          </span>
                          <span className="text-sm font-medium text-[#0E1C28]">
                            {r.name}
                          </span>
                          <span className="ml-auto text-xs text-[#4A5568]">
                            {r.country}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-center text-sm text-[#4A5568]">
                    No locations match &ldquo;{q}&rdquo;.
                  </div>
                )}
                <div className="border-t border-[#E7E6E2]">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
                      setQ("");
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#0E4F6E] hover:bg-[#F5F4F0] overflow-hidden focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
                  >
                    <span className="truncate">Search for &ldquo;{q}&rdquo;</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop nav links */}
          <nav
            className="hidden sm:flex shrink-0 items-center"
            style={{ gap: "0.125rem" }}
            aria-label="Main navigation"
          >
            {NAV.map((n) => (
              <Link
                key={n.key}
                href={n.href}
                className="text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
                style={{
                  padding: "0.45rem 0.75rem",
                  color: active === n.key ? "#0E4F6E" : linkColor,
                  textDecoration: "none",
                }}
              >
                {n.label}
              </Link>
            ))}

            {/* Upload CTA — yellow, always */}
            <Link
              href="/upload"
              className="inline-flex items-center focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
              style={{
                background: "#F6C700",
                color: "#0E1C28",
                padding: "0.4rem 0.875rem",
                borderRadius: "2px",
                fontSize: "0.8125rem",
                fontWeight: 500,
                marginLeft: "0.5rem",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Upload a sighting
            </Link>
          </nav>

          {/* Mobile: hamburger button */}
          <button
            type="button"
            className="sm:hidden ml-auto flex items-center justify-center w-11 h-11 focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
          >
            {/* Hamburger lines — text-based, no icon lib */}
            <span
              className="flex flex-col gap-1.5"
              aria-hidden="true"
            >
              <span
                style={{
                  display: "block",
                  width: "20px",
                  height: "1.5px",
                  background: linkColor,
                  transition: "background 200ms ease",
                }}
              />
              <span
                style={{
                  display: "block",
                  width: "20px",
                  height: "1.5px",
                  background: linkColor,
                  transition: "background 200ms ease",
                }}
              />
              <span
                style={{
                  display: "block",
                  width: "14px",
                  height: "1.5px",
                  background: linkColor,
                  transition: "background 200ms ease",
                }}
              />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[60]"
          onClick={() => setDrawerOpen(false)}
          style={{ background: "rgba(14,28,40,0.4)" }}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <div
        className="fixed top-0 right-0 bottom-0 z-[70] flex flex-col sm:hidden"
        style={{
          width: "min(320px, 90vw)",
          background: "#FFFFFF",
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 200ms ease",
          boxShadow: drawerOpen ? "0 0 40px rgba(14,28,40,0.18)" : "none",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E6E2]">
          <Link
            href="/"
            onClick={() => setDrawerOpen(false)}
            className="focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
            aria-label="Scuba Season — home"
          >
            <span
              style={{
                fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif',
                fontWeight: 400,
                fontSize: "1.125rem",
                letterSpacing: "-0.01em",
                color: "#0E1C28",
              }}
            >
              Scuba Season
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center justify-center w-11 h-11 text-[#4A5568] focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
            aria-label="Close navigation menu"
          >
            <span aria-hidden="true" style={{ fontSize: "1.25rem", lineHeight: 1 }}>&#x2715;</span>
          </button>
        </div>

        {/* Drawer nav links */}
        <nav className="flex-1 flex flex-col px-6 py-8 gap-1" aria-label="Mobile navigation">
          {NAV.map((n) => (
            <Link
              key={n.key}
              href={n.href}
              onClick={() => setDrawerOpen(false)}
              className="py-3 text-lg font-medium focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
              style={{
                color: active === n.key ? "#0E4F6E" : "#0E1C28",
                textDecoration: "none",
                borderBottom: "1px solid #E7E6E2",
              }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Upload CTA — full width yellow at bottom */}
        <div className="px-6 pb-8">
          <Link
            href="/upload"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center justify-center w-full py-3.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
            style={{
              background: "#F6C700",
              color: "#0E1C28",
              borderRadius: "2px",
              textDecoration: "none",
              minHeight: "48px",
            }}
          >
            Upload a sighting
          </Link>
        </div>
      </div>
    </>
  );
}
