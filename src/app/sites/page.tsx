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
    <>
      {/* Dark ink header */}
      <div
        style={{
          background: "#0b1e32",
          padding: "3.5rem 3rem 3rem",
        }}
      >
        <div
          style={{ maxWidth: 1320, margin: "0 auto" }}
        >
          <p
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#0089de",
              marginBottom: "0.5rem",
            }}
          >
            Catalogue
          </p>
          <h1
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              color: "#fff",
              marginBottom: "0.75rem",
            }}
          >
            Dive sites
          </h1>
          <p
            style={{
              fontFamily:
                "var(--font-serif), 'Source Serif 4', Georgia, serif",
              fontStyle: "italic",
              fontSize: "1rem",
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.5)",
              maxWidth: 480,
            }}
          >
            {sites.length} curated sites. Search by name, species, or
            location — or filter by cert level and dive type.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <Suspense fallback={null}>
          <SitesExplorer
            sites={sites}
            locationsById={locationsById}
            currentMonth={currentMonth}
          />
        </Suspense>
      </div>
    </>
  );
}
