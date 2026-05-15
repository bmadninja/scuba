"use client";

import { useState } from "react";
import { AffiliateLink } from "@/components/affiliate-link";
import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import type { Gear, GearCategory, SkillLevel } from "@/lib/data/types";

const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: "never-dived", label: "Never Dived" },
  { value: "open-water", label: "Open Water" },
  { value: "advanced", label: "Advanced" },
  { value: "rescue", label: "Rescue" },
  { value: "divemaster", label: "Divemaster" },
  { value: "tech", label: "Technical" },
];

const CATEGORY_LABEL: Record<GearCategory, string> = {
  mask: "Mask",
  snorkel: "Snorkel",
  fins: "Fins",
  boots: "Boots",
  wetsuit: "Wetsuit",
  drysuit: "Drysuit",
  bcd: "BCD",
  regulator: "Regulator",
  computer: "Dive Computer",
  light: "Dive Light",
  "reel-smb": "SMB & Reel",
  "reef-hook": "Reef Hook",
  gloves: "Gloves",
  hood: "Hood",
  bag: "Dive Bag",
  specialty: "Specialty",
};

const PARTNER_LABEL: Record<string, string> = {
  amazon: "Amazon",
  dgx: "Dive Gear Express",
  "divers-direct": "Divers Direct",
  "leisure-pro": "LeisurePro",
  "scuba-com": "Scuba.com",
};

type Props = { gear: Gear[] };

export function GearExplorer({ gear }: Props) {
  const [level, setLevel] = useState<SkillLevel>("open-water");

  const filtered = gear.filter((g) => g.levels.includes(level));

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {SKILL_LEVELS.map((sl) => (
          <button
            key={sl.value}
            onClick={() => setLevel(sl.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              level === sl.value
                ? "bg-[#0089de] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {sl.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const partner = item.partners[0];
          return (
            <div
              key={item.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#0089de]/40 hover:shadow-md"
            >
              <span className="mb-3 self-start rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#1d5d90]">
                {CATEGORY_LABEL[item.category]}
              </span>
              <h3 className="text-base font-bold text-slate-900">{item.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">
                  ${item.priceRangeUsd.min}–${item.priceRangeUsd.max}
                </span>
                {partner && (
                  <AffiliateLink
                    url={partner.url}
                    event="gear_click"
                    partner={partner.partner}
                    productId={partner.productId !== "TBD" ? partner.productId : undefined}
                    siteId="gear-page"
                    isAffiliate={true}
                    className="rounded-lg bg-[#0089de] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#1d5d90]"
                  >
                    Buy at {PARTNER_LABEL[partner.partner] ?? partner.partner} →
                  </AffiliateLink>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-slate-500">No gear listed for this level yet.</p>
      )}

      <div className="mt-10 border-t border-slate-200 pt-6">
        <AffiliateDisclosure />
      </div>
    </div>
  );
}
