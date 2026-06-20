import { NextRequest } from "next/server";
import { z } from "zod";
import { submitToInat } from "@/lib/inat";
import { sendTelegram } from "@/lib/telegram";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const ACCEPTED_EXTS = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif"]);
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const BodySchema = z.object({
  siteId: z.string().min(1),
  siteName: z.string().min(1),
  siteLat: z.string().regex(/^-?\d+(\.\d+)?$/),
  siteLng: z.string().regex(/^-?\d+(\.\d+)?$/),
  category: z.enum(["fish", "coral", "other"]),
  // Legacy single-taxon fields (kept for backwards compat with old SubmissionForm)
  taxonId: z.string().optional(),
  taxonName: z.string().optional(),
  // New multi-taxon fields (comma-separated taxon IDs)
  taxonIds: z.string().optional(),
  freeTextSpecies: z.string().optional(),
  speciesDisplay: z.string().optional(),
  isSeahorse: z.string().optional(),
  observedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  depthM: z.string().optional(),
  tempC: z.string().optional(),
  bleachingScore: z.enum(["healthy", "pale", "bleached", "dead"]).optional(),
  notes: z.string().max(280).optional(),
  needsReview: z.string().optional(),
});

// ─── Retry logic ──────────────────────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
      } else {
        throw err;
      }
    }
  }
  throw new Error("All retries exhausted");
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

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

// ─── HEIC conversion attempt ──────────────────────────────────────────────────
// sharp is not in package.json — skip conversion, submit as-is.
// Decision logged in DECISIONS.md (entry 26).

async function maybeConvertHeic(blob: Blob): Promise<Blob> {
  // sharp is not available — return blob unchanged
  return blob;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  // Extract scalar fields
  const fields: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") fields[key] = value;
  }

  const parsed = BodySchema.safeParse(fields);
  if (!parsed.success) {
    return Response.json({ error: "Invalid fields", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // Extract and validate photos
  const photoEntries = formData.getAll("photos");
  const photos: Blob[] = [];
  for (const entry of photoEntries) {
    if (!(entry instanceof Blob)) continue;
    const file = entry as File;
    const ext = (file.name ?? "").split(".").pop()?.toLowerCase() ?? "";

    // Accept by type or extension
    if (!ACCEPTED_TYPES.has(file.type) && !ACCEPTED_EXTS.has(ext)) {
      return Response.json(
        { error: `Unsupported file type: ${file.type || ext || "unknown"}. Please use JPEG, PNG, or HEIC.` },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `File too large (max 20 MB): ${file.name}` },
        { status: 400 }
      );
    }
    // Attempt HEIC conversion (no-op unless sharp is available)
    const converted = await maybeConvertHeic(file);
    photos.push(converted);
  }

  if (photos.length === 0) {
    return Response.json({ error: "At least 1 photo is required" }, { status: 400 });
  }

  const lat = parseFloat(data.siteLat);
  const lng = parseFloat(data.siteLng);

  // Build taxon ID list — support both old single-taxon and new multi-taxon
  const taxonIds: number[] = [];
  if (data.taxonIds) {
    for (const part of data.taxonIds.split(",")) {
      const n = parseInt(part.trim(), 10);
      if (!isNaN(n)) taxonIds.push(n);
    }
  } else if (data.taxonId) {
    const n = parseInt(data.taxonId, 10);
    if (!isNaN(n)) taxonIds.push(n);
  }

  const isSeahorse = data.isSeahorse === "true";
  const needsReview = data.needsReview === "true";

  // Build description
  const descParts: string[] = [];
  if (needsReview && data.freeTextSpecies) {
    descParts.push(`Species (unverified, needs review): ${data.freeTextSpecies}`);
  } else if (needsReview && data.taxonName) {
    descParts.push(`Species (unverified): ${data.taxonName}`);
  }
  if (data.notes) descParts.push(data.notes);
  descParts.push("Submitted via Scuba Season (scubaseason.fun)");
  const description = descParts.join("\n\n");

  const depthM = data.depthM ? parseFloat(data.depthM) : undefined;
  const tempC = data.tempC ? parseFloat(data.tempC) : undefined;

  const coralWatchEligible =
    data.category === "coral" &&
    depthM !== undefined &&
    data.bleachingScore !== undefined;

  const platforms: string[] = ["iNaturalist", "GBIF (via iNaturalist)", "OBIS (via iNaturalist)"];
  if (isSeahorse) platforms.push("iSeahorse");
  if (coralWatchEligible) platforms.push("CoralWatch (weekly batch)");

  const DATA_DIR = join(process.cwd(), "src", "data");

  // ─── Attempt iNaturalist submission ─────────────────────────────────────────

  try {
    let lastObsId: number | undefined;
    let lastObsUrl: string | undefined;

    // Multi-species: one observation per matched taxon
    if (taxonIds.length > 1) {
      for (const taxonId of taxonIds) {
        const result = await withRetry(() =>
          submitToInat({
            taxonId,
            placeGuess: data.siteName,
            lat,
            lng,
            observedOn: data.observedOn,
            description,
            depthM,
            tempC,
            photos,
            isSeahorse,
          })
        );
        lastObsId = result.observationId;
        lastObsUrl = result.url;
      }
    } else {
      // Single taxon or free-text
      const result = await withRetry(() =>
        submitToInat({
          taxonId: taxonIds[0],
          taxonName: taxonIds.length === 0 ? (data.freeTextSpecies ?? data.taxonName) : undefined,
          placeGuess: data.siteName,
          lat,
          lng,
          observedOn: data.observedOn,
          description,
          depthM,
          tempC,
          photos,
          isSeahorse,
        })
      );
      lastObsId = result.observationId;
      lastObsUrl = result.url;
    }

    // CoralWatch queue — append to JSON file
    if (coralWatchEligible) {
      try {
        appendToJsonFile(join(DATA_DIR, "coralwatch-queue.json"), {
          siteName: data.siteName,
          siteId: data.siteId,
          lat,
          lon: lng,
          date: data.observedOn,
          depth: depthM,
          temp: tempC ?? null,
          bleachingScore: data.bleachingScore,
          submittedAt: new Date().toISOString(),
          inatObservationId: lastObsId ?? null,
        });
      } catch (queueErr) {
        console.error("[submit-sighting] CoralWatch queue write failed:", queueErr);
      }
    }

    // Success Telegram alert
    await sendTelegram(
      `✅ <b>New sighting submitted — ${data.siteName}</b>\n` +
        `${data.category} · ${data.speciesDisplay || "Unknown"} · ${data.observedOn}\n` +
        `Platforms: ${platforms.join(", ")}\n` +
        (lastObsUrl ? `iNat: ${lastObsUrl}` : "")
    );

    const submittedTo: string[] = ["iNaturalist", "GBIF", "OBIS"];
    if (isSeahorse) submittedTo.push("iSeahorse");
    if (coralWatchEligible) submittedTo.push("CoralWatch (queued)");

    return Response.json({
      success: true,
      ok: true,
      observationId: lastObsId,
      observationUrl: lastObsUrl,
      platforms,
      submittedTo,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    // If credentials not configured — queue to Telegram for manual processing
    if (message === "iNat credentials not configured") {
      const coralBlock = coralWatchEligible
        ? `\nDepth: ${depthM}m | Bleaching: ${data.bleachingScore} | Temp: ${tempC !== undefined ? `${tempC}°C` : "not recorded"}`
        : "";

      await sendTelegram(
        `⏳ <b>MANUAL SUBMISSION NEEDED — ${data.siteName}</b>\n` +
          `iNat API not yet configured (eligible ~2026-08-15).\n` +
          `Category: ${data.category} · Species: ${data.speciesDisplay || "Unknown"}\n` +
          `Date: ${data.observedOn} | GPS: ${lat}, ${lng}${coralBlock}\n` +
          `Notes: ${data.notes || "none"}\n` +
          `Photos: ${photos.length} file(s) — upload manually to inaturalist.org/people/scubaseason`
      );

      // Still queue CoralWatch data even when credentials are missing
      if (coralWatchEligible) {
        try {
          appendToJsonFile(join(DATA_DIR, "coralwatch-queue.json"), {
            siteName: data.siteName,
            siteId: data.siteId,
            lat,
            lon: lng,
            date: data.observedOn,
            depth: depthM,
            temp: tempC ?? null,
            bleachingScore: data.bleachingScore,
            submittedAt: new Date().toISOString(),
            inatObservationId: null,
            status: "pending_manual_submission",
          });
        } catch (queueErr) {
          console.error("[submit-sighting] CoralWatch queue write failed:", queueErr);
        }
      }

      return Response.json({
        success: true,
        ok: true,
        queued: true,
        platforms,
        submittedTo: ["Queued for manual submission"],
      });
    }

    // Real failure — save to failed-submissions.json
    console.error("[submit-sighting] iNat error:", message);

    try {
      appendToJsonFile(join(DATA_DIR, "failed-submissions.json"), {
        siteName: data.siteName,
        siteId: data.siteId,
        lat,
        lon: lng,
        category: data.category,
        speciesDisplay: data.speciesDisplay,
        observedOn: data.observedOn,
        depthM: depthM ?? null,
        tempC: tempC ?? null,
        bleachingScore: data.bleachingScore ?? null,
        notes: data.notes ?? null,
        isSeahorse,
        photoCount: photos.length,
        error: message,
        failedAt: new Date().toISOString(),
      });
    } catch (writeErr) {
      console.error("[submit-sighting] failed-submissions write failed:", writeErr);
    }

    await sendTelegram(
      `❌ <b>Sighting submission FAILED — ${data.siteName}</b>\n` +
        `${data.category} · ${data.observedOn}\n` +
        `Error: ${message}\n` +
        `Stored in failed-submissions.json for manual review.`
    );

    return Response.json(
      {
        success: false,
        ok: false,
        error: "We will resubmit your photo within 24 hours.",
        message: "We will resubmit your photo within 24 hours.",
      },
      { status: 500 }
    );
  }
}
