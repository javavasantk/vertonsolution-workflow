import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { generateAiBriefing } from "./aiService";
import { parseRecruiterResume } from "./resumeParserService";
import { extractResumeTextFromBytes, validateResumeMetadata } from "./resumeFileService";
import { storageCreateUploadTarget, storageGetSignedUrl } from "./storage";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, recruiterProcedure, router } from "./_core/trpc";

const workforceRoleSchema = z.enum([
  "user",
  "admin",
  "recruiter",
  "hr_compliance",
  "account_manager",
  "delivery_manager",
  "project_manager",
  "finance",
  "consultant",
]);

const employeeProfileUpdateSchema = z.object({
  employmentType: z.string().trim().min(2).max(96),
  statusNote: z.string().trim().min(8).max(500),
});

const workforcePermissionGroups = [
  { role: "admin", label: "Administrator", permissions: ["Full workspace visibility", "User roles", "Permission review", "Audit controls"] },
  { role: "recruiter", label: "Recruiter", permissions: ["Talent pipeline", "New-hire tracking", "Assignment signals"] },
  { role: "hr_compliance", label: "HR & Compliance", permissions: ["Readiness review", "Onboarding coordination", "Audit controls"] },
  { role: "account_manager", label: "Account Manager", permissions: ["Client demand", "Talent submissions", "Delivery visibility"] },
  { role: "delivery_manager", label: "Delivery Manager", permissions: ["Onboarding coordination", "Assignments", "Redeployment"] },
  { role: "project_manager", label: "Project Manager", permissions: ["Delivery visibility", "Time approvals", "Assignment status"] },
  { role: "finance", label: "Finance", permissions: ["Billing readiness", "Commercial fields", "Operational controls"] },
  { role: "consultant", label: "Consultant", permissions: ["Personal profile", "Onboarding tasks", "Assignment visibility"] },
] as const;

const aiAssistantInputSchema = z.object({
  task: z.enum(["recruiter_summary", "onboarding_guidance", "access_review"]),
  context: z.string().trim().min(12).max(1600),
});

const resumeUploadMetadataSchema = z.object({
  fileName: z.string().trim().min(5).max(255),
  mimeType: z.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]),
  fileSize: z.number().int().min(1).max(5 * 1024 * 1024),
});

const resumeUploadCompletionSchema = z.object({ sessionId: z.string().uuid() });

const demoLoginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(12).max(128),
});

const demoResetSchema = z.object({
  email: z.string().trim().email().max(320),
});

const demoNewPasswordSchema = z.object({
  token: z.string().min(24).max(128),
  password: z.string().min(12).max(128),
});

function publicUser(user: any) {
  if (!user) return null;
  const { passwordHash, resetTokenHash, resetTokenExpiresAt, ...safeUser } = user;
  return safeUser;
}

function mayUseAiTask(role: string, task: z.infer<typeof aiAssistantInputSchema>["task"]) {
  if (task === "recruiter_summary") return ["admin", "recruiter"].includes(role);
  if (task === "access_review") return role === "admin";
  return true;
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => publicUser(opts.ctx.user)),
    demoAccounts: publicProcedure.query(async () => {
      const accounts = await db.listDemoAccounts();
      return {
        accounts,
        sharedPassword: db.demoCredentialDetails.password,
        label: "Public demo credentials only — never use for production access.",
      };
    }),
    demoLogin: publicProcedure.input(demoLoginSchema).mutation(async ({ ctx, input }) => {
      const user = await db.authenticateDemoCredentials(input.email, input.password);
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Demo email or password is incorrect." });
      const token = await sdk.createSessionToken(user.openId, { name: user.name ?? "Verton demo user", expiresInMs: 8 * 60 * 60 * 1000 });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: 8 * 60 * 60 * 1000 });
      return publicUser(user);
    }),
    requestDemoPasswordReset: publicProcedure.input(demoResetSchema).mutation(async ({ input }) => {
      const token = await db.requestDemoPasswordReset(input.email);
      return {
        success: true,
        resetToken: token ?? null,
        expiresInMinutes: token ? db.demoCredentialDetails.resetTtlMinutes : null,
        message: token ? "A one-time demonstration reset code is ready." : "If this is a demo account, a reset instruction is available.",
      };
    }),
    resetDemoPassword: publicProcedure.input(demoNewPasswordSchema).mutation(async ({ input }) => {
      const updated = await db.resetDemoPassword(input.token, input.password);
      if (!updated) throw new TRPCError({ code: "BAD_REQUEST", message: "This demonstration reset code is invalid or has expired." });
      return { success: true } as const;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  access: router({
    listUsers: adminProcedure.query(({ ctx }) => ctx.user.isDemo ? db.listDemoAccounts() : db.listWorkforceUsers()),
    assignRole: adminProcedure
      .input(z.object({ userId: z.number().int().positive(), role: workforceRoleSchema }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.isDemo) throw new TRPCError({ code: "FORBIDDEN", message: "Demonstration accounts cannot change workspace roles." });
        if (input.userId === ctx.user.id && input.role !== "admin") {
          throw new Error("Administrators cannot remove their own administrator access");
        }
        await db.assignWorkforceRole(input.userId, input.role, ctx.user.id);
        return { success: true } as const;
      }),
    permissionGroups: adminProcedure.query(() => workforcePermissionGroups),
    roleChangeHistory: adminProcedure.query(({ ctx }) => ctx.user.isDemo ? [] : db.listAccessRoleChanges()),
  }),

  profile: router({
    mine: protectedProcedure.query(({ ctx }) => db.getEmployeeProfile(ctx.user.id)),
    requestReview: protectedProcedure
      .input(employeeProfileUpdateSchema)
      .mutation(async ({ ctx, input }) => {
        await db.submitEmployeeProfileUpdate(ctx.user.id, input);
        return { success: true, reviewState: "details_requested" as const };
      }),
  }),

  recruiting: router({
    newHireProgress: recruiterProcedure.query(({ ctx }) => ctx.user.isDemo ? [] : db.listRecruiterNewHireProgress()),
    listCandidates: recruiterProcedure.query(() => db.listRecruiterCandidates()),
    parseResume: recruiterProcedure
      .input(z.object({ resumeText: z.string().trim().min(80).max(12_000) }))
      .mutation(async ({ ctx, input }) => {
        const parsed = await parseRecruiterResume(input.resumeText);
        const candidate = parsed.unavailable ? null : await db.createCandidateProfile(ctx.user.id, parsed.profile);
        return { ...parsed, candidate };
      }),
    prepareResumeUpload: recruiterProcedure
      .input(resumeUploadMetadataSchema)
      .mutation(async ({ ctx, input }) => {
        const metadata = validateResumeMetadata(input);
        const session = await db.createResumeUploadSession(ctx.user.id, { originalFileName: metadata.fileName, mimeType: input.mimeType, fileSize: input.fileSize });
        const target = await storageCreateUploadTarget(session.fileKey, input.mimeType);
        return { sessionId: session.id, uploadUrl: target.uploadUrl, expiresAt: session.expiresAt };
      }),
    completeResumeUpload: recruiterProcedure
      .input(resumeUploadCompletionSchema)
      .mutation(async ({ ctx, input }) => {
        const session = await db.getActiveResumeUploadSession(ctx.user.id, input.sessionId);
        if (!session) throw new TRPCError({ code: "BAD_REQUEST", message: "This upload session is invalid, expired, or already completed." });
        const signedUrl = await storageGetSignedUrl(session.fileKey);
        const response = await fetch(signedUrl);
        if (!response.ok) throw new TRPCError({ code: "BAD_REQUEST", message: "The resume upload could not be retrieved. Upload the file again." });
        const bytes = Buffer.from(await response.arrayBuffer());
        if (bytes.length !== session.fileSize) throw new TRPCError({ code: "BAD_REQUEST", message: "The uploaded file size does not match the approved upload request." });
        const extracted = await extractResumeTextFromBytes({ fileName: session.originalFileName, mimeType: session.mimeType, bytes });
        const parsed = await parseRecruiterResume(extracted.text);
        if (parsed.unavailable) {
          await db.completeResumeUploadSession(session.id);
          return { ...parsed, candidate: null, fileName: extracted.fileName };
        }
        const candidate = await db.createCandidateProfile(ctx.user.id, parsed.profile, {
          fileKey: session.fileKey,
          originalFileName: extracted.fileName,
          mimeType: session.mimeType,
          fileSize: extracted.bytes.length,
        });
        await db.completeResumeUploadSession(session.id);
        return { ...parsed, candidate, fileName: extracted.fileName };
      }),
  }),

  ai: router({
    assist: protectedProcedure
      .input(aiAssistantInputSchema)
      .mutation(async ({ ctx, input }) => {
        if (!mayUseAiTask(ctx.user.role, input.task)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "This AI workspace is not available for your assigned role." });
        }

        return generateAiBriefing(input.task, input.context);
      }),
  }),

});

export type AppRouter = typeof appRouter;
