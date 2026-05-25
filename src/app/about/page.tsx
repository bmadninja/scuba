import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About + affiliate disclosure | scubaSeason.fun",
  description:
    "About scubaSeason.fun, our editorial principles, and how affiliate links work on this site.",
};

export default function AboutPage() {
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
            <Link href="/about" className="text-[#0089de]">
              About
            </Link>
            <Link href="/faq" className="hover:text-[#0089de]">
              FAQ
            </Link>
          </nav>
        </div>
      </header>

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
          where this is going
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-700">
          Longer term, I want this site to be useful beyond just trip
          planning. The hope is that the information and observations
          collected here can support research, conservation, and the wider
          climate work happening around our oceans. There&rsquo;s a lot of
          ground to cover, and I&rsquo;ll be continuously rolling out
          features and updates as things take shape.
        </p>

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
