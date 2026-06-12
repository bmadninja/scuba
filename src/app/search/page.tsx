"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";

// Types for search results
type ResultItem = {
  type: "location" | "site";
  slug: string;
  href: string;
  name: string;
  subtext: string;
  reefState?: string;
};

type SpeciesResultItem = {
  commonName: string;
  scientificName?: string;
  href: string;
  siteCount: number;
  firstSiteName: string;
};

function slugifySpecies(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const STATE_TEXT: Record<string, string> = {
  thriving: "Thriving",
  pressure: "Under pressure",
  change: "Witnessing change",
};

const STATE_COLOR: Record<string, string> = {
  thriving: "#10b981",
  pressure: "#00d4ff",
  change: "#f43f5e",
};

function SearchInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") ?? "";
  const [q, setQ] = useState(initialQ);

  // Sync q when URL param changes (e.g. navigating from nav dropdown while already on /search)
  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);
  const [results, setResults] = useState<{
    locations: ResultItem[];
    sites: ResultItem[];
    species: SpeciesResultItem[];
  }>({ locations: [], sites: [], species: [] });

  // Perform search against all data
  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults({ locations: [], sites: [], species: [] });
      return;
    }
    const term = query.trim().toLowerCase();

    // Dynamic import to keep server bundle small
    const [
      { getAllAtlasLocations },
      { getAllSites },
      { getLocationById },
    ] = await Promise.all([
      import("@/lib/atlas-location"),
      import("@/lib/data/sites"),
      import("@/lib/data/locations"),
    ]);

    const matchLocation = (s: string) => s.toLowerCase().includes(term);

    // Locations
    const locationResults: ResultItem[] = getAllAtlasLocations()
      .filter(
        (l) =>
          matchLocation(l.name) ||
          matchLocation(l.country) ||
          matchLocation(l.region) ||
          matchLocation(l.description),
      )
      .slice(0, 8)
      .map((l) => ({
        type: "location" as const,
        slug: l.slug,
        href: `/locations/${l.slug}`,
        name: l.name,
        subtext: `${l.country} · ${l.region}`,
        reefState: l.state,
      }));

    // Sites
    const siteResults: ResultItem[] = getAllSites()
      .filter((s) => {
        const loc = getLocationById(s.locationId);
        return (
          matchLocation(s.name) ||
          matchLocation(s.description) ||
          matchLocation(loc?.name ?? "") ||
          matchLocation(loc?.country ?? "") ||
          s.species.some(
            (sp) =>
              matchLocation(sp.commonName) ||
              matchLocation(sp.scientificName ?? ""),
          )
        );
      })
      .slice(0, 8)
      .map((s) => {
        const loc = getLocationById(s.locationId);
        return {
          type: "site" as const,
          slug: s.slug,
          href: `/sites/${s.slug}`,
          name: s.name,
          subtext: loc ? `${loc.name}, ${loc.country}` : s.locationId,
        };
      });

    // Species — collect unique species across all sites, deduplicate by common name
    const speciesMap = new Map<
      string,
      { commonName: string; scientificName?: string; sites: { slug: string; name: string }[] }
    >();
    for (const site of getAllSites()) {
      for (const sp of site.species) {
        const key = sp.commonName.toLowerCase();
        if (
          !matchLocation(sp.commonName) &&
          !matchLocation(sp.scientificName ?? "")
        )
          continue;
        if (!speciesMap.has(key)) {
          speciesMap.set(key, {
            commonName: sp.commonName,
            scientificName: sp.scientificName,
            sites: [],
          });
        }
        speciesMap.get(key)!.sites.push({ slug: site.slug, name: site.name });
      }
    }
    const speciesResults: SpeciesResultItem[] = Array.from(speciesMap.values())
      .slice(0, 8)
      .map((sp) => ({
        commonName: sp.commonName,
        scientificName: sp.scientificName,
        href: `/sites/${sp.sites[0].slug}/species/${slugifySpecies(sp.commonName)}`,
        siteCount: sp.sites.length,
        firstSiteName: sp.sites[0].name,
      }));

    setResults({
      locations: locationResults,
      sites: siteResults,
      species: speciesResults,
    });
  }, []);

  useEffect(() => {
    doSearch(q);
  }, [q, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      router.replace(`/search?q=${encodeURIComponent(q.trim())}`, { scroll: false });
    }
  };

  const total =
    results.locations.length + results.sites.length + results.species.length;
  const hasQuery = q.trim().length > 0;
  const noResults = hasQuery && total === 0;

  function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <strong style={{ color: "#00d4ff", fontWeight: 700 }}>
          {text.slice(idx, idx + query.length)}
        </strong>
        {text.slice(idx + query.length)}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Header */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-[#8b9db8]">
        <Link href="/" className="transition hover:text-[#00d4ff]">
          ← Atlas
        </Link>
      </nav>

      <h1 className="mb-6 text-3xl font-bold tracking-tight text-[#f0f4f8]">
        Search
      </h1>

      {/* Search input */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#8b9db8]">
            <svg
              width="18"
              height="18"
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
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search locations, sites, or species…"
            aria-label="Search reefs"
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-4 text-base text-[#f0f4f8] placeholder:text-[#8b9db8] focus:border-[#00d4ff] focus:bg-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/30"
            autoFocus
          />
        </div>
      </form>

      {/* No-results state */}
      {noResults && (
        <div className="py-12 text-center">
          <p className="text-lg font-semibold text-[#f0f4f8]">
            No results for &ldquo;{q}&rdquo;
          </p>
          <p className="mt-2 text-sm text-[#8b9db8]">
            Try searching for a location name, species common name, or a country.
          </p>
        </div>
      )}

      {/* Results */}
      {!noResults && hasQuery && (
        <div className="space-y-8">
          {/* Locations */}
          {results.locations.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#8b9db8]">
                  Locations
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-[#8b9db8]">
                  {results.locations.length}
                </span>
              </div>
              <ul className="space-y-1">
                {results.locations.map((r) => (
                  <li key={r.href}>
                    <Link
                      href={r.href}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/5"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-[#f0f4f8] group-hover:text-[#00d4ff]">
                          {highlightMatch(r.name, q)}
                        </span>
                        <span className="block text-xs text-[#8b9db8]">
                          {r.subtext}
                        </span>
                      </span>
                      {r.reefState && (
                        <span
                          className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{
                            background: `${STATE_COLOR[r.reefState]}18`,
                            color: STATE_COLOR[r.reefState],
                          }}
                        >
                          {STATE_TEXT[r.reefState]}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Sites */}
          {results.sites.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#8b9db8]">
                  Dive sites
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-[#8b9db8]">
                  {results.sites.length}
                </span>
              </div>
              <ul className="space-y-1">
                {results.sites.map((r) => (
                  <li key={r.href}>
                    <Link
                      href={r.href}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/5"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-[#f0f4f8] group-hover:text-[#00d4ff]">
                          {highlightMatch(r.name, q)}
                        </span>
                        <span className="block text-xs text-[#8b9db8]">
                          {r.subtext}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Species */}
          {results.species.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#8b9db8]">
                  Species
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-[#8b9db8]">
                  {results.species.length}
                </span>
              </div>
              <ul className="space-y-1">
                {results.species.map((r) => (
                  <li key={r.commonName}>
                    <Link
                      href={r.href}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/5"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-[#f0f4f8] group-hover:text-[#00d4ff]">
                          {highlightMatch(r.commonName, q)}
                        </span>
                        <span className="block text-xs text-[#8b9db8]">
                          {r.scientificName && (
                            <span className="italic">{r.scientificName} · </span>
                          )}
                          {r.siteCount === 1
                            ? r.firstSiteName
                            : `${r.firstSiteName} + ${r.siteCount - 1} more site${r.siteCount > 2 ? "s" : ""}`}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

        </div>
      )}

      {/* Default state — no query */}
      {!hasQuery && (
        <p className="text-sm text-[#8b9db8]">
          Search across{" "}
          <span className="font-semibold text-[#aebcd0]">locations</span>,{" "}
          <span className="font-semibold text-[#aebcd0]">dive sites</span>, and{" "}
          <span className="font-semibold text-[#aebcd0]">species</span>.
        </p>
      )}
    </div>
  );
}

import React from "react";

export default function SearchPage() {
  return (
    <Suspense>
      <SearchInner />
    </Suspense>
  );
}
