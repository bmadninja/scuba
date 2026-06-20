"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  /** Extra delay class: "d1" | "d2" | "d3" | "d4" */
  delay?: "d1" | "d2" | "d3" | "d4";
}

/**
 * RevealOnScroll — wraps children in a .reveal container.
 * IntersectionObserver adds .on when the element enters the viewport.
 * Disconnects after first trigger so scroll-back does not re-animate.
 * Respects prefers-reduced-motion via CSS (see globals.css .reveal rules).
 */
export function RevealOnScroll({ children, className = "", delay }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("on");
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const classes = ["reveal", delay, className].filter(Boolean).join(" ");

  return (
    <div ref={ref} className={classes}>
      {children}
    </div>
  );
}

export default RevealOnScroll;
