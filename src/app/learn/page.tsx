import type { Metadata } from "next";
import Link from "next/link";
import { STATE_TEXT, STATE_COLOR, type ReefState } from "@/lib/data/reef-state";

export const metadata: Metadata = {
  title: "Read your reef — Scuba Season",
  description:
    "Learn to read the real state of a reef underwater: coral cover, heat stress, fishing pressure, and how recently anyone surveyed it. Then turn what you saw into a scientific record.",
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
      "Look at how much of the hard bottom is still living coral versus bare rock, rubble, or algae. A healthy reef is mostly structure built by living coral. When you see broad fields of dead skeleton turning fuzzy green, cover has collapsed.",
    onsite:
      "Scuba Season shows the most recent measured hard coral cover for a location against its historical baseline, so you can see whether the reef is holding near what it once was or slipping below it.",
    source: "Survey networks including AIMS Long Term Monitoring and the Global Coral Reef Monitoring Network.",
  },
  {
    num: "02",
    name: "Heat stress",
    underwater:
      "Bleaching is the reef telling you it is too hot. Coral that has gone bone white or pale and ghostly is alive but starving, having expelled the algae it lives on. Patchy white tips after a warm season are an early sign. Whole white reefs are an emergency.",
    onsite:
      "We carry the bleaching alert level from NOAA Coral Reef Watch, updated continuously from satellite. It tells you whether the water has been hot enough, for long enough, to expect bleaching before you even get in.",
    source: "NOAA Coral Reef Watch, degree heating weeks accumulated over the last twelve weeks.",
  },
  {
    num: "03",
    name: "Fishing pressure",
    underwater:
      "Count the big fish. A reef under light pressure has large groupers, snappers, sharks, and dense schools. A reef that is heavily fished feels empty of anything bigger than your hand, even when the coral looks fine. Missing predators is the quietest warning sign there is.",
    onsite:
      "We show fishing pressure drawn from vessel activity tracked within fifty kilometers over the last year, so you know whether the fish you are not seeing were fished out rather than simply hiding.",
    source: "Global Fishing Watch, automatic identification system vessel tracks.",
  },
  {
    num: "04",
    name: "Survey freshness",
    underwater:
      "This is the one you cannot see, and it is the one where you matter most. Ask yourself: when did a scientist last look at this reef? On many sites the honest answer is years ago, or never. If the record is cold, the most recent useful observation of this reef might be the one you are about to make.",
    onsite:
      "Every location carries a freshness label. Fresh means a structured survey happened within the last two years. Cold means no recent eyes underwater. Cold reefs are flagged as places that need fresh eyes, because they do.",
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
    body: "Coral cover is at or above the reef's long term baseline and steady, heat stress rarely passes a watch, and fishing pressure is light or the reef is protected. This is a reef close to its natural self.",
  },
  {
    state: "pressure",
    body: "Still rewarding to dive, but coral cover is moderate or slipping under warming, fishing, or both. The structure and the fish life largely hold. Intact, not pristine.",
  },
  {
    state: "change",
    body: "Coral cover is well below baseline after one or more bleaching events, and the reef is actively reorganising. Diving here documents what remains, and your records here are the most valuable in the atlas.",
  },
];

// The repeatable read-and-record routine. This is the "clear, repeatable method" the
// Read Your Reef framework trains: the same four signals above, run in the same order
// on every dive, ending in a logged record.
const METHOD: { num: string; when: string; body: string }[] = [
  {
    num: "01",
    when: "Before you dive",
    body: "Open the reef on Scuba Season and read its state. The heat stress and freshness signals tell you what to expect below, and whether this is a reef whose record is cold enough that your eyes genuinely matter.",
  },
  {
    num: "02",
    when: "As you descend",
    body: "Run the four signals in the same order every time: how much living coral, any bleaching, the big fish, and anything that does not match what the record led you to expect. The order is the habit. After a few dives it becomes automatic.",
  },
  {
    num: "03",
    when: "Photograph with intent",
    body: "One sharp photo of any animal you can name, and one wide photo of the coral. A photograph is what carries an observation across the line from a memory, which science cannot use, into a record, which it can.",
  },
  {
    num: "04",
    when: "Back on the boat",
    body: "Log it while the dive is fresh, before the next one blurs the details. Submit through Scuba Season and we route it onward, or go straight to iNaturalist. That is the whole loop, and it closes on every single dive.",
  },
];

// The three networks the site already routes diver records into (consistent with
// /about and the sighting submission flow).
const NETWORKS: { name: string; url: string; note: string }[] = [
  {
    name: "iNaturalist",
    url: "https://www.inaturalist.org",
    note: "Photograph what you see. Research grade observations flow on to GBIF, the database researchers in over one hundred countries draw from.",
  },
  {
    name: "Reef Check",
    url: "https://www.reefcheck.org",
    note: "Learn the structured survey method and your counts become part of a global reef monitoring dataset.",
  },
  {
    name: "CoralWatch",
    url: "https://coralwatch.org",
    note: "Match coral colour to a simple chart and you have logged a bleaching observation anyone can verify.",
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
            thing that actually matters once you are in the water: the reef
            itself, honestly, with the same four signals this atlas uses.
          </p>
        </div>
      </header>

      {/* PAGE BODY */}
      <div className="mx-auto max-w-[800px] px-6 py-16" style={{ background: "var(--color-paper)" }}>

        {/* INTRO PROSE */}
        <div className="space-y-5 text-base leading-[1.8]" style={{ color: "var(--color-ink-2)" }}>
          <p>
            A reef does not hide its condition. It is written in the coral, the
            water temperature, the fish, and in how long it has been since
            anyone wrote any of it down. Once you know what to look for, a single
            dive tells you whether a reef is holding, slipping, or already
            changed. That same dive can become a record that scientists use.
          </p>
          <p>
            This is the whole idea behind Scuba Season. You are already in the
            water. You are already looking. The only missing piece is knowing
            what you are looking at, and a way to pass it on.
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
            Read these four together and you can read almost any reef on the
            planet. They are exactly the signals this atlas weighs when it labels
            a reef.
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
            Put the four signals together and a reef falls into one of three
            honest labels. These are the dots you see on the globe and the cards.
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
            these labels are grounded in the signals we have, not a complete
            diagnosis. A reef can be recovering or declining faster than our data
            shows. That gap is exactly why your eyes underwater matter. See the{" "}
            <Link href="/data" style={{ color: "var(--color-ocean)" }}>method page</Link>{" "}
            for every source and its limits.
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
            Read these signals once and you can understand a reef. Read them the
            same way on every dive and you become a monitor of it. This is the
            repeatable method at the heart of Read your reef, the same routine a
            divemaster can teach a whole dive team, and it takes a single dive to
            learn.
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
            reef with a cold record needs a single careful observer far more than
            a famous reef needs its thousandth photo. Here is where your
            observation goes.
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
