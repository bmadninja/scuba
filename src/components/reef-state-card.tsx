import Link from "next/link";
import { ReefHealthBadge } from "@/components/reef-health-badge";

type ReefState = "improving" | "stable" | "declining";

export interface ReefStateCardData {
  slug: string;
  name: string;
  country: string;
  region: string;
  heroImageUrl: string;
  state: ReefState;
  hook: string;
}

export function ReefStateCard({ card }: { card: ReefStateCardData }) {
  return (
    <Link
      href={`/locations/${card.slug}`}
      className="reef-state-card-link"
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      {/* Photo with overlay */}
      <div
        className="reef-state-card-photo"
        style={{
          position: "relative",
          aspectRatio: "3/4",
          overflow: "hidden",
          background: "var(--color-ocean)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.heroImageUrl}
          alt={`Underwater photograph at ${card.name}`}
          loading="lazy"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 300ms ease",
          }}
          className="reef-state-card-img"
        />
        {/* Bottom gradient overlay */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, transparent 40%, rgba(14,28,40,0.70) 100%)",
          }}
        />
        {/* ReefHealthBadge anchored bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: "0.875rem",
            left: "0.875rem",
          }}
        >
          <ReefHealthBadge state={card.state} onPhoto />
        </div>
      </div>

      {/* Text below card */}
      <div style={{ padding: "0.75rem 0.25rem 0" }}>
        <div
          style={{
            fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif',
            fontWeight: 400,
            fontSize: "1.0625rem",
            color: "var(--color-ink)",
            lineHeight: 1.3,
            marginBottom: "0.25rem",
          }}
        >
          {card.name}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sans), "IBM Plex Sans", system-ui, sans-serif',
            fontWeight: 300,
            fontSize: "0.75rem",
            color: "var(--color-ink-2)",
          }}
        >
          {card.country} · {card.region}
        </div>
        {card.hook && (
          <div
            style={{
              fontFamily: 'var(--font-sans), "IBM Plex Sans", system-ui, sans-serif',
              fontWeight: 300,
              fontSize: "0.8125rem",
              color: "var(--color-ink-2)",
              lineHeight: 1.5,
              marginTop: "0.375rem",
            }}
          >
            {card.hook}
          </div>
        )}
      </div>
    </Link>
  );
}

export function ReefStateCardTrio({ cards }: { cards: ReefStateCardData[] }) {
  return (
    <>
      <div
        className="reef-state-trio-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
        }}
      >
        {cards.map((card) => (
          <ReefStateCard key={card.slug} card={card} />
        ))}
      </div>

      <style>{`
        .reef-state-card-link:hover .reef-state-card-img {
          transform: scale(1.03);
        }
        .reef-state-card-link:focus-visible {
          outline: 2px solid #F6C700;
          outline-offset: 2px;
        }
        @media (max-width: 640px) {
          .reef-state-trio-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
