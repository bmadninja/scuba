"use client";

import { useState } from "react";

type Props = { siteName: string; onScrollToForm: () => void };

export function PreDiveBrief({ siteName, onScrollToForm }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <section
        id="pre-dive-brief"
        style={{
          border: "1px solid rgba(0,212,255,0.18)",
          background: "rgba(0,212,255,0.03)",
          borderRadius: "1.25rem",
          padding: "1.5rem 1.6rem",
          marginBottom: "1.5rem",
        }}
      >
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 800,
            color: "#f0f4f8",
            marginBottom: "0.5rem",
            letterSpacing: "-0.02em",
          }}
        >
          Planning to dive {siteName}?
        </h3>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#aebcd0",
            lineHeight: 1.65,
            marginBottom: "1rem",
            maxWidth: 560,
          }}
        >
          Your underwater photos help scientists track reef health here in real time. Every
          sighting you submit feeds directly into the databases that conservation
          organisations use to monitor coral bleaching, species population shifts, and reef
          recovery.
        </p>

        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#8b9db8",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "0.4rem",
          }}
        >
          What to photograph
        </p>
        <ul
          style={{
            margin: "0 0 1rem",
            padding: "0 0 0 1.1rem",
            fontSize: "0.875rem",
            color: "#aebcd0",
            lineHeight: 1.7,
          }}
        >
          <li>Fish and marine life — even if you do not know the species</li>
          <li>Coral — especially anything pale, white, or unusual</li>
          <li>Anything unexpected — invasive species, debris, unusual behaviour</li>
        </ul>

        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#8b9db8",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "0.4rem",
          }}
        >
          How to capture it
        </p>
        <ul
          style={{
            margin: "0 0 1.25rem",
            padding: "0 0 0 1.1rem",
            fontSize: "0.875rem",
            color: "#aebcd0",
            lineHeight: 1.7,
          }}
        >
          <li>Shoot JPEG — conservation databases cannot accept RAW files</li>
          <li>Keep location turned on — GPS coordinates are required</li>
          <li>Note your depth and the date</li>
        </ul>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
          <button
            type="button"
            onClick={onScrollToForm}
            style={{
              background: "#00d4ff",
              color: "#0a1628",
              border: "none",
              borderRadius: "0.625rem",
              padding: "0.6rem 1.1rem",
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Submit a sighting after your dive →
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              background: "none",
              border: "none",
              color: "#00d4ff",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
          >
            How does this work? →
          </button>
        </div>
      </section>

      {modalOpen && (
        <MethodologyModal siteName={siteName} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}

function MethodologyModal({
  siteName,
  onClose,
}: {
  siteName: string;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="How your sighting reaches scientists"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "rgba(10,22,40,0.82)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#0d1f35",
          border: "1px solid rgba(0,212,255,0.2)",
          borderRadius: "1.25rem",
          padding: "2rem",
          maxWidth: 560,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            color: "#8b9db8",
            fontSize: "1.25rem",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <h3
          style={{
            fontSize: "1.05rem",
            fontWeight: 800,
            color: "#f0f4f8",
            marginBottom: "1rem",
            letterSpacing: "-0.02em",
          }}
        >
          How your sighting reaches scientists
        </h3>

        <p style={{ fontSize: "0.875rem", color: "#aebcd0", lineHeight: 1.65, marginBottom: "1.25rem" }}>
          When you submit a photo on Scuba Season, we send it to 5 conservation databases on
          your behalf:
        </p>

        {[
          {
            name: "iNaturalist",
            desc:
              "The world's largest biodiversity observation platform, used by 400,000 active scientists and naturalists monthly. Your photo is reviewed by the community and, once confirmed, reaches Research Grade status.",
          },
          {
            name: "GBIF",
            desc:
              "The Global Biodiversity Information Facility — an intergovernmental network used by researchers in 100+ countries. Research Grade iNaturalist observations flow here automatically.",
          },
          {
            name: "OBIS",
            desc:
              "The Ocean Biodiversity Information System — the global repository for marine species data, used by IUCN, UN Environment, and reef monitoring programmes worldwide.",
          },
          {
            name: "iSeahorse",
            desc:
              "Project Seahorse's global seahorse population database, tracking one of the ocean's most threatened species groups. Only triggered if you photograph a seahorse.",
          },
          {
            name: "CoralWatch",
            desc:
              "University of Queensland's global coral bleaching monitor, tracking reef health across 79 countries. Only triggered if you photograph coral and record depth and bleaching score.",
          },
        ].map((platform) => (
          <div key={platform.name} style={{ marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f0f4f8", marginBottom: "0.2rem" }}>
              {platform.name}
            </p>
            <p style={{ fontSize: "0.8125rem", color: "#aebcd0", lineHeight: 1.6, margin: 0 }}>
              {platform.desc}
            </p>
          </div>
        ))}

        <p
          style={{
            fontSize: "0.8125rem",
            color: "#8b9db8",
            lineHeight: 1.6,
            marginTop: "1.25rem",
            borderTop: "1px solid rgba(0,212,255,0.12)",
            paddingTop: "1rem",
          }}
        >
          Your sighting at {siteName} will appear in our reef health data within 24 to 48
          hours and contributes to the reef label and trajectory we show on this page.
        </p>

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: "1.25rem",
            background: "#00d4ff",
            color: "#0a1628",
            border: "none",
            borderRadius: "0.625rem",
            padding: "0.6rem 1.25rem",
            fontWeight: 700,
            fontSize: "0.875rem",
            cursor: "pointer",
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
