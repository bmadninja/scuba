#!/usr/bin/env node
/**
 * Shared photo-source helpers: Pexels, Unsplash, EOL, GBIF.
 *
 * Keys from process.env:
 *   PEXELS_API_KEY       — required for pexelsSearch()
 *   UNSPLASH_ACCESS_KEY  — required for unsplashSearch()
 * EOL and GBIF are keyless / free.
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = "scubaseason.fun photo enrichment (contact: josie.ty.leung@gmail.com)";

// ── Pexels ────────────────────────────────────────────────────────────────────

/**
 * Search Pexels for landscape photos matching query.
 * Always include an underwater/diving term in query — Pexels returns no
 * description metadata, so the query is the only filter.
 *
 * Returns [{url, srcWidth, attribution, license, source}].
 * Returns [] silently when PEXELS_API_KEY is not set.
 */
export async function pexelsSearch(query, { perPage = 15 } = {}) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];

  const params = new URLSearchParams({
    query,
    per_page: String(perPage),
    orientation: "landscape",
    size: "large",
  });
  try {
    const r = await fetch(`https://api.pexels.com/v1/search?${params}`, {
      headers: { Authorization: key, "User-Agent": UA },
    });
    if (!r.ok) return [];
    const j = await r.json();
    return (j.photos ?? [])
      .map((p) => {
        const base = p.src?.original;
        if (!base) return null;
        return {
          url: `${base}?auto=compress&cs=tinysrgb&w=1920`,
          srcWidth: p.width ?? 0,
          attribution: `Photo by ${p.photographer} on Pexels`,
          license: "pexels",
          source: `pexels:${p.id}`,
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

// ── Unsplash ──────────────────────────────────────────────────────────────────

/**
 * Search Unsplash for landscape photos matching query.
 * Always include an underwater/diving term in query.
 *
 * IMPORTANT: Unsplash requires hotlinking — store urls.full directly.
 * Do NOT download/re-host these images.
 *
 * Returns [{url, srcWidth, attribution, license, source}].
 * Returns [] silently when UNSPLASH_ACCESS_KEY is not set.
 */
export async function unsplashSearch(query, { perPage = 15 } = {}) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];

  const params = new URLSearchParams({
    query,
    per_page: String(perPage),
    orientation: "landscape",
  });
  try {
    const r = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
      headers: { Authorization: `Client-ID ${key}`, "User-Agent": UA },
    });
    if (!r.ok) return [];
    const j = await r.json();
    const results = (j.results ?? [])
      .map((p) => {
        const url = p.urls?.full ?? p.urls?.regular;
        if (!url) return null;
        return {
          url,
          srcWidth: p.width ?? 0,
          attribution: `Photo by ${p.user?.name ?? "unknown"} on Unsplash`,
          license: "unsplash",
          source: `unsplash:${p.id}`,
          _downloadLocation: p.links?.download_location,
        };
      })
      .filter(Boolean);

    // Trigger attribution pings per Unsplash API guidelines (fire-and-forget).
    for (const p of results.slice(0, 3)) {
      if (p._downloadLocation) {
        fetch(p._downloadLocation, {
          headers: { Authorization: `Client-ID ${key}`, "User-Agent": UA },
        }).catch(() => {});
      }
    }
    return results;
  } catch {
    return [];
  }
}

// ── Encyclopedia of Life (EOL) ────────────────────────────────────────────────

/**
 * Look up a species photo from EOL. Prefers CC-licensed images.
 * Returns { imageUrl, license, attribution, source } | null.
 */
export async function eolSpeciesLookup(scientificName, commonName) {
  const searchName = scientificName || commonName;
  if (!searchName) return null;

  try {
    const searchParams = new URLSearchParams({
      q: searchName,
      page: "1",
      exact: scientificName ? "true" : "false",
    });
    const searchRes = await fetch(
      `https://eol.org/api/search/1.0.json?${searchParams}`,
      { headers: { "User-Agent": UA } },
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const eolId = searchData.results?.[0]?.id;
    if (!eolId) return null;

    await sleep(400);

    const pageParams = new URLSearchParams({
      id: String(eolId),
      images_per_page: "5",
      videos_per_page: "0",
      sounds_per_page: "0",
      maps_per_page: "0",
      texts_per_page: "0",
      iucn: "false",
      licenses: "cc-by|cc-by-sa|cc-by-nc|cc-by-nc-sa",
      details: "true",
      common_names: "false",
      synonyms: "false",
      references: "false",
    });
    const pageRes = await fetch(
      `https://eol.org/api/pages/1.0.json?${pageParams}`,
      { headers: { "User-Agent": UA } },
    );
    if (!pageRes.ok) return null;
    const pageData = await pageRes.json();

    for (const obj of pageData.taxonConcept?.dataObjects ?? []) {
      const mime = obj.mimeType ?? "";
      if (!mime.startsWith("image/")) continue;
      const url = obj.eolMediaURL ?? obj.mediaURL;
      if (!url) continue;
      return {
        imageUrl: url,
        license: obj.license?.replace("http://creativecommons.org/licenses/", "cc-").replace(/\/$/, "") ?? null,
        attribution: obj.rightsHolder ?? null,
        source: `eol:${eolId}`,
      };
    }
  } catch {
    return null;
  }
  return null;
}

// ── GBIF ──────────────────────────────────────────────────────────────────────

/**
 * Look up a species photo from GBIF occurrence media.
 * Returns { imageUrl, license, attribution, source } | null.
 */
export async function gbifSpeciesLookup(scientificName) {
  if (!scientificName) return null;

  try {
    const matchParams = new URLSearchParams({ name: scientificName, verbose: "false" });
    const matchRes = await fetch(
      `https://api.gbif.org/v1/species/match?${matchParams}`,
      { headers: { "User-Agent": UA } },
    );
    if (!matchRes.ok) return null;
    const matchData = await matchRes.json();
    const taxonKey = matchData.usageKey;
    if (!taxonKey || (matchData.confidence ?? 0) < 90) return null;

    await sleep(300);

    const occParams = new URLSearchParams({
      taxonKey: String(taxonKey),
      mediaType: "StillImage",
      hasCoordinate: "true",
      limit: "10",
    });
    const occRes = await fetch(
      `https://api.gbif.org/v1/occurrence/search?${occParams}`,
      { headers: { "User-Agent": UA } },
    );
    if (!occRes.ok) return null;
    const occData = await occRes.json();

    for (const occ of occData.results ?? []) {
      for (const media of occ.media ?? []) {
        if (media.type !== "StillImage") continue;
        const url = media.identifier;
        if (!url) continue;
        if (url.includes("thumbnail") || url.includes("_t.") || url.includes("/thumb/")) continue;
        return {
          imageUrl: url,
          license: media.license ?? null,
          attribution: media.rightsHolder ?? occ.datasetName ?? null,
          source: `gbif:${occ.key}`,
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}
