import type { Metadata } from "next";
import Link from "next/link";
import { STATE_TEXT, STATE_COLOR, type ReefState } from "@/lib/data/reef-state";

export const metadata: Metadata = {
  title: "Read your reef — Scuba Season",
  description:
    "Learn to read the real state of a reef underwater: coral cover, heat stress, fishing pressure, and how recently anyone surveyed it. Then learn to photograph it so your dive becomes a record science can use.",
};

// The four signals are the exact ones Scuba Season uses to assign a reef state
// (see src/lib/data/reef-state.ts). Teaching divers to read them keeps this page
// honest: the diver learns the same model the atlas runs on.
const SIGNALS: {
  num: string;
  name: string;
  underwater: string;
  onsite: string;
  source: string;
}[] = [
  {
    num: "01",
    name: "Coral cover",
    underwater:
      "Look at how much of the hard bottom is still living coral, against bare rock, rubble, and algae. A healthy reef is mostly structure built by living coral, so broad fields of dead skeleton turning fuzzy green mean cover has collapsed.",
    onsite:
      "Scuba Season shows the most recent measured hard coral cover for a location against its historical baseline, so you can see whether the reef is holding near what it once was or slipping below it.",
    source: "Survey networks including AIMS Long Term Monitoring and the Global Coral Reef Monitoring Network.",
  },
  {
    num: "02",
    name: "Heat stress",
    underwater:
      "Bleaching is the reef telling you it is too hot. Coral that has gone bone white or pale and ghostly is alive but starving, having expelled the algae it lives on. Patchy white tips after a warm season are an early sign, and whole white reefs are an emergency.",
    onsite:
      "We carry the bleaching alert level from NOAA Coral Reef Watch, updated continuously from satellite. It tells you whether the water has been hot enough, for long enough, to expect bleaching before you even get in.",
    source: "NOAA Coral Reef Watch, degree heating weeks accumulated over the last 12 weeks.",
  },
  {
    num: "03",
    name: "Fishing pressure",
    underwater:
      "Count the big fish. A reef under light pressure has large groupers, snappers, sharks, and dense schools. A heavily fished reef feels empty of anything bigger than your hand, even when the coral looks fine, and missing predators is the quietest warning there is.",
    onsite:
      "We show fishing pressure drawn from vessel activity tracked within 50 kilometres over the last year, so you know whether the fish you are not seeing were fished out rather than simply hiding.",
    source: "Global Fishing Watch, automatic identification system vessel tracks.",
  },
  {
    num: "04",
    name: "Survey freshness",
    underwater:
      "This is the one you cannot see, and it is the one where you matter most. When did a scientist last look at this reef? On many sites the honest answer is years ago, or never. If the record is cold, the most useful observation of this reef might be the one you are about to make.",
    onsite:
      "Every location carries a freshness label. Fresh means a structured survey happened within the last 2 years. Cold means no recent eyes underwater. Cold reefs are flagged as places that need fresh eyes, because they do.",
    source: "Survey dates from the monitoring networks above, measured against today.",
  },
];

// Reef-state labels and colors are pulled straight from src/lib/data/reef-state.ts
// (STATE_TEXT, STATE_COLOR) — the same source the globe markers and location cards
// render from — so the legend a diver learns here can never drift from the dots they
// actually see. Keyed by state id; only the explanatory body lives here.
const STATES: { state: ReefState; body: string }[] = [
  {
    state: "thriving",
    body: "Coral cover is at or above the reef's long term baseline and steady, heat stress rarely passes a watch, and fishing pressure is light or the reef is protected. A reef close to its natural self.",
  },
  {
    state: "pressure",
    body: "Still a good dive, and the structure and the fish life mostly hold, while coral cover is moderate or slipping under warming, fishing, or both. Intact, and holding on.",
  },
  {
    state: "change",
    body: "Coral cover is well below baseline after one or more bleaching events, and the reef is reorganising. A dive here documents what remains, and your records here are the most valuable in the atlas.",
  },
];

// The repeatable read-and-record routine. This is the "clear, repeatable method" the
// Read Your Reef framework trains: the same four signals above, run in the same order
// on every dive, ending in a logged record.
const METHOD: { num: string; when: string; body: string }[] = [
  {
    num: "01",
    when: "Before you dive",
    body: "Open the reef on Scuba Season and read its state. Heat stress and freshness tell you what to expect below, and whether this is a reef whose record is cold enough that your eyes genuinely count.",
  },
  {
    num: "02",
    when: "As you descend",
    body: "Run the 4 signals in the same order every time: how much living coral, any bleaching, the big fish, and anything that does not match what the record led you to expect. The order is the habit, and after a few dives it runs on its own.",
  },
  {
    num: "03",
    when: "Photograph the reef",
    body: "Two photos do the work: a clear shot of any animal you can name, and a steady mapping pass over the coral. The mapping pass follows a real method, set out just below.",
  },
  {
    num: "04",
    when: "Back on the boat",
    body: "Log it while the dive is fresh, before the next one blurs the details. Submit through Scuba Season and we route it onward, or go straight to iNaturalist. That is the whole loop, and it closes on every dive.",
  },
];

// Each destination needs a different capture format. This array maps the five
// main platforms to the specific method and spec the diver needs to know.
// Method credit for 3D photogrammetry: Bayley & Mogg (2020, Methods Ecol Evol)
// + AIMS EcoRRAP SOP (Gordon, Figueira et al. 2023). Wildflow applies it.
const CAPTURE_FORMATS: {
  platform: string;
  label: string;
  method: string;
  spec: string;
}[] = [
  {
    platform: "iNaturalist",
    label: "Species record",
    method:
      "One clear, close shot of any animal you can identify. Fill the frame, get sharp focus on the subject, and include the whole animal. iNaturalist experts identify from photos on land — the photo is the record.",
    spec: "Any camera or phone. One shot per animal. Sharp focus on the subject.",
  },
  {
    platform: "CoralWatch",
    label: "Bleaching check",
    method:
      "No camera. Hold the Coral Health Chart next to each coral you examine and note the lightest and darkest colour code that matches, plus the growth form. Repeat for at least 20 corals. The codes go into the CoralWatch app and become a bleaching record anyone can verify.",
    spec: "No camera. CoralWatch app. At least 20 corals for a valid survey.",
  },
  {
    platform: "MERMAID",
    label: "Reef health survey",
    method:
      "Photograph each quadrat straight down from directly above, at a consistent distance, with the frame parallel to the reef. One photo per quadrat. The photos go into MERMAID, where AI assigns benthic categories to points in the image. The diver sets up the survey on the surface; classification happens on land.",
    spec:
      "At least 12 megapixels. At least 1500 by 1500 pixels. Straight down. Consistent distance. Well lit. No motion blur. Quadrat frame required.",
  },
  {
    platform: "Wildflow / 3D model",
    label: "3D reef photogrammetry",
    method:
      "Swim parallel passes about 1.5 metres above the reef, camera pointing straight down, one photo every 0.5 seconds. Overlap between passes lets photogrammetry software stitch a 3D surface model of the reef. Any camera with a wide lens, interval mode, and a fast memory card will work.",
    spec:
      "Wide lens. Interval at 0.5 seconds. 1.5 m above the reef. Overlapping parallel passes. Not GoPro-specific.",
  },
  {
    platform: "Reef Check",
    label: "Structured transect",
    method:
      "Visual census of indicator fish, invertebrates, and substrate along a belt transect. No photo required. The in-water count is the record. Requires a 3-day paid EcoDiver certification to participate in official surveys.",
    spec: "No camera. Slate and pencil. EcoDiver certification required.",
  },
];

// The networks the site routes diver records into. MERMAID is included because
// the reef survey capture mode (in /upload) queues data for MERMAID import.
const NETWORKS: { name: string; url: string; note: string }[] = [
  {
    name: "iNaturalist",
    url: "https://www.inaturalist.org",
    note: "Photograph what you see. Research-grade observations flow on to GBIF, the database researchers in over 100 countries draw from.",
  },
  {
    name: "MERMAID",
    url: "https://datamermaid.org",
    note: "Run a photo quadrat survey and your benthic data enters the platform the Global Fund for Coral Reefs uses to track reef change.",
  },
  {
    name: "CoralWatch",
    url: "https://coralwatch.org",
    note: "Match coral colour to a simple chart and you have logged a bleaching observation anyone can verify.",
  },
  {
    name: "Reef Check",
    url: "https://www.reefcheck.org",
    note: "Complete the EcoDiver course and your structured transect counts join a global reef monitoring dataset.",
  },
];

export default function LearnPage() {
  return (
    <>
      {/* PAGE HEADER */}
      <header
        style={{ borderBottom: "1px solid var(--color-hairline)", background: "var(--color-paper)" }}
        className="px-6 pb-16 pt-20"
      >
        <div className="mx-auto max-w-[800px]">
          <p
            className="text-xs font-bold uppercase tracking-[0.18em]"
            style={{ color: "var(--color-ocean)", marginBottom: "1rem", fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace" }}
          >
            Learn
          </p>
          <h1
            style={{
              fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 300,
              fontStyle: "italic",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "var(--color-ink)",
              marginBottom: "1.5rem",
            }}
          >
            Read your reef.
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "1.2rem",
              lineHeight: 1.75,
              color: "var(--color-ink-2)",
              maxWidth: "640px",
            }}
          >
            Most divers read a brochure before a trip. Here is how to read the
            thing that actually matters once you are in the water, the reef
            itself, using the same 4 signals this atlas runs on.
          </p>
        </div>
      </header>

      {/* PAGE BODY */}
      <div className="mx-auto max-w-[800px] px-6 py-16" style={{ background: "var(--color-paper)" }}>

        {/* INTRO PROSE */}
        <div className="space-y-5 text-base leading-[1.8]" style={{ color: "var(--color-ink-2)" }}>
          <p>
            A reef shows you its condition, if you know where to look. It is
            there in the coral, the water temperature, the fish, and in how long
            it has been since anyone last wrote it down. Learn to read those, and
            a single dive tells you whether a reef is holding, slipping, or
            already changed.
          </p>
          <p>
            That same dive can become a record a scientist can use. You are in
            the water anyway, and you are already looking. The piece that is
            missing is knowing what you are looking at, and an easy way to pass
            it on. That is what this page is for.
          </p>
        </div>

        {/* THE FOUR SIGNALS */}
        <div style={{ margin: "3.5rem 0 2.5rem" }}>
          <h2
            style={{
              fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
              fontSize: "clamp(1.4rem, 3vw, 1.75rem)",
              fontWeight: 400,
              letterSpacing: "-0.025em",
              color: "var(--color-ink)",
              marginBottom: "0.5rem",
            }}
          >
            The four signals
          </h2>
          <p className="text-sm leading-[1.7]" style={{ color: "var(--color-ink-2)" }}>
            Learn these 4 and you can read almost any reef in the world. They are
            the same 4 this atlas weighs when it labels a reef, so reading them
            yourself is reading the reef the way the science does.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {SIGNALS.map((s) => (
            <div
              key={s.num}
              className="rounded-2xl p-6 sm:p-7"
              style={{ border: "1px solid var(--color-hairline)", background: "var(--color-paper)" }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.875rem", marginBottom: "0.875rem" }}>
                <span
                  className="leading-none"
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    color: "var(--color-hairline)",
                    flexShrink: 0,
                  }}
                >
                  {s.num}
                </span>
                <h3
                  style={{
                    fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
                    fontSize: "1.35rem",
                    fontWeight: 400,
                    letterSpacing: "-0.02em",
                    color: "var(--color-ink)",
                  }}
                >
                  {s.name}
                </h3>
              </div>
              <p
                className="text-xs font-bold uppercase tracking-[0.14em]"
                style={{ color: "var(--color-ocean)", marginBottom: "0.4rem", fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace" }}
              >
                Reading it underwater
              </p>
              <p className="text-sm leading-[1.7]" style={{ color: "var(--color-ink-2)", marginBottom: "1.1rem" }}>
                {s.underwater}
              </p>
              <p
                className="text-xs font-bold uppercase tracking-[0.14em]"
                style={{ color: "var(--color-ocean)", marginBottom: "0.4rem", fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace" }}
              >
                What this site shows
              </p>
              <p className="text-sm leading-[1.7]" style={{ color: "var(--color-ink-2)", marginBottom: "0.6rem" }}>
                {s.onsite}
              </p>
              <p className="text-xs leading-[1.6]" style={{ color: "var(--color-ink-2)", opacity: 0.75 }}>
                Source: {s.source}
              </p>
            </div>
          ))}
        </div>

        {/* THE THREE STATES */}
        <div style={{ margin: "3.5rem 0 2.5rem" }}>
          <h2
            style={{
              fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
              fontSize: "clamp(1.4rem, 3vw, 1.75rem)",
              fontWeight: 400,
              letterSpacing: "-0.025em",
              color: "var(--color-ink)",
              marginBottom: "0.5rem",
            }}
          >
            Three states a reef can be in
          </h2>
          <p className="text-sm leading-[1.7]" style={{ color: "var(--color-ink-2)" }}>
            Put the 4 signals together and a reef lands in one of 3 honest
            labels. These are the dots you see on the globe and the cards.
          </p>
        </div>

        <div
          className="overflow-hidden rounded-[1.25rem]"
          style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--color-hairline)" }}
        >
          {STATES.map((st) => (
            <div key={st.state} className="flex gap-4 px-6 py-5" style={{ background: "var(--color-paper)", alignItems: "flex-start" }}>
              <span
                aria-hidden="true"
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "999px",
                  background: STATE_COLOR[st.state],
                  flexShrink: 0,
                  marginTop: "0.4rem",
                }}
              />
              <div>
                <h3 className="text-sm" style={{ fontWeight: 700, color: "var(--color-ink)", marginBottom: "0.3rem" }}>
                  {STATE_TEXT[st.state]}
                </h3>
                <p className="text-sm leading-[1.65]" style={{ color: "var(--color-ink-2)" }}>
                  {st.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* HONEST LIMITS NOTE */}
        <div
          style={{
            margin: "2.5rem 0",
            padding: "1rem 1.25rem",
            borderLeft: "3px solid var(--color-hairline)",
            background: "rgba(14,28,40,0.03)",
            borderRadius: "0 0.5rem 0.5rem 0",
          }}
        >
          <p className="text-xs leading-[1.7]" style={{ color: "var(--color-ink-2)" }}>
            <strong style={{ color: "var(--color-ink)" }}>One honest caveat:</strong>{" "}
            these labels rest on the signals we have, and a reef can be recovering
            or declining faster than our data shows. That gap is exactly why your
            eyes underwater matter. The{" "}
            <Link href="/data" style={{ color: "var(--color-ocean)" }}>method page</Link>{" "}
            lists every source and its limits.
          </p>
        </div>

        {/* THE METHOD, EVERY DIVE */}
        <div style={{ margin: "3.5rem 0 2.5rem" }}>
          <h2
            style={{
              fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
              fontSize: "clamp(1.4rem, 3vw, 1.75rem)",
              fontWeight: 400,
              letterSpacing: "-0.025em",
              color: "var(--color-ink)",
              marginBottom: "0.5rem",
            }}
          >
            The method, every dive
          </h2>
          <p className="text-sm leading-[1.7]" style={{ color: "var(--color-ink-2)" }}>
            Read these signals once and you understand a reef. Read them the same
            way on every dive and you become someone who watches it. This is the
            routine at the heart of Read your reef, simple enough for a divemaster
            to teach a whole dive team in a single dive.
          </p>
        </div>

        <ol
          className="overflow-hidden rounded-[1.25rem]"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1px",
            background: "var(--color-hairline)",
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          {METHOD.map((m) => (
            <li key={m.num} className="flex gap-4 px-6 py-5" style={{ background: "var(--color-paper)", alignItems: "flex-start" }}>
              <span
                aria-hidden="true"
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  color: "var(--color-ocean)",
                  flexShrink: 0,
                  marginTop: "0.1rem",
                  fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
                }}
              >
                {m.num}
              </span>
              <div>
                <h3 className="text-sm" style={{ fontWeight: 700, color: "var(--color-ink)", marginBottom: "0.3rem" }}>
                  {m.when}
                </h3>
                <p className="text-sm leading-[1.65]" style={{ color: "var(--color-ink-2)" }}>
                  {m.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/* WHAT TO CAPTURE — PER DESTINATION */}
        <div style={{ margin: "3.5rem 0 2.5rem" }}>
          <h2
            style={{
              fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
              fontSize: "clamp(1.4rem, 3vw, 1.75rem)",
              fontWeight: 400,
              letterSpacing: "-0.025em",
              color: "var(--color-ink)",
              marginBottom: "0.5rem",
            }}
          >
            What to capture, and for whom
          </h2>
          <p className="text-sm leading-[1.7]" style={{ color: "var(--color-ink-2)" }}>
            What you photograph depends on where you want the record to go. Each
            destination needs a different approach, and some do not need a camera
            at all. Here is the method for each one.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {CAPTURE_FORMATS.map((f) => (
            <div
              key={f.platform}
              className="rounded-2xl p-6 sm:p-7"
              style={{ border: "1px solid var(--color-hairline)", background: "var(--color-paper)" }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                <span
                  className="text-xs font-bold uppercase tracking-[0.14em]"
                  style={{
                    color: "var(--color-ocean)",
                    fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
                  }}
                >
                  {f.platform}
                </span>
                <h3
                  style={{
                    fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
                    fontSize: "1.15rem",
                    fontWeight: 400,
                    letterSpacing: "-0.02em",
                    color: "var(--color-ink)",
                  }}
                >
                  {f.label}
                </h3>
              </div>
              <p className="text-sm leading-[1.7]" style={{ color: "var(--color-ink-2)", marginBottom: "0.75rem" }}>
                {f.method}
              </p>
              <p
                className="text-xs leading-[1.6]"
                style={{
                  color: "var(--color-ink-2)",
                  opacity: 0.7,
                  fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
                }}
              >
                {f.spec}
              </p>
            </div>
          ))}
        </div>

        <p className="text-xs leading-[1.6]" style={{ color: "var(--color-ink-2)", opacity: 0.6, marginTop: "0.85rem" }}>
          The 3D photogrammetry method was developed by Bayley and Mogg (2020,
          Methods in Ecology and Evolution) and refined by the AIMS EcoRRAP
          program (Gordon, Figueira et al. 2023). Wildflow applies and documents
          this method for reef scientists.
        </p>

        {/* TURN IT INTO A RECORD */}
        <div style={{ margin: "3.5rem 0 2.5rem" }}>
          <h2
            style={{
              fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
              fontSize: "clamp(1.4rem, 3vw, 1.75rem)",
              fontWeight: 400,
              letterSpacing: "-0.025em",
              color: "var(--color-ink)",
              marginBottom: "0.5rem",
            }}
          >
            Turn what you saw into a record
          </h2>
          <p className="text-sm leading-[1.7]" style={{ color: "var(--color-ink-2)" }}>
            Reading a reef changes your dive. Logging it changes the science. A
            reef with a cold record needs one careful observer far more than a
            famous reef needs its thousandth photo. Here is where your observation
            goes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {NETWORKS.map((n) => (
            <a
              key={n.name}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl p-6 transition-colors"
              style={{ border: "1px solid var(--color-hairline)", background: "var(--color-paper)", textDecoration: "none" }}
            >
              <p className="text-sm" style={{ fontWeight: 700, color: "var(--color-ocean)", marginBottom: "0.5rem" }}>
                {n.name}
              </p>
              <p className="text-sm leading-[1.6]" style={{ color: "var(--color-ink-2)" }}>
                {n.note}
              </p>
            </a>
          ))}
        </div>

        {/* CTA STRIP */}
        <div
          className="mt-14 flex flex-col gap-6 rounded-[1.25rem] p-8 sm:flex-row sm:items-center sm:justify-between"
          style={{ background: "var(--color-ink)", color: "#ffffff" }}
        >
          <div>
            <h3 className="text-lg tracking-[-0.02em] text-white" style={{ fontWeight: 800, marginBottom: "0.375rem" }}>
              Just got out of the water?
            </h3>
            <p className="text-sm leading-[1.6]" style={{ color: "rgba(255,255,255,0.55)" }}>
              Submit a sighting and we route it to the right networks for you.
            </p>
          </div>
          <Link
            href="/upload"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-6 py-3 text-sm"
            style={{
              fontWeight: 700,
              background: "var(--color-brand-yellow)",
              color: "var(--color-ink)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Upload a sighting
          </Link>
        </div>
      </div>
    </>
  );
}
