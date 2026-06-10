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
