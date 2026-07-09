import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Torre Guaceto: protection you can watch — Scuba Season",
  description:
    "A Blue Park where strict protection brought the fish back and raised what local fishers earn. The case study for what enduring protection looks like, built on Marine Conservation Institute's own published figures.",
};

// Every figure on this page comes from Marine Conservation Institute's own
// published article, "Enduring Blue Parks: Torre Guaceto" (José Escaño
// Roepstorff / MCI), published openly at marine-conservation.org so a reviewer
// can check each number against a source MCI itself published. Do not edit a
// figure here without matching it to that source. Note: a site-specific fish
// biomass percentage is NOT in this article (the widely quoted ~420% figure is
// a Mediterranean-wide no-take average, not a Torre Guaceto measurement), so we
// keep the fish recovery qualitative here rather than cite a number we cannot
// source to Torre Guaceto.
const MCI_ARTICLE_URL =
  "https://marine-conservation.org/on-the-tide/enduring-blue-parks-torre-guaceto/";

const STATS: { figure: string; label: string }[] = [
  {
    figure: "$210 to $10,500",
    label: "what local fishers earn on a good day, before protection and after",
  },
  {
    figure: "22 to 90+ km²",
    label: "protected water today and under the planned expansion",
  },
  {
    figure: "Silver",
    label:
      "its Blue Park level, awarded in 2019 and reaffirmed on the 5 year science review",
  },
];

export default function TorreGuacetoPage() {
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
            Blue Parks · Protection works
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
            Protection you can watch, not just trust.
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
            Torre Guaceto is one of the clearest proofs anywhere that protecting a
            reef is not a cost. It is an investment that pays the people who live
            beside it. Here is what happened, and how you can watch whether it
            holds.
          </p>
        </div>
      </header>

      {/* PAGE BODY */}
      <div className="mx-auto max-w-[800px] px-6 py-16" style={{ background: "var(--color-paper)" }}>

        {/* LEAD NARRATIVE — the enduring idea */}
        <div className="space-y-5 text-base leading-[1.8]" style={{ color: "var(--color-ink-2)" }}>
          <p>
            Protection is not a promise you make once. The best protected reefs
            are the ones that keep being protected, year after year, through
            heatwaves and storms and pressure to fish them. That is the whole
            idea behind an Enduring Blue Park. Scientists come back every 5 years
            and check that the protection is still working.
          </p>
          <p>
            Scuba Season shows you the same story, live, in between those checks.
            Every site carries a trajectory, Improving, Stable, or Declining,
            built from real monitoring data. So you are not trusting a label from
            a decade ago. You are watching whether the protection is holding,
            right now, before you book.
          </p>
        </div>

        {/* THE HEADLINE NUMBERS */}
        <div style={{ margin: "3.5rem 0 1.5rem" }}>
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
            What protection did here
          </h2>
          <p className="text-sm leading-[1.7]" style={{ color: "var(--color-ink-2)" }}>
            Three numbers tell the story, and they all come from the people who
            assess this park.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STATS.map((s) => (
            <div
              key={s.figure}
              className="rounded-2xl p-6"
              style={{ border: "1px solid var(--color-hairline)", background: "var(--color-paper)" }}
            >
              <p
                className="leading-none"
                style={{
                  fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
                  fontSize: "1.9rem",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  color: "var(--color-improving)",
                  marginBottom: "0.75rem",
                }}
              >
                {s.figure}
              </p>
              <p className="text-sm leading-[1.6]" style={{ color: "var(--color-ink-2)" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* THE STORY */}
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
            The reef that pays for itself
          </h2>
        </div>

        <div className="space-y-5 text-base leading-[1.8]" style={{ color: "var(--color-ink-2)" }}>
          <p>
            Torre Guaceto sits on the Adriatic coast of southern Italy. It is
            small, only about 22 square kilometres of protected water, and it is a
            model for what good protection actually does.
          </p>
          <p>
            When the strict no take zones went in, the fish came back fast. Inside
            those zones fish populations rebounded while the unprotected water
            right next door kept declining. More fish inside meant more spilling
            out into the water where the local boats work.
          </p>
          <p>
            Here is the part that changes the argument. The fishers did better,
            not worse. On a good day their earnings went from around 210 dollars
            to as much as 10,500 dollars. The protected core works like a savings
            account. Fish grow big and spill out into the surrounding water where
            the local boats work, so the community catches more by fishing less of
            the reef itself. The fishers are not fenced out. They are partners now,
            helping monitor the site and enforce the rules they helped write.
          </p>
          <p>
            None of this happened by accident, and none of it was a one time win.
            Torre Guaceto updated its management plan in 2023, kept expanding
            toward more than 90 square kilometres of protection, and passed its 5
            year review to renew its status. That is what enduring means. The
            protection did not just get declared once. It got checked, and it
            held.
          </p>
        </div>

        {/* HONEST CORAL CAVEAT */}
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
            <strong style={{ color: "var(--color-ink)" }}>A note on coral.</strong>{" "}
            Coral cover rises and falls with ocean heat, and heat does not stop at
            a park boundary, so coral is not the best scorecard for whether
            protection is working. Fish are. Where a protected reef holds its coral
            through a hot year that hit the whole region, that is a real and good
            sign, and we show it. Where coral falls because the water got too warm,
            we say so plainly. Protection cannot cool the ocean. What it can do is
            bring the fish back, and at Torre Guaceto it did.
          </p>
        </div>

        {/* SOURCE ATTRIBUTION */}
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
            Where these numbers come from
          </h2>
          <p className="text-sm leading-[1.7]" style={{ color: "var(--color-ink-2)" }}>
            Every figure on this page is drawn from Marine Conservation Institute,
            which runs the Blue Parks program and assesses Torre Guaceto. The
            earnings, expansion, Blue Park level, and 5 year renewal figures are
            from their article{" "}
            <a
              href={MCI_ARTICLE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--color-ocean)" }}
            >
              Enduring Blue Parks
            </a>
            . The protection level and management stage for the park are from{" "}
            <a
              href="https://mpatlas.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--color-ocean)" }}
            >
              MPAtlas
            </a>
            . Full source details and method are on the{" "}
            <Link href="/data" style={{ color: "var(--color-ocean)" }}>method page</Link>.
          </p>
        </div>

        {/* CTA STRIP */}
        <div
          className="mt-14 flex flex-col gap-6 rounded-[1.25rem] p-8 sm:flex-row sm:items-center sm:justify-between"
          style={{ background: "var(--color-ink)", color: "#ffffff" }}
        >
          <div>
            <h3 className="text-lg tracking-[-0.02em] text-white" style={{ fontWeight: 800, marginBottom: "0.375rem" }}>
              See which reefs are holding.
            </h3>
            <p className="text-sm leading-[1.6]" style={{ color: "rgba(255,255,255,0.55)" }}>
              Every site carries a live trajectory, so you can watch protection
              work before you book.
            </p>
          </div>
          <Link
            href="/locations"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-6 py-3 text-sm"
            style={{
              fontWeight: 700,
              background: "var(--color-brand-yellow)",
              color: "var(--color-ink)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Explore reefs
          </Link>
        </div>
      </div>
    </>
  );
}
