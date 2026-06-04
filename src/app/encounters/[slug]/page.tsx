import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { encounterSchema } from "@/lib/schema-org";
import {
  getAllEncounters,
  getEncounterBySlug,
} from "@/lib/data/encounters";
import { getOperatorsByEncounter } from "@/lib/data/operators";
import { getLocationById } from "@/lib/data/locations";
import { getSourceById } from "@/lib/data/sources";
import { getMethodologyByClaimId } from "@/lib/data/methodologies";
import {
  AFFILIATE_DISCLOSURE,
  bookingCtaLabel,
  bookingUrlForOperator,
  hasAffiliateBookings,
} from "@/lib/affiliate";
import type { EncounterRegion, Operator } from "@/lib/data/types";

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

const STATUS_BADGE: Record<
  EncounterRegion["status"],
  { label: string; className: string }
> = {
  primary: {
    label: "Best current option",
    className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  },
  secondary: {
    label: "Still happens",
    className: "bg-slate-100 text-slate-700 ring-slate-200",
  },
  emerging: {
    label: "Emerging",
    className: "bg-sky-50 text-sky-800 ring-sky-200",
  },
  closed: {
    label: "Closed to tourism",
    className: "bg-rose-50 text-rose-800 ring-rose-200",
  },
};

function formatMonths(months: number[]): string {
  if (months.length === 0) return "—";
  if (months.length === 12) return "Year-round";
  return months.map((m) => MONTH_ABBR[m - 1]).join(" · ");
}

function formatPrice(range?: [number, number]): string | null {
  if (!range) return null;
  const [lo, hi] = range;
  if (lo === 0 && hi === 0) return "Donation / non-commercial";
  if (lo === hi) return `~$${lo}`;
  return `$${lo}–$${hi}`;
}

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

  const operators = getOperatorsByEncounter(e.id);
  const operatorsByRegion = new Map<string, Operator[]>();
  for (const op of operators) {
    const arr = operatorsByRegion.get(op.regionName) ?? [];
    arr.push(op);
    operatorsByRegion.set(op.regionName, arr);
  }

  const sources = e.sourceIds
    .map(getSourceById)
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const methods = e.methodologyClaimIds
    .map(getMethodologyByClaimId)
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  const primaryRegion =
    e.regions.find((r) => r.status === "primary") ?? e.regions[0];
  const tldrPrice = (() => {
    const prices = operators
      .map((o) => o.priceRangeUSD)
      .filter(
        (p): p is [number, number] =>
          Boolean(p) && !(p![0] === 0 && p![1] === 0),
      );
    if (prices.length === 0) return null;
    const lo = Math.min(...prices.map((p) => p[0]));
    const hi = Math.max(...prices.map((p) => p[1]));
    return `~$${lo}–$${hi}/day`;
  })();

  return (
    <>
      <JsonLd data={encounterSchema(e)} />

      {e.heroImageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={e.heroImageUrl}
          alt={e.name}
          className="h-72 w-full object-cover sm:h-96"
        />
      ) : null}

      <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href="/encounters"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 hover:text-[#0089de]"
        >
          ← Encounters
        </Link>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {e.category.replace(/-/g, " ")}
        </p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
          {e.name}
        </h1>
        {e.speciesCommon ? (
          <p className="mt-1 text-base text-slate-600">
            {e.speciesCommon}
            {e.speciesScientific ? (
              <span className="italic text-slate-500">
                {" "}
                · {e.speciesScientific}
              </span>
            ) : null}
          </p>
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

        {primaryRegion ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-800">
            <span className="font-semibold">TL;DR — </span>
            Best in{" "}
            <span className="font-semibold">
              {primaryRegion.name}, {primaryRegion.country}
            </span>
            {" · "}
            {formatMonths(primaryRegion.bestMonthsAtRegion)}
            {tldrPrice ? <> · {tldrPrice}</> : null}.
          </div>
        ) : null}

        <p className="mt-6 text-base leading-7 text-slate-700">
          {e.shortDescription}
        </p>

        <Section title="When">
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

        <Section title="Where">
          <ul className="grid gap-3 sm:grid-cols-2">
            {e.regions.map((r) => {
              const atlas = r.inAtlasLocationId
                ? getLocationById(r.inAtlasLocationId)
                : null;
              const nearby = (r.nearbyAtlasLocationIds ?? [])
                .map((id) => getLocationById(id))
                .filter((x): x is NonNullable<typeof x> => Boolean(x));
              const badge = STATUS_BADGE[r.status];
              return (
                <li
                  key={`${r.name}-${r.country}`}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{r.name}</p>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">
                        {r.country}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-2 text-[12px] uppercase tracking-wider text-slate-500">
                    {formatMonths(r.bestMonthsAtRegion)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {r.whyHere}
                  </p>
                  {r.statusNote ? (
                    <p className="mt-2 rounded-md bg-amber-50 px-2.5 py-1.5 text-[12px] leading-5 text-amber-900 ring-1 ring-inset ring-amber-200">
                      {r.statusNote}
                    </p>
                  ) : null}
                  {atlas ? (
                    <Link
                      href={`/locations/${atlas.slug}`}
                      className="mt-3 inline-block text-[12px] font-semibold text-[#0089de] hover:underline"
                    >
                      Open {atlas.name} in atlas →
                    </Link>
                  ) : null}
                  {!atlas && nearby.length > 0 ? (
                    <p className="mt-3 text-[12px] text-slate-600">
                      Pair with:{" "}
                      {nearby.map((l, i) => (
                        <span key={l.id}>
                          {i > 0 ? ", " : ""}
                          <Link
                            href={`/locations/${l.slug}`}
                            className="font-semibold text-[#0089de] hover:underline"
                          >
                            {l.name}
                          </Link>
                        </span>
                      ))}
                    </p>
                  ) : null}
                  {!atlas && nearby.length === 0 ? (
                    <p className="mt-3 text-[11px] italic text-slate-500">
                      Not in our dive-site atlas yet.
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title="Ethics">
          <p className="text-sm leading-6 text-slate-700">{e.ethicsNotes}</p>
        </Section>

        {operators.length > 0 ? (
          <Section title="Operators">
            <p className="mb-3 text-[12px] leading-5 text-slate-500">
              We don&rsquo;t accept payment for listings. Operators are
              included when they appear in regulator permit lists or have an
              established track record at the site &mdash; we mark each one as{" "}
              <span className="font-semibold text-slate-700">verified</span>{" "}
              only when we&rsquo;ve cross-checked the permit ourselves.
            </p>
            <ul className="space-y-4">
              {e.regions.map((r) => {
                const ops = operatorsByRegion.get(r.name);
                if (!ops || ops.length === 0) return null;
                return (
                  <li key={`ops-${r.name}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {r.name}, {r.country}
                    </p>
                    <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                      {ops.map((op) => (
                        <li
                          key={op.id}
                          className="rounded-xl border border-slate-200 bg-white p-4"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-slate-900">
                              {op.name}
                            </p>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${
                                op.permitStatus === "verified"
                                  ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                                  : op.permitStatus === "listed-only"
                                    ? "bg-slate-100 text-slate-700 ring-slate-200"
                                    : "bg-amber-50 text-amber-800 ring-amber-200"
                              }`}
                            >
                              {op.permitStatus === "listed-only"
                                ? "listed only"
                                : op.permitStatus}
                            </span>
                          </div>
                          <p className="mt-1 text-[12px] text-slate-600">
                            {[
                              formatPrice(op.priceRangeUSD),
                              op.durationDays
                                ? `${op.durationDays} day${op.durationDays === 1 ? "" : "s"}`
                                : null,
                              op.groupSizeMax
                                ? `max ${op.groupSizeMax}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          {op.notesShort ? (
                            <p className="mt-2 text-[12px] leading-5 text-slate-700">
                              {op.notesShort}
                            </p>
                          ) : null}
                          <a
                            href={bookingUrlForOperator(op, {
                              encounterSlug: e.slug,
                            })}
                            target="_blank"
                            rel="noreferrer noopener sponsored"
                            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0089de] hover:underline"
                          >
                            {bookingCtaLabel(op)} →
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
            {hasAffiliateBookings(operators) ? (
              <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-[11px] leading-5 text-slate-600 ring-1 ring-inset ring-slate-200">
                {AFFILIATE_DISCLOSURE}
              </p>
            ) : null}
          </Section>
        ) : (
          <Section title="Operators">
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              We don&rsquo;t have curated operator listings for this encounter
              yet. The &ldquo;Where&rdquo; section above is the right starting
              point &mdash; cross-reference local regulators&rsquo; permit
              lists before booking.
            </p>
          </Section>
        )}

        <Section title="Required experience">
          <p className="text-sm leading-6 text-slate-700">
            {e.requiredExperience}
          </p>
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
                          <span className="text-slate-500">
                            {" "}
                            — {src.publisher}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </Section>
        ) : null}
      </div>
      </div>
    </>
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
