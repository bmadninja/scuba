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
    <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#f0f4f8]">
            How this is calculated
          </span>
          <span className="rounded-full bg-[#00d4ff]/15 px-2 py-0.5 text-xs font-semibold text-[#00d4ff]">
            Sources, dates, and method
          </span>
        </span>
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 shrink-0 text-[#8b9db8] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div className="border-t border-white/10 px-5 py-4 text-sm leading-6 text-[#aebcd0]">
          {children}
        </div>
      ) : null}
    </div>
  );
}
