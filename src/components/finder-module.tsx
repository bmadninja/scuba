"use client";

/**
 * FinderModule — homepage dive-planning search widget.
 * Routes to /#atlas with filter params pre-populated.
 * Fully functional — uses the existing atlas URL param schema.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

const MONTHS = [
  { value: "1", label: "Jan" }, { value: "2", label: "Feb" }, { value: "3", label: "Mar" },
  { value: "4", label: "Apr" }, { value: "5", label: "May" }, { value: "6", label: "Jun" },
  { value: "7", label: "Jul" }, { value: "8", label: "Aug" }, { value: "9", label: "Sep" },
  { value: "10", label: "Oct" }, { value: "11", label: "Nov" }, { value: "12", label: "Dec" },
];

const SKILL_OPTIONS = [
  { value: "Beginner", label: "Beginner" },
  { value: "Open water", label: "Open water" },
  { value: "Advanced", label: "Advanced" },
  { value: "Technical", label: "Technical" },
];

const REEF_OPTIONS = [
  { value: "thriving", label: "Thriving" },
  { value: "pressure", label: "Under pressure" },
  { value: "change", label: "Witnessing change" },
];

const ENCOUNTER_OPTIONS = [
  "Sharks", "Whale sharks", "Hammerheads", "Rays & mantas",
  "Sea turtles", "Whales", "Dolphins", "Large pelagics",
  "Nudibranchs", "Frogfish & seahorses", "Cephalopods",
];

const SELECT_STYLE: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(0,212,255,0.18)",
  borderRadius: "0.6rem",
  color: "#f0f4f8",
  fontSize: "0.875rem",
  fontWeight: 500,
  padding: "0.65rem 0.85rem",
  outline: "none",
  cursor: "pointer",
  appearance: "none",
  fontFamily: "inherit",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "0.5625rem",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#8b9db8",
  marginBottom: "0.4rem",
  display: "block",
  fontFamily: "var(--atlas-mono,ui-monospace,monospace)",
};

const QUICK_CHIPS = [
  {
    label: "Best dives this month",
    icon: "📅",
    buildParams: (now: number) => {
      const p = new URLSearchParams();
      p.append("m[]", String(now));
      p.set("sort", "season");
      return p.toString();
    },
  },
  {
    label: "See marine life",
    icon: "🐠",
    buildParams: () => {
      const p = new URLSearchParams();
      p.append("a[]", "Sharks");
      p.append("a[]", "Sea turtles");
      p.append("a[]", "Rays & mantas");
      return p.toString();
    },
  },
  {
    label: "Healthy reefs only",
    icon: "🌊",
    buildParams: () => {
      const p = new URLSearchParams();
      p.append("c[]", "thriving");
      return p.toString();
    },
  },
];

export function FinderModule({ currentMonth }: { currentMonth: number }) {
  const router = useRouter();

  const [month, setMonth] = useState<string>(String(currentMonth));
  const [skill, setSkill] = useState<string>("");
  const [reef, setReef] = useState<string>("");
  const [encounter, setEncounter] = useState<string>("");

  function buildAndGo() {
    const p = new URLSearchParams();
    if (month) p.append("m[]", month);
    if (skill) p.append("skill[]", skill);
    if (reef) p.append("c[]", reef);
    if (encounter) p.append("a[]", encounter);
    if (!reef) {
      // default: show all states
      p.append("c[]", "thriving");
      p.append("c[]", "pressure");
      p.append("c[]", "change");
    }
    router.push(`/?${p.toString()}#atlas`);
  }

  return (
    <div
      style={{
        background: "rgba(10,22,40,0.82)",
        border: "1px solid rgba(0,212,255,0.18)",
        borderRadius: "1.25rem",
        padding: "1.5rem 1.75rem 1.35rem",
        backdropFilter: "blur(16px)",
        boxShadow: "0 24px 64px -16px rgba(0,0,0,0.55)",
      }}
    >
      {/* Header */}
      <p
        style={{
          fontSize: "0.6875rem",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#00d4ff",
          marginBottom: "1.1rem",
          fontFamily: "var(--atlas-mono,ui-monospace,monospace)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d4ff", flexShrink: 0, boxShadow: "0 0 6px #00d4ff" }} />
        Plan your next dive
      </p>

      {/* Fields grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        <div>
          <label htmlFor="finder-month" style={LABEL_STYLE}>Month</label>
          <div style={{ position: "relative" }}>
            <select
              id="finder-month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={SELECT_STYLE}
            >
              <option value="">Any month</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <span aria-hidden style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "#8b9db8", pointerEvents: "none", fontSize: "0.7rem" }}>▾</span>
          </div>
        </div>

        <div>
          <label htmlFor="finder-encounter" style={LABEL_STYLE}>Species / encounter</label>
          <div style={{ position: "relative" }}>
            <select
              id="finder-encounter"
              value={encounter}
              onChange={(e) => setEncounter(e.target.value)}
              style={SELECT_STYLE}
            >
              <option value="">Anything</option>
              {ENCOUNTER_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <span aria-hidden style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "#8b9db8", pointerEvents: "none", fontSize: "0.7rem" }}>▾</span>
          </div>
        </div>

        <div>
          <label htmlFor="finder-reef" style={LABEL_STYLE}>Reef health</label>
          <div style={{ position: "relative" }}>
            <select
              id="finder-reef"
              value={reef}
              onChange={(e) => setReef(e.target.value)}
              style={SELECT_STYLE}
            >
              <option value="">Any condition</option>
              {REEF_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span aria-hidden style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "#8b9db8", pointerEvents: "none", fontSize: "0.7rem" }}>▾</span>
          </div>
        </div>

        <div>
          <label htmlFor="finder-skill" style={LABEL_STYLE}>Skill level</label>
          <div style={{ position: "relative" }}>
            <select
              id="finder-skill"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              style={SELECT_STYLE}
            >
              <option value="">Any level</option>
              {SKILL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span aria-hidden style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "#8b9db8", pointerEvents: "none", fontSize: "0.7rem" }}>▾</span>
          </div>
        </div>
      </div>

      {/* Search button */}
      <button
        type="button"
        onClick={buildAndGo}
        style={{
          width: "100%",
          padding: "0.75rem 1.5rem",
          background: "#00d4ff",
          color: "#0a1628",
          border: "none",
          borderRadius: "0.6rem",
          fontSize: "0.9375rem",
          fontWeight: 700,
          cursor: "pointer",
          letterSpacing: "-0.01em",
          transition: "background 0.15s, box-shadow 0.15s",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.background = "#33ddff";
          (e.target as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(0,212,255,0.35)";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.background = "#00d4ff";
          (e.target as HTMLButtonElement).style.boxShadow = "none";
        }}
      >
        Find dive destinations
      </button>

      {/* Quick chips */}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.9rem", flexWrap: "wrap" }}>
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => {
              const qs = chip.buildParams(currentMonth);
              router.push(`/?${qs}#atlas`);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.4rem 0.85rem",
              border: "1px solid rgba(0,212,255,0.22)",
              borderRadius: 999,
              background: "rgba(0,212,255,0.08)",
              color: "#aebcd0",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.12s, color 0.12s",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              const t = e.currentTarget;
              t.style.background = "rgba(0,212,255,0.15)";
              t.style.color = "#f0f4f8";
            }}
            onMouseLeave={(e) => {
              const t = e.currentTarget;
              t.style.background = "rgba(0,212,255,0.08)";
              t.style.color = "#aebcd0";
            }}
          >
            <span aria-hidden>{chip.icon}</span>
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
