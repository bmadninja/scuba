"use client";

import { useEffect, useRef } from "react";

// ─── Info copy (reused verbatim from the approved atlas.html INFO object) ──────

type InfoRow = [label: string, bg: string, color: string, text: string];

type InfoEntry = {
  title: string;
  sub?: string;
  body?: string[];
  rows?: InfoRow[];
  source?: string;
  link?: boolean;
  anchor?: string;
  linkText?: string;
  /** Optional external link (e.g. a citizen-science platform's own site). */
  externalHref?: string;
  externalText?: string;
};

export type InfoKey =
  | "state"
  | "when"
  | "species"
  | "level"
  | "evidence"
  | "heat"
  | "fishing"
  | "iucn"
  | "conditions"
  | "chances"
  | "inaturalist"
  | "coralwatch"
  | "reefcheck"
  | "sighting";

export const INFO: Record<InfoKey, InfoEntry> = {
  state: {
    title: "What the reef labels mean",
    sub: "We read three live signals — coral cover, heat stress and fishing pressure — and turn them into one plain word for what is happening on the reef. It is not a ranking, and every reef is worth diving.",
    rows: [
      ["Improving", "rgba(16,185,129,0.15)", "#6ee7b7", "Near its natural baseline and steady. Recovering or healthy, not perfect."],
      ["Stable", "rgba(245,158,11,0.14)", "#fbbf24", "Below baseline or slipping from heat or fishing, but the reef structure and fish life still hold."],
      ["Declining", "rgba(244,63,94,0.14)", "#fca5a5", "Heavy recent loss or bleaching. The 4th global bleaching event (2023 to 2025) affected 84% of reefs worldwide, the worst on record, with a new El Niño now developing. Diving here documents what remains and adds to the scientific record."],
    ],
    link: true,
    anchor: "#reefstate",
    linkText: "See exactly how we calculate this on the Method page →",
  },
  when: {
    title: "What “in season” means",
    body: [
      "A reef's season is the stretch of months when it is at its best to dive: calm seas and gentle currents, clear water with good visibility, and the marine life you came for actually around. For many reefs that lines up with the dry season, when there is less rain and runoff to cloud the water.",
      "Pick the months you can travel. Reefs in season for those months come first; the rest still show below, so you can plan around any time of year. Leave it blank and we sort by what is good to dive right now.",
    ],
  },
  species: {
    title: "What do you want to see",
    body: [
      "Pick the animals you are hoping to see. We show only reefs where divers have actually recorded them.",
      "Open a reef and its dive sites to see how likely each animal is to show up, worked out from how often divers have logged it over the past year.",
    ],
    link: true,
  },
  level: {
    title: "How experience level works",
    body: [
      "Tick the levels you are comfortable with and we show reefs whose dive sites suit them.",
      "Beginner and Open Water cover most reef dives to about 18 metres. Advanced opens up deeper sites and stronger currents. Technical adds deep wrecks and overhead dives.",
    ],
  },
  evidence: {
    title: "What “needs fresh eyes” means",
    body: [
      "Some reefs have no recent records from divers — nobody has logged what they saw there lately. We never call that “no data” or treat the reef as abandoned. It simply needs fresh eyes.",
      "Tick this to find those reefs. Diving one and logging what you see, even a single photo, puts it back on the map for everyone.",
    ],
    link: true,
    linkText: "How logging works on the Method page →",
  },
  heat: {
    title: "How warm the water is right now",
    body: [
      "Every reef has a usual temperature for the time of year. We compare the water right now against that seasonal usual. For example, if a reef usually sits around 25°C this month and the water is around 27°C now, that is about 2°C above usual.",
      "Normal means the water is within about a degree of the usual range for the season, so coral is comfortable. Warmer than usual means it is sitting a couple of degrees above the usual range, and coral can start to pale.",
      "What matters is how much heat builds up over weeks, not a single warm day. A brief warm spell is fine; it is sustained heat that bleaches coral. When the heat keeps building, bleaching becomes likely and the label escalates to a bleaching alert.",
    ],
    source:
      "Source: NOAA Coral Reef Watch — the satellite feed reef scientists use worldwide. It refreshes live.",
    link: true,
    anchor: "#reef-state",
  },
  fishing: {
    title: "What fishing protection means",
    sub: "How much fishing is allowed shapes how fast a reef can recover.",
    rows: [
      ["Banned", "rgba(16,185,129,0.15)", "#6ee7b7", "No fishing of any kind. The strongest protection — gives the reef room to recover."],
      ["Limited", "rgba(245,158,11,0.15)", "#fcd34d", "Some fishing allowed in marked zones or seasons."],
      ["Open", "rgba(244,63,94,0.14)", "#fca5a5", "No fishing restrictions in place."],
      ["Patrolled", "rgba(255,255,255,0.08)", "#aebcd0", "Rules are actively enforced on the water, not just on paper."],
    ],
    link: true,
    anchor: "#reef-state",
  },
  iucn: {
    title: "What the conservation labels mean",
    sub: "Each animal carries its status from the IUCN Red List, the global standard for extinction risk. It tells you how threatened the species is in the wild.",
    rows: [
      ["Least concern", "rgba(16,185,129,0.15)", "#6ee7b7", "Widespread and not currently at risk."],
      ["Near threatened", "rgba(132,204,22,0.15)", "#bef264", "Could become at risk in the near future."],
      ["Vulnerable", "rgba(245,158,11,0.15)", "#fcd34d", "High risk of extinction in the wild."],
      ["Endangered", "rgba(244,63,94,0.14)", "#fca5a5", "Very high risk of extinction in the wild."],
      ["Critically endangered", "rgba(185,28,28,0.2)", "#fca5a5", "Extremely high risk — one step from extinct in the wild."],
    ],
    link: true,
    anchor: "#sources",
  },
  conditions: {
    title: "What the conditions mean",
    sub: "A quick read on what to expect underwater. These are typical for the season, not a guarantee on the day — your operator briefs the actual plan.",
    rows: [
      ["Depth", "rgba(0,212,255,0.12)", "#00d4ff", "The shallow and deep range of the dive. Shallower sites suit newer divers."],
      ["Current", "rgba(255,255,255,0.08)", "#aebcd0", "How much the water moves you along. Gentle on most reefs, stronger on outer edges."],
      ["Visibility", "rgba(0,212,255,0.12)", "#00d4ff", "How far you can see underwater. Usually clearest in the calm season."],
      ["Water", "rgba(245,158,11,0.15)", "#fcd34d", "Temperature range, which sets your wetsuit thickness."],
    ],
  },
  chances: {
    title: "How we work out your chances",
    body: [
      "The chance comes from how often divers have actually logged each animal here over the past two years. A higher chance means it showed up in many recent records; a lower one means only a few.",
      "Every record is a real diver photo, confirmed by the community to research grade, then passed into the global databases that feed IUCN Red List assessments. Nothing is invented.",
      "Wildlife moves, so treat these as a guide, not a promise.",
    ],
    source: "Source: research grade observations, via GBIF and OBIS.",
    link: true,
    anchor: "#sightings",
  },
  inaturalist: {
    title: "Logging with iNaturalist",
    body: [
      "Photograph any animal or plant you see on the dive and upload it. No training and no survey method — a single clear photo is enough.",
      "The community confirms the identification to research grade, and the record flows into the global databases that feed IUCN Red List assessments. Your sighting becomes part of the public record scientists use.",
    ],
    source: "Free. Works from the iNaturalist app or the website.",
    externalHref: "https://www.inaturalist.org",
    externalText: "Open iNaturalist →",
    link: true,
    anchor: "#sightings",
    linkText: "See how submitting and verifying works on the Method page →",
  },
  coralwatch: {
    title: "Logging with CoralWatch",
    body: [
      "Hold the Coral Health Chart next to a coral, match its colour to the chart, and note the score. It takes a few minutes and needs no scientific background.",
      "Those colour scores track how pale or healthy coral is over time, which is how bleaching gets caught early. Repeat readings at the same reef build a record of how it is changing.",
    ],
    source: "Free. Run by the University of Queensland.",
    externalHref: "https://coralwatch.org",
    externalText: "Open CoralWatch →",
    link: true,
    anchor: "#sightings",
    linkText: "See how submitting and verifying works on the Method page →",
  },
  reefcheck: {
    title: "Logging with Reef Check",
    body: [
      "Run a standardised survey: divers count set lists of fish, invertebrates and substrate along a measured transect. It is the same method worldwide, so results compare across reefs and years.",
      "Reef Check offers free training to certify you as a volunteer surveyor. Your counts feed one of the longest running global reef monitoring datasets.",
    ],
    source: "Free training. Run by the Reef Check Foundation.",
    externalHref: "https://www.reefcheck.org",
    externalText: "Open Reef Check →",
    link: true,
    anchor: "#sightings",
    linkText: "See how submitting and verifying works on the Method page →",
  },
  sighting: {
    title: "How sighting broadcasts work",
    body: [
      "Your sighting reaches iNaturalist, GBIF, OBIS, and reef research organizations the same day you upload it. No separate accounts needed — we handle the forwarding.",
      "Every photo you log helps scientists track what is actually happening to this reef. One upload. Five platforms. Real data, building the global picture.",
    ],
    link: true,
    anchor: "#sightings",
    linkText: "Learn how data flows on the Method page →",
  },
};

/**
 * Centered info modal over a blurred backdrop — the redesign's signature in-place
 * explanation pattern. Focus moves into the modal on open and is trapped; Escape,
 * × and backdrop click close it and return focus to the trigger.
 */
export function AtlasInfoPopup({
  infoKey,
  onClose,
}: {
  infoKey: InfoKey;
  onClose: () => void;
}) {
  const entry = INFO[infoKey];
  const modalRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8,15,30,0.5)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={entry.title}
        style={{
          background: "#0a1628",
          borderRadius: "1.25rem",
          maxWidth: 460,
          width: "100%",
          padding: "1.75rem",
          boxShadow: "0 24px 64px -16px rgba(0,0,0,0.4)",
          position: "relative",
        }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "1rem",
            right: "1.1rem",
            background: "none",
            border: "none",
            fontSize: "1.4rem",
            color: "#8b9db8",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ×
        </button>
        <p style={{ fontSize: "1.2rem", fontWeight: 800, color: "#f0f4f8", marginBottom: "0.4rem" }}>
          {entry.title}
        </p>
        {entry.sub && (
          <p style={{ fontSize: "0.875rem", color: "#8b9db8", marginBottom: "1.25rem", lineHeight: 1.55 }}>
            {entry.sub}
          </p>
        )}
        {entry.body?.map((p, i) => (
          <p
            key={i}
            style={{
              fontSize: "0.875rem",
              color: "#aebcd0",
              lineHeight: 1.65,
              marginBottom: i === (entry.body!.length - 1) ? 0 : "0.8rem",
            }}
          >
            {p}
          </p>
        ))}
        {entry.rows?.map((row) => (
          <div
            key={row[0]}
            style={{
              display: "flex",
              gap: "0.75rem",
              padding: "0.8rem 0",
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <span
              style={{
                flexShrink: 0,
                padding: "0.15rem 0.55rem",
                borderRadius: 999,
                fontSize: "0.7rem",
                fontWeight: 700,
                height: "fit-content",
                background: row[1],
                color: row[2],
              }}
            >
              {row[0]}
            </span>
            <span style={{ fontSize: "0.8125rem", color: "#aebcd0", lineHeight: 1.5 }}>
              {row[3]}
            </span>
          </div>
        ))}
        {entry.source && (
          <p
            style={{
              fontSize: "0.75rem",
              color: "#8b9db8",
              marginTop: "0.9rem",
              paddingTop: "0.8rem",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              lineHeight: 1.5,
            }}
          >
            {entry.source}
          </p>
        )}
        {entry.externalHref && (
          <a
            href={entry.externalHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              marginTop: "1rem",
              fontSize: "0.875rem",
              fontWeight: 700,
              color: "#00d4ff",
              textDecoration: "none",
            }}
          >
            {entry.externalText ?? "Open →"}
          </a>
        )}
        {entry.link && (
          <a
            href={`/data${entry.anchor ?? ""}`}
            style={{
              display: "inline-block",
              marginTop: entry.externalHref ? "0.5rem" : "1rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#00d4ff",
              textDecoration: "none",
            }}
          >
            {entry.linkText ?? "See how it all works on the Method page →"}
          </a>
        )}
      </div>
    </div>
  );
}

/** The small (i) trigger button used in filter section headers and the sort row. */
export function InfoButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      style={{
        width: 15,
        height: 15,
        borderRadius: "50%",
        border: "1.4px solid #8b9db8",
        color: "#8b9db8",
        fontSize: "0.62rem",
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "none",
        flexShrink: 0,
        lineHeight: 1,
        cursor: "pointer",
      }}
    >
      i
    </button>
  );
}
