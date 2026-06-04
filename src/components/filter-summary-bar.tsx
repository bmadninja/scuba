"use client";

/**
 * FilterSummaryBar — shows active filters as dismissible pills.
 * Reef state pills use state color token; other pills use brand/10 bg + brand text.
 * Ordering: reef state → cert → region → month → thermal → wildlife → fresh-only
 */

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const STATE_PILL_STYLE: Record<string, { bg: string; color: string }> = {
  thriving: { bg: "rgba(16,185,129,0.12)", color: "#065f46" },
  pressure: { bg: "rgba(0,137,222,0.12)", color: "#0369a1" },
  change: { bg: "rgba(244,63,94,0.12)", color: "#9f1239" },
};

type FilterSummaryBarProps = {
  conditions: string[];
  skills: string[];
  regions: string[];
  months: number[];
  heat: string[];
  animals: string[];
  freshOnly: boolean;
  totalCount: number;
  onRemoveCondition: (v: string) => void;
  onRemoveSkill: (v: string) => void;
  onRemoveRegion: (v: string) => void;
  onRemoveMonth: (v: number) => void;
  onRemoveHeat: (v: string) => void;
  onRemoveAnimal: (v: string) => void;
  onRemoveFreshOnly: () => void;
  onReset: () => void;
  className?: string;
};

function Pill({
  label,
  onRemove,
  bg,
  color,
}: {
  label: string;
  onRemove: () => void;
  bg: string;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: bg, color }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full opacity-60 hover:opacity-100"
        style={{ background: "transparent", border: "none", cursor: "pointer", color }}
      >
        ×
      </button>
    </span>
  );
}

export function FilterSummaryBar({
  conditions,
  skills,
  regions,
  months,
  heat,
  animals,
  freshOnly,
  totalCount,
  onRemoveCondition,
  onRemoveSkill,
  onRemoveRegion,
  onRemoveMonth,
  onRemoveHeat,
  onRemoveAnimal,
  onRemoveFreshOnly,
  onReset,
  className = "",
}: FilterSummaryBarProps) {
  const hasSomething =
    conditions.length < 3 ||
    skills.length > 0 ||
    regions.length > 0 ||
    months.length > 0 ||
    heat.length > 0 ||
    animals.length > 0 ||
    freshOnly;

  if (!hasSomething) return null;

  const brandPill = { bg: "rgba(0,137,222,0.1)", color: "#0089de" };

  return (
    <div
      className={`flex flex-wrap items-center gap-2 py-2 ${className}`}
    >
      <span className="text-[11px] font-semibold text-slate-500">
        Showing {totalCount}
      </span>

      {/* Reef state */}
      {["thriving", "pressure", "change"].filter(
        (v) => !conditions.includes(v)
      ).map((v) => {
        const style = STATE_PILL_STYLE[v] ?? brandPill;
        const label = v === "thriving" ? "Thriving" : v === "pressure" ? "Under pressure" : "Witnessing change";
        return (
          <Pill
            key={`excl-${v}`}
            label={`Not ${label}`}
            onRemove={() => onRemoveCondition(v)}
            {...style}
          />
        );
      })}
      {["thriving", "pressure", "change"].filter((v) => conditions.includes(v) && conditions.length < 3).map((v) => {
        const style = STATE_PILL_STYLE[v] ?? brandPill;
        const label = v === "thriving" ? "Thriving" : v === "pressure" ? "Under pressure" : "Witnessing change";
        return (
          <Pill
            key={v}
            label={label}
            onRemove={() => onRemoveCondition(v)}
            {...style}
          />
        );
      })}

      {/* Cert */}
      {skills.map((s) => (
        <Pill key={s} label={s} onRemove={() => onRemoveSkill(s)} {...brandPill} />
      ))}

      {/* Region */}
      {regions.map((r) => (
        <Pill key={r} label={r} onRemove={() => onRemoveRegion(r)} {...brandPill} />
      ))}

      {/* Months */}
      {months.map((m) => (
        <Pill
          key={m}
          label={MONTH_ABBR[m - 1]}
          onRemove={() => onRemoveMonth(m)}
          {...brandPill}
        />
      ))}

      {/* Heat */}
      {heat.map((h) => (
        <Pill key={h} label={`Heat ${h}`} onRemove={() => onRemoveHeat(h)} {...brandPill} />
      ))}

      {/* Wildlife */}
      {animals.map((a) => (
        <Pill key={a} label={a} onRemove={() => onRemoveAnimal(a)} {...brandPill} />
      ))}

      {/* Fresh only */}
      {freshOnly ? (
        <Pill label="Fresh data only" onRemove={onRemoveFreshOnly} {...brandPill} />
      ) : null}

      <button
        type="button"
        onClick={onReset}
        className="ml-auto text-[11px] font-semibold text-slate-500 underline hover:text-slate-900"
      >
        Reset all filters
      </button>
    </div>
  );
}
