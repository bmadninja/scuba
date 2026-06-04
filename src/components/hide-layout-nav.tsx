"use client";

/**
 * Renders nothing visible.  Signals the layout-level AtlasNav to hide itself
 * so the page can render its own hero-variant nav without duplication.
 */

import { useEffect } from "react";
import { useNavContext } from "@/components/nav-context";

export function HideLayoutNav() {
  const { setHideLayoutNav } = useNavContext();

  useEffect(() => {
    setHideLayoutNav(true);
    return () => setHideLayoutNav(false);
  }, [setHideLayoutNav]);

  return null;
}
