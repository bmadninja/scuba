/**
 * iNaturalist API client — ROPC auth, observation + photo submission.
 *
 * Until INAT_APP_ID / INAT_APP_SECRET are set (eligible ~2026-08-15),
 * getToken() throws "iNat credentials not configured" and the submission
 * route falls back to Telegram queue.
 */

const INAT_BASE = "https://www.inaturalist.org";

type CachedToken = { access_token: string; expires_at: number };
let _tokenCache: CachedToken | null = null;

async function getToken(): Promise<string> {
  const { INAT_APP_ID, INAT_APP_SECRET, INAT_USERNAME, INAT_PASSWORD } = process.env;
  if (!INAT_APP_ID || !INAT_APP_SECRET || !INAT_USERNAME || !INAT_PASSWORD) {
    throw new Error("iNat credentials not configured");
  }

  const now = Date.now();
  if (_tokenCache && _tokenCache.expires_at > now + 60_000) {
    return _tokenCache.access_token;
  }

  const res = await fetch(`${INAT_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: INAT_APP_ID,
      client_secret: INAT_APP_SECRET,
      grant_type: "password",
      username: INAT_USERNAME,
      password: INAT_PASSWORD,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`iNat auth failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in?: number };
  _tokenCache = {
    access_token: data.access_token,
    expires_at: now + (data.expires_in ?? 86400) * 1000,
  };
  return _tokenCache.access_token;
}

export type InatSubmissionParams = {
  taxonId?: number;
  taxonName?: string;
  placeGuess: string;
  lat: number;
  lng: number;
  observedOn: string;
  description?: string;
  depthM?: number;
  tempC?: number;
  photos: Blob[];
  isSeahorse?: boolean;
};

export type InatSubmissionResult = {
  observationId: number;
  url: string;
};

export async function submitToInat(params: InatSubmissionParams): Promise<InatSubmissionResult> {
  const token = await getToken();

  const observationPayload: Record<string, unknown> = {
    place_guess: params.placeGuess,
    latitude: params.lat,
    longitude: params.lng,
    observed_on: params.observedOn,
    description: params.description ?? null,
    captive_flag: false,
  };

  if (params.taxonId) observationPayload.taxon_id = params.taxonId;
  else if (params.taxonName) observationPayload.species_guess = params.taxonName;

  const obsRes = await fetch(`${INAT_BASE}/observations.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ observation: observationPayload }),
    cache: "no-store",
  });

  if (!obsRes.ok) {
    const body = await obsRes.text();
    throw new Error(`iNat observation creation failed (${obsRes.status}): ${body}`);
  }

  const obsData = (await obsRes.json()) as { id: number };
  const observationId = obsData.id;

  // Attach each photo sequentially (iNat rate limit: 100 req/min)
  for (const blob of params.photos) {
    const fd = new FormData();
    fd.append("observation_photo[observation_id]", String(observationId));
    fd.append("file", blob);

    const photoRes = await fetch(`${INAT_BASE}/observation_photos.json`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
      cache: "no-store",
    });

    if (!photoRes.ok) {
      console.error(`[inat] photo upload failed (${photoRes.status}) for obs ${observationId}`);
    }
  }

  // Tag seahorse observations to iSeahorse project (project_id = 871)
  if (params.isSeahorse) {
    const projRes = await fetch(`${INAT_BASE}/project_observations.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project_observation: { project_id: 871, observation_id: observationId },
      }),
      cache: "no-store",
    });

    if (!projRes.ok) {
      console.error(`[inat] iSeahorse project tag failed (${projRes.status}) for obs ${observationId}`);
    }
  }

  return {
    observationId,
    url: `https://www.inaturalist.org/observations/${observationId}`,
  };
}

export type TaxonSuggestion = {
  taxonId: number;
  scientificName: string;
  commonName: string | null;
  isSeahorse: boolean;
};

const INAT_API_V1 = "https://api.inaturalist.org/v1";

export async function searchTaxa(query: string): Promise<TaxonSuggestion[]> {
  if (!query || query.length < 2) return [];

  const url = new URL(`${INAT_API_V1}/taxa`);
  url.searchParams.set("q", query);
  url.searchParams.set("rank", "species");
  url.searchParams.set("per_page", "6");
  url.searchParams.set("order_by", "observations_count");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    results?: Array<{
      id: number;
      name: string;
      preferred_common_name?: string | null;
    }>;
  };

  return (data.results ?? []).map((t) => ({
    taxonId: t.id,
    scientificName: t.name,
    commonName: t.preferred_common_name ?? null,
    isSeahorse: t.name.toLowerCase().startsWith("hippocampus"),
  }));
}
