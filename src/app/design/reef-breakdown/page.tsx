import type { Metadata } from "next";
import { ReefBreakdownCard } from "@/components/reef-report/reef-breakdown-card";
import {
  TOKENS as T,
  VERDICT,
  toneColor,
  type ReefBreakdown,
  type VerdictLabel,
} from "@/components/reef-report/reef-breakdown-config";

// Design-reference preview for the reef-state evidence-breakdown card. Not part
// of the public site — it renders the four handoff test scenarios so the card
// can be reviewed in the running app. The sample series/bands below are the
// handoff's illustrative fixtures, NOT real reef measurements; real per-reef
// data is wired server-side on the location page.
export const metadata: Metadata = {
  title: "Reef breakdown — design preview",
  robots: { index: false, follow: false },
};

type Scenario = {
  id: string;
  place: string;
  region: string;
  data: ReefBreakdown;
};

const SCENARIOS: Scenario[] = [
  {
    id: "channel",
    place: "Channel Islands",
    region: "California",
    data: {
      verdict: "Stable",
      overrideNote:
        "We set this rating from a published long-term study — not just the signals below.",
      signals: {
        coral: { band: "good", detail: "much the same as before", trend: "holding", series: [49, 52, 51, 54, 55, 54, 55, 55] },
        thermal: { band: "good", detail: "no hot spells this year", trend: null, series: [1, 0, 2, 1, 0, 1, 0, 0] },
        fish: { band: "bad", detail: "fewer than a healthy reef", trend: null, series: [31, 29, 27, 25, 23, 21, 20, 19] },
        fishing: { band: "bad", detail: "boats fishing hard", trend: "rising", series: [42, 47, 51, 58, 63, 70, 74, 78] },
      },
    },
  },
  {
    id: "raja",
    place: "Raja Ampat",
    region: "Indonesia",
    data: {
      verdict: "Thriving",
      overrideNote: null,
      signals: {
        coral: { band: "good", detail: "growing steadily", trend: "rising", series: [31, 34, 37, 41, 44, 46, 47, 48] },
        thermal: { band: "good", detail: "one short warm spell, no harm", trend: null, series: [0, 1, 3, 4, 2, 1, 1, 0] },
        fish: { band: "none", detail: null, trend: null, series: null },
        fishing: { band: "good", detail: "inside an enforced reserve", trend: null, series: [6, 4, 5, 4, 3, 4, 3, 4] },
      },
    },
  },
  {
    id: "chagos",
    place: "Chagos atoll",
    region: "Indian Ocean",
    data: {
      verdict: "Stable",
      overrideNote: null,
      signals: {
        coral: { band: "mid", detail: "one older survey, needs a revisit", trend: null, series: [15, 13, 12] },
        thermal: { band: "none", detail: null, trend: null, series: null },
        fish: { band: "none", detail: null, trend: null, series: null },
        fishing: { band: "none", detail: null, trend: null, series: null },
      },
    },
  },
  {
    id: "cabo",
    place: "Cabo Pulmo",
    region: "Mexico",
    data: {
      verdict: "Improving",
      overrideNote: null,
      signals: {
        coral: { band: "good", detail: "climbing back", trend: "rising", series: [19, 27, 34, 40, 45, 48, 50, 52] },
        thermal: { band: "good", detail: "stayed cool this season", trend: null, series: [1, 0, 1, 2, 1, 1, 0, 1] },
        fish: { band: "good", detail: "rebuilt to a full reef", trend: "rising", series: [22, 34, 48, 63, 78, 92, 104, 118] },
        fishing: { band: "good", detail: "no-take reserve since 1995", trend: null, series: [9, 6, 5, 4, 4, 3, 3, 3] },
      },
    },
  },
];

// Minimal rating context above each card — recreates the reef's overall verdict
// so the breakdown reads in situ. On a real location page this is the existing
// "Reef state" heading; here it is preview-only scaffolding.
function VerdictHeader({ place, region, verdict }: { place: string; region: string; verdict: VerdictLabel }) {
  const v = VERDICT[verdict];
  const c = toneColor(v.tone);
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontFamily: T.mono,
          fontSize: 10.5,
          textTransform: "uppercase",
          letterSpacing: ".14em",
          color: T.mute,
        }}
      >
        {place} · {region}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0 0", flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            padding: "8px 14px",
            borderRadius: 2,
            color: `color-mix(in oklch, ${c} 74%, ${T.ink})`,
            background: `color-mix(in oklch, ${c} 13%, ${T.paper})`,
            border: `1px solid color-mix(in oklch, ${c} 50%, ${T.hairline})`,
          }}
        >
          {verdict}
        </span>
        <span style={{ fontFamily: T.serif, fontSize: 16, color: T.ink2, fontStyle: "italic" }}>
          {v.note}
        </span>
      </div>
    </div>
  );
}

export default function ReefBreakdownPreviewPage() {
  return (
    <main style={{ background: T.paper, color: T.ink, minHeight: "100vh", padding: "48px 24px 96px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <p
          style={{
            fontFamily: T.mono,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: ".14em",
            color: T.mute,
            margin: 0,
          }}
        >
          Design preview · not indexed
        </p>
        <h1 style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 400, letterSpacing: "-0.02em", margin: "8px 0 6px" }}>
          Reef evidence breakdown
        </h1>
        <p style={{ fontFamily: T.sans, fontSize: 15, color: T.ink2, lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
          The four signals behind a reef&apos;s rating. Each row expands to a fixed-domain
          reference chart with a shaded healthy zone. Sample data below is illustrative,
          not real measurements.
        </p>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 56, marginTop: 40 }}>
        {SCENARIOS.map((s) => (
          <section key={s.id}>
            <VerdictHeader place={s.place} region={s.region} verdict={s.data.verdict} />
            <ReefBreakdownCard data={s.data} />
          </section>
        ))}
      </div>
    </main>
  );
}
