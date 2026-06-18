import type { Metadata } from "next";
import Link from "next/link";
import sourcesData from "@/data/sources.json";
import { FaqSection } from "@/components/faq-section";

export const metadata: Metadata = {
  title: "Method — how we read the reefs",
  description:
    "How scubaSeason.fun turns public science into plain reef labels. Reef state from NOAA heat, reef surveys and Global Fishing Watch; sightings from iNaturalist and GBIF. Every source named and linked.",
};

type Source = {
  id: string;
  name: string;
  url?: string;
  refresh?: string;
};

// Curated grouping over the real source ids. Names and links are pulled live
// from sources.json so this list can never drift from the data we actually use.
const SOURCE_GROUPS: { heading: string; ids: string[] }[] = [
  {
    heading: "Heat and ocean physics",
    ids: [
      "noaa-crw",
      "nasa-podaac",
      "copernicus-marine",
      "noaa-coastwatch",
      "nasa-ocean-color",
      "argo",
      "noaa-ndbc",
      "imos-aodn",
      "noaa-co-ops",
      "hycom",
      "gebco",
    ],
  },
  {
    heading: "Coral reef health and monitoring",
    ids: [
      "allen-coral-atlas",
      "gcrmn",
      "aims-ltmp",
      "reef-life-survey",
      "ncrmp",
      "gbrmpa",
      "agrra",
      "icri",
      "wri-reefs-at-risk",
      "ocean-health-index",
      "global-mangrove-watch",
    ],
  },
  {
    heading: "Species and biodiversity records",
    ids: [
      "gbif",
      "obis",
      "iucn-red-list",
      "obis-seamap",
      "worms",
      "fishbase",
      "atlas-living-australia",
      "manta-trust",
      "wildbook",
      "happywhale",
      "ocean-tracking-network",
    ],
  },
  {
    heading: "Citizen science you can join",
    ids: ["inaturalist", "reef-check", "coralwatch", "reef-org", "green-fins"],
  },
  {
    heading: "Fishing and protection",
    ids: ["global-fishing-watch", "wdpa", "mpatlas"],
  },
  {
    heading: "Water quality and hazards",
    ids: [
      "ncei-microplastics",
      "noaa-erma",
      "emodnet-chemistry",
      "noaa-hab-forecast",
      "haedat",
      "goa-on",
      "noaa-mussel-watch",
    ],
  },
  {
    heading: "Weather, storms and seafloor",
    ids: ["ecmwf-open", "era5", "ibtracs", "smithsonian-gvp", "usgs-earthquake"],
  },
  {
    heading: "Wrecks, charts and navigation",
    ids: ["usn-nhhc", "noaa-enc-direct", "noaa-maritime-heritage", "openseamap"],
  },
  {
    heading: "Diver training and safety",
    ids: ["dan", "padi", "ssi", "dema"],
  },
  {
    heading: "Climate science and editorial",
    ids: ["ipcc-srocc", "editorial-curation"],
  },
];

// Reef-state palette (DESIGN.md reef_states, carried unchanged).
const THRIVING = "#15a05c";
const PRESSURE = "#f59e0b";
const CHANGE = "#e23a3a";
const INK = "#f0f4f8";
const BODY = "#aebcd0";
const MUTED = "#8b9db8";
const HAIRLINE = "rgba(255,255,255,0.1)";
const BRAND = "#00d4ff";

const mono = "var(--font-mono), 'IBM Plex Mono', monospace";
const serif = "var(--font-sans)";

function code(text: string) {
  return (
    <code
      style={{
        fontFamily: mono,
        fontSize: "0.9em",
        background: "rgba(255,255,255,0.08)",
        padding: "0.05rem 0.3rem",
        borderRadius: 4,
        color: INK,
      }}
    >
      {text}
    </code>
  );
}

function Conj({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: "0.6875rem",
        fontWeight: 700,
        letterSpacing: "0.06em",
        color: "#8b9db8",
      }}
    >
      {children}
    </span>
  );
}

export default function DataPage() {
  const sourceMap = new Map((sourcesData as Source[]).map((s) => [s.id, s]));
  const totalSources = (sourcesData as Source[]).length;

  const groupTitleStyle: React.CSSProperties = {
    fontSize: "1.9rem",
    fontWeight: 800,
    letterSpacing: "-0.03em",
    color: INK,
    paddingBottom: "0.7rem",
    borderBottom: `2px solid rgba(255,255,255,0.2)`,
  };
  const groupIntroStyle: React.CSSProperties = {
    fontSize: "0.9375rem",
    lineHeight: 1.7,
    color: BODY,
    margin: "1.1rem 0 0",
    maxWidth: 660,
  };
  const subHStyle: React.CSSProperties = {
    fontSize: "1.2rem",
    fontWeight: 800,
    color: INK,
    marginBottom: "0.7rem",
  };
  const subPStyle: React.CSSProperties = {
    fontSize: "0.9375rem",
    lineHeight: 1.7,
    color: BODY,
    marginBottom: "1rem",
    maxWidth: 660,
  };

  const tocLink = (
    href: string,
    label: string,
    kind: "group" | "sub",
  ) => (
    <a
      href={href}
      style={{
        fontSize: kind === "group" ? "0.8125rem" : "0.78rem",
        fontWeight: kind === "group" ? 700 : 500,
        color: kind === "group" ? INK : MUTED,
        textDecoration: "none",
        padding:
          kind === "group" ? "0.4rem 0.7rem" : "0.4rem 0.7rem 0.4rem 1.3rem",
        borderLeft: `2px solid ${kind === "group" ? "rgba(255,255,255,0.15)" : HAIRLINE}`,
      }}
    >
      {label}
    </a>
  );

  return (
    <>
      {/* ===== HERO ===== */}
      <header
        style={{
          background: "linear-gradient(180deg,#0b1e32,#0d2942)",
          color: "#fff",
          padding: "4rem 3rem 3.5rem",
        }}
      >
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <p
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#7dd3fc",
              marginBottom: "1rem",
            }}
          >
            How this works
          </p>
          <h1
            style={{
              fontSize: "clamp(2.25rem,4vw,3.25rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              maxWidth: 760,
            }}
          >
            How we read the reefs
          </h1>
          <p
            style={{
              fontFamily: serif,
              fontSize: "1.2rem",
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.7)",
              marginTop: "1.1rem",
              maxWidth: 640,
            }}
          >
            Every label on this site comes from public science, not opinion.
            Here is exactly where the data comes from, how we turn it into plain
            language, and how you can help fill the gaps.
          </p>
        </div>
      </header>

      {/* ===== BODY: sticky TOC + content ===== */}
      <div className="method-wrap">
        <nav
          className="method-toc"
          aria-label="Page sections"
          style={{
            position: "sticky",
            top: "5rem",
            flexDirection: "column",
            gap: "0.1rem",
            alignSelf: "start",
          }}
        >
          {tocLink("#reefstate", "Reef state", "group")}
          {tocLink("#rs-label", "The label and the rule", "sub")}
          {tocLink("#rs-signals", "The signals behind it", "sub")}
          {tocLink("#sightings", "Sightings", "group")}
          {tocLink("#si-chances", "Your chances", "sub")}
          {tocLink("#si-verify", "How we verify", "sub")}
          {tocLink("#si-labels", "Conservation labels", "sub")}
          {tocLink("#divers", "For divers", "group")}
          {tocLink("#researchers", "For researchers", "group")}
          {tocLink("#limits", "Honest limits", "group")}
          {tocLink("#sources", "All sources", "group")}
        </nav>

        <div className="method-content" style={{ minWidth: 0 }}>
          {/* ============ REEF STATE ============ */}
          <section
            id="reefstate"
            style={{ marginBottom: "4rem", scrollMarginTop: "5rem" }}
          >
            {/* Keep legacy /data#reef-state deep links landing here too. */}
            <span id="reef-state" style={{ position: "absolute", marginTop: "-5rem" }} aria-hidden="true" />
            <h2 style={groupTitleStyle}>Reef state</h2>
            <p style={groupIntroStyle}>
              We read three signals for every reef and turn them into one plain
              word that describes <b style={{ color: INK }}>what is happening</b>{" "}
              there. It is not a ranking and not a score. Every reef is worth
              diving.
            </p>

            <div
              id="rs-label"
              style={{ marginTop: "2.5rem", scrollMarginTop: "5rem" }}
            >
              <h3 style={subHStyle}>One honest label per reef</h3>
              <p style={subPStyle}>
                We read three numbers —{" "}
                <b style={{ color: INK }}>coral cover</b> (live coral percent,
                from reef surveys), <b style={{ color: INK }}>heat stress</b>{" "}
                (the NOAA bleaching alert), and{" "}
                <b style={{ color: INK }}>fishing pressure</b>. Each label below
                is the plain meaning, plus the exact rule that produces it.
              </p>

              <div className="method-state-cards">
                {/* Thriving */}
                <div
                  style={{
                    border: `1px solid ${HAIRLINE}`,
                    borderRadius: "1rem",
                    padding: "1.25rem",
                    borderTop: `3px solid ${THRIVING}`,
                    background: "#0a1628",
                  }}
                >
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: 800,
                      marginBottom: "0.5rem",
                      color: "#15824c",
                    }}
                  >
                    Thriving
                  </p>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: BODY }}>
                    Near its natural baseline and steady. Recovering or healthy,
                    not perfect or untouched.
                  </p>
                  <div
                    style={{
                      marginTop: "0.9rem",
                      paddingTop: "0.85rem",
                      borderTop: `1px solid ${HAIRLINE}`,
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.5875rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: MUTED,
                        marginBottom: "0.35rem",
                      }}
                    >
                      The rule
                    </p>
                    <ul
                      style={{
                        listStyle: "none",
                        margin: "0.45rem 0 0",
                        padding: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.35rem",
                      }}
                    >
                      <li style={condLi}>
                        <span style={condDot} aria-hidden="true" />
                        Coral cover {code("40% or more")} (or not yet surveyed){" "}
                        <Conj>AND</Conj>
                      </li>
                      <li style={condLi}>
                        <span style={condDot} aria-hidden="true" />
                        Heat no worse than {code("Watch")} <Conj>AND</Conj>
                      </li>
                      <li style={condLi}>
                        <span style={condDot} aria-hidden="true" />
                        Fishing {code("low")}
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Under pressure */}
                <div
                  style={{
                    border: `1px solid ${HAIRLINE}`,
                    borderRadius: "1rem",
                    padding: "1.25rem",
                    borderTop: `3px solid ${PRESSURE}`,
                    background: "#0a1628",
                  }}
                >
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: 800,
                      marginBottom: "0.5rem",
                      color: "#1f57c8",
                    }}
                  >
                    Under pressure
                  </p>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: BODY }}>
                    Below its baseline or slipping, from heat or fishing, but the
                    reef structure and fish life still hold.
                  </p>
                  <div
                    style={{
                      marginTop: "0.9rem",
                      paddingTop: "0.85rem",
                      borderTop: `1px solid ${HAIRLINE}`,
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.5875rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: MUTED,
                        marginBottom: "0.35rem",
                      }}
                    >
                      The rule
                    </p>
                    <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: BODY }}>
                      Everything between the other two.
                    </p>
                  </div>
                </div>

                {/* Witnessing change */}
                <div
                  style={{
                    border: `1px solid ${HAIRLINE}`,
                    borderRadius: "1rem",
                    padding: "1.25rem",
                    borderTop: `3px solid ${CHANGE}`,
                    background: "#0a1628",
                  }}
                >
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: 800,
                      marginBottom: "0.5rem",
                      color: "#c0392f",
                    }}
                  >
                    Witnessing change
                  </p>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: BODY }}>
                    Heavy recent loss or bleaching. Diving here is a chance to
                    document what remains, not a write off.
                  </p>
                  <div
                    style={{
                      marginTop: "0.9rem",
                      paddingTop: "0.85rem",
                      borderTop: `1px solid ${HAIRLINE}`,
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.5875rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: MUTED,
                        marginBottom: "0.35rem",
                      }}
                    >
                      The rule
                    </p>
                    <ul
                      style={{
                        listStyle: "none",
                        margin: "0.45rem 0 0",
                        padding: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.35rem",
                      }}
                    >
                      <li style={condLi}>
                        <span style={condDot} aria-hidden="true" />
                        Coral cover {code("below 25%")} <Conj>OR</Conj>
                      </li>
                      <li style={condLi}>
                        <span style={condDot} aria-hidden="true" />
                        Heat at {code("Alert Level 1")} or higher
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div
              id="rs-signals"
              style={{ marginTop: "2.5rem", scrollMarginTop: "5rem" }}
            >
              <h3 style={subHStyle}>The signals behind it</h3>
              <p style={subPStyle}>
                Three public sources feed that rule. We don&rsquo;t run our own
                boats or labs, we stand on the organisations who do.
              </p>
              <div className="method-sig-grid">
                <SignalCard
                  name="Heat stress"
                  body="How warm the water is against what is normal for the season. Brief warmth is fine; it is sustained heat over weeks that bleaches coral."
                  href="https://coralreefwatch.noaa.gov/"
                  linkText="NOAA Coral Reef Watch"
                  metaRight={<span style={{ color: "#15824c", fontWeight: 600 }}>Live, nightly</span>}
                />
                <SignalCard
                  name="Coral cover"
                  body="How much of the seabed is live coral, from reef surveys. For some reefs we only have a couple of survey years, so we show the trend as a guide."
                  href="https://www.reefcheck.org/"
                  linkText="Reef Check"
                  linkSuffix=" and partners"
                  metaRight={<span>Per survey</span>}
                />
                <SignalCard
                  name="Fishing pressure"
                  body="How heavily a reef is fished, and whether it sits inside a protected area. Strong protection lets a reef recover faster."
                  href="https://globalfishingwatch.org/"
                  linkText="Global Fishing Watch"
                  metaRight={<span>Weekly</span>}
                />
              </div>
            </div>
          </section>

          {/* ============ SIGHTINGS ============ */}
          <section
            id="sightings"
            style={{ marginBottom: "4rem", scrollMarginTop: "5rem" }}
          >
            <h2 style={groupTitleStyle}>Sightings</h2>
            <p style={groupIntroStyle}>
              On every dive site we show which animals you are likely to see, and
              where. Each one is a{" "}
              <b style={{ color: INK }}>real diver photo</b>, nothing invented.
            </p>

            <div
              id="si-chances"
              style={{ marginTop: "2.5rem", scrollMarginTop: "5rem" }}
            >
              <h3 style={subHStyle}>Your chances of seeing each animal</h3>
              <p style={subPStyle}>
                The chance comes from{" "}
                <b style={{ color: INK }}>
                  how often divers have logged that animal at this site over the
                  past year
                </b>{" "}
                — their photo records on{" "}
                <a href="https://www.inaturalist.org/" target="_blank" rel="noopener" style={{ color: BRAND }}>
                  iNaturalist
                </a>
                , each confirmed to research grade and pulled in through GBIF.
                These sightings are ingested live, so a fresh log shows up
                without us waiting on a snapshot. We turn that frequency into one
                plain label:
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  border: `1px solid ${HAIRLINE}`,
                  borderRadius: "1rem",
                  overflow: "hidden",
                  margin: "0.5rem 0 1.25rem",
                  maxWidth: 520,
                  background: "#0a1628",
                }}
              >
                <Band color="#15824c" label="Almost always" range="80% or more of recent dives" first />
                <Band color="#15824c" label="Very likely" range="60 to 80%" />
                <Band color="#15824c" label="Likely" range="40 to 60%" />
                <Band color="#b9751a" label="Sometimes" range="20 to 40%" />
                <Band color={MUTED} label="Rare" range="under 20%" />
              </div>
              <p style={subPStyle}>
                Wildlife moves and seasons shift, so we treat every figure as a
                guide, never a promise. When a site has few recent records we say
                its data is thin rather than guess.
              </p>
            </div>

            <div
              id="si-verify"
              style={{ marginTop: "2.5rem", scrollMarginTop: "5rem" }}
            >
              <h3 style={subHStyle}>How we verify a sighting</h3>
              <p style={subPStyle}>
                Every sighting starts as a real photograph and is checked before
                we count it.
              </p>
              <div
                className="method-pipe"
                style={{
                  border: `1px solid ${HAIRLINE}`,
                  borderRadius: "1rem",
                  overflow: "hidden",
                  background: "#0a1628",
                }}
              >
                <PipeStep n="Step 1" title="Diver photo">
                  A diver photographs an animal and tags where they saw it.
                </PipeStep>
                <PipeStep n="Step 2" title="Community check">
                  The{" "}
                  <a href="https://www.inaturalist.org/" target="_blank" rel="noopener" style={pipeLink}>
                    iNaturalist
                  </a>{" "}
                  community confirms the species until it reaches research grade.
                </PipeStep>
                <PipeStep n="Step 3" title="GBIF">
                  It flows into{" "}
                  <a href="https://www.gbif.org/" target="_blank" rel="noopener" style={pipeLink}>
                    GBIF
                  </a>
                  , the global biodiversity database.
                </PipeStep>
                <PipeStep n="Step 4" title="IUCN Red List" last>
                  GBIF records feed the assessments behind each animal&rsquo;s
                  status.
                </PipeStep>
              </div>
            </div>

            <div
              id="si-labels"
              style={{ marginTop: "2.5rem", scrollMarginTop: "5rem" }}
            >
              <h3 style={subHStyle}>What the conservation labels mean</h3>
              <p style={subPStyle}>
                Each animal carries its status from the{" "}
                <a href="https://www.iucnredlist.org/" target="_blank" rel="noopener" style={{ color: BRAND }}>
                  IUCN Red List
                </a>
                , the global standard for how threatened a species is in the
                wild.
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  border: `1px solid ${HAIRLINE}`,
                  borderRadius: "1rem",
                  overflow: "hidden",
                  maxWidth: 680,
                  background: "#0a1628",
                }}
              >
                <IucnRow tag="Least concern" bg="rgba(21,160,92,0.15)" fg="#4ade80" first>
                  Widespread and not currently at risk.
                </IucnRow>
                <IucnRow tag="Near threatened" bg="rgba(63,98,18,0.2)" fg="#86efac">
                  Could become at risk in the near future.
                </IucnRow>
                <IucnRow tag="Vulnerable" bg="rgba(185,117,26,0.15)" fg="#fbbf24">
                  High risk of extinction in the wild.
                </IucnRow>
                <IucnRow tag="Endangered" bg="rgba(192,57,47,0.15)" fg="#f87171">
                  Very high risk of extinction in the wild.
                </IucnRow>
                <IucnRow tag="Critically endangered" bg="rgba(185,28,28,0.15)" fg="#fca5a5">
                  Extremely high risk, one step from extinct in the wild.
                </IucnRow>
              </div>
            </div>
          </section>

          {/* ============ FOR DIVERS ============ */}
          <section
            id="divers"
            style={{ marginBottom: "4rem", scrollMarginTop: "5rem" }}
          >
            <h2 style={groupTitleStyle}>For divers</h2>
            <p style={groupIntroStyle}>
              Many reefs in the atlas have no recent records at all. We never hide
              that. A reef with thin data is not abandoned, it just{" "}
              <b style={{ color: INK }}>needs fresh eyes</b>, and a single trip
              can change that.
            </p>

            <div style={{ marginTop: "2.5rem" }}>
              <h3 style={subHStyle}>Add what you see</h3>
              <p style={subPStyle}>
                Every dive can add to the record. Pick how involved you want to
                be, from a single photo to a full survey.
              </p>
              <div className="method-plat-grid">
                <PlatformCard
                  href="https://www.inaturalist.org/"
                  name="iNaturalist"
                  effort="Zero training"
                >
                  Photograph any animal and upload it with the location. The
                  community confirms the species, and once it reaches research
                  grade it joins the record scientists use.
                </PlatformCard>
                <PlatformCard
                  href="https://www.coralwatch.org/"
                  name="CoralWatch"
                  effort="A few minutes"
                >
                  Match coral colour against a simple chart to record bleaching.
                  It takes a few minutes and helps track heat stress over time.
                </PlatformCard>
                <PlatformCard
                  href="https://www.reefcheck.org/"
                  name="Reef Check"
                  effort="Free training"
                  effortMid
                >
                  Run a standard reef survey: count fish, invertebrates and coral
                  health along a set line. This feeds long term monitoring.
                </PlatformCard>
              </div>
            </div>

            <div
              style={{
                border: "1px solid rgba(251,191,36,0.2)",
                background: "rgba(251,191,36,0.06)",
                borderRadius: "1rem",
                padding: "1.5rem 1.6rem",
                marginTop: "1.5rem",
              }}
            >
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: INK, marginBottom: "0.5rem" }}>
                Diving somewhere quiet?
              </h3>
              <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: BODY, maxWidth: 600 }}>
                If you are heading to a reef with few records, you are exactly who
                that reef needs. Log what you see and it becomes part of the
                public picture.
              </p>
              <Link
                href="/"
                style={{
                  display: "inline-block",
                  marginTop: "0.9rem",
                  padding: "0.7rem 1.2rem",
                  borderRadius: "0.7rem",
                  background: BRAND,
                  color: "#0a1628",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Find reefs that need eyes →
              </Link>
            </div>
          </section>

          {/* ============ FOR RESEARCHERS ============ */}
          <section
            id="researchers"
            style={{ marginBottom: "4rem", scrollMarginTop: "5rem" }}
          >
            <h2 style={groupTitleStyle}>For researchers</h2>
            <p style={groupIntroStyle}>
              If you run a monitoring programme and need eyes on specific sites,
              tell us where. We can point divers toward the reefs and the
              platforms where their records help you most. scubaSeason is a
              nonprofit, free to read, with every source credited.
            </p>
            <div
              style={{
                border: "1px solid rgba(21,160,92,0.2)",
                background: "rgba(21,160,92,0.06)",
                borderRadius: "1rem",
                padding: "1.5rem 1.6rem",
                marginTop: "1.5rem",
              }}
            >
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: INK, marginBottom: "0.5rem" }}>
                Work with us
              </h3>
              <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: BODY, maxWidth: 600 }}>
                Spotted wrong data, or want to direct divers to your sites? All of
                it is welcome.
              </p>
              <a
                href="mailto:hello@scubaseason.fun"
                style={{
                  display: "inline-block",
                  marginTop: "0.9rem",
                  padding: "0.7rem 1.2rem",
                  borderRadius: "0.7rem",
                  background: BRAND,
                  color: "#0a1628",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                hello@scubaseason.fun
              </a>
            </div>
          </section>

          {/* ============ HONEST LIMITS ============ */}
          <section
            id="limits"
            style={{ marginBottom: "4rem", scrollMarginTop: "5rem" }}
          >
            <h2 style={groupTitleStyle}>What this data cannot tell you</h2>
            <p style={groupIntroStyle}>
              Honest data means naming its limits too. Here is what these sources
              do not capture, so you can read every label on this site with the
              right amount of doubt.
            </p>
            <div className="method-limit-grid">
              <LimitCard title="Reef state is a read, not a measurement">
                The one word on each reef is our reading of three public signals.
                It is not a survey we ran ourselves and it cannot replace a diver
                who is actually in the water. Treat it as a starting point.
              </LimitCard>
              <LimitCard title="Coral cover is thin for many reefs">
                For a lot of sites we hold only 2 survey years, sometimes fewer.
                Two points draw a line, not a trend, so we show the figure as a
                guide and flag plainly where the record is sparse.
              </LimitCard>
              <LimitCard title="Heat is read from the surface">
                NOAA measures sea temperature from satellites at the surface. A
                deep or shaded reef can sit cooler than the satellite suggests, so
                a heat alert is a regional warning, not a reading at your exact
                depth.
              </LimitCard>
              <LimitCard title="Fishing pressure misses the boats that hide">
                Global Fishing Watch tracks vessels that broadcast their position.
                Boats that switch off their signal, or are too small to carry one,
                do not appear, so real pressure can be higher than the map shows.
              </LimitCard>
              <LimitCard title="No record does not mean no animal">
                A site with few sightings is almost always a site few divers have
                logged, not an empty reef. Absence of data is a gap waiting to be
                filled, never proof that the animal is gone.
              </LimitCard>
              <LimitCard title="Every source runs on its own clock">
                Each feed refreshes at its own pace, from nightly heat readings to
                surveys that arrive once a season. We always show the freshest
                figure we hold, and we never label it live when it is not.
              </LimitCard>
            </div>
          </section>

          {/* ============ ALL SOURCES ============ */}
          <section
            id="sources"
            style={{ marginBottom: "4rem", scrollMarginTop: "5rem" }}
          >
            <h2 style={groupTitleStyle}>Every source we credit</h2>
            <p style={groupIntroStyle}>
              Everything on this site is built from public data, none of our own.{" "}
              <b style={{ color: INK }}>Reef state</b> comes from NOAA heat, reef
              surveys and Global Fishing Watch.{" "}
              <b style={{ color: INK }}>Sightings</b> come from iNaturalist and
              GBIF. Beyond those, dozens more cover water conditions, currents,
              charts, wreck histories and diver safety. All {totalSources} are
              named and linked below, each with how often it puts out fresh
              data.
            </p>
            <p style={{ ...groupIntroStyle, marginTop: "0.75rem", fontSize: "0.875rem", color: MUTED }}>
              The pace beside each source is how often that source itself
              updates, from real time to a single landmark report. It is the
              source&rsquo;s own clock, not ours. The feeds we pull on a live
              schedule are the reef state signals (NOAA heat nightly, fishing
              weekly) and the sightings ingest above; the rest are reference
              data we cite at the freshness each one publishes.
            </p>
            <details style={{ marginTop: "1.25rem" }}>
              <summary
                className="method-src-summary"
                style={{
                  listStyle: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: BRAND,
                  padding: "0.5rem 0",
                }}
              >
                Show all {totalSources} sources
              </summary>
              <div className="method-src-groups">
                {SOURCE_GROUPS.map((group) => (
                  <div key={group.heading}>
                    <h4
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: MUTED,
                        marginBottom: "0.55rem",
                      }}
                    >
                      {group.heading}
                    </h4>
                    <ul
                      style={{
                        listStyle: "none",
                        margin: 0,
                        padding: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                      }}
                    >
                      {group.ids.map((id) => {
                        const src = sourceMap.get(id);
                        if (!src) return null;
                        return (
                          <li
                            key={id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "baseline",
                              gap: "0.75rem",
                            }}
                          >
                            <a
                              href={src.url ?? "#"}
                              target="_blank"
                              rel="noopener"
                              style={{
                                fontSize: "0.8125rem",
                                color: BODY,
                                textDecoration: "none",
                                borderBottom: "1px solid transparent",
                              }}
                            >
                              {src.name}
                            </a>
                            {src.refresh && (
                              <span
                                style={{
                                  fontSize: "0.625rem",
                                  fontFamily: mono,
                                  color: MUTED,
                                  whiteSpace: "nowrap",
                                  flexShrink: 0,
                                }}
                                title="How often this source publishes fresh data"
                              >
                                {src.refresh}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          </section>

          {/* FAQ — how every metric is calculated (reused) */}
          <FaqSection />
        </div>
      </div>

      {/* Layout + responsive rules scoped to this page only. */}
      <style>{`
        .method-wrap{max-width:1180px;margin:0 auto;padding:3rem;display:grid;grid-template-columns:210px 1fr;gap:3.5rem;align-items:start;}
        .method-toc{display:flex;}
        .method-state-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:0.5rem;}
        .method-sig-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:0.5rem;}
        .method-pipe{display:flex;flex-wrap:wrap;gap:0;margin-top:0.5rem;}
        .method-plat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:0.5rem;}
        .method-limit-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;margin-top:1.5rem;}
        .method-src-groups{display:grid;grid-template-columns:repeat(2,1fr);gap:1.6rem 2.5rem;margin-top:1.25rem;}
        .method-src-summary::-webkit-details-marker{display:none;}
        .method-src-summary::after{content:"⌄";}
        details[open] > .method-src-summary::after{content:"⌃";}
        @media(max-width:920px){
          .method-wrap{grid-template-columns:1fr;}
          .method-toc{display:none;}
          .method-state-cards,.method-sig-grid,.method-plat-grid,.method-limit-grid,.method-src-groups{grid-template-columns:1fr;}
        }
      `}</style>
    </>
  );
}

const condLi: React.CSSProperties = {
  fontSize: "0.8125rem",
  lineHeight: 1.45,
  color: BODY,
  paddingLeft: "0.95rem",
  position: "relative",
};
const condDot: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: "0.55em",
  width: 5,
  height: 5,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.2)",
};
const pipeLink: React.CSSProperties = { color: BRAND, textDecoration: "none" };

function SignalCard({
  name,
  body,
  href,
  linkText,
  linkSuffix,
  metaRight,
}: {
  name: string;
  body: string;
  href: string;
  linkText: string;
  linkSuffix?: string;
  metaRight: React.ReactNode;
}) {
  return (
    <div style={{ border: `1px solid ${HAIRLINE}`, borderRadius: "1rem", padding: "1.25rem", background: "#0a1628" }}>
      <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: INK, marginBottom: "0.6rem" }}>
        {name}
      </p>
      <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: BODY, marginBottom: "0.7rem" }}>
        {body}
      </p>
      <div
        style={{
          fontSize: "0.6875rem",
          fontFamily: mono,
          color: MUTED,
          display: "flex",
          justifyContent: "space-between",
          gap: "0.5rem",
          borderTop: `1px solid ${HAIRLINE}`,
          paddingTop: "0.6rem",
          flexWrap: "wrap",
        }}
      >
        <span>
          <a
            href={href}
            target="_blank"
            rel="noopener"
            style={{ color: MUTED, textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.15)" }}
          >
            {linkText}
          </a>
          {linkSuffix}
        </span>
        {metaRight}
      </div>
    </div>
  );
}

function Band({
  color,
  label,
  range,
  first,
}: {
  color: string;
  label: string;
  range: string;
  first?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.7rem 1.1rem",
        borderTop: first ? "none" : `1px solid ${HAIRLINE}`,
        fontSize: "0.875rem",
        fontWeight: 700,
        color,
      }}
    >
      {label}
      <span style={{ color: MUTED, fontFamily: mono, fontSize: "0.75rem", fontWeight: 400 }}>
        {range}
      </span>
    </div>
  );
}

function PipeStep({
  n,
  title,
  children,
  last,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 150,
        padding: "1.1rem 1.2rem",
        borderRight: last ? "none" : `1px solid ${HAIRLINE}`,
      }}
    >
      <p
        style={{
          fontSize: "0.625rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: BRAND,
          marginBottom: "0.35rem",
        }}
      >
        {n}
      </p>
      <p style={{ fontSize: "0.875rem", fontWeight: 700, color: INK, marginBottom: "0.2rem" }}>
        {title}
      </p>
      <p style={{ fontSize: "0.75rem", lineHeight: 1.5, color: MUTED }}>{children}</p>
    </div>
  );
}

function IucnRow({
  tag,
  bg,
  fg,
  children,
  first,
}: {
  tag: string;
  bg: string;
  fg: string;
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.85rem",
        alignItems: "flex-start",
        padding: "0.85rem 1.1rem",
        borderTop: first ? "none" : `1px solid ${HAIRLINE}`,
      }}
    >
      <span
        style={{
          display: "inline-block",
          fontSize: "0.6875rem",
          fontWeight: 700,
          padding: "0.2rem 0.6rem",
          borderRadius: 999,
          whiteSpace: "nowrap",
          flexShrink: 0,
          background: bg,
          color: fg,
        }}
      >
        {tag}
      </span>
      <span style={{ fontSize: "0.8125rem", color: BODY, lineHeight: 1.5, paddingTop: "0.1rem" }}>
        {children}
      </span>
    </div>
  );
}

function LimitCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: `1px solid ${HAIRLINE}`,
        borderRadius: "1rem",
        padding: "1.25rem",
        borderLeft: `3px solid ${MUTED}`,
        background: "#0a1628",
      }}
    >
      <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: INK, marginBottom: "0.5rem" }}>
        {title}
      </p>
      <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: BODY }}>
        {children}
      </p>
    </div>
  );
}

function PlatformCard({
  href,
  name,
  effort,
  effortMid,
  children,
}: {
  href: string;
  name: string;
  effort: string;
  effortMid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ border: `1px solid ${HAIRLINE}`, borderRadius: "1rem", padding: "1.25rem", background: "#0a1628" }}>
      <a
        href={href}
        target="_blank"
        rel="noopener"
        style={{
          fontSize: "1.05rem",
          fontWeight: 800,
          color: INK,
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          marginBottom: "0.4rem",
        }}
      >
        {name} <span style={{ fontSize: "0.85em", color: BRAND }}>↗</span>
      </a>
      <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: BODY, marginBottom: "0.85rem" }}>
        {children}
      </p>
      <span
        style={{
          fontSize: "0.6875rem",
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          padding: "0.25rem 0.6rem",
          borderRadius: 999,
          background: effortMid ? "rgba(185,117,26,0.15)" : "rgba(21,160,92,0.15)",
          color: effortMid ? "#fbbf24" : "#4ade80",
        }}
      >
        {effort}
      </span>
    </div>
  );
}
