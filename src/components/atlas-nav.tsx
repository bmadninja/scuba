"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Logo } from "@/components/logo";
import { useNavContext } from "@/components/nav-context";

type SearchEntry = {
  slug: string;
  name: string;
  country: string;
  region: string;
  state: string;
};

const NAV = [
  { href: "/data",  label: "Method", key: "method" },
  { href: "/about", label: "About",  key: "about"  },
];

const STATE_TEXT: Record<string, string> = {
  thriving: "Thriving",
  pressure: "Under pressure",
  change: "Witnessing change",
};

const STATE_PILL: Record<string, string> = {
  thriving: "bg-emerald-500/15 text-emerald-300",
  pressure: "bg-amber-500/15 text-amber-300",
  change: "bg-rose-500/15 text-rose-300",
};

/**
 * Hamburger menu shown only below the `sm` breakpoint, where the inline nav
 * links are hidden. Surfaces the same NAV destinations in a dropdown so the
 * header is navigable on phones.
 */
function MobileNavMenu({
  active = "",
  dark = false,
}: {
  active?: string;
  dark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0 sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{
          color: dark ? "rgba(255,255,255,0.85)" : "#aebcd0",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {open ? (
            <>
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </>
          ) : (
            <>
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[160px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a1628] shadow-md">
          <nav
            aria-label="Mobile navigation"
            className="flex flex-col py-1"
          >
            {NAV.map((n) => (
              <Link
                key={n.key}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`px-4 py-2.5 text-sm font-medium ${
                  active === n.key ? "text-[#00d4ff]" : "text-[#f0f4f8]"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}

type AtlasNavProps = {
  entries?: SearchEntry[];
  /**
   * "default" — sticky white nav (used by layout for every page)
   * "hero"    — absolutely-positioned transparent nav for homepage hero
   */
  variant?: "default" | "hero";
};

/**
 * Hero-variant nav: rendered inside the homepage hero section.
 * Transparent background, white text, position absolute.
 * Transitions to the sticky layout nav once the hero scrolls out of view
 * (the layout nav is always present; hero nav is hidden after the hero section
 * leaves the viewport using an IntersectionObserver).
 */
function HeroNav({ entries = [] }: { entries: SearchEntry[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const [visible, setVisible] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Hide hero nav once the hero section scrolls out of view so the
  // layout's sticky white nav takes over cleanly.
  useEffect(() => {
    // The sentinel is the bottom of the hero section.  We look for it by
    // finding the nearest <section aria-label="Hero"> ancestor of this nav.
    const heroSection = document.querySelector<HTMLElement>(
      "section[aria-label='Hero']",
    );
    if (!heroSection) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" },
    );
    observer.observe(heroSection);
    return () => observer.disconnect();
  }, []);

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

  if (!visible) return <div ref={sentinelRef} />;

  return (
    <div
      ref={sentinelRef}
      className="absolute inset-x-0 top-0 z-50 flex items-center gap-3 px-5 py-4 sm:gap-8 sm:px-12 sm:py-5"
    >
      <Link href="/" aria-label="scubaSeason.fun — home" style={{ flexShrink: 0 }}>
        <Logo size={28} dark />
      </Link>

      {/* Search */}
      <div
        ref={wrapRef}
        style={{ position: "relative", marginLeft: "auto", width: "100%", maxWidth: 300 }}
      >
        <div
          className="pointer-events-none absolute inset-y-0 flex items-center"
          style={{ left: "0.875rem", color: "rgba(255,255,255,0.4)" }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
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
          placeholder="Search"
          aria-label="Search reefs"
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: 999,
            padding: "0.5rem 1rem 0.5rem 2.5rem",
            fontSize: "0.8125rem",
            fontFamily: "inherit",
            color: "rgba(255,255,255,0.55)",
            outline: "none",
          }}
        />

        {open && query && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#0a1628] shadow-md">
            {results.length ? (
              <ul className="max-h-80 overflow-y-auto py-1">
                {results.map((r, i) => (
                  <li key={r.slug}>
                    <button
                      type="button"
                      onMouseEnter={() => setSel(i)}
                      onClick={() => go(r)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${
                        i === sel ? "bg-white/5" : ""
                      }`}
                    >
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          STATE_PILL[r.state] ?? "bg-white/10 text-[#8b9db8]"
                        }`}
                      >
                        {STATE_TEXT[r.state] ?? r.state}
                      </span>
                      <span className="text-sm font-medium text-[#f0f4f8]">
                        {r.name}
                      </span>
                      <span className="ml-auto text-xs text-[#8b9db8]">
                        {r.country}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-4 text-center text-sm text-[#8b9db8]">
                No reefs match &ldquo;{q}&rdquo;.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav
        className="hidden shrink-0 items-center sm:flex"
        style={{ gap: "0.125rem" }}
        aria-label="Main navigation"
      >
        {NAV.map((n) => (
          <Link
            key={n.key}
            href={n.href}
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "rgba(255,255,255,0.65)",
              textDecoration: "none",
              padding: "0.45rem 0.875rem",
              borderRadius: 999,
            }}
          >
            {n.label}
          </Link>
        ))}
      </nav>

      <MobileNavMenu dark />
    </div>
  );
}

export function AtlasNav({ entries = [], variant = "default" }: AtlasNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { breadcrumbs, hideLayoutNav } = useNavContext();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  // Hero variant is rendered from within the page's hero section directly
  if (variant === "hero") {
    return <HeroNav entries={entries} />;
  }

  // Hide the layout nav when the page is rendering its own hero nav
  if (hideLayoutNav) return null;

  return (
    <header className="sticky top-0 z-50 bg-[#030712]/80 backdrop-blur border-b border-white/10">
      <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-5 py-4 sm:gap-8 sm:px-12">

        <Link href="/" className="shrink-0" aria-label="scubaSeason.fun — home">
          <Logo size={28} />
        </Link>

        {/* Breadcrumbs (location / site pages) */}
        {breadcrumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="hidden items-center sm:flex"
            style={{
              gap: "0.5rem",
              fontSize: "0.8125rem",
              color: "#8b9db8",
              marginLeft: "0.5rem",
            }}
          >
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-0.5">
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    style={{ color: "rgba(0,212,255,0.28)", marginRight: "0.25rem" }}
                  >
                    /
                  </span>
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    style={{
                      color: "#8b9db8",
                      textDecoration: "none",
                    }}
                    className="hover:text-[#00d4ff] transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span style={{ color: "#f0f4f8", fontWeight: 500 }}>
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}

        <div
          ref={wrapRef}
          className="relative ml-auto"
          style={{ width: "100%", maxWidth: "300px" }}
        >
          <div
            className="pointer-events-none absolute inset-y-0 flex items-center"
            style={{ left: "0.875rem", color: "#8b9db8" }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
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
            placeholder="Search"
            aria-label="Search reefs"
            className="w-full rounded-full border border-white/10 bg-white/5 pr-4 text-[#f0f4f8] placeholder:text-[#8b9db8] focus:border-[#00d4ff] focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/30"
            style={{
              padding: "0.5rem 1rem 0.5rem 2.5rem",
              fontSize: "0.8125rem",
            }}
          />

          {open && query && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#0a1628] shadow-md">
              {results.length ? (
                <ul className="max-h-80 overflow-y-auto py-1">
                  {results.map((r, i) => (
                    <li key={r.slug}>
                      <button
                        type="button"
                        onMouseEnter={() => setSel(i)}
                        onClick={() => go(r)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${
                          i === sel ? "bg-white/5" : ""
                        }`}
                      >
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            STATE_PILL[r.state] ?? "bg-white/10 text-[#8b9db8]"
                          }`}
                        >
                          {STATE_TEXT[r.state] ?? r.state}
                        </span>
                        <span className="text-sm font-medium text-[#f0f4f8]">
                          {r.name}
                        </span>
                        <span className="ml-auto text-xs text-[#8b9db8]">
                          {r.country}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-4 text-center text-sm text-[#8b9db8]">
                  No reefs match &ldquo;{q}&rdquo;.
                </div>
              )}
            </div>
          )}
        </div>

        <nav
          className="hidden shrink-0 items-center sm:flex"
          style={{ gap: "0.125rem" }}
          aria-label="Main navigation"
        >
          {NAV.map((n) => (
            <Link
              key={n.key}
              href={n.href}
              className={`text-sm font-medium transition-colors ${
                active === n.key
                  ? "text-[#00d4ff]"
                  : "text-[#aebcd0] hover:text-[#f0f4f8]"
              }`}
              style={{ padding: "0.45rem 0.875rem" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <MobileNavMenu active={active} />
      </div>
    </header>
  );
}
