import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
      style={{ background: "var(--color-paper)", color: "var(--color-ink)" }}
    >
      <p
        style={{
          fontFamily: 'var(--font-mono), "IBM Plex Mono", ui-monospace, monospace',
          fontSize: "11px",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "rgba(14,28,40,0.4)",
          marginBottom: "1.25rem",
        }}
      >
        404
      </p>

      <h1
        className="font-serif font-light italic text-4xl md:text-5xl"
        style={{
          fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif',
          fontWeight: 300,
          fontStyle: "italic",
          color: "var(--color-ink)",
          maxWidth: "600px",
          lineHeight: 1.15,
          marginBottom: "2rem",
        }}
      >
        This reef is off the map.
      </h1>

      <p
        style={{
          fontSize: "1rem",
          color: "rgba(14,28,40,0.6)",
          maxWidth: "400px",
          lineHeight: 1.6,
          marginBottom: "2.5rem",
        }}
      >
        The page you are looking for does not exist. Try exploring the full reef atlas instead.
      </p>

      <Link
        href="/locations"
        style={{
          display: "inline-flex",
          alignItems: "center",
          background: "#F6C700",
          color: "#0E1C28",
          padding: "0.75rem 1.5rem",
          borderRadius: "2px",
          fontSize: "0.875rem",
          fontWeight: 500,
          textDecoration: "none",
          minHeight: "44px",
        }}
        className="focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
      >
        Explore all reefs
      </Link>
    </div>
  );
}
