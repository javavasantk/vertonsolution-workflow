import { describe, expect, it } from "vitest";
import { authenticateDemoCredentials } from "./db";
import { sdk } from "./_core/sdk";
import { createContext } from "./_core/context";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";

const runWithDatabase = process.env.DATABASE_URL ? it : it.skip;

describe("demo credential session integration", () => {
  runWithDatabase("creates a recruiter session that resolves to the restricted recruiter workspace boundary", async () => {
    const user = await authenticateDemoCredentials("recruiter@demo.vertonsolutions.com", "VertonDemo!2026");
    expect(user).toMatchObject({ role: "recruiter", isDemo: true });

    const token = await sdk.createSessionToken(user!.openId, { name: user!.name ?? "Riley Brooks", expiresInMs: 60_000 });
    const ctx = await createContext({
      req: { headers: { cookie: `${COOKIE_NAME}=${token}` } } as any,
      res: {} as any,
    });

    expect(ctx.user).toMatchObject({ openId: "demo_recruiter", role: "recruiter", isDemo: true });
    const launchboardRows = await appRouter.createCaller(ctx).recruiting.newHireProgress();
    expect(launchboardRows).toEqual(expect.arrayContaining([
      expect.objectContaining({ onboardingStage: expect.any(String), assignmentState: expect.any(String) }),
    ]));
    expect(launchboardRows[0]).not.toHaveProperty("readinessStatus");
  }, 30_000);
});
