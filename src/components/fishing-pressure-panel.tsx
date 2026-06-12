import type { FishingPressureRecord } from "@/lib/data/types";

function pctChange(current: number, historical: number): number {
  if (historical === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - historical) / historical) * 100);
}

export function FishingPressurePanel({
  record,
}: {
  record: FishingPressureRecord;
}) {
  const trend = record.historical
    ? pctChange(
        record.current.fishingHours,
        record.historical.fishingHours,
      )
    : null;
  const trendTone =
    trend === null
      ? "text-[#8b9db8]"
      : trend > 10
        ? "text-rose-400"
        : trend < -10
          ? "text-emerald-300"
          : "text-[#8b9db8]";
  const trendArrow =
    trend === null ? "" : trend > 0 ? "↑" : trend < 0 ? "↓" : "→";

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0a1628] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b9db8]">
            Fishing pressure — Global Fishing Watch
          </p>
          <h3 className="mt-1 text-base font-bold text-[#f0f4f8]">
            Visible fishing within {record.radiusKm} km
          </h3>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8b9db8]">
            Apparent fishing hours
          </p>
          <p className="mt-1">
            <span className="text-3xl font-bold text-[#f0f4f8]">
              {record.current.fishingHours.toLocaleString()}
            </span>
            <span className="ml-2 text-sm text-[#8b9db8]">
              in {record.current.year}
            </span>
          </p>
        </div>
        {record.historical ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8b9db8]">
              Trend vs {record.historical.year}
            </p>
            <p className="mt-1">
              <span className="text-2xl font-semibold text-[#aebcd0]">
                {record.historical.fishingHours.toLocaleString()} h
              </span>
            </p>
            {trend !== null ? (
              <p className={`mt-1 text-xs font-semibold ${trendTone}`}>
                {trendArrow} {trend > 0 ? "+" : ""}
                {trend}%
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs leading-5 text-amber-300">
        <strong>Important caveat.</strong> GFW sees vessels that broadcast{" "}
        <a
          href="https://en.wikipedia.org/wiki/Automatic_identification_system"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-amber-300/40 hover:decoration-amber-300"
        >
          AIS
        </a>
        . Small artisanal boats, most under-12-metre vessels, and any
        operator deliberately running dark are invisible here. A low
        number is <em>not</em> evidence of low fishing pressure in
        artisanal-dominated regions.
      </p>

      <p className="mt-3 text-xs leading-5 text-[#8b9db8]">
        <a
          href="https://globalfishingwatch.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00d4ff] hover:underline"
        >
          Global Fishing Watch →
        </a>{" "}
        · Apparent fishing-effort data, AIS-derived.
      </p>
    </section>
  );
}
