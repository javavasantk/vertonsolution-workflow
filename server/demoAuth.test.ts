import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbMock, createSessionTokenSpy } = vi.hoisted(() => ({
  dbMock: {
    listDemoAccounts: vi.fn(),
    authenticateDemoCredentials: vi.fn(),
    requestDemoPasswordReset: vi.fn(),
    resetDemoPassword: vi.fn(),
    assignWorkforceRole: vi.fn(),
    listWorkforceUsers: vi.fn(),
    listRecruiterNewHireProgress: vi.fn(),
    demoCredentialDetails: { resetTtlMinutes: 15 },
  },
  createSessionTokenSpy: vi.fn(),
}));

vi.mock("./db", () => dbMock);
vi.mock("./_core/sdk", () => ({ sdk: { createSessionToken: createSessionTokenSpy } }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext() {
  const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }),
      clearCookie: vi.fn(),
    } as TrpcContext["res"],
  };
  return { ctx, cookies };
}

function createDemoContext(role: "admin" | "recruiter"): TrpcContext {
  return {
    user: {
      id: 2,
      openId: `demo_${role}`,
      name: "Demo User",
      email: `${role}@demo.vertonsolutions.com`,
      loginMethod: "demo-credentials",
      isDemo: true,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as TrpcContext["res"],
  };
}

const demoUser = {
  id: 2,
  openId: "demo_recruiter",
  name: "Riley Brooks",
  email: "recruiter@demo.vertonsolutions.com",
  loginMethod: "demo-credentials",
  passwordHash: "salt:hash",
  resetTokenHash: null,
  resetTokenExpiresAt: null,
  isDemo: true,
  role: "recruiter" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("demo credential authentication", () => {
  beforeEach(() => {
    Object.values(dbMock).forEach(value => { if (typeof value === "function") (value as ReturnType<typeof vi.fn>).mockReset(); });
    createSessionTokenSpy.mockReset();
  });

  it("does not expose a public role directory or shared demonstration password procedure", () => {
    const procedures = appRouter._def.procedures as Record<string, unknown>;
    expect(procedures).not.toHaveProperty("auth.demoAccounts");
  });

  it("accepts valid demo credentials, writes a short demo session, and omits password metadata", async () => {
    dbMock.authenticateDemoCredentials.mockResolvedValue(demoUser);
    createSessionTokenSpy.mockResolvedValue("signed-demo-session");
    const { ctx, cookies } = createPublicContext();

    const result = await appRouter.createCaller(ctx).auth.demoLogin({ email: "recruiter@demo.vertonsolutions.com", password: "VertonDemo!2026" });

    expect(result).toMatchObject({ openId: "demo_recruiter", role: "recruiter", isDemo: true });
    expect(result).not.toHaveProperty("passwordHash");
    expect(result).not.toHaveProperty("resetTokenHash");
    expect(result).not.toHaveProperty("resetTokenExpiresAt");
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.value).toBe("signed-demo-session");
    expect(cookies[0]?.options).toMatchObject({ maxAge: 8 * 60 * 60 * 1000, httpOnly: true });
  });

  it("rejects invalid demonstration credentials", async () => {
    dbMock.authenticateDemoCredentials.mockResolvedValue(undefined);
    const { ctx } = createPublicContext();

    await expect(appRouter.createCaller(ctx).auth.demoLogin({ email: "recruiter@demo.vertonsolutions.com", password: "WrongPassword!2026" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("provides a demo reset code only for a demonstration account", async () => {
    dbMock.requestDemoPasswordReset.mockResolvedValue("reset-token-12345678901234567890");
    const { ctx } = createPublicContext();

    await expect(appRouter.createCaller(ctx).auth.requestDemoPasswordReset({ email: "recruiter@demo.vertonsolutions.com" })).resolves.toMatchObject({ success: true, resetToken: "reset-token-12345678901234567890", expiresInMinutes: 15 });
  });

  it("returns a generic success response for an unknown address without a reset token", async () => {
    dbMock.requestDemoPasswordReset.mockResolvedValue(undefined);
    const { ctx } = createPublicContext();

    const response = await appRouter.createCaller(ctx).auth.requestDemoPasswordReset({ email: "unknown@example.com" });
    expect(response).toEqual({
      success: true,
      resetToken: null,
      expiresInMinutes: null,
      message: "If this is a demo account, a reset instruction is available.",
    });
    expect(response).not.toHaveProperty("resetTokenHash");
  });

  it("rejects an expired or invalid reset code", async () => {
    dbMock.resetDemoPassword.mockResolvedValue(false);
    const { ctx } = createPublicContext();

    await expect(appRouter.createCaller(ctx).auth.resetDemoPassword({ token: "reset-token-12345678901234567890", password: "ReplacementDemo!2026" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("keeps public demo sessions from changing roles while permitting safe seeded recruiter progress", async () => {
    dbMock.listRecruiterNewHireProgress.mockResolvedValue([{ userId: 2, onboardingStage: "manager_confirmation", progressPercent: 82 }]);
    const adminCaller = appRouter.createCaller(createDemoContext("admin"));
    const recruiterCaller = appRouter.createCaller(createDemoContext("recruiter"));

    await expect(adminCaller.access.assignRole({ userId: 99, role: "recruiter" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(recruiterCaller.recruiting.newHireProgress()).resolves.toEqual([{ userId: 2, onboardingStage: "manager_confirmation", progressPercent: 82 }]);
    expect(dbMock.assignWorkforceRole).not.toHaveBeenCalled();
    expect(dbMock.listRecruiterNewHireProgress).toHaveBeenCalledOnce();
  });

  it("keeps a demonstration administrator scoped to demonstration accounts rather than production administration records", async () => {
    dbMock.listDemoAccounts.mockResolvedValue([{ id: 2, name: "Avery Morgan", email: "administrator@demo.vertonsolutions.com", role: "admin" }]);
    const demoAdminCaller = appRouter.createCaller(createDemoContext("admin"));

    await expect(demoAdminCaller.access.listUsers()).resolves.toEqual([{ id: 2, name: "Avery Morgan", email: "administrator@demo.vertonsolutions.com", role: "admin" }]);
    expect(dbMock.listWorkforceUsers).not.toHaveBeenCalled();
  });
});
