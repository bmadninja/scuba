import type { Metadata } from "next";
import Link from "next/link";
import gearData from "@/data/gear.json";

export const metadata: Metadata = {
  title: "Gear | scubaSeason.fun",
  description:
    "Curated scuba gear recommendations — base kit essentials and site-specific add-ons. Honest picks, no pay-to-rank.",
};

type GearItem = {
  id: string;
  name: string;
  category: string;
  tier: string;
  description: string;
  priceRangeUsd: { min: number; max: number };
  partners: { partner: string; url: string; productId?: string }[];
  imageUrl?: string;
};

const TIER_LABEL: Record<string, string> = {
  basic: "base kit",
  addon: "add-on",
  advanced: "advanced",
};

const CATEGORY_ORDER = [
  "mask", "fins", "wetsuit", "bcd", "regulator",
  "computer", "smb", "light", "camera", "snorkel",
];

function sortedGear(items: GearItem[]) {
  return [...items].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.category);
    const bi = CATEGORY_ORDER.indexOf(b.category);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

export default function GearPage() {
  const gear = sortedGear(gearData as GearItem[]);
  const baseKit = gear.filter((g) => g.tier === "basic");
  const addOns = gear.filter((g) => g.tier !== "basic");

  return (
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "3.5rem 3rem" }}>
      {/* Header */}
      <nav style={{ marginBottom: "1.5rem", fontSize: "0.8125rem", color: "#64748b" }}>
        <Link href="/" style={{ color: "#64748b", textDecoration: "none" }}>← Atlas</Link>
      </nav>

      <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#64748b", marginBottom: "0.5rem" }}>
        Gear
      </p>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a", marginBottom: "0.75rem" }}>
        What to bring
      </h1>
      <p style={{ fontSize: "0.9375rem", color: "#475569", lineHeight: 1.7, marginBottom: "0.75rem", maxWidth: 640 }}>
        Two tiers: a base kit that works on every dive, and site-specific add-ons for the conditions you&apos;ll actually encounter.
        Affiliate links earn a small commission — it doesn&apos;t change the price and doesn&apos;t influence what&apos;s listed.
      </p>
      <p style={{ fontSize: "0.8125rem", color: "#94a3b8", marginBottom: "3rem" }}>
        {gear.length} items · Prices in USD
      </p>

      {/* Tier A — base kit */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginBottom: "1.25rem" }}>
          Tier A — base kit
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {baseKit.map((item) => (
            <GearCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* Tier B — site-specific */}
      {addOns.length > 0 && (
        <section style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginBottom: "1.25rem" }}>
            Tier B — site-specific
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
            {addOns.map((item) => (
              <GearCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function GearCard({ item }: { item: GearItem }) {
  const link = item.partners[0]?.url;
  const tierLabel = TIER_LABEL[item.tier] ?? item.tier;
  const isAffiliate = item.partners[0] != null;

  return (
    <article
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "1.25rem",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {item.imageUrl && (
        <div style={{ height: 140, overflow: "hidden", background: "#f1f7fb" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt={item.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}
      <div style={{ padding: "1rem 1.25rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <p style={{ fontSize: "0.5875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: item.tier === "basic" ? "#0089de" : "#64748b" }}>
          {tierLabel} · {item.category}
        </p>
        <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
          {item.name}
        </p>
        <p style={{ fontSize: "0.8125rem", color: "#475569", lineHeight: 1.55, flex: 1 }}>
          {item.description}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0f172a" }}>
            ${item.priceRangeUsd.min}–${item.priceRangeUsd.max}
          </span>
          {link && (
            <a
              href={link}
              target="_blank"
              rel={isAffiliate ? "nofollow sponsored noopener" : "nofollow noopener"}
              style={{ fontSize: "0.75rem", fontWeight: 600, color: "#0089de", textDecoration: "none" }}
            >
              Shop →
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
