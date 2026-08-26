import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDemoPortalSummarySpy } = vi.hoisted(() => ({
  getDemoPortalSummarySpy: vi.fn(),
}));

vi.mock("./db", () => ({
  getDemoPortalSummary: getDemoPortalSummarySpy,
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: {
      id: 12,
      openId: "portal-summary-test",
      email: "consultant@demo.vertonsolutions.com",
      name: "Demo Consultant",
      loginMethod: "demo-credentials",
      isDemo: true,
      role: "consultant",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as TrpcContext["res"],
  };
}

describe("portal.demoSummary", () => {
  beforeEach(() => getDemoPortalSummarySpy.mockReset());

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
});
