import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserByEmail, createSessionToken } = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  createSessionToken: vi.fn(),
}));

vi.mock("./db", async importActual => ({ ...(await importActual<typeof import("./db")>()), getUserByEmail }));
vi.mock("./_core/sdk", async importActual => ({ ...(await importActual<typeof import("./_core/sdk")>()), sdk: { createSessionToken } }));

import { appRouter } from "./routers";
import { hashPassword } from "./auth/passwords";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

function context(): { ctx: TrpcContext; cookieCalls: Array<{ name: string; value: string; options: Record<string, unknown> }> } {
  const cookieCalls: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  return {
    ctx: {
      user: null,
      req: { protocol: "http", hostname: "localhost", headers: {} } as TrpcContext["req"],
      res: { cookie: (name: string, value: string, options: Record<string, unknown>) => cookieCalls.push({ name, value, options }) } as TrpcContext["res"],
    },
    cookieCalls,
  };
}

describe("auth.signIn", () => {
  beforeEach(() => { getUserByEmail.mockReset(); createSessionToken.mockReset(); });

  it("accepts correct credentials and writes the JWT session cookie", async () => {
    getUserByEmail.mockResolvedValue({ id: 23, openId: "pw-auth-test", name: "Aero Student", email: "student@example.invalid", passwordHash: await hashPassword("strong-passphrase"), planId: "explorer", role: "user", avatarUrl: null, loginMethod: "password", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() });
    createSessionToken.mockResolvedValue("signed-session-token");
    const { ctx, cookieCalls } = context();
    const result = await appRouter.createCaller(ctx).auth.signIn({ email: "student@example.invalid", password: "strong-passphrase" });
    expect(result.user.email).toBe("student@example.invalid");
    expect(createSessionToken).toHaveBeenCalledWith("pw-auth-test", { name: "Aero Student" });
    expect(cookieCalls[0]).toMatchObject({ name: COOKIE_NAME, value: "signed-session-token", options: { httpOnly: true } });
  });

  it("rejects an incorrect password without creating a session", async () => {
    getUserByEmail.mockResolvedValue({ id: 23, openId: "pw-auth-test", name: "Aero Student", email: "student@example.invalid", passwordHash: await hashPassword("strong-passphrase"), planId: "explorer", role: "user", avatarUrl: null, loginMethod: "password", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() });
    const { ctx, cookieCalls } = context();
    await expect(appRouter.createCaller(ctx).auth.signIn({ email: "student@example.invalid", password: "wrong-password" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(createSessionToken).not.toHaveBeenCalled();
    expect(cookieCalls).toHaveLength(0);
  });
});
