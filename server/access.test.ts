import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

function createContext(role: "user" | "admin", userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
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

  it("prevents an administrator from removing their own administrator access", async () => {
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.access.assignRole({ userId: 1, role: "consultant" })).rejects.toThrow("cannot remove their own administrator access");
  });

  it("sends target, next role, and acting administrator to the auditable role-change helper", async () => {
    const assignRole = vi.spyOn(db, "assignWorkforceRole").mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext("admin", 12));

    await expect(caller.access.assignRole({ userId: 34, role: "recruiter" })).resolves.toEqual({ success: true });
    expect(assignRole).toHaveBeenCalledWith(34, "recruiter", 12);
    assignRole.mockRestore();
  });

  it("serves permission groups only to administrator accounts", async () => {
    const employeeCaller = appRouter.createCaller(createContext("user"));
    const adminCaller = appRouter.createCaller(createContext("admin"));

    await expect(employeeCaller.access.permissionGroups()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(adminCaller.access.permissionGroups()).resolves.toHaveLength(8);
  });

  it("rejects recruiter progress data for a consultant account", async () => {
    const caller = appRouter.createCaller(createContext("user"));

    await expect(caller.recruiting.newHireProgress()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("denies role-restricted AI tasks before reaching the model provider", async () => {
    const caller = appRouter.createCaller(createContext("user"));

    await expect(caller.ai.assist({ task: "recruiter_summary", context: "New hire onboarding progress requires a manager handoff." })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects oversized employee readiness update notes before persisting them", async () => {
    const caller = appRouter.createCaller(createContext("user"));

    await expect(caller.profile.requestReview({ employmentType: "H-1B", statusNote: "x".repeat(501) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("always reads and updates the authenticated employee's own profile record", async () => {
    const getProfile = vi.spyOn(db, "getEmployeeProfile").mockResolvedValue(undefined);
    const updateProfile = vi.spyOn(db, "submitEmployeeProfileUpdate").mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext("user", 17));
    const input = { employmentType: "H-1B", statusNote: "I am requesting an administrative status review." };

    await caller.profile.mine();
    await caller.profile.requestReview(input);

    expect(getProfile).toHaveBeenCalledWith(17);
    expect(updateProfile).toHaveBeenCalledWith(17, input);
    getProfile.mockRestore();
    updateProfile.mockRestore();
  });
});
