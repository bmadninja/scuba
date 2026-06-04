"use client";

/**
 * Drop this anywhere inside a page to register breadcrumb items in the
 * layout-level AtlasNav.  Renders nothing visible.
 *
 * Example:
 *   <SetNavBreadcrumb items={[{ label: "Atlas", href: "/" }, { label: "Raja Ampat" }]} />
 */

import { useEffect } from "react";
import { useNavContext, type BreadcrumbItem } from "@/components/nav-context";

export function SetNavBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const { setBreadcrumbs } = useNavContext();

  useEffect(() => {
    setBreadcrumbs(items);
    return () => setBreadcrumbs([]);
    // JSON-stringify to stabilise reference equality check
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items)]);

  return null;
}
