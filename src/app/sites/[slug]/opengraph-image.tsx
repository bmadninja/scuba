import { ImageResponse } from "next/og";
import { getSiteBySlug } from "@/lib/data/sites";
import { getLocationById } from "@/lib/data/locations";
import { SITE_NAME } from "@/lib/site-config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Dive site preview";
export const runtime = "nodejs";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = getSiteBySlug(slug);
  const location = site ? getLocationById(site.locationId) : null;

  const name = site?.name ?? "Dive site";
  const where = location ? `${location.name} · ${location.country}` : "";
  const depth = site ? `${site.depthRange.min}–${site.depthRange.max} m` : "";
  const skill = site
    ? site.skillLevel.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

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
          {where ? (
            <div
              style={{
                fontSize: 24,
                textTransform: "uppercase",
                letterSpacing: 4,
                opacity: 0.85,
              }}
            >
              {where}
            </div>
          ) : null}
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1.05,
              maxWidth: 1050,
            }}
          >
            {name}
          </div>
          {site ? (
            <div style={{ display: "flex", gap: 14, marginTop: 12 }}>
              <Chip>{depth}</Chip>
              <Chip>{skill}+</Chip>
            </div>
          ) : null}
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
