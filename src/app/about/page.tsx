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
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#0089de] text-white">
              <span className="text-lg">🌊</span>
            </span>
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
            scubaSeason.fun is a research tool for divers. We map signature dive
            sites against the conditions and species that actually matter — water
            temperature, visibility, current, what's there and when — so you can
            choose where to dive based on what you want to see, not just where's
            cheapest this month.
          </p>
          <p>
            We&rsquo;re built for the full range: from divers planning their first
            open-water trip to advanced divers chasing specific species. Tell us
            your cert and last-dive recency, and the site adapts.
          </p>
        </div>

        <h2 className="mt-12 text-2xl font-bold tracking-tight text-slate-900">
          Editorial principles
        </h2>
        <ul className="mt-4 space-y-3 text-slate-700">
          <li className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <strong className="font-semibold text-slate-900">
              Editorial ranking is independent of affiliate revenue.
            </strong>{" "}
            We pick the dive sites and operators we&rsquo;d recommend regardless
            of whether the link earns a commission. If we&rsquo;d send a friend
            there, it&rsquo;s in.
          </li>
          <li className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <strong className="font-semibold text-slate-900">
              We mark non-affiliate links as &ldquo;Link&rdquo; and partner links as
              &ldquo;Partner&rdquo;.
            </strong>{" "}
            If the best operator for a site isn&rsquo;t on any affiliate program,
            we link to them anyway — directly, with no tracking.
          </li>
          <li className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <strong className="font-semibold text-slate-900">
              Gear recommendations are site-specific.
            </strong>{" "}
            A reef hook on a calm cleaning station is a waste of money. A 5mm
            wetsuit on a Komodo upwelling dive isn&rsquo;t optional. We try to
            match the gear to the actual dive.
          </li>
        </ul>

        <h2 id="affiliate-disclosure" className="mt-12 text-2xl font-bold tracking-tight text-slate-900">
          Affiliate disclosure
        </h2>
        <div className="mt-4 space-y-4 text-slate-700">
          <p>
            scubaSeason.fun participates in several affiliate programs. When you
            click a partner link on this site and complete a booking or purchase,
            we may earn a commission at no extra cost to you. This helps fund
            the site&rsquo;s ongoing research and data curation.
          </p>
          <p>The programs we participate in include:</p>
          <ul className="ml-5 list-disc space-y-1.5 text-slate-700">
            <li>Amazon Associates (gear)</li>
            <li>Booking.com Partner Hub (lodging)</li>
            <li>PADI Travel Affiliate Program (operators, resorts, liveaboards)</li>
            <li>Travelpayouts (flights via Skyscanner)</li>
            <li>Liveaboard.com / LiveaboardBookings.com</li>
            <li>DiveBooker</li>
            <li>SCUBAPRO Affiliate Program</li>
          </ul>
          <p>
            Affiliate participation does not influence our editorial picks. If
            you&rsquo;d like to support the site, using our partner links is the
            most direct way. Thank you.
          </p>
        </div>

        <h2 className="mt-12 text-2xl font-bold tracking-tight text-slate-900">
          Contact
        </h2>
        <p className="mt-4 text-slate-700">
          Found an error? Want to suggest a dive site, operator, or correction?
          Email{" "}
          <a
            href="mailto:hi@scubaseason.fun"
            className="font-semibold text-[#0089de] hover:underline"
          >
            hi@scubaseason.fun
          </a>
          . For affiliate or partnership inquiries:{" "}
          <a
            href="mailto:affiliate@scubaseason.fun"
            className="font-semibold text-[#0089de] hover:underline"
          >
            affiliate@scubaseason.fun
          </a>
          .
        </p>
      </main>
    </div>
  );
}
