"use client";

import Link from "next/link";
import { useRef, useCallback } from "react";
import { ReefHealthBadge } from "@/components/reef-health-badge";

type ReefState = "improving" | "stable" | "declining";

export interface MosaicCard {
  slug: string;
  name: string;
  country: string;
  heroImageUrl: string;
  state: ReefState;
}

export function FeaturedReefMosaic({ cards }: { cards: MosaicCard[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    isDragging.current = true;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeft.current = el.scrollLeft;
    el.style.cursor = "grabbing";
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const el = trackRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.2;
    el.scrollLeft = scrollLeft.current - walk;
  }, []);

  const stopDrag = useCallback(() => {
    isDragging.current = false;
    const el = trackRef.current;
    if (el) el.style.cursor = "grab";
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={trackRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        style={{
          display: "flex",
          gap: "0.75rem",
          overflowX: "auto",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
          cursor: "grab",
          padding: "0.25rem 0 1rem",
          userSelect: "none",
        }}
        className="featured-reef-mosaic-track"
        tabIndex={0}
        role="region"
        aria-label="Featured reef locations — scroll to explore"
        onKeyDown={(e) => {
          const el = trackRef.current;
          if (!el) return;
          if (e.key === "ArrowRight") el.scrollBy({ left: 296, behavior: "smooth" });
          if (e.key === "ArrowLeft") el.scrollBy({ left: -296, behavior: "smooth" });
        }}
      >
        {cards.map((card) => (
          <Link
            key={card.slug}
            href={`/locations/${card.slug}`}
            draggable={false}
            className="mosaic-card-link"
            style={{
              flexShrink: 0,
              width: "280px",
              height: "380px",
              borderRadius: "8px",
              overflow: "hidden",
              position: "relative",
              display: "block",
              textDecoration: "none",
            }}
          >
            {/* Photo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.heroImageUrl}
              alt={`Underwater photograph at ${card.name}`}
              loading="lazy"
              draggable={false}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 300ms ease",
                pointerEvents: "none",
              }}
              className="mosaic-card-img"
            />
            {/* Gradient overlay */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom, transparent 40%, rgba(14,28,40,0.80) 100%)",
                pointerEvents: "none",
              }}
            />
            {/* Bottom content */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "0.875rem",
              }}
            >
              <ReefHealthBadge state={card.state} onPhoto />
              <div
                style={{
                  fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif',
                  fontWeight: 400,
                  fontSize: "1rem",
                  color: "#FFFFFF",
                  marginTop: "0.4rem",
                  lineHeight: 1.25,
                }}
              >
                {card.name}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-sans), "IBM Plex Sans", system-ui, sans-serif',
                  fontWeight: 300,
                  fontSize: "0.6875rem",
                  color: "rgba(255,255,255,0.70)",
                  marginTop: "0.2rem",
                }}
              >
                {card.country}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        .featured-reef-mosaic-track::-webkit-scrollbar { display: none; }
        .mosaic-card-link:hover .mosaic-card-img { transform: scale(1.04); }
        .mosaic-card-link:focus-visible { outline: 2px solid #F6C700; outline-offset: 2px; border-radius: 8px; }
      `}</style>
    </div>
  );
}
