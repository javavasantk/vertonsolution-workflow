/**
 * Subscription catalogue. Tier names are contractual — do not rename.
 * All amounts are stored in paise (Razorpay's smallest currency unit).
 */

export type PlanId = "explorer" | "builder" | "builder_annual" | "squad_pro";

export type BillingCycle = "none" | "monthly" | "yearly";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  pricePaise: number;
  /** Display price, e.g. "₹499". */
  priceLabel: string;
  /** e.g. "per month". */
  priceSuffix: string;
  billingCycle: BillingCycle;
  /** Days of access granted per successful payment. */
  periodDays: number;
  /** Entitlement rank — higher unlocks everything below it. */
  tier: number;
  highlight?: boolean;
  badge?: string;
  features: string[];
  notIncluded?: string[];
  /** Max saved AeroForge trials; null = unlimited. */
  trialLimit: number | null;
  /** Number of AeroForge solvers unlocked. */
  solverAccess: string;
};

export const PLANS: Record<PlanId, Plan> = {
  explorer: {
    id: "explorer",
    name: "Explorer",
    tagline: "Start experimenting for free",
    pricePaise: 0,
    priceLabel: "Free",
    priceSuffix: "forever",
    billingCycle: "none",
    periodDays: 0,
    tier: 0,
    features: [
      "Browse the full learning catalog",
      "Free guides, primers and lecture notes",
      "AeroForge demo with 3 starter solvers",
      "Community discussion channels",
      "Live workshop seat reservations",
    ],
    notIncluded: [
      "Saved AeroForge trials",
      "Verified certificates",
      "Mentor code reviews",
      "AI Co-Pilot",
    ],
    trialLimit: 0,
    solverAccess: "3 starter solvers",
  },
  builder: {
    id: "builder",
    name: "Builder",
    tagline: "Full lab access, billed monthly",
    pricePaise: 49900,
    priceLabel: "₹499",
    priceSuffix: "per month",
    billingCycle: "monthly",
    periodDays: 30,
    tier: 1,
    highlight: true,
    badge: "Most popular",
    features: [
      "Everything in Explorer",
      "All mini-courses, every lesson unlocked",
      "Full AeroForge lab — 40+ physics solvers",
      "Unlimited saved simulation trials",
      "Downloadable verified certificates",
      "Benchmark comparisons against NASA datasets",
    ],
    notIncluded: ["Bootcamp cohort seat", "Mentor reviews", "AI Co-Pilot"],
    trialLimit: null,
    solverAccess: "40+ solvers",
  },
  builder_annual: {
    id: "builder_annual",
    name: "Builder Annual",
    tagline: "Same as Builder, two months free",
    pricePaise: 499900,
    priceLabel: "₹4,999",
    priceSuffix: "per year",
    billingCycle: "yearly",
    periodDays: 365,
    tier: 1,
    badge: "Save ₹989",
    features: [
      "Everything in Builder",
      "12 months for the price of 10",
      "Priority workshop seat allocation",
      "Annual progress portfolio export",
    ],
    notIncluded: ["Bootcamp cohort seat", "AI Co-Pilot"],
    trialLimit: null,
    solverAccess: "40+ solvers",
  },
  squad_pro: {
    id: "squad_pro",
    name: "Squad Pro",
    tagline: "For students shipping real systems",
    pricePaise: 149900,
    priceLabel: "₹1,499",
    priceSuffix: "per month",
    billingCycle: "monthly",
    periodDays: 30,
    tier: 2,
    badge: "Cohort access",
    features: [
      "Everything in Builder Annual",
      "Guaranteed bootcamp cohort seat",
      "Weekly mentor code reviews",
      "Build squad membership and sprint backlog",
      "Polaris AI Engineering Co-Pilot",
      "Practitioner endorsement letters",
    ],
    trialLimit: null,
    solverAccess: "40+ solvers + neural operators",
  },
};

export const PLAN_ORDER: PlanId[] = [
  "explorer",
  "builder",
  "builder_annual",
  "squad_pro",
];

export const PLAN_LIST: Plan[] = PLAN_ORDER.map(id => PLANS[id]);

export const DEFAULT_PLAN_ID: PlanId = "explorer";

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && value in PLANS;
}

export function getPlan(planId: string | null | undefined): Plan {
  return isPlanId(planId) ? PLANS[planId] : PLANS.explorer;
}

/** Paid plans only — Explorer never goes through Razorpay. */
export const PAID_PLAN_IDS = PLAN_ORDER.filter(id => PLANS[id].pricePaise > 0);

export function isPaidPlan(planId: string | null | undefined): boolean {
  return getPlan(planId).pricePaise > 0;
}

/** Minimum tier required for each gated capability. */
export const ENTITLEMENTS = {
  saveTrial: 1,
  fullSolvers: 1,
  allLessons: 1,
  certificates: 1,
  mentorReview: 2,
  aiCopilot: 2,
  squadAccess: 2,
  bootcampSeat: 2,
} as const;

export type Entitlement = keyof typeof ENTITLEMENTS;

export function planAllows(
  planId: string | null | undefined,
  entitlement: Entitlement
): boolean {
  return getPlan(planId).tier >= ENTITLEMENTS[entitlement];
}

export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
