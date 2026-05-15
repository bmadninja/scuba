// Schema.org JSON-LD builders. Output is embedded as <script
// type="application/ld+json"> on relevant pages so Google + LLMs can
// extract structured data.

import { SITE_NAME, SITE_URL } from "./site-config";
import type { Location, Site } from "./data/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function siteSchema(site: Site, location: Location | null) {
  const seasonReadable = site.bestMonths.map((m) => MONTHS[m - 1]).join(", ");
  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: site.name,
    description: site.description,
    url: `${SITE_URL}/sites/${site.slug}`,
    image: site.heroImageUrl,
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.lat,
      longitude: site.lng,
    },
    address: location
      ? {
          "@type": "PostalAddress",
          addressCountry: location.countryCode,
          addressRegion: location.region,
          addressLocality: location.name,
        }
      : undefined,
    touristType: humanSkillLevel(site.skillLevel),
    publicAccess: true,
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Depth range",
        value: `${site.depthRange.min}-${site.depthRange.max} m`,
      },
      {
        "@type": "PropertyValue",
        name: "Best months",
        value: seasonReadable,
      },
      {
        "@type": "PropertyValue",
        name: "Dive types",
        value: site.diveTypes.map(humanDiveType).join(", "),
      },
      {
        "@type": "PropertyValue",
        name: "Species",
        value: site.species.map((s) => s.commonName).join(", "),
      },
    ],
  };
}

export function locationSchema(location: Location, childSiteCount: number) {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: location.name,
    description: location.description,
    url: `${SITE_URL}/locations/${location.slug}`,
    image: location.heroImageUrl,
    geo: {
      "@type": "GeoCoordinates",
      latitude: location.lat,
      longitude: location.lng,
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: location.countryCode,
      addressRegion: location.region,
    },
    containsPlace: childSiteCount > 0 ? `${childSiteCount} dive sites` : undefined,
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Research-grade dive trip planning. Find dive sites by species, season, conditions and skill level.",
    email: "hi@scubaseason.fun",
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/sites?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

function humanSkillLevel(level: string): string {
  switch (level) {
    case "never-dived":
      return "Never dived / discover scuba";
    case "open-water":
      return "Open Water certified";
    case "advanced":
      return "Advanced Open Water";
    case "rescue":
      return "Rescue diver";
    case "divemaster":
      return "Divemaster";
    case "tech":
      return "Technical diver";
    default:
      return level;
  }
}

function humanDiveType(t: string): string {
  return t.replace("-", " ");
}
