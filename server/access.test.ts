import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

function createContext(role: "user" | "admin" | "recruiter" | "hr_compliance" | "consultant", userId = 1): TrpcContext {
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

  it("allows recruiter and Administrator launchboard access only to safe identity, onboarding, and assignment workflow fields", async () => {
    const safeRows = [{ id: 8, name: "Jordan Lee", email: "jordan@vertonsolutions.com", role: "consultant", onboardingStage: "manager_confirmation", progressPercent: 80, managerConfirmed: false, projectName: "Client Project", assignmentState: "pending", updatedAt: new Date() }];
    const progress = vi.spyOn(db, "listRecruiterNewHireProgress").mockResolvedValue(safeRows as never);
    const caller = appRouter.createCaller(createContext("recruiter", 4));

    const result = await caller.recruiting.newHireProgress();
    expect(result).toEqual(safeRows);
    await expect(appRouter.createCaller(createContext("admin", 1)).recruiting.newHireProgress()).resolves.toEqual(safeRows);
    expect(result[0]).toMatchObject({ name: "Jordan Lee", email: "jordan@vertonsolutions.com", role: "consultant" });
    expect(result[0]).not.toHaveProperty("readinessStatus");
    expect(result[0]).not.toHaveProperty("candidateProfile");
    expect(result[0]).not.toHaveProperty("compensation");
    expect(result[0]).not.toHaveProperty("documentKey");
    progress.mockRestore();
  });

  it("allows only Administrator and Recruiter to read an existing recruiter-visible candidate profile", async () => {
    const safeCandidate = { id: 22, candidateName: "Jordan Lee", email: "jordan@example.com", phone: "555-0100", location: "Austin, TX", professionalSummary: "Cloud delivery specialist.", yearsExperience: "6 years", skills: ["TypeScript"], recentRoles: [], education: ["B.S. Computer Science"], recruiterNotes: ["Confirm source details."], confidence: "medium", reviewState: "pending_human_review", createdAt: new Date(), updatedAt: new Date() };
    const candidate = vi.spyOn(db, "getRecruiterCandidateById").mockResolvedValue(safeCandidate as never);

    await expect(appRouter.createCaller(createContext("admin")).recruiting.getCandidate({ candidateId: 22 })).resolves.toEqual(safeCandidate);
    await expect(appRouter.createCaller(createContext("recruiter")).recruiting.getCandidate({ candidateId: 22 })).resolves.toEqual(safeCandidate);
    await expect(appRouter.createCaller(createContext("user")).recruiting.getCandidate({ candidateId: 22 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(candidate).toHaveBeenCalledWith(22);
    expect(safeCandidate).not.toHaveProperty("resumeObjectKey");
    expect(safeCandidate).not.toHaveProperty("readinessStatus");
    expect(safeCandidate).not.toHaveProperty("compensation");
    candidate.mockRestore();
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

  it("serves Consultant My Work only from the session user and excludes restricted fields", async () => {
    const safeWork = {
      profile: { profileUpdateState: "details_requested", updatedAt: new Date() },
      onboarding: { onboardingStage: "manager_confirmation", progressPercent: 82, assignmentState: "active", updatedAt: new Date() },
      assignment: { id: 4, projectName: "Northstar Commerce Cloud · Demo", clientName: "Northstar Retail · Demo", managerName: "Casey Rivera", allocationPercent: 100, assignmentState: "active", startDate: null, endDate: null, updatedAt: new Date() },
      latestTimesheet: { assignmentId: 4, weekEnding: new Date(), hours: 40, status: "submitted", updatedAt: new Date() },
    };
    const summary = vi.spyOn(db, "getConsultantMyWork").mockResolvedValue(safeWork as never);

    await expect(appRouter.createCaller(createContext("consultant", 17)).consultant.myWork()).resolves.toEqual(safeWork);
    await expect(appRouter.createCaller(createContext("user", 18)).consultant.myWork()).resolves.toEqual(safeWork);
    await expect(appRouter.createCaller(createContext("admin", 1)).consultant.myWork()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(summary).toHaveBeenCalledWith(17);
    expect(safeWork).not.toHaveProperty("readinessDetails");
    expect(safeWork).not.toHaveProperty("candidateProfile");
    expect(safeWork).not.toHaveProperty("commercialRate");
    expect(safeWork).not.toHaveProperty("clientDocument");
    summary.mockRestore();
  });

  it("serves Consultant My Engagement only from the session user and excludes restricted fields", async () => {
    const safeEngagement = {
      assignment: { id: 4, projectName: "Northstar Commerce Cloud · Demo", clientName: "Northstar Retail · Demo", managerName: "Casey Rivera", allocationPercent: 100, assignmentState: "active", startDate: null, endDate: null, updatedAt: new Date() },
      hasActiveAssignment: true,
      latestTimesheet: { assignmentId: 4, weekEnding: new Date(), hours: 40, status: "submitted", updatedAt: new Date() },
    };
    const engagement = vi.spyOn(db, "getConsultantMyEngagement").mockResolvedValue(safeEngagement as never);

    await expect(appRouter.createCaller(createContext("consultant", 17)).consultant.myEngagement()).resolves.toEqual(safeEngagement);
    await expect(appRouter.createCaller(createContext("user", 18)).consultant.myEngagement()).resolves.toEqual(safeEngagement);
    await expect(appRouter.createCaller(createContext("admin", 1)).consultant.myEngagement()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(engagement).toHaveBeenCalledWith(17);
    expect(safeEngagement.assignment).not.toHaveProperty("userId");
    expect(safeEngagement.assignment).not.toHaveProperty("commercialRate");
    expect(safeEngagement.assignment).not.toHaveProperty("clientDocument");
    expect(safeEngagement).not.toHaveProperty("readinessDetails");
    expect(safeEngagement).not.toHaveProperty("candidateProfile");
    engagement.mockRestore();
  });

  it("serves and acknowledges only the session consultant's safe personal onboarding tasks", async () => {
    const safeTasks = [{ id: 41, title: "Review your workforce profile", taskType: "profile", description: "Review your current profile before requesting human review.", ownerGroup: "consultant", dueDate: new Date("2026-09-01"), consultantCompletionState: "pending", acknowledgedAt: null, updatedAt: new Date() }];
    const tasks = vi.spyOn(db, "listConsultantOnboardingTasks").mockResolvedValue(safeTasks as never);
    const acknowledge = vi.spyOn(db, "acknowledgeConsultantOnboardingTask").mockResolvedValue({ ...safeTasks[0], consultantCompletionState: "acknowledged", acknowledgedAt: new Date() } as never);

    await expect(appRouter.createCaller(createContext("consultant", 17)).onboarding.myTasks()).resolves.toEqual(safeTasks);
    await expect(appRouter.createCaller(createContext("user", 18)).onboarding.myTasks()).resolves.toEqual(safeTasks);
    await expect(appRouter.createCaller(createContext("admin", 1)).onboarding.myTasks()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(createContext("consultant", 17)).onboarding.acknowledgeTask({ taskId: 41 })).resolves.toMatchObject({ consultantCompletionState: "acknowledged" });
    await expect(appRouter.createCaller(createContext("admin", 1)).onboarding.acknowledgeTask({ taskId: 41 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(tasks).toHaveBeenCalledWith(17);
    expect(acknowledge).toHaveBeenCalledWith(17, 41);
    expect(safeTasks[0]).not.toHaveProperty("userId");
    expect(safeTasks[0]).not.toHaveProperty("documentKey");
    expect(safeTasks[0]).not.toHaveProperty("readinessDetails");
    expect(safeTasks[0]).not.toHaveProperty("compensation");
    tasks.mockRestore();
    acknowledge.mockRestore();
  });

  it("allows only Administrator and HR & Compliance to read the minimized readiness projection", async () => {
    const safeRows = [{ userId: 17, name: "Readiness User", workAuthorizationStatus: "human_review", employmentType: "H-1B", statusNote: "Awaiting designated reviewer follow-up.", expiryDate: null, updatedAt: new Date() }];
    const readiness = vi.spyOn(db, "listReadinessProfiles").mockResolvedValue(safeRows as never);

    await expect(appRouter.createCaller(createContext("admin")).profile.readinessRecords()).resolves.toEqual(safeRows);
    await expect(appRouter.createCaller(createContext("hr_compliance")).profile.readinessRecords()).resolves.toEqual(safeRows);
    await expect(appRouter.createCaller(createContext("user")).profile.readinessRecords()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(safeRows[0]).not.toHaveProperty("documentKey");
    expect(safeRows[0]).not.toHaveProperty("rawIdentityData");
    expect(safeRows[0]).not.toHaveProperty("compensation");
    readiness.mockRestore();
  });
});
