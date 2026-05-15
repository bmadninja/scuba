import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";
import { getAllLocations } from "@/lib/data/locations";
import { getAllSites } from "@/lib/data/sites";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/sites`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
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

  return [...staticRoutes, ...siteRoutes, ...locationRoutes];
}
