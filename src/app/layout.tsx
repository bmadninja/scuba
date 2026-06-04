import type { Metadata } from "next";
import { Noto_Sans, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { JsonLd } from "@/components/json-ld";
import { AtlasNav } from "@/components/atlas-nav";
import { AtlasFooter } from "@/components/atlas-footer";
import { NavProvider } from "@/components/nav-context";
import { getAllAtlasLocations } from "@/lib/atlas-location";
import { organizationSchema, websiteSchema } from "@/lib/schema-org";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site-config";

const notoSans = Noto_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const sourceSerif4 = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

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
  // Build the nav search dataset once for every route. Shape mirrors the
  // `searchEntries` prop the home page passed to <AtlasNav>.
  const entries = getAllAtlasLocations().map((l) => ({
    slug: l.slug,
    name: l.name,
    country: l.country,
    region: l.region,
    state: l.state,
  }));

  return (
    <html lang="en" className={`${notoSans.variable} ${ibmPlexMono.variable} ${sourceSerif4.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-slate-900 font-sans">
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
