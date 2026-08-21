import { PageShell } from "@/components/PageShell";
import { PolarisLogo } from "@/components/PolarisLogo";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CheckCircle2, Chrome, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

type Mode = "signup" | "signin";

function getSafeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/portal";
}

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const query = useMemo(() => new URLSearchParams(window.location.search), [location]);
  const [mode, setMode] = useState<Mode>("signup");
  const [showPassword, setShowPassword] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const next = getSafeNext(query.get("next"));
  const googleError = query.get("google") === "error";

  const signUp = trpc.auth.signUp.useMutation({
    onSuccess: () => {
      toast.success("Workspace account initialized", { description: "Your Explorer membership is ready." });
      setLocation(next);
    },
    onError: error => toast.error("Could not create account", { description: error.message }),
  });
  const signIn = trpc.auth.signIn.useMutation({
    onSuccess: () => {
      toast.success("Welcome back to Polaris");
      setLocation(next);
    },
    onError: error => toast.error("Sign-in failed", { description: error.message }),
  });
  const googleStart = trpc.auth.googleStart.useMutation({
    onSuccess: ({ url }) => { window.location.assign(url); },
    onError: error => toast.error("Google sign-in is unavailable", { description: error.message }),
  });

  useEffect(() => {
    if (!loading && isAuthenticated) setLocation(next);
  }, [isAuthenticated, loading, next, setLocation]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    if (mode === "signup") {
      signUp.mutate({ name: String(form.get("name") ?? ""), email, password });
    } else {
      signIn.mutate({ email, password });
    }
  };

  const pending = signUp.isPending || signIn.isPending || googleStart.isPending;

  return (
    <PageShell>
      <section className="starfield aurora relative px-4 py-12 sm:px-6 sm:py-16">
        <div className="container grid max-w-6xl gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="max-w-md lg:pl-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5"><LockKeyhole className="h-3 w-3 text-primary" /><span className="font-mono text-[0.59rem] uppercase tracking-[0.11em] text-primary">Student Authentication</span></div>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[0.98] tracking-[-0.055em] text-foreground sm:text-6xl">Access your <span className="brand-gradient-text">engineering workspace.</span></h1>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">Manage active simulation solvers, peer-review logs, technical roadmaps, saved trials, and verified learning records.</p>
            <div className="mt-9 space-y-4">{[{ icon: CheckCircle2, title: "Sprint backlog & deliverables", detail: "Live tracking of numerical verification scripts and squad tasks." }, { icon: Sparkles, title: "Polaris AI Engineering Co-Pilot", detail: "Structured reviews of relations, code and literature for Squad Pro." }, { icon: ShieldCheck, title: "Open-source verification", detail: "Linked repositories and reproducible technical documentation." }].map(({ icon: Icon, title, detail }) => <div key={title} className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/8 text-primary"><Icon className="h-4 w-4" /></span><div><p className="text-sm font-medium text-foreground">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div></div>)}</div>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card p-5 shadow-2xl shadow-primary/10 sm:p-8">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative"><PolarisLogo /><div className="mt-7 grid grid-cols-2 gap-1 rounded-xl border border-border bg-secondary/35 p-1"><button type="button" onClick={() => setMode("signup")} className={`press rounded-lg px-3 py-2.5 font-mono text-[0.62rem] transition-colors ${mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Create Account</button><button type="button" onClick={() => setMode("signin")} className={`press rounded-lg px-3 py-2.5 font-mono text-[0.62rem] transition-colors ${mode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Sign In</button></div>
              {googleError && <div role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs leading-5 text-destructive">Google sign-in could not be completed. Please try again or use your email and password.</div>}
              <form className="mt-6" onSubmit={submit}><div className="space-y-4">{mode === "signup" && <Field label="Full Name" name="name" placeholder="Your full name" icon={UserRound} required disabled={pending} />}<Field label="Email Address" name="email" type="email" placeholder="you@example.com" icon={UserRound} required disabled={pending} /><label className="block"><span className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-muted-foreground">Password</span><span className="relative mt-2.5 flex items-center"><LockKeyhole className="absolute left-3 h-4 w-4 text-primary" /><input name="password" type={showPassword ? "text" : "password"} required minLength={mode === "signup" ? 8 : 1} disabled={pending} placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} className="h-11 w-full rounded-xl border border-border bg-secondary/35 py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60" /><button type="button" onClick={() => setShowPassword(value => !value)} className="press absolute right-3 text-muted-foreground hover:text-primary" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label></div><button type="submit" disabled={pending} className="press mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--grad-brand)] px-4 py-3 font-mono text-[0.65rem] font-semibold text-[#08070c] disabled:cursor-wait disabled:opacity-70">{pending ? "Securing your workspace…" : mode === "signup" ? "Initialize Workspace Account" : "Enter Workspace"}<ArrowRight className="h-3.5 w-3.5" /></button></form>
              <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-border" /><span className="font-mono text-[0.55rem] text-muted-foreground">OR</span><span className="h-px flex-1 bg-border" /></div><button type="button" disabled={pending} onClick={() => googleStart.mutate({ origin: window.location.origin })} className="press flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary/25 px-4 py-3 font-mono text-[0.64rem] text-foreground transition-colors hover:border-primary/45 hover:bg-primary/10 disabled:cursor-wait disabled:opacity-60"><Chrome className="h-4 w-4 text-primary" />{googleStart.isPending ? "Connecting to Google…" : "Continue with Google"}</button><p className="mt-5 text-center text-xs leading-5 text-muted-foreground">Open to every learner. Explorer accounts include community access and baseline simulation tools. <Link href="/pricing" className="text-primary hover:text-gold">Compare memberships</Link>.</p></div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function Field({ label, name, type = "text", placeholder, icon: Icon, required, disabled }: { label: string; name: string; type?: string; placeholder: string; icon: typeof UserRound; required?: boolean; disabled?: boolean }) {
  return <label className="block"><span className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-muted-foreground">{label}{required && <span className="text-primary"> *</span>}</span><span className="relative mt-2.5 flex items-center"><Icon className="absolute left-3 h-4 w-4 text-primary" /><input name={name} type={type} required={required} disabled={disabled} placeholder={placeholder} className="h-11 w-full rounded-xl border border-border bg-secondary/35 py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60" /></span></label>;
}
