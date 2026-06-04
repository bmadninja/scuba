import Link from "next/link";

export function AtlasFooter() {
  return (
    <footer className="border-t border-slate-200 bg-[#f1f7fb]">
      <div className="mx-auto max-w-[1320px] px-7 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-[1fr_auto]">
          <div className="max-w-sm">
            <Link href="/" className="text-sm font-semibold tracking-tight text-slate-900">
              scubaSeason<span className="text-[#0089de]">.fun</span>
            </Link>
            <p className="mt-1 text-sm text-slate-500">A data atlas for the living ocean.</p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Built from a diver&apos;s frustration — the kind you get when you can&apos;t find
              good conditions data before a trip. If you spot a mistake or want to collaborate,
              reach out. Always happy to hear from you.
            </p>
            <a
              href="mailto:hello@scubaseason.fun"
              className="mt-3 inline-block text-sm text-[#0089de] transition-colors hover:text-[#006fb5]"
            >
              hello@scubaseason.fun
            </a>
          </div>

          <ul className="space-y-2">
            <li>
              <Link href="/data" className="text-sm text-slate-700 transition-colors hover:text-[#0089de]">
                Data sources
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-sm text-slate-700 transition-colors hover:text-[#0089de]">
                About
              </Link>
            </li>
            <li>
              <Link href="/faq" className="text-sm text-slate-700 transition-colors hover:text-[#0089de]">
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            Data aggregated from public sources (NOAA, IUCN, GFW) and may not reflect current
            conditions. Always dive with a local guide.
          </p>
          <p className="shrink-0 text-xs text-slate-400">&copy; 2026 scubaSeason.fun</p>
        </div>
      </div>
    </footer>
  );
}
