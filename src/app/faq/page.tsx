import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — how reef metrics are calculated",
  description:
    "How scubaSeason.fun calculates coral cover, reef health, and the at-this-rate projection shown on each dive location.",
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader activeHref="/faq" />

      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0089de]">
          FAQ
        </p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
          How reef metrics are calculated
        </h1>

        <section id="coral-cover" className="mt-10 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Coral reef health
          </h2>
          <div className="mt-4 space-y-4 text-base leading-7 text-slate-700">
            <p>
              The number we show is{" "}
              <strong>live coral cover</strong> — the percentage of the seafloor
              at the dive location that is covered by living, healthy coral.
              The rest is rubble, sand, algae, or bleached / dead coral
              skeleton. It comes from in-water surveys (line- or
              point-intercept transects) done by reef monitoring programs.
            </p>
            <p>
              Higher is better. As a rule of thumb, a healthy tropical reef
              sits around <strong>50% live cover</strong>. Anything under 30%
              is a reef that has lost a lot, and under 20% is severely
              degraded.
            </p>
            <p>
              We show two snapshots of the <em>same</em> site so you can see
              its trajectory, not a generic baseline:
            </p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <strong>A decade ago</strong> — the earlier survey on file,
                typically from the early-to-mid 2010s.
              </li>
              <li>
                <strong>Today</strong> — the most recent survey on file. The
                year of each survey is shown under the bar.
              </li>
            </ul>
          </div>
        </section>

        <section id="projection" className="mt-12 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            The “at this rate” projection
          </h2>
          <div className="mt-4 space-y-4 text-base leading-7 text-slate-700">
            <p>
              When a reef is losing cover, we extend the line forward. The
              math is deliberately simple:
            </p>
            <ol className="ml-5 list-decimal space-y-2">
              <li>
                Take the difference between the two surveys
                (e.g. 37% → 28% = 9 points lost).
              </li>
              <li>
                Divide by the years between them (e.g. 9 ÷ 10 = 0.9 points per
                year).
              </li>
              <li>
                Divide today&rsquo;s cover by that annual loss to get years
                until zero (e.g. 28 ÷ 0.9 ≈ 31 years).
              </li>
            </ol>
            <p>
              This is a <strong>linear extrapolation</strong>, not a forecast.
              It assumes the recent rate continues — which it might not. A
              single bleaching event can collapse a reef in a season; strong
              protection and cool years can slow the slide. Treat the year as
              a “if nothing changes, you&rsquo;ve got this long” signal, not a
              prediction.
            </p>
            <p>
              We don&rsquo;t show a projection when a reef is holding steady or
              recovering, or when we only have one survey on file.
            </p>
          </div>
        </section>

        <section id="heat-stress" className="mt-12 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Heat stress
          </h2>
          <div className="mt-4 space-y-4 text-base leading-7 text-slate-700">
            <p>
              The bleaching alert comes from NOAA Coral Reef Watch. Levels
              run from no-stress → watch → warning → alert-1 → alert-2, and
              roughly track how much heat the reef has absorbed (in
              degree-heating-weeks).
            </p>
          </div>
        </section>

        <section id="data-freshness" className="mt-12 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            How fresh is the reef data?
          </h2>
          <div className="mt-4 space-y-4 text-base leading-7 text-slate-700">
            <p>
              Two different things, two different cadences:
            </p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <strong>Thermal stress</strong> (the NOAA alert level, degree
                heating weeks, and SST anomaly) is pulled from NOAA Coral
                Reef Watch nightly. The label next to each value shows the
                date of the most recent satellite product.
              </li>
              <li>
                <strong>Coral cover</strong> is a snapshot from the most
                recent in water survey we have on file. For well funded
                jurisdictions (GBR, Florida, Hawaii) that&rsquo;s often
                within the last year or two; outside those, it can be five
                or ten years old. The label shows the survey date — and an
                age warning if it&rsquo;s more than 2 years old.
              </li>
            </ul>
            <p>
              The{" "}
              <Link href="/data" className="text-[#0089de] hover:underline">
                /data page
              </Link>{" "}
              lays the whole picture out — what&rsquo;s live, what&rsquo;s a
              snapshot, what we can&rsquo;t see at all today.
            </p>
          </div>
        </section>

        <section id="alert-levels" className="mt-12 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            What do NOAA bleaching alert levels mean?
          </h2>
          <div className="mt-4 space-y-3 text-base leading-7 text-slate-700">
            <p>
              The five levels track how much heat the reef has absorbed,
              measured in <strong>degree heating weeks</strong> (°C weeks) —
              the integral of temperature over the long term summer maximum.
            </p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <strong>No Stress</strong> — sea surface temperature at or
                below the warmest monthly mean. Reef is unstressed.
              </li>
              <li>
                <strong>Watch</strong> — SST is above the warmest monthly
                mean but DHW is still ~0. Heat is starting to accumulate.
              </li>
              <li>
                <strong>Warning</strong> — DHW between roughly 0 and 4 °C weeks.
                Possible bleaching, mortality unlikely.
              </li>
              <li>
                <strong>Alert Level 1</strong> — DHW ≥ 4 °C weeks.
                Significant bleaching expected.
              </li>
              <li>
                <strong>Alert Level 2</strong> — DHW ≥ 8 °C weeks. Widespread
                bleaching and significant coral mortality likely.
              </li>
            </ul>
            <p>
              These are categorical thresholds, not predictions. A reef
              shown at Alert 2 may still recover; one shown at No Stress can
              be hit by next month&rsquo;s heatwave.
            </p>
          </div>
        </section>

        <section id="reef-dying" className="mt-12 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Can you tell me if a reef is dying?
          </h2>
          <div className="mt-4 space-y-3 text-base leading-7 text-slate-700">
            <p>
              Honestly — no, not from what we have today. We can tell you:
            </p>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>What the current thermal stress alert level is.</li>
              <li>What live coral cover was at the last in water survey.</li>
              <li>
                What that survey measured a decade earlier, when both
                snapshots exist.
              </li>
            </ul>
            <p>
              What we <em>can&rsquo;t</em> defensibly say from current data:
              that fish populations are declining, that sharks are
              &ldquo;disappearing&rdquo;, or that a reef is on a terminal
              trajectory. Sightings without an effort denominator (how many
              divers, how many hours) don&rsquo;t support trend claims, and
              we won&rsquo;t pretend they do.
            </p>
          </div>
        </section>

        <section id="diver-contributions" className="mt-12 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Will divers contribute photos in the future?
          </h2>
          <div className="mt-4 space-y-3 text-base leading-7 text-slate-700">
            <p>
              Maybe. It&rsquo;s the most asked question and also the most
              honest answer we have: we&rsquo;re thinking about it but
              haven&rsquo;t built it.
            </p>
            <p>
              The shape we&rsquo;re exploring is targeted &ldquo;citizen
              missions&rdquo; — specific reefs where standardised before
              and after imagery would matter — with a small sponsored
              payout per qualifying photo set. None of that is live,
              priced, or promised. The volunteer survey space is already
              crowded, and we don&rsquo;t want to add noise without a real
              brief.
            </p>
          </div>
        </section>

        <section id="funding" className="mt-12 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            How is scubaSeason funded?
          </h2>
          <div className="mt-4 space-y-3 text-base leading-7 text-slate-700">
            <p>
              Today: affiliate links to operators, lodging, and gear. If you
              book through one of those links, the site earns a commission.
              Editorial recommendations and source/methodology disclosures
              don&rsquo;t change based on commission rates — see{" "}
              <Link href="/about" className="text-[#0089de] hover:underline">
                About → Editorial independence
              </Link>
              .
            </p>
            <p>
              Longer term, the affiliate income is a floor, not the plan.
              The wedges we&rsquo;re looking at are research and NGO data
              subscriptions, and post event evidence infrastructure for
              conservation funders. Neither exists yet and neither is
              funding the site today.
            </p>
          </div>
        </section>

        <p className="mt-12 text-sm text-slate-500">
          Source links for each survey live on the individual location page
          under the relevant claim.{" "}
          <Link href="/about" className="text-[#0089de] hover:underline">
            More about how we work →
          </Link>
        </p>
      </main>
    </div>
  );
}
