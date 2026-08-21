import { Github, Instagram, Linkedin, MessageCircle, Send } from "lucide-react";
import { Link } from "wouter";
import { SOCIAL_LINKS } from "@shared/content";
import { PolarisLogo } from "./PolarisLogo";

const footerColumns = [
  {
    title: "Explore",
    links: [
      ["Projects & AeroForge", "/projects"],
      ["Programs & Cohorts", "/programs"],
      ["Student Showcase", "/showcase"],
      ["Technical Research", "/research"],
      ["For Schools", "/schools"],
    ],
  },
  {
    title: "Organization",
    links: [
      ["About Polaris", "/about"],
      ["Student Workspace", "/portal"],
      ["Learning Catalog", "/courses"],
      ["Membership Plans", "/pricing"],
      ["Contact Us", "/contact"],
    ],
  },
  {
    title: "Legal & Policies",
    links: [
      ["Privacy Policy", "/privacy"],
      ["Terms & Conditions", "/terms"],
      ["Razorpay Payments", "/pricing#payments"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-[var(--surface)]">
      <div className="container py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.55fr_2fr]">
          <div>
            <PolarisLogo />
            <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
              Build real things. Learn along the way. Project Polaris is a student engineering ecosystem where students build simulations, software, research, and real-world systems.
            </p>
            <div className="mt-6 flex items-center gap-2.5">
              <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp community" className="press flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary">
                <MessageCircle className="h-3.5 w-3.5" />
              </a>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="press flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary">
                <Instagram className="h-3.5 w-3.5" />
              </a>
              <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="press flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary">
                <Linkedin className="h-3.5 w-3.5" />
              </a>
              <a href={SOCIAL_LINKS.github} target="_blank" rel="noreferrer" aria-label="GitHub" className="press flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary">
                <Github className="h-3.5 w-3.5" />
              </a>
              <Link href="/contact" aria-label="Contact Project Polaris" className="press flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary">
                <Send className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
            {footerColumns.map(column => (
              <div key={column.title}>
                <h3 className="font-mono text-[0.63rem] font-semibold uppercase tracking-[0.14em] text-foreground">
                  {column.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-border pt-6 font-mono text-[0.62rem] tracking-[0.04em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Project Polaris. Built for demonstrable learning.</span>
          <span className="flex gap-3">
            <Link href="/privacy" className="hover:text-primary">Privacy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-primary">Terms</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-primary">Contact</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
