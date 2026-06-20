"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface SpeciesTile {
  name: string;
  odds: string;
  photoUrl?: string;
}

// Hardcoded sample reef species — common sightings at key atlas locations
const SPECIES: SpeciesTile[] = [
  { name: "Manta ray", odds: "68%", photoUrl: "https://inaturalist-open-data.s3.amazonaws.com/photos/9560154/square.jpg" },
  { name: "Sea turtle", odds: "74%", photoUrl: "https://inaturalist-open-data.s3.amazonaws.com/photos/30844744/square.jpg" },
  { name: "Reef shark", odds: "51%", photoUrl: "https://inaturalist-open-data.s3.amazonaws.com/photos/290208487/square.jpg" },
  { name: "Whale shark", odds: "22%", photoUrl: "https://inaturalist-open-data.s3.amazonaws.com/photos/167538023/square.jpg" },
  { name: "Goliath grouper", odds: "38%", photoUrl: "https://inaturalist-open-data.s3.amazonaws.com/photos/98481122/square.jpg" },
  { name: "Hammerhead shark", odds: "19%", photoUrl: "https://inaturalist-open-data.s3.amazonaws.com/photos/1384289/square.jpg" },
  { name: "Nudibranch", odds: "61%", photoUrl: "https://inaturalist-open-data.s3.amazonaws.com/photos/652846455/square.jpg" },
  { name: "Octopus", odds: "43%", photoUrl: "https://inaturalist-open-data.s3.amazonaws.com/photos/43614792/square.jpg" },
  { name: "Eagle ray", odds: "34%", photoUrl: "https://inaturalist-open-data.s3.amazonaws.com/photos/13503869/square.jpg" },
  { name: "Frogfish", odds: "28%", photoUrl: "https://inaturalist-open-data.s3.amazonaws.com/photos/48988701/square.jpg" },
];

// Duplicate for seamless loop
const TILES = [...SPECIES, ...SPECIES];

export function SpeciesFilmstrip() {
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const el = trackRef.current;
    if (!el) return;

    let pos = 0;
    const TILE_WIDTH = 180 + 12; // width + gap
    const HALF = SPECIES.length * TILE_WIDTH;

    function animate() {
      if (!pausedRef.current && el) {
        pos += 0.8;
        if (pos >= HALF) pos -= HALF;
        el.scrollLeft = pos;
      }
      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion]);

  const pause = useCallback(() => { pausedRef.current = true; }, []);
  const resume = useCallback(() => { pausedRef.current = false; }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    const TILE_WIDTH = 180 + 12;
    if (e.key === "ArrowRight") el.scrollBy({ left: TILE_WIDTH, behavior: "smooth" });
    if (e.key === "ArrowLeft") el.scrollBy({ left: -TILE_WIDTH, behavior: "smooth" });
  }, []);

  return (
    <div
      ref={trackRef}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Species you may encounter — scroll to explore"
      style={{
        display: "flex",
        gap: "0.75rem",
        overflowX: reducedMotion ? "auto" : "hidden",
        scrollbarWidth: reducedMotion ? "auto" : "none",
        padding: "0.5rem 0 1rem",
        outline: "none",
      }}
      className="species-filmstrip-track"
    >
      {TILES.map((tile, i) => (
        <div
          key={`${tile.name}-${i}`}
          aria-hidden={i >= SPECIES.length}
          style={{
            flexShrink: 0,
            width: "180px",
            border: "1px solid var(--color-hairline)",
            borderRadius: "8px",
            overflow: "hidden",
            background: "var(--color-paper)",
          }}
        >
          {/* Photo or placeholder */}
          <div
            style={{
              width: "100%",
              aspectRatio: "4/3",
              overflow: "hidden",
              background: "var(--color-ocean)",
              position: "relative",
            }}
          >
            {tile.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tile.photoUrl}
                alt={tile.name}
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "var(--color-ocean)",
                }}
              />
            )}
          </div>

          <div style={{ padding: "0.625rem 0.75rem 0.75rem" }}>
            <div
              style={{
                fontFamily: 'var(--font-sans), "IBM Plex Sans", system-ui, sans-serif',
                fontWeight: 500,
                fontSize: "0.8125rem",
                color: "var(--color-ink)",
                lineHeight: 1.3,
                marginBottom: "0.2rem",
              }}
            >
              {tile.name}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono), "IBM Plex Mono", ui-monospace, monospace',
                fontWeight: 500,
                fontSize: "1.125rem",
                color: "var(--color-ocean)",
                lineHeight: 1,
              }}
            >
              {tile.odds}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-sans), "IBM Plex Sans", system-ui, sans-serif',
                fontWeight: 300,
                fontSize: "0.625rem",
                color: "var(--color-ink-2)",
                marginTop: "0.1rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              sighting odds
            </div>
          </div>
        </div>
      ))}

      <style>{`
        .species-filmstrip-track::-webkit-scrollbar { display: none; }
        .species-filmstrip-track:focus-visible { outline: 2px solid #F6C700; outline-offset: 2px; }
      `}</style>
    </div>
  );
}
