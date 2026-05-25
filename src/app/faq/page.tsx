import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — how reef metrics are calculated",
  description:
    "How scubaSeason.fun calculates coral cover, reef health, and the at-this-rate projection shown on each dive location.",
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-slate-900">
              scubaSeason<span className="text-[#0089de]">.fun</span>
            </span>
          </Link>
          <nav className="hidden gap-6 text-sm font-medium text-slate-700 sm:flex">
            <Link href="/sites" className="hover:text-[#0089de]">
              Dive sites
            </Link>
            <Link href="/about" className="hover:text-[#0089de]">
              About
            </Link>
            <Link href="/faq" className="text-[#0089de]">
              FAQ
            </Link>
          </nav>
        </div>
      </header>

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
