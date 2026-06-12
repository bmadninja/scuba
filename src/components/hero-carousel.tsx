"use client";

import { useEffect, useRef, useState } from "react";
import { FinderModule } from "./finder-module";

const DEFAULT_GRADIENT = "linear-gradient(to bottom,rgba(3,7,18,0.28) 0%,rgba(3,7,18,0.10) 38%,rgba(3,7,18,0.62) 80%,rgba(3,7,18,0.88) 100%)";

const SLIDES = [
  {
    imageUrl:
      "https://images.unsplash.com/photo-1675829604010-509cca710300?w=3840&q=90&auto=format&fit=crop",
    imageAlt: "Manta ray gliding over a coral reef",
    imagePosition: "center 20%",
    content: (
      <>
        <h1 className="hero-slide-h1">
          Know the reef before you dive.
        </h1>
        <p
          style={{
            fontSize: "clamp(0.9375rem,1.1vw,1.0625rem)",
            lineHeight: 1.55,
            color: "rgba(240,244,248,0.86)",
            marginTop: "1rem",
            maxWidth: 500,
            textShadow: "0 1px 12px rgba(3,7,18,0.5)",
          }}
        >
          Live health status, species sightings, and conservation data for every site.
        </p>
      </>
    ),
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=3840&q=90&auto=format&fit=crop",
    imageAlt: "Vibrant coral reef in Raja Ampat, Indonesia",
    imagePosition: "center 60%",
    gradient: "linear-gradient(to bottom,rgba(3,7,18,0.52) 0%,rgba(3,7,18,0.28) 30%,rgba(3,7,18,0.72) 72%,rgba(3,7,18,0.94) 100%)",
    content: (
      <>
        <p
          style={{
            fontSize: "clamp(1.1rem,2.2vw,1.75rem)",
            fontWeight: 700,
            lineHeight: 1.35,
            color: "#ffffff",
            maxWidth: 540,
            textShadow: "0 2px 28px rgba(3,7,18,0.75)",
            fontStyle: "italic",
          }}
        >
          &ldquo;I am surprised to find on ScubaSeason that Komodo and Raja Ampat are both thriving. Made me want to delay the trips there a little.&rdquo;
        </p>
        <p
          style={{
            fontSize: "0.875rem",
            color: "rgba(240,244,248,0.7)",
            marginTop: "0.875rem",
            textShadow: "0 1px 12px rgba(3,7,18,0.5)",
            letterSpacing: "0.02em",
          }}
        >
          Diver, Hong Kong
        </p>
      </>
    ),
  },
];

export function HeroCarousel({ currentMonth }: { currentMonth: number }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const hoveredRef = useRef(false);
  const activeIndexRef = useRef(0);

  const scrollTo = (idx: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: idx * track.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const slides = Array.from(track.children) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = slides.indexOf(entry.target as HTMLElement);
            if (idx !== -1) setActiveIndex(idx);
          }
        }
      },
      { root: track, threshold: 0.5 }
    );

    slides.forEach((s) => observer.observe(s));

    const interval = setInterval(() => {
      if (hoveredRef.current) return;
      const next = (activeIndexRef.current + 1) % SLIDES.length;
      scrollTo(next);
    }, 5000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section
      aria-label="Hero"
      onMouseEnter={() => { hoveredRef.current = true; }}
      onMouseLeave={() => { hoveredRef.current = false; }}
      style={{
        position: "relative",
        height: "clamp(480px, 78vh, 760px)",
        overflow: "hidden",
      }}
    >
      {/* Scrollable slide track */}
      <div
        ref={trackRef}
        style={{
          display: "flex",
          height: "100%",
          overflowX: "scroll",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {SLIDES.map((slide, i) => (
          <div
            key={i}
            style={{
              position: "relative",
              flex: "0 0 100%",
              height: "100%",
              scrollSnapAlign: "start",
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.imageUrl}
              alt={slide.imageAlt}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: slide.imagePosition,
              }}
            />
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: slide.gradient ?? DEFAULT_GRADIENT,
              }}
            />
            <div
              className="home-hero-content"
              style={{
                position: "relative",
                zIndex: 2,
                width: "100%",
                maxWidth: 1320,
                margin: "0 auto",
              }}
            >
              {i === 0 ? (
                <div className="hero-finder-grid">
                  <div className="hero-finder-left">
                    {slide.content}
                  </div>
                  <div className="hero-finder-right">
                    <FinderModule currentMonth={currentMonth} />
                  </div>
                </div>
              ) : (
                slide.content
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div
        aria-label="Slide indicators"
        style={{
          position: "absolute",
          bottom: "1.25rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "0.5rem",
          zIndex: 10,
        }}
      >
        {SLIDES.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => scrollTo(i)}
            style={{
              width: i === activeIndex ? "1.5rem" : "0.5rem",
              height: "0.5rem",
              borderRadius: "9999px",
              border: "none",
              cursor: "pointer",
              padding: 0,
              background:
                i === activeIndex
                  ? "#ffffff"
                  : "rgba(255,255,255,0.45)",
              transition: "width 0.25s ease, background 0.25s ease",
            }}
          />
        ))}
      </div>
    </section>
  );
}
