import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <main className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight">Hello World 🌊</h1>
        <p className="text-muted-foreground text-lg">Welcome to Scuba — your guide to what&apos;s in season.</p>
        <Button size="lg">Explore Dive Sites</Button>
      </main>
    </div>
  );
}
