"use client";

/**
 * NavContext — lightweight context for pages to push breadcrumb items into
 * the layout-level AtlasNav, and to signal when the nav should be hidden
 * (e.g. homepage renders its own hero-variant nav).
 */

import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type NavContextValue = {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  /** When true, layout nav renders nothing (page renders its own hero nav) */
  hideLayoutNav: boolean;
  setHideLayoutNav: (v: boolean) => void;
};

const NavContext = createContext<NavContextValue>({
  breadcrumbs: [],
  setBreadcrumbs: () => {},
  hideLayoutNav: false,
  setHideLayoutNav: () => {},
});

export function NavProvider({ children }: { children: ReactNode }) {
  const [breadcrumbs, setBreadcrumbsState] = useState<BreadcrumbItem[]>([]);
  const [hideLayoutNav, setHideLayoutNavState] = useState(false);

  const setBreadcrumbs = useCallback((items: BreadcrumbItem[]) => {
    setBreadcrumbsState(items);
  }, []);

  const setHideLayoutNav = useCallback((v: boolean) => {
    setHideLayoutNavState(v);
  }, []);

  return (
    <NavContext.Provider
      value={{ breadcrumbs, setBreadcrumbs, hideLayoutNav, setHideLayoutNav }}
    >
      {children}
    </NavContext.Provider>
  );
}

export function useNavContext() {
  return useContext(NavContext);
}
