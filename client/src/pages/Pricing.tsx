import { useAuth } from "@/_core/hooks/useAuth";
import { PageHero, PageShell } from "@/components/PageShell";
import { trpc } from "@/lib/trpc";
import { formatPaise, getPlan, PLAN_LIST, type PlanId } from "@shared/plans";
import { Check, CircleAlert, CreditCard, Crown, ExternalLink, History, Loader2, ShieldCheck, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

type RazorpayResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global { interface Window { Razorpay?: RazorpayConstructor } }

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise<boolean>(resolve => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PricingPage() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
  const checkoutStatus = trpc.subscription.checkoutStatus.useQuery();
  const membership = trpc.subscription.me.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const utils = trpc.useUtils();
  const verifyCheckout = trpc.subscription.verifyCheckout.useMutation({
    onSuccess: ({ planId }) => {
      toast.success(`${getPlan(planId).name} is active`, { description: "Your membership access has been updated." });
      utils.auth.me.invalidate();
      utils.subscription.me.invalidate();
      utils.aeroforge.list.invalidate();
      setPendingPlan(null);
    },
    onError: error => { toast.error("Membership verification failed", { description: error.message }); setPendingPlan(null); },
  });
  const createOrder = trpc.subscription.createOrder.useMutation({
    onSuccess: async order => {
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) { toast.error("Razorpay Checkout could not load", { description: "Check your network and try again." }); setPendingPlan(null); return; }
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amountPaise,
        currency: order.currency,
        name: "Project Polaris",
        description: `${order.planName} membership`,
        order_id: order.orderId,
        prefill: { name: user?.name ?? "", email: user?.email ?? "" },
        notes: { product: "Project Polaris membership" },
        theme: { color: "#8b5cf6" },
        modal: { ondismiss: () => setPendingPlan(null) },
        handler: (response: RazorpayResponse) => verifyCheckout.mutate({ razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature }),
      });
      checkout.open();
    },
    onError: error => { toast.error("Checkout is unavailable", { description: error.message }); setPendingPlan(null); },
  });
  const cancel = trpc.subscription.cancel.useMutation({ onSuccess: ({ currentPeriodEnd }) => { toast.success("Cancellation scheduled", { description: currentPeriodEnd ? `Your paid access continues until ${new Date(currentPeriodEnd).toLocaleDateString()}.` : "Your paid access remains available for the current period." }); utils.subscription.me.invalidate(); }, onError: error => toast.error("Could not cancel membership", { description: error.message }) });
  const configured = checkoutStatus.data?.configured ?? false;
  const currentPlan = getPlan(user?.planId);

  const startCheckout = (planId: PlanId) => {
    if (planId === "explorer") { setLocation(isAuthenticated ? "/portal" : "/auth?next=/portal"); return; }
    if (!isAuthenticated) { setLocation("/auth?next=/pricing"); return; }
    if (!configured) { toast.info("Razorpay credentials are required", { description: "The platform owner must add test or live Razorpay keys before checkout can begin." }); return; }
    setPendingPlan(planId);
    createOrder.mutate({ planId: planId as "builder" | "builder_annual" | "squad_pro" });
  };

  return <PageShell>
    <PageHero eyebrow="Membership Plans // Designed for the build" title={<>Choose the access level your <span className="brand-gradient-text">engineering work needs.</span></>} description="Begin with open exploration, then unlock reproducible simulations, verified learning records, and squad-level support as your projects deepen.">
      <div className="flex flex-wrap items-center gap-3"><span className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/8 px-3 py-2 font-mono text-[0.59rem] text-success"><ShieldCheck className="h-3.5 w-3.5" />Secure server-side verification</span><span className="rounded-full border border-border bg-card px-3 py-2 font-mono text-[0.59rem] text-muted-foreground">INR billing · Cancel from workspace</span></div>
    </PageHero>
    <section className="container px-4 py-8 sm:px-6 sm:py-12">
      {!configured && <div className="mb-7 flex flex-col gap-3 rounded-2xl border border-gold/35 bg-gold/10 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-gold" /><div><p className="font-mono text-[0.62rem] font-semibold text-foreground">Razorpay test configuration required</p><p className="mt-1 text-xs leading-5 text-muted-foreground">The pricing model and secure order, signature-verification, and webhook paths are ready. Add Razorpay credentials in project settings to enable actual checkout.</p></div></div><span className="shrink-0 rounded-full border border-gold/30 px-3 py-1.5 font-mono text-[0.55rem] text-gold">Payments disabled safely</span></div>}
      {isAuthenticated && <div className="mb-7 flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/7 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-primary">Current membership</p><p className="mt-1 flex items-center gap-2 text-lg font-semibold text-foreground"><Crown className="h-4 w-4 text-gold" />{currentPlan.name}</p></div>{membership.data?.subscription?.currentPeriodEnd && <p className="text-xs text-muted-foreground">{membership.data.subscription.cancelledAt ? "Cancellation effective" : "Current period ends"} {new Date(membership.data.subscription.currentPeriodEnd).toLocaleDateString()}</p>}{membership.data?.subscription?.status === "active" && currentPlan.id !== "explorer" && <button type="button" onClick={() => cancel.mutate()} disabled={cancel.isPending || Boolean(membership.data.subscription.cancelledAt)} className="press rounded-full border border-border px-3 py-2 font-mono text-[0.57rem] text-muted-foreground hover:border-destructive/50 hover:text-destructive disabled:opacity-60">{membership.data.subscription.cancelledAt ? "Cancellation scheduled" : cancel.isPending ? "Scheduling…" : "Cancel at period end"}</button>}</div>}
      <div className="grid gap-4 lg:grid-cols-4">{PLAN_LIST.map(plan => { const current = currentPlan.id === plan.id; const pending = pendingPlan === plan.id; return <article key={plan.id} className={`relative flex min-h-[535px] flex-col overflow-hidden rounded-2xl border p-5 transition-transform hover:-translate-y-1 ${plan.highlight ? "border-primary/60 bg-card shadow-2xl shadow-primary/12" : "border-border bg-card"}`}><div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-violet-300 to-gold opacity-0 transition-opacity duration-200 group-hover:opacity-100" />{plan.badge && <span className={`mb-4 inline-flex w-fit rounded-full px-2.5 py-1 font-mono text-[0.52rem] uppercase tracking-[0.08em] ${plan.highlight ? "bg-primary text-primary-foreground" : "bg-gold/15 text-gold"}`}>{plan.badge}</span>}<h2 className="font-display text-3xl font-bold text-foreground">{plan.name}</h2><p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">{plan.tagline}</p><div className="mt-6 border-y border-border py-5"><p className="font-display text-4xl font-bold text-foreground">{plan.priceLabel}</p><p className="mt-1 font-mono text-[0.56rem] text-muted-foreground">{plan.priceSuffix}</p></div><ul className="mt-5 flex-1 space-y-3">{plan.features.map(feature => <li key={feature} className="flex gap-2 text-xs leading-5 text-foreground"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />{feature}</li>)}{plan.notIncluded?.map(feature => <li key={feature} className="flex gap-2 text-xs leading-5 text-muted-foreground/65"><X className="mt-0.5 h-3.5 w-3.5 shrink-0" />{feature}</li>)}</ul><button type="button" onClick={() => startCheckout(plan.id)} disabled={pending || current} className={`press mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-mono text-[0.62rem] font-semibold disabled:cursor-not-allowed disabled:opacity-55 ${plan.highlight ? "bg-[image:var(--grad-brand)] text-[#090710]" : "border border-primary/40 bg-primary/8 text-primary hover:bg-primary hover:text-primary-foreground"}`}>{pending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Preparing secure checkout…</> : current ? "Current membership" : plan.id === "explorer" ? "Start Exploring" : !configured ? "Razorpay configuration required" : <><CreditCard className="h-3.5 w-3.5" />Choose {plan.name}</>}</button></article>; })}</div>
      <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_1.3fr]"><div className="rounded-2xl border border-border bg-card p-5"><p className="flex items-center gap-2 font-mono text-[0.59rem] uppercase tracking-[0.1em] text-muted-foreground"><ShieldCheck className="h-4 w-4 text-success" />Billing safeguards</p><div className="mt-4 space-y-3 text-xs leading-5 text-muted-foreground"><p><span className="font-medium text-foreground">Orders first.</span> Every checkout uses a server-created order that locks its price and plan metadata.</p><p><span className="font-medium text-foreground">No client-side fulfilment.</span> Access changes only after server-side payment signature verification or a signed Razorpay webhook.</p><p><span className="font-medium text-foreground">No credentials in the browser.</span> Razorpay secrets remain server-side; only the required Key ID reaches Checkout.</p></div></div><div className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between gap-3"><div><p className="flex items-center gap-2 font-mono text-[0.59rem] uppercase tracking-[0.1em] text-muted-foreground"><History className="h-4 w-4 text-primary" />Payment history</p><p className="mt-1 text-sm text-foreground">Your verified membership ledger</p></div>{!isAuthenticated && <Link href="/auth?next=/pricing" className="font-mono text-[0.58rem] text-primary hover:text-gold">Sign in to view →</Link>}</div>{!isAuthenticated ? <p className="mt-5 text-xs leading-5 text-muted-foreground">Sign in to review your order attempts, payment verification status, and membership periods.</p> : membership.isLoading ? <p className="mt-5 font-mono text-[0.6rem] text-muted-foreground">Loading ledger…</p> : membership.data?.payments.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[500px] text-left"><thead><tr className="border-b border-border font-mono text-[0.5rem] uppercase tracking-[0.08em] text-muted-foreground"><th className="pb-2">Plan</th><th className="pb-2">Amount</th><th className="pb-2">Status</th><th className="pb-2">Date</th></tr></thead><tbody>{membership.data.payments.map(payment => <tr key={payment.id} className="border-b border-border/70 text-xs last:border-0"><td className="py-3 text-foreground">{getPlan(payment.planId).name}</td><td className="py-3 font-mono text-muted-foreground">{formatPaise(payment.amountPaise)}</td><td className="py-3"><span className={payment.status === "paid" ? "text-success" : payment.status === "failed" ? "text-destructive" : "text-gold"}>{payment.status}</span></td><td className="py-3 text-muted-foreground">{new Date(payment.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <p className="mt-5 text-xs leading-5 text-muted-foreground">No payment attempts yet. Your Explorer access is free and remains available.</p>}</div></div>
      <div className="mt-7 flex items-center justify-center gap-2 text-center font-mono text-[0.56rem] text-muted-foreground"><ExternalLink className="h-3 w-3 text-primary" />Need a school or cohort agreement? <Link href="/contact" className="text-primary hover:text-gold">Talk with Project Polaris</Link>.</div>
    </section>
  </PageShell>;
}
