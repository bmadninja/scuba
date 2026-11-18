// Species autocomplete — proxies iNaturalist taxa search.
export async function onRequestGet({ request }) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (q.length < 2) return Response.json({ taxa: [] });
  try {
    const u = new URL("https://api.inaturalist.org/v1/taxa");
    u.searchParams.set("q", q);
    u.searchParams.set("rank", "species");
    u.searchParams.set("per_page", "6");
    u.searchParams.set("order_by", "observations_count");
    const res = await fetch(u, { headers: { "User-Agent": "scubaseason.fun" } });
    if (!res.ok) return Response.json({ taxa: [] });
    const data = await res.json();
    const taxa = (data.results ?? []).map((t) => ({
      taxonId: t.id,
      scientificName: t.name,
      commonName: t.preferred_common_name ?? null,
      isSeahorse: t.name.toLowerCase().startsWith("hippocampus"),
    }));
    return Response.json({ taxa });
  } catch {
    return Response.json({ taxa: [] });
  }
}
