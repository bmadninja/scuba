"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Header search input that drives the home page's location filter via the
 * `?q=` URL param. Reads the initial value from `window.location.search` on
 * mount rather than `useSearchParams`, so we don't force Next.js to bail
 * static prerendering to CSR for every page that includes the header.
 */
export function HeaderSearchBar() {
  const router = useRouter();
  const [value, setValue] = useState(() => readSearchQuery());

  // Hydrate from the URL once on mount, and keep in sync with back/forward.
  useEffect(() => {
    const onPop = () => setValue(readSearchQuery());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Debounce URL writes so each keystroke doesn't push a new history entry.
  useEffect(() => {
    const urlQuery =
      new URLSearchParams(window.location.search).get("q") ?? "";
    if (value === urlQuery) return;
    const handle = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (value.trim() === "") {
        params.delete("q");
      } else {
        params.set("q", value);
      }
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    }, 150);
    return () => clearTimeout(handle);
  }, [value, router]);

  return (
    <label className="relative block w-44 sm:w-64">
      <span className="sr-only">Search dive locations</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      >
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="m14 14 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search locations…"
        className="w-full rounded-full border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0089de]"
      />
    </label>
  );
}

function readSearchQuery() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") ?? "";
}
