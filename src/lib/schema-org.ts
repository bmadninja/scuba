// Schema.org JSON-LD builders. Output is embedded as <script
// type="application/ld+json"> on relevant pages so Google + LLMs can
// extract structured data.

import { SITE_NAME, SITE_URL } from "./site-config";
import type { Encounter, Location, Site } from "./data/types";

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

// --- SEO landing-page schema builders (M3 Phase 11) ---

type CollectionItem = { name: string; url: string };

export function collectionPageSchema({
  headline,
  description,
  url,
  image,
  items,
}: {
  headline: string;
  description: string;
  url: string;
  image?: string;
  items: CollectionItem[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: headline,
    headline,
    description,
    url,
    image,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        url: it.url,
      })),
    },
  };
}

export function speciesLandingSchema(
  e: Encounter,
  locations: { name: string; slug: string }[],
) {
  const seasonReadable =
    e.bestMonths.length === 12
      ? "Year-round"
      : e.bestMonths.map((m) => MONTHS[m - 1]).join(", ");
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Where to see ${e.name} in 2026`,
    headline: `Where to see ${e.name} in 2026`,
    description: e.shortDescription,
    url: `${SITE_URL}/where-to-see/${e.slug}`,
    image: e.heroImageUrl,
    about: e.speciesScientific
      ? { "@type": "Taxon", name: e.speciesScientific }
      : undefined,
    keywords: [
      `where to see ${e.speciesCommon ?? e.name}`,
      `${e.speciesCommon ?? e.name} diving`,
      "best dive trips 2026",
      "scuba diving",
    ]
      .filter(Boolean)
      .join(", "),
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Best season",
        value: seasonReadable,
      },
      {
        "@type": "PropertyValue",
        name: "Difficulty",
        value: e.difficulty,
      },
    ],
    mainEntity: {
      "@type": "ItemList",
      itemListElement: locations.map((l, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: l.name,
        url: `${SITE_URL}/locations/${l.slug}`,
      })),
    },
  };
}


export function certLandingSchema({
  cert,
  certLabel,
  description,
  locations,
}: {
  cert: string;
  certLabel: string;
  description: string;
  locations: { name: string; slug: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Best dive trips for ${certLabel}`,
    headline: `Best dive trips for ${certLabel}`,
    description,
    url: `${SITE_URL}/for/${cert}`,
    keywords: [
      `${certLabel} dive trips`,
      `dive sites for ${certLabel}`,
      `scuba travel ${certLabel}`,
    ].join(", "),
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Certification level",
        value: certLabel,
      },
    ],
    mainEntity: {
      "@type": "ItemList",
      itemListElement: locations.map((l, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: l.name,
        url: `${SITE_URL}/locations/${l.slug}`,
      })),
    },
  };
}

export function encounterSchema(e: Encounter) {
  const seasonReadable =
    e.bestMonths.length === 12
      ? "Year-round"
      : e.bestMonths.map((m) => MONTHS[m - 1]).join(", ");
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: e.name,
    description: e.shortDescription,
    url: `${SITE_URL}/encounters/${e.slug}`,
    image: e.heroImageUrl,
    articleSection: "Bucket-list dive encounters",
    about: e.speciesScientific
      ? { "@type": "Taxon", name: e.speciesScientific }
      : undefined,
    keywords: [
      e.category.replace(/-/g, " "),
      e.speciesCommon,
      e.difficulty,
      "scuba diving",
    ]
      .filter(Boolean)
      .join(", "),
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Best season",
        value: seasonReadable,
      },
      {
        "@type": "PropertyValue",
        name: "Required experience",
        value: e.difficulty,
      },
      {
        "@type": "PropertyValue",
        name: "Evidence confidence",
        value: e.confidence,
      },
    ],
  };
}
