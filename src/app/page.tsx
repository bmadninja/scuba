import { Button } from "@/components/ui/button";
import { PlanetGlobePanel } from "@/components/planet-globe-panel";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(103,232,249,0.14),_transparent_28%),linear-gradient(180deg,_#020817_0%,_#04111f_42%,_#020617_100%)] text-white">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <h1 className="text-5xl font-bold tracking-tight">Hello World 🌊</h1>
        <p className="max-w-2xl text-lg text-cyan-50/75">
          Welcome to Scuba — your guide to what&apos;s in season.
        </p>
        <PlanetGlobePanel
          markers={[
            {
              lat: -16.7346,
              lng: -151.0094,
              label: "Placeholder reef marker",
              color: "#68e4ff",
            },
          ]}
        />
        <Button size="lg">Explore Dive Sites</Button>
      </main>
    </div>
  );
}
