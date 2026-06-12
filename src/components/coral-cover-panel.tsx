import type { CoralCoverSnapshot } from "@/lib/data/types";
import { DataFreshnessLabel } from "@/components/data-freshness-label";

function trendDirection(
  current: number,
  historical: number | undefined,
): { delta: number; arrow: string; tone: string } | null {
  if (historical === undefined) return null;
  const delta = Math.round((current - historical) * 10) / 10;
  const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "→";
  const tone =
    delta > 1
      ? "text-emerald-300"
      : delta < -1
        ? "text-rose-400"
        : "text-[#8b9db8]";
  return { delta, arrow, tone };
}

export function CoralCoverPanel({
  snapshot,
}: {
  snapshot: CoralCoverSnapshot;
}) {
  const trend = trendDirection(
    snapshot.current.coverPercent,
    snapshot.historical?.coverPercent,
  );
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0a1628] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b9db8]">
            Benthic snapshot — {snapshot.program}
          </p>
          <h3 className="mt-1 text-base font-bold text-[#f0f4f8]">
            {snapshot.label}
          </h3>
        </div>
        <DataFreshnessLabel
          variant="snapshot"
          surveyMethod={`${snapshot.program} jurisdiction mean`}
          surveyDate={`${snapshot.current.year}-01-01`}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8b9db8]">
            Current mean coral cover
          </p>
          <p className="mt-1">
            <span className="text-3xl font-bold text-[#f0f4f8]">
              {snapshot.current.coverPercent}%
            </span>
            <span className="ml-2 text-sm text-[#8b9db8]">
              in {snapshot.current.year}
            </span>
          </p>
          {/* Visual bar */}
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(snapshot.current.coverPercent, 100)}%`,
                background: trend
                  ? trend.delta >= 0 ? "#10b981" : "#f43f5e"
                  : "#00d4ff",
              }}
            />
          </div>
        </div>
        {snapshot.historical ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8b9db8]">
              Earlier survey
            </p>
            <p className="mt-1">
              <span className="text-2xl font-semibold text-[#aebcd0]">
                {snapshot.historical.coverPercent}%
              </span>
              <span className="ml-2 text-sm text-[#8b9db8]">
                in {snapshot.historical.year}
              </span>
            </p>
            {/* Visual bar */}
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white/30"
                style={{ width: `${Math.min(snapshot.historical.coverPercent, 100)}%` }}
              />
            </div>
            {trend ? (
              <p className={`mt-1.5 text-[12px] font-semibold ${trend.tone}`}>
                {trend.arrow} {trend.delta >= 0 ? "+" : ""}
                {trend.delta} pts vs earlier survey
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-[13px] leading-6 text-[#aebcd0]">
        {snapshot.method}.
        {snapshot.notes ? <> {snapshot.notes}</> : null}
      </p>

      <p className="mt-3 text-[11.5px] leading-5 text-[#8b9db8]">
        Reported at the <strong>jurisdiction</strong> scale, not the dive
        site — the published surveys don&rsquo;t resolve a single reef.{" "}
        <a
          href={snapshot.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00d4ff] hover:underline"
        >
          {snapshot.sourceLabel} →
        </a>
      </p>
    </section>
  );
}
