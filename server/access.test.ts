import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(role: "user" | "admin"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "role-test-user",
      email: "role-test@example.com",
      name: "Role Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("access router", () => {
  it("rejects role-management access for non-administrator accounts", async () => {
    const caller = appRouter.createCaller(createContext("user"));

    await expect(caller.access.listUsers()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

