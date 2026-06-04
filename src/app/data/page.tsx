import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Method — what's live, what's a snapshot, what we can't see",
  description:
    "Plain English data freshness for scubaSeason.fun. NOAA Coral Reef Watch is live nightly; coral cover is a snapshot from named monitoring programs.",
};

export default function DataPage() {
  return (
    <>
      {/* PAGE HEADER — surface background */}
      <header
        style={{
          background: "#f1f7fb",
          borderBottom: "1px solid #e2e8f0",
          padding: "5rem 3rem 4rem",
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <p
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#0089de",
              marginBottom: "1rem",
            }}
          >
            Method
          </p>
          <h1
            style={{
              fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.06,
              color: "#0f172a",
              marginBottom: "1.25rem",
            }}
          >
            What&rsquo;s live, what&rsquo;s a snapshot, what we can&rsquo;t
            see.
          </h1>
          <p
            style={{
              fontFamily: "var(--font-serif), 'Source Serif 4', serif",
              fontSize: "1.1rem",
              lineHeight: 1.75,
              color: "#475569",
            }}
          >
            scubaSeason mixes daily satellite data with much older in-water
            survey snapshots. The labels next to every reef number on the site
            tell you which is which. This page lays out the whole picture.
          </p>
          {/* TOC pills */}
          <nav
            aria-label="Page sections"
            style={{ display: "flex", gap: "1.5rem", marginTop: "2.5rem", flexWrap: "wrap" }}
          >
            {[
              { href: "#live", label: "What’s live daily" },
              { href: "#snapshots", label: "Coral cover snapshots" },
              { href: "#freshness", label: "Freshness labels" },
              { href: "#reef-state", label: "Reef state" },
              { href: "#sources", label: "All sources" },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "#0089de",
                  textDecoration: "none",
                  padding: "0.4rem 0.875rem",
                  borderRadius: 999,
                  border: "1px solid rgba(0,137,222,0.25)",
                  background: "rgba(0,137,222,0.06)",
                }}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* PAGE BODY */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "4rem 3rem" }}>

        {/* SECTION: What updates every night */}
        <section
          id="live"
          style={{
            marginBottom: "4rem",
            paddingBottom: "4rem",
            borderBottom: "1px solid #e2e8f0",
            scrollMarginTop: "6rem",
          }}
        >
          <p
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: "0.75rem",
            }}
          >
            Daily satellite
          </p>
          <h2
            style={{
              fontSize: "1.625rem",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              color: "#0f172a",
              marginBottom: "1.25rem",
            }}
          >
            What updates every night
          </h2>
          <p style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "#334155", marginBottom: "1.5rem" }}>
            Three signals pulled nightly from NOAA&rsquo;s public ERDDAP
            endpoint against the lat/lng of every reef on the atlas.
          </p>

          {/* Live data card */}
          <div
            style={{
              border: "1px solid #a7f3d0",
              borderRadius: "1.25rem",
              overflow: "hidden",
              margin: "1.5rem 0",
            }}
          >
            <div
              style={{
                padding: "1rem 1.375rem",
                background: "#e7f6ee",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#10b981",
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#065f46",
                }}
              >
                NOAA Coral Reef Watch &middot; 5&nbsp;km &middot; v3.1 &middot;
                refreshed nightly
              </span>
            </div>
            <div style={{ padding: "1.25rem 1.375rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {[
                  {
                    name: "Bleaching Alert Area",
                    note: "No stress / Watch / Warning / Alert 1 / Alert 2",
                  },
                  {
                    name: "Degree Heating Weeks",
                    note: "°C-weeks of accumulated thermal stress",
                  },
                  {
                    name: "SST anomaly",
                    note: "°C above or below climatology baseline",
                  },
                ].map(({ name, note }) => (
                  <div
                    key={name}
                    style={{ display: "flex", alignItems: "center", gap: "0.875rem", fontSize: "0.875rem" }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#10b981",
                        flexShrink: 0,
                        display: "inline-block",
                      }}
                    />
                    <span
                      style={{
                        fontWeight: 600,
                        color: "#0f172a",
                        minWidth: 220,
                      }}
                    >
                      {name}
                    </span>
                    <span style={{ color: "#64748b" }}>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "#334155" }}>
            These three signals drive the thermal stress indicator on every
            location page. It tells you what&rsquo;s happening right now —
            not what happened last year.
          </p>
        </section>

        {/* SECTION: Coral cover — a snapshot */}
        <section
          id="snapshots"
          style={{
            marginBottom: "4rem",
            paddingBottom: "4rem",
            borderBottom: "1px solid #e2e8f0",
            scrollMarginTop: "6rem",
          }}
        >
          <p
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: "0.75rem",
            }}
          >
            In-water surveys
          </p>
          <h2
            style={{
              fontSize: "1.625rem",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              color: "#0f172a",
              marginBottom: "1.25rem",
            }}
          >
            Coral cover — a snapshot, not a live feed
          </h2>
          <div style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "#334155" }}>
            <p style={{ marginBottom: "1rem" }}>
              The coral cover percentage comes from in-water scientific surveys
              — line transects and point intercept surveys done by reef
              monitoring programs. We show two data points per site so you can
              see the trajectory, not just a number: the earliest survey on file
              and the most recent.
            </p>
            <p>
              This is not live data. Surveys happen infrequently. For many reefs
              outside established monitoring programs, the most recent number is
              years old. We label the year on every figure so you know exactly
              what you&rsquo;re looking at.
            </p>
          </div>

          {/* Snapshot card */}
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "1.25rem",
              overflow: "hidden",
              margin: "1.5rem 0",
            }}
          >
            <div
              style={{
                padding: "1rem 1.375rem",
                background: "#f1f7fb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#64748b",
                }}
              >
                Survey baseline by region
              </span>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                When continuous monitoring began
              </span>
            </div>
            {[
              {
                region: "Great Barrier Reef",
                year: "1986",
                note: "AIMS Long Term Monitoring Program — the longest continuous reef survey on Earth.",
              },
              {
                region: "Florida Keys & Caribbean US",
                year: "1995",
                note: "NOAA NCRMP + earlier Florida Reef Tract programs.",
              },
              {
                region: "Indo-Pacific (most sites)",
                year: "2014",
                note: "Most sites only have a baseline from the Third Global Coral Bleaching Event. For many, that’s the first quantitative measurement on record.",
              },
              {
                region: "Western Indian Ocean",
                year: "Single survey",
                note: "Some sites have one survey ever. Treat the displayed cover as a single observation, not a trend.",
              },
            ].map(({ region, year, note }) => (
              <div
                key={region}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1rem",
                  padding: "1rem 1.375rem",
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#0f172a",
                    minWidth: 220,
                    flexShrink: 0,
                  }}
                >
                  {region}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: "#0089de",
                    background: "#e8f0fe",
                    padding: "0.15rem 0.5rem",
                    borderRadius: 4,
                    flexShrink: 0,
                    width: 96,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {year}
                </span>
                <span style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "#64748b" }}>
                  {note}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION: Freshness key */}
        <section
          id="freshness"
          style={{
            marginBottom: "4rem",
            paddingBottom: "4rem",
            borderBottom: "1px solid #e2e8f0",
            scrollMarginTop: "6rem",
          }}
        >
          <p
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: "0.75rem",
            }}
          >
            Data freshness
          </p>
          <h2
            style={{
              fontSize: "1.625rem",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              color: "#0f172a",
              marginBottom: "1.25rem",
            }}
          >
            How we label data age
          </h2>
          <p style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "#334155", marginBottom: "1.5rem" }}>
            Every data point that can go stale carries a freshness dot. There
            are three states:
          </p>
          <div
            style={{ display: "flex", gap: "1.5rem", margin: "1.5rem 0", flexWrap: "wrap" }}
          >
            {[
              { color: "#10b981", label: "Fresh", note: "Survey within the last year" },
              { color: "#e8962f", label: "Stale", note: "1–3 years since last survey" },
              { color: "#e23a3a", label: "Cold", note: "More than 3 years ago" },
            ].map(({ color, label, note }) => (
              <div
                key={label}
                style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: color,
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a" }}>
                    {label}
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "#64748b" }}>{note}</p>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "#334155" }}>
            Thermal stress is always Fresh — it&rsquo;s pulled nightly. Coral
            cover and fishing pressure are almost always Stale or Cold for most
            of the world. That&rsquo;s honest. We&rsquo;d rather show a Cold
            number with a clear label than hide it behind an optimistic bar
            chart.
          </p>
        </section>

        {/* SECTION: Reef state */}
        <section
          id="reef-state"
          style={{
            marginBottom: "4rem",
            paddingBottom: "4rem",
            borderBottom: "1px solid #e2e8f0",
            scrollMarginTop: "6rem",
          }}
        >
          <p
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: "0.75rem",
            }}
          >
            Classification
          </p>
          <h2
            style={{
              fontSize: "1.625rem",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              color: "#0f172a",
              marginBottom: "1.25rem",
            }}
          >
            How reef state is assigned
          </h2>
          <div style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "#334155" }}>
            <p style={{ marginBottom: "1rem" }}>
              Reef state is a judgment call made from the combination of live
              thermal data, coral cover (where we have it), and fishing
              pressure. It&rsquo;s not a score or an average — it&rsquo;s an
              editorial decision that tries to answer:{" "}
              <strong>what is this reef actually doing right now?</strong>
            </p>
            <p>
              When data is thin or contradictory, we default to &ldquo;Under
              pressure&rdquo; rather than &ldquo;Thriving.&rdquo; The bias is
              toward honesty, not hope.
            </p>
          </div>
        </section>

        {/* SECTION: All 38 data sources */}
        <section
          id="sources"
          style={{ scrollMarginTop: "6rem" }}
        >
          <p
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: "0.75rem",
            }}
          >
            Sources
          </p>
          <h2
            style={{
              fontSize: "1.625rem",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              color: "#0f172a",
              marginBottom: "1.25rem",
            }}
          >
            All 38 data sources
          </h2>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "1.5rem",
              fontSize: "0.875rem",
            }}
          >
            <thead>
              <tr>
                {["Source", "Type", "Used for"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "0.625rem 0.875rem",
                      fontSize: "0.625rem",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#64748b",
                      background: "#f1f7fb",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {
                  name: "NOAA Coral Reef Watch v3.1",
                  live: true,
                  usedFor: "Thermal stress, bleaching alerts, SST anomaly",
                },
                {
                  name: "AIMS Long Term Monitoring Program",
                  live: false,
                  usedFor: "GBR coral cover time series",
                },
                {
                  name: "IUCN Red List of Threatened Species",
                  live: false,
                  usedFor: "Species conservation status, population trend",
                },
                {
                  name: "Global Fishing Watch AIS data",
                  live: true,
                  usedFor: "Fishing pressure per location",
                },
                {
                  name: "NOAA NCRMP",
                  live: false,
                  usedFor: "US Pacific and Caribbean coral cover",
                },
                {
                  name: "iNaturalist Research Grade observations",
                  live: true,
                  usedFor: "Species sighting evidence, occurrence records",
                },
                {
                  name: "AGRRA Atlantic and Gulf Rapid Reef Assessment",
                  live: false,
                  usedFor: "Caribbean reef condition",
                },
                {
                  name: "+ 31 more program-specific datasets",
                  live: null,
                  usedFor: "Regional baselines, site-specific surveys",
                },
              ].map(({ name, live, usedFor }, i) => (
                <tr key={name}>
                  <td
                    style={{
                      padding: "0.875rem",
                      borderBottom: i < 7 ? "1px solid #e2e8f0" : undefined,
                      fontWeight: 600,
                      color: "#0f172a",
                      verticalAlign: "top",
                    }}
                  >
                    {name}
                  </td>
                  <td
                    style={{
                      padding: "0.875rem",
                      borderBottom: i < 7 ? "1px solid #e2e8f0" : undefined,
                      color: "#334155",
                      verticalAlign: "top",
                    }}
                  >
                    {live === null ? (
                      <span style={{ color: "#94a3b8" }}>—</span>
                    ) : live ? (
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: "0.5875rem",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          padding: "0.2rem 0.5rem",
                          borderRadius: 4,
                          background: "#e7f6ee",
                          color: "#065f46",
                        }}
                      >
                        Live
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: "0.5875rem",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          padding: "0.2rem 0.5rem",
                          borderRadius: 4,
                          background: "#f1f7fb",
                          color: "#64748b",
                        }}
                      >
                        Snapshot
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "0.875rem",
                      borderBottom: i < 7 ? "1px solid #e2e8f0" : undefined,
                      color: "#334155",
                      verticalAlign: "top",
                    }}
                  >
                    {usedFor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ─── HOW METRICS ARE CALCULATED (merged from /faq) ─── */}
        <section id="how-calculated" style={{ marginBottom: "4rem", paddingBottom: "4rem", borderBottom: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#64748b", marginBottom: "0.75rem" }}>
            How metrics work
          </p>
          <h2 style={{ fontSize: "1.625rem", fontWeight: 800, letterSpacing: "-0.025em", color: "#0f172a", marginBottom: "1.25rem" }}>
            How reef metrics are calculated
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

            <div>
              <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.875rem" }}>Coral cover</h3>
              <div style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "#334155", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                <p>The number we show is <strong>live coral cover</strong> — the percentage of the seafloor at the dive location that is covered by living, healthy coral. It comes from in water surveys (line or point intercept transects) done by reef monitoring programs.</p>
                <p>Higher is better. A healthy tropical reef sits around <strong>50% live cover</strong>. Anything under 30% is a reef that has lost a lot, and under 20% is severely degraded.</p>
                <p>We show two snapshots of the same site so you can see its trajectory, not a generic baseline: a decade ago (the earlier survey on file) and today (the most recent). The year of each survey is shown under the bar.</p>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.875rem" }}>The &ldquo;at this rate&rdquo; projection</h3>
              <div style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "#334155", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                <p>When a reef is losing cover, we extend the line forward. The math is deliberately simple: take the difference between the two surveys, divide by the years between them to get annual loss, then divide today&rsquo;s cover by that rate to get years until zero.</p>
                <p>This is a <strong>linear extrapolation</strong>, not a forecast. Treat the year as a &ldquo;if nothing changes, you&rsquo;ve got this long&rdquo; signal, not a prediction. We don&rsquo;t show a projection when a reef is holding steady or recovering, or when we only have one survey on file.</p>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.875rem" }}>NOAA bleaching alert levels</h3>
              <div style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "#334155", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                <p>The five levels track how much heat the reef has absorbed, measured in <strong>degree heating weeks</strong> (°C-weeks):</p>
                <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <li><strong>No stress</strong> — sea surface temperature at or below the warmest monthly mean.</li>
                  <li><strong>Watch</strong> — SST above the warmest monthly mean, DHW still near zero.</li>
                  <li><strong>Warning</strong> — DHW between roughly 0 and 4 °C-weeks. Possible bleaching, mortality unlikely.</li>
                  <li><strong>Alert 1</strong> — DHW ≥ 4 °C-weeks. Significant bleaching expected.</li>
                  <li><strong>Alert 2</strong> — DHW ≥ 8 °C-weeks. Widespread bleaching and significant mortality likely.</li>
                </ul>
                <p>These are categorical thresholds, not predictions. A reef shown at Alert 2 may still recover; one shown at No Stress can be hit by next month&rsquo;s heatwave.</p>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.875rem" }}>Can you tell me if a reef is dying?</h3>
              <div style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "#334155", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                <p>Honestly — no, not from what we have today. We can tell you the current thermal stress alert level, what live coral cover was at the last in water survey, and what that survey measured a decade earlier when both snapshots exist.</p>
                <p>What we <em>cannot</em> defensibly say: that fish populations are declining, that sharks are &ldquo;disappearing,&rdquo; or that a reef is on a terminal trajectory. Sightings without an effort denominator don&rsquo;t support trend claims, and we won&rsquo;t pretend they do.</p>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.875rem" }}>How is scubaSeason funded?</h3>
              <div style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "#334155", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                <p>Today: affiliate links to operators, lodging, and gear. If you book through one of those links, the site earns a commission. Editorial recommendations and source disclosures don&rsquo;t change based on commission rates — see <a href="/about" style={{ color: "#0089de" }}>About → Editorial independence</a>.</p>
                <p>Longer term, the affiliate income is a floor, not the plan. The wedges we&rsquo;re looking at are research and NGO data subscriptions, and evidence infrastructure for conservation funders after bleaching events. Neither exists yet.</p>
              </div>
            </div>

          </div>
        </section>

      </div>
    </>
  );
}
