"use client";

import type { ReactNode } from "react";
import { enhanceAffiliateUrl } from "@/lib/affiliate";

type AffiliateEvent =
  | "gear_click"
  | "lodging_click"
  | "operator_click"
  | "flight_click";

type Props = {
  url: string;
  event: AffiliateEvent;
  partner: string;
  productId?: string;
  siteId: string;
  isAffiliate: boolean;
  className?: string;
  children: ReactNode;
};

export function AffiliateLink({
  url,
  event,
  partner,
  productId,
  siteId,
  isAffiliate,
  className,
  children,
}: Props) {
  const taggedUrl = isAffiliate ? enhanceAffiliateUrl(url, partner) : url;

  const handleClick = () => {
    if (typeof window === "undefined") return;
    const win = window as unknown as {
      va?: (kind: "event", name: string, data: Record<string, unknown>) => void;
    };
    win.va?.("event", event, { site_id: siteId, partner, product_id: productId });
  };

  return (
    <a
      href={taggedUrl}
      target="_blank"
      rel={isAffiliate ? "nofollow sponsored noopener" : "nofollow noopener"}
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}
