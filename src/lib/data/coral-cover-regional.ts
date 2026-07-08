import regionalData from "@/data/coral-cover-regional.json";
import type { CoralRegionalTrend } from "./types";

const records = regionalData as CoralRegionalTrend[];

const byRegion = new Map<string, CoralRegionalTrend>();
for (const r of records) {
  byRegion.set(r.region, r);
}

/**
 * Country → GCRMN world region. Country is the most reliable join key; a few
 * countries straddle regions (Mexico, Colombia) and are resolved to the region
 * that holds the bulk of their reef diving. Countries with no tropical-reef
 * GCRMN region (temperate / cold-water sites) are absent and get no backdrop.
 */
const COUNTRY_TO_REGION: Record<string, string> = {
  // Western Indian Ocean
  Tanzania: "wio-western-indian-ocean",
  Mozambique: "wio-western-indian-ocean",
  Kenya: "wio-western-indian-ocean",
  Madagascar: "wio-western-indian-ocean",
  Seychelles: "wio-western-indian-ocean",
  Mauritius: "wio-western-indian-ocean",
  Comoros: "wio-western-indian-ocean",
  "South Africa": "wio-western-indian-ocean",
  // South Asia
  Maldives: "south-asia",
  "Sri Lanka": "south-asia",
  India: "south-asia",
  "British Indian Ocean Territory": "south-asia",
  // East Asian Seas (Coral Triangle + South China Sea)
  Indonesia: "east-asian-seas",
  Philippines: "east-asian-seas",
  Malaysia: "east-asian-seas",
  Thailand: "east-asian-seas",
  Vietnam: "east-asian-seas",
  Cambodia: "east-asian-seas",
  Taiwan: "east-asian-seas",
  China: "east-asian-seas",
  "Hong Kong": "east-asian-seas",
  Singapore: "east-asian-seas",
  Myanmar: "east-asian-seas",
  Japan: "east-asian-seas",
  "South Korea": "east-asian-seas",
  // Red Sea & Gulf of Aden
  Egypt: "persga-red-sea-gulf-of-aden",
  Jordan: "persga-red-sea-gulf-of-aden",
  "Saudi Arabia": "persga-red-sea-gulf-of-aden",
  Sudan: "persga-red-sea-gulf-of-aden",
  Eritrea: "persga-red-sea-gulf-of-aden",
  Djibouti: "persga-red-sea-gulf-of-aden",
  Israel: "persga-red-sea-gulf-of-aden",
  Yemen: "persga-red-sea-gulf-of-aden",
  // Persian / Arabian Gulf and Gulf of Oman
  "United Arab Emirates": "ropme-persian-arabian-gulf",
  Oman: "ropme-persian-arabian-gulf",
  Bahrain: "ropme-persian-arabian-gulf",
  Qatar: "ropme-persian-arabian-gulf",
  Kuwait: "ropme-persian-arabian-gulf",
  // Australia
  Australia: "australia",
  // Brazil
  Brazil: "brazil",
  // Eastern Tropical Pacific
  Ecuador: "etp-eastern-tropical-pacific",
  "Costa Rica": "etp-eastern-tropical-pacific",
  Panama: "etp-eastern-tropical-pacific",
  // Pacific islands
  Fiji: "pacific",
  "Papua New Guinea": "pacific",
  "Federated States of Micronesia": "pacific",
  Palau: "pacific",
  Vanuatu: "pacific",
  "Solomon Islands": "pacific",
  "French Polynesia": "pacific",
  Tonga: "pacific",
  Samoa: "pacific",
  Niue: "pacific",
  "Cook Islands": "pacific",
  "Marshall Islands": "pacific",
  Tuvalu: "pacific",
  Kiribati: "pacific",
  "New Caledonia": "pacific",
  Guam: "pacific",
  "Northern Mariana Islands": "pacific",
  // Caribbean (incl. tropical West Atlantic)
  Belize: "caribbean",
  Bahamas: "caribbean",
  "Cayman Islands": "caribbean",
  Cuba: "caribbean",
  Honduras: "caribbean",
  "Trinidad and Tobago": "caribbean",
  "Dominican Republic": "caribbean",
  Grenada: "caribbean",
  Bonaire: "caribbean",
  "Curaçao": "caribbean",
  Saba: "caribbean",
  "Sint Eustatius": "caribbean",
  "Saint Lucia": "caribbean",
  "British Virgin Islands": "caribbean",
  Aruba: "caribbean",
  "United States Virgin Islands": "caribbean",
  Anguilla: "caribbean",
  "Saint Kitts and Nevis": "caribbean",
  "Antigua and Barbuda": "caribbean",
  "Saint Vincent and the Grenadines": "caribbean",
  "Sint Maarten": "caribbean",
  Haiti: "caribbean",
  "Puerto Rico": "caribbean",
  "Turks and Caicos Islands": "caribbean",
  "Turks and Caicos": "caribbean",
  Dominica: "caribbean",
  Barbados: "caribbean",
  Bermuda: "caribbean",
  Venezuela: "caribbean",
  Nicaragua: "caribbean",
  Guadeloupe: "caribbean",
  Martinique: "caribbean",
  "Cayman Brac": "caribbean",
};

// A handful of countries straddle two GCRMN regions; disambiguate by the
// location's own region field where the country default would be wrong.
function resolveRegionKey(country: string, region: string | undefined): string | null {
  // Mexico: Caribbean (Cozumel/Yucatán) by default, Pacific (Socorro) → ETP.
  if (country === "Mexico") {
    return region && /pacific/i.test(region) ? "etp-eastern-tropical-pacific" : "caribbean";
  }
  // Colombia: Caribbean (Providencia) by default, Pacific (Malpelo) → ETP.
  if (country === "Colombia") {
    return region && /pacific/i.test(region) ? "etp-eastern-tropical-pacific" : "caribbean";
  }
  // United States: Hawaii → Pacific, Florida/Caribbean → Caribbean, others none.
  if (country === "United States") {
    if (region && /hawaii/i.test(region)) return "pacific";
    if (region && /(florida|caribbean|atlantic)/i.test(region)) return "caribbean";
    return null;
  }
  return COUNTRY_TO_REGION[country] ?? null;
}

export const getAllCoralRegionalTrends = (): CoralRegionalTrend[] => records;

/**
 * The GCRMN regional coral-cover backdrop for a location, if its region has a
 * published trend. Display-only context, never a reef-state input.
 */
export function getRegionalCoralTrendForLocation(location: {
  country: string;
  region?: string;
}): CoralRegionalTrend | null {
  const key = resolveRegionKey(location.country, location.region);
  if (!key) return null;
  return byRegion.get(key) ?? null;
}
