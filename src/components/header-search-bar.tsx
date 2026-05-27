"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function HeaderSearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/sites?q=${encodeURIComponent(q)}` : "/sites");
  };

  return (
    <form onSubmit={submit} role="search" className="relative w-40 sm:w-56">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search sites…"
        aria-label="Search dive sites"
        className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0089de]"
      />
    </form>
  );
}
