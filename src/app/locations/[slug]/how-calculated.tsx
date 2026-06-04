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
    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-[#f1f7fb]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">
            How this is calculated
          </span>
          <span className="rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[11px] font-semibold text-[#1d5d90]">
            Sources, dates, and method
          </span>
        </span>
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div className="border-t border-slate-200 px-5 py-4 text-sm leading-6 text-slate-700">
          {children}
        </div>
      ) : null}
    </div>
  );
}
