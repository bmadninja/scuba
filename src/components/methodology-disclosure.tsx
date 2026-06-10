/**
 * MethodologyDisclosure — native <details>/<summary> inline methodology panel.
 * No JS, no modal. Always inline at point of claim.
 * Info circle icon + "How is this calculated?" summary.
 */

import type { ReactNode } from "react";

type MethodologyDisclosureProps = {
  children: ReactNode;
  summary?: string;
  className?: string;
};

export function MethodologyDisclosure({
  children,
  summary = "How is this calculated?",
  className = "",
}: MethodologyDisclosureProps) {
  return (
    <details
      className={`rounded border border-white/10 bg-[#0a1628] ${className}`}
      style={{ overflow: "hidden" }}
    >
      <summary
        className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8b9db8] hover:bg-white/5"
        style={{ userSelect: "none" }}
      >
        {/* Info circle icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ flexShrink: 0, color: "#8b9db8" }}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        {summary}
        {/* Chevron — CSS rotates when open */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="details-chevron ml-auto"
          style={{ color: "#8b9db8", transition: "transform 0.15s" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>
      <div className="border-t border-white/10 px-4 py-4 text-[13px] leading-6 text-[#8b9db8]">
        {children}
      </div>
    </details>
  );
}
