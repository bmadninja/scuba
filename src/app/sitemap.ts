import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";
import { getAllLocations } from "@/lib/data/locations";
import { getAllSites } from "@/lib/data/sites";
import { getAllEncounters } from "@/lib/data/encounters";

const CERTS = [
  "never-dived","open-water","advanced","rescue","divemaster","tech",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/sites`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/encounters`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const siteRoutes: MetadataRoute.Sitemap = getAllSites().map((s) => ({
    url: `${SITE_URL}/sites/${s.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const locationRoutes: MetadataRoute.Sitemap = getAllLocations().map((l) => ({
    url: `${SITE_URL}/locations/${l.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const encounterRoutes: MetadataRoute.Sitemap = getAllEncounters().map((e) => ({
    url: `${SITE_URL}/encounters/${e.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  // M3 Phase 11: SEO landing pages
  const speciesLandingRoutes: MetadataRoute.Sitemap = getAllEncounters().map(
    (e) => ({
      url: `${SITE_URL}/where-to-see/${e.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    }),
  );

  const certLandingRoutes: MetadataRoute.Sitemap = CERTS.map((c) => ({
    url: `${SITE_URL}/for/${c}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    ...siteRoutes,
    ...locationRoutes,
    ...encounterRoutes,
    ...speciesLandingRoutes,
    ...certLandingRoutes,
  ];
}
