import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | scubaSeason.fun",
  description:
    "What this site is, and why it exists. Editorial principles, roadmap, and how to get in touch.",
};

export default function AboutPage() {
  return (
    <>
      {/* PAGE HEADER — dark bg */}
      <header
        style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
        className="px-6 pb-16 pt-20"
      >
        <div className="mx-auto max-w-[800px]">
          <p
            className="text-[0.6875rem] font-bold uppercase tracking-[0.18em]"
            style={{ color: "#00d4ff", marginBottom: "1rem" }}
          >
            About
          </p>
          <h1
            className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.04] tracking-[-0.035em]"
            style={{
              fontWeight: 800,
              color: "#f0f4f8",
              marginBottom: "1.5rem",
            }}
          >
            The first live data dive research platform.
          </h1>
          <p
            style={{
              fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
              fontSize: "1.2rem",
              lineHeight: 1.75,
              color: "#8b9db8",
              maxWidth: "640px",
            }}
          >
            Born out of love for the ocean, and frustration from the lack of
            aggregated data for dive trip planning.
          </p>
        </div>
      </header>

      {/* PAGE BODY */}
      <div className="mx-auto max-w-[800px] px-6 py-16">

        {/* PROSE */}
        <div className="space-y-5 text-base leading-[1.8]" style={{ color: "#aebcd0" }}>
          <p>
            scubaseason.fun is born out of love for the ocean, frustration from
            planning my own dive trips, and a real concern for what climate
            change is doing to the corals.
          </p>

          <p>As a diver, the questions I want answered are:</p>
          <ul
            className="list-disc pl-6"
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <li>What is in season right now, and where can I contribute by taking photos?</li>
            <li>How are coral reefs being impacted by global warming, and what does that mean for a specific site I want to visit?</li>
            <li>When was the last recorded sighting of a species I want to see, and what are my real chances of seeing it?</li>
            <li>Which reefs will be gone sooner rather than later, so I can prioritize my trips with actual data rather than guessing?</li>
          </ul>

          <p>
            From the research side, scientists, conservation organizations, and
            governments are all actively trying to monitor reef health. The
            approaches vary: some send professional divers, some deploy robots,
            some train local undergrads to document what they see. But the cost
            of monitoring at scale is enormous, and none of these efforts are
            reaching the breadth or frequency that the situation demands.
            Meanwhile, hundreds of thousands of recreational divers are already
            in the water every day, observing exactly what researchers need.
          </p>
          <p>
            The near term goal is to make this the first live updated dive
            research platform so fellow divers can make better planning decisions
            with real data, not a static guide sourced from a decade old forum
            thread, but live feeds from Coral Reef Watch and more, with honest
            labels on everything.
          </p>
          <p>
            The long term vision is to bridge that gap between divers and
            researchers. To help scientists get their data faster, and to give
            divers the context to understand what they are actually looking at
            underwater. You can see where things stand in the roadmap below.
          </p>
        </div>

        {/* EDITORIAL PRINCIPLES */}
        <div style={{ margin: "3.5rem 0 2.5rem" }}>
          <h2
            className="text-[1.625rem] tracking-[-0.025em]"
            style={{ fontWeight: 800, color: "#f0f4f8", marginBottom: "0.5rem" }}
          >
            Editorial principles
          </h2>
          <p className="text-[0.9375rem] leading-[1.7]" style={{ color: "#aebcd0" }}>
            A few things I try to hold to, regardless of what would be easier.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* 01 */}
          <div
            className="rounded-2xl p-6"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <p
              className="leading-none"
              style={{
                fontSize: "2rem",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "rgba(255,255,255,0.1)",
                marginBottom: "0.75rem",
              }}
            >
              01
            </p>
            <p
              className="text-[0.9375rem]"
              style={{ fontWeight: 700, color: "#f0f4f8", marginBottom: "0.4rem" }}
            >
              Honest about data age
            </p>
            <p className="text-sm leading-[1.65]" style={{ color: "#aebcd0" }}>
              Every number has a date. If a coral cover figure is from 2014, it
              says 2014. If we don&rsquo;t know, it says we don&rsquo;t know.
            </p>
          </div>

          {/* 02 */}
          <div
            className="rounded-2xl p-6"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <p
              className="leading-none"
              style={{
                fontSize: "2rem",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "rgba(255,255,255,0.1)",
                marginBottom: "0.75rem",
              }}
            >
              02
            </p>
            <p
              className="text-[0.9375rem]"
              style={{ fontWeight: 700, color: "#f0f4f8", marginBottom: "0.4rem" }}
            >
              No gates on information
            </p>
            <p className="text-sm leading-[1.65]" style={{ color: "#aebcd0" }}>
              No modals, no account prompts, no paywalls interrupting the data.
              If it&rsquo;s on this site, you can read it.
            </p>
          </div>

          {/* 03 */}
          <div
            className="rounded-2xl p-6"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <p
              className="leading-none"
              style={{
                fontSize: "2rem",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "rgba(255,255,255,0.1)",
                marginBottom: "0.75rem",
              }}
            >
              03
            </p>
            <p
              className="text-[0.9375rem]"
              style={{ fontWeight: 700, color: "#f0f4f8", marginBottom: "0.4rem" }}
            >
              Affiliate links don&rsquo;t steer editorial
            </p>
            <p className="text-sm leading-[1.65]" style={{ color: "#aebcd0" }}>
              Commission rates don&rsquo;t affect site rankings. Operator
              listings include independent options wherever we know of them.
            </p>
          </div>

          {/* 04 */}
          <div
            className="rounded-2xl p-6"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <p
              className="leading-none"
              style={{
                fontSize: "2rem",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "rgba(255,255,255,0.1)",
                marginBottom: "0.75rem",
              }}
            >
              04
            </p>
            <p
              className="text-[0.9375rem]"
              style={{ fontWeight: 700, color: "#f0f4f8", marginBottom: "0.4rem" }}
            >
              Degraded reefs get honest labels
            </p>
            <p className="text-sm leading-[1.65]" style={{ color: "#aebcd0" }}>
              &ldquo;Witnessing change&rdquo; is not a polite way of saying
              avoid it. It means go and see what&rsquo;s actually there, not
              what the brochure says.
            </p>
          </div>
        </div>

        {/* ROADMAP */}
        <div style={{ margin: "3.5rem 0 2.5rem" }}>
          <h2
            className="text-[1.625rem] tracking-[-0.025em]"
            style={{ fontWeight: 800, color: "#f0f4f8", marginBottom: "0.5rem" }}
          >
            Roadmap
          </h2>
          <p className="text-[0.9375rem] leading-[1.7]" style={{ color: "#aebcd0" }}>
            Here is where things actually stand. What is live today, and what
            is on my wishlist.
          </p>
        </div>

        <div
          className="overflow-hidden rounded-[1.25rem]"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1px",
            background: "rgba(255,255,255,0.1)",
          }}
        >
          {/* NOW */}
          <div
            className="flex gap-4 px-6 py-5"
            style={{ background: "rgba(16,185,129,0.08)", alignItems: "flex-start" }}
          >
            <div style={{ width: "68px", flexShrink: 0, marginTop: "0.15rem" }}>
              <span
                className="inline-block rounded-full px-2.5 py-1 text-white"
                style={{
                  fontSize: "0.5875rem",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  background: "#10b981",
                }}
              >
                Live
              </span>
            </div>
            <div>
              <h3
                className="text-[0.9375rem]"
                style={{
                  fontWeight: 700,
                  color: "#f0f4f8",
                  marginBottom: "0.375rem",
                }}
              >
                Live today
              </h3>
              <ul
                className="list-disc pl-5"
                style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}
              >
                <li className="text-sm leading-[1.6]" style={{ color: "#aebcd0" }}>
                  Thermal stress data, continuously updated
                </li>
                <li className="text-sm leading-[1.6]" style={{ color: "#aebcd0" }}>
                  Species conservation status from the{" "}
                  <a href="https://www.iucnredlist.org/" target="_blank" rel="noopener noreferrer" style={{ color: "#00d4ff" }}>IUCN Red List</a>,
                  on every dive site
                </li>
                <li className="text-sm leading-[1.6]" style={{ color: "#aebcd0" }}>
                  Seasonal sighting windows and last recorded sighting data
                </li>
                <li className="text-sm leading-[1.6]" style={{ color: "#aebcd0" }}>
                  Freshness labels on every data point so you know exactly how
                  current each figure is
                </li>
              </ul>
              <p className="text-sm leading-[1.6]" style={{ color: "#8b9db8", marginTop: "0.625rem" }}>
                Full source details and methodology on the{" "}
                <a href="/data" style={{ color: "#00d4ff" }}>method page</a>.
              </p>
            </div>
          </div>

          {/* FOR DIVERS */}
          <div
            className="flex gap-5 px-7 py-6"
            style={{ background: "rgba(0,212,255,0.06)", alignItems: "flex-start" }}
          >
            <div style={{ width: "68px", flexShrink: 0, marginTop: "0.15rem" }}>
              <span
                className="inline-block rounded-full px-2.5 py-1 text-[#0a1628]"
                style={{
                  fontSize: "0.5875rem",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  background: "#00d4ff",
                }}
              >
                Wishlist
              </span>
            </div>
            <div>
              <h3
                className="text-[0.9375rem]"
                style={{
                  fontWeight: 700,
                  color: "#f0f4f8",
                  marginBottom: "0.375rem",
                }}
              >
                My wishlist for divers
              </h3>
              <ul
                className="list-disc pl-5"
                style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}
              >
                <li className="text-sm leading-[1.6]" style={{ color: "#aebcd0" }}>
                  More data feeds as access opens up:{" "}
                  <a href="https://globalfishingwatch.org" target="_blank" rel="noopener noreferrer" style={{ color: "#00d4ff" }}>Global Fishing Watch</a>{" "}
                  (fishing pressure),{" "}
                  <a href="https://www.coris.noaa.gov/monitoring/status_report/" target="_blank" rel="noopener noreferrer" style={{ color: "#00d4ff" }}>NOAA NCRMP</a>{" "}
                  (coral cover for US sites),{" "}
                  <a href="https://www.agrra.org" target="_blank" rel="noopener noreferrer" style={{ color: "#00d4ff" }}>AGRRA</a>{" "}
                  (Caribbean surveys)
                </li>
                <li className="text-sm leading-[1.6]" style={{ color: "#aebcd0" }}>
                  Diver log submission: add your own sighting evidence to the
                  record
                </li>
                <li className="text-sm leading-[1.6]" style={{ color: "#aebcd0" }}>
                  Targeted citizen science missions in regions where monitoring
                  data is thin
                </li>
              </ul>
            </div>
          </div>

          {/* FOR SCIENCE */}
          <div
            className="flex gap-5 px-7 py-6"
            style={{ background: "rgba(139,92,246,0.08)", alignItems: "flex-start" }}
          >
            <div style={{ width: "68px", flexShrink: 0, marginTop: "0.15rem" }}>
              <span
                className="inline-block rounded-full px-2.5 py-1 text-white"
                style={{
                  fontSize: "0.5875rem",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  background: "#8b5cf6",
                }}
              >
                Wishlist
              </span>
            </div>
            <div>
              <h3
                className="text-[0.9375rem]"
                style={{
                  fontWeight: 700,
                  color: "#f0f4f8",
                  marginBottom: "0.375rem",
                }}
              >
                My wishlist for science
              </h3>
              <ul
                className="list-disc pl-5"
                style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}
              >
                <li className="text-sm leading-[1.6]" style={{ color: "#aebcd0" }}>
                  Evidence infrastructure to route diver observations directly
                  to scientific databases and conservation funders
                </li>
                <li className="text-sm leading-[1.6]" style={{ color: "#aebcd0" }}>
                  Helping researchers get data faster from the people already in
                  the water, at scale
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CONTACT STRIP */}
        <div
          className="mt-14 flex flex-col gap-6 rounded-[1.25rem] p-8 sm:flex-row sm:items-center sm:justify-between"
          style={{ background: "#0a1628" }}
        >
          <div>
            <h3
              className="text-[1.125rem] tracking-[-0.02em] text-white"
              style={{ fontWeight: 800, marginBottom: "0.375rem" }}
            >
              Spotted something wrong? Want to collaborate?
            </h3>
            <p className="text-sm leading-[1.6]" style={{ color: "rgba(255,255,255,0.45)" }}>
              Good, bad, weird, unfinished. All of it welcome.
            </p>
          </div>
          <a
            href="mailto:hello@scubaseason.fun"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-6 py-3 text-sm text-[#0a1628]"
            style={{
              fontWeight: 700,
              background: "#00d4ff",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            hello@scubaseason.fun →
          </a>
        </div>
      </div>
    </>
  );
}
