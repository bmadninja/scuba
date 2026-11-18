import { NextRequest } from "next/server";
import { searchTaxa } from "@/lib/inat";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";

  if (q.length < 2) {
    return Response.json({ taxa: [] });
  }

  try {
    const taxa = await searchTaxa(q);
    return Response.json({ taxa });
  } catch (err) {
    console.error("[taxa/search] error:", err);
    return Response.json({ taxa: [] });
  }
}
