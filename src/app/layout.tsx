import type { Metadata, Viewport } from "next";
import { Source_Serif_4, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { JsonLd } from "@/components/json-ld";
import { AtlasNav } from "@/components/atlas-nav";
import { AtlasFooter } from "@/components/atlas-footer";
import { NavProvider } from "@/components/nav-context";
import { getAllAtlasLocations } from "@/lib/atlas-location";
import { organizationSchema, websiteSchema } from "@/lib/schema-org";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site-config";

// Heading / display serif — Source Serif 4.
const sourceSerif4 = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  display: "swap",
});

// Body / UI sans — IBM Plex Sans.
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

// Data labels, eyebrows, stat values — IBM Plex Mono.
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Build the nav search dataset once for every route.
  const entries = getAllAtlasLocations().map((l) => ({
    slug: l.slug,
    name: l.name,
    country: l.country,
    region: l.region,
    state: l.state,
  }));

  return (
    <html
      lang="en"
      className={`${sourceSerif4.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ background: "var(--color-paper)", color: "var(--color-ink)" }}>
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
        <NavProvider>
          <AtlasNav entries={entries} />
          <main className="flex-1">{children}</main>
        </NavProvider>
        <AtlasFooter />
        <Analytics />
      </body>
    </html>
  );
}
