import type { Metadata } from "next";
import Link from "next/link";
import sourcesData from "@/data/sources.json";

export const metadata: Metadata = {
  title: "FAQ — How we calculate it | scubaSeason.fun",
  description:
    "How scubaSeason.fun calculates coral cover, reef state, DHW thermal stress, sighting evidence, and dive conditions. Every metric explained with its source and confidence level.",
};

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "#10b981",
  medium: "#f59e0b",
  low: "#f43f5e",
};

const FAQS: {
  q: string;
  a: string;
  sourceIds?: string[];
  confidence?: string;
  caveat?: string;
}[] = [
  {
    q: "How do you assign a reef state (Thriving / Under pressure / Witnessing change)?",
    a: "Reef state is a judgment call that weighs four signals: (1) hard coral cover — current percentage vs. the site's historical baseline; (2) thermal stress — NOAA Coral Reef Watch DHW accumulated over the last 12 weeks; (3) fishing pressure — Global Fishing Watch AIS-tracked hours within 50 km over the last 12 months; and (4) survey freshness — how recently peer-reviewed data was collected. Thriving means coral cover is holding near baseline, heat stress is low, and pressure is light. Under pressure means one or more signals are degraded but the reef is still actively dived. Witnessing change means the reef has fundamentally shifted — coral cover below 20%, repeated bleaching events, or heavy chronic pressure.",
    sourceIds: ["noaa-crw", "aims-ltmp", "global-fishing-watch"],
    confidence: "medium",
    caveat: "Reef state is updated when new survey data is ingested — not in real time. Some locations have survey gaps of 1–3 years.",
  },
  {
    q: "What is DHW (Degree Heating Weeks) and how is it used?",
    a: "Degree Heating Weeks is a NOAA metric that measures accumulated thermal stress on a reef. It counts how many weeks sea surface temperature has exceeded the maximum monthly mean (the historical warm-season average) by more than 1 °C, summed over the past 12 weeks. DHW ≥ 4 causes bleaching in susceptible corals; DHW ≥ 8 causes widespread bleaching and mortality. We pull daily 5 km resolution DHW from NOAA Coral Reef Watch and display the value for the grid cell nearest to each location centroid.",
    sourceIds: ["noaa-crw"],
    confidence: "high",
    caveat: "5 km resolution means the displayed value may not reflect localised upwelling or shaded reef micro-habitats.",
  },
  {
    q: "How is coral cover calculated?",
    a: "Hard coral cover is expressed as the percentage of the benthos (sea floor) covered by living hard coral, measured by point-intercept transect or photo-quadrat surveys. We use published values from peer-reviewed monitoring programs (AIMS Long-Term Monitoring Program, Reef Check, GCRMN). Where a current survey exists we show the most recent value. Where only historical data is available we note the year. The 'historical baseline' is the earliest reliable survey in the record for that location — typically 1980s–1990s for well-studied reefs.",
    sourceIds: ["aims-ltmp", "reef-check", "gcrmn"],
    confidence: "medium",
    caveat: "Global coral cover data is uneven. Some locations have 2 data points; others have 40 years of annual surveys. We show what exists — coverage gaps are disclosed on each location page.",
  },
  {
    q: "How does the sighting evidence window work?",
    a: "Each species shown on a site detail page can have sighting evidence attached. Evidence comes from iNaturalist research-grade observations within a configurable proximity radius (typically 10–25 km) of the site centroid. We use a rolling 24-month window — only records confirmed within the last two years count toward the 'last confirmed' date and recent record count. Older records still inform the species list (curated from operator knowledge and dive guides) but are shown with lower confidence.",
    sourceIds: ["inaturalist"],
    confidence: "medium",
    caveat: "iNaturalist coverage is biased toward popular dive destinations and citizen-science-active communities. Remote sites may show 0 recent records despite regular sightings.",
  },
  {
    q: "How are dive conditions (temp, visibility, current) calculated?",
    a: "Monthly conditions come from climatological reanalysis and forecast models averaged over 10–20 years of historical data for the location's grid cell. Water temperature from HYCOM / Copernicus Marine. Visibility is estimated from Kd490 diffuse attenuation (Copernicus Ocean Colour) as a proxy for water clarity — not a direct measurement. Current strength is derived from tidal and oceanographic models (NOAA CO-OPS, ECMWF). These give 'what to expect in this month' framing — they are not day-of forecasts.",
    sourceIds: ["noaa-co-ops", "ecmwf-open", "hycom", "copernicus-marine"],
    confidence: "medium",
    caveat: "None of this replaces a local operator's morning briefing. Tropical cyclones, ENSO events, and localised upwelling can shift conditions dramatically from the climatological norm.",
  },
  {
    q: "Where does fishing pressure data come from?",
    a: "Fishing pressure is sourced from Global Fishing Watch (GFW), which uses satellite AIS (Automatic Identification System) transponder data to track commercial fishing vessel activity. We display fishing hours within 50 km of the location centroid over the prior 12 months. AIS is mandatory for vessels over 300 GT in international waters — small-scale artisanal fishing fleets are largely invisible to GFW. This means low GFW scores in some regions (Southeast Asia, West Africa) reflect a monitoring gap, not the absence of pressure.",
    sourceIds: ["global-fishing-watch"],
    confidence: "medium",
    caveat: "AIS blind spot for artisanal fleets is significant in many high-biodiversity regions. Do not interpret low GFW hours as 'no fishing pressure' without local context.",
  },
  {
    q: "What does the survey freshness indicator mean?",
    a: "Survey freshness shows how many days have elapsed since the most recent peer-reviewed data point for that location was published or collected. A green dot means within 365 days. Amber means 1–3 years. Grey means older than 3 years or unknown. Freshness matters because reef conditions can change rapidly after bleaching events — a 5-year-old survey may predate a major mortality event. We surface freshness prominently so you can weigh the confidence in any location's current state.",
    confidence: "high",
  },
  {
    q: "How are species reliability labels assigned?",
    a: "'Year-round' means the species is consistently encountered at this site across all months — typically resident species like reef sharks, turtles, or cleaning station mantas. 'Seasonal' means the species follows a predictable seasonal pattern, with peak months shown from published encounter guides and operator reports. 'Rare' means the species has been recorded at or near the site but is not reliably encountered — usually pelagic visitors or species at the edge of their range. Labels are set editorially from curated dive guide sources and refined by iNaturalist seasonality data where records are sufficient.",
    confidence: "medium",
  },
  {
    q: "How do you calculate the 'best months' for a site?",
    a: "Best months represent the recommended dive season — when conditions (water temperature, visibility, current, weather) are at their climatological optimum AND the key species encounters are most likely. For sites with a clear season (monsoon-driven or current-driven), best months reflect the dry season / peak current window. For year-round destinations, best months are the period with lowest chance of disruptive weather. Multiple operators and published dive guides are cross-referenced; the final call is editorial.",
    confidence: "medium",
  },
  {
    q: "Where do wreck details come from?",
    a: "Wreck data is drawn from naval historical records (US Navy NHHC, DANFS — Dictionary of American Naval Fighting Ships), NOAA Maritime Heritage Program, and NOAA Electronic Navigational Charts (ENC Direct). Vessel identity, sinking date, and depth range are taken from these authoritative archives. General history is drawn from the same sources and cross-referenced with local dive operator knowledge.",
    sourceIds: ["noaa-maritime-heritage", "noaa-enc-direct"],
    confidence: "high",
    caveat: "Not every dive-accessible wreck is in official government archives. Some wrecks are documented only in diver community sources and are not listed here.",
  },
  {
    q: "Are affiliate links editorially independent?",
    a: "Yes. Operator, lodging, and gear links are curated based on diver reviews, local reputation, and relevance to the site — not based on whether a commission is paid. Affiliate links are labelled. Non-affiliate links to excellent operators are included freely. Commission rates do not influence which operators appear or their sort order. Full policy at /about.",
    confidence: "high",
  },
];

type Source = { id: string; name: string; url?: string; description?: string };

export default function FaqPage() {
  const sources = sourcesData as Source[];
  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "3.5rem 3rem" }}>
      <nav style={{ marginBottom: "1.5rem", fontSize: "0.8125rem", color: "#64748b" }}>
        <Link href="/" style={{ color: "#64748b", textDecoration: "none" }}>← Atlas</Link>
        <span style={{ margin: "0 0.5rem" }}>·</span>
        <Link href="/data" style={{ color: "#64748b", textDecoration: "none" }}>Data</Link>
      </nav>

      <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#64748b", marginBottom: "0.5rem" }}>
        FAQ
      </p>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a", marginBottom: "0.75rem" }}>
        How we calculate it
      </h1>
      <p style={{ fontSize: "0.9375rem", color: "#475569", lineHeight: 1.7, marginBottom: "0.5rem", maxWidth: 640 }}>
        Every metric on this atlas traces to a specific data source and methodology. This page explains the calculations behind reef state, coral cover, DHW, conditions, species reliability, and more.
      </p>
      <p style={{ fontSize: "0.8125rem", color: "#94a3b8", marginBottom: "3rem" }}>
        {FAQS.length} questions · See also:{" "}
        <Link href="/data" style={{ color: "#0089de", textDecoration: "none" }}>Data sources</Link>
        {" · "}
        <Link href="/about" style={{ color: "#0089de", textDecoration: "none" }}>About &amp; editorial policy</Link>
      </p>

      {/* FAQ list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {FAQS.map((faq, i) => (
          <details
            key={i}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "1rem",
              overflow: "hidden",
            }}
          >
            <summary
              style={{
                padding: "1.25rem 1.5rem",
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "#0f172a",
                cursor: "pointer",
                listStyle: "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <span>{faq.q}</span>
              <span style={{ fontSize: "1.25rem", color: "#94a3b8", flexShrink: 0 }}>+</span>
            </summary>

            <div style={{ padding: "0 1.5rem 1.5rem", borderTop: "1px solid #f1f5f9" }}>
              <p style={{ fontSize: "0.9rem", lineHeight: 1.75, color: "#334155", marginTop: "1rem", marginBottom: faq.caveat || (faq.sourceIds && faq.sourceIds.length > 0) ? "1rem" : 0 }}>
                {faq.a}
              </p>

              {faq.caveat && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "0.75rem", padding: "0.75rem 1rem", marginBottom: "1rem" }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>Caveat</p>
                  <p style={{ fontSize: "0.8125rem", color: "#78350f", lineHeight: 1.6 }}>{faq.caveat}</p>
                </div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
                {faq.confidence && (
                  <span style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: CONFIDENCE_COLOR[faq.confidence] ?? "#64748b", border: `1px solid ${CONFIDENCE_COLOR[faq.confidence] ?? "#e2e8f0"}`, borderRadius: 999, padding: "0.2rem 0.6rem" }}>
                    {faq.confidence} confidence
                  </span>
                )}
                {faq.sourceIds?.map((id) => {
                  const src = sourceMap.get(id);
                  return src ? (
                    <a
                      key={id}
                      href={src.url ?? "#"}
                      target="_blank"
                      rel="nofollow noopener"
                      style={{ fontSize: "0.6875rem", color: "#0089de", textDecoration: "none", border: "1px solid #e2e8f0", borderRadius: 999, padding: "0.2rem 0.6rem" }}
                    >
                      {src.name}
                    </a>
                  ) : null;
                })}
              </div>
            </div>
          </details>
        ))}
      </div>

      {/* Footer note */}
      <div style={{ marginTop: "3rem", padding: "1.5rem", background: "#f1f7fb", borderRadius: "1.25rem", border: "1px solid #e2e8f0" }}>
        <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
          Something missing or wrong?
        </p>
        <p style={{ fontSize: "0.8125rem", color: "#475569", lineHeight: 1.6 }}>
          If you spot a factual error, an outdated data point, or a methodology question this page doesn&apos;t answer,{" "}
          <a href="mailto:hello@scubaseason.fun" style={{ color: "#0089de", textDecoration: "none" }}>email us</a>.
          We update this page when methodologies change.
        </p>
      </div>
    </div>
  );
}
