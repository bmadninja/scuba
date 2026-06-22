"use client";

import { useEffect, useRef, useState } from "react";

interface Stat {
  value: number;
  suffix?: string;
  label: string;
}

const STATS: Stat[] = [
  { value: 384, suffix: "+", label: "Locations" },
  { value: 2366, suffix: "+", label: "Dive sites" },
  { value: 63, label: "Data sources" },
  { value: 3, label: "Reef states" },
];

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function CountUp({ target, suffix = "", reducedMotion }: { target: number; suffix?: string; reducedMotion: boolean }) {
  const [current, setCurrent] = useState(reducedMotion ? target : 0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const DURATION = 1200;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (reducedMotion) {
      setCurrent(target);
      return;
    }

    function step(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased = easeOutExpo(progress);
      setCurrent(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, reducedMotion]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return <>{current.toLocaleString()}{suffix}</>;
}

export function HomepageStatStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div
      ref={ref}
      style={{
        borderTop: "1.5px solid #F6C700",
        borderBottom: "1.5px solid #F6C700",
        background: "var(--color-paper)",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 1.5rem",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
        }}
      >
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            style={{
              padding: "1.75rem 1rem",
              borderRight: i < STATS.length - 1 ? "1px solid var(--color-hairline)" : "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono), "IBM Plex Mono", ui-monospace, monospace',
                fontWeight: 500,
                fontSize: "clamp(1.5rem, 3vw, 1.875rem)",
                lineHeight: 1,
                color: "var(--color-ink)",
                letterSpacing: "-0.02em",
              }}
            >
              {visible || reducedMotion ? (
                <CountUp target={stat.value} suffix={stat.suffix} reducedMotion={reducedMotion} />
              ) : (
                <>0{stat.suffix}</>
              )}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-sans), "IBM Plex Sans", system-ui, sans-serif',
                fontWeight: 300,
                fontSize: "0.8125rem",
                color: "var(--color-ink-2)",
                whiteSpace: "nowrap",
              }}
            >
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .stat-strip-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
