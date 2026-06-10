export function ScienceContextModule() {
  return (
    <div
      style={{
        maxWidth: 1320,
        margin: "0 auto",
        padding: "0 3rem",
      }}
    >
      <div
        style={{
          borderLeft: "3px solid #0089de",
          background: "#f8fafc",
          borderRadius: "0 8px 8px 0",
          padding: "1.25rem 1.5rem",
          marginBottom: "2rem",
        }}
      >
        <p
          style={{
            fontSize: "0.625rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#0089de",
            margin: "0 0 0.375rem",
          }}
        >
          Ocean data gap
        </p>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 700,
            color: "#0f172a",
            margin: "0 0 0.5rem",
          }}
        >
          Why diving here matters to science
        </p>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#475569",
            lineHeight: 1.65,
            margin: 0,
            maxWidth: 680,
          }}
        >
          Shallow coastal reefs are among the least monitored ecosystems on earth. As of 2026, only 25.7% of shallow
          coastal waters have been mapped to navigational resolution — a gap that satellites and deep-sea surveys
          cannot fill. Every dive at a site like this generates direct observations of reef structure, species
          presence, and water conditions that no automated system currently captures at scale.
        </p>
      </div>
    </div>
  );
}
