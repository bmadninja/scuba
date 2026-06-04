import type { Metadata } from "next";
import { getBucketListEncounters } from "@/lib/data/encounters";
import EncountersExplorer from "@/components/encounters-explorer";

export const metadata: Metadata = {
  title: "Bucket-list encounters | scubaSeason.fun",
  description:
    "Sardine run, hammerhead schools, whale shark aggregations, manta cleaning, blackwater, coral spawning, and more — with sources, ethics, and the truth about when you can actually see them.",
};

export default function EncountersIndexPage() {
  const encounters = getBucketListEncounters();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0089de]">
          Bucket list
        </p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
          Encounters worth a flight
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
          Big seasonal moments — sardine run, hammerhead schools, whale
          sharks, coral spawning. Each page tells you when it actually
          happens, what skill it needs, and how confident the evidence is.
        </p>
      </div>

      <EncountersExplorer encounters={encounters} />
    </div>
  );
}
