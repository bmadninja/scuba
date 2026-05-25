import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllEncounters,
  getEncounterBySlug,
} from "@/lib/data/encounters";
import { getLocationById } from "@/lib/data/locations";
import { getSourceById } from "@/lib/data/sources";
import { getMethodologyByClaimId } from "@/lib/data/methodologies";

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DIFFICULTY_RING: Record<string, string> = {
  beginner: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  intermediate: "bg-amber-50 text-amber-800 ring-amber-200",
  advanced: "bg-orange-50 text-orange-800 ring-orange-200",
  expert: "bg-rose-50 text-rose-800 ring-rose-200",
};

const CONFIDENCE_RING: Record<string, string> = {
  high: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  medium: "bg-amber-50 text-amber-800 ring-amber-200",
  low: "bg-orange-50 text-orange-800 ring-orange-200",
};

export function generateStaticParams() {
  return getAllEncounters().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = getEncounterBySlug(slug);
  if (!e) return { title: "Encounter not found" };
  return {
    title: `${e.name} | scubaSeason.fun`,
    description: e.shortDescription,
  };
}

export default async function EncounterDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e = getEncounterBySlug(slug);
  if (!e) notFound();

  const locations = e.locations
    .map((l) => ({
      ref: l,
      location: getLocationById(l.locationId),
    }))
    .filter((x) => x.location);

  const sources = e.sourceIds
    .map(getSourceById)
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const methods = e.methodologyClaimIds
    .map(getMethodologyByClaimId)
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

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
            <Link href="/encounters" className="text-[#0089de]">
              Encounters
            </Link>
            <Link href="/about" className="hover:text-[#0089de]">
              About
            </Link>
          </nav>
        </div>
      </header>

      {e.heroImageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={e.heroImageUrl}
          alt={e.name}
          className="h-72 w-full object-cover sm:h-96"
        />
      ) : null}

      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <Link
          href="/encounters"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 hover:text-[#0089de]"
        >
          ← All encounters
        </Link>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {e.category.replace(/-/g, " ")}
        </p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
          {e.name}
        </h1>
        {e.speciesCommon ? (
          <p className="mt-1 text-base text-slate-600">{e.speciesCommon}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset ${DIFFICULTY_RING[e.difficulty]}`}
          >
            {e.difficulty}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset ${CONFIDENCE_RING[e.confidence]}`}
          >
            {e.confidence} confidence
          </span>
          {e.bucketListRank ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-700">
              Bucket-list rank #{e.bucketListRank}
            </span>
          ) : null}
        </div>

        <p className="mt-6 text-base leading-7 text-slate-700">
          {e.shortDescription}
        </p>

        <Section title="Season">
          <div className="flex flex-wrap gap-1.5">
            {e.bestMonths.length === 12 ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
                Year-round
              </span>
            ) : (
              MONTH_ABBR.map((m, i) => {
                const active = e.bestMonths.includes(i + 1);
                return (
                  <span
                    key={m}
                    className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                      active
                        ? "bg-[#0089de] text-white"
                        : "border border-slate-200 text-slate-400"
                    }`}
                  >
                    {m}
                  </span>
                );
              })
            )}
          </div>
        </Section>

        <Section title="Required experience">
          <p className="text-sm leading-6 text-slate-700">
            {e.requiredExperience}
          </p>
        </Section>

        {locations.length > 0 ? (
          <Section title="Where">
            <ul className="grid gap-3 sm:grid-cols-2">
              {locations.map(({ ref, location }) => (
                <li
                  key={ref.locationId}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <Link
                    href={`/locations/${location!.slug}`}
                    className="font-semibold text-slate-900 hover:text-[#0089de]"
                  >
                    {location!.name}
                  </Link>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">
                    {location!.country}
                  </p>
                  {ref.bestMonthsAtLocation &&
                  ref.bestMonthsAtLocation.length > 0 &&
                  ref.bestMonthsAtLocation.length < 12 ? (
                    <p className="mt-2 text-[12px] text-slate-600">
                      Best months here:{" "}
                      {ref.bestMonthsAtLocation
                        .map((m) => MONTH_ABBR[m - 1])
                        .join(", ")}
                    </p>
                  ) : null}
                  {ref.notes ? (
                    <p className="mt-2 text-[12px] leading-5 text-slate-600">
                      {ref.notes}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        <Section title="Ethics">
          <p className="text-sm leading-6 text-slate-700">{e.ethicsNotes}</p>
        </Section>

        <Section title="Conservation">
          <p className="text-sm leading-6 text-slate-700">
            {e.conservationNotes}
          </p>
        </Section>

        <Section title="Limitations">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            {e.limitations}
          </div>
        </Section>

        {(methods.length > 0 || sources.length > 0) ? (
          <Section title="Sources & methodology">
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {methods.map((m) => (
                <div key={m.claimId}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    How we summarise this
                  </p>
                  <p className="mt-1">{m.limitations}</p>
                </div>
              ))}
              {sources.length > 0 ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    Sources
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    {sources.map((src) => (
                      <li key={src.id}>
                        {src.url ? (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-[#0089de] hover:underline"
                          >
                            {src.name}
                          </a>
                        ) : (
                          src.name
                        )}
                        {src.publisher ? (
                          <span className="text-slate-500"> — {src.publisher}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </Section>
        ) : null}
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 border-t border-slate-200 pt-6">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
