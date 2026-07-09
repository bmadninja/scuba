import regionalData from "@/data/reef-check-fish-regional.json";
import type { ReefCheckFishRegional } from "./types";

const records = regionalData as ReefCheckFishRegional[];

const byBasin = new Map<string, ReefCheckFishRegional>();
for (const r of records) {
  byBasin.set(r.basin, r);
}

/**
 * Country → Reef Check ocean basin. Reef Check reports its indicator-fish trends
 * for two basins only: the Indo-Pacific (Indian Ocean plus west and central
 * Pacific, including the Red Sea and Coral Triangle) and the Atlantic/Caribbean.
 * The Eastern Tropical Pacific (Cocos, Galápagos, Malpelo, Revillagigedo, Coiba)
 * is deliberately absent: it is a distinct biogeographic province whose fauna
 * differs from the Indo-Pacific (no bumphead parrotfish, for example), so mapping
 * it onto Indo-Pacific taxa would be wrong. Mixed-ocean countries are resolved
 * per location below, not here.
 */
const COUNTRY_TO_BASIN: Record<string, string> = {
  // Indo-Pacific — Coral Triangle and Southeast Asia
  Indonesia: "indo-pacific",
  Philippines: "indo-pacific",
  Malaysia: "indo-pacific",
  Thailand: "indo-pacific",
  Vietnam: "indo-pacific",
  Cambodia: "indo-pacific",
  Myanmar: "indo-pacific",
  "Papua New Guinea": "indo-pacific",
  "Timor-Leste": "indo-pacific",
  "Solomon Islands": "indo-pacific",
  Brunei: "indo-pacific",
  // Indo-Pacific — East Asia
  Taiwan: "indo-pacific",
  China: "indo-pacific",
  "Hong Kong": "indo-pacific",
  Japan: "indo-pacific",
  "South Korea": "indo-pacific",
  // Indo-Pacific — Pacific islands
  Fiji: "indo-pacific",
  Palau: "indo-pacific",
  "Federated States of Micronesia": "indo-pacific",
  Vanuatu: "indo-pacific",
  "French Polynesia": "indo-pacific",
  Tonga: "indo-pacific",
  Samoa: "indo-pacific",
  Niue: "indo-pacific",
  "Cook Islands": "indo-pacific",
  "New Caledonia": "indo-pacific",
  "Marshall Islands": "indo-pacific",
  Kiribati: "indo-pacific",
  // Indo-Pacific — Australia
  Australia: "indo-pacific",
  // Indo-Pacific — South Asia and Western Indian Ocean
  Maldives: "indo-pacific",
  "Sri Lanka": "indo-pacific",
  India: "indo-pacific",
  "British Indian Ocean Territory": "indo-pacific",
  Seychelles: "indo-pacific",
  Mauritius: "indo-pacific",
  Comoros: "indo-pacific",
  Madagascar: "indo-pacific",
  Tanzania: "indo-pacific",
  Kenya: "indo-pacific",
  Mozambique: "indo-pacific",
  "South Africa": "indo-pacific",
  // Indo-Pacific — Red Sea and Arabian region
  Egypt: "indo-pacific",
  Jordan: "indo-pacific",
  "Saudi Arabia": "indo-pacific",
  Sudan: "indo-pacific",
  Eritrea: "indo-pacific",
  Djibouti: "indo-pacific",
  Israel: "indo-pacific",
  Yemen: "indo-pacific",
  Oman: "indo-pacific",
  "United Arab Emirates": "indo-pacific",
  Bahrain: "indo-pacific",
  Qatar: "indo-pacific",
  Kuwait: "indo-pacific",
  // Atlantic and Caribbean — unambiguous
  Belize: "atlantic",
  Cuba: "atlantic",
  Jamaica: "atlantic",
  Bahamas: "atlantic",
  "Cayman Islands": "atlantic",
  "Dominican Republic": "atlantic",
  "Puerto Rico": "atlantic",
  "British Virgin Islands": "atlantic",
  "United States Virgin Islands": "atlantic",
  Bonaire: "atlantic",
  "Curaçao": "atlantic",
  Aruba: "atlantic",
  "Turks and Caicos Islands": "atlantic",
  Grenada: "atlantic",
  "Saint Lucia": "atlantic",
  Barbados: "atlantic",
  "Trinidad and Tobago": "atlantic",
  "Antigua and Barbuda": "atlantic",
  Dominica: "atlantic",
  Brazil: "atlantic",
};

/**
 * Per-location basin overrides for countries whose reefs straddle two oceans, so
 * we never guess from the country alone. Locations left out of this map in a
 * mixed country get no benchmark. Eastern Tropical Pacific sites are explicitly
 * excluded (value null) rather than forced into an ill-fitting basin.
 */
const LOCATION_BASIN_OVERRIDE: Record<string, string | null> = {
  // Mexico — Caribbean coast vs Pacific Revillagigedo
  "cozumel-mexico": "atlantic",
  "socorro-mexico": null,
  // Colombia — Caribbean vs Eastern Pacific
  "providencia-colombia": "atlantic",
  "malpelo-colombia": null,
  // Honduras and Panama Caribbean coasts
  "utila-honduras": "atlantic",
  "roatan-honduras": "atlantic",
  "bocas-del-toro-panama": "atlantic",
  // Eastern Tropical Pacific — distinct province, no benchmark
  "coiba-panama": null,
  "catalina-islands-costa-rica": null,
  "cocos-costa-rica": null,
  "wolf-galapagos-ecuador": null,
  "darwin-galapagos-ecuador": null,
};

export const getAllReefCheckFishRegional = (): ReefCheckFishRegional[] => records;

/**
 * The Reef Check regional indicator-fish benchmark for a location's ocean basin,
 * or null when the location is outside the two basins Reef Check reports (or in
 * a mixed-ocean country without an explicit override). Display-only context —
 * never a site value and never a reef-state input.
 */
export const getReefCheckFishRegionalForLocation = (loc: {
  country: string;
  locationId: string;
}): ReefCheckFishRegional | null => {
  const override = LOCATION_BASIN_OVERRIDE[loc.locationId];
  const basin =
    override !== undefined ? override : (COUNTRY_TO_BASIN[loc.country] ?? null);
  if (!basin) return null;
  return byBasin.get(basin) ?? null;
};
