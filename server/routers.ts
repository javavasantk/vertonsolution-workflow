import { COOKIE_NAME } from "@shared/const";
import { createGoogleAuthorizationUrl } from "./googleAuth";
import { activateCheckoutAttempt, consumePasswordResetToken, createAeroForgeTrial, createBacklogItem, createCheckoutAttempt, createInquiry, createPasswordResetToken, createPasswordUser, getCheckoutAttempt, getCurrentSubscription, getSubscriptionSummary, getUserByEmail, issueCertificateForVerifiedCompletion, listAeroForgeTrials, listBacklogItems, listCertificates, listCopilotMessages, recordEngineeringProjectCompletion, saveCopilotMessage, scheduleCurrentSubscriptionCancellation, setBacklogItemStatus } from "./db";
import { hashPassword, verifyPassword } from "./auth/passwords";
import { developmentDemoCredentials, sendPasswordResetEmail } from "./auth/resetDelivery";
import { validatePasswordResetOrigin } from "./auth/resetOrigins";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { User } from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { CHALLENGES, solveFlow } from "../shared/aeroforge";
import { getPlan, isPaidPlan, planAllows } from "../shared/plans";
import { cancelRazorpaySubscriptionAtCycleEnd, createRazorpayOrder, razorpayStatus, verifyRazorpayPaymentSignature } from "./razorpay";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => (opts.ctx.user ? toPublicUser(opts.ctx.user) : null)),
    signUp: publicProcedure
      .input(
        z.object({
          name: z.string().trim().min(2).max(160),
          email: z.string().trim().email().max(320),
          password: z.string().min(8).max(128),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { user, created } = await createPasswordUser({
          name: input.name,
          email: input.email,
          passwordHash: await hashPassword(input.password),
        });
        if (!created) {
          throw new TRPCError({ code: "CONFLICT", message: "An account already exists for this email" });
        }
        const session = await sdk.createSessionToken(user.openId, { name: user.name ?? "Polaris Member", sessionVersion: user.sessionVersion });
        ctx.res.cookie(COOKIE_NAME, session, { ...getSessionCookieOptions(ctx.req), maxAge: 1000 * 60 * 60 * 24 * 365 });
        return { user: toPublicUser(user) };
      }),
    signIn: publicProcedure
      .input(z.object({ email: z.string().trim().email().max(320), password: z.string().min(1).max(128) }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Email or password is incorrect" });
        }
        const session = await sdk.createSessionToken(user.openId, { name: user.name ?? "Polaris Member", sessionVersion: user.sessionVersion });
        ctx.res.cookie(COOKIE_NAME, session, { ...getSessionCookieOptions(ctx.req), maxAge: 1000 * 60 * 60 * 24 * 365 });
        return { user: toPublicUser(user) };
      }),
    googleStart: publicProcedure
      .input(z.object({ origin: z.string().url() }))
      .mutation(({ input, ctx }) => ({ url: createGoogleAuthorizationUrl(input.origin, ctx.res, ctx.req) })),
    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().trim().email().max(320), origin: z.string().url() }))
      .mutation(async ({ input, ctx }) => {
        const requestOrigin = typeof ctx.req.headers.origin === "string" ? ctx.req.headers.origin : null;
        let trustedOrigin: string;
        try {
          trustedOrigin = validatePasswordResetOrigin(input.origin, requestOrigin);
        } catch {
          throw new TRPCError({ code: "FORBIDDEN", message: "Invalid password reset origin" });
        }
        const requested = await createPasswordResetToken(input.email);
        if (!requested) return { success: true, debugResetUrl: null };
        const resetUrl = `${trustedOrigin}/auth?reset=${encodeURIComponent(requested.token)}`;
        try {
          const delivery = await sendPasswordResetEmail({ email: requested.user.email!, resetUrl, expiresAt: requested.expiresAt });
          return { success: true, debugResetUrl: delivery.debugResetUrl ?? null };
        } catch (error) {
          console.error("[Auth] Password reset delivery failed", error);
          return { success: true, debugResetUrl: null };
        }
      }),
    resetPassword: publicProcedure
      .input(z.object({ token: z.string().min(32).max(256), password: z.string().min(8).max(128) }))
      .mutation(async ({ input, ctx }) => {
        const user = await consumePasswordResetToken({ token: input.token, passwordHash: await hashPassword(input.password) });
        if (!user) throw new TRPCError({ code: "BAD_REQUEST", message: "This reset link is invalid or has expired." });
        const session = await sdk.createSessionToken(user.openId, { name: user.name ?? "Polaris Member", sessionVersion: user.sessionVersion });
        ctx.res.cookie(COOKIE_NAME, session, { ...getSessionCookieOptions(ctx.req), maxAge: 1000 * 60 * 60 * 24 * 365 });
        return { user: toPublicUser(user) };
      }),
    demoCredentials: publicProcedure.query(() => developmentDemoCredentials()),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  inquiry: router({
    create: publicProcedure
      .input(
        z.object({
          kind: z.enum(["school", "contact"]),
          name: z.string().trim().min(2).max(160),
          email: z.string().trim().email().max(320),
          organisation: z.string().trim().max(240).optional(),
          topic: z.string().trim().max(160).optional(),
          message: z.string().trim().min(10).max(8000),
        })
      )
      .mutation(async ({ input }) => {
        const inquiryId = await createInquiry({
          kind: input.kind,
          name: input.name,
          email: input.email,
          organisation: input.organisation || null,
          topic: input.topic || null,
          message: input.message,
        });
        return { success: true, inquiryId } as const;
      }),
  }),
  aeroforge: router({
    list: protectedProcedure.query(({ ctx }) => listAeroForgeTrials(ctx.user.id)),
    save: protectedProcedure
      .input(
        z.object({
          challengeId: z.string().refine(id => CHALLENGES.some(challenge => challenge.id === id), "Unknown challenge"),
          mach: z.number().finite(),
          alphaDeg: z.number().finite(),
          altitudeKm: z.number().finite(),
          label: z.string().trim().max(160).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!planAllows(ctx.user.planId, "saveTrial")) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Saving AeroForge trials requires Builder or Squad Pro." });
        }
        const result = solveFlow(input);
        const trialId = await createAeroForgeTrial({ userId: ctx.user.id, input, result, label: input.label });
        return { trialId, result };
      }),
  }),
  subscription: router({
    checkoutStatus: publicProcedure.query(() => razorpayStatus()),
    me: protectedProcedure.query(({ ctx }) => getSubscriptionSummary(ctx.user.id)),
    createOrder: protectedProcedure
      .input(z.object({ planId: z.enum(["builder", "builder_annual", "squad_pro"]) }))
      .mutation(async ({ ctx, input }) => {
        const status = razorpayStatus();
        if (!status.configured || !status.keyId) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: status.reason ?? "Razorpay is not configured" });
        }
        if (!isPaidPlan(input.planId)) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a paid membership plan" });
        const plan = getPlan(input.planId);
        let order;
        try {
          order = await createRazorpayOrder({
            amountPaise: plan.pricePaise,
            receipt: `pp_${ctx.user.id}_${Date.now()}`.slice(0, 40),
            notes: { userId: String(ctx.user.id), planId: plan.id, product: "Project Polaris membership" },
          });
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error instanceof Error ? error.message : "Could not create Razorpay order" });
        }
        await createCheckoutAttempt({ userId: ctx.user.id, planId: plan.id, amountPaise: plan.pricePaise, billingCycle: plan.billingCycle, razorpayOrderId: order.id });
        return { orderId: order.id, amountPaise: plan.pricePaise, currency: "INR", keyId: status.keyId, planName: plan.name };
      }),
    verifyCheckout: protectedProcedure
      .input(z.object({ razorpayOrderId: z.string().min(4), razorpayPaymentId: z.string().min(4), razorpaySignature: z.string().min(32) }))
      .mutation(async ({ ctx, input }) => {
        const checkout = await getCheckoutAttempt(input.razorpayOrderId);
        if (!checkout || checkout.subscription.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND", message: "Checkout attempt was not found" });
        if (!verifyRazorpayPaymentSignature({ orderId: input.razorpayOrderId, paymentId: input.razorpayPaymentId, signature: input.razorpaySignature })) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Razorpay signature verification failed. The membership was not activated." });
        }
        const activated = await activateCheckoutAttempt({ razorpayOrderId: input.razorpayOrderId, razorpayPaymentId: input.razorpayPaymentId, razorpaySignature: input.razorpaySignature });
        return { success: true, planId: activated.planId, currentPeriodEnd: activated.currentPeriodEnd };
      }),
    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      const subscription = await getCurrentSubscription(ctx.user.id);
      if (!subscription) throw new TRPCError({ code: "NOT_FOUND", message: "No active membership to cancel" });
      if (subscription.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "This membership is not currently active" });
      if (subscription.cancelledAt) return { success: true, scheduled: true, currentPeriodEnd: subscription.currentPeriodEnd };
      if (subscription.razorpaySubscriptionId) {
        const status = razorpayStatus();
        if (!status.configured) throw new TRPCError({ code: "PRECONDITION_FAILED", message: status.reason ?? "Razorpay is not configured" });
        try {
          await cancelRazorpaySubscriptionAtCycleEnd(subscription.razorpaySubscriptionId);
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error instanceof Error ? error.message : "Could not schedule membership cancellation" });
        }
      }
      const scheduled = await scheduleCurrentSubscriptionCancellation(ctx.user.id);
      return { success: true, scheduled: true, currentPeriodEnd: scheduled?.currentPeriodEnd ?? null };
    }),
  }),
  workspace: router({
    overview: protectedProcedure.query(async ({ ctx }) => {
      const [backlog, trials, certificates, membership] = await Promise.all([
        listBacklogItems(ctx.user.id),
        listAeroForgeTrials(ctx.user.id, 6),
        listCertificates(ctx.user.id),
        getSubscriptionSummary(ctx.user.id),
      ]);
      return { backlog, trials, certificates, membership };
    }),
    addBacklogItem: protectedProcedure
      .input(z.object({ title: z.string().trim().min(3).max(240), squad: z.string().trim().max(120).optional(), priority: z.enum(["low", "medium", "high"]).default("medium"), dueAt: z.number().int().positive().optional() }))
      .mutation(async ({ ctx, input }) => {
        const itemId = await createBacklogItem({ userId: ctx.user.id, title: input.title, squad: input.squad, priority: input.priority, dueAt: input.dueAt ? new Date(input.dueAt) : null });
        return { itemId };
      }),
    setBacklogStatus: protectedProcedure
      .input(z.object({ itemId: z.number().int().positive(), status: z.enum(["todo", "in_progress", "review", "done"]) }))
      .mutation(async ({ ctx, input }) => {
        await setBacklogItemStatus({ userId: ctx.user.id, itemId: input.itemId, status: input.status });
        return { success: true };
      }),
    copilotMessages: protectedProcedure.query(async ({ ctx }) => {
      if (!planAllows(ctx.user.planId, "aiCopilot")) throw new TRPCError({ code: "FORBIDDEN", message: "Polaris AI Co-Pilot requires Squad Pro." });
      return listCopilotMessages(ctx.user.id);
    }),
    askCopilot: protectedProcedure
      .input(z.object({ prompt: z.string().trim().min(4).max(1400) }))
      .mutation(async ({ ctx, input }) => {
        if (!planAllows(ctx.user.planId, "aiCopilot")) throw new TRPCError({ code: "FORBIDDEN", message: "Polaris AI Co-Pilot requires Squad Pro." });
        const recent = await listCopilotMessages(ctx.user.id, 10);
        await saveCopilotMessage({ userId: ctx.user.id, role: "user", content: input.prompt });
        try {
          const response = await invokeLLM({
            model: "claude-haiku-4-5",
            maxTokens: 550,
            messages: [
              { role: "system", content: "You are Polaris AI Co-Pilot, a careful aerospace education assistant. Help students reason about reduced-order aerodynamic simulations and engineering workflow. Be concise, state assumptions, distinguish educational approximations from certification-grade analysis, and never invent experimental results or citations." },
              ...recent.map(message => ({ role: message.role, content: message.content })),
              { role: "user", content: input.prompt },
            ],
          });
          const content = typeof response.choices[0]?.message.content === "string" ? response.choices[0].message.content.trim() : "";
          if (!content) throw new Error("The Co-Pilot returned no response");
          await saveCopilotMessage({ userId: ctx.user.id, role: "assistant", content });
          return { content };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error instanceof Error ? error.message : "Co-Pilot is temporarily unavailable" });
        }
      }),
  }),
  admin: router({
    recordCompletion: adminProcedure
      .input(z.object({ userId: z.number().int().positive(), catalogSlug: z.string().trim().min(2).max(120), trialId: z.number().int().positive() }))
      .mutation(async ({ input }) => recordEngineeringProjectCompletion(input)),
    issueCertificate: adminProcedure
      .input(z.object({ userId: z.number().int().positive(), catalogSlug: z.string().trim().min(2).max(120) }))
      .mutation(async ({ input }) => {
        const certificate = await issueCertificateForVerifiedCompletion(input);
        return { ...certificate, verified: true };
      }),
  }),
});

function toPublicUser(user: User) {
  return {
    id: user.id,
    openId: user.openId,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    loginMethod: user.loginMethod,
    role: user.role,
    planId: user.planId,
    createdAt: user.createdAt,
    lastSignedIn: user.lastSignedIn,
  };
}

export type AppRouter = typeof appRouter;
