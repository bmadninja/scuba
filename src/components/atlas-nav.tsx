"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Logo } from "@/components/logo";

type SearchEntry = {
  slug: string;
  name: string;
  country: string;
  region: string;
  state: string;
};

const NAV = [
  { href: "/", label: "Atlas", key: "atlas" },
  { href: "/data", label: "Method", key: "method" },
  { href: "/about", label: "About", key: "about" },
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

export function AtlasNav({ entries = [] }: { entries?: SearchEntry[] }) {
  const pathname = usePathname();
  const router = useRouter();
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
          (r.name + " " + r.country + " " + r.region).toLowerCase().includes(query),
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
        // No selection — route to search results page
        setOpen(false);
        router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        setQ("");
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1320px] items-center gap-6 px-7 py-3">
        <Link href="/" className="shrink-0" aria-label="scubaSeason.fun — home">
          <Logo size={28} />
        </Link>

        <div ref={wrapRef} className="relative ml-auto w-full max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
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
            placeholder="Search reefs by name, country or region"
            aria-label="Search reefs"
            className="w-full rounded-full border border-slate-200 bg-[#f1f7fb] py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#0089de] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0089de]/30"
          />

          {open && query && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
              {results.length ? (
                <ul className="max-h-80 overflow-y-auto py-1">
                  {results.map((r, i) => (
                    <li key={r.slug}>
                      <button
                        type="button"
                        onMouseEnter={() => setSel(i)}
                        onClick={() => go(r)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${
                          i === sel ? "bg-[#f1f7fb]" : ""
                        }`}
                      >
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            STATE_PILL[r.state] ?? "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {STATE_TEXT[r.state] ?? r.state}
                        </span>
                        <span className="text-sm font-medium text-slate-900">{r.name}</span>
                        <span className="ml-auto text-xs text-slate-500">{r.country}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-4 text-center text-sm text-slate-500">
                  No reefs match &ldquo;{q}&rdquo;.
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="hidden shrink-0 items-center gap-1 sm:flex" aria-label="Main navigation">
          {NAV.map((n) => (
            <Link
              key={n.key}
              href={n.href}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                active === n.key
                  ? "text-[#0089de]"
                  : "text-slate-700 hover:text-[#0089de]"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
