import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_URL } from "@/lib/site-config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE_NAME} — The dive atlas with real data.`;

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(160deg, #020c18 0%, #041c35 45%, #062845 100%)",
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Depth rings — decorative underwater light circles */}
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -120,
            width: 600,
            height: 600,
            borderRadius: "50%",
            border: "1px solid rgba(0, 210, 170, 0.12)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -200,
            top: -200,
            width: 760,
            height: 760,
            borderRadius: "50%",
            border: "1px solid rgba(0, 210, 170, 0.07)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -280,
            top: -280,
            width: 920,
            height: 920,
            borderRadius: "50%",
            border: "1px solid rgba(0, 210, 170, 0.04)",
            display: "flex",
          }}
        />

        {/* Top: site name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#00d4aa",
              letterSpacing: -0.3,
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "rgba(0, 212, 170, 0.5)",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.45)",
              fontWeight: 400,
            }}
          >
            {SITE_URL.replace("https://", "")}
          </div>
        </div>

        {/* Center: headline + sub */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1.0,
              maxWidth: 860,
              color: "#ffffff",
            }}
          >
            The dive atlas with real data.
          </div>
          <div
            style={{
              fontSize: 30,
              color: "rgba(255,255,255,0.6)",
              fontWeight: 400,
              maxWidth: 700,
              lineHeight: 1.45,
            }}
          >
            Reef health, live sightings, and season windows for 100+ sites worldwide.
          </div>
        </div>

        {/* Bottom: stat pills */}
        <div
          style={{
            display: "flex",
            gap: 16,
          }}
        >
          {[
            "63 data sources",
            "Real reef health",
            "Live sightings",
            "Right season",
          ].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "10px 20px",
                borderRadius: 999,
                border: "1px solid rgba(0, 212, 170, 0.3)",
                background: "rgba(0, 212, 170, 0.08)",
                fontSize: 20,
                color: "#00d4aa",
                fontWeight: 500,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
