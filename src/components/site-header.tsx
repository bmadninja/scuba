import Link from "next/link";
import { Suspense } from "react";
import { HeaderSearchBar } from "./header-search-bar";

type NavItem = { href: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { href: "/sites", label: "Dive sites" },
  { href: "/encounters", label: "Encounters" },
  { href: "/plan", label: "Plan a trip" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

export function SiteHeader({ activeHref }: { activeHref?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-slate-900">
            scubaSeason<span className="text-[#0089de]">.fun</span>
          </span>
        </Link>
        <nav className="ml-auto hidden gap-6 text-sm font-medium text-slate-700 sm:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "text-[#0089de]" : "hover:text-[#0089de]"}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Suspense fallback={null}>
          <HeaderSearchBar />
        </Suspense>
      </div>
    </header>
  );
}
