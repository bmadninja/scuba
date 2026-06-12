"use client";

import { useState } from "react";

const TESTIMONIALS = [
  {
    quote:
      "It is really informative. I was surprised to see Komodo and Raja Ampat are both thriving. It made me want to save those trips later and prioritize places that are witnessing change now.",
    attr: "Diver, Hong Kong",
  },
  {
    quote:
      "Finally a site that tells me the truth about reef health rather than just trying to sell me a trip.",
    attr: "Marine biologist, Australia",
  },
];

export function LandingTestimonial() {
  const [idx, setIdx] = useState(0);
  const t = TESTIMONIALS[idx];

  return (
    <div
      style={{
        overflow: "hidden",
        background: "#070f1e",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "3.5rem 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          padding: "0 3rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "clamp(1.125rem, 1.8vw, 1.4375rem)",
            fontWeight: 700,
            fontStyle: "italic",
            color: "#fff",
            lineHeight: 1.45,
            letterSpacing: "-0.015em",
            margin: 0,
          }}
        >
          &ldquo;{t.quote}&rdquo;
        </p>
        <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", margin: 0 }}>
          {t.attr}
        </p>
      </div>
    </div>
  );
}
