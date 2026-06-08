"use client";
import { useState } from "react";

export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="More information"
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 16, height: 16, borderRadius: "50%",
          background: "rgba(100,116,139,0.12)", border: "1px solid rgba(100,116,139,0.25)",
          color: "#64748b", fontSize: "0.6rem", fontWeight: 700,
          cursor: "pointer", lineHeight: 1, marginLeft: "0.3rem", flexShrink: 0,
        }}
      >?</button>
      {open && (
        <>
          <span
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 49 }}
            aria-hidden
          />
          <span style={{
            position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
            transform: "translateX(-50%)", zIndex: 50,
            background: "#1e293b", color: "rgba(255,255,255,0.85)",
            fontSize: "0.75rem", lineHeight: 1.5, padding: "0.5rem 0.75rem",
            borderRadius: "0.5rem", width: 220, boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            whiteSpace: "normal", pointerEvents: "none",
          }}>
            {text}
          </span>
        </>
      )}
    </span>
  );
}
