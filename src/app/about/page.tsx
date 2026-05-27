import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About + affiliate disclosure | scubaSeason.fun",
  description:
    "About scubaSeason.fun, our editorial principles, and how affiliate links work on this site.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader activeHref="/about" />

      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0089de]">
          About
        </p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
          What this site is
        </h1>
        <div className="mt-6 space-y-5 text-base leading-7 text-slate-700">
          <p>
            This site was born out of love for the ocean, and honestly a fair
            amount of frustration too. Dive site information online is
            scattered all over the place, bits in old forum threads, bits in
            operator brochures, bits buried in trip reports from a decade ago,
            and a lot of it is either out of date or just plain wrong. When
            you&rsquo;re trying to plan a trip around what you actually want
            to see underwater, that is a really hard place to start from.
          </p>
          <p>
            I&rsquo;ve been bamboozled one too many times. I&rsquo;ve booked
            trips chasing species that hadn&rsquo;t been spotted in years, I
            have shown up in the wrong season for the thing I came for, and
            I have paid good money for dives that weren&rsquo;t close to what
            was advertised on the website. Every time it happens it&rsquo;s a
            small heartbreak, and after enough of them I started to think
            other divers probably feel the same way, and that maybe this
            doesn&rsquo;t have to keep happening.
          </p>
          <p>
            So this is a public search and citizen science site. The goal is
            pretty simple, keep dive site information as fresh and honest as
            possible, in one place, so the next person planning a trip
            doesn&rsquo;t end up bamboozled the way I did.
          </p>
          <p>
            It is very much ongoing work, and right now it is being built by
            one person, me, with a lot of help from Squish, my OpenClaw, and
            a handful of other AI tools picking up the slack wherever they
            can.
          </p>
        </div>

        <h2 className="mt-12 text-2xl font-bold tracking-tight text-slate-900">
          Roadmap — where this is going
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-700">
          The bigger arc is to make scubaSeason a public atlas of reef
          condition that&rsquo;s also genuinely useful for booking a trip.
          Honest about
          what&rsquo;s live, what&rsquo;s a snapshot, and what we can&rsquo;t
          see yet. The split below is the current plan — nothing in
          &ldquo;later&rdquo; is a promise.
        </p>

        <div className="mt-6 grid gap-5">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
              Now
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[14px] leading-6 text-slate-800">
              <li>
                Live NOAA Coral Reef Watch thermal stress on every reef,
                refreshed nightly.
              </li>
              <li>
                Honest labels everywhere distinguishing live data from
                snapshot surveys vs. presence only sightings (
                <Link href="/data" className="text-[#0089de] hover:underline">
                  /data
                </Link>
                ).
              </li>
              <li>
                Trip planning the site already does — operators, lodging,
                gear, season windows — stays front and centre.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-800">
              Next
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[14px] leading-6 text-slate-800">
              <li>
                Real coral cover ingestion for US and Caribbean sites
                (NOAA NCRMP + AGRRA) so the snapshot half stops being
                scaffolding.
              </li>
              <li>
                Global Fishing Watch pressure layer per site.
              </li>
              <li>
                IUCN Red List species badges — pending non commercial
                licensing.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-700">
              Later
            </p>
            <p className="mt-3 text-[14px] leading-6 text-slate-800">
              The longer term vision — exploratory, not committed — has two
              halves:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[14px] leading-6 text-slate-800">
              <li>
                <strong>Targeted citizen missions</strong> in the regions
                where dive tourism is dense but reef monitoring is thin.
                The idea is to coordinate divers around specific reefs
                where standardised imagery would actually be useful, and
                fold the contributions back into the public atlas.
              </li>
              <li>
                <strong>Post event evidence infrastructure</strong> that
                gives conservation funders a clean, standardised picture
                of a reef after a hurricane or bleaching event. The
                interesting role here is plumbing — coordination, capture
                protocols, attribution — sitting alongside the satellite
                signals everyone already uses.
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 text-base leading-7 text-slate-700">
          Quick note, there are some affiliate links scattered across the
          site, and anything they earn goes straight back into R&amp;D for
          this thing. Would absolutely love to hear feedback, good, bad,
          weird, half formed, all of it, at{" "}
          <a
            href="mailto:hi@scubaseason.fun"
            className="font-semibold text-[#0089de] hover:underline"
          >
            hi@scubaseason.fun
          </a>
          .
        </p>

        <h2 className="mt-12 text-lg font-bold tracking-tight text-slate-900">
          Editorial independence
        </h2>
        <p className="mt-3 text-base leading-7 text-slate-700">
          Affiliate commissions do not influence what we recommend. Site
          rankings come from editorial scoring, not commission rates. Operator
          and lodging blocks include non-affiliate options where we know of
          them. The source/methodology drawer on every claim is the same
          whether a partner pays us or not. If you ever see something that
          looks like a sponsored recommendation disguised as editorial, that&rsquo;s
          a bug — please tell us.
        </p>
      </main>
    </div>
  );
}
