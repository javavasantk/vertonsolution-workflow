import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDemoPortalSummarySpy, updateClientProjectSpy } = vi.hoisted(() => ({
  getDemoPortalSummarySpy: vi.fn(),
  updateClientProjectSpy: vi.fn(),
}));

vi.mock("./db", () => ({
  getDemoPortalSummary: getDemoPortalSummarySpy,
  updateClientProject: updateClientProjectSpy,
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(role: "admin" | "account_manager" | "consultant" | "delivery_manager" | "finance" | "project_manager" = "consultant"): TrpcContext {
  return {
    user: {
      id: 12,
      openId: "portal-summary-test",
      email: "consultant@demo.vertonsolutions.com",
      name: "Demo Consultant",
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

describe("portal.demoSummary", () => {
  beforeEach(() => { getDemoPortalSummarySpy.mockReset(); updateClientProjectSpy.mockReset(); });

  it("returns protected seeded portal records for an authenticated workspace user", async () => {
    getDemoPortalSummarySpy.mockResolvedValue({
      clients: [{ id: 1, name: "Northstar Retail · Demo" }],
      projects: [],
      demands: [{ id: 1, status: "open" }],
      assignments: [{ id: 1, assignmentState: "active" }],
      timesheets: [{ id: 1, status: "approved" }],
      activities: [{ id: 1, title: "Demo assignment extension review", activityState: "attention" }],
    });

    await expect(appRouter.createCaller(createContext()).portal.demoSummary()).resolves.toMatchObject({
      clients: [{ name: "Northstar Retail · Demo" }],
      activities: [{ title: "Demo assignment extension review" }],
    });
    expect(getDemoPortalSummarySpy).toHaveBeenCalledWith("consultant", 12);
  });

  it("allows every delivery-authorized role to update projects and rejects read-only roles", async () => {
    updateClientProjectSpy.mockResolvedValue({ id: 1, name: "Northstar Commerce Cloud · Demo", deliveryStatus: "at_risk", projectManagerName: "Casey Rivera" });
    const input = { projectId: 1, name: "Northstar Commerce Cloud · Demo", deliveryStatus: "at_risk" as const, projectManagerName: "Casey Rivera" };
    await expect(appRouter.createCaller(createContext("consultant")).portal.updateProject(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(createContext("finance")).portal.updateProject(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    for (const role of ["admin", "account_manager", "delivery_manager", "project_manager"] as const) {
      await expect(appRouter.createCaller(createContext(role)).portal.updateProject(input)).resolves.toMatchObject({ deliveryStatus: "at_risk" });
    }
    expect(updateClientProjectSpy).toHaveBeenCalledTimes(4);
    expect(updateClientProjectSpy).toHaveBeenLastCalledWith(1, 12, input);
  });

  it("rejects delivery statuses outside the approved project workflow", async () => {
    await expect(appRouter.createCaller(createContext("project_manager")).portal.updateProject({
      projectId: 1,
      name: "Northstar Commerce Cloud · Demo",
      deliveryStatus: "blocked" as never,
      projectManagerName: "Casey Rivera",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(updateClientProjectSpy).not.toHaveBeenCalled();
  });
});
