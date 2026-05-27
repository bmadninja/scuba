import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { JsonLd } from "@/components/json-ld";
import { organizationSchema, websiteSchema } from "@/lib/schema-org";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site-config";

const notoSans = Noto_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
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
  return (
    <html lang="en" className={`${notoSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-white text-slate-900">
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
        {children}
        <footer className="mt-auto border-t border-slate-200 bg-slate-50 px-6 py-4 text-center text-[11px] leading-5 text-slate-500">
          Thermal stress data: NOAA Coral Reef Watch 5&nbsp;km Bleaching Alert Area
          v3.1, public domain. Coral cover figures are snapshots from named
          monitoring programs — see{" "}
          <a href="/data" className="text-[#0089de] hover:underline">
            /data
          </a>{" "}
          for sources and freshness.
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
