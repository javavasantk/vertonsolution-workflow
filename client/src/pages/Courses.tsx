import { CatalogCard } from "@/components/CatalogCard";
import { PageHero, PageShell } from "@/components/PageShell";
import { CATALOG, DOMAINS, type CatalogType, type Difficulty } from "@shared/content";
import { ArrowRight, BookOpenCheck, FilterX, Layers3, ListFilter, LockKeyhole, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

const formatFilters: { id: "all" | CatalogType; label: string }[] = [
  { id: "all", label: "All Formats" },
  { id: "workshop", label: "Workshops (60–90m)" },
  { id: "course", label: "Mini-Courses (2–7h)" },
  { id: "bootcamp", label: "Bootcamps (3–6w)" },
  { id: "project", label: "Projects & Labs" },
];

const difficultyFilters: { id: "all" | Difficulty; label: string }[] = [
  { id: "all", label: "All" },
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

export default function CoursesPage() {
  const initialType = new URLSearchParams(window.location.search).get("type") as CatalogType | null;
  const [format, setFormat] = useState<"all" | CatalogType>(
    initialType && formatFilters.some(filter => filter.id === initialType) ? initialType : "all"
  );
  const [domain, setDomain] = useState<string>("All Domains");
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      CATALOG.filter(item => {
        const formatMatch = format === "all" || item.type === format;
        const domainMatch = domain === "All Domains" || item.domains.includes(domain as never);
        const difficultyMatch = difficulty === "all" || item.difficulty === difficulty || item.difficulty === "all";
        return formatMatch && domainMatch && difficultyMatch;
      }),
    [format, domain, difficulty]
  );

  const reset = () => {
    setFormat("all");
    setDomain("All Domains");
    setDifficulty("all");
  };

  return (
    <PageShell>
      <PageHero
        eyebrow="The Polaris Learning Catalog"
        title={<>Learn science and engineering <span className="brand-gradient-text">by doing it.</span></>}
        description="Workshops, short courses, bootcamps and projects designed around demonstrable skills and real systems. Explorer members can browse every path; Builder unlocks complete course material and the full AeroForge lab."
      >
        <div className="flex flex-wrap gap-3">
          <Link href="/pricing" className="press inline-flex items-center gap-2 rounded-full bg-[image:var(--grad-brand)] px-4 py-2.5 font-mono text-[0.66rem] font-semibold text-[#0a0810]">Compare Memberships <ArrowRight className="h-3.5 w-3.5" /></Link>
          <Link href="/resources" className="press inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 font-mono text-[0.66rem] text-foreground hover:border-primary/45 hover:bg-primary/10">Browse Free Resources</Link>
        </div>
      </PageHero>

      <section className="container px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid gap-5 sm:grid-cols-2 xl:flex xl:flex-wrap xl:gap-x-7 xl:gap-y-5">
              <FilterGroup title="Learning Format" icon={Layers3}>
                {formatFilters.map(filter => <FilterChip key={filter.id} active={format === filter.id} onClick={() => setFormat(filter.id)}>{filter.label}</FilterChip>)}
              </FilterGroup>
              <FilterGroup title="Domain / Topic" icon={Sparkles}>
                {(["All Domains", ...DOMAINS] as string[]).map(filter => <FilterChip key={filter} active={domain === filter} onClick={() => setDomain(filter)}>{filter}</FilterChip>)}
              </FilterGroup>
              <FilterGroup title="Difficulty Level" icon={BookOpenCheck}>
                {difficultyFilters.map(filter => <FilterChip key={filter.id} active={difficulty === filter.id} onClick={() => setDifficulty(filter.id)}>{filter.label}</FilterChip>)}
              </FilterGroup>
            </div>
            <button type="button" onClick={reset} className="press inline-flex items-center gap-1.5 self-start rounded-full border border-border px-3 py-2 font-mono text-[0.6rem] text-muted-foreground transition-colors hover:border-primary/45 hover:bg-primary/10 hover:text-primary xl:self-auto"><FilterX className="h-3.5 w-3.5" />Reset filters</button>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4"><p className="font-mono text-[0.65rem] text-muted-foreground"><span className="text-primary">{filtered.length}</span> learning path{filtered.length === 1 ? "" : "s"} found</p><p className="hidden font-mono text-[0.6rem] text-muted-foreground sm:block">Locked paths display their required membership tier.</p></div>
        {filtered.length ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map(item => <div key={item.slug} className="relative"><CatalogCard item={item} detailed={expanded === item.slug} /><button type="button" onClick={() => setExpanded(current => current === item.slug ? null : item.slug)} className="press absolute bottom-5 left-5 font-mono text-[0.58rem] text-primary underline decoration-primary/30 underline-offset-4 hover:text-gold">{expanded === item.slug ? "Hide syllabus" : "Syllabus & info"}</button></div>)}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-secondary/25 px-6 py-16 text-center"><ListFilter className="mx-auto h-7 w-7 text-primary" /><h2 className="mt-4 font-display text-2xl font-bold text-foreground">No paths match this combination.</h2><p className="mt-2 text-sm text-muted-foreground">Try clearing a filter to explore the complete Polaris catalog.</p><button type="button" onClick={reset} className="press mt-5 rounded-full bg-primary px-4 py-2.5 font-mono text-[0.65rem] font-semibold text-primary-foreground">Reset filters</button></div>
        )}
      </section>

      <section className="border-t border-border bg-[var(--surface)] px-4 py-16 sm:px-6"><div className="container grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="eyebrow">Access model</p><h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.04em] text-foreground">Start free. Unlock depth when you are ready.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">Explorer keeps discovery open—browse the catalog, reserve workshops, and test starter solvers. Builder unlocks every mini-course, all 40+ AeroForge solvers, saved simulations and certificates. Squad Pro adds mentor review and cohort priority.</p></div><Link href="/pricing" className="press inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-mono text-[0.67rem] font-semibold text-primary-foreground">View membership plans <LockKeyhole className="h-3.5 w-3.5" /></Link></div></section>
    </PageShell>
  );
}

function FilterGroup({ title, icon: Icon, children }: { title: string; icon: typeof Layers3; children: React.ReactNode }) {
  return <div><p className="mb-2 flex items-center gap-1.5 font-mono text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground"><Icon className="h-3 w-3 text-primary" />{title}</p><div className="flex max-w-lg flex-wrap gap-1.5">{children}</div></div>;
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`press rounded-full border px-2.5 py-1.5 font-mono text-[0.56rem] transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/35 text-muted-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"}`}>{children}</button>;
}
