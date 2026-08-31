import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getAllowedNavigation, getRoleKeyFromStoredRole, resolveWorkspacePage } from "../client/src/pages/Home";

const roleMatrix = {
  admin: ["Overview", "Talent pipeline", "Readiness", "Onboarding", "Delivery", "Time & billing", "Controls", "Admin center", "My profile", "New-hire progress"],
  recruiter: ["Overview", "Talent pipeline", "My profile", "New-hire progress"],
  hr_compliance: ["Overview", "Readiness", "Onboarding", "Controls", "My profile"],
  account_manager: ["Overview", "Talent pipeline", "Delivery", "My profile"],
  delivery_manager: ["Overview", "Talent pipeline", "Onboarding", "Delivery", "My profile"],
  project_manager: ["Overview", "Delivery", "Time & billing", "My profile"],
  finance: ["Overview", "Time & billing", "Controls", "My profile"],
  consultant: ["Overview", "My work", "My engagement", "Check-ins", "Time submission", "Action inbox", "Onboarding", "Delivery", "Time & billing", "My profile"],
  user: ["Overview", "My work", "My engagement", "Check-ins", "Time submission", "Action inbox", "Onboarding", "Delivery", "Time & billing", "My profile"],
} as const;

type StoredRole = keyof typeof roleMatrix;

function createContext(role: StoredRole): TrpcContext {
  return {
    user: { id: 71, openId: `cross-workspace-${role}`, email: `${role}@example.test`, name: "Cross Workspace User", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("cross-workspace regression gate", () => {
  it("maps every configured role to only its permitted workspace pages and safely resolves disallowed pages", () => {
    for (const [storedRole, expectedPages] of Object.entries(roleMatrix) as Array<[StoredRole, readonly string[]]>) {
      const roleKey = getRoleKeyFromStoredRole(storedRole);
      expect(getAllowedNavigation(roleKey).map(item => item.label)).toEqual(expectedPages);
      expect(resolveWorkspacePage(roleKey, "Admin center")).toBe(expectedPages.includes("Admin center") ? "Admin center" : "Overview");
      expect(resolveWorkspacePage(roleKey, "My profile")).toBe("My profile");
    }
  });

  it("rejects direct Administrator API calls for every non-administrator role", async () => {
    const nonAdminRoles = (Object.keys(roleMatrix) as StoredRole[]).filter(role => role !== "admin");
    for (const role of nonAdminRoles) {
      const caller = appRouter.createCaller(createContext(role));
      await expect(caller.access.listUsers()).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.access.permissionGroups()).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.access.roleChangeHistory()).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });

  it("allows the protected launchboard only to Administrator and Recruiter callers", async () => {
    await expect(appRouter.createCaller(createContext("admin")).recruiting.newHireProgress()).resolves.toBeInstanceOf(Array);
    await expect(appRouter.createCaller(createContext("recruiter")).recruiting.newHireProgress()).resolves.toBeInstanceOf(Array);
    for (const role of (Object.keys(roleMatrix) as StoredRole[]).filter(role => !["admin", "recruiter"].includes(role))) {
      await expect(appRouter.createCaller(createContext(role)).recruiting.newHireProgress()).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });

  it("enforces readiness, candidate, and project write boundaries before data access", async () => {
    const projectInput = { projectId: 1, name: "Existing project", deliveryStatus: "active" as const, projectManagerName: "Existing manager" };
    for (const role of (Object.keys(roleMatrix) as StoredRole[]).filter(role => !["admin", "hr_compliance"].includes(role))) {
      await expect(appRouter.createCaller(createContext(role)).profile.readinessRecords()).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    for (const role of ["hr_compliance", "account_manager", "delivery_manager", "project_manager", "finance", "consultant", "user"] as StoredRole[]) {
      await expect(appRouter.createCaller(createContext(role)).recruiting.updateCandidate({ candidateId: 1, candidateName: "Candidate", location: "Austin", yearsExperience: "5 years", skills: ["TypeScript"] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    for (const role of ["recruiter", "hr_compliance", "finance", "consultant", "user"] as StoredRole[]) {
      await expect(appRouter.createCaller(createContext(role)).portal.updateProject(projectInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });

  it("denies Consultant Time Submission and private evidence procedures to every non-consultant-compatible role", async () => {
    const timeInput = { assignmentId: 1, weekEnding: new Date("2026-08-30"), hours: 40, note: "Completed documented delivery hours." };
    const evidenceInput = { timeEntryId: 1, fileName: "approved-week.pdf", mimeType: "application/pdf" as const, fileSize: 128, confirmClientApproved: true as const };
    for (const role of (Object.keys(roleMatrix) as StoredRole[]).filter(role => !["consultant", "user"].includes(role))) {
      const caller = appRouter.createCaller(createContext(role));
      await expect(caller.consultant.timeSubmissions()).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.createTimeSubmission(timeInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.updateTimeSubmission({ timeEntryId: 1, weekEnding: timeInput.weekEnding, hours: 40, note: timeInput.note })).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.submitTimeSubmission({ timeEntryId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.prepareTimesheetEvidenceUpload(evidenceInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.completeTimesheetEvidenceUpload({ sessionId: "f4c4c2a6-17fb-4d62-b119-784831553898" })).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.retryTimesheetHoursExtraction({ evidenceId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });

  it("denies Consultant Action Inbox reads and presentation-state mutations to every non-consultant-compatible role", async () => {
    for (const role of (Object.keys(roleMatrix) as StoredRole[]).filter(role => !["consultant", "user"].includes(role))) {
      const caller = appRouter.createCaller(createContext(role));
      await expect(caller.consultant.actionInbox()).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.markActionRead({ dedupKey: "onboarding-task:41:pending" })).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.dismissAction({ dedupKey: "onboarding-task:41:pending" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });

  it("keeps the workforce mutation surface limited to approved curation, own-record time, private evidence extraction, and inbox-state procedures", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("access.assignRole");
    expect(procedures).toContain("profile.requestReview");
    expect(procedures).toContain("recruiting.updateCandidate");
    expect(procedures).toContain("portal.updateProject");
    expect(procedures).toContain("consultant.createTimeSubmission");
    expect(procedures).toContain("consultant.updateTimeSubmission");
    expect(procedures).toContain("consultant.submitTimeSubmission");
    expect(procedures).toContain("consultant.prepareTimesheetEvidenceUpload");
    expect(procedures).toContain("consultant.completeTimesheetEvidenceUpload");
    expect(procedures).toContain("consultant.retryTimesheetHoursExtraction");
    expect(procedures).toContain("consultant.markActionRead");
    expect(procedures).toContain("consultant.dismissAction");
    expect(procedures).not.toContain("portal.approveTimesheet");
    expect(procedures).not.toContain("consultant.applyExtractedHours");
    expect(procedures).not.toContain("portal.createInvoice");
    expect(procedures).not.toContain("portal.calculatePayroll");
    expect(procedures).not.toContain("portal.issuePayment");
    expect(procedures).not.toContain("recruiting.createAssignment");
    expect(procedures).not.toContain("access.bulkAssignRoles");
  });
});
