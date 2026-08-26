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

function createContext(role: "consultant" | "delivery_manager" = "consultant"): TrpcContext {
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
    expect(getDemoPortalSummarySpy).toHaveBeenCalledOnce();
  });

  it("allows delivery owners to update projects and rejects roles without delivery authority", async () => {
    updateClientProjectSpy.mockResolvedValue({ id: 1, name: "Northstar Commerce Cloud · Demo", deliveryStatus: "at_risk", projectManagerName: "Casey Rivera" });
    const input = { projectId: 1, name: "Northstar Commerce Cloud · Demo", deliveryStatus: "at_risk" as const, projectManagerName: "Casey Rivera" };
    await expect(appRouter.createCaller(createContext("consultant")).portal.updateProject(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(createContext("delivery_manager")).portal.updateProject(input)).resolves.toMatchObject({ deliveryStatus: "at_risk" });
    expect(updateClientProjectSpy).toHaveBeenCalledWith(1, 12, input);
  });
});
