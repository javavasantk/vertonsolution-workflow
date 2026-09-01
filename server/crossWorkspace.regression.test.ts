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
  consultant: ["Overview", "My work", "My activity", "My engagement", "My delivery context", "Engagement continuity", "Check-ins", "Time submission", "My time history", "Time reconciliation", "Action inbox", "Onboarding", "My profile"],
  user: ["Overview", "My work", "My activity", "My engagement", "My delivery context", "Engagement continuity", "Check-ins", "Time submission", "My time history", "Time reconciliation", "Action inbox", "Onboarding", "My profile"],
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
      if (["consultant", "user"].includes(storedRole)) {
        expect(resolveWorkspacePage(roleKey, "My delivery context")).toBe("My delivery context");
        expect(resolveWorkspacePage(roleKey, "My time history")).toBe("My time history");
        expect(resolveWorkspacePage(roleKey, "Delivery")).toBe("Overview");
        expect(resolveWorkspacePage(roleKey, "Time & billing")).toBe("Overview");
      }
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

  it("denies Consultant delivery-context, time-history, continuity, time-submission, private-evidence, and factual-response procedures to every non-consultant-compatible role", async () => {
    const timeInput = { assignmentId: 1, weekEnding: new Date("2026-08-30"), hours: 40, note: "Completed documented delivery hours." };
    const evidenceInput = { timeEntryId: 1, fileName: "approved-week.pdf", mimeType: "application/pdf" as const, fileSize: 128, confirmClientApproved: true as const };
    const continuityInput = { category: "handoff_context" as const, factualNote: "A factual handoff context is recorded for designated human follow-up." };
    for (const role of (Object.keys(roleMatrix) as StoredRole[]).filter(role => !["consultant", "user"].includes(role))) {
      const caller = appRouter.createCaller(createContext(role));
      await expect(caller.consultant.myDeliveryContext()).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.myTimeHistory()).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.engagementContinuity()).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.submitEngagementContinuityNote(continuityInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.timeSubmissions()).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.timeSubmissionPeriodTotal({ startDate: timeInput.weekEnding, endDate: timeInput.weekEnding })).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.timeReconciliation({ startDate: timeInput.weekEnding, endDate: timeInput.weekEnding })).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.createTimeSubmission(timeInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.updateTimeSubmission({ timeEntryId: 1, weekEnding: timeInput.weekEnding, hours: 40, note: timeInput.note })).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.submitTimeSubmission({ timeEntryId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.prepareTimesheetEvidenceUpload(evidenceInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.completeTimesheetEvidenceUpload({ sessionId: "f4c4c2a6-17fb-4d62-b119-784831553898" })).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.retryTimesheetHoursExtraction({ evidenceId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.acknowledgeTimesheetEvidenceDiscrepancy({ reviewerNoteId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.respondToTimesheetEvidenceDiscrepancy({ reviewerNoteId: 1, body: "The documented source total remains forty hours." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });

  it("denies Consultant Action Inbox reads and presentation-state mutations to every non-consultant-compatible role", async () => {
    for (const role of (Object.keys(roleMatrix) as StoredRole[]).filter(role => !["consultant", "user"].includes(role))) {
      const caller = appRouter.createCaller(createContext(role));
      await expect(caller.consultant.actionInbox()).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.markActionRead({ dedupKey: "onboarding-task:41:pending" })).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.dismissAction({ dedupKey: "onboarding-task:41:pending" })).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.restoreAction({ dedupKey: "onboarding-task:41:pending" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });

  it("denies Finance evidence reviewer assignment and human discrepancy notes to every non-Finance role", async () => {
    for (const role of (Object.keys(roleMatrix) as StoredRole[]).filter(role => role !== "finance")) {
      const caller = appRouter.createCaller(createContext(role));
      await expect(caller.finance.eligibleTimesheetEvidenceReviewers()).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.finance.assignTimesheetEvidenceReviewer({ evidenceId: 1, reviewerUserId: 8 })).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.finance.addTimesheetEvidenceDiscrepancyNote({ evidenceId: 1, note: "A factual human review note is required." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });

  it("denies Consultant Personal Activity Timeline reads to every non-consultant-compatible role", async () => {
    for (const role of (Object.keys(roleMatrix) as StoredRole[]).filter(role => !["consultant", "user"].includes(role))) {
      await expect(appRouter.createCaller(createContext(role)).consultant.personalActivityTimeline({ limit: 12 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });

  it("keeps the workforce mutation surface limited to approved curation, own-record time, factual human follow-up, private evidence extraction, and inbox-state procedures", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("access.assignRole");
    expect(procedures).toContain("profile.requestReview");
    expect(procedures).toContain("recruiting.updateCandidate");
    expect(procedures).toContain("portal.updateProject");
    expect(procedures).toContain("consultant.createTimeSubmission");
    expect(procedures).toContain("consultant.updateTimeSubmission");
    expect(procedures).toContain("consultant.submitTimeSubmission");
    expect(procedures).toContain("consultant.timeSubmissionPeriodTotal");
    expect(procedures).toContain("consultant.timeReconciliation");
    expect(procedures).toContain("consultant.myDeliveryContext");
    expect(procedures).toContain("consultant.myTimeHistory");
    expect(procedures).toContain("consultant.personalActivityTimeline");
    expect(procedures).toContain("consultant.engagementContinuity");
    expect(procedures).toContain("consultant.submitEngagementContinuityNote");
    expect(procedures).toContain("consultant.prepareTimesheetEvidenceUpload");
    expect(procedures).toContain("consultant.completeTimesheetEvidenceUpload");
    expect(procedures).toContain("consultant.retryTimesheetHoursExtraction");
    expect(procedures).toContain("consultant.acknowledgeTimesheetEvidenceDiscrepancy");
    expect(procedures).toContain("consultant.respondToTimesheetEvidenceDiscrepancy");
    expect(procedures).toContain("finance.assignTimesheetEvidenceReviewer");
    expect(procedures).toContain("finance.addTimesheetEvidenceDiscrepancyNote");
    expect(procedures).toContain("consultant.markActionRead");
    expect(procedures).toContain("consultant.dismissAction");
    expect(procedures).toContain("consultant.restoreAction");
    expect(procedures).not.toContain("portal.approveTimesheet");
    expect(procedures).not.toContain("consultant.applyExtractedHours");
    expect(procedures).not.toContain("finance.approveTimesheetEvidence");
    expect(procedures).not.toContain("consultant.resolveTimesheetDiscrepancy");
    expect(procedures).not.toContain("consultant.applyDiscrepancyCorrection");
    expect(procedures).not.toContain("consultant.sendActionInboxNotification");
    expect(procedures).not.toContain("consultant.updateTimeReconciliation");
    expect(procedures).not.toContain("consultant.requestAssignmentExtension");
    expect(procedures).not.toContain("consultant.decideEngagementTransition");
    expect(procedures).not.toContain("consultant.sendEngagementContinuityNotification");
    expect(procedures).not.toContain("portal.createInvoice");
    expect(procedures).not.toContain("portal.calculatePayroll");
    expect(procedures).not.toContain("portal.issuePayment");
    expect(procedures).not.toContain("recruiting.createAssignment");
    expect(procedures).not.toContain("access.bulkAssignRoles");
  });
});
