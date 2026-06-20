"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterPill } from "@/components/filter-pill";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type FilterBarProps = {
  activeReefStates: string[];
  activeRegions: string[];
  activeMonths: number[];
  hasActiveFilter: boolean;
};

/**
 * FilterBar — Story 3.1
 *
 * Sticky below nav (top-16), white bg, hairline bottom border.
 * Horizontal-scroll overflow on mobile.
 * Reef state / region (broad buckets) / month pills.
 * "Clear all" ocean-blue link right-aligned when any filter active.
 * URL state via URLSearchParams + router.replace.
 */
export function FilterBar({
  activeReefStates,
  activeRegions,
  activeMonths,
  hasActiveFilter,
}: FilterBarProps) {
  const router = useRouter();
  const params = useSearchParams();

  const toggleParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      const current = (next.get(key) ?? "").split(",").filter(Boolean);
      const idx = current.indexOf(value);
      if (idx >= 0) current.splice(idx, 1);
      else current.push(value);
      if (current.length === 0) next.delete(key);
      else next.set(key, current.join(","));
      const qs = next.toString();
      router.replace(qs ? `/locations?${qs}` : "/locations", { scroll: false });
    },
    [params, router],
  );

  const clearAll = useCallback(() => {
    router.replace("/locations", { scroll: false });
  }, [router]);

  const REEF_STATES = [
    { value: "thriving", label: "Thriving" },
    { value: "pressure", label: "Under pressure" },
    { value: "change", label: "Witnessing change" },
  ];

  const REGION_BUCKETS = [
    { value: "Asia", label: "Asia" },
    { value: "Oceania", label: "Oceania" },
    { value: "Indian Ocean", label: "Indian Ocean" },
    { value: "Americas", label: "Americas" },
    { value: "Atlantic & Mediterranean", label: "Atlantic & Med" },
  ];

  return (
    <div
      className="sticky z-40 border-b border-[#E7E6E2] bg-white"
      style={{ top: 56 }}
    >
      <div
        className="flex items-center gap-2 overflow-x-auto px-4 py-3 scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* Reef state pills */}
        {REEF_STATES.map(({ value, label }) => (
          <FilterPill
            key={value}
            label={label}
            active={activeReefStates.includes(value)}
            onClick={() => toggleParam("reef", value)}
          />
        ))}

        {/* Divider */}
        <span
          aria-hidden="true"
          className="shrink-0"
          style={{ width: 1, height: 20, background: "#E7E6E2" }}
        />

        {/* Region pills */}
        {REGION_BUCKETS.map(({ value, label }) => (
          <FilterPill
            key={value}
            label={label}
            active={activeRegions.includes(value)}
            onClick={() => toggleParam("region", value)}
          />
        ))}

        {/* Divider */}
        <span
          aria-hidden="true"
          className="shrink-0"
          style={{ width: 1, height: 20, background: "#E7E6E2" }}
        />

        {/* Month pills */}
        {MONTH_LABELS.map((lbl, i) => {
          const m = i + 1;
          return (
            <FilterPill
              key={lbl}
              label={lbl}
              active={activeMonths.includes(m)}
              onClick={() => toggleParam("month", String(m))}
            />
          );
        })}

        {/* Clear all */}
        {hasActiveFilter && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto shrink-0 whitespace-nowrap text-sm text-[#0E4F6E] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
