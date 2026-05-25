"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FlightHub, LodgingTier, SkillLevel } from "@/lib/data/types";

type LocOption = { slug: string; name: string; country: string };

const HUB_OPTIONS: { value: FlightHub; label: string }[] = [
  { value: "us-west", label: "US West Coast" },
  { value: "us-east", label: "US East Coast" },
  { value: "europe", label: "Europe" },
  { value: "asia", label: "Asia" },
  { value: "oceania", label: "Australia / NZ" },
];

const TIER_OPTIONS: { value: LodgingTier; label: string }[] = [
  { value: "budget", label: "Budget" },
  { value: "mid", label: "Mid-range" },
  { value: "upscale", label: "Upscale" },
  { value: "luxury", label: "Luxury" },
  { value: "liveaboard", label: "Liveaboard" },
];

const CERT_OPTIONS: { value: SkillLevel | ""; label: string }[] = [
  { value: "", label: "Any cert" },
  { value: "never-dived", label: "Never dived" },
  { value: "open-water", label: "Open Water" },
  { value: "advanced", label: "Advanced" },
  { value: "rescue", label: "Rescue" },
  { value: "divemaster", label: "Divemaster+" },
  { value: "tech", label: "Tech" },
];

export function PlanForm({ allLocations }: { allLocations: LocOption[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const get = (k: string, fallback = "") => params.get(k) ?? fallback;

  const setParam = useCallback(
    (k: string, v: string) => {
      const next = new URLSearchParams(params.toString());
      if (v === "") next.delete(k);
      else next.set(k, v);
      router.replace(`/plan?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Destination">
          <select
            value={get("location")}
            onChange={(e) => setParam("location", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0089de]"
          >
            <option value="">— Pick a location —</option>
            {allLocations.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.name}, {l.country}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Days">
          <input
            type="number"
            min={3}
            max={21}
            value={Number(get("days") || 7)}
            onChange={(e) => setParam("days", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0089de]"
          />
        </Field>
        <Field label="Flying from">
          <select
            value={get("hub", "us-east")}
            onChange={(e) => setParam("hub", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0089de]"
          >
            {HUB_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Comfort tier">
          <select
            value={get("tier", "mid")}
            onChange={(e) => setParam("tier", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0089de]"
          >
            {TIER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Your cert">
          <select
            value={get("cert")}
            onChange={(e) => setParam("cert", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0089de]"
          >
            {CERT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}
