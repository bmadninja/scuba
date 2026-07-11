import { NextRequest } from "next/server";
import { z } from "zod";
import { sendTelegram } from "@/lib/telegram";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// Storeless conduit: this route captures a 3D photogrammetry pass's METADATA and
// queues it in a transient routing outbox (src/data/photogrammetry-queue.json,
// git-ignored via /src/data/*-queue.json) for Josie to route to Wildflow by hand
// until an intake API exists. The diver's image set (hundreds of photos) is NOT
// received here — it goes from the diver to Wildflow directly.
const BodySchema = z.object({
  siteId: z.string().min(1),
  siteName: z.string().min(1),
  siteLat: z.string().regex(/^-?\d+(\.\d+)?$/),
  siteLng: z.string().regex(/^-?\d+(\.\d+)?$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  depthM: z.string().regex(/^\d+(\.\d+)?$/),
  observerEmail: z.string().email(),
  cameraModel: z.string().max(120).optional(),
  lensType: z.string().max(40).optional(),
  intervalSeconds: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  altitudeM: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  passCount: z.string().regex(/^\d+$/).optional(),
  imageCount: z.string().regex(/^\d+$/).optional(),
  areaCoveredM2: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  reefSlope: z.string().optional(),
  notes: z.string().max(500).optional(),
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
    observerEmail: d.observerEmail,
    ...(d.cameraModel && { cameraModel: d.cameraModel }),
    ...(d.lensType && { lensType: d.lensType }),
    ...(d.intervalSeconds && { intervalSeconds: parseFloat(d.intervalSeconds) }),
    ...(d.altitudeM && { altitudeM: parseFloat(d.altitudeM) }),
    ...(d.passCount && { passCount: parseInt(d.passCount, 10) }),
    ...(d.imageCount && { imageCount: parseInt(d.imageCount, 10) }),
    ...(d.areaCoveredM2 && { areaCoveredM2: parseFloat(d.areaCoveredM2) }),
    ...(d.reefSlope && { reefSlope: d.reefSlope }),
    ...(d.notes && { notes: d.notes }),
    submittedAt: new Date().toISOString(),
    status: "pending_wildflow_routing",
  };

  try {
    appendToJsonFile(join(DATA_DIR, "photogrammetry-queue.json"), queueEntry);
  } catch (err) {
    console.error("[submit-photogrammetry] queue write failed:", err);
  }

  // Telegram alert
  const lensLine = d.lensType ? ` | Lens: ${d.lensType}` : "";
  const intervalLine = d.intervalSeconds ? ` | Interval: ${d.intervalSeconds} s` : "";
  const passLine = d.passCount ? ` | Passes: ${d.passCount}` : "";
  const imageLine = d.imageCount ? ` | Images: ${d.imageCount}` : "";
  const notesLine = d.notes ? `\nNotes: ${d.notes}` : "";

  await sendTelegram(
    `🛰️ <b>Photogrammetry pass logged — ${d.siteName}</b>\n` +
      `Date: ${d.date} | Depth: ${d.depthM} m${lensLine}${intervalLine}\n` +
      `${passLine}${imageLine}`.trim() +
      `\nObserver: ${d.observerEmail}` +
      notesLine +
      `\n\nAction needed: route this metadata to Wildflow (the diver sends their image set to Wildflow directly).`
  );

  return Response.json({ success: true, queued: true });
}
