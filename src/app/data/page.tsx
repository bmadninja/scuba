import type { Metadata } from "next";
import Link from "next/link";
import sourcesData from "@/data/sources.json";
import { FaqSection } from "@/components/faq-section";

export const metadata: Metadata = {
  title: "How Scuba Season works — 63 data sources, explained",
  description:
    "Every reef label, species probability, and data point on Scuba Season is sourced from peer-reviewed science and open government datasets.",
};

type Source = {
  id: string;
  name: string;
  url?: string;
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

// Light design system tokens
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
        color: INK2,
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
    fontFamily: serif,
    fontSize: "clamp(1.5rem, 3vw, 2rem)",
    fontWeight: 400,
    letterSpacing: "-0.02em",
    color: INK,
    paddingBottom: "0.7rem",
    borderBottom: `2px solid ${HAIRLINE}`,
  };
  const groupIntroStyle: React.CSSProperties = {
    fontFamily: "var(--font-sans)",
    fontSize: "1rem",
    lineHeight: 1.7,
    color: INK2,
    margin: "1.1rem 0 0",
    maxWidth: 660,
  };
  const subHStyle: React.CSSProperties = {
    fontFamily: serif,
    fontSize: "1.25rem",
    fontWeight: 400,
    color: INK,
    marginBottom: "0.7rem",
  };
  const subPStyle: React.CSSProperties = {
    fontSize: "0.9375rem",
    lineHeight: 1.7,
    color: INK2,
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
        fontWeight: kind === "group" ? 600 : 400,
        color: kind === "group" ? INK : INK2,
        textDecoration: "none",
        padding:
          kind === "group" ? "0.4rem 0.7rem" : "0.4rem 0.7rem 0.4rem 1.3rem",
        borderLeft: `2px solid ${kind === "group" ? HAIRLINE : "transparent"}`,
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
          background: PAPER,
          borderBottom: `1px solid ${HAIRLINE}`,
          padding: "4rem 3rem 3.5rem",
        }}
      >
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <p
            style={{
              fontFamily: mono,
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: OCEAN,
              marginBottom: "1rem",
            }}
          >
            How this works
          </p>
          <h1
            style={{
              fontFamily: serif,
              fontSize: "clamp(2.25rem,4vw,3.25rem)",
              fontWeight: 300,
              fontStyle: "italic",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              maxWidth: 760,
              color: INK,
            }}
          >
            How we read the reefs
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "1.15rem",
              lineHeight: 1.65,
              color: INK2,
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
              We read 3 signals for every reef and turn them into one plain
              word that describes <b style={{ color: INK }}>what is happening</b>{" "}
              there. It is not a ranking and not a score. Every reef is worth
              diving.
            </p>

            <div
              id="rs-label"
              style={{ marginTop: "2.5rem", scrollMarginTop: "5rem" }}
            >
              <h3 style={subHStyle}>1 honest label per reef</h3>
              <p style={subPStyle}>
                We read 3 numbers —{" "}
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
                    borderTop: `3px solid ${IMPROVING}`,
                    background: PAPER,
                  }}
                >
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      marginBottom: "0.5rem",
                      color: IMPROVING,
                    }}
                  >
                    Improving
                  </p>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: INK2 }}>
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
                        fontFamily: mono,
                        fontSize: "0.5875rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: INK2,
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
                    borderTop: `3px solid ${STABLE}`,
                    background: PAPER,
                  }}
                >
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      marginBottom: "0.5rem",
                      color: STABLE,
                    }}
                  >
                    Stable
                  </p>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: INK2 }}>
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
                        fontFamily: mono,
                        fontSize: "0.5875rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: INK2,
                        marginBottom: "0.35rem",
                      }}
                    >
                      The rule
                    </p>
                    <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: INK2 }}>
                      Everything between the other 2.
                    </p>
                  </div>
                </div>

                {/* Witnessing change */}
                <div
                  style={{
                    border: `1px solid ${HAIRLINE}`,
                    borderRadius: "1rem",
                    padding: "1.25rem",
                    borderTop: `3px solid ${DECLINING}`,
                    background: PAPER,
                  }}
                >
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      marginBottom: "0.5rem",
                      color: DECLINING,
                    }}
                  >
                    Declining
                  </p>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: INK2 }}>
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
                        fontFamily: mono,
                        fontSize: "0.5875rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: INK2,
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
                3 public sources feed that rule. We do not run our own
                boats or labs — we stand on the organisations who do.
              </p>
              <div className="method-sig-grid">
                <SignalCard
                  name="Heat stress"
                  body="How warm the water is against what is normal for the season. Brief warmth is fine; it is sustained heat over weeks that bleaches coral."
                  href="https://coralreefwatch.noaa.gov/"
                  linkText="NOAA Coral Reef Watch"
                  metaRight={<span style={{ color: IMPROVING, fontWeight: 600 }}>Live, nightly</span>}
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
                <a href="https://www.inaturalist.org/" target="_blank" rel="noopener" style={{ color: OCEAN }}>
                  iNaturalist
                </a>
                , each confirmed to research grade and pulled in through GBIF.
                These sightings are ingested live, so a fresh log shows up
                without us waiting on a snapshot. We turn that frequency into 1
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
                  background: PAPER,
                }}
              >
                <Band color={IMPROVING} label="Almost always" range="80% or more of recent dives" first />
                <Band color={IMPROVING} label="Very likely" range="60 to 80%" />
                <Band color={IMPROVING} label="Likely" range="40 to 60%" />
                <Band color={STABLE} label="Sometimes" range="20 to 40%" />
                <Band color={INK2} label="Rare" range="under 20%" />
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
                  background: PAPER,
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
                <PipeStep n="Step 4" title="Conservation status" last>
                  GBIF records feed the assessments behind each animal&rsquo;s
                  status on the IUCN Red List.
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
                <a href="https://www.iucnredlist.org/" target="_blank" rel="noopener" style={{ color: OCEAN }}>
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
                  background: PAPER,
                }}
              >
                <IucnRow tag="Least concern" bg="rgba(46,125,91,0.10)" fg={IMPROVING} first>
                  Widespread and not currently at risk.
                </IucnRow>
                <IucnRow tag="Near threatened" bg="rgba(46,125,91,0.07)" fg={IMPROVING}>
                  Could become at risk in the near future.
                </IucnRow>
                <IucnRow tag="Vulnerable" bg="rgba(185,138,46,0.12)" fg={STABLE}>
                  High risk of extinction in the wild.
                </IucnRow>
                <IucnRow tag="Endangered" bg="rgba(192,65,43,0.10)" fg={DECLINING}>
                  Very high risk of extinction in the wild.
                </IucnRow>
                <IucnRow tag="Critically endangered" bg="rgba(192,65,43,0.14)" fg={DECLINING}>
                  Extremely high risk, 1 step from extinct in the wild.
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
                border: `1px solid rgba(246,199,0,0.3)`,
                background: "rgba(246,199,0,0.05)",
                borderRadius: "1rem",
                padding: "1.5rem 1.6rem",
                marginTop: "1.5rem",
              }}
            >
              <h3 style={{ fontFamily: serif, fontSize: "1.05rem", fontWeight: 400, color: INK, marginBottom: "0.5rem" }}>
                Diving somewhere quiet?
              </h3>
              <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: INK2, maxWidth: 600 }}>
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
                  background: "var(--color-brand-yellow)",
                  color: INK,
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Find reefs that need eyes
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
              platforms where their records help you most. Scuba Season is a
              nonprofit, free to read, with every source credited.
            </p>
            <div
              style={{
                border: `1px solid rgba(46,125,91,0.2)`,
                background: "rgba(46,125,91,0.05)",
                borderRadius: "1rem",
                padding: "1.5rem 1.6rem",
                marginTop: "1.5rem",
              }}
            >
              <h3 style={{ fontFamily: serif, fontSize: "1.05rem", fontWeight: 400, color: INK, marginBottom: "0.5rem" }}>
                Work with us
              </h3>
              <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: INK2, maxWidth: 600 }}>
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
                  background: "var(--color-brand-yellow)",
                  color: INK,
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                hello@scubaseason.fun
              </a>
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
              named and linked below.
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
                  color: OCEAN,
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
                        fontFamily: mono,
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: INK2,
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
                          <li key={id}>
                            {src.url ? (
                              <a
                                href={src.url}
                                target="_blank"
                                rel="noopener"
                                style={{
                                  fontSize: "0.8125rem",
                                  color: OCEAN,
                                  textDecoration: "none",
                                  borderBottom: `1px solid transparent`,
                                }}
                              >
                                {src.name}
                              </a>
                            ) : (
                              <span style={{ fontSize: "0.8125rem", color: INK2 }}>
                                {src.name}
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
        .method-wrap{max-width:1180px;margin:0 auto;padding:3rem;display:grid;grid-template-columns:210px 1fr;gap:3.5rem;align-items:start;background:var(--color-paper);}
        .method-toc{display:flex;}
        .method-state-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:0.5rem;}
        .method-sig-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:0.5rem;}
        .method-pipe{display:flex;flex-wrap:wrap;gap:0;margin-top:0.5rem;}
        .method-plat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:0.5rem;}
        .method-src-groups{display:grid;grid-template-columns:repeat(2,1fr);gap:1.6rem 2.5rem;margin-top:1.25rem;}
        .method-src-summary::-webkit-details-marker{display:none;}
        .method-src-summary::after{content:"⌄";}
        details[open] > .method-src-summary::after{content:"⌃";}
        @media(max-width:920px){
          .method-wrap{grid-template-columns:1fr;padding:2rem 1.25rem;}
          .method-toc{display:none;}
          .method-state-cards,.method-sig-grid,.method-plat-grid,.method-src-groups{grid-template-columns:1fr;}
        }
        @media(max-width:480px){
          .method-wrap{padding:1.5rem 1rem;}
        }
      `}</style>
    </>
  );
}

const condLi: React.CSSProperties = {
  fontSize: "0.8125rem",
  lineHeight: 1.45,
  color: "var(--color-ink-2)",
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
  background: "var(--color-hairline)",
};
const pipeLink: React.CSSProperties = { color: "var(--color-ocean)", textDecoration: "none" };

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
    <div style={{ border: `1px solid var(--color-hairline)`, borderRadius: "1rem", padding: "1.25rem", background: "var(--color-paper)" }}>
      <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "0.6rem" }}>
        {name}
      </p>
      <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "var(--color-ink-2)", marginBottom: "0.7rem" }}>
        {body}
      </p>
      <div
        style={{
          fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
          fontSize: "0.6875rem",
          color: "var(--color-ink-2)",
          display: "flex",
          justifyContent: "space-between",
          gap: "0.5rem",
          borderTop: `1px solid var(--color-hairline)`,
          paddingTop: "0.6rem",
          flexWrap: "wrap",
        }}
      >
        <span>
          <a
            href={href}
            target="_blank"
            rel="noopener"
            style={{ color: "var(--color-ocean)", textDecoration: "none" }}
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
        borderTop: first ? "none" : `1px solid var(--color-hairline)`,
        fontSize: "0.875rem",
        fontWeight: 600,
        color,
      }}
    >
      {label}
      <span style={{ color: "var(--color-ink-2)", fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace", fontSize: "0.75rem", fontWeight: 400 }}>
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
        borderRight: last ? "none" : `1px solid var(--color-hairline)`,
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
          fontSize: "0.625rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--color-ocean)",
          marginBottom: "0.35rem",
        }}
      >
        {n}
      </p>
      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "0.2rem" }}>
        {title}
      </p>
      <p style={{ fontSize: "0.75rem", lineHeight: 1.5, color: "var(--color-ink-2)" }}>{children}</p>
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
        borderTop: first ? "none" : `1px solid var(--color-hairline)`,
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
      <span style={{ fontSize: "0.8125rem", color: "var(--color-ink-2)", lineHeight: 1.5, paddingTop: "0.1rem" }}>
        {children}
      </span>
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
    <div style={{ border: `1px solid var(--color-hairline)`, borderRadius: "1rem", padding: "1.25rem", background: "var(--color-paper)" }}>
      <a
        href={href}
        target="_blank"
        rel="noopener"
        style={{
          fontSize: "1.05rem",
          fontWeight: 700,
          color: "var(--color-ink)",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          marginBottom: "0.4rem",
        }}
      >
        {name} <span style={{ fontSize: "0.85em", color: "var(--color-ocean)" }}>↗</span>
      </a>
      <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "var(--color-ink-2)", marginBottom: "0.85rem" }}>
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
          background: effortMid ? "rgba(185,138,46,0.12)" : "rgba(46,125,91,0.10)",
          color: effortMid ? "var(--color-stable)" : "var(--color-improving)",
        }}
      >
        {effort}
      </span>
    </div>
  );
}
