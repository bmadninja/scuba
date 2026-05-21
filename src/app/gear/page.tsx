import Link from "next/link";
import type { Metadata } from "next";
import { getAllGear } from "@/lib/data/gear";
import { GearExplorer } from "@/components/gear-explorer";

export const metadata: Metadata = {
  title: "Gear Guide | scubaSeason.fun",
  description:
    "Curated scuba diving gear by cert level — wetsuits, regulators, dive computers and more. Filtered for your experience.",
};

export default function GearPage() {
  const gear = getAllGear();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#0089de] text-white">
              <span className="text-lg">🌊</span>
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              scubaSeason<span className="text-[#0089de]">.fun</span>
            </span>
          </Link>
          <nav className="hidden gap-6 text-sm font-medium text-slate-700 sm:flex">
            <Link href="/sites" className="hover:text-[#0089de]">
              Dive sites
            </Link>
            <Link href="/gear" className="text-[#0089de]">
              Gear
            </Link>
            <Link href="/about" className="hover:text-[#0089de]">
              About
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0089de]">
            Gear guide
          </p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
            What you actually need
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
            Pick your cert level and see the gear that fits. No fluff — just
            what we&rsquo;d actually recommend buying.
          </p>
        </div>

        <GearExplorer gear={gear} />
      </main>
    </div>
  );
}
