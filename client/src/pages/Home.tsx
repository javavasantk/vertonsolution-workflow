import { AeroForgeSimulator } from "@/components/AeroForgeSimulator";
import { CatalogCard } from "@/components/CatalogCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useAuth } from "@/_core/hooks/useAuth";
import { CATALOG, HAPPENING_NOW, LEARNING_LADDER, PATHWAYS, STATS } from "@shared/content";
import { ArrowRight, ArrowUpRight, Atom, BookOpen, BrainCircuit, Check, ChevronRight, CircleDot, FlaskConical, GraduationCap, LockKeyhole, Rocket, Save, Sparkles, Telescope, UsersRound, Wrench } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const domainIcons: Record<string, typeof Atom> = {
  "Aerospace": Rocket,
  "Astronomy": Telescope,
  "Physics": Atom,
  "Engineering": Wrench,
  "Programming & Data": BrainCircuit,
  "AI & Simulation": FlaskConical,
};

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [domain, setDomain] = useState<string>("All Domains");
  const previewItems = CATALOG.filter(item => domain === "All Domains" || item.domains.includes(domain as never)).slice(0, 6);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />
      <main id="main">
        <section className="starfield aurora relative px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:pt-24">
          <div className="container relative grid items-center gap-12 lg:grid-cols-[1fr_0.92fr] lg:gap-14">
            <div className="fade-up max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/18 bg-primary/8 px-3 py-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/18"><CircleDot className="h-2.5 w-2.5 text-primary" /></span>
                <span className="font-mono text-[0.6rem] tracking-[0.09em] text-foreground">Project Polaris</span>
                <span className="font-mono text-[0.55rem] text-primary">Learn science by doing it</span>
              </div>
              <h1 className="mt-7 font-display text-[3.1rem] font-extrabold leading-[0.98] tracking-[-0.055em] text-foreground sm:text-7xl lg:text-[5.1rem] xl:text-[5.5rem]">
                Learn science<br />by <span className="brand-gradient-text">doing it.</span>
              </h1>
              <p className="mt-5 max-w-xl font-display text-2xl italic leading-[1.2] text-foreground/85 sm:text-[1.7rem]">Learn beyond the classroom. Build beyond the textbook.</p>
              <p className="mt-5 max-w-xl text-[0.94rem] leading-7 text-muted-foreground">Project Polaris is a hands-on aerospace education and science learning platform with practical engineering courses, STEM workshops, computational physics simulations, and student build projects.</p>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link href="/courses" className="press inline-flex items-center gap-2 rounded-full bg-[image:var(--grad-brand)] px-5 py-3 font-mono text-[0.67rem] font-semibold tracking-[0.04em] text-[#0b0910] shadow-lg shadow-primary/20 hover:brightness-110">Explore Learning <ArrowRight className="h-3.5 w-3.5" /></Link>
                <Link href="/courses?type=workshop" className="press inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 font-mono text-[0.67rem] font-medium text-foreground transition-colors hover:border-primary/45 hover:bg-primary/10">Upcoming Workshops <ArrowUpRight className="h-3.5 w-3.5 text-primary" /></Link>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.57rem] tracking-[0.03em] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Workshops <span>·</span> Courses <span>·</span> Bootcamps <span>·</span> Projects <span className="ml-2 text-primary">·</span> <span className="text-primary">Four ways to build</span></div>
            </div>
            <div className="fade-up [animation-delay:100ms] lg:pt-3">
              <AeroForgeSimulator compact />
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-[var(--surface)] px-4 py-12 sm:px-6 sm:py-16">
          <div className="container">
            <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-success" /><span className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.13em] text-foreground">What&apos;s happening now</span><span className="font-mono text-[0.6rem] text-muted-foreground">— Learn something new this week</span></div>
              <Link href="/courses" className="inline-flex items-center gap-1 font-mono text-[0.63rem] text-primary hover:text-gold">View full calendar <ArrowRight className="h-3 w-3" /></Link>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {HAPPENING_NOW.map((item, index) => {
                const Icon = index === 0 ? Rocket : index === 1 ? GraduationCap : Sparkles;
                return <article key={item.title} className="group flex min-h-60 flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl hover:shadow-primary/5"><div className="flex items-center justify-between"><span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-mono text-[0.55rem] uppercase tracking-[0.08em] ${index === 0 ? "bg-violet-500/10 text-violet-300" : index === 1 ? "bg-cyan-400/10 text-cyan-300" : "bg-amber-400/10 text-amber-300"}`}><Icon className="h-2.5 w-2.5" />{item.badge}</span><span className="font-mono text-[0.57rem] text-muted-foreground">{item.meta}</span></div><h3 className="mt-5 font-display text-xl font-bold leading-tight text-foreground">{item.title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{item.tagline}</p><p className="mt-3 font-mono text-[0.58rem] leading-5 text-primary">{item.detail}</p><div className="mt-auto flex items-center justify-between gap-3 pt-5"><span className="font-mono text-[0.57rem] text-muted-foreground">{item.footnote}</span><Link href={item.href} className="press rounded-full bg-primary px-3 py-2 font-mono text-[0.58rem] font-semibold text-primary-foreground">{item.cta} →</Link></div></article>;
              })}
            </div>
          </div>
        </section>

        <section className="container px-4 py-20 sm:px-6 sm:py-28">
          <div className="text-center"><p className="eyebrow">The learning ladder</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.045em] text-foreground sm:text-5xl">How do you want to learn?</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Four distinct formats tailored to your pace, depth, and engineering ambition.</p></div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {LEARNING_LADDER.map((item, index) => <Link key={item.title} href={item.href} className="group relative flex min-h-[292px] flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/45 hover:shadow-xl hover:shadow-primary/5"><span className="absolute right-0 top-0 h-20 w-20 rounded-bl-[4rem] bg-primary/5 transition-transform duration-500 group-hover:scale-150" /><div className="flex items-center justify-between font-mono text-[0.61rem]"><span className="text-primary">{item.index}</span><span className="text-muted-foreground">{item.duration}</span></div><h3 className="mt-7 font-display text-2xl font-bold text-foreground">{item.title}</h3><p className="mt-1.5 font-mono text-[0.6rem] text-gold">{item.subtitle}</p><p className="mt-4 text-sm leading-6 text-muted-foreground">{item.description}</p><span className="mt-auto inline-flex items-center gap-1 font-mono text-[0.63rem] font-medium text-primary">{item.cta} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span></Link>)}
          </div>
        </section>

        <section className="border-y border-border bg-[var(--surface)] py-20 sm:py-28">
          <div className="container px-4 sm:px-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="eyebrow">Catalog explorer</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.045em] text-foreground sm:text-5xl">Explore by Topic</h2><p className="mt-3 text-sm text-muted-foreground">Science, aerospace, astrophysics, programming, and computational simulation.</p></div><Link href="/courses" className="inline-flex items-center gap-1 font-mono text-[0.65rem] text-primary hover:text-gold">Browse All ({CATALOG.length}) <ArrowRight className="h-3.5 w-3.5" /></Link></div>
            <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-2">{["All Domains", ...Object.keys(domainIcons)].map(name => { const Icon = domainIcons[name]; return <button key={name} type="button" onClick={() => setDomain(name)} className={`press inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 font-mono text-[0.6rem] transition-colors ${domain === name ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"}`}>{Icon && <Icon className="h-3 w-3" />}{name}</button>; })}</div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{previewItems.map(item => <CatalogCard key={item.slug} item={item} />)}</div>
          </div>
        </section>

        <section className="container px-4 py-20 sm:px-6 sm:py-28"><div className="grid gap-9 lg:grid-cols-[0.75fr_1.25fr]"><div><p className="eyebrow">Personalized pathways</p><h2 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-foreground sm:text-5xl">Not sure where to start?</h2><p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">Choose the statement that fits your current time and learning goal.</p></div><div className="grid gap-3">{PATHWAYS.map((item, index) => <Link key={item.title} href={item.href} className="group grid gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/45 hover:bg-primary/5 sm:grid-cols-[1.4fr_0.6fr_1fr_auto] sm:items-center sm:p-5"><div><p className="font-mono text-[0.59rem] uppercase tracking-[0.08em] text-primary">{item.statement}</p><h3 className="mt-1.5 font-display text-xl font-bold text-foreground">{item.title}</h3></div><span className="font-mono text-[0.6rem] text-gold">{item.meta}</span><p className="text-xs leading-5 text-muted-foreground">{item.description}</p><ChevronRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-1" /></Link>)}</div></div></section>

        <section className="border-y border-border bg-[var(--surface)] py-20 sm:py-28"><div className="container px-4 sm:px-6"><div className="mb-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="eyebrow">Polaris learning lab | 40+ numerical physics solvers</p><h2 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-foreground sm:text-5xl">Learn aerospace engineering by actually experimenting with it.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">AeroForge is Polaris&apos;s computational physics lab. Practice fluid mechanics, transonic airfoil CFD, structural FEA, and orbital Keplerian dynamics directly in your browser.</p></div><div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 font-mono text-[0.58rem] text-primary"><FlaskConical className="h-3.5 w-3.5" />Interactive, analytical, explainable</div></div><AeroForgeSimulator onSave={() => {}} /><nav aria-label="Continue your Project Polaris learning path" className="mt-7 rounded-2xl border border-border bg-card/60 px-5 py-4 text-sm leading-7 text-muted-foreground">Continue from the simulation lab with <Link href="/courses" className="font-medium text-primary hover:text-gold">aerospace engineering courses</Link>, collaborative <Link href="/projects" className="font-medium text-primary hover:text-gold">student engineering projects</Link>, free <Link href="/resources" className="font-medium text-primary hover:text-gold">science learning resources</Link>, or <Link href="/pricing" className="font-medium text-primary hover:text-gold">Project Polaris membership plans</Link>.</nav></div></section>

        <section className="border-b border-border bg-[var(--surface-2)]"><div className="container grid gap-y-8 px-4 py-14 text-center sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:py-16">{STATS.map(stat => <div key={stat.label} className="px-3"><p className="font-mono text-3xl font-bold tracking-[-0.05em] text-primary">{stat.value}</p><p className="mt-2 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-foreground">{stat.label}</p><p className="mx-auto mt-2 max-w-36 text-xs leading-5 text-muted-foreground">{stat.description}</p></div>)}</div></section>

        <section className="starfield aurora overflow-hidden px-4 py-20 sm:px-6 sm:py-28"><div className="container relative overflow-hidden rounded-3xl border border-primary/20 bg-card px-6 py-14 text-center shadow-2xl shadow-primary/10 sm:px-12"><div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" /><div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl" /><div className="relative"><p className="eyebrow">Start learning</p><h2 className="mx-auto mt-3 max-w-2xl font-display text-4xl font-bold tracking-[-0.045em] text-foreground sm:text-5xl">Ready to learn something new?</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">Join workshops with scientists, take practical mini-courses, run real simulations, or build engineering projects with peers.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/courses" className="press inline-flex items-center gap-2 rounded-full bg-[image:var(--grad-brand)] px-5 py-3 font-mono text-[0.67rem] font-semibold text-[#0b0910]">Explore Learning Catalog <ArrowRight className="h-3.5 w-3.5" /></Link><Link href={isAuthenticated ? "/portal" : "/auth"} className="press inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 font-mono text-[0.67rem] text-foreground hover:border-primary/50 hover:bg-primary/10">{isAuthenticated ? "Open Student Workspace" : "Initialize Workspace"} <UsersRound className="h-3.5 w-3.5 text-primary" /></Link></div></div></div></section>
      </main>
      <SiteFooter />
      <ScrollToTop />
    </div>
  );
}
