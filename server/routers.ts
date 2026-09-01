import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { generateAiBriefing, generateWorkspaceAssistantReply } from "./aiService";
import { parseRecruiterResume } from "./resumeParserService";
import { extractResumeTextFromBytes, validateResumeMetadata } from "./resumeFileService";
import { storageGetSignedUrl } from "./storage";
import { processPrivateTimesheetForHours } from "./timesheetEvidenceProcessingService";
import { validateTimesheetEvidenceMetadata } from "./timesheetEvidenceFileService";
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

async function retrieveUploadedResumeBytes(fileKey: string) {
  const retryDelaysMs = [0, 300, 750, 1_500, 2_500];
  for (let attempt = 0; attempt < retryDelaysMs.length; attempt += 1) {
    try {
      const signedUrl = await storageGetSignedUrl(fileKey);
      const response = await fetch(signedUrl);
      if (response.ok) return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.warn(`[Resume upload] Private retrieval attempt ${attempt + 1} failed`, error);
    }
    const retryDelay = retryDelaysMs[attempt + 1];
    if (retryDelay) await new Promise(resolve => setTimeout(resolve, retryDelay));
  }
  throw new TRPCError({ code: "BAD_REQUEST", message: "The resume upload could not be retrieved. Upload the file again." });
}

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

const workspaceAssistantInputSchema = z.object({
  page: z.string().trim().min(2).max(64),
  prompt: z.string().trim().min(4).max(600),
});

const candidateInlineUpdateSchema = z.object({
  candidateId: z.number().int().positive(),
  candidateName: z.string().trim().min(2).max(255),
  location: z.string().trim().max(180),
  yearsExperience: z.string().trim().max(64),
  skills: z.array(z.string().trim().min(1).max(64)).max(20),
});

const projectInlineUpdateSchema = z.object({
  projectId: z.number().int().positive(),
  name: z.string().trim().min(2).max(255),
  deliveryStatus: z.enum(["planned", "active", "at_risk", "closing"]),
  projectManagerName: z.string().trim().max(255),
});

const personalOnboardingTaskSchema = z.object({ taskId: z.number().int().positive() });
const consultantCheckInSchema = z.object({
  category: z.enum(["engagement_update", "work_update", "support_note"]),
  factualNote: z.string().trim().min(10).max(500),
});
const consultantTimeSubmissionSchema = z.object({
  assignmentId: z.number().int().positive(),
  weekEnding: z.coerce.date().min(new Date("2000-01-01")),
  hours: z.number().int().min(1).max(168),
  note: z.string().trim().max(500).optional(),
});
const consultantTimeSubmissionUpdateSchema = consultantTimeSubmissionSchema.omit({ assignmentId: true }).extend({
  timeEntryId: z.number().int().positive(),
});
const consultantTimeSubmissionActionSchema = z.object({ timeEntryId: z.number().int().positive() });
const consultantActionInboxItemSchema = z.object({ dedupKey: z.string().trim().min(3).max(160) });
const consultantTimesheetEvidenceMetadataSchema = z.object({
  timeEntryId: z.number().int().positive(),
  fileName: z.string().trim().min(5).max(255),
  mimeType: z.enum(["application/pdf", "image/png", "image/jpeg"]),
  fileSize: z.number().int().min(1).max(5 * 1024 * 1024),
  confirmClientApproved: z.literal(true),
});
const consultantTimesheetEvidenceCompletionSchema = z.object({ sessionId: z.string().uuid() });
const consultantTimesheetEvidenceRetrySchema = z.object({ evidenceId: z.number().int().positive() });
const consultantTimeSubmissionPeriodSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine(input => input.endDate >= input.startDate, { message: "The period end must be on or after the period start.", path: ["endDate"] })
  .refine(input => input.endDate.getTime() - input.startDate.getTime() <= 366 * 24 * 60 * 60 * 1000, { message: "Select a period of no more than 366 days." });
const consultantPersonalActivityTimelineSchema = z.object({
  cursor: z.string().min(8).max(256).optional(),
  limit: z.number().int().min(1).max(25).optional(),
});
const financeTimesheetEvidenceReviewerSchema = z.object({ evidenceId: z.number().int().positive(), reviewerUserId: z.number().int().positive() });
const financeTimesheetEvidenceDiscrepancyNoteSchema = z.object({ evidenceId: z.number().int().positive(), note: z.string().trim().min(10).max(1000) });

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

const consultantActionInboxMutationWindows = new Map<number, { startedAt: number; count: number }>();
function enforceConsultantActionInboxRateLimit(userId: number) {
  const now = Date.now();
  const current = consultantActionInboxMutationWindows.get(userId);
  if (!current || now - current.startedAt >= 60_000) {
    consultantActionInboxMutationWindows.set(userId, { startedAt: now, count: 1 });
    return;
  }
  if (current.count >= 20) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait before updating more Action Inbox items." });
  current.count += 1;
}

export function resetConsultantActionInboxRateLimitsForTests() {
  consultantActionInboxMutationWindows.clear();
}

const consultantTimesheetOcrWindows = new Map<number, { startedAt: number; count: number }>();
function enforceConsultantTimesheetOcrRateLimit(userId: number) {
  const now = Date.now();
  const current = consultantTimesheetOcrWindows.get(userId);
  if (!current || now - current.startedAt >= 10 * 60_000) {
    consultantTimesheetOcrWindows.set(userId, { startedAt: now, count: 1 });
    return;
  }
  if (current.count >= 5) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait before running another timesheet hours extraction." });
  current.count += 1;
}

export function resetConsultantTimesheetOcrRateLimitsForTests() {
  consultantTimesheetOcrWindows.clear();
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => publicUser(opts.ctx.user)),
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
    readinessRecords: protectedProcedure.query(({ ctx }) => {
      if (!['admin', 'hr_compliance'].includes(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Your assigned role cannot review readiness workflow records.' });
      }
      return db.listReadinessProfiles();
    }),
    requestReview: protectedProcedure
      .input(employeeProfileUpdateSchema)
      .mutation(async ({ ctx, input }) => {
        await db.submitEmployeeProfileUpdate(ctx.user.id, input);
        return { success: true, reviewState: "details_requested" as const };
      }),
  }),

  consultant: router({
    myWork: protectedProcedure.query(({ ctx }) => {
      if (!['consultant', 'user'].includes(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Your assigned role cannot access the Consultant My Work dashboard.' });
      }
      return db.getConsultantMyWork(ctx.user.id);
    }),
    personalActivityTimeline: protectedProcedure.input(consultantPersonalActivityTimelineSchema).query(async ({ ctx, input }) => {
      if (!['consultant', 'user'].includes(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Your assigned role cannot access the Consultant Personal Activity Timeline.' });
      }
      try {
        return await db.listConsultantPersonalActivityTimeline(ctx.user.id, input);
      } catch (error) {
        if (error instanceof Error && error.message === 'Timeline cursor is invalid') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'The activity timeline page cursor is invalid.' });
        }
        throw error;
      }
    }),
    myEngagement: protectedProcedure.query(({ ctx }) => {
      if (!['consultant', 'user'].includes(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Your assigned role cannot access the Consultant My Engagement page.' });
      }
      return db.getConsultantMyEngagement(ctx.user.id);
    }),
    checkIns: protectedProcedure.query(({ ctx }) => {
      if (!['consultant', 'user'].includes(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Your assigned role cannot access Consultant Check-ins.' });
      }
      return db.listConsultantCheckIns(ctx.user.id);
    }),
    submitCheckIn: protectedProcedure.input(consultantCheckInSchema).mutation(async ({ ctx, input }) => {
      if (!['consultant', 'user'].includes(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Your assigned role cannot submit a Consultant Check-in.' });
      }
      return db.createConsultantCheckIn(ctx.user.id, input);
    }),
    timeSubmissions: protectedProcedure.query(({ ctx }) => {
      if (!['consultant', 'user'].includes(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Your assigned role cannot access Consultant time submissions.' });
      }
      return db.listConsultantTimeSubmissions(ctx.user.id);
    }),
    timeSubmissionPeriodTotal: protectedProcedure.input(consultantTimeSubmissionPeriodSchema).query(({ ctx, input }) => {
      if (!['consultant', 'user'].includes(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Your assigned role cannot access Consultant time totals.' });
      }
      return db.getConsultantTimeSubmissionPeriodTotal(ctx.user.id, input.startDate, input.endDate);
    }),
    createTimeSubmission: protectedProcedure.input(consultantTimeSubmissionSchema).mutation(async ({ ctx, input }) => {
      if (!['consultant', 'user'].includes(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Your assigned role cannot create Consultant time submissions.' });
      }
      try {
        return await db.createConsultantTimeSubmission(ctx.user.id, input);
      } catch (error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Time entry could not be created for the current assignment.' });
      }
    }),
    updateTimeSubmission: protectedProcedure.input(consultantTimeSubmissionUpdateSchema).mutation(async ({ ctx, input }) => {
      if (!['consultant', 'user'].includes(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Your assigned role cannot update Consultant time submissions.' });
      }
      try {
        return await db.updateConsultantTimeSubmission(ctx.user.id, input.timeEntryId, input);
      } catch (error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only your draft or correction-needed time entry can be updated.' });
      }
    }),
    submitTimeSubmission: protectedProcedure.input(consultantTimeSubmissionActionSchema).mutation(async ({ ctx, input }) => {
      if (!['consultant', 'user'].includes(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Your assigned role cannot submit Consultant time entries.' });
      }
      try {
        return await db.submitConsultantTimeSubmission(ctx.user.id, input.timeEntryId);
      } catch (error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only your draft or correction-needed time entry can be submitted.' });
      }
    }),
    prepareTimesheetEvidenceUpload: protectedProcedure.input(consultantTimesheetEvidenceMetadataSchema).mutation(async ({ ctx, input }) => {
      if (!['consultant', 'user'].includes(ctx.user.role)) throw new TRPCError({ code: 'FORBIDDEN', message: 'Your assigned role cannot upload Consultant timesheet evidence.' });
      try {
        const metadata = validateTimesheetEvidenceMetadata({ fileName: input.fileName, mimeType: input.mimeType, fileSize: input.fileSize });
        const session = await db.createConsultantTimesheetUploadSession(ctx.user.id, { timeEntryId: input.timeEntryId, originalFileName: metadata.fileName, mimeType: input.mimeType, fileSize: input.fileSize });
        return { sessionId: session.id, uploadPath: `/api/consultant/timesheet-upload/${session.id}`, expiresAt: session.expiresAt };
      } catch (error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'A private upload can be prepared only for your submitted or approved time entry.' });
      }
    }),
    completeTimesheetEvidenceUpload: protectedProcedure.input(consultantTimesheetEvidenceCompletionSchema).mutation(async ({ ctx, input }) => {
      if (!['consultant', 'user'].includes(ctx.user.role)) throw new TRPCError({ code: 'FORBIDDEN', message: 'Your assigned role cannot complete Consultant timesheet evidence uploads.' });
      const completedEvidence = await db.getCompletedConsultantTimesheetEvidenceBySession(ctx.user.id, input.sessionId);
      if (completedEvidence) return completedEvidence;
      enforceConsultantTimesheetOcrRateLimit(ctx.user.id);
      const session = await db.getActiveConsultantTimesheetUploadSession(ctx.user.id, input.sessionId);
      if (!session) throw new TRPCError({ code: 'NOT_FOUND', message: 'This private timesheet upload session is unavailable.' });
      try {
        const { fileSha256, ocr } = await processPrivateTimesheetForHours({ fileKey: session.fileKey, originalFileName: session.originalFileName, mimeType: session.mimeType as "application/pdf" | "image/png" | "image/jpeg", fileSize: session.fileSize });
        return await db.completeConsultantTimesheetEvidence(ctx.user.id, { sessionId: session.id, fileSha256, ...ocr });
      } catch (error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'The private timesheet could not be retrieved or processed. Upload the file again.' });
      }
    }),
    retryTimesheetHoursExtraction: protectedProcedure.input(consultantTimesheetEvidenceRetrySchema).mutation(async ({ ctx, input }) => {
      if (!['consultant', 'user'].includes(ctx.user.role)) throw new TRPCError({ code: 'FORBIDDEN', message: 'Your assigned role cannot retry Consultant timesheet extraction.' });
      enforceConsultantTimesheetOcrRateLimit(ctx.user.id);
      try {
        const { evidence } = await db.getOwnedConsultantTimesheetEvidenceForProcessing(ctx.user.id, input.evidenceId);
        const { ocr } = await processPrivateTimesheetForHours({ fileKey: evidence.fileKey, originalFileName: evidence.originalFileName, mimeType: evidence.mimeType as "application/pdf" | "image/png" | "image/jpeg", fileSize: evidence.fileSize });
        return await db.recordConsultantTimesheetEvidenceExtraction(ctx.user.id, evidence.id, ocr);
      } catch (error) {
        if (error instanceof Error && error.message === 'Timesheet evidence was not found') throw new TRPCError({ code: 'NOT_FOUND', message: 'Timesheet evidence was not found for this account.' });
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'The private timesheet hours extraction could not be retried.' });
      }
    }),
    actionInbox: protectedProcedure.query(({ ctx }) => {
      if (!['consultant', 'user'].includes(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Your assigned role cannot access the Consultant Action Inbox.' });
      }
      return db.listConsultantActionInbox(ctx.user.id);
    }),
    markActionRead: protectedProcedure.input(consultantActionInboxItemSchema).mutation(async ({ ctx, input }) => {
      if (!['consultant', 'user'].includes(ctx.user.role)) throw new TRPCError({ code: 'FORBIDDEN', message: 'Your assigned role cannot update the Consultant Action Inbox.' });
      enforceConsultantActionInboxRateLimit(ctx.user.id);
      try { return await db.setConsultantActionInboxState(ctx.user.id, input.dedupKey, 'read'); }
      catch (error) {
        if (error instanceof Error && error.message === 'Action Inbox item was not found') throw new TRPCError({ code: 'NOT_FOUND', message: 'Action Inbox item was not found for this account.' });
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Action Inbox state could not be updated.' });
      }
    }),
    dismissAction: protectedProcedure.input(consultantActionInboxItemSchema).mutation(async ({ ctx, input }) => {
      if (!['consultant', 'user'].includes(ctx.user.role)) throw new TRPCError({ code: 'FORBIDDEN', message: 'Your assigned role cannot update the Consultant Action Inbox.' });
      enforceConsultantActionInboxRateLimit(ctx.user.id);
      try { return await db.setConsultantActionInboxState(ctx.user.id, input.dedupKey, 'dismissed'); }
      catch (error) {
        if (error instanceof Error && error.message === 'Action Inbox item was not found') throw new TRPCError({ code: 'NOT_FOUND', message: 'Action Inbox item was not found for this account.' });
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Action Inbox state could not be updated.' });
      }
    }),
  }),

  onboarding: router({
    myTasks: protectedProcedure.query(({ ctx }) => {
      if (!['consultant', 'user'].includes(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Your assigned role cannot access personal onboarding tasks.' });
      }
      return db.listConsultantOnboardingTasks(ctx.user.id);
    }),
    acknowledgeTask: protectedProcedure.input(personalOnboardingTaskSchema).mutation(async ({ ctx, input }) => {
      if (!['consultant', 'user'].includes(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Your assigned role cannot acknowledge personal onboarding tasks.' });
      }
      try {
        return await db.acknowledgeConsultantOnboardingTask(ctx.user.id, input.taskId);
      } catch (error) {
        throw new TRPCError({ code: 'NOT_FOUND', message: error instanceof Error ? error.message : 'Assigned onboarding task was not found.' });
      }
    }),
  }),

  finance: router({
    timesheetEvidenceReview: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role !== "finance") throw new TRPCError({ code: "FORBIDDEN", message: "Finance access is required for the timesheet evidence review queue." });
      return db.listFinanceTimesheetEvidenceReview();
    }),
    eligibleTimesheetEvidenceReviewers: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role !== "finance") throw new TRPCError({ code: "FORBIDDEN", message: "Finance access is required to assign a timesheet evidence reviewer." });
      return db.listEligibleTimesheetEvidenceReviewers();
    }),
    assignTimesheetEvidenceReviewer: protectedProcedure.input(financeTimesheetEvidenceReviewerSchema).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "finance") throw new TRPCError({ code: "FORBIDDEN", message: "Finance access is required to assign a timesheet evidence reviewer." });
      try {
        return await db.assignFinanceTimesheetEvidenceReviewer(ctx.user.id, input.evidenceId, input.reviewerUserId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "The reviewer could not be assigned.";
        throw new TRPCError({ code: message.includes("not found") ? "NOT_FOUND" : "BAD_REQUEST", message });
      }
    }),
    addTimesheetEvidenceDiscrepancyNote: protectedProcedure.input(financeTimesheetEvidenceDiscrepancyNoteSchema).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "finance") throw new TRPCError({ code: "FORBIDDEN", message: "Finance access is required to add a timesheet discrepancy note." });
      try {
        return await db.addFinanceTimesheetEvidenceDiscrepancyNote(ctx.user.id, input.evidenceId, input.note);
      } catch (error) {
        const message = error instanceof Error ? error.message : "The discrepancy note could not be recorded.";
        throw new TRPCError({ code: message.includes("designated Finance reviewer") ? "FORBIDDEN" : message.includes("not found") ? "NOT_FOUND" : "BAD_REQUEST", message });
      }
    }),
  }),

  portal: router({
    demoSummary: protectedProcedure.query(({ ctx }) => db.getDemoPortalSummary(ctx.user.role as db.PortalSummaryRole, ctx.user.id)),
    updateProject: protectedProcedure.input(projectInlineUpdateSchema).mutation(async ({ ctx, input }) => {
      if (!["admin", "account_manager", "delivery_manager", "project_manager"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Your assigned role cannot edit project records." });
      }
      return db.updateClientProject(input.projectId, ctx.user.id, input);
    }),
  }),

  recruiting: router({
    newHireProgress: recruiterProcedure.query(() => db.listRecruiterNewHireProgress()),
    listCandidates: recruiterProcedure.query(() => db.listRecruiterCandidates()),
    getCandidate: recruiterProcedure
      .input(z.object({ candidateId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const candidate = await db.getRecruiterCandidateById(input.candidateId);
        if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Candidate profile was not found." });
        return candidate;
      }),
    updateCandidate: recruiterProcedure.input(candidateInlineUpdateSchema).mutation(({ ctx, input }) => db.updateCandidateProfile(input.candidateId, ctx.user.id, input)),
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
        return { sessionId: session.id, uploadPath: `/api/recruiter/resume-upload/${session.id}`, expiresAt: session.expiresAt };
      }),
    completeResumeUpload: recruiterProcedure
      .input(resumeUploadCompletionSchema)
      .mutation(async ({ ctx, input }) => {
        const session = await db.getActiveResumeUploadSession(ctx.user.id, input.sessionId);
        if (!session) throw new TRPCError({ code: "BAD_REQUEST", message: "This upload session is invalid, expired, or already completed." });
        const bytes = await retrieveUploadedResumeBytes(session.fileKey);
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
    workspaceAssistant: protectedProcedure
      .input(workspaceAssistantInputSchema)
      .mutation(async ({ ctx, input }) => {
        const lookup = await db.getWorkspaceAssistantLookup(ctx.user.role, input.prompt);
        const response = await generateWorkspaceAssistantReply({ role: ctx.user.role, page: input.page, prompt: input.prompt, databaseContext: lookup.context });
        return { ...response, lookupKind: lookup.kind, records: lookup.records };
      }),
  }),

});

export type AppRouter = typeof appRouter;
