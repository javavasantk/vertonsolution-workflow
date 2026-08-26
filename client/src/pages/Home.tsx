import {
  Activity,
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock3,
  FileCheck2,
  FileText,
  Gauge,
  Grid2X2,
  LockKeyhole,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  UserCog,
  UserRoundSearch,
  UsersRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type RoleKey =
  | "Administrator"
  | "Recruiter"
  | "HR & Compliance"
  | "Account Manager"
  | "Delivery Manager"
  | "Project Manager"
  | "Finance"
  | "Consultant";

type NavItem = {
  label: string;
  icon: LucideIcon;
  roles: RoleKey[];
};

const roles: { name: RoleKey; initials: string; description: string }[] = [
  { name: "Administrator", initials: "AD", description: "Controls, governance, and operating health" },
  { name: "Recruiter", initials: "RK", description: "Talent acquisition and submission flow" },
  { name: "HR & Compliance", initials: "HC", description: "People operations and reviewed readiness" },
  { name: "Account Manager", initials: "AM", description: "Client demand and account delivery" },
  { name: "Delivery Manager", initials: "DM", description: "Capacity, assignments, and redeployment" },
  { name: "Project Manager", initials: "PM", description: "Project delivery and team follow-through" },
  { name: "Finance", initials: "FN", description: "Time, billing-readiness, and operational controls" },
  { name: "Consultant", initials: "CT", description: "Personal tasks, time, and assignment visibility" },
];

const logoAssetUrl = "/manus-storage/verton-solutions-logo_81cf4419.jpg";

export function getRoleKeyFromStoredRole(role?: string | null): RoleKey {
  const roleMap: Record<string, RoleKey> = {
    admin: "Administrator",
    recruiter: "Recruiter",
    hr_compliance: "HR & Compliance",
    account_manager: "Account Manager",
    delivery_manager: "Delivery Manager",
    project_manager: "Project Manager",
    finance: "Finance",
    consultant: "Consultant",
    user: "Consultant",
  };
  return roleMap[role ?? "consultant"] ?? "Consultant";
}

const allRoles = roles.map(role => role.name);
export const navItems: NavItem[] = [
  { label: "Overview", icon: Grid2X2, roles: allRoles },
  { label: "Talent pipeline", icon: UserRoundSearch, roles: ["Administrator", "Recruiter", "Account Manager", "Delivery Manager"] },
  { label: "Readiness", icon: ShieldCheck, roles: ["Administrator", "HR & Compliance"] },
  { label: "Onboarding", icon: UserCheck, roles: ["Administrator", "HR & Compliance", "Delivery Manager", "Consultant"] },
  { label: "Delivery", icon: BriefcaseBusiness, roles: ["Administrator", "Account Manager", "Delivery Manager", "Project Manager", "Consultant"] },
  { label: "Time & billing", icon: Clock3, roles: ["Administrator", "Finance", "Project Manager", "Consultant"] },
  { label: "Controls", icon: LockKeyhole, roles: ["Administrator", "HR & Compliance", "Finance"] },
  { label: "Admin center", icon: UserCog, roles: ["Administrator"] },
  { label: "My profile", icon: UserCheck, roles: allRoles },
  { label: "New-hire progress", icon: TrendingUp, roles: ["Administrator", "Recruiter"] },
];

const storedRoleOptions = ["admin", "recruiter", "hr_compliance", "account_manager", "delivery_manager", "project_manager", "finance", "consultant"] as const;

function formatStoredRole(role?: string | null) {
  return getRoleKeyFromStoredRole(role);
}

function formatReadinessStatus(status?: string | null) {
  const labels: Record<string, string> = {
    not_started: "Not started",
    details_requested: "Update submitted",
    human_review: "Human review",
    verified: "Review complete",
    expiry_watch: "Expiry watch",
  };
  return labels[status ?? "not_started"] ?? "Not started";
}

export function getAllowedNavigation(role: RoleKey) {
  return navItems.filter(item => item.roles.includes(role));
}

export function resolveWorkspacePage(role: RoleKey, requestedPage: string) {
  return getAllowedNavigation(role).some(item => item.label === requestedPage) ? requestedPage : "Overview";
}

export function countCompletedOnboardingTasks(tasks: Array<{ done: boolean }>) {
  return tasks.filter(task => task.done).length;
}

export function isFinanceRole(role: RoleKey) {
  return role === "Finance";
}

const candidates = [
  { name: "Priya Shah", initials: "PS", role: "Data Engineer", skills: "Python · Snowflake · dbt", stage: "Client interview", owner: "R. Kim", updated: "18 min ago", tone: "blue" },
  { name: "Owen Miller", initials: "OM", role: "Cloud Architect", skills: "Azure · Terraform · Kubernetes", stage: "Submitted", owner: "J. Patel", updated: "42 min ago", tone: "violet" },
  { name: "Lena Garcia", initials: "LG", role: "QA Automation Lead", skills: "Playwright · Cypress · API", stage: "Screening", owner: "R. Kim", updated: "1 hr ago", tone: "teal" },
  { name: "Noah Williams", initials: "NW", role: "SAP S/4HANA Analyst", skills: "S/4HANA · FI/CO · Fiori", stage: "Offer review", owner: "M. Chen", updated: "2 hrs ago", tone: "amber" },
];

const demands = [
  { title: "Lead Data Engineer", client: "Northstar Retail", stage: "3 screened", priority: "Priority", days: "3d open" },
  { title: "Platform Reliability Engineer", client: "Arcfield Health", stage: "1 submitted", priority: "Priority", days: "6d open" },
  { title: "ERP Integration Consultant", client: "Moraine Foods", stage: "Talent mapping", priority: "Standard", days: "1d open" },
];

const assignments = [
  { person: "Mia Chen", role: "Delivery Lead", project: "Modern Commerce Platform", client: "Northstar Retail", status: "Active", end: "Sep 30", utilization: "100%" },
  { person: "Andre Brooks", role: "Cloud Engineer", project: "Care Data Exchange", client: "Arcfield Health", status: "Extension review", end: "Aug 31", utilization: "100%" },
  { person: "Tara Iyer", role: "Business Analyst", project: "Supply Chain Intelligence", client: "Moraine Foods", status: "Rolling off", end: "Sep 06", utilization: "80%" },
];

const complianceRecords = [
  { name: "Priya Shah", category: "Work authorization", state: "Review complete", date: "Nov 14, 2026", risk: "Ready" },
  { name: "Owen Miller", category: "Document request", state: "Reviewer action", date: "Sep 03, 2026", risk: "Action due" },
  { name: "Lena Garcia", category: "Policy acknowledgement", state: "Complete", date: "—", risk: "Ready" },
  { name: "Noah Williams", category: "Expiry watch", state: "Human review", date: "Oct 01, 2026", risk: "Review" },
];

const onboardingDefaults = [
  { title: "Confirm personal profile", detail: "Contact details, emergency contact, and location", done: true, owner: "Consultant" },
  { title: "Acknowledge workplace policies", detail: "Information security and code of conduct", done: true, owner: "Consultant" },
  { title: "Complete requested documents", detail: "Secure upload and reviewer confirmation", done: false, owner: "Consultant" },
  { title: "Provision project access", detail: "Identity, tools, and client-access request", done: false, owner: "IT Operations" },
  { title: "Manager start confirmation", detail: "First-week plan and orientation check-in", done: false, owner: "Manager" },
];

const onboardingPersonas = [
  { name: "Mia Chen", role: "Delivery Lead", context: "Modern Commerce Platform · starts Sep 02", tasks: onboardingDefaults },
  { name: "Andre Brooks", role: "Cloud Engineer", context: "Care Data Exchange · extension confirmed", tasks: onboardingDefaults.map((task, index) => ({ ...task, done: index < 4, owner: index === 4 ? "Delivery Manager" : task.owner })) },
  { name: "Lena Garcia", role: "QA Automation Lead", context: "Arcfield Health · start readiness in progress", tasks: onboardingDefaults.map((task, index) => ({ ...task, done: index < 1, owner: index === 3 ? "IT Operations" : task.owner })) },
];

const auditRows = [
  { event: "Readiness record viewed", actor: "H. Lawson · Compliance", target: "Priya Shah", time: "Today, 10:16 AM" },
  { event: "Assignment extension requested", actor: "M. Chen · Delivery", target: "Andre Brooks", time: "Today, 9:42 AM" },
  { event: "Time entry approved", actor: "C. Ortiz · Project", target: "Modern Commerce Platform", time: "Today, 9:18 AM" },
  { event: "Candidate submitted", actor: "R. Kim · Recruiting", target: "Lead Data Engineer", time: "Yesterday, 4:36 PM" },
];

const toneStyles: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700",
  violet: "bg-violet-100 text-violet-700",
  teal: "bg-teal-100 text-teal-700",
  amber: "bg-amber-100 text-amber-800",
};

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-[54px] items-center justify-center overflow-hidden rounded-lg ${dark ? "bg-white shadow-sm" : "bg-white ring-1 ring-[#dce7f3]"}`}><img src={logoAssetUrl} alt="Verton Solutions, Inc." className="h-full w-full object-contain" /></div>
      <div className="leading-none">
        <p className={`text-[13px] font-extrabold tracking-[-0.03em] ${dark ? "text-white" : "text-[#12345a]"}`}>Workforce Hub</p>
        <p className={`mt-1 text-[8px] font-bold uppercase tracking-[0.2em] ${dark ? "text-blue-200" : "text-[#5a7190]"}`}>Verton Solutions</p>
      </div>
    </div>
  );
}

function Pill({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "green" | "amber" | "slate" | "red" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-800 ring-amber-100",
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
    red: "bg-rose-50 text-rose-700 ring-rose-100",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${tones[tone]}`}>{children}</span>;
}

function StatCard({ label, value, note, icon: Icon, accent = "blue" }: { label: string; value: string; note: string; icon: LucideIcon; accent?: "blue" | "teal" | "amber" | "violet" }) {
  const accents = {
    blue: "bg-blue-50 text-blue-700",
    teal: "bg-teal-50 text-teal-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return (
    <div className="rounded-2xl border border-[#dce7f3] bg-white p-4 shadow-[0_5px_16px_rgba(18,52,90,.04)] transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold text-[#607795]">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${accents[accent]}`}><Icon size={16} strokeWidth={2.25} /></span>
      </div>
      <p className="mt-4 text-2xl font-extrabold tracking-[-0.06em] text-[#12345a]">{value}</p>
      <p className="mt-1.5 text-[11px] font-medium text-[#6d829d]">{note}</p>
    </div>
  );
}

function Landing({ launchWorkspace }: { launchWorkspace: () => void }) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f8fbff] text-[#12345a]">
      <header className="relative z-20 border-b border-[#e5edf6]/70 bg-[#f8fbff]/85 backdrop-blur-xl">
        <div className="container flex h-[76px] items-center justify-between gap-5">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#4f6684] md:flex">
            <a href="#platform" className="transition-colors hover:text-[#0b57d0]">Platform</a>
            <a href="#operating-model" className="transition-colors hover:text-[#0b57d0]">Operating model</a>
            <a href="#roles" className="transition-colors hover:text-[#0b57d0]">Workspaces</a>
          </nav>
          <button onClick={launchWorkspace} className="rounded-xl bg-[#0b57d0] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(11,87,208,.2)] transition hover:-translate-y-0.5 hover:bg-[#094db9] active:scale-[.97]">
            Explore live demo <ArrowRight className="ml-1.5 inline" size={16} />
          </button>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden bg-[#08254a] pb-20 pt-16 text-white md:pb-28 md:pt-24">
          <div className="verton-grid absolute inset-0 opacity-60" />
          <div className="absolute -right-24 top-0 h-[540px] w-[540px] rounded-full bg-[#1260d9]/40 blur-[110px]" />
          <div className="absolute bottom-[-140px] left-[22%] h-[330px] w-[330px] rounded-full bg-[#13b79d]/20 blur-[90px]" />
          <div className="container relative">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-100">
                <Sparkles size={14} className="text-[#6be6d4]" /> Verton Solutions · Operations platform
              </div>
              <h1 className="text-balance mt-7 text-4xl font-extrabold tracking-[-0.065em] text-white sm:text-5xl md:text-6xl lg:text-[68px] lg:leading-[1.02]">
                Consulting operations, <span className="text-[#73dfd0]">in command.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-7 text-blue-100/80 md:text-lg">
                Workforce Hub connects talent, people operations, client demand, project delivery, and billing readiness in one elegant operating environment.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <button onClick={launchWorkspace} className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0b57d0] shadow-[0_16px_30px_rgba(0,0,0,.2)] transition hover:-translate-y-0.5 active:scale-[.97]">
                  Open interactive workspace <ArrowRight className="ml-1 inline" size={16} />
                </button>
                <a href="#platform" className="rounded-xl border border-white/20 bg-white/6 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/12">Explore capabilities</a>
              </div>
            </div>

            <div className="card-glow relative mx-auto mt-14 max-w-6xl overflow-hidden rounded-[24px] border border-white/10 bg-[#f8fbff] p-3 text-[#12345a] md:mt-16 md:p-4">
              <div className="flex h-10 items-center gap-2 rounded-t-[16px] border-b border-[#e7edf5] bg-white px-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffbf5b]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#63d5bd]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#74a9fb]" />
                <div className="ml-3 h-5 w-44 rounded-md bg-[#edf3fa]" />
                <div className="ml-auto rounded-md bg-[#edf3fa] px-2 py-1 font-mono-ui text-[9px] text-[#66809f]">LIVE OPERATING VIEW</div>
              </div>
              <div className="grid gap-3 p-3 md:grid-cols-[170px_1fr] md:p-4">
                <div className="hidden rounded-xl bg-[#09264b] p-4 text-white md:block">
                  <Logo dark />
                  <div className="mt-9 space-y-2">
                    {["Overview", "Talent pipeline", "Readiness", "Delivery"].map((item, index) => <div key={item} className={`rounded-lg px-3 py-2 text-[10px] font-bold ${index === 0 ? "bg-white/12 text-white" : "text-blue-200/70"}`}>{item}</div>)}
                  </div>
                  <div className="mt-9 rounded-lg border border-white/10 bg-white/5 p-3"><p className="text-[9px] uppercase tracking-widest text-blue-200/70">Deployment health</p><p className="mt-2 text-xl font-extrabold">92%</p><p className="mt-1 text-[9px] text-[#7ce3d6]">On-track portfolio</p></div>
                </div>
                <div className="soft-grid rounded-xl bg-[#f6faff] p-3 md:p-5">
                  <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#66809f]">Tuesday, August 26</p><h2 className="mt-1 text-lg font-extrabold tracking-[-.04em]">Your operational pulse</h2></div><div className="grid h-9 w-9 place-items-center rounded-full bg-[#dff8f2] text-[#087b6a]"><Activity size={17} /></div></div>
                  <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
                    {[['Open demand', '12', '#e5efff'], ['Interviews', '07', '#e8f9f6'], ['At-risk actions', '04', '#fff3db'], ['Utilization', '87%', '#f1edff']].map(([label, value, bg]) => <div key={label} className="rounded-xl bg-white p-3 shadow-sm"><p className="text-[9px] font-bold text-[#7185a0]">{label}</p><p className="mt-2 text-xl font-extrabold tracking-[-.06em]" style={{ color: '#12345a' }}>{value}</p><span className="mt-2 block h-1.5 rounded-full" style={{ width: label === 'Utilization' ? '87%' : '64%', backgroundColor: bg }} /></div>)}
                  </div>
                  <div className="mt-3 grid gap-3 lg:grid-cols-[1.3fr_.7fr]">
                    <div className="rounded-xl bg-white p-3 shadow-sm"><div className="flex justify-between"><p className="text-[10px] font-bold text-[#4f6684]">Recruiting flow</p><span className="text-[9px] text-[#0b57d0]">View pipeline</span></div><div className="mt-5 flex h-20 items-end gap-2">{[42, 68, 51, 84, 63, 92, 74, 100].map((height, i) => <span key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-[#0b57d0] to-[#67a1ff]" style={{ height: `${height}%`, opacity: i === 7 ? 1 : .55 }} />)}</div></div>
                    <div className="rounded-xl bg-[#09264b] p-3 text-white shadow-sm"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-blue-200">Next action</p><p className="mt-3 text-sm font-bold leading-5">Review 2 readiness records</p><div className="mt-4 flex items-center gap-2 text-[10px] text-[#74e1d3]"><CheckCircle2 size={13} /> Owner assigned</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="container py-18 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
            <div><p className="font-mono-ui text-[11px] font-medium uppercase tracking-[.16em] text-[#0b57d0]">One operating system</p><h2 className="text-balance mt-4 text-3xl font-extrabold tracking-[-.055em] text-[#12345a] md:text-4xl">From talent signal to successful delivery.</h2></div>
            <p className="max-w-xl text-sm leading-7 text-[#627997]">Built for Verton’s consulting operations, Workforce Hub makes the work visible across recruiting, people operations, account delivery, assignments, time, and operational controls—without compromising the privacy boundaries that matter.</p>
          </div>
          <div className="mt-11 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              [UserRoundSearch, "Talent orchestration", "Searchable talent profiles, screening, submission packages, interviews, offers, and recruiter activity in a connected pipeline."],
              [ShieldCheck, "Human-reviewed readiness", "Restricted checklists, expiry awareness, review states, and audit-friendly access. No automated eligibility determinations."],
              [BriefcaseBusiness, "Delivery command", "Connect demand, projects, people, availability, extensions, roll-offs, and redeployment opportunities."],
              [Gauge, "Operational intelligence", "Use an executive view of funnel health, active work, exceptions, utilization, and upcoming decisions."],
            ].map(([Icon, title, body]) => { const FeatureIcon = Icon as LucideIcon; return <div key={title as string} className="rounded-2xl border border-[#dce7f3] bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_16px_32px_rgba(18,52,90,.09)]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf2ff] text-[#0b57d0]"><FeatureIcon size={19} /></span><h3 className="mt-6 text-base font-extrabold tracking-[-.03em]">{title as string}</h3><p className="mt-3 text-sm leading-6 text-[#667d9a]">{body as string}</p></div>;
            })}
          </div>
        </section>

        <section id="operating-model" className="bg-[#eaf3fe] py-18 md:py-24">
          <div className="container"><div className="mx-auto max-w-2xl text-center"><p className="font-mono-ui text-[11px] font-medium uppercase tracking-[.16em] text-[#0b57d0]">A connected operating model</p><h2 className="text-balance mt-4 text-3xl font-extrabold tracking-[-.055em] md:text-4xl">Every handoff is visible. Every owner is clear.</h2></div><div className="mt-12 grid gap-3 md:grid-cols-5">
            {[['01', 'Source & screen', 'Build a qualified talent signal.'], ['02', 'Review & prepare', 'Complete controlled readiness tasks.'], ['03', 'Submit & staff', 'Match demand with the right team.'], ['04', 'Deliver & approve', 'Keep time, work, and decisions moving.'], ['05', 'Extend & redeploy', 'Protect continuity and retain capability.']].map(([number, title, body], index) => <div key={title} className="relative rounded-2xl bg-white p-5 shadow-[0_8px_22px_rgba(18,52,90,.06)]"><p className="font-mono-ui text-[10px] font-medium text-[#0b57d0]">{number}</p><h3 className="mt-5 text-sm font-extrabold">{title}</h3><p className="mt-2 text-xs leading-5 text-[#6d829d]">{body}</p>{index < 4 && <ChevronRight className="absolute -right-5 top-[44%] z-10 hidden h-7 w-7 rounded-full bg-[#0b57d0] p-1.5 text-white shadow-lg md:block" />}</div>)}
          </div></div>
        </section>

        <section id="roles" className="container py-18 md:py-24"><div className="grid gap-10 lg:grid-cols-[1fr_.8fr]"><div><p className="font-mono-ui text-[11px] font-medium uppercase tracking-[.16em] text-[#0b57d0]">A workspace for every role</p><h2 className="text-balance mt-4 max-w-xl text-3xl font-extrabold tracking-[-.055em] md:text-4xl">One source of truth. Purpose-built points of view.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-[#627997]">Give each role only the information and actions needed to move the work forward. Sensitive data stays visible only where a legitimate, approved business need exists.</p><button onClick={launchWorkspace} className="mt-8 rounded-xl bg-[#0b57d0] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(11,87,208,.2)] transition hover:-translate-y-0.5 active:scale-[.97]">Explore role workspaces <ArrowRight className="ml-1 inline" size={16} /></button></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
          {roles.map(role => <div key={role.name} className="rounded-2xl border border-[#dce7f3] bg-[#fbfdff] p-4"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#dfeeff] text-xs font-extrabold text-[#0b57d0]">{role.initials}</span><p className="mt-5 text-xs font-extrabold leading-5">{role.name}</p><p className="mt-1.5 text-[10px] leading-4 text-[#7185a0]">{role.description}</p></div>)}
        </div></div></section>

        <section className="container pb-16 md:pb-24"><div className="relative overflow-hidden rounded-[26px] bg-[#0b57d0] px-6 py-10 text-center text-white md:px-12 md:py-14"><div className="verton-grid absolute inset-0 opacity-50" /><div className="relative"><p className="font-mono-ui text-[10px] font-medium uppercase tracking-[.18em] text-blue-100">Workforce Hub demo</p><h2 className="text-balance mx-auto mt-4 max-w-2xl text-3xl font-extrabold tracking-[-.055em] md:text-4xl">See the operating system behind modern consulting delivery.</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-blue-100">Explore a role-aware product demo with clearly labeled representative data and human-controlled readiness workflows.</p><button onClick={launchWorkspace} className="mt-7 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0b57d0] shadow-lg transition hover:-translate-y-0.5 active:scale-[.97]">Launch workforce hub <ArrowRight className="ml-1 inline" size={16} /></button></div></div></section>
      </main>

      <footer className="border-t border-[#e2ebf5] bg-white"><div className="container flex flex-col gap-4 py-7 text-xs text-[#7185a0] sm:flex-row sm:items-center sm:justify-between"><Logo /><p>© 2026 Verton Solutions, Inc. · Workforce Hub</p><p className="font-medium">Built for thoughtful IT consulting operations.</p></div></footer>
    </div>
  );
}

function Login({ returnToLanding, openWorkspace }: { returnToLanding: () => void; openWorkspace: () => void }) {
  const { isAuthenticated, loading, user } = useAuth();
  const previewLogin = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "login";

  useEffect(() => {
    if (isAuthenticated && !previewLogin) openWorkspace();
  }, [isAuthenticated, openWorkspace, previewLogin]);

  return <div className="min-h-screen overflow-hidden bg-[#f7faff] text-[#12345a]"><div className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]"><section className="relative hidden overflow-hidden bg-[#09264b] p-10 text-white lg:flex lg:flex-col"><div className="verton-grid absolute inset-0 opacity-60" /><div className="absolute -right-20 top-20 h-96 w-96 rounded-full bg-[#0b57d0]/35 blur-[100px]" /><div className="relative"><Logo dark /><div className="mt-24 max-w-md"><p className="font-mono-ui text-[11px] font-medium uppercase tracking-[.18em] text-[#78e2d4]">Secure workforce operations</p><h1 className="mt-5 text-balance text-5xl font-extrabold tracking-[-.065em]">One controlled access point for the work that moves Verton forward.</h1><p className="mt-6 text-sm leading-7 text-blue-100/78">Your account assignment determines the workspace, actions, and data available to you. Every sensitive workflow remains role-scoped and auditable.</p></div></div><div className="relative mt-auto grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/6 p-4"><ShieldCheck className="text-[#78e2d4]" size={18} /><p className="mt-4 text-xs font-bold">Role-scoped visibility</p><p className="mt-1 text-[10px] leading-4 text-blue-100/65">Access follows your account assignment.</p></div><div className="rounded-2xl border border-white/10 bg-white/6 p-4"><FileCheck2 className="text-[#78e2d4]" size={18} /><p className="mt-4 text-xs font-bold">Accountable operations</p><p className="mt-1 text-[10px] leading-4 text-blue-100/65">Material activity is captured in context.</p></div></div></section><section className="relative flex items-center justify-center px-5 py-10 sm:px-8"><button onClick={returnToLanding} className="absolute left-5 top-5 flex items-center gap-2 text-xs font-bold text-[#5d7593] transition hover:text-[#0b57d0]"><ArrowRight className="rotate-180" size={15} /> Back to Verton</button><div className="w-full max-w-md"><div className="lg:hidden"><Logo /></div><div className="mt-16 rounded-[24px] border border-[#dce7f3] bg-white p-6 shadow-[0_22px_50px_rgba(18,52,90,.10)] sm:p-8"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f2ff] text-[#0b57d0]"><LockKeyhole size={19} /></div><p className="mt-6 font-mono-ui text-[10px] font-bold uppercase tracking-[.15em] text-[#0b57d0]">Secure sign in</p><h2 className="mt-2 text-3xl font-extrabold tracking-[-.055em]">Welcome to Workforce Hub.</h2><p className="mt-3 text-sm leading-6 text-[#7185a0]">Sign in with your approved identity to enter your assigned Verton workspace.</p><button onClick={() => startLogin()} disabled={loading} className="mt-8 w-full rounded-xl bg-[#0b57d0] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_20px_rgba(11,87,208,.20)] transition hover:-translate-y-0.5 hover:bg-[#094db9] disabled:cursor-not-allowed disabled:opacity-70">{loading ? "Checking secure session…" : "Sign in securely"} <ArrowRight className="ml-1 inline" size={16} /></button><div className="mt-6 border-t border-[#ebf0f6] pt-5"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#7c91a9]">Workspace access profiles</p><div className="mt-3 grid grid-cols-2 gap-2">{roles.map(role => <div key={role.name} className="rounded-xl bg-[#f7faff] p-2.5"><span className="text-[10px] font-extrabold text-[#335575]">{role.name}</span><span className="mt-1 block text-[9px] leading-3 text-[#8092a8]">Assigned by administration</span></div>)}</div></div><p className="mt-5 text-center text-[10px] leading-4 text-[#8193a9]">Your role is assigned and reviewed by Verton administration. This screen does not allow users to self-select access.</p></div></div></section></div></div>;
}

function Workspace({ exitWorkspace, requestedPage = "Overview" }: { exitWorkspace: () => void; requestedPage?: string }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const activeRole = getRoleKeyFromStoredRole(user?.role);
  const [activePage, setActivePage] = useState(() => resolveWorkspacePage(activeRole, requestedPage));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [candidateQuery, setCandidateQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<typeof candidates[number] | null>(candidates[0]);
  const [masked, setMasked] = useState(true);
  const [onboarding, setOnboarding] = useState(onboardingDefaults);
  const [onboardingPersonaId, setOnboardingPersonaId] = useState(0);
  const [timeApproved, setTimeApproved] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileEmploymentType, setProfileEmploymentType] = useState("");
  const [profileStatusNote, setProfileStatusNote] = useState("");
  const [profileSubmitted, setProfileSubmitted] = useState(false);
  const [adminUserSearch, setAdminUserSearch] = useState("");
  const [, setLocation] = useLocation();

  const accessUsersQuery = trpc.access.listUsers.useQuery(undefined, { enabled: activeRole === "Administrator" });
  const permissionGroupsQuery = trpc.access.permissionGroups.useQuery(undefined, { enabled: activeRole === "Administrator" });
  const roleChangeHistoryQuery = trpc.access.roleChangeHistory.useQuery(undefined, { enabled: activeRole === "Administrator" });
  const roleMutation = trpc.access.assignRole.useMutation({ onSuccess: () => { accessUsersQuery.refetch(); roleChangeHistoryQuery.refetch(); } });
  const myProfileQuery = trpc.profile.mine.useQuery(undefined, { enabled: isAuthenticated });
  const profileMutation = trpc.profile.requestReview.useMutation({ onSuccess: () => { setProfileSubmitted(true); myProfileQuery.refetch(); } });
  const recruiterProgressQuery = trpc.recruiting.newHireProgress.useQuery(undefined, { enabled: activeRole === "Administrator" || activeRole === "Recruiter" });

  const allowedNav = getAllowedNavigation(activeRole);
  const activeRoleInfo = roles.find(role => role.name === activeRole)!;
  const filteredCandidates = useMemo(() => candidates.filter(candidate => `${candidate.name} ${candidate.role} ${candidate.skills}`.toLowerCase().includes(candidateQuery.toLowerCase())), [candidateQuery]);
  const completedTasks = countCompletedOnboardingTasks(onboarding);
  const onboardingPersona = onboardingPersonas[onboardingPersonaId];
  const filteredAdminUsers = useMemo(() => {
    const query = adminUserSearch.trim().toLowerCase();
    if (!query) return accessUsersQuery.data ?? [];
    return (accessUsersQuery.data ?? []).filter(account => `${account.name ?? ""} ${account.email ?? ""} ${formatStoredRole(account.role)}`.toLowerCase().includes(query));
  }, [accessUsersQuery.data, adminUserSearch]);

  useEffect(() => {
    const permittedPage = resolveWorkspacePage(activeRole, activePage);
    if (permittedPage !== activePage) setActivePage(permittedPage);
  }, [activeRole, activePage]);

  useEffect(() => {
    setActivePage(resolveWorkspacePage(activeRole, requestedPage));
  }, [activeRole, requestedPage]);

  useEffect(() => {
    setOnboarding(onboardingPersona.tasks.map(task => ({ ...task })));
  }, [onboardingPersonaId]);

  useEffect(() => {
    if (!myProfileQuery.data) return;
    setProfileEmploymentType(myProfileQuery.data.employmentType ?? "");
    setProfileStatusNote(myProfileQuery.data.statusNote ?? "");
  }, [myProfileQuery.data]);

  const changePage = (page: string) => {
    setActivePage(resolveWorkspacePage(activeRole, page));
    setMobileNavOpen(false);
  };

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f7faff] text-[#365575]"><div className="text-center"><span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[#e8f2ff] text-[#0b57d0]"><ShieldCheck size={20} /></span><p className="mt-4 text-sm font-bold">Verifying secure workspace access…</p></div></div>;

  if (!isAuthenticated) return <Login returnToLanding={exitWorkspace} openWorkspace={() => {}} />;

  const WorkspaceNav = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={mobile ? "p-4" : "px-3 py-4"}>
      <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[.17em] text-blue-200/65">Operations</p>
      <div className="space-y-1">{allowedNav.map(item => { const Icon = item.icon; const active = activePage === item.label; return <button key={item.label} onClick={() => changePage(item.label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold transition ${active ? "bg-white/12 text-white shadow-inner" : "text-blue-100/70 hover:bg-white/7 hover:text-white"}`}><Icon size={17} strokeWidth={active ? 2.5 : 2} /><span>{item.label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#71e1d2]" />}</button>; })}</div>
      <div className="mt-8 rounded-xl border border-white/10 bg-white/6 p-3"><div className="flex items-center gap-2 text-[10px] font-bold text-[#79e4d6]"><CircleCheck size={14} /> Secure by design</div><p className="mt-2 text-[10px] leading-4 text-blue-100/65">Visibility follows role, action, and approved business purpose.</p></div>
    </nav>
  );

  const Overview = () => <>
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><div className="flex items-center gap-2"><Pill tone="blue"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> DEMO ENVIRONMENT</Pill><span className="font-mono-ui text-[10px] font-medium text-[#8092aa]">US OPERATIONS · AUG 26</span></div><h1 className="mt-3 text-2xl font-extrabold tracking-[-.055em] text-[#12345a] sm:text-3xl">Good morning, Verton.</h1><p className="mt-1.5 text-sm text-[#7185a0]">A clear view of what needs attention across workforce operations.</p></div><div className="flex items-center gap-2"><button className="rounded-xl border border-[#d7e2ef] bg-white px-3 py-2 text-xs font-bold text-[#3a5678] shadow-sm"><CalendarDays className="mr-1.5 inline" size={15} /> This week <ChevronDown className="ml-1 inline" size={14} /></button><button onClick={() => changePage("Controls")} className="rounded-xl bg-[#0b57d0] px-3 py-2 text-xs font-bold text-white shadow-[0_6px_14px_rgba(11,87,208,.18)]"><CircleAlert className="mr-1.5 inline" size={15} /> View exceptions</button></div></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Open staffing demand" value="12" note="3 priority roles need attention" icon={Target} /><StatCard label="Active assignments" value="84" note="92% delivery health" icon={BriefcaseBusiness} accent="teal" /><StatCard label="Bench availability" value="09" note="4 strong redeployment matches" icon={UsersRound} accent="violet" /><StatCard label="Time approval rate" value="96%" note="5 entries awaiting action" icon={CheckCircle2} accent="amber" /></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.18fr_.82fr]"><section className="rounded-2xl border border-[#dce7f3] bg-white p-5 shadow-[0_5px_16px_rgba(18,52,90,.04)]"><div className="flex items-start justify-between"><div><p className="text-sm font-extrabold">Recruiting flow</p><p className="mt-1 text-xs text-[#7185a0]">Healthy activity across current priority demand.</p></div><button onClick={() => changePage("Talent pipeline")} className="text-xs font-bold text-[#0b57d0]">Open pipeline <ArrowRight className="inline" size={14} /></button></div><div className="mt-6 grid grid-cols-5 gap-2">{[["Sourced", "248", 100], ["Screened", "76", 74], ["Submitted", "34", 52], ["Interview", "17", 31], ["Offer", "06", 14]].map(([label, value, pct], index) => <div key={label as string}><div className="flex h-28 items-end rounded-xl bg-[#f3f7fc] px-2"><div className="w-full rounded-lg bg-gradient-to-t from-[#0b57d0] to-[#74a9fb]" style={{ height: `${pct}%`, opacity: 1 - index * .1 }} /></div><p className="mt-3 text-lg font-extrabold tracking-[-.05em]">{value as string}</p><p className="text-[10px] font-semibold text-[#7185a0]">{label as string}</p></div>)}</div></section>
      <section className="rounded-2xl bg-[#09264b] p-5 text-white shadow-[0_10px_28px_rgba(9,38,75,.16)]"><div className="flex items-center justify-between"><div><p className="text-sm font-extrabold">Action queue</p><p className="mt-1 text-xs text-blue-200/75">Ownership creates momentum.</p></div><Activity size={18} className="text-[#77e1d3]" /></div><div className="mt-5 space-y-3">{[["02", "Readiness records need human review", "Today"], ["03", "Assignments approaching extension window", "This week"], ["05", "Time entries awaiting manager approval", "Friday"]].map(([count, text, when]) => <button key={text} onClick={() => changePage(text.includes("Readiness") ? "Readiness" : text.includes("Time") ? "Time & billing" : "Delivery")} className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#123b6e] text-xs font-extrabold text-[#77e1d3]">{count}</span><span className="min-w-0 flex-1 text-[11px] font-bold leading-4">{text}</span><span className="text-[9px] font-medium text-blue-200/65">{when}</span></button>)}</div></section></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><section className="rounded-2xl border border-[#dce7f3] bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-extrabold">Redeployment signal</p><p className="mt-1 text-xs text-[#7185a0]">People approaching assignment change.</p></div><Pill tone="green">4 matches</Pill></div><div className="mt-4 space-y-3">{assignments.slice(1).map(assignment => <div key={assignment.person} className="flex items-center gap-3 rounded-xl bg-[#f7faff] p-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#e0edff] text-xs font-extrabold text-[#0b57d0]">{assignment.person.split(" ").map(word => word[0]).join("")}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold">{assignment.person}</p><p className="mt-0.5 truncate text-[10px] text-[#7185a0]">{assignment.role} · {assignment.end}</p></div><Pill tone={assignment.status === "Rolling off" ? "amber" : "blue"}>{assignment.status}</Pill></div>)}</div></section>
      <section className="rounded-2xl border border-[#dce7f3] bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-extrabold">Priority demand</p><p className="mt-1 text-xs text-[#7185a0]">The roles most likely to benefit from active attention.</p></div><button onClick={() => changePage("Delivery")} className="text-xs font-bold text-[#0b57d0]">View all</button></div><div className="mt-3 divide-y divide-[#edf2f7]">{demands.map(demand => <div key={demand.title} className="flex items-center gap-3 py-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#edf4ff] text-[#0b57d0]"><BriefcaseBusiness size={15} /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold">{demand.title}</p><p className="mt-0.5 truncate text-[10px] text-[#7185a0]">{demand.client} · {demand.stage}</p></div><span className="text-[10px] font-bold text-[#6f84a0]">{demand.days}</span></div>)}</div></section></div>
  </>;

  const Talent = () => <><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="font-mono-ui text-[10px] font-medium uppercase tracking-[.16em] text-[#0b57d0]">Recruiting workspace</p><h1 className="mt-2 text-2xl font-extrabold tracking-[-.055em] sm:text-3xl">Talent pipeline</h1><p className="mt-1.5 text-sm text-[#7185a0]">Search, screen, submit, and keep every interaction in context.</p></div><button className="rounded-xl bg-[#0b57d0] px-3 py-2.5 text-xs font-bold text-white"><Plus className="mr-1.5 inline" size={15} /> Add talent profile</button></div><div className="mt-6 grid gap-5 xl:grid-cols-[1fr_320px]"><section className="overflow-hidden rounded-2xl border border-[#dce7f3] bg-white"><div className="flex flex-col gap-3 border-b border-[#e8eef5] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8295ad]" size={16} /><input value={candidateQuery} onChange={event => setCandidateQuery(event.target.value)} placeholder="Search talent, skill, or role" className="w-full rounded-xl border border-[#dbe6f1] bg-[#f9fbfe] py-2.5 pl-9 pr-3 text-xs font-medium outline-none transition focus:border-[#5f9cf7] focus:ring-4 focus:ring-blue-100" /></div><button className="rounded-xl border border-[#dbe6f1] px-3 py-2.5 text-xs font-bold text-[#4f6684]"><Settings2 className="mr-1 inline" size={14} /> Filters</button></div><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left"><thead className="bg-[#f8fbff] text-[10px] uppercase tracking-[.1em] text-[#7890aa]"><tr><th className="px-4 py-3 font-bold">Talent profile</th><th className="px-3 py-3 font-bold">Current stage</th><th className="px-3 py-3 font-bold">Owner</th><th className="px-3 py-3 font-bold">Updated</th></tr></thead><tbody>{filteredCandidates.map(candidate => <tr key={candidate.name} onClick={() => setSelectedCandidate(candidate)} className={`cursor-pointer border-t border-[#edf2f7] text-xs transition hover:bg-[#f5f9ff] ${selectedCandidate?.name === candidate.name ? "bg-[#f5f9ff]" : ""}`}><td className="px-4 py-3"><div className="flex items-center gap-3"><span className={`grid h-8 w-8 place-items-center rounded-full text-[10px] font-extrabold ${toneStyles[candidate.tone]}`}>{candidate.initials}</span><div><p className="font-extrabold text-[#234465]">{candidate.name}</p><p className="mt-0.5 text-[10px] text-[#7185a0]">{candidate.role} · {candidate.skills}</p></div></div></td><td className="px-3 py-3"><Pill tone={candidate.stage === "Offer review" ? "amber" : "blue"}>{candidate.stage}</Pill></td><td className="px-3 py-3 font-semibold text-[#5e7594]">{candidate.owner}</td><td className="px-3 py-3 text-[#7185a0]">{candidate.updated}</td></tr>)}</tbody></table></div></section><aside className="rounded-2xl border border-[#dce7f3] bg-white p-5 shadow-[0_5px_16px_rgba(18,52,90,.04)]">{selectedCandidate ? <><div className="flex items-start justify-between"><span className={`grid h-11 w-11 place-items-center rounded-full text-xs font-extrabold ${toneStyles[selectedCandidate.tone]}`}>{selectedCandidate.initials}</span><button onClick={() => setSelectedCandidate(null)} className="text-[#8395aa]"><X size={16} /></button></div><h2 className="mt-4 text-lg font-extrabold tracking-[-.04em]">{selectedCandidate.name}</h2><p className="mt-1 text-xs font-semibold text-[#68809b]">{selectedCandidate.role}</p><div className="mt-5 space-y-3 border-y border-[#edf2f7] py-4 text-xs"><div className="flex justify-between"><span className="text-[#7185a0]">Pipeline stage</span><Pill tone="blue">{selectedCandidate.stage}</Pill></div><div className="flex justify-between"><span className="text-[#7185a0]">Profile strength</span><span className="font-extrabold text-emerald-700">High</span></div><div><span className="text-[#7185a0]">Core capabilities</span><p className="mt-1.5 font-semibold leading-5 text-[#466381]">{selectedCandidate.skills}</p></div></div><p className="mt-4 text-[10px] font-bold uppercase tracking-[.12em] text-[#7185a0]">Activity history</p><div className="mt-3 space-y-3 border-l border-[#dce7f3] pl-3"><p className="text-[11px] leading-4 text-[#5d7592]"><b className="text-[#294969]">Screening completed</b><br />Today, 9:40 AM</p><p className="text-[11px] leading-4 text-[#5d7592]"><b className="text-[#294969]">Client profile prepared</b><br />Yesterday, 3:12 PM</p></div><button className="mt-5 w-full rounded-xl bg-[#0b57d0] py-2.5 text-xs font-bold text-white">Open profile <ArrowRight className="ml-1 inline" size={14} /></button></> : <div className="grid min-h-72 place-items-center text-center"><div><UserRoundSearch className="mx-auto text-[#8ea2bb]" /><p className="mt-3 text-sm font-bold">Select a profile</p><p className="mt-1 text-xs text-[#7185a0]">Review talent details and activity history.</p></div></div>}</aside></div></>;

  const Readiness = () => <><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="font-mono-ui text-[10px] font-medium uppercase tracking-[.16em] text-[#0b57d0]">Restricted operations</p><h1 className="mt-2 text-2xl font-extrabold tracking-[-.055em] sm:text-3xl">Readiness review</h1><p className="mt-1.5 max-w-2xl text-sm text-[#7185a0]">Controlled tracking for authorized reviewers. The system surfaces tasks and dates; people make every employment-authorization decision.</p></div><button onClick={() => setMasked(value => !value)} className="rounded-xl border border-[#d7e2ef] bg-white px-3 py-2.5 text-xs font-bold text-[#46617e]"><LockKeyhole className="mr-1.5 inline" size={15} /> {masked ? "Show approved fields" : "Mask sensitive fields"}</button></div><div className="mt-6 rounded-2xl border border-[#ffe3a8] bg-[#fffaf0] p-4"><div className="flex gap-3"><CircleAlert className="mt-0.5 shrink-0 text-[#c67c00]" size={18} /><div><p className="text-xs font-extrabold text-[#784d00]">Human review boundary</p><p className="mt-1 text-xs leading-5 text-[#8b681d]">Readiness states are administrative workflow indicators only. Workforce Hub does not determine eligibility, make legal conclusions, or authorize employment actions.</p></div></div></div><section className="mt-5 overflow-hidden rounded-2xl border border-[#dce7f3] bg-white"><div className="flex items-center justify-between border-b border-[#e8eef5] p-4"><div><p className="text-sm font-extrabold">Review queue</p><p className="mt-1 text-xs text-[#7185a0]">Document images and restricted details remain compartmentalized.</p></div><Pill tone="amber">2 actions due</Pill></div><div className="overflow-x-auto"><table className="w-full min-w-[660px] text-left"><thead className="bg-[#f8fbff] text-[10px] uppercase tracking-[.1em] text-[#7890aa]"><tr><th className="px-4 py-3 font-bold">Person</th><th className="px-3 py-3 font-bold">Workflow category</th><th className="px-3 py-3 font-bold">Review state</th><th className="px-3 py-3 font-bold">Review / date</th><th className="px-3 py-3 font-bold">Status</th></tr></thead><tbody>{complianceRecords.map((record, index) => <tr key={record.name} className="border-t border-[#edf2f7] text-xs"><td className="px-4 py-3 font-extrabold text-[#294969]">{masked ? `${record.name.split(" ")[0][0]}. ${record.name.split(" ")[1]}` : record.name}</td><td className="px-3 py-3 font-semibold text-[#607895]">{record.category}</td><td className="px-3 py-3"><Pill tone={record.state.includes("action") ? "amber" : record.state.includes("Human") ? "blue" : "slate"}>{record.state}</Pill></td><td className="px-3 py-3 text-[#607895]">{record.date}</td><td className="px-3 py-3"><Pill tone={record.risk === "Ready" ? "green" : index === 1 ? "amber" : "blue"}>{record.risk}</Pill></td></tr>)}</tbody></table></div></section></>;

  const Onboarding = () => <><div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><p className="font-mono-ui text-[10px] font-medium uppercase tracking-[.16em] text-[#0b57d0]">Employee experience</p><h1 className="mt-2 text-2xl font-extrabold tracking-[-.055em] sm:text-3xl">Onboarding workspace</h1><p className="mt-1.5 text-sm text-[#7185a0]">A personalized checklist that creates clarity for the consultant, manager, HR, and IT operations.</p></div><Pill tone={completedTasks === onboarding.length ? "green" : "blue"}>{completedTasks} of {onboarding.length} completed</Pill></div><div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><section className="rounded-2xl border border-[#dce7f3] bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-extrabold">Mia Chen · delivery lead</p><p className="mt-1 text-xs text-[#7185a0]">Modern Commerce Platform · starts Sep 02</p></div><span className="grid h-10 w-10 place-items-center rounded-full bg-[#e3f7f3] text-[#078477]"><UserCheck size={18} /></span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-[#eaf0f6]"><div className="h-full rounded-full bg-gradient-to-r from-[#0b57d0] to-[#4b9cff]" style={{ width: `${(completedTasks / onboarding.length) * 100}%` }} /></div><div className="mt-5 space-y-2">{onboarding.map((task, index) => <button key={task.title} onClick={() => setOnboarding(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, done: !item.done } : item))} className="flex w-full items-center gap-3 rounded-xl border border-[#e4ecf5] p-3 text-left transition hover:border-[#b9d4fa] hover:bg-[#f8fbff]"><span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${task.done ? "border-[#0b57d0] bg-[#0b57d0] text-white" : "border-[#b9cbe0] bg-white"}`}>{task.done && <Check size={13} strokeWidth={3} />}</span><span className="min-w-0 flex-1"><span className="block text-xs font-extrabold text-[#294969]">{task.title}</span><span className="mt-0.5 block text-[10px] text-[#7185a0]">{task.detail}</span></span><span className="hidden rounded-full bg-[#eff5fc] px-2 py-1 text-[9px] font-bold text-[#66809f] sm:block">{task.owner}</span></button>)}</div></section><aside className="rounded-2xl bg-[#09264b] p-5 text-white"><p className="text-sm font-extrabold">Guided start experience</p><p className="mt-2 text-xs leading-5 text-blue-100/75">This checklist changes with the consultant’s role, engagement, work location, and controlled onboarding requirements.</p><div className="mt-6 space-y-3 border-t border-white/10 pt-5"><div className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 text-[#79e4d6]"><FileText size={15} /></span><p className="text-[11px] leading-4 text-blue-100"><b className="text-white">Clear ownership</b><br />Each handoff has a responsible team and status.</p></div><div className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 text-[#79e4d6]"><Bell size={15} /></span><p className="text-[11px] leading-4 text-blue-100"><b className="text-white">Gentle escalation</b><br />Upcoming actions are surfaced before the start date.</p></div></div><button className="mt-7 w-full rounded-xl bg-white py-2.5 text-xs font-bold text-[#0b57d0]">Send reminder</button></aside></div></>;

  const Delivery = () => <><div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><p className="font-mono-ui text-[10px] font-medium uppercase tracking-[.16em] text-[#0b57d0]">Client & delivery operations</p><h1 className="mt-2 text-2xl font-extrabold tracking-[-.055em] sm:text-3xl">Demand to deployment</h1><p className="mt-1.5 text-sm text-[#7185a0]">Create continuity between client need, talent readiness, assignment health, and future capacity.</p></div><button className="rounded-xl bg-[#0b57d0] px-3 py-2.5 text-xs font-bold text-white"><Plus className="mr-1.5 inline" size={15} /> Open demand</button></div><div className="mt-6 grid gap-5 xl:grid-cols-[.82fr_1.18fr]"><section className="rounded-2xl border border-[#dce7f3] bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-extrabold">Open staffing demand</p><p className="mt-1 text-xs text-[#7185a0]">Active client requirements and pipeline signal.</p></div><Pill tone="blue">12 open</Pill></div><div className="mt-4 space-y-2">{demands.map(demand => <div key={demand.title} className="rounded-xl border border-[#e4ecf5] p-3"><div className="flex items-start gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#eaf2ff] text-[#0b57d0]"><BriefcaseBusiness size={15} /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="text-xs font-extrabold text-[#294969]">{demand.title}</p><Pill tone={demand.priority === "Priority" ? "amber" : "slate"}>{demand.priority}</Pill></div><p className="mt-1 text-[10px] text-[#7185a0]">{demand.client} · {demand.stage} · {demand.days}</p></div></div></div>)}</div></section><section className="overflow-hidden rounded-2xl border border-[#dce7f3] bg-white"><div className="flex items-center justify-between border-b border-[#e8eef5] p-5"><div><p className="text-sm font-extrabold">Active assignments</p><p className="mt-1 text-xs text-[#7185a0]">See work in motion, extension windows, and roll-off signals.</p></div><button className="text-xs font-bold text-[#0b57d0]">Capacity view</button></div><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left"><thead className="bg-[#f8fbff] text-[10px] uppercase tracking-[.1em] text-[#7890aa]"><tr><th className="px-4 py-3 font-bold">Consultant</th><th className="px-3 py-3 font-bold">Project</th><th className="px-3 py-3 font-bold">Assignment signal</th><th className="px-3 py-3 font-bold">Utilization</th></tr></thead><tbody>{assignments.map(assignment => <tr key={assignment.person} className="border-t border-[#edf2f7] text-xs"><td className="px-4 py-3"><p className="font-extrabold text-[#294969]">{assignment.person}</p><p className="mt-0.5 text-[10px] text-[#7185a0]">{assignment.role}</p></td><td className="px-3 py-3"><p className="font-semibold text-[#55708f]">{assignment.project}</p><p className="mt-0.5 text-[10px] text-[#8496aa]">{assignment.client}</p></td><td className="px-3 py-3"><Pill tone={assignment.status === "Active" ? "green" : assignment.status === "Rolling off" ? "amber" : "blue"}>{assignment.status} · {assignment.end}</Pill></td><td className="px-3 py-3 font-extrabold text-[#466381]">{assignment.utilization}</td></tr>)}</tbody></table></div></section></div></>;

  const TimeBilling = () => <><div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><p className="font-mono-ui text-[10px] font-medium uppercase tracking-[.16em] text-[#0b57d0]">Operational control</p><h1 className="mt-2 text-2xl font-extrabold tracking-[-.055em] sm:text-3xl">Time & billing readiness</h1><p className="mt-1.5 text-sm text-[#7185a0]">Move approved work into billing-ready status with scoped visibility for sensitive commercial data.</p></div><Pill tone={timeApproved ? "green" : "amber"}>{timeApproved ? "Period ready" : "5 approvals due"}</Pill></div><div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><section className="rounded-2xl border border-[#dce7f3] bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-extrabold">Weekly time approval</p><p className="mt-1 text-xs text-[#7185a0]">Week ending Aug 23 · project manager action</p></div><button onClick={() => setTimeApproved(true)} disabled={timeApproved} className={`rounded-xl px-3 py-2 text-xs font-bold ${timeApproved ? "bg-emerald-50 text-emerald-700" : "bg-[#0b57d0] text-white"}`}>{timeApproved ? <><CheckCircle2 className="mr-1 inline" size={14} /> Approved</> : "Approve 40 hours"}</button></div><div className="mt-5 overflow-hidden rounded-xl border border-[#e4ecf5]"><div className="grid grid-cols-[1.5fr_repeat(5,1fr)_1fr] bg-[#f8fbff] px-3 py-2 text-[9px] font-bold uppercase tracking-[.08em] text-[#7b8fa8]"><span>Project</span><span>M</span><span>T</span><span>W</span><span>Th</span><span>F</span><span>Total</span></div><div className="grid grid-cols-[1.5fr_repeat(5,1fr)_1fr] items-center px-3 py-4 text-xs"><span><b className="block text-[#294969]">Modern Commerce</b><small className="text-[10px] text-[#7185a0]">Mia Chen</small></span>{[8,8,8,8,8].map((hours, index) => <span key={index} className="font-semibold text-[#4c6686]">{hours}</span>)}<span className="font-extrabold text-[#12345a]">40</span></div></div><div className="mt-4 rounded-xl bg-[#f1f8f7] p-3 text-xs text-[#247266]"><CheckCircle2 className="mr-1.5 inline" size={15} /> All policy and project checks are represented as complete for this demo entry.</div></section><aside className="rounded-2xl border border-[#dce7f3] bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-extrabold">Billing readiness</p><p className="mt-1 text-xs text-[#7185a0]">Commercial fields respect finance access.</p></div><FileCheck2 className="text-[#0b57d0]" size={19} /></div><div className="mt-5 space-y-3">{[["Approved time", "84 of 89 entries", "94%", "green"], ["Rate validation", "Terms matched", "Complete", "green"], ["Expense review", "2 items require review", "Action", "amber"], ["Invoice preparation", "Closes Friday", "Scheduled", "blue"]].map(([label, value, state, tone]) => <div key={label} className="flex items-center justify-between gap-3 border-b border-[#edf2f7] pb-3"><div><p className="text-xs font-bold text-[#415f80]">{label}</p><p className="mt-1 text-[10px] text-[#7185a0]">{value}</p></div><Pill tone={tone as "green" | "amber" | "blue"}>{state}</Pill></div>)}</div><p className="mt-5 rounded-xl bg-[#f7faff] p-3 text-[10px] leading-4 text-[#6a819d]"><LockKeyhole className="mr-1 inline text-[#0b57d0]" size={12} /> Pay, bill, and margin data are only available to authorized finance roles.</p></aside></div></>;

  const Controls = () => <><div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><p className="font-mono-ui text-[10px] font-medium uppercase tracking-[.16em] text-[#0b57d0]">Governance & traceability</p><h1 className="mt-2 text-2xl font-extrabold tracking-[-.055em] sm:text-3xl">Operational controls</h1><p className="mt-1.5 text-sm text-[#7185a0]">Review sensitive actions, protected access, and operational exceptions in one place.</p></div><button className="rounded-xl border border-[#d7e2ef] bg-white px-3 py-2.5 text-xs font-bold text-[#46617e]"><FileText className="mr-1.5 inline" size={15} /> Export audit view</button></div><div className="mt-6 grid gap-5 xl:grid-cols-[.78fr_1.22fr]"><section className="rounded-2xl bg-[#09264b] p-5 text-white"><p className="text-sm font-extrabold">Access posture</p><p className="mt-1 text-xs text-blue-100/70">Role and purpose-based visibility across sensitive operational records.</p><div className="mt-6 space-y-3">{[["Role-scoped navigation", "8 role views", "active"], ["Field masking", "Sensitive values limited", "active"], ["Audit capture", "Material actions recorded", "active"]].map(([title, detail]) => <div key={title} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3"><span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-[#137b72] text-white"><Check size={12} /></span><div><p className="text-xs font-bold">{title}</p><p className="mt-1 text-[10px] text-blue-100/65">{detail}</p></div></div>)}</div></section><section className="overflow-hidden rounded-2xl border border-[#dce7f3] bg-white"><div className="flex items-center justify-between border-b border-[#e8eef5] p-5"><div><p className="text-sm font-extrabold">Audit activity</p><p className="mt-1 text-xs text-[#7185a0]">Representative event history for the demo environment.</p></div><Pill tone="slate">Immutable log</Pill></div><div className="divide-y divide-[#edf2f7]">{auditRows.map(row => <div key={`${row.event}-${row.time}`} className="flex items-center gap-3 px-5 py-4"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#eef5ff] text-[#0b57d0]"><FileCheck2 size={15} /></span><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-[#304e6e]">{row.event}</p><p className="mt-1 truncate text-[10px] text-[#7185a0]">{row.actor} · {row.target}</p></div><span className="shrink-0 text-[10px] text-[#8294ab]">{row.time}</span></div>)}</div></section></div></>;

  const ReadinessChecklist = () => <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
    <section className="rounded-2xl border border-[#dce7f3] bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-extrabold">Controlled review checklist</p><p className="mt-1 text-xs text-[#7185a0]">Configured review sections are visible only to authorized reviewers.</p></div><Pill tone="blue">Template v3.2</Pill></div><div className="mt-4 space-y-2">{[["Identity and profile record", "Reviewer confirmed", "green"], ["Requested document bundle", "Needs reviewer action", "amber"], ["Policy acknowledgements", "Complete", "green"], ["Expiry watch and follow-up", "Monitoring", "blue"]].map(([title, status, tone]) => <div key={title} className="flex items-center gap-3 rounded-xl border border-[#e4ecf5] p-3"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#edf4ff] text-[#0b57d0]"><FileCheck2 size={14} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-extrabold text-[#315271]">{title}</span><span className="mt-0.5 block text-[10px] text-[#7185a0]">Administrative status only · human decision required</span></span><Pill tone={tone as "green" | "amber" | "blue"}>{status}</Pill></div>)}</div></section>
    <aside className="rounded-2xl border border-[#dce7f3] bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-extrabold">Restricted activity</p><p className="mt-1 text-xs text-[#7185a0]">Readiness-specific event history.</p></div><Pill tone="slate">Audit</Pill></div><div className="mt-4 space-y-4 border-l border-[#dce7f3] pl-3">{[["Checklist opened", "H. Lawson · Compliance", "Today, 10:16 AM"], ["Document request updated", "H. Lawson · Compliance", "Yesterday, 2:08 PM"], ["Expiry watch created", "System reminder", "Aug 18, 9:30 AM"]].map(([event, actor, time]) => <div key={event}><p className="text-xs font-extrabold text-[#365575]">{event}</p><p className="mt-1 text-[10px] text-[#7185a0]">{actor} · {time}</p></div>)}</div></aside>
  </div>;

  const OnboardingContext = () => <div className="mb-5 rounded-2xl border border-[#dce7f3] bg-white p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#7690ab]">Personalized demo persona</p><p className="mt-1 text-sm font-extrabold text-[#2f506f]">{onboardingPersona.name} · {onboardingPersona.role}</p><p className="mt-1 text-xs text-[#7185a0]">{onboardingPersona.context}</p></div><select value={onboardingPersonaId} onChange={event => setOnboardingPersonaId(Number(event.target.value))} className="rounded-xl border border-[#d8e4f0] bg-[#f8fbff] px-3 py-2 text-xs font-bold text-[#45617f] outline-none"><option value={0}>Mia Chen · new assignment</option><option value={1}>Andre Brooks · extension</option><option value={2}>Lena Garcia · readiness in progress</option></select></div></div>;

  const DeliveryLifecycle = () => <div className="mt-5 grid gap-5 xl:grid-cols-3"><section className="rounded-2xl border border-[#dce7f3] bg-white p-5"><p className="text-sm font-extrabold">Client portfolio</p><p className="mt-1 text-xs text-[#7185a0]">Account pulse and relationship actions.</p><div className="mt-4 space-y-3">{[["Northstar Retail", "4 active · 2 demand", "Healthy", "green"], ["Arcfield Health", "3 active · 1 priority", "Watch", "amber"], ["Moraine Foods", "2 active · expansion", "Healthy", "green"]].map(([client, detail, state, tone]) => <div key={client} className="flex items-center gap-3 border-b border-[#edf2f7] pb-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#eef5ff] text-[#0b57d0]"><UsersRound size={15} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-extrabold text-[#365575]">{client}</span><span className="mt-0.5 block text-[10px] text-[#7185a0]">{detail}</span></span><Pill tone={tone as "green" | "amber"}>{state}</Pill></div>)}</div></section><section className="rounded-2xl border border-[#dce7f3] bg-white p-5"><p className="text-sm font-extrabold">Project health</p><p className="mt-1 text-xs text-[#7185a0]">Milestones, staffing, and delivery signal.</p><div className="mt-4 space-y-3">{[["Modern Commerce Platform", "5 of 6 milestones", "92%", "blue"], ["Care Data Exchange", "Security checkpoint", "78%", "amber"], ["Supply Chain Intelligence", "Discovery complete", "100%", "green"]].map(([project, detail, percent, tone]) => <div key={project} className="rounded-xl bg-[#f8fbff] p-3"><div className="flex justify-between gap-2"><p className="text-xs font-extrabold text-[#365575]">{project}</p><Pill tone={tone as "blue" | "amber" | "green"}>{percent}</Pill></div><p className="mt-1 text-[10px] text-[#7185a0]">{detail}</p></div>)}</div></section><section className="rounded-2xl bg-[#09264b] p-5 text-white"><p className="text-sm font-extrabold">Availability window</p><p className="mt-1 text-xs text-blue-100/70">People with capacity or transition signal.</p><div className="mt-4 space-y-3">{[["Tara Iyer", "Available Sep 08", "Business Analyst"], ["Andre Brooks", "Extension decision Aug 31", "Cloud Engineer"], ["Noah Williams", "Capacity Sep 15", "SAP Analyst"]].map(([name, date, role]) => <div key={name} className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs font-bold">{name}</p><p className="mt-1 text-[10px] text-[#79e4d6]">{date}</p><p className="mt-1 text-[10px] text-blue-100/60">{role}</p></div>)}</div></section></div>;

  const FinanceScope = () => <div className={`mt-5 rounded-2xl border p-5 ${isFinanceRole(activeRole) ? "border-[#bfeade] bg-[#f1fbf8]" : "border-[#dce7f3] bg-white"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-extrabold">Commercial data scope</p><p className="mt-1 text-xs text-[#7185a0]">Sample commercial fields are protected in the demo by the active role profile.</p></div><Pill tone={isFinanceRole(activeRole) ? "green" : "slate"}>{isFinanceRole(activeRole) ? "Finance access" : "Masked"}</Pill></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{[["Client bill rate", "$142/hr"], ["Consultant pay rate", "$92/hr"], ["Assignment contribution", "35.2%"]].map(([label, value]) => <div key={label} className="rounded-xl bg-white p-3 ring-1 ring-[#dfeae7]"><p className="text-[10px] font-bold text-[#7185a0]">{label}</p><p className="mt-2 font-mono-ui text-sm font-medium text-[#284968]">{isFinanceRole(activeRole) ? value : "••••••"}</p></div>)}</div></div>;

  const AdminCenter = () => {
    const permissionGroups = permissionGroupsQuery.data ?? [];
    const roleChanges = roleChangeHistoryQuery.data ?? [];
    return <><div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><p className="font-mono-ui text-[10px] font-medium uppercase tracking-[.16em] text-[#0b57d0]">Administrator control center</p><h1 className="mt-2 text-2xl font-extrabold tracking-[-.055em] sm:text-3xl">Users, roles & permissions</h1><p className="mt-1.5 max-w-2xl text-sm text-[#7185a0]">Assign approved roles, inspect backend-governed permission groups, and keep access changes accountable.</p></div><Pill tone="green"><ShieldCheck size={13} /> Administrator access</Pill></div><div className="mt-6 grid gap-5 xl:grid-cols-[1.28fr_.72fr]"><section className="overflow-hidden rounded-2xl border border-[#dce7f3] bg-white"><div className="flex flex-col gap-3 border-b border-[#e8eef5] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-extrabold">Directory & role assignment</p><p className="mt-1 text-xs text-[#7185a0]">Role changes apply through protected administrative controls.</p></div><div className="flex items-center gap-2"><div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8094ad]" size={14} /><input aria-label="Search user directory" value={adminUserSearch} onChange={event => setAdminUserSearch(event.target.value)} placeholder="Search users" className="w-36 rounded-lg border border-[#d8e4f0] bg-[#f8fbff] py-2 pl-8 pr-2 text-[11px] font-semibold text-[#365575] outline-none sm:w-44" /></div><Pill tone="slate">{filteredAdminUsers.length} accounts</Pill></div></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead className="bg-[#f8fbff] text-[10px] uppercase tracking-[.1em] text-[#7890aa]"><tr><th className="px-5 py-3 font-bold">User</th><th className="px-3 py-3 font-bold">Role</th><th className="px-3 py-3 font-bold">Last sign-in</th><th className="px-3 py-3 font-bold">Access state</th></tr></thead><tbody>{filteredAdminUsers.map(account => <tr key={account.id} className="border-t border-[#edf2f7] text-xs"><td className="px-5 py-4"><p className="font-extrabold text-[#294969]">{account.name || "Verton user"}</p><p className="mt-1 text-[10px] text-[#7185a0]">{account.email || "No email recorded"}</p></td><td className="px-3 py-4"><select aria-label={`Role for ${account.name || account.id}`} value={account.role === "user" ? "consultant" : account.role} onChange={event => roleMutation.mutate({ userId: account.id, role: event.target.value as typeof storedRoleOptions[number] })} className="rounded-lg border border-[#d8e4f0] bg-[#f8fbff] px-2.5 py-2 text-[11px] font-bold text-[#375675] outline-none"><option value="admin">Administrator</option><option value="recruiter">Recruiter</option><option value="hr_compliance">HR & Compliance</option><option value="account_manager">Account manager</option><option value="delivery_manager">Delivery manager</option><option value="project_manager">Project manager</option><option value="finance">Finance</option><option value="consultant">Consultant</option></select></td><td className="px-3 py-4 text-[11px] text-[#7185a0]">{new Date(account.lastSignedIn).toLocaleDateString()}</td><td className="px-3 py-4"><Pill tone={roleMutation.isPending ? "amber" : "green"}>{roleMutation.isPending ? "Saving" : "Active"}</Pill></td></tr>)}{!accessUsersQuery.isLoading && filteredAdminUsers.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-xs text-[#7185a0]">No accounts match this search. New accounts receive a consultant role until an administrator assigns another approved role.</td></tr>}</tbody></table></div></section><aside className="rounded-2xl bg-[#09264b] p-5 text-white"><p className="text-sm font-extrabold">Permission model</p><p className="mt-1 text-xs leading-5 text-blue-100/70">Permission groups are served by the protected access API. Employees cannot self-escalate access.</p><div className="mt-5 space-y-3">{permissionGroups.map(group => <div key={group.role} className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold">{group.label}</p><span className="text-[9px] font-bold text-[#79e4d6]">{group.permissions.length} controls</span></div><p className="mt-2 text-[10px] leading-4 text-blue-100/65">{group.permissions.join(" · ")}</p></div>)}{permissionGroupsQuery.isLoading && <p className="text-xs text-blue-100/65">Loading permission groups…</p>}</div></aside></div><section className="mt-5 overflow-hidden rounded-2xl border border-[#dce7f3] bg-white"><div className="flex items-center justify-between border-b border-[#e8eef5] p-5"><div><p className="text-sm font-extrabold">Role-change audit</p><p className="mt-1 text-xs text-[#7185a0]">Protected operational history for administrative role changes.</p></div><Pill tone="slate">{roleChanges.length} events</Pill></div><div className="divide-y divide-[#edf2f7]">{roleChanges.length ? roleChanges.map(change => <div key={change.id} className="flex flex-col gap-1 px-5 py-4 text-xs sm:flex-row sm:items-center sm:justify-between"><p className="font-extrabold text-[#304e6e]">{change.targetName || "User"}: {formatStoredRole(change.previousRole)} <ArrowRight className="mx-1 inline text-[#0b57d0]" size={13} /> {formatStoredRole(change.nextRole)}</p><p className="text-[10px] text-[#7185a0]">Changed by {change.changedByName || "Administrator"} · {new Date(change.createdAt).toLocaleString()}</p></div>) : <p className="px-5 py-8 text-center text-xs text-[#7185a0]">No role changes recorded yet.</p>}</div></section><div className="mt-5 rounded-2xl border border-[#ffe3a8] bg-[#fffaf0] p-4 text-xs leading-5 text-[#8b681d]"><LockKeyhole className="mr-2 inline text-[#c67c00]" size={15} /><b>Access boundary:</b> Role changes govern operational navigation and protected API actions. Restricted authorization readiness decisions remain human-reviewed and are not determined by this platform.</div></>;
  };

  const EmployeeProfile = () => {
    const profile = myProfileQuery.data;
    const currentStatus = formatReadinessStatus(profile?.workAuthorizationStatus);
    const readyToSubmit = profileEmploymentType.trim().length >= 2 && profileStatusNote.trim().length >= 8;
    return <><div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><p className="font-mono-ui text-[10px] font-medium uppercase tracking-[.16em] text-[#0b57d0]">Employee self-service</p><h1 className="mt-2 text-2xl font-extrabold tracking-[-.055em] sm:text-3xl">My work readiness profile</h1><p className="mt-1.5 max-w-2xl text-sm text-[#7185a0]">View your administrative status and submit a concise update for authorized human review.</p></div><Pill tone={profile?.workAuthorizationStatus === "verified" ? "green" : profile?.workAuthorizationStatus === "expiry_watch" ? "amber" : "blue"}>{currentStatus}</Pill></div><div className="mt-6 grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><section className="rounded-2xl bg-[#09264b] p-5 text-white"><div className="flex items-start justify-between"><div><p className="text-sm font-extrabold">Your controlled status</p><p className="mt-1 text-xs leading-5 text-blue-100/70">This profile displays workflow status only. It does not retain authorization documents or make employment decisions.</p></div><ShieldCheck className="text-[#78e2d4]" size={19} /></div><div className="mt-6 space-y-4"><div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#79e4d6]">Current administrative state</p><p className="mt-2 text-lg font-extrabold">{currentStatus}</p><p className="mt-2 text-[11px] leading-5 text-blue-100/65">{profile?.statusNote || "No update has been submitted yet. Provide a brief status note when you are ready for human review."}</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 p-3"><p className="text-[9px] font-bold uppercase tracking-[.1em] text-blue-200/60">Employment type</p><p className="mt-2 text-xs font-bold">{profile?.employmentType || "Not provided"}</p></div><div className="rounded-xl border border-white/10 p-3"><p className="text-[9px] font-bold uppercase tracking-[.1em] text-blue-200/60">Review ownership</p><p className="mt-2 text-xs font-bold">Authorized reviewer</p></div></div></div></section><section className="rounded-2xl border border-[#dce7f3] bg-white p-5"><p className="text-sm font-extrabold">Request profile review</p><p className="mt-1 text-xs leading-5 text-[#7185a0]">Submit administrative information for follow-up. Do not upload documents or provide legal conclusions in this form.</p><div className="mt-5 grid gap-4"><label className="text-xs font-bold text-[#466381]">Work authorization category<select aria-label="Work authorization category" value={profileEmploymentType} onChange={event => setProfileEmploymentType(event.target.value)} className="mt-2 w-full rounded-xl border border-[#d8e4f0] bg-[#f8fbff] px-3 py-2.5 text-xs font-semibold text-[#365575] outline-none"><option value="">Select a category</option><option value="H-1B">H-1B</option><option value="Employment authorization document">Employment authorization document</option><option value="F-1 OPT">F-1 OPT</option><option value="F-1 STEM OPT">F-1 STEM OPT</option><option value="Permanent resident">Permanent resident</option><option value="Other authorized status">Other authorized status</option></select></label><label className="text-xs font-bold text-[#466381]">Status note<textarea aria-label="Status note" value={profileStatusNote} onChange={event => setProfileStatusNote(event.target.value)} placeholder="For example: I am requesting an administrative status review and will respond to authorized reviewer instructions." className="mt-2 min-h-32 w-full rounded-xl border border-[#d8e4f0] bg-[#f8fbff] p-3 text-xs font-medium leading-5 text-[#365575] outline-none focus:border-[#5f9cf7] focus:ring-4 focus:ring-blue-100" /></label><button onClick={() => profileMutation.mutate({ employmentType: profileEmploymentType, statusNote: profileStatusNote })} disabled={!readyToSubmit || profileMutation.isPending} className="rounded-xl bg-[#0b57d0] px-4 py-3 text-xs font-bold text-white shadow-[0_8px_16px_rgba(11,87,208,.16)] disabled:cursor-not-allowed disabled:opacity-50">{profileMutation.isPending ? "Submitting…" : "Submit update for human review"} <ArrowRight className="ml-1 inline" size={14} /></button>{profileSubmitted && <p className="rounded-xl bg-[#effaf7] p-3 text-xs font-semibold text-[#267669]"><CheckCircle2 className="mr-1 inline" size={14} /> Update submitted. An authorized reviewer will determine the appropriate next step.</p>}</div></section></div></>;
  };

  const RecruiterDashboard = () => {
    const liveRows = recruiterProgressQuery.data ?? [];
    const demoRows = [
      { userId: -1, name: "Priya Shah", email: "demo@verton.local", onboardingStage: "profile_in_progress", progressPercent: 65, managerConfirmed: false, projectName: "Northstar Retail", assignmentState: "pending", readinessStatus: "details_requested" },
      { userId: -2, name: "Owen Miller", email: "demo@verton.local", onboardingStage: "manager_confirmation", progressPercent: 82, managerConfirmed: true, projectName: "Arcfield Health", assignmentState: "pending", readinessStatus: "human_review" },
      { userId: -3, name: "Lena Garcia", email: "demo@verton.local", onboardingStage: "ready_for_assignment", progressPercent: 92, managerConfirmed: true, projectName: "Moraine Foods", assignmentState: "active", readinessStatus: "verified" },
    ];
    const rows = liveRows.length ? liveRows : demoRows;
    return <><div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><p className="font-mono-ui text-[10px] font-medium uppercase tracking-[.16em] text-[#0b57d0]">Recruiter workspace</p><h1 className="mt-2 text-2xl font-extrabold tracking-[-.055em] sm:text-3xl">New-hire launchboard</h1><p className="mt-1.5 max-w-2xl text-sm text-[#7185a0]">Track onboarding handoffs and project-assignment signals without opening restricted readiness details.</p></div><Pill tone="blue"><TrendingUp size={13} /> {rows.length} tracked hires</Pill></div><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="New hires" value={`${rows.length}`} note="Current onboarding cohort" icon={UsersRound} /><StatCard label="Manager handoffs" value={`${rows.filter(row => !row.managerConfirmed).length}`} note="Awaiting confirmation" icon={UserCheck} accent="amber" /><StatCard label="Assignment ready" value={`${rows.filter(row => row.assignmentState === "active" || row.assignmentState === "pending").length}`} note="Project signal present" icon={BriefcaseBusiness} accent="teal" /><StatCard label="Workflow follow-up" value={`${rows.filter(row => row.readinessStatus !== "verified").length}`} note="Status only; no document detail" icon={ShieldCheck} accent="violet" /></div><section className="mt-5 overflow-hidden rounded-2xl border border-[#dce7f3] bg-white"><div className="flex flex-col gap-3 border-b border-[#e8eef5] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-extrabold">Onboarding and assignment progress</p><p className="mt-1 text-xs text-[#7185a0]">{liveRows.length ? "Live operational records" : "Representative demo queue shown until eligible employees are assigned."}</p></div><button onClick={() => changePage("Talent pipeline")} className="rounded-xl border border-[#d8e4f0] px-3 py-2 text-xs font-bold text-[#466381]">Open talent pipeline <ArrowRight className="ml-1 inline" size={13} /></button></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-[#f8fbff] text-[10px] uppercase tracking-[.1em] text-[#7890aa]"><tr><th className="px-5 py-3 font-bold">New hire</th><th className="px-3 py-3 font-bold">Onboarding</th><th className="px-3 py-3 font-bold">Manager</th><th className="px-3 py-3 font-bold">Assignment</th><th className="px-3 py-3 font-bold">Readiness signal</th></tr></thead><tbody>{rows.map(row => <tr key={row.userId} className="border-t border-[#edf2f7] text-xs"><td className="px-5 py-4"><p className="font-extrabold text-[#294969]">{row.name || "New employee"}</p><p className="mt-1 text-[10px] text-[#7185a0]">{row.email || "Operational profile pending"}</p></td><td className="px-3 py-4"><div className="min-w-36"><div className="flex justify-between text-[10px] font-bold text-[#4f6c8b]"><span>{String(row.onboardingStage || "not_started").replaceAll("_", " ")}</span><span>{row.progressPercent || 0}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eaf0f6]"><div className="h-full rounded-full bg-[#0b57d0]" style={{ width: `${row.progressPercent || 0}%` }} /></div></div></td><td className="px-3 py-4"><Pill tone={row.managerConfirmed ? "green" : "amber"}>{row.managerConfirmed ? "Confirmed" : "Action due"}</Pill></td><td className="px-3 py-4"><p className="font-semibold text-[#466381]">{row.projectName || "No project assigned"}</p><p className="mt-1 text-[10px] text-[#7185a0]">{row.assignmentState || "unassigned"}</p></td><td className="px-3 py-4"><Pill tone={row.readinessStatus === "verified" ? "green" : row.readinessStatus === "human_review" ? "amber" : "blue"}>{formatReadinessStatus(row.readinessStatus)}</Pill></td></tr>)}</tbody></table></div></section><div className="mt-5 rounded-2xl border border-[#ffe3a8] bg-[#fffaf0] p-4 text-xs leading-5 text-[#8b681d]"><ShieldCheck className="mr-2 inline text-[#c67c00]" size={15} /><b>Recruiter access boundary:</b> This view provides onboarding progress and assignment signals only. Restricted documents, detailed work-authorization facts, and authorization decisions remain unavailable to recruiting users.</div></>;
  };

  const PageContent = () => {
    const permittedPage = resolveWorkspacePage(activeRole, activePage);
    if (permittedPage !== activePage) return <Overview />;
    if (activePage === "Talent pipeline") return <Talent />;
    if (activePage === "Readiness") return <><Readiness /><ReadinessChecklist /></>;
    if (activePage === "Onboarding") return <><OnboardingContext /><Onboarding /></>;
    if (activePage === "Delivery") return <><Delivery /><DeliveryLifecycle /></>;
    if (activePage === "Time & billing") return <><TimeBilling /><FinanceScope /></>;
    if (activePage === "Controls") return <Controls />;
    if (activePage === "Admin center") return <AdminCenter />;
    if (activePage === "My profile") return <EmployeeProfile />;
    if (activePage === "New-hire progress") return <RecruiterDashboard />;
    return <Overview />;
  };

  return <div className="min-h-screen bg-[#f7faff] text-[#12345a]"><div className="flex min-h-screen">
    <aside className={`fixed inset-y-0 left-0 z-40 hidden shrink-0 flex-col bg-[#09264b] text-white transition-all duration-300 lg:flex ${sidebarOpen ? "w-[252px]" : "w-[76px]"}`}><div className="flex h-[76px] items-center justify-between border-b border-white/10 px-4">{sidebarOpen ? <Logo dark /> : <img src={logoAssetUrl} alt="Verton Solutions, Inc." className="h-9 w-9 rounded-lg bg-white object-contain" />}<button onClick={() => setSidebarOpen(value => !value)} className="grid h-8 w-8 place-items-center rounded-lg text-blue-100/70 transition hover:bg-white/10 hover:text-white">{sidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}</button></div><div className="flex-1 overflow-y-auto"><WorkspaceNav /></div><div className="border-t border-white/10 p-3"><button onClick={exitWorkspace} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-blue-100/75 transition hover:bg-white/7 hover:text-white"><ArrowRight className="rotate-180" size={16} />{sidebarOpen && "Back to Verton"}</button></div></aside>
    <div className={`min-w-0 flex-1 transition-all duration-300 ${sidebarOpen ? "lg:ml-[252px]" : "lg:ml-[76px]"}`}><header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#e4ecf5] bg-[#f7faff]/90 px-4 backdrop-blur-xl sm:px-6"><div className="flex items-center gap-3"><button onClick={() => setMobileNavOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-[#dce7f3] bg-white text-[#385676] lg:hidden"><Menu size={18} /></button><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#7790aa]">{activeRoleInfo.name} workspace</p><p className="mt-0.5 text-xs font-semibold text-[#3e5b7c]">{activeRoleInfo.description}</p></div></div><div className="flex items-center gap-2"><button className="relative grid h-9 w-9 place-items-center rounded-lg border border-[#dce7f3] bg-white text-[#52708e]"><Bell size={16} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#ed7b50]" /></button><div className="flex items-center gap-2 rounded-xl border border-[#dce7f3] bg-white p-1.5 pl-2 shadow-sm"><span className="hidden text-right sm:block"><span className="block max-w-28 truncate text-[10px] font-extrabold text-[#395674]">{user?.name || "Verton user"}</span><span className="block text-[9px] text-[#7790aa]">{activeRole}</span></span><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#e1eeff] text-[9px] font-extrabold text-[#0b57d0]">{activeRoleInfo.initials}</span><button onClick={async () => { await logout(); setLocation("/login"); }} aria-label="Sign out" className="grid h-7 w-7 place-items-center rounded-lg text-[#7890aa] transition hover:bg-[#f5f8fc] hover:text-[#0b57d0]"><ArrowRight size={14} /></button></div></div></header>
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><PageContent /></main></div>
  </div>
  {mobileNavOpen && <div className="fixed inset-0 z-[60] lg:hidden"><button aria-label="Close menu" onClick={() => setMobileNavOpen(false)} className="absolute inset-0 bg-[#061a33]/55" /><div className="relative flex h-full w-[280px] flex-col bg-[#09264b] text-white shadow-2xl"><div className="flex h-[76px] items-center justify-between border-b border-white/10 px-4"><Logo dark /><button onClick={() => setMobileNavOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-blue-100"><X size={18} /></button></div><WorkspaceNav mobile /></div></div>}
  </div>;
}

export default function Home() {
  const [location, setLocation] = useLocation();
  const inLogin = location === "/login";
  const inWorkspace = location.startsWith("/workspace");
  const requestedWorkspacePages: Record<string, string> = {
    "/workspace/admin": "Admin center",
    "/workspace/profile": "My profile",
    "/workspace/recruiting": "New-hire progress",
  };
  if (inWorkspace) return <Workspace exitWorkspace={() => setLocation("/")} requestedPage={requestedWorkspacePages[location] ?? "Overview"} />;
  if (inLogin) return <Login returnToLanding={() => setLocation("/")} openWorkspace={() => setLocation("/workspace")} />;
  return <Landing launchWorkspace={() => setLocation("/login")} />;
}
