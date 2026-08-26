import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
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

function mayUseAiTask(role: string, task: z.infer<typeof aiAssistantInputSchema>["task"]) {
  if (task === "recruiter_summary") return ["admin", "recruiter"].includes(role);
  if (task === "access_review") return role === "admin";
  return true;
}

const aiTaskInstructions = {
  recruiter_summary: "Create a concise recruiter handoff summary from the supplied onboarding and assignment signals. Prioritize human follow-up actions.",
  onboarding_guidance: "Create practical onboarding guidance for the signed-in employee based only on the supplied task context. Suggest a human owner for each follow-up.",
  access_review: "Create a concise administrator access-review briefing from the supplied role and audit context. Identify governance follow-ups without changing or recommending automatic permissions.",
} as const;

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  access: router({
    listUsers: adminProcedure.query(() => db.listWorkforceUsers()),
    assignRole: adminProcedure
      .input(z.object({ userId: z.number().int().positive(), role: workforceRoleSchema }))
      .mutation(async ({ ctx, input }) => {
        if (input.userId === ctx.user.id && input.role !== "admin") {
          throw new Error("Administrators cannot remove their own administrator access");
        }
        await db.assignWorkforceRole(input.userId, input.role, ctx.user.id);
        return { success: true } as const;
      }),
    permissionGroups: adminProcedure.query(() => workforcePermissionGroups),
    roleChangeHistory: adminProcedure.query(() => db.listAccessRoleChanges()),
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
    newHireProgress: recruiterProcedure.query(() => db.listRecruiterNewHireProgress()),
  }),

  ai: router({
    assist: protectedProcedure
      .input(aiAssistantInputSchema)
      .mutation(async ({ ctx, input }) => {
        if (!mayUseAiTask(ctx.user.role, input.task)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "This AI workspace is not available for your assigned role." });
        }

        const result = await invokeLLM({
          model: "claude-haiku-4-5",
          maxTokens: 500,
          messages: [
            {
              role: "system",
              content: "You are Verton Workforce Hub's operational writing assistant. Produce a short, practical briefing using only the supplied context. Do not make legal, immigration, or work-authorization eligibility decisions. Do not request documents or infer authorization status. Use clear headings: Summary, Human follow-up, Boundary.",
            },
            {
              role: "user",
              content: `${aiTaskInstructions[input.task]}\n\nContext:\n${input.context}`,
            },
          ],
        });

        const content = result.choices[0]?.message.content;
        const briefing = typeof content === "string"
          ? content
          : content?.filter(part => part.type === "text").map(part => part.text).join("\n") ?? "No AI briefing was returned.";

        return { briefing, task: input.task, model: result.model };
      }),
  }),

});

export type AppRouter = typeof appRouter;
