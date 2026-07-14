import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The reef state method, in full — Scuba Season",
  description:
    "The complete method behind every reef state label: the exact formulas, thresholds, source datasets and citations that turn raw reef data into one plain word.",
};

const INK = "var(--color-ink)";
const INK2 = "var(--color-ink-2)";
const HAIRLINE = "var(--color-hairline)";
const OCEAN = "var(--color-ocean)";
const PAPER = "var(--color-paper)";
const IMPROVING = "var(--color-improving)";
const STABLE = "var(--color-stable)";
const DECLINING = "var(--color-declining)";
const mono = "var(--font-mono), 'IBM Plex Mono', monospace";
const serif = "var(--font-serif), 'Source Serif 4', Georgia, serif";

function code(text: string) {
  return (
    <code
      style={{
        fontFamily: mono,
        fontSize: "0.9em",
        background: "rgba(14,28,40,0.07)",
        padding: "0.05rem 0.3rem",
        borderRadius: 4,
        color: INK,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </code>
  );
}

/* ── shared styles ─────────────────────────────────────────────────────── */
const h2Style: React.CSSProperties = {
  fontFamily: serif,
  fontSize: "clamp(1.5rem, 3vw, 2rem)",
  fontWeight: 400,
  letterSpacing: "-0.02em",
  color: INK,
  paddingBottom: "0.6rem",
  borderBottom: `2px solid ${HAIRLINE}`,
  marginBottom: "1.1rem",
};
const h3Style: React.CSSProperties = {
  fontFamily: serif,
  fontSize: "1.25rem",
  fontWeight: 400,
  color: INK,
  margin: "2rem 0 0.6rem",
};
const pStyle: React.CSSProperties = {
  fontSize: "0.95rem",
  lineHeight: 1.7,
  color: INK2,
  maxWidth: 680,
  margin: "0 0 1rem",
};
const kicker: React.CSSProperties = {
  fontFamily: mono,
  fontSize: "0.6rem",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: INK2,
  margin: "0 0 0.5rem",
};
const tableWrap: React.CSSProperties = {
  overflowX: "auto",
  border: `1px solid ${HAIRLINE}`,
  borderRadius: "0.7rem",
  margin: "0 0 1.25rem",
  maxWidth: 680,
};
const table: React.CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
  fontSize: "0.82rem",
};
const th: React.CSSProperties = {
  textAlign: "left",
  padding: "0.55rem 0.85rem",
  fontFamily: mono,
  fontSize: "0.6rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: INK2,
  borderBottom: `1px solid ${HAIRLINE}`,
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "0.5rem 0.85rem",
  color: INK2,
  borderBottom: `1px solid ${HAIRLINE}`,
  verticalAlign: "top",
  lineHeight: 1.5,
};

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: mono,
        fontSize: "0.85rem",
        lineHeight: 1.7,
        color: INK,
        background: "rgba(14,28,40,0.04)",
        border: `1px solid ${HAIRLINE}`,
        borderRadius: "0.7rem",
        padding: "0.9rem 1.1rem",
        margin: "0 0 1.25rem",
        maxWidth: 680,
        whiteSpace: "pre-wrap",
        overflowX: "auto",
      }}
    >
      {children}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: "0.82rem",
        lineHeight: 1.6,
        color: INK2,
        borderLeft: `2px solid ${STABLE}`,
        paddingLeft: "0.85rem",
        margin: "0 0 1.25rem",
        maxWidth: 660,
      }}
    >
      <b style={{ color: INK, fontFamily: mono, fontSize: "0.7rem", letterSpacing: "0.05em" }}>
        MODELLED, NOT MEASURED —{" "}
      </b>
      {children}
    </p>
  );
}

export default function MethodPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <header
        style={{
          background: PAPER,
          borderBottom: `1px solid ${HAIRLINE}`,
          padding: "4rem 3rem 3rem",
        }}
      >
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <p style={{ ...kicker, color: OCEAN, fontSize: "0.6875rem", letterSpacing: "0.18em", marginBottom: "1rem" }}>
            <Link href="/data" style={{ color: OCEAN, textDecoration: "none" }}>
              How this works
            </Link>{" "}
            / The reef state method, in full
          </p>
          <h1
            style={{
              fontFamily: serif,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 300,
              fontStyle: "italic",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              maxWidth: 720,
              color: INK,
            }}
          >
            How we score every reef
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "1.1rem",
              lineHeight: 1.65,
              color: INK2,
              marginTop: "1.1rem",
              maxWidth: 640,
            }}
          >
            The plain explainer lives on the{" "}
            <Link href="/data#rs-label" style={{ color: OCEAN }}>
              main method page
            </Link>
            . This page documents the full math behind it: every formula, every
            threshold, the exact source datasets, and the citations behind the
            modelled steps. Where a step is an estimate rather than a
            measurement, it is marked as such.
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 780, margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>
        {/* ── THE MODEL IN ONE VIEW ─────────────────────────────────────── */}
        <section style={{ marginBottom: "3.5rem" }}>
          <h2 style={h2Style}>The model in one view</h2>
          <p style={pStyle}>
            Two <b style={{ color: INK }}>state</b> signals build a level from 1
            to 5. Two <b style={{ color: INK }}>pressure</b> signals then gate
            that level into one of four words. The full pipeline:
          </p>
          <Formula>
            {`coral cover %      ─→  coralLevel   (1–5)   ┐
fish biomass       ─→  standing     ─→ fishLevel (1–5) ┤─→ conditionLevel = min(present levels)
                                                       ┘
conditionLevel  +  heat alert (gate)  +  fishing (gate)  ─→  Improving | Stable | Declining | Not surveyed`}
          </Formula>
          <p style={pStyle}>
            Precedence is strict and evaluated in this order (first match wins),
            mirroring{" "}
            <code style={{ fontFamily: mono, fontSize: "0.85em", color: INK }}>
              computeReefState
            </code>
            :
          </p>
          <Formula>
            {`1. Not surveyed  if  no coral AND no heat AND no biomass reading
2. Declining     if  coral < 25%  OR  fishLevel ≤ 2  OR  heatRank ≥ 3
3. Improving     if  (coral ≥ 40% or absent)
                 AND (fishLevel ≥ 4 or absent)
                 AND heatRank ≤ 1
                 AND fishing permits improving
                 AND coral not measurably falling
4. Stable        otherwise`}
          </Formula>
          <p style={pStyle}>
            Everything below defines each term in that block precisely.
          </p>
        </section>

        {/* ── 1. CORAL COVER ────────────────────────────────────────────── */}
        <section style={{ marginBottom: "3.5rem" }}>
          <h2 style={h2Style}>1. Coral cover to a level</h2>

          <h3 style={h3Style}>What the number is, and where it comes from</h3>
          <p style={pStyle}>
            Coral cover is the percent of the reef floor that is living hard
            coral, from a benthic survey. It is a{" "}
            <b style={{ color: INK }}>regional programme figure</b>, not a survey
            of the individual reef: each reef inherits the published mean cover
            of the monitoring programme that covers its region. Different regions
            use different programmes. The current set:
          </p>
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Region (example)</th>
                  <th style={th}>Programme</th>
                  <th style={th}>Figure used</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={td}>Florida Keys</td>
                  <td style={td}>NOAA NCRMP</td>
                  <td style={td}>6.7% (2022 benthic status report)</td>
                </tr>
                <tr>
                  <td style={td}>Great Barrier Reef</td>
                  <td style={td}>AIMS Long Term Monitoring</td>
                  <td style={td}>Programme regional mean</td>
                </tr>
                <tr>
                  <td style={td}>Other regions</td>
                  <td style={td}>GCRMN nodes, Reef Check</td>
                  <td style={td}>Programme regional mean</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={pStyle}>
            There are 13 regional jurisdictions in the current build, each with
            its programme name, method, survey year, and a link to the source
            report. When a reef has more than one coral reading on file, the
            model uses the <b style={{ color: INK }}>highest</b> value as the
            current cover, and pairs it with that reading&rsquo;s prior year as
            the before value for the falling check.
          </p>
          <Note>
            The per reef cover is the region&rsquo;s mean, not a measurement at
            that exact reef. A measured per reef benthic value is planned but not
            in this version.
          </Note>

          <h3 style={h3Style}>The level bins</h3>
          <p style={pStyle}>
            Cover maps to a 1 to 5 level with hard cut points. Note the split
            inside the 20 to 39 band that the plain page rounds over:
          </p>
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Coral cover</th>
                  <th style={th}>Level</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={td}>{code("cover ≥ 40%")}</td><td style={td}>5</td></tr>
                <tr><td style={td}>{code("30% ≤ cover < 40%")}</td><td style={td}>4</td></tr>
                <tr><td style={td}>{code("20% ≤ cover < 30%")}</td><td style={td}>3</td></tr>
                <tr><td style={td}>{code("10% ≤ cover < 20%")}</td><td style={td}>2</td></tr>
                <tr><td style={td}>{code("cover < 10%")}</td><td style={td}>1</td></tr>
              </tbody>
            </table>
          </div>
          <p style={pStyle}>
            Falling check: the reef is &ldquo;measurably falling&rdquo; when the
            current cover is strictly below the paired before value. This blocks
            Improving but does not on its own force Declining.
          </p>
        </section>

        {/* ── 2. FISH BIOMASS ───────────────────────────────────────────── */}
        <section style={{ marginBottom: "3.5rem" }}>
          <h2 style={h2Style}>2. Fish biomass to a level</h2>

          <h3 style={h3Style}>The observed number</h3>
          <p style={pStyle}>
            Observed fish biomass is reef fish weight per hectare from{" "}
            <a href="https://reeflifesurvey.com/" target="_blank" rel="noopener" style={{ color: OCEAN }}>
              Reef Life Survey
            </a>{" "}
            standard visual transects (RLS Method 1), taken as the{" "}
            <b style={{ color: INK }}>latest survey year</b> in the site&rsquo;s
            series. In this version the series is{" "}
            <b style={{ color: INK }}>proximity matched</b>: the nearest RLS site
            to the reef, which is why the biomass trend is shown for context but
            is not allowed to move the label.
          </p>

          <h3 style={h3Style}>The benchmark (B0), and the formula</h3>
          <p style={pStyle}>
            Standing stock is the observed biomass as a fraction of{" "}
            <b style={{ color: INK }}>B0</b>, the biomass an equivalent reef
            would carry if it were barely fished. B0 is the &ldquo;1.0&rdquo;.
            The score is:
          </p>
          <Formula>
            {`standing  = clamp( observedKgPerHa / B0KgPerHa , 0 , 1 )`}
          </Formula>
          <Note>
            B0 is <b style={{ color: INK }}>estimated</b>, not measured per reef.
            We do not have a measured unfished biomass for each site in this
            version. B0 is read from the reef&rsquo;s gravity band (section 4),
            the same covariate the literature uses to predict reef fish biomass.
            A measured, gravity derived and field validated B0 is deferred to the
            next version.
          </Note>
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Gravity band</th>
                  <th style={th}>Estimated B0 (kg/ha)</th>
                  <th style={th}>Rationale</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={td}>low</td><td style={td}>1200</td><td style={td}>remote, high potential reef</td></tr>
                <tr><td style={td}>moderate</td><td style={td}>1000</td><td style={td}>global unfished benchmark (MacNeil 2015)</td></tr>
                <tr><td style={td}>high</td><td style={td}>850</td><td style={td}>accessible, pressured</td></tr>
                <tr><td style={td}>very high</td><td style={td}>700</td><td style={td}>chronic human footprint</td></tr>
              </tbody>
            </table>
          </div>

          <h3 style={h3Style}>The level bins</h3>
          <p style={pStyle}>
            Standing maps to a 1 to 5 level. The 0.25 to 0.49 band splits at its
            midpoint, 0.375, which the plain page rounds over:
          </p>
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Standing (observed / B0)</th>
                  <th style={th}>Level</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={td}>{code("standing ≥ 0.75")}</td><td style={td}>5</td></tr>
                <tr><td style={td}>{code("0.50 ≤ standing < 0.75")}</td><td style={td}>4</td></tr>
                <tr><td style={td}>{code("0.375 ≤ standing < 0.50")}</td><td style={td}>3</td></tr>
                <tr><td style={td}>{code("0.25 ≤ standing < 0.375")}</td><td style={td}>2</td></tr>
                <tr><td style={td}>{code("standing < 0.25")}</td><td style={td}>1</td></tr>
              </tbody>
            </table>
          </div>
          <Note>
            Scope guard: biomass is only scored where the reef has both an RLS
            series and a reef gravity cell. Reef gravity is defined on tropical
            coral reef pixels, so on temperate or cold water reefs there is no
            valid tropical B0 benchmark, the fish level is null, and the label
            runs on coral alone.
          </Note>
        </section>

        {/* ── 3. LOWER OF TWO ───────────────────────────────────────────── */}
        <section style={{ marginBottom: "3.5rem" }}>
          <h2 style={h2Style}>3. Combine to a condition level</h2>
          <p style={pStyle}>
            The condition level is the lower of the two state levels that are
            present. If only one is present (commonly coral, since biomass needs
            both an RLS series and a gravity cell), that one is used alone.
          </p>
          <Formula>
            {`conditionLevel = min( coralLevel, fishLevel )   // over present levels only`}
          </Formula>
        </section>

        {/* ── 4. GRAVITY BANDS ──────────────────────────────────────────── */}
        <section style={{ marginBottom: "3.5rem" }}>
          <h2 style={h2Style}>4. Reef gravity bands</h2>
          <p style={pStyle}>
            Reef gravity (Andrello and Cinner) is a per reef index of human
            fishing pressure and access. We band the site&rsquo;s value by its{" "}
            <b style={{ color: INK }}>global percentile</b>, so the bands are
            worldwide quartiles: a &ldquo;very high&rdquo; reef sits in the worst
            25% of reefs for fishing pressure. This band feeds both the B0
            benchmark (section 2) and the fishing fallback (section 6).
          </p>
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Global percentile</th>
                  <th style={th}>Band</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={td}>{code("percentile < 0.25")}</td><td style={td}>low</td></tr>
                <tr><td style={td}>{code("0.25 ≤ p < 0.50")}</td><td style={td}>moderate</td></tr>
                <tr><td style={td}>{code("0.50 ≤ p < 0.75")}</td><td style={td}>high</td></tr>
                <tr><td style={td}>{code("p ≥ 0.75")}</td><td style={td}>very high</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 5. HEAT GATE ──────────────────────────────────────────────── */}
        <section style={{ marginBottom: "3.5rem" }}>
          <h2 style={h2Style}>5. Heat gate</h2>
          <p style={pStyle}>
            Heat is the{" "}
            <a href="https://coralreefwatch.noaa.gov/" target="_blank" rel="noopener" style={{ color: OCEAN }}>
              NOAA Coral Reef Watch
            </a>{" "}
            Bleaching Alert Area level (derived from Degree Heating Weeks on the 5
            km product). We take the <b style={{ color: INK }}>worst</b> alert on
            file for the reef and rank it:
          </p>
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>NOAA alert level</th>
                  <th style={th}>Rank</th>
                  <th style={th}>Effect on the label</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={td}>No stress</td><td style={td}>0</td><td style={td}>permits Improving</td></tr>
                <tr><td style={td}>Watch</td><td style={td}>1</td><td style={td}>permits Improving</td></tr>
                <tr><td style={td}>Warning</td><td style={td}>2</td><td style={td}>blocks Improving, does not force Declining</td></tr>
                <tr><td style={td}>Alert Level 1</td><td style={td}>3</td><td style={td}>forces Declining</td></tr>
                <tr><td style={td}>Alert Level 2</td><td style={td}>4</td><td style={td}>forces Declining</td></tr>
              </tbody>
            </table>
          </div>
          <p style={pStyle}>
            So Improving needs {code("heatRank ≤ 1")}, and any{" "}
            {code("heatRank ≥ 3")} forces Declining on its own, because an active
            bleaching alert is measured damage in progress. Rank 2 is the middle
            case that the plain page does not name.
          </p>
        </section>

        {/* ── 6. FISHING GATE ───────────────────────────────────────────── */}
        <section style={{ marginBottom: "3.5rem" }}>
          <h2 style={h2Style}>6. Fishing gate</h2>
          <p style={pStyle}>
            Fishing pressure resolves from the highest authority source
            available, then reconciles against protection. It only gates
            Improving; it never forces Declining.
          </p>

          <h3 style={h3Style}>Source priority</h3>
          <Formula>
            {`1. Global Fishing Watch apparent fishing hours   (industrial vessels, where AIS sees them)
2. else reef gravity band                        (universal Andrello / Cinner model)
3. else editorial fallback
4. else "unknown"`}
          </Formula>

          <h3 style={h3Style}>GFW effort bands</h3>
          <p style={pStyle}>
            Apparent fishing hours per year within the query radius, log scaled
            because the distribution is heavily right skewed:
          </p>
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Apparent fishing hours / year</th>
                  <th style={th}>Band</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={td}>{code("hours < 200")}</td><td style={td}>low</td></tr>
                <tr><td style={td}>{code("200 ≤ hours < 2,500")}</td><td style={td}>moderate</td></tr>
                <tr><td style={td}>{code("2,500 ≤ hours < 25,000")}</td><td style={td}>high</td></tr>
                <tr><td style={td}>{code("hours ≥ 25,000")}</td><td style={td}>very high</td></tr>
              </tbody>
            </table>
          </div>

          <h3 style={h3Style}>Reconcile with protection</h3>
          <p style={pStyle}>
            Protection status comes from MPAtlas (no take or strict MPA counts as
            protected). Protection can only strengthen a read the measurement
            already supports:
          </p>
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Protected AND measured effort</th>
                  <th style={th}>Result</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={td}>protected + low</td><td style={td}>{code("protected")}</td></tr>
                <tr><td style={td}>protected + high or very high</td><td style={td}>{code("paper park")}</td></tr>
                <tr><td style={td}>anything else</td><td style={td}>the raw measured band</td></tr>
              </tbody>
            </table>
          </div>
          <p style={pStyle}>
            Improving is permitted only when the reconciled read is{" "}
            {code("protected")}, {code("low")}, or {code("unknown")}. Unknown
            gets the benefit of the doubt, since there is no measurement to say
            otherwise.
          </p>
        </section>

        {/* ── 7. FINAL LABEL ────────────────────────────────────────────── */}
        <section style={{ marginBottom: "3.5rem" }}>
          <h2 style={h2Style}>7. The four labels</h2>
          <p style={pStyle}>
            Putting every term together, in evaluation order:
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              maxWidth: 680,
              marginBottom: "1.25rem",
            }}
          >
            {[
              { c: INK2, n: "Not surveyed", r: "no coral reading AND no heat reading AND no biomass reading" },
              { c: DECLINING, n: "Declining", r: "coral < 25%  OR  fishLevel ≤ 2  OR  heatRank ≥ 3" },
              { c: IMPROVING, n: "Improving", r: "(coral ≥ 40% or absent) AND (fishLevel ≥ 4 or absent) AND heatRank ≤ 1 AND fishing permits improving AND coral not falling" },
              { c: STABLE, n: "Stable", r: "anything that matches none of the above" },
            ].map((s) => (
              <div
                key={s.n}
                style={{
                  border: `1px solid ${HAIRLINE}`,
                  borderLeft: `3px solid ${s.c}`,
                  borderRadius: "0.6rem",
                  padding: "0.75rem 1rem",
                  background: PAPER,
                }}
              >
                <p style={{ fontWeight: 700, color: s.c, fontSize: "0.95rem", margin: "0 0 0.25rem" }}>
                  {s.n}
                </p>
                <p style={{ fontFamily: mono, fontSize: "0.75rem", lineHeight: 1.6, color: INK2, margin: 0 }}>
                  {s.r}
                </p>
              </div>
            ))}
          </div>
          <p style={pStyle}>
            Because the checks run in this order, Declining is tested before
            Improving, so a reef that trips a Declining condition can never read
            Improving in the same pass.
          </p>
        </section>

        {/* ── 8. HOW SURE WE ARE ────────────────────────────────────────── */}
        <section style={{ marginBottom: "3.5rem" }}>
          <h2 style={h2Style}>8. How sure we are</h2>
          <p style={pStyle}>
            There is no confidence badge on a reef page. A single reading and a
            real trend are not the same thing, so the{" "}
            <b style={{ color: INK }}>coral cover chart</b> carries this openly:
            it plots every dated coral survey we hold for the reef, and the shape
            of that line is the honest signal of how much we know.
          </p>
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Coral surveys on file</th>
                  <th style={th}>What the chart shows</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={td}>3 or more, spanning at least 4 years</td><td style={td}>a line across the years, a measured direction</td></tr>
                <tr><td style={td}>2</td><td style={td}>before and after, so it rose or fell, but this is not yet a trend line</td></tr>
                <tr><td style={td}>1</td><td style={td}>a single point, the level today, not a direction</td></tr>
                <tr><td style={td}>0</td><td style={td}>no line, and the reef reads Not surveyed rather than a guess</td></tr>
              </tbody>
            </table>
          </div>
          <p style={pStyle}>
            The other three pillars each show a current reading on their own
            marked scale rather than a line, so their confidence is read the same
            plain way: a reading is on file, or the pillar reads Not surveyed. Heat
            uses the worst alert on record, and fishing uses the best measured
            source available (section 6).
          </p>
          <p
            style={{
              fontSize: "0.82rem",
              lineHeight: 1.6,
              color: INK2,
              borderLeft: `2px solid ${HAIRLINE}`,
              paddingLeft: "0.85rem",
              margin: "0 0 1.25rem",
              maxWidth: 660,
            }}
          >
            <b style={{ color: INK, fontFamily: mono, fontSize: "0.7rem", letterSpacing: "0.05em" }}>
              INTERNAL ONLY —{" "}
            </b>
            An A to D confidence tier per pillar exists behind the scenes to steer
            where we chase new surveys, but it is a coverage tool and is not
            surfaced on any reef page. The chart above is what a reader sees.
          </p>
        </section>

        {/* ── SOURCES + CITATIONS ───────────────────────────────────────── */}
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={h2Style}>Sources and citations</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem", maxWidth: 680 }}>
            {[
              ["Coral cover", "NOAA NCRMP, AIMS Long Term Monitoring Program, GCRMN, Reef Check — regional benthic monitoring programmes, per jurisdiction."],
              ["Fish biomass", "Reef Life Survey (Edgar and Stuart-Smith), standard visual transect Method 1, biomass kg/ha."],
              ["B0 benchmark", "MacNeil et al. 2015, Nature — global unfished reef fish biomass ~1000 kg/ha. Cinner et al. 2016 (Nature), 2018 (PNAS) — gravity of human impacts on reef fish."],
              ["Reef gravity", "Andrello et al. 2022 — global reef gravity (grav_NC), banded by global percentile."],
              ["Heat stress", "NOAA Coral Reef Watch — Bleaching Alert Area from Degree Heating Weeks, 5 km product."],
              ["Fishing effort", "Global Fishing Watch — apparent fishing effort (AIS), hours per year within the query radius."],
              ["Protection", "MPAtlas (Marine Conservation Institute) — no take and strict MPA status."],
            ].map(([k, v]) => (
              <li key={k} style={{ fontSize: "0.85rem", lineHeight: 1.6, color: INK2 }}>
                <b style={{ color: INK }}>{k}.</b> {v}
              </li>
            ))}
          </ul>
          <p style={{ ...pStyle, marginTop: "1.5rem" }}>
            Every source above is also listed, with live status and links, on the{" "}
            <Link href="/data#sources" style={{ color: OCEAN }}>
              sources section
            </Link>{" "}
            of the main method page.
          </p>
        </section>

        <div style={{ borderTop: `1px solid ${HAIRLINE}`, paddingTop: "1.5rem" }}>
          <Link href="/data#rs-label" style={{ color: OCEAN, fontSize: "0.9rem", fontWeight: 600, textDecoration: "none" }}>
            ← Back to the plain explainer
          </Link>
        </div>
      </main>
    </>
  );
}
