"use client";

interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

/**
 * FilterPill — Story 3.1
 *
 * Resting:  white bg, ink-2 text, hairline border, pill shape
 * Active:   ink bg, white text, no border
 * Hover:    ink border (resting only)
 */
export function FilterPill({ label, active, onClick }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "inline-flex items-center px-4 py-1.5 text-sm cursor-pointer transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2",
        "rounded-full whitespace-nowrap select-none",
        active
          ? "bg-[#0E1C28] text-white"
          : "bg-white text-[#4A5568] border border-[#E7E6E2] hover:border-[#0E1C28]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </button>
  );
}
