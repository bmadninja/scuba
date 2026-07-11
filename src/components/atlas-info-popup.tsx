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
  | "fishingpressure"
  | "specieslogged"
  | "bluepark"
  | "iucn"
  | "conditions"
  | "chances"
  | "reefabundance"
  | "inaturalist"
  | "coralwatch"
  | "reefcheck"
  | "sighting";

export const INFO: Record<InfoKey, InfoEntry> = {
  state: {
    title: "What the reef labels mean",
    sub: "This is a read on the reef itself, turned into one plain word. Two reef signals build it: how much living coral is on the reef, and how much fish life it holds. We lead with the weaker of the two. Heat and fishing then act as forces on top: they can hold a reef back from Improving, and a serious heat alert can push it to Declining. Blue Park status and species logged are shown for context and do not change it. It is not a ranking, and every reef is worth diving.",
    rows: [
      ["Improving", "rgba(46,125,91,0.13)", "#216B49", "Near its natural baseline and steady. Recovering or healthy, not perfect."],
      ["Stable", "rgba(185,138,46,0.16)", "#7A5A12", "Below baseline or slipping from heat or fishing, but the reef structure and fish life still hold."],
      ["Declining", "rgba(192,65,43,0.13)", "#A8351F", "Heavy recent loss or bleaching. The 4th global bleaching event (2023 to 2025) affected 84% of reefs worldwide, the worst on record, with a new El Niño now developing. Diving here documents what remains and adds to the scientific record."],
      ["Not surveyed", "rgba(14,28,40,0.07)", "#4A5568", "No coral survey and no heat reading on file yet, so we do not assign a state. The absence of bad news is not evidence of a healthy reef, and a single logged dive can change that."],
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
      "Open a reef and its dive sites to see how likely each animal is to show up, worked out from recent verified records, or marked Expected where a reef has none yet.",
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
      ["Banned", "rgba(46,125,91,0.13)", "#216B49", "No fishing of any kind. The strongest protection — gives the reef room to recover."],
      ["Limited", "rgba(185,138,46,0.16)", "#7A5A12", "Some fishing allowed in marked zones or seasons."],
      ["Open", "rgba(192,65,43,0.13)", "#A8351F", "No fishing restrictions in place."],
      ["Patrolled", "rgba(14,28,40,0.07)", "#4A5568", "Rules are actively enforced on the water, not just on paper."],
    ],
    link: true,
    anchor: "#reef-state",
  },
  bluepark: {
    title: "What a Blue Park Award means",
    body: [
      "A Blue Park Award is given by the Marine Conservation Institute to marine protected areas that meet the highest science-based standard for actually protecting ocean life, not just drawing lines on a map.",
      "Winning one means independent scientists checked that the protection is real: strong rules, enforcement on the water, and measurable recovery of fish and habitat. Awards come at Platinum, Gold and Silver levels; some years the level was not published, so we simply mark it as Awarded.",
      "Some parks cover only part of a wider dive area, so we name the exact protected area that holds the award.",
    ],
    source:
      "Source: Blue Parks, Marine Conservation Institute. See marine-conservation.org/blueparks.",
    link: true,
    anchor: "#sources",
  },
  fishingpressure: {
    title: "What boat traffic means",
    body: [
      "This is how much fishing boat activity is actually happening in the water around the reef, measured from satellite by Global Fishing Watch within a set distance of the dive site.",
      "It is the reality check on the protection rule. Where fishing is banned, quiet water means the ban is holding. Busy water despite protection is the warning sign, and it is why we show the two side by side.",
      "The small line under the label is the trend across recent years. A line that is falling beside a protected reef means the fishing pressure is easing, which suggests the protection may be taking hold. We show it as context, never as proof that anyone is being policed. Fishing near a protected area is often allowed just outside a small core, and the satellite misses small boats that do not broadcast their position.",
    ],
    source: "Source: Global Fishing Watch apparent fishing effort. It refreshes regularly.",
    link: true,
    anchor: "#reef-state",
  },
  specieslogged: {
    title: "What species logged means",
    body: [
      "This is the number of different species that divers and snorkelers have photographed and had confirmed to research grade on iNaturalist within a set distance of the reef.",
      "It is a rough measure of how much life has been recorded here, not a health score. A reef that is dived often will show more simply because more people log there, so treat it as a floor, not a full count.",
    ],
    source: "Source: research grade observations on iNaturalist.",
    externalHref: "https://www.inaturalist.org",
    externalText: "Open iNaturalist →",
    link: true,
    anchor: "#sightings",
  },
  iucn: {
    title: "What the conservation labels mean",
    sub: "Each animal carries its status from the IUCN Red List, the global standard for extinction risk. It tells you how threatened the species is in the wild.",
    rows: [
      ["Least concern", "rgba(46,125,91,0.13)", "#216B49", "Widespread and not currently at risk."],
      ["Near threatened", "rgba(101,163,13,0.16)", "#4D7C0F", "Could become at risk in the near future."],
      ["Vulnerable", "rgba(185,138,46,0.16)", "#7A5A12", "High risk of extinction in the wild."],
      ["Endangered", "rgba(192,65,43,0.13)", "#A8351F", "Very high risk of extinction in the wild."],
      ["Critically endangered", "rgba(153,27,27,0.13)", "#991B1B", "Extremely high risk — one step from extinct in the wild."],
    ],
    link: true,
    anchor: "#sources",
  },
  conditions: {
    title: "What the conditions mean",
    sub: "A quick read on what to expect underwater. These are typical for the season, not a guarantee on the day — your operator briefs the actual plan.",
    rows: [
      ["Depth", "rgba(14,79,110,0.11)", "#0E4F6E", "The shallow and deep range of the dive. Shallower sites suit newer divers."],
      ["Current", "rgba(14,28,40,0.07)", "#4A5568", "How much the water moves you along. Gentle on most reefs, stronger on outer edges."],
      ["Visibility", "rgba(14,79,110,0.11)", "#0E4F6E", "How far you can see underwater. Usually clearest in the calm season."],
      ["Water", "rgba(185,138,46,0.16)", "#7A5A12", "Temperature range, which sets your wetsuit thickness."],
    ],
  },
  chances: {
    title: "How we work out your chances",
    body: [
      "When divers have logged an animal here recently, its label reflects how consistently it shows up in those verified records over the past two years. A higher label means it appeared in many recent records; a lower one means only a few. These are occurrence records, not a count of every dive, so we never claim a literal percentage.",
      "Every record is a real diver photo, confirmed by the community to research grade, then passed into the global databases that feed IUCN Red List assessments. Nothing is invented.",
      "When an animal is known from this reef but has no recent records, we mark it Expected rather than giving it a measured chance. Wildlife moves, so treat every label as a guide, not a promise.",
    ],
    source: "Source: research grade observations, via iNaturalist, GBIF and OBIS.",
    link: true,
    anchor: "#sightings",
  },
  reefabundance: {
    title: "What fish abundance shows",
    body: [
      "This is a read on how much fish life divers actually record here, from the REEF Volunteer Fish Survey Project. On every survey a trained diver notes each species seen and places it in an abundance band, from a single fish up to abundant, and REEF logs how many surveys were done.",
      "Because the number of surveys is counted, the score is standardised for effort. A rising line means more fish seen per survey, not simply more divers logging. That is what makes it a real signal of fish life, and it is why we keep it separate from the coral reef state above.",
      "It is a relative index on a scale of 1 to 4, not a fish count or a weight, and it covers a whole REEF zone rather than a single dive site. Coverage is strong in the Caribbean, the United States, and the tropical eastern Pacific, and thin elsewhere, so we only show it where the surveys run deep enough to trust.",
    ],
    source: "Source: REEF Volunteer Fish Survey Project database, reef.org.",
    externalHref: "https://www.reef.org",
    externalText: "Open REEF →",
    link: true,
    anchor: "#sources",
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
  detail,
  onClose,
}: {
  infoKey: InfoKey;
  /** Optional live per-location readout (e.g. current temperature, vessel
   *  hours, survey radius) shown as a highlighted line above the explanation. */
  detail?: string | null;
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
        background: "rgba(14,28,40,0.45)",
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
          background: "#FFFFFF",
          border: "1px solid #E7E6E2",
          borderRadius: "1.25rem",
          maxWidth: 480,
          width: "100%",
          // Cap to the viewport and scroll inside so a tall modal (e.g. the reef
          // labels explainer) never pushes its Close button off a phone screen.
          maxHeight: "calc(100dvh - 3rem)",
          overflowY: "auto",
          padding: "1.9rem",
          boxShadow: "0 24px 64px -16px rgba(14,28,40,0.25)",
          position: "relative",
          fontFamily: "var(--font-sans)",
        }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "1.4rem",
            right: "1.4rem",
            width: 34,
            height: 34,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FFFFFF",
            border: "1px solid #E7E6E2",
            borderRadius: 8,
            fontSize: "1.25rem",
            color: "#4A5568",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ×
        </button>
        <div
          style={{
            paddingRight: "2.5rem",
            paddingBottom: "1.1rem",
            marginBottom: "1.35rem",
            borderBottom: "1px solid #E7E6E2",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#8794A5",
              margin: "0 0 0.55rem",
            }}
          >
            How this works
          </p>
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "1.7rem",
              lineHeight: 1.15,
              color: "#0E1C28",
              margin: 0,
            }}
          >
            {entry.title}
          </p>
        </div>
        {entry.sub && (
          <p style={{ fontSize: "0.95rem", color: "#1B2A38", marginBottom: "1.25rem", lineHeight: 1.6 }}>
            {entry.sub}
          </p>
        )}
        {detail && (
          <p style={{
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "#0E1C28",
            background: "rgba(246,199,0,0.12)",
            border: "1px solid rgba(246,199,0,0.4)",
            borderRadius: 8,
            padding: "0.65rem 0.85rem",
            margin: "0 0 1.1rem",
            lineHeight: 1.5,
          }}>
            {detail}
          </p>
        )}
        {entry.body?.map((p, i) => (
          <p
            key={i}
            style={{
              fontSize: "0.95rem",
              color: "#1B2A38",
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
              borderTop: "1px solid #E7E6E2",
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
            <span style={{ fontSize: "0.875rem", color: "#4A5568", lineHeight: 1.55 }}>
              {row[3]}
            </span>
          </div>
        ))}
        {entry.source && (
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              color: "#6B7A8D",
              marginTop: "0.9rem",
              paddingTop: "0.8rem",
              borderTop: "1px solid #E7E6E2",
              lineHeight: 1.55,
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
              color: "#0E4F6E",
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
              marginTop: "1.35rem",
              padding: "0.7rem 1.15rem",
              background: "#F6C700",
              color: "#0E1C28",
              borderRadius: 8,
              fontFamily: "var(--font-mono)",
              fontSize: "0.82rem",
              fontWeight: 600,
              letterSpacing: "0.01em",
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
        border: "1.4px solid #4A5568",
        color: "#4A5568",
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
