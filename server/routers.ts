import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

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
      .mutation(async ({ input }) => {
        await db.assignWorkforceRole(input.userId, input.role);
        return { success: true } as const;
      }),
  }),

});

export type AppRouter = typeof appRouter;
