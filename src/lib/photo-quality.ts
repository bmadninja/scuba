// Hero-photo quality gating.
//
// There is intentionally NO hardcoded "fallback" photo here. A single shared
// fallback image meant several unrelated reefs rendered the *same* photo, which
// both looks broken and violates the rule that every hero is a unique, real,
// underwater photograph of what that reef is known for.
//
// Quality is now enforced at data-build time (see scripts/fetch-site-photos.mjs
// and scripts/dedupe-and-fill-heroes.mjs): every location and site is given a
// globally-unique, underwater, subject-appropriate photo. At runtime we simply
// trust the stored URL. When a photo is genuinely missing the UI shows an ocean
// gradient placeholder — never a borrowed photo.

// Known surface / non-underwater / off-subject filenames. Used by the sourcing
// scripts to reject bad candidates; NOT applied as a runtime fallback. Keep this
// list to candidate filenames only — do not block legitimate underwater shots.
const REJECTED_SURFACE_PHOTO_PATTERNS = [
  "a_beautiful_view_of_pigeon_island",
  "beached_transport",
  'bianca_c", genova',
  "burning_guadalcanal",
  "copernicus",
  "daedalus_reef_lighthouse",
  "dive_site_1000_steps_curacao",
  "hirokawa_maru_and_kinugawa_maru_burning",
  "isladeroca",
  "mnemba_atoll",
  "petit_piton",
  "precontinent_ii_-_frontansicht",
  "shinkoku_maru-1941",
  "the_great_blue_hole_in_belize",
  "agujero_azul",
];

function normalizedFilename(url: string) {
  try {
    const pathParts = new URL(url).pathname.split("/");
    const rawFilename =
      pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2] || "";
    return decodeURIComponent(rawFilename)
      .toLowerCase()
      .replace(/^\d+px-/, "")
      .replace(/\s+/g, "_");
  } catch {
    return "";
  }
}

/**
 * True when the URL is a plausible underwater-quality hero. Used by the photo
 * sourcing scripts to reject known surface/aerial/specimen shots.
 */
export function isUnderwaterQualityPhoto(url?: string | null) {
  if (!url) return false;
  const filename = normalizedFilename(url);
  return !REJECTED_SURFACE_PHOTO_PATTERNS.some((pattern) =>
    filename.includes(pattern),
  );
}

/**
 * Returns the hero URL to render, or `null` when there is no photo. Callers must
 * handle `null` by showing a gradient placeholder — there is no shared fallback
 * image. This is a pass-through validator: the data is cleaned at build time.
 */
export function underwaterPhotoUrl(url?: string | null): string | null {
  return url && url.trim() ? url : null;
}

/**
 * Resizes a Wikimedia or iNaturalist URL to a narrower thumbnail so browsers
 * don't download 3-8 MB originals for cards and hero images.
 *
 * Wikimedia thumb pattern:
 *   .../commons/thumb/X/XX/Filename/NNNNpx-Filename  →  1200px-Filename
 * Wikimedia non-thumb:
 *   .../commons/X/XX/Filename  →  .../commons/thumb/X/XX/Filename/1200px-Filename
 * iNaturalist:
 *   /photos/ID/large.jpg  →  /photos/ID/medium.jpg  (for heroes)
 *   /photos/ID/large.jpg  →  /photos/ID/small.jpg   (for thumbnails)
 */
// Wikimedia now enforces a strict allowlist of thumbnail widths (as of mid-2026).
// Requesting any other pixel value returns HTTP 400. Map our target widths to the
// nearest valid size: 120, 960, 1280, 1920, 3840.
const WIKIMEDIA_ALLOWED_SIZES = [120, 960, 1280, 1920, 3840] as const;
function wikimediaSize(targetWidth: number): number {
  return WIKIMEDIA_ALLOWED_SIZES.find((s) => s >= targetWidth) ?? 3840;
}

export function resizePhotoUrl(
  url: string | null | undefined,
  targetWidth: 1200 | 800 | 500 | 240 = 1200,
): string | null {
  if (!url) return null;

  // Wikimedia thumb URL — just replace the pixel dimension
  const wikiThumb = url.match(
    /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/[^/]+\/thumb\/[a-f0-9]\/[a-f0-9]{2}\/[^/]+\/)\d+px-(.+)$/i,
  );
  if (wikiThumb) {
    const w = wikimediaSize(targetWidth);
    return `${wikiThumb[1]}${w}px-${wikiThumb[2]}`;
  }

  // Wikimedia non-thumb — construct thumb URL
  const wikiDirect = url.match(
    /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/[^/]+\/)([a-f0-9]\/[a-f0-9]{2}\/)(.+)$/i,
  );
  if (wikiDirect) {
    const filename = wikiDirect[3];
    const w = wikimediaSize(targetWidth);
    return `${wikiDirect[1]}thumb/${wikiDirect[2]}${filename}/${w}px-${filename}`;
  }

  // iNaturalist — map targetWidth to their named sizes
  if (url.includes("inaturalist-open-data.s3.amazonaws.com")) {
    const inatSize =
      targetWidth >= 1200
        ? "large"
        : targetWidth >= 500
          ? "medium"
          : targetWidth >= 240
            ? "small"
            : "square";
    return url.replace(/\/(square|small|medium|large|original)\./, `/${inatSize}.`);
  }

  return url;
}
