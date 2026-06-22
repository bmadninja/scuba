"use client";

import { useState } from "react";

/**
 * Collapsible "How this is calculated" disclosure for the location
 * reef-health section. Keeps the main view clean: the raw methodology,
 * exact survey dates, source citations, alert mechanics, GFW method,
 * and classification thresholds live in here.
 */
export function HowCalculated({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-[#E7E6E2] bg-[#F8F7F4]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#0E1C28]">
            How this is calculated
          </span>
          <span className="rounded-full bg-[#0E4F6E]/10 px-2 py-0.5 text-xs font-semibold text-[#0E4F6E]">
            Sources, dates, and method
          </span>
        </span>
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 shrink-0 text-[#4A5568] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div className="border-t border-[#E7E6E2] px-5 py-4 text-sm leading-6 text-[#4A5568]">
          {children}
        </div>
      ) : null}
    </div>
  );
}
