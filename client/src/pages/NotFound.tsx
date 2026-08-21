import { PolarisLogo } from "@/components/PolarisLogo";
import { ArrowLeft, Orbit } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="starfield aurora flex min-h-screen items-center justify-center px-4">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-primary/20 bg-card p-7 text-center shadow-2xl shadow-primary/10 sm:p-10"><div className="absolute -left-16 -top-16 h-44 w-44 rounded-full bg-primary/13 blur-3xl" /><div className="relative"><PolarisLogo /><div className="mx-auto mt-9 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary"><Orbit className="h-8 w-8" /></div><p className="mt-7 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-primary">Navigation anomaly</p><h1 className="mt-3 font-display text-6xl font-bold tracking-[-0.06em] text-foreground">404</h1><h2 className="mt-2 font-display text-3xl font-bold text-foreground">This trajectory is uncharted.</h2><p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground">The requested coordinate is not part of the Project Polaris platform. Return to mission control or explore the simulation laboratory.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/" className="press inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 font-mono text-[0.62rem] font-semibold text-primary-foreground"><ArrowLeft className="h-3.5 w-3.5" />Return to Polaris</Link><Link href="/aeroforge" className="press inline-flex items-center justify-center gap-2 rounded-full border border-primary/40 px-4 py-2.5 font-mono text-[0.62rem] text-primary hover:bg-primary hover:text-primary-foreground">Open AeroForge</Link></div></div></div>
    </div>
  );
}
