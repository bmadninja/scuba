import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { locationSchema } from "@/lib/schema-org";
import { getAllLocations, getLocationBySlug } from "@/lib/data/locations";
import { getSitesByLocationId } from "@/lib/data/sites";
import { getLocationDetailsById } from "@/lib/data/location-details";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function generateStaticParams() {
  return getAllLocations().map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const location = getLocationBySlug(slug);
  if (!location) return { title: "Location not found" };
  const title = `${location.name}, ${location.country}`;
  const description = location.description.slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `/locations/${location.slug}` },
    openGraph: {
      title,
      description,
      url: `/locations/${location.slug}`,
      type: "article",
      images: location.heroImageUrl ? [{ url: location.heroImageUrl }] : undefined,
    },
  };
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const location = getLocationBySlug(slug);
  if (!location) notFound();

  const sites = getSitesByLocationId(location.id);
  const details = getLocationDetailsById(location.id);
  const bestMonthsSet = new Set(location.bestMonths);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <JsonLd data={locationSchema(location, sites.length)} />
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
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0089de]">
          {location.country} · {location.region}
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
          {location.name}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
          {location.description}
        </p>

        {details ? (
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
            {details.extendedDescription}
          </p>
        ) : null}

        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Good season
          </h2>
          <div className="mt-3 grid max-w-3xl grid-cols-12 gap-1">
            {MONTH_NAMES.map((m, i) => {
              const monthNum = i + 1;
              const on = bestMonthsSet.has(monthNum);
              return (
                <div
                  key={m}
                  className={`flex flex-col items-center rounded-md px-1 py-2 text-[11px] font-semibold ${
                    on
                      ? "bg-[#0089de] text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                  title={on ? "In season" : "Off season"}
                >
                  {m}
                </div>
              );
            })}
          </div>
          {details?.seasonNotes ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {details.seasonNotes}
            </p>
          ) : null}
        </section>

        {details ? (
          <section className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                Trip duration
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {details.tripDuration}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                Dive style
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {details.diveStyle}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                Dive level
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {details.diveLevel}
              </p>
            </div>
          </section>
        ) : null}

        {details && details.quotes.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              What divers say
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {details.quotes.map((q, i) => (
                <figure
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <blockquote className="text-base italic leading-7 text-slate-800">
                    &ldquo;{q.text}&rdquo;
                  </blockquote>
                  {q.attribution ? (
                    <figcaption className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      — {q.attribution}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        {details && details.goodToKnow.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Good to know
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {details.goodToKnow.map((g, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <p className="text-sm font-bold text-slate-900">{g.title}</p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    {g.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-12">
          <div className="mb-6 flex items-end justify-between border-b border-slate-200 pb-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Dive sites here
            </h2>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {sites.length} curated
            </span>
          </div>

          {sites.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <p className="text-sm font-semibold text-slate-700">
                Dive sites for this location are still being curated.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                We&rsquo;re working through our top destinations first. Check back soon,
                or browse{" "}
                <Link href="/" className="font-semibold text-[#0089de] hover:underline">
                  the globe
                </Link>{" "}
                for areas with sites already mapped.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sites.map((s) => (
                <Link
                  key={s.id}
                  href={`/sites/${s.slug}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-[#0089de]/40 hover:shadow-md"
                >
                  {s.heroImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.heroImageUrl}
                      alt={s.name}
                      className="h-44 w-full object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : null}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0089de]">
                      {s.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-3">
                      {s.description.slice(0, 140)}…
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        {s.depthRange.min}–{s.depthRange.max} m
                      </span>
                      <span className="inline-block rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[11px] font-semibold capitalize text-[#1d5d90]">
                        {s.skillLevel.replace("-", " ")}+
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
