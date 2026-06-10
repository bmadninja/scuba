import Link from "next/link";
import {
  formatLastConfirmed,
  getHeadlineSightingForSite,
} from "@/lib/data/sightings";
import { HeroPhoto } from "@/components/hero-photo";
import { EvidenceDot } from "@/components/evidence-dot";
import type { Location, Site } from "@/lib/data/types";

export function SiteCard({
  site,
  location,
  inSeason,
}: {
  site: Site;
  location?: Location | null;
  inSeason: boolean;
}) {
  const sighting = getHeadlineSightingForSite(site.id);
  return (
    <Link
      href={`/sites/${site.slug}`}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0a1628] transition hover:border-[#00d4ff]/40 hover:shadow-md"
    >
      <HeroPhoto
        url={site.heroImageUrl}
        alt={site.name}
        seed={site.slug ?? site.name}
        className="h-44 w-full object-cover transition group-hover:scale-[1.02]"
      />
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8b9db8]">
            {location?.country ?? "—"}
          </p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              inSeason
                ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/20"
                : "bg-white/10 text-[#8b9db8]"
            }`}
          >
            {inSeason ? "● In season" : "○ Off season"}
          </span>
        </div>
        <h3 className="mt-1 text-lg font-bold text-[#f0f4f8] group-hover:text-[#00d4ff]">
          {site.name}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#aebcd0]">
          {site.description}
        </p>

        {/* Sighting evidence row — never blank */}
        {sighting ? (
          <p
            className="mt-2 flex items-center gap-1.5 text-[11px] leading-5 text-[#8b9db8]"
            title={`Confidence: ${sighting.confidence}. Based on ${sighting.recentRecordCount} confirmed records within ${sighting.proximityRadiusKm} km of this site.`}
          >
            {/* dot only — species name provides the label context */}
            <EvidenceDot
              confidence={sighting.confidence}
              showLabel={false}
            />
            <span className="truncate">
              <span className="font-semibold text-[#aebcd0]">
                {sighting.speciesCommon}
              </span>{" "}
              · last confirmed {formatLastConfirmed(sighting.lastConfirmedAt)}
            </span>
          </p>
        ) : (
          <EvidenceDot
            confidence={null}
            showTooltip
            className="mt-2 text-[11px] leading-5 text-[#8b9db8]"
          />
        )}

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-block rounded-full border border-white/10 px-2 py-0.5 text-[11px] font-semibold text-[#00d4ff]">
            {site.depthRange.min}–{site.depthRange.max} m
          </span>
          <span className="inline-block rounded-full border border-white/10 px-2 py-0.5 text-[11px] font-semibold capitalize text-[#00d4ff]">
            {site.skillLevel.replace("-", " ")}+
          </span>
          {site.diveTypes.slice(0, 1).map((t) => (
            <span
              key={t}
              className="inline-block rounded-full border border-white/10 px-2 py-0.5 text-[11px] font-semibold capitalize text-[#00d4ff]"
            >
              {t.replace("-", " ")}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
