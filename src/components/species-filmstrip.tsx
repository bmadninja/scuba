"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import Link from "next/link";

interface SpeciesTile {
  name: string;
  label: string;
  labelColor: string;
  href: string;
  photoUrl?: string;
  location: string;
}

const SPECIES: SpeciesTile[] = [
  { name: "Manta ray",        label: "Very likely",    labelColor: "#15824c", location: "Apo Reef, Philippines",       href: "/species/manta-ray",                        photoUrl: "https://inaturalist-open-data.s3.amazonaws.com/photos/33852153/large.jpg" },
  { name: "Sea turtle",       label: "Very likely",    labelColor: "#15824c", location: "Mushroom Forest, Curaçao",    href: "/species/sea-turtle",                           photoUrl: "https://inaturalist-open-data.s3.amazonaws.com/photos/675226735/large.jpg" },
  { name: "Reef shark",       label: "Likely",         labelColor: "#15824c", location: "Great White Wall, Fiji",      href: "/species/reef-shark",                             photoUrl: "https://inaturalist-open-data.s3.amazonaws.com/photos/668839239/large.jpg" },
  { name: "Whale shark",      label: "Rare",           labelColor: "#64748b", location: "Cocos Island, Costa Rica",    href: "/species/whale-shark",                               photoUrl: "https://inaturalist-open-data.s3.amazonaws.com/photos/519729370/large.jpg" },
  { name: "Goliath grouper",  label: "Sometimes",      labelColor: "#b9751a", location: "Florida Keys, USA",           href: "/species/goliath-grouper",                  photoUrl: "https://inaturalist-open-data.s3.amazonaws.com/photos/98481122/large.jpg" },
  { name: "Hammerhead shark", label: "Rare",           labelColor: "#64748b", location: "Réunion Island",              href: "/species/hammerhead-shark",     photoUrl: "https://inaturalist-open-data.s3.amazonaws.com/photos/86555463/large.jpeg" },
  { name: "Nudibranch",       label: "Very likely",    labelColor: "#15824c", location: "Komodo, Indonesia",           href: "/species/nudibranch",              photoUrl: "https://inaturalist-open-data.s3.amazonaws.com/photos/178511773/large.jpg" },
  { name: "Octopus",          label: "Likely",         labelColor: "#15824c", location: "Similan Islands, Thailand",   href: "/species/octopus",                          photoUrl: "https://inaturalist-open-data.s3.amazonaws.com/photos/166419253/large.jpeg" },
  { name: "Eagle ray",        label: "Sometimes",      labelColor: "#b9751a", location: "Blue Corner, Palau",          href: "/species/eagle-ray",                               photoUrl: "https://inaturalist-open-data.s3.amazonaws.com/photos/195315918/large.jpg" },
  { name: "Frogfish",         label: "Sometimes",      labelColor: "#b9751a", location: "Moalboal, Philippines",       href: "/species/frogfish",                            photoUrl: "https://inaturalist-open-data.s3.amazonaws.com/photos/5890152/large.jpg" },
];

const TILE_WIDTH = 180 + 12; // width + gap
const SCROLL_BY = TILE_WIDTH * 3;

export function SpeciesFilmstrip() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    return () => el.removeEventListener("scroll", updateArrows);
  }, [updateArrows]);

  const scrollLeft = useCallback(() => {
    trackRef.current?.scrollBy({ left: -SCROLL_BY, behavior: "smooth" });
  }, []);

  const scrollRight = useCallback(() => {
    trackRef.current?.scrollBy({ left: SCROLL_BY, behavior: "smooth" });
  }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    if (e.key === "ArrowRight") el.scrollBy({ left: TILE_WIDTH, behavior: "smooth" });
    if (e.key === "ArrowLeft") el.scrollBy({ left: -TILE_WIDTH, behavior: "smooth" });
  }, []);

  return (
    <div style={{ position: "relative" }}>
      {/* Left arrow */}
      {canLeft && (
        <button
          onClick={scrollLeft}
          aria-label="Scroll left"
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 2,
            background: "var(--color-paper)",
            border: "1px solid var(--color-hairline)",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Right arrow */}
      {canRight && (
        <button
          onClick={scrollRight}
          aria-label="Scroll right"
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 2,
            background: "var(--color-paper)",
            border: "1px solid var(--color-hairline)",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      <div
        ref={trackRef}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="region"
        aria-label="Species you may encounter — scroll to explore"
        style={{
          display: "flex",
          gap: "0.75rem",
          overflowX: "auto",
          scrollbarWidth: "none",
          padding: "0.5rem 0 1rem",
          outline: "none",
        }}
        className="species-filmstrip-track"
      >
        {SPECIES.map((tile, i) => (
          <Link
            key={`${tile.name}-${i}`}
            href={tile.href}
            style={{
              flexShrink: 0,
              width: "180px",
              border: "1px solid var(--color-hairline)",
              borderRadius: "8px",
              overflow: "hidden",
              background: "var(--color-paper)",
              textDecoration: "none",
              display: "block",
              cursor: "pointer",
            }}
          >
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
                    height: "133%",
                    objectFit: "cover",
                    objectPosition: "center top",
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
                  fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif',
                  fontWeight: 400,
                  fontSize: "0.9375rem",
                  color: "var(--color-ink)",
                  lineHeight: 1.3,
                  marginBottom: "0.125rem",
                }}
              >
                {tile.name}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-sans), "IBM Plex Sans", system-ui, sans-serif',
                  fontWeight: 300,
                  fontSize: "0.6875rem",
                  color: "var(--color-muted, #6b7280)",
                  lineHeight: 1.3,
                  marginBottom: "0.25rem",
                }}
              >
                {tile.location}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono), "IBM Plex Mono", ui-monospace, monospace',
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  color: tile.labelColor,
                  lineHeight: 1,
                }}
              >
                {tile.label}
              </div>
            </div>
          </Link>
        ))}

        <style>{`
          .species-filmstrip-track::-webkit-scrollbar { display: none; }
          .species-filmstrip-track:focus-visible { outline: 2px solid #F6C700; outline-offset: 2px; }
        `}</style>
      </div>
    </div>
  );
}
