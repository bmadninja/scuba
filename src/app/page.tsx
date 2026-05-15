import Link from "next/link";
import { PlanetGlobePanel } from "@/components/planet-globe-panel";
import { getScubaGlobeData } from "@/lib/scuba-globe";
import { getAllSites } from "@/lib/data/sites";
import { getLocationById } from "@/lib/data/locations";

export default function Home() {
  const initialMonth = new Date().getUTCMonth() + 1;
  const { markers, highlightedCountries } = getScubaGlobeData();

  // Featured: prefer in-season this month, sort by editorial rank, take top 3.
  const allSites = getAllSites();
  const inSeasonNow = allSites
    .filter((s) => s.bestMonths.includes(initialMonth))
    .sort((a, b) => b.editorialRank - a.editorialRank);
  const outOfSeason = allSites
    .filter((s) => !s.bestMonths.includes(initialMonth))
    .sort((a, b) => b.editorialRank - a.editorialRank);
  const featured = [...inSeasonNow, ...outOfSeason].slice(0, 3);

  const monthName = new Date(Date.UTC(2024, initialMonth - 1, 1)).toLocaleString(
    "en-US",
    { month: "long" },
  );

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
            <Link href="/gear" className="hover:text-[#0089de]">
              Gear
            </Link>
            <Link href="/about" className="hover:text-[#0089de]">
              About
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-[#f1f7fb] to-white">
        <div className="mx-auto w-full max-w-6xl px-6 pt-14 pb-8 text-center">
          <span className="inline-block rounded-full bg-[#e8f0fe] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#1d5d90]">
            Research-grade dive trip planning
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.1] tracking-tight text-slate-900">
            Find the right dive site for the right month.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Filter by species, season, conditions and skill — then plan the trip end-to-end
            with operators, lodging and gear we&rsquo;d actually recommend.
          </p>
        </div>

        <div className="mx-auto w-full max-w-6xl px-6 pb-14">
          <PlanetGlobePanel
            initialMonth={initialMonth}
            markers={markers}
            highlightedCountries={highlightedCountries}
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
              In season this month · {monthName}
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Where to dive right now
            </h2>
          </div>
          <Link
            href="/sites"
            className="hidden text-sm font-semibold text-[#0089de] hover:text-[#1d5d90] sm:inline-flex"
          >
            All sites →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((s) => {
            const location = getLocationById(s.locationId);
            const inSeason = s.bestMonths.includes(initialMonth);
            return (
              <Link
                key={s.id}
                href={`/sites/${s.slug}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-[#0089de]/40 hover:shadow-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.heroImageUrl ?? `https://picsum.photos/seed/${s.slug}/800/440`}
                  alt={s.name}
                  className="h-44 w-full object-cover transition group-hover:scale-[1.02]"
                />
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {location?.country}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        inSeason
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {inSeason ? "● In season" : "○ Off season"}
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-bold text-slate-900 group-hover:text-[#0089de]">
                    {s.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                    {s.description}
                  </p>
                  <div className="mt-3 inline-block rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-[11px] font-semibold capitalize text-[#1d5d90]">
                    {s.skillLevel.replace("-", " ")}+
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
