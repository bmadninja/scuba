import { ImageResponse } from "next/og";
import { getAllSites } from "@/lib/data/sites";
import { getAllLocations } from "@/lib/data/locations";
import { SITE_NAME } from "@/lib/site-config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Scuba Season — the reef atlas built on science";
export const runtime = "nodejs";

export default async function Image() {
  const siteCount = getAllSites().length;
  const locationCount = getAllLocations().length;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(135deg, #0a3d5c 0%, #0089de 55%, #5fb6e8 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.4 }}>
            {SITE_NAME}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1.1,
              maxWidth: 1050,
            }}
          >
            The reef atlas built on science, made for divers.
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 12 }}>
            <Chip>{locationCount} locations</Chip>
            <Chip>{siteCount.toLocaleString("en-US")} dive sites</Chip>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "10px 22px",
        borderRadius: 9999,
        background: "rgba(255,255,255,0.18)",
        border: "1px solid rgba(255,255,255,0.3)",
        fontSize: 26,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}
