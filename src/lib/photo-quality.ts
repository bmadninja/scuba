export const UNDERWATER_PHOTO_FALLBACK =
  "https://upload.wikimedia.org/wikipedia/commons/c/c7/Diving_the_Cenotes_in_Yucatan%2C_Mexico_%2841791832870%29.jpg";

const REJECTED_SURFACE_PHOTO_PATTERNS = [
  "a_beautiful_view_of_pigeon_island",
  "beached_transport",
  "bianca_c\",_genova",
  "burning_guadalcanal",
  "copernicus",
  "daedalus_reef_lighthouse",
  "diamond_rock_saba",
  "dive_site_1000_steps_curacao",
  "hirokawa_maru_and_kinugawa_maru_burning",
  "isladeroca",
  "mnemba_atoll",
  "motorbikes_thistlegorm",
  "nosy_tanikely_130",
  "petit_piton",
  "precontinent_ii_-_frontansicht",
  "richelieu_rock",
  "shinkoku_maru-1941",
  "the_great_blue_hole_in_belize",
  "agujero_azul",
];

function normalizedFilename(url: string) {
  try {
    const pathParts = new URL(url).pathname.split("/");
    const rawFilename = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2] || "";
    return decodeURIComponent(rawFilename)
      .toLowerCase()
      .replace(/^\\d+px-/, "")
      .replace(/\\s+/g, "_");
  } catch {
    return "";
  }
}

export function isUnderwaterQualityPhoto(url?: string | null) {
  if (!url) return false;
  const filename = normalizedFilename(url);
  return !REJECTED_SURFACE_PHOTO_PATTERNS.some((pattern) =>
    filename.includes(pattern),
  );
}

export function underwaterPhotoUrl(url?: string | null) {
  if (!url || !isUnderwaterQualityPhoto(url)) return UNDERWATER_PHOTO_FALLBACK;
  return url;
}
