import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | scubaSeason.fun",
  description:
    "What this site is, and why it exists. Editorial principles, roadmap, and how to get in touch.",
};

export default function AboutPage() {
  return (
    <>
      {/* PAGE HEADER — light bg */}
      <header
        style={{ borderBottom: "1px solid #e2e8f0" }}
        className="px-6 pb-16 pt-20"
      >
        <div className="mx-auto max-w-[800px]">
          <p
            className="text-[0.6875rem] font-bold uppercase tracking-[0.18em]"
            style={{ color: "#0089de", marginBottom: "1rem" }}
          >
            About
          </p>
          <h1
            className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.04] tracking-[-0.035em]"
            style={{
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: "1.5rem",
            }}
          >
            What this site is, and why it exists.
          </h1>
          <p
            style={{
              fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
              fontSize: "1.2rem",
              lineHeight: 1.75,
              color: "#475569",
              maxWidth: "640px",
            }}
          >
            Born out of love for the ocean, and honestly a fair amount of
            frustration too.
          </p>
        </div>
      </header>

      {/* PAGE BODY */}
      <div className="mx-auto max-w-[800px] px-6 py-16">

        {/* 4 PROSE PARAGRAPHS */}
        <div className="space-y-5 text-base leading-[1.8]" style={{ color: "#334155" }}>
          <p>
            Dive site information online is scattered — old forum threads,
            operator brochures, trip reports from a decade ago. Most of it is
            stale or just wrong. When you&rsquo;re trying to plan a trip around
            what you actually want to see underwater, that&rsquo;s a hard place
            to start.
          </p>
          <p>
            I&rsquo;ve been caught out too many times. Booked trips chasing
            species that hadn&rsquo;t been spotted in years. Showed up in the
            wrong season. Paid good money for dives that weren&rsquo;t close to
            what was advertised. Every time it happens it&rsquo;s a small
            heartbreak — and after enough of them, I figured other divers
            probably feel the same.
          </p>
          <p>
            This is a public atlas and citizen science project. Keep dive site
            information as honest and current as possible, in one place, so the
            next person planning a trip has something real to work from.
          </p>
          <p>
            Ongoing work, built by one person — me. Imperfect, always being
            updated, and genuinely trying.
          </p>
          <p>
            scubaseason.fun is a nonprofit project. Affiliate commissions from
            hotels, liveaboards, and gear cover hosting and development costs —
            this site has no investors and earns no profit.
          </p>
          <p>
            The long-term goal is to become more than a planning tool.
            Recreational divers collectively observe reef systems that science
            cannot afford to monitor continuously — and this platform is building
            toward a system that routes those observations to scientific
            databases, helping close the gap between ocean fieldwork and the
            people already in the water.
          </p>
        </div>

        {/* EDITORIAL PRINCIPLES */}
        <div style={{ margin: "3.5rem 0 2.5rem" }}>
          <h2
            className="text-[1.625rem] tracking-[-0.025em]"
            style={{ fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}
          >
            Editorial principles
          </h2>
          <p className="text-[0.9375rem] leading-[1.7]" style={{ color: "#334155" }}>
            Four things that don&rsquo;t change regardless of what&rsquo;s
            convenient.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* 01 */}
          <div
            className="rounded-2xl p-6"
            style={{ border: "1px solid #e2e8f0" }}
          >
            <p
              className="leading-none"
              style={{
                fontSize: "2rem",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "#e2e8f0",
                marginBottom: "0.75rem",
              }}
            >
              01
            </p>
            <p
              className="text-[0.9375rem]"
              style={{ fontWeight: 700, color: "#0f172a", marginBottom: "0.4rem" }}
            >
              Honest about data age
            </p>
            <p className="text-sm leading-[1.65]" style={{ color: "#334155" }}>
              Every number has a date. If a coral cover figure is from 2014, it
              says 2014. If we don&rsquo;t know, it says we don&rsquo;t know.
            </p>
          </div>

          {/* 02 */}
          <div
            className="rounded-2xl p-6"
            style={{ border: "1px solid #e2e8f0" }}
          >
            <p
              className="leading-none"
              style={{
                fontSize: "2rem",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "#e2e8f0",
                marginBottom: "0.75rem",
              }}
            >
              02
            </p>
            <p
              className="text-[0.9375rem]"
              style={{ fontWeight: 700, color: "#0f172a", marginBottom: "0.4rem" }}
            >
              No gates on information
            </p>
            <p className="text-sm leading-[1.65]" style={{ color: "#334155" }}>
              No modals, no account prompts, no paywalls interrupting the data.
              If it&rsquo;s on this site, you can read it.
            </p>
          </div>

          {/* 03 */}
          <div
            className="rounded-2xl p-6"
            style={{ border: "1px solid #e2e8f0" }}
          >
            <p
              className="leading-none"
              style={{
                fontSize: "2rem",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "#e2e8f0",
                marginBottom: "0.75rem",
              }}
            >
              03
            </p>
            <p
              className="text-[0.9375rem]"
              style={{ fontWeight: 700, color: "#0f172a", marginBottom: "0.4rem" }}
            >
              Affiliate links don&rsquo;t steer editorial
            </p>
            <p className="text-sm leading-[1.65]" style={{ color: "#334155" }}>
              Commission rates don&rsquo;t affect site rankings. Operator
              listings include independent options wherever we know of them.
            </p>
          </div>

          {/* 04 */}
          <div
            className="rounded-2xl p-6"
            style={{ border: "1px solid #e2e8f0" }}
          >
            <p
              className="leading-none"
              style={{
                fontSize: "2rem",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "#e2e8f0",
                marginBottom: "0.75rem",
              }}
            >
              04
            </p>
            <p
              className="text-[0.9375rem]"
              style={{ fontWeight: 700, color: "#0f172a", marginBottom: "0.4rem" }}
            >
              Degraded reefs get honest labels
            </p>
            <p className="text-sm leading-[1.65]" style={{ color: "#334155" }}>
              &ldquo;Witnessing change&rdquo; is not a polite way of saying
              avoid it. It means go and see what&rsquo;s actually there — not
              what the brochure says.
            </p>
          </div>
        </div>

        {/* ROADMAP */}
        <div style={{ margin: "3.5rem 0 2.5rem" }}>
          <h2
            className="text-[1.625rem] tracking-[-0.025em]"
            style={{ fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}
          >
            Roadmap
          </h2>
          <p className="text-[0.9375rem] leading-[1.7]" style={{ color: "#334155" }}>
            What&rsquo;s built, what&rsquo;s next, and the longer arc. Nothing
            in &ldquo;later&rdquo; is a promise.
          </p>
        </div>

        <div
          className="overflow-hidden rounded-[1.25rem]"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1px",
            background: "#e2e8f0",
          }}
        >
          {/* NOW */}
          <div
            className="flex gap-5 px-7 py-6"
            style={{ background: "#e7f6ee", alignItems: "flex-start" }}
          >
            <div style={{ width: "48px", flexShrink: 0, marginTop: "0.1rem" }}>
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
                Now
              </span>
            </div>
            <div>
              <h3
                className="text-[0.9375rem]"
                style={{
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: "0.375rem",
                }}
              >
                Live today
              </h3>
              <ul
                className="list-disc pl-5"
                style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}
              >
                <li className="text-sm leading-[1.6]" style={{ color: "#334155" }}>
                  NOAA Coral Reef Watch thermal stress on every reef, refreshed
                  nightly
                </li>
                <li className="text-sm leading-[1.6]" style={{ color: "#334155" }}>
                  Honest freshness labels distinguishing live data from snapshot
                  surveys
                </li>
                <li className="text-sm leading-[1.6]" style={{ color: "#334155" }}>
                  Operators, lodging, gear, and season windows for trip planning
                </li>
                <li className="text-sm leading-[1.6]" style={{ color: "#334155" }}>
                  IUCN Red List species conservation status on every dive site
                  species
                </li>
              </ul>
            </div>
          </div>

          {/* NEXT */}
          <div
            className="flex gap-5 px-7 py-6"
            style={{ background: "#fef9ed", alignItems: "flex-start" }}
          >
            <div style={{ width: "48px", flexShrink: 0, marginTop: "0.1rem" }}>
              <span
                className="inline-block rounded-full px-2.5 py-1 text-white"
                style={{
                  fontSize: "0.5875rem",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  background: "#f59e0b",
                }}
              >
                Next
              </span>
            </div>
            <div>
              <h3
                className="text-[0.9375rem]"
                style={{
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: "0.375rem",
                }}
              >
                In progress
              </h3>
              <ul
                className="list-disc pl-5"
                style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}
              >
                <li className="text-sm leading-[1.6]" style={{ color: "#334155" }}>
                  Real coral cover ingestion for US and Caribbean sites (NOAA
                  NCRMP + AGRRA)
                </li>
                <li className="text-sm leading-[1.6]" style={{ color: "#334155" }}>
                  Global Fishing Watch pressure layer per site
                </li>
                <li className="text-sm leading-[1.6]" style={{ color: "#334155" }}>
                  Diver log submission — add your own sighting evidence
                </li>
              </ul>
            </div>
          </div>

          {/* LATER */}
          <div
            className="flex gap-5 px-7 py-6"
            style={{ background: "#f8fafc", alignItems: "flex-start" }}
          >
            <div style={{ width: "48px", flexShrink: 0, marginTop: "0.1rem" }}>
              <span
                className="inline-block rounded-full px-2.5 py-1 text-white"
                style={{
                  fontSize: "0.5875rem",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  background: "#94a3b8",
                }}
              >
                Later
              </span>
            </div>
            <div>
              <h3
                className="text-[0.9375rem]"
                style={{
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: "0.375rem",
                }}
              >
                The longer arc
              </h3>
              <ul
                className="list-disc pl-5"
                style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}
              >
                <li className="text-sm leading-[1.6]" style={{ color: "#334155" }}>
                  Targeted citizen missions in regions where monitoring is thin
                </li>
                <li className="text-sm leading-[1.6]" style={{ color: "#334155" }}>
                  Evidence infrastructure for conservation funders built around
                  bleaching event data
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CONTACT STRIP */}
        <div
          className="mt-14 flex flex-col gap-6 rounded-[1.25rem] p-8 sm:flex-row sm:items-center sm:justify-between"
          style={{ background: "#0b1e32" }}
        >
          <div>
            <h3
              className="text-[1.125rem] tracking-[-0.02em] text-white"
              style={{ fontWeight: 800, marginBottom: "0.375rem" }}
            >
              Spotted something wrong? Want to collaborate?
            </h3>
            <p className="text-sm leading-[1.6]" style={{ color: "rgba(255,255,255,0.45)" }}>
              Good, bad, weird, unfinished — all of it welcome.
            </p>
          </div>
          <a
            href="mailto:hello@scubaseason.fun"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-6 py-3 text-sm text-white"
            style={{
              fontWeight: 700,
              background: "#0089de",
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
