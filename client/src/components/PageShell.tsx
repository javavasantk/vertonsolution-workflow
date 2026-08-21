import { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { ScrollToTop } from "./ScrollToTop";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className = "" }: PageShellProps) {
  return (
    <div className={`min-h-screen overflow-x-hidden bg-background text-foreground ${className}`}>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <ScrollToTop />
    </div>
  );
}

type PageHeroProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  children?: ReactNode;
  align?: "left" | "center";
};

export function PageHero({
  eyebrow,
  title,
  description,
  children,
  align = "left",
}: PageHeroProps) {
  const centered = align === "center";
  return (
    <section className="starfield aurora relative border-b border-border px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20">
      <div className={`container relative ${centered ? "text-center" : ""}`}>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className={`mt-4 font-display text-5xl font-bold leading-[0.98] tracking-[-0.055em] text-foreground sm:text-6xl lg:text-7xl ${centered ? "mx-auto max-w-4xl" : "max-w-4xl"}`}>
          {title}
        </h1>
        <p className={`mt-5 max-w-2xl text-[0.95rem] leading-7 text-muted-foreground ${centered ? "mx-auto" : ""}`}>
          {description}
        </p>
        {children && <div className={`mt-7 ${centered ? "flex justify-center" : ""}`}>{children}</div>}
      </div>
    </section>
  );
}
