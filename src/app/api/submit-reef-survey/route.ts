import { NextRequest } from "next/server";
import { z } from "zod";
import { sendTelegram } from "@/lib/telegram";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const CoralEntrySchema = z.object({
  growthForm: z.string().min(1),
  lightestShade: z.number().int().min(1).max(4),
  darkestShade: z.number().int().min(1).max(4),
});

const BodySchema = z.object({
  siteId: z.string().min(1),
  siteName: z.string().min(1),
  siteLat: z.string().regex(/^-?\d+(\.\d+)?$/),
  siteLng: z.string().regex(/^-?\d+(\.\d+)?$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  depthM: z.string().regex(/^\d+(\.\d+)?$/),
  transectLengthM: z.string().regex(/^\d+(\.\d+)?$/),
  numQuadrats: z.string().regex(/^\d+$/),
  quadratSizeM2: z.string().regex(/^\d+(\.\d+)?$/),
  pointsPerQuadrat: z.string().regex(/^\d+$/),
  reefSlope: z.string().optional(),
  observerEmail: z.string().email(),
  notes: z.string().max(500).optional(),
  coralEntries: z.array(CoralEntrySchema).max(50),
});

function appendToJsonFile(filePath: string, entry: unknown): void {
  let arr: unknown[] = [];
  if (existsSync(filePath)) {
    try {
      arr = JSON.parse(readFileSync(filePath, "utf-8")) as unknown[];
    } catch {
      arr = [];
    }
  }
  arr.push(entry);
  writeFileSync(filePath, JSON.stringify(arr, null, 2), "utf-8");
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid fields", details: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const DATA_DIR = join(process.cwd(), "src", "data");

  const queueEntry = {
    siteId: d.siteId,
    siteName: d.siteName,
    lat: parseFloat(d.siteLat),
    lng: parseFloat(d.siteLng),
    date: d.date,
    depthM: parseFloat(d.depthM),
    transectLengthM: parseFloat(d.transectLengthM),
    numQuadrats: parseInt(d.numQuadrats, 10),
    quadratSizeM2: parseFloat(d.quadratSizeM2),
    pointsPerQuadrat: parseInt(d.pointsPerQuadrat, 10),
    ...(d.reefSlope && { reefSlope: d.reefSlope }),
    observerEmail: d.observerEmail,
    ...(d.notes && { notes: d.notes }),
    coralEntries: d.coralEntries,
    submittedAt: new Date().toISOString(),
    status: "pending_mermaid_import",
  };

  try {
    appendToJsonFile(join(DATA_DIR, "reef-survey-queue.json"), queueEntry);
  } catch (err) {
    console.error("[submit-reef-survey] queue write failed:", err);
  }

  // Queue CoralWatch readings separately if any exist
  if (d.coralEntries.length > 0) {
    try {
      for (const entry of d.coralEntries) {
        appendToJsonFile(join(DATA_DIR, "coralwatch-queue.json"), {
          siteName: d.siteName,
          siteId: d.siteId,
          lat: parseFloat(d.siteLat),
          lon: parseFloat(d.siteLng),
          date: d.date,
          depth: parseFloat(d.depthM),
          growthForm: entry.growthForm,
          lightestShade: entry.lightestShade,
          darkestShade: entry.darkestShade,
          submittedAt: new Date().toISOString(),
          source: "reef-survey",
        });
      }
    } catch (err) {
      console.error("[submit-reef-survey] coralwatch queue write failed:", err);
    }
  }

  // Telegram alert
  const coralLine =
    d.coralEntries.length > 0
      ? `\nCoralWatch: ${d.coralEntries.length} coral${d.coralEntries.length > 1 ? "s" : ""} recorded`
      : "";
  const notesLine = d.notes ? `\nNotes: ${d.notes}` : "";
  const slopeLine = d.reefSlope ? ` | Slope: ${d.reefSlope}` : "";

  await sendTelegram(
    `📊 <b>Reef survey logged — ${d.siteName}</b>\n` +
      `Date: ${d.date} | Depth: ${d.depthM} m${slopeLine}\n` +
      `Transect: ${d.transectLengthM} m | Quadrats: ${d.numQuadrats} × ${d.quadratSizeM2} m² | Points/quadrat: ${d.pointsPerQuadrat}\n` +
      `Observer: ${d.observerEmail}` +
      coralLine +
      notesLine +
      `\n\nAction needed: upload quadrat photos at app.datamermaid.org`
  );

  return Response.json({ success: true, queued: true });
}
