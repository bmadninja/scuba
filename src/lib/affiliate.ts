// Affiliate URL tagging. Env vars hold the per-partner tracking IDs.
// When an ID is unset, the URL is returned with the right search context
// but without the tag — clicks still go to the right page.
//
// Two-step transform:
//   1) detect partner-homepage URLs and rewrite to a relevant search/destination URL
//      using the link's label as the query.
//   2) append the partner's tracking parameter.
//
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
    return url;
  }
};

const setParams = (url: string, params: Record<string, string>): string => {
  if (!Object.values(params).some(Boolean)) return url;
  try {
    const u = new URL(url);
    for (const [k, v] of Object.entries(params)) if (v) u.searchParams.set(k, v);
    return u.toString();
  } catch {
    return url;
  }
};

// Strips parenthetical clarifiers like "(luxury, house reef)" from labels
// so search engines actually find the property name.
const cleanQuery = (label: string): string =>
  label
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();

const isHomepage = (urlStr: string, ...hosts: string[]): boolean => {
  try {
    const u = new URL(urlStr);
    if (!hosts.some((h) => u.hostname === h || u.hostname.endsWith("." + h))) {
      return false;
    }
    // Homepage = no path beyond "/" and no search params.
    return (u.pathname === "/" || u.pathname === "") && !u.search;
  } catch {
    return false;
  }
};

// Detect Amazon URL — homepage *or* search/dp with no tag set.
const isAmazon = (urlStr: string): boolean => {
  try {
    const u = new URL(urlStr);
    return u.hostname === "amazon.com" || u.hostname.endsWith(".amazon.com");
  } catch {
    return false;
  }
};

// ---------- Search-URL builders per partner ----------

function bookingSearchFor(query: string): string {
  const u = new URL("https://www.booking.com/searchresults.html");
  u.searchParams.set("ss", query);
  u.searchParams.set("label", "scubaseason");
  if (BOOKING_AID) u.searchParams.set("aid", BOOKING_AID);
  return u.toString();
}

function amazonSearchFor(query: string): string {
  const u = new URL("https://www.amazon.com/s");
  u.searchParams.set("k", query);
  if (AMAZON_TAG) u.searchParams.set("tag", AMAZON_TAG);
  return u.toString();
}

function liveaboardSearchFor(query: string): string {
  const u = new URL("https://www.liveaboard.com/diving/search");
  u.searchParams.set("destination", query);
  if (LIVEABOARD_AID) u.searchParams.set("partnerid", LIVEABOARD_AID);
  return u.toString();
}

function padiSearchFor(query: string): string {
  // PADI's travel search is a SPA — search-by-URL doesn't work. Best we can do
  // is land users on the dive-shop locator with the query as a hint.
  const u = new URL("https://www.padi.com/dive-shop-locator");
  u.searchParams.set("q", query);
  if (PADI_PARTNER) u.searchParams.set("partner", PADI_PARTNER);
  return u.toString();
}

function bluewaterSearchFor(query: string): string {
  const u = new URL("https://www.bluewaterdivetravel.com/");
  u.searchParams.set("s", query);
  return u.toString();
}

function divebookerSearchFor(query: string): string {
  const u = new URL("https://www.divebooker.com/");
  u.searchParams.set("s", query);
  if (DIVEBOOKER_PID) u.searchParams.set("afid", DIVEBOOKER_PID);
  return u.toString();
}

function scubaproSearchFor(query: string): string {
  const u = new URL("https://www.scubapro.com/en-US/search/");
  u.searchParams.set("q", query);
  if (SCUBAPRO_AID) u.searchParams.set("aid", SCUBAPRO_AID);
  return u.toString();
}

// ---------- Main enhancer ----------

export function enhanceAffiliateUrl(
  url: string,
  partner: string,
  query?: string,
): string {
  if (!url || url === "#") return url;
  const p = partner.toLowerCase();
  const q = query ? cleanQuery(query) : "";

  // Order matters — match the most specific partner names FIRST so that
  // e.g. "liveaboardbookings" doesn't get caught by a loose "booking" check.

  if (p.startsWith("liveaboard") || p === "liveaboardbookings") {
    if (isHomepage(url, "liveaboard.com", "liveaboardbookings.com") && q)
      return liveaboardSearchFor(q);
    return setParam(url, "partnerid", LIVEABOARD_AID);
  }

  if (p === "divebooker") {
    if (isHomepage(url, "divebooker.com") && q) return divebookerSearchFor(q);
    return setParam(url, "afid", DIVEBOOKER_PID);
  }

  if (p === "scubapro") {
    if (isHomepage(url, "scubapro.com") && q) return scubaproSearchFor(q);
    return setParam(url, "aid", SCUBAPRO_AID);
  }

  if (p.startsWith("bluewater")) {
    if (isHomepage(url, "bluewaterdivetravel.com") && q) return bluewaterSearchFor(q);
    return url;
  }

  if (p === "padi travel" || p === "padi") {
    if (isHomepage(url, "padi.com", "travel.padi.com") && q) return padiSearchFor(q);
    return setParam(url, "partner", PADI_PARTNER);
  }

  // Amazon — always rewrite to search with tag if hitting a homepage.
  if (p === "amazon" || isAmazon(url)) {
    if (isHomepage(url, "amazon.com") && q) return amazonSearchFor(q);
    return setParam(url, "tag", AMAZON_TAG);
  }

  if (p === "booking.com" || p === "booking") {
    if (isHomepage(url, "booking.com") && q) return bookingSearchFor(q);
    return setParams(url, { aid: BOOKING_AID, label: "scubaseason" });
  }

  if (p === "direct") return url;

  return url;
}

// Public builder helpers (kept for explicit callers).
export const bookingSearchUrl = bookingSearchFor;
export const amazonSearchUrl = amazonSearchFor;

export function amazonProductUrl(asin: string): string {
  const u = new URL(`https://www.amazon.com/dp/${asin}`);
  if (AMAZON_TAG) u.searchParams.set("tag", AMAZON_TAG);
  return u.toString();
}

export const configuredPartners = {
  amazon: Boolean(AMAZON_TAG),
  booking: Boolean(BOOKING_AID),
  padi: Boolean(PADI_PARTNER),
  travelpayouts: Boolean(TRAVELPAYOUTS_AID),
  liveaboard: Boolean(LIVEABOARD_AID),
  divebooker: Boolean(DIVEBOOKER_PID),
  scubapro: Boolean(SCUBAPRO_AID),
};
