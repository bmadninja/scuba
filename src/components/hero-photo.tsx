import { underwaterPhotoUrl } from "@/lib/photo-quality";

// Ocean-toned gradients used as a placeholder when a reef genuinely has no
// hero photo. We deliberately do NOT borrow another reef's photo — a missing
// photo shows an abstract gradient, never a duplicated image.
const OCEAN_GRADIENTS = [
  "linear-gradient(145deg,#0a3060,#0a6b8a,#087a6e)",
  "linear-gradient(145deg,#041c33,#065566,#0a7a6b)",
  "linear-gradient(145deg,#031522,#064466,#0b829f)",
  "linear-gradient(145deg,#0d4060,#0a7090,#086878)",
  "linear-gradient(145deg,#042030,#0a5060,#0a9080)",
  "linear-gradient(145deg,#0a2840,#0a5878,#087068)",
];

function gradientFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return OCEAN_GRADIENTS[h % OCEAN_GRADIENTS.length];
}

/**
 * Renders a reef hero photo, or a deterministic ocean gradient placeholder when
 * no photo exists. `seed` (slug or name) keeps the placeholder stable per reef.
 */
export function HeroPhoto({
  url,
  alt,
  seed,
  className = "",
  priority = false,
}: {
  url?: string | null;
  alt: string;
  seed: string;
  className?: string;
  priority?: boolean;
}) {
  const raw = underwaterPhotoUrl(url);
  if (!raw) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={className}
        style={{ background: gradientFor(seed) }}
      />
    );
  }
  const src = raw;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "low"}
    />
  );
}
