import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { SitesExplorer } from "@/components/sites-explorer";
import { getAllSites } from "@/lib/data/sites";
import { getAllLocations } from "@/lib/data/locations";
import type { Location } from "@/lib/data/types";

export const metadata: Metadata = {
  title: "Dive sites | scubaSeason.fun",
  description:
    "Browse curated dive sites by species, conditions, and skill level. Plan trips end-to-end with operators, lodging and gear.",
};

export default function SitesPage() {
  const sites = getAllSites();
  const locations = getAllLocations();
  const locationsById: Record<string, Location> = Object.fromEntries(
    locations.map((l) => [l.id, l]),
  );
  const currentMonth = new Date().getUTCMonth() + 1;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-slate-900">
              scubaSeason<span className="text-[#0089de]">.fun</span>
            </span>
          </Link>
          <nav className="hidden gap-6 text-sm font-medium text-slate-700 sm:flex">
            <Link href="/sites" className="text-[#0089de]">
              Dive sites
            </Link>
            <Link href="/about" className="hover:text-[#0089de]">
              About
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0089de]">
            Catalogue
          </p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
            All dive sites
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
            Search across every curated dive site. Filter by cert level, dive type,
            or what&rsquo;s in season this month.
          </p>
        </div>

        <Suspense fallback={null}>
          <SitesExplorer
            sites={sites}
            locationsById={locationsById}
            currentMonth={currentMonth}
          />
        </Suspense>
      </main>
    </div>
  );
}
