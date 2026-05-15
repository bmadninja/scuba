// Affiliate URL tagging. Env vars hold the per-partner tracking IDs.
// When an ID is unset, the original URL is returned untagged (graceful).
// Set env vars on Vercel via dashboard or `vercel env add`. See docs/affiliate-setup.md.

const env = (key: string): string => {
  if (typeof process === "undefined") return "";
  return process.env[key] ?? "";
};

const AMAZON_TAG = env("NEXT_PUBLIC_AMAZON_TAG");
const BOOKING_AID = env("NEXT_PUBLIC_BOOKING_AID");
const PADI_PARTNER = env("NEXT_PUBLIC_PADI_PARTNER");
const TRAVELPAYOUTS_AID = env("NEXT_PUBLIC_TRAVELPAYOUTS_AID");
const LIVEABOARD_AID = env("NEXT_PUBLIC_LIVEABOARD_AID");
const DIVEBOOKER_PID = env("NEXT_PUBLIC_DIVEBOOKER_PID");
const SCUBAPRO_AID = env("NEXT_PUBLIC_SCUBAPRO_AID");

const setParam = (url: string, name: string, value: string): string => {
  if (!value) return url;
  try {
    const u = new URL(url);
    u.searchParams.set(name, value);
    return u.toString();
  } catch {
    // Non-URL or relative — return as-is.
    return url;
  }
};

const setParams = (url: string, params: Record<string, string>): string => {
  if (!Object.values(params).some(Boolean)) return url;
  try {
    const u = new URL(url);
    for (const [k, v] of Object.entries(params)) {
      if (v) u.searchParams.set(k, v);
    }
    return u.toString();
  } catch {
    return url;
  }
};

// Maps the partner label used in sites.json to the tagging strategy.
// New partners: add a case here, an env var above, and document in
// docs/affiliate-setup.md.
export function enhanceAffiliateUrl(url: string, partner: string): string {
  if (!url || url === "#") return url;
  const p = partner.toLowerCase();

  if (p === "amazon" || p.includes("amazon")) {
    return setParam(url, "tag", AMAZON_TAG);
  }
  if (p === "booking.com" || p.includes("booking")) {
    return setParams(url, { aid: BOOKING_AID, label: "scubaseason" });
  }
  if (p === "padi travel" || p === "padi") {
    return setParam(url, "partner", PADI_PARTNER);
  }
  if (p === "skyscanner") {
    // Travelpayouts is the network. The actual deep-link format depends on
    // how you configure Skyscanner-via-Travelpayouts in the dashboard.
    // Most setups accept `marker={aid}` on any Skyscanner URL.
    return setParam(url, "marker", TRAVELPAYOUTS_AID);
  }
  if (p === "liveaboardbookings" || p === "liveaboard.com" || p.includes("liveaboard")) {
    return setParam(url, "partnerid", LIVEABOARD_AID);
  }
  if (p === "divebooker") {
    return setParam(url, "ref", DIVEBOOKER_PID);
  }
  if (p === "scubapro") {
    return setParam(url, "aid", SCUBAPRO_AID);
  }
  if (p === "bluewater travel" || p === "bluewater") {
    // Agency — no programmatic affiliate. Pass through.
    return url;
  }
  if (p === "direct") {
    // Explicitly non-affiliate.
    return url;
  }
  // Unknown partner — pass through.
  return url;
}

// Build a Booking.com search URL for a destination string.
// Useful when you want destination-aware search instead of partner homepage.
export function bookingSearchUrl(query: string): string {
  const u = new URL("https://www.booking.com/searchresults.html");
  u.searchParams.set("ss", query);
  u.searchParams.set("label", "scubaseason");
  if (BOOKING_AID) u.searchParams.set("aid", BOOKING_AID);
  return u.toString();
}

// Build an Amazon search URL for a search term.
export function amazonSearchUrl(searchTerm: string): string {
  const u = new URL("https://www.amazon.com/s");
  u.searchParams.set("k", searchTerm);
  if (AMAZON_TAG) u.searchParams.set("tag", AMAZON_TAG);
  return u.toString();
}

// Build an Amazon product URL from an ASIN.
export function amazonProductUrl(asin: string): string {
  const u = new URL(`https://www.amazon.com/dp/${asin}`);
  if (AMAZON_TAG) u.searchParams.set("tag", AMAZON_TAG);
  return u.toString();
}

// Returns which partner programs have IDs configured. Useful for the
// /about disclosure page and for debug.
export const configuredPartners = {
  amazon: Boolean(AMAZON_TAG),
  booking: Boolean(BOOKING_AID),
  padi: Boolean(PADI_PARTNER),
  travelpayouts: Boolean(TRAVELPAYOUTS_AID),
  liveaboard: Boolean(LIVEABOARD_AID),
  divebooker: Boolean(DIVEBOOKER_PID),
  scubapro: Boolean(SCUBAPRO_AID),
};
