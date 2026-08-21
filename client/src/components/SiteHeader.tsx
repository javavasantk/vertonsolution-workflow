import { useTheme } from "@/contexts/ThemeContext";
import {
  ChevronDown,
  Command,
  Menu,
  Moon,
  Rocket,
  Sparkles,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { PolarisLogo } from "./PolarisLogo";

type MenuItem = { label: string; description: string; href: string; icon: typeof Rocket };

const NAV_MENUS: { label: string; items: MenuItem[] }[] = [
  {
    label: "Learn",
    items: [
      {
        label: "Learning Catalog",
        description: "Workshops, mini-courses and bootcamps",
        href: "/courses",
        icon: Sparkles,
      },
      {
        label: "Free Resources",
        description: "Guides, primers and solver blueprints",
        href: "/resources",
        icon: Command,
      },
      {
        label: "Programs & Cohorts",
        description: "Structured learning sprints",
        href: "/programs",
        icon: Rocket,
      },
    ],
  },
  {
    label: "Build",
    items: [
      {
        label: "AeroForge Lab",
        description: "Interactive physics simulation workstation",
        href: "/aeroforge",
        icon: Command,
      },
      {
        label: "Build Squads",
        description: "Ship open engineering systems",
        href: "/projects",
        icon: Rocket,
      },
      {
        label: "Student Showcase",
        description: "Verified artifacts from the community",
        href: "/showcase",
        icon: Sparkles,
      },
    ],
  },
  {
    label: "Community",
    items: [
      {
        label: "Research Digest",
        description: "Peer-reviewed technical inquiry",
        href: "/research",
        icon: Command,
      },
      {
        label: "For Schools",
        description: "Bring a Polaris lab to your campus",
        href: "/schools",
        icon: Sparkles,
      },
      {
        label: "About Polaris",
        description: "Our mission and student-led team",
        href: "/about",
        icon: Rocket,
      },
    ],
  },
];

function DesktopDropdown({ menu }: { menu: (typeof NAV_MENUS)[number] }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const openMenu = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const queueClose = () => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="relative" onMouseEnter={openMenu} onMouseLeave={queueClose}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="press inline-flex items-center gap-1 rounded-md px-2 py-1.5 font-mono text-[0.65rem] tracking-[0.05em] text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
        aria-expanded={open}
      >
        {menu.label}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-1/2 top-[calc(100%+0.75rem)] z-50 w-80 -translate-x-1/2 rounded-2xl border border-[var(--glass-border)] bg-popover/95 p-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-[var(--glass-border)] bg-popover" />
          <div className="relative space-y-1">
            {menu.items.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-primary/10"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-foreground">{item.label}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => setMobileOpen(false), [location]);

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
      <nav className="glass mx-auto flex max-w-[1180px] items-center justify-between rounded-full px-3 py-2 shadow-xl shadow-black/15 sm:px-4">
        <PolarisLogo />

        <div className="hidden items-center gap-1 lg:flex">
          {NAV_MENUS.map(menu => (
            <DesktopDropdown key={menu.label} menu={menu} />
          ))}
          <Link
            href="/showcase"
            className="rounded-md px-2 py-1.5 font-mono text-[0.65rem] tracking-[0.05em] text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
          >
            Showcase
          </Link>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title={`Theme: ${theme === "dark" ? "Dark" : "Light"}`}
            onClick={toggleTheme}
            className="press flex h-8 w-8 items-center justify-center rounded-full border border-border bg-secondary/50 text-primary transition-colors hover:bg-primary/15"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <Link
            href="/portal"
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 font-mono text-[0.65rem] tracking-[0.03em] text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
          >
            <UserRound className="h-3.5 w-3.5 text-primary" />
            Workspace
          </Link>
          <Link
            href="/pricing"
            className="press inline-flex items-center gap-1 rounded-full bg-[image:var(--grad-brand)] px-3.5 py-2 font-mono text-[0.64rem] font-semibold tracking-[0.04em] text-[#08070d] shadow-lg shadow-primary/20 transition-shadow hover:shadow-primary/40"
          >
            Join Polaris <span aria-hidden>↗</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            onClick={toggleTheme}
            className="press flex h-8 w-8 items-center justify-center rounded-full border border-border text-primary"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(v => !v)}
            className="press flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="glass mx-auto mt-2 max-w-[1180px] rounded-2xl p-3 shadow-2xl shadow-black/25 md:hidden">
          <div className="grid gap-1">
            {NAV_MENUS.flatMap(menu => menu.items).map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-primary/10"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">{item.label}</span>
                </Link>
              );
            })}
            <Link href="/showcase" className="rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-primary/10">
              Student Showcase
            </Link>
            <Link href="/portal" className="rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-primary/10">
              Student Workspace
            </Link>
            <Link href="/pricing" className="mt-1 rounded-xl bg-[image:var(--grad-brand)] px-3 py-3 text-center font-mono text-xs font-semibold text-[#08070d]">
              Join Polaris ↗
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
