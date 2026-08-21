import type { CatalogItem } from "@shared/content";
import { ArrowUpRight, Clock3, LockKeyhole, MapPin, Rocket } from "lucide-react";
import { Link } from "wouter";

const typeLabels = {
  workshop: "Workshop",
  course: "Mini Course",
  bootcamp: "Bootcamp",
  project: "Project",
};

const typeStyles = {
  workshop: "border-violet-300/20 bg-violet-500/10 text-violet-300",
  course: "border-cyan-300/20 bg-cyan-400/10 text-cyan-300",
  bootcamp: "border-amber-300/20 bg-amber-400/10 text-amber-300",
  project: "border-emerald-300/20 bg-emerald-400/10 text-emerald-300",
};

type CatalogCardProps = {
  item: CatalogItem;
  detailed?: boolean;
  className?: string;
};

export function CatalogCard({ item, detailed = false, className = "" }: CatalogCardProps) {
  const gated = item.requiredTier > 0;
  return (
    <article className={`group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-xl hover:shadow-primary/5 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-full border px-2.5 py-1 font-mono text-[0.58rem] font-medium uppercase tracking-[0.09em] ${typeStyles[item.type]}`}>
          {typeLabels[item.type]}
        </span>
        <span className="inline-flex items-center gap-1 font-mono text-[0.6rem] text-muted-foreground">
          <Clock3 className="h-3 w-3" /> {item.duration}
        </span>
      </div>

      <h3 className="mt-5 font-display text-xl font-bold leading-[1.14] tracking-[-0.02em] text-foreground sm:text-[1.35rem]">
        {item.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-primary">{item.tagline}</p>
      <p className={`mt-3 text-sm leading-6 text-muted-foreground ${detailed ? "" : "line-clamp-3"}`}>
        {item.description}
      </p>

      {item.lead && (
        <div className="mt-4 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
          <span className="font-mono text-[0.57rem] uppercase tracking-[0.08em] text-muted-foreground">Lead</span>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
            <strong className="text-foreground">{item.lead.name}</strong>
            <span className="font-mono text-[0.62rem] text-primary">{item.lead.affiliation}</span>
          </div>
        </div>
      )}

      {detailed && (
        <div className="mt-5">
          <p className="font-mono text-[0.58rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">What you learn & build</p>
          <ul className="mt-3 space-y-2">
            {item.outcomes.slice(0, 4).map(outcome => (
              <li key={outcome} className="flex gap-2 text-xs leading-5 text-muted-foreground">
                <span className="mt-[0.42rem] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {outcome}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto pt-5">
        <div className="flex flex-wrap gap-1.5">
          {item.domains.map(domain => (
            <span key={domain} className="rounded-md bg-secondary px-2 py-1 font-mono text-[0.56rem] text-muted-foreground">
              {domain}
            </span>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
          <span className="inline-flex items-center gap-1 font-mono text-[0.57rem] uppercase tracking-[0.09em] text-muted-foreground">
            {gated ? <LockKeyhole className="h-3 w-3 text-gold" /> : <MapPin className="h-3 w-3 text-success" />}
            {item.status}
          </span>
          <Link href={item.ctaHref} className="press inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-2 font-mono text-[0.62rem] font-semibold text-primary-foreground transition-all hover:brightness-110">
            {item.ctaLabel}
            {item.type === "project" ? <Rocket className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
          </Link>
        </div>
      </div>
    </article>
  );
}
