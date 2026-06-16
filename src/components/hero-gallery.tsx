"use client";
import { useState, useCallback } from "react";
import { underwaterPhotoUrl } from "@/lib/photo-quality";

export function HeroGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const valid = images.map((u) => underwaterPhotoUrl(u)).filter(Boolean) as string[];
  const [idx, setIdx] = useState(0);

  const prev = useCallback(() => setIdx((i) => (i - 1 + valid.length) % valid.length), [valid.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % valid.length), [valid.length]);

  if (valid.length === 0) return null;

  const btnStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.32)",
    border: "0.5px solid rgba(255,255,255,0.28)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    fontSize: 20,
    lineHeight: 1,
    userSelect: "none",
  };

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={valid[idx]}
        src={valid[idx]}
        alt={alt}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        loading="eager"
        decoding="sync"
        fetchPriority="high"
      />

      {valid.length > 1 && (
        <>
          <button onClick={prev} aria-label="Previous photo" style={{ ...btnStyle, left: 14 }}>
            ‹
          </button>
          <button onClick={next} aria-label="Next photo" style={{ ...btnStyle, right: 14 }}>
            ›
          </button>
          <div
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              display: "flex",
              gap: 5,
              zIndex: 10,
            }}
          >
            {valid.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Photo ${i + 1} of ${valid.length}`}
                style={{
                  width: i === idx ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === idx ? "#fff" : "rgba(255,255,255,0.45)",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "width 0.2s, background 0.2s",
                }}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
