import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter, resetConsultantActionInboxRateLimitsForTests, resetConsultantTimesheetOcrRateLimitsForTests, resetConsultantTimesheetDiscrepancyResponseRateLimitsForTests } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

function createContext(role: "user" | "admin" | "recruiter" | "hr_compliance" | "account_manager" | "delivery_manager" | "project_manager" | "finance" | "consultant", userId = 1): TrpcContext {
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
  beforeEach(() => {
    resetConsultantActionInboxRateLimitsForTests();
    resetConsultantTimesheetOcrRateLimitsForTests();
    resetConsultantTimesheetDiscrepancyResponseRateLimitsForTests();
  });
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

  it("returns only the authenticated user's append-only profile request snapshots with no reviewer or restricted fields", async () => {
    const ownHistory = [{ requestId: 41, employmentType: "H-1B", statusNote: "Please review my submitted administrative update.", requestState: "details_requested", submittedAt: new Date("2026-08-28T12:00:00.000Z") }];
    const foreignHistory = [{ requestId: 99, employmentType: "F-1 OPT", statusNote: "Another account request.", requestState: "details_requested", submittedAt: new Date("2026-08-27T12:00:00.000Z") }];
    const history = vi.spyOn(db, "listOwnEmployeeProfileRequests").mockImplementation(async userId => userId === 17 ? ownHistory : foreignHistory);

    await expect(appRouter.createCaller(createContext("consultant", 17)).profile.requestHistory()).resolves.toEqual(ownHistory);
    await expect(appRouter.createCaller(createContext("user", 18)).profile.requestHistory()).resolves.toEqual(foreignHistory);
    expect(history).toHaveBeenCalledWith(17);
    expect(history).toHaveBeenCalledWith(18);
    expect(ownHistory[0]).not.toHaveProperty("userId");
    expect(ownHistory[0]).not.toHaveProperty("reviewerId");
    expect(ownHistory[0]).not.toHaveProperty("reviewerCommentary");
    expect(ownHistory[0]).not.toHaveProperty("documentKey");
    expect(ownHistory[0]).not.toHaveProperty("expiryDate");
    expect(ownHistory[0]).not.toHaveProperty("compensation");
    history.mockRestore();
  });

  it("retains bounded profile update inputs and exposes no profile-history edit or deletion procedure", async () => {
    const caller = appRouter.createCaller(createContext("consultant", 17));
    await expect(caller.profile.requestReview({ employmentType: "x".repeat(97), statusNote: "Please review this requested profile update." })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.profile.requestReview({ employmentType: "H-1B", statusNote: "x".repeat(501) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("profile.requestHistory");
    expect(procedures).not.toContain("profile.editRequestHistory");
    expect(procedures).not.toContain("profile.deleteRequestHistory");
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

  it("serves a Consultant Personal Activity Timeline only from the session user with safe cursor-paged fields", async () => {
    const safePage = {
      items: [{ eventType: "time_entry_submitted", source: "time_submission", summary: "You submitted a time entry for designated human review.", occurredAt: new Date("2026-09-01"), destination: "/workspace/time-submission", cursor: "eyJvY2N1cnJlZEF0IjoxNzU2Njg0ODAwMDAwLCJzb3J0S2V5IjoiYWJjZGVmMTIzNDU2Nzg5MGFiY2RlZjEyMzQ1Njc4OTBhYmNkZWYxMjM0NTY3ODkwYWJjZGVmMTIzNDU2Nzg5MCJ9" }],
      nextCursor: null,
    };
    const timeline = vi.spyOn(db, "listConsultantPersonalActivityTimeline").mockResolvedValue(safePage as never);
    const input = { limit: 12 };

    await expect(appRouter.createCaller(createContext("consultant", 17)).consultant.personalActivityTimeline(input)).resolves.toEqual(safePage);
    await expect(appRouter.createCaller(createContext("user", 18)).consultant.personalActivityTimeline(input)).resolves.toEqual(safePage);
    for (const role of ["admin", "recruiter", "hr_compliance", "account_manager", "delivery_manager", "project_manager", "finance"] as const) {
      await expect(appRouter.createCaller(createContext(role, 19)).consultant.personalActivityTimeline(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    expect(timeline).toHaveBeenCalledWith(17, input);
    expect(safePage.items[0]).not.toHaveProperty("userId");
    expect(safePage.items[0]).not.toHaveProperty("eventId");
    expect(safePage.items[0]).not.toHaveProperty("taskDescription");
    expect(safePage.items[0]).not.toHaveProperty("reviewerName");
    expect(safePage.items[0]).not.toHaveProperty("fileKey");
    expect(safePage.items[0]).not.toHaveProperty("clientName");
    expect(safePage.items[0]).not.toHaveProperty("readinessDetails");
    expect(safePage.items[0]).not.toHaveProperty("compensation");
    expect(safePage.items[0]).not.toHaveProperty("decisionOutcome");
    timeline.mockRestore();
  });

  it("rejects malformed Consultant Personal Activity Timeline cursors as a protected bad request", async () => {
    const timeline = vi.spyOn(db, "listConsultantPersonalActivityTimeline").mockRejectedValue(new Error("Timeline cursor is invalid"));
    await expect(appRouter.createCaller(createContext("consultant", 17)).consultant.personalActivityTimeline({ cursor: "bad-cursor-value", limit: 12 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    timeline.mockRestore();
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

  it("serves and records only the session Consultant's factual engagement continuity notes", async () => {
    const safeContinuity = {
      assignment: { projectLabel: "Northstar Commerce Cloud · Demo", managerLabel: "Casey Rivera", assignmentState: "active", endDate: new Date("2026-12-31"), updatedAt: new Date() },
      hasActiveAssignment: true,
      designatedHumanOwner: "Casey Rivera",
      notes: [{ id: 84, category: "handoff_context", factualNote: "The documented handoff context is available for designated human follow-up.", createdAt: new Date() }],
    };
    const list = vi.spyOn(db, "getConsultantEngagementContinuity").mockResolvedValue(safeContinuity as never);
    const create = vi.spyOn(db, "createConsultantEngagementContinuityNote").mockResolvedValue(safeContinuity.notes[0] as never);
    const input = { category: "support_needed" as const, factualNote: "A factual designated-owner follow-up is needed for the documented work context." };

    await expect(appRouter.createCaller(createContext("consultant", 17)).consultant.engagementContinuity()).resolves.toEqual(safeContinuity);
    await expect(appRouter.createCaller(createContext("user", 18)).consultant.engagementContinuity()).resolves.toEqual(safeContinuity);
    await expect(appRouter.createCaller(createContext("consultant", 17)).consultant.submitEngagementContinuityNote(input)).resolves.toEqual(safeContinuity.notes[0]);
    await expect(appRouter.createCaller(createContext("consultant", 17)).consultant.submitEngagementContinuityNote({ ...input, category: "invalid_category" as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(appRouter.createCaller(createContext("consultant", 17)).consultant.submitEngagementContinuityNote({ ...input, factualNote: "Short" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    for (const role of ["admin", "recruiter", "hr_compliance", "account_manager", "delivery_manager", "project_manager", "finance"] as const) {
      await expect(appRouter.createCaller(createContext(role, 19)).consultant.engagementContinuity()).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(appRouter.createCaller(createContext(role, 19)).consultant.submitEngagementContinuityNote(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    expect(list).toHaveBeenCalledWith(17);
    expect(create).toHaveBeenCalledWith(17, input);
    expect(safeContinuity.assignment).not.toHaveProperty("id");
    expect(safeContinuity.assignment).not.toHaveProperty("userId");
    expect(safeContinuity.assignment).not.toHaveProperty("clientName");
    expect(safeContinuity.assignment).not.toHaveProperty("clientDocument");
    expect(safeContinuity.notes[0]).not.toHaveProperty("assignmentId");
    expect(safeContinuity.notes[0]).not.toHaveProperty("performanceRating");
    expect(safeContinuity.notes[0]).not.toHaveProperty("readinessDetails");
    expect(safeContinuity.notes[0]).not.toHaveProperty("compensation");
    list.mockRestore();
    create.mockRestore();
  });

  it("rejects a Consultant continuity note when no current or recent own assignment remains", async () => {
    const create = vi.spyOn(db, "createConsultantEngagementContinuityNote").mockResolvedValue(null as never);
    await expect(appRouter.createCaller(createContext("consultant", 17)).consultant.submitEngagementContinuityNote({ category: "work_status", factualNote: "A factual work status has been recorded for designated human follow-up." })).rejects.toMatchObject({ code: "NOT_FOUND" });
    create.mockRestore();
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

  it("serves and records only the session consultant's bounded factual check-ins", async () => {
    const safeCheckIns = {
      designatedHumanOwner: "Casey Rivera",
      checkIns: [{ id: 52, category: "work_update", factualNote: "Completed the documented project walkthrough with the delivery contact.", createdAt: new Date() }],
    };
    const listCheckIns = vi.spyOn(db, "listConsultantCheckIns").mockResolvedValue(safeCheckIns as never);
    const createCheckIn = vi.spyOn(db, "createConsultantCheckIn").mockResolvedValue(safeCheckIns.checkIns[0] as never);
    const consultantCaller = appRouter.createCaller(createContext("consultant", 17));

    await expect(consultantCaller.consultant.checkIns()).resolves.toEqual(safeCheckIns);
    await expect(consultantCaller.consultant.submitCheckIn({ category: "work_update", factualNote: "Completed the documented project walkthrough with the delivery contact." })).resolves.toEqual(safeCheckIns.checkIns[0]);
    await expect(consultantCaller.consultant.submitCheckIn({ category: "work_update", factualNote: "Too short" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(appRouter.createCaller(createContext("admin", 1)).consultant.checkIns()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(createContext("admin", 1)).consultant.submitCheckIn({ category: "support_note", factualNote: "A factual administrator test note of sufficient length." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(listCheckIns).toHaveBeenCalledWith(17);
    expect(createCheckIn).toHaveBeenCalledWith(17, { category: "work_update", factualNote: "Completed the documented project walkthrough with the delivery contact." });
    expect(safeCheckIns.checkIns[0]).not.toHaveProperty("performanceRating");
    expect(safeCheckIns.checkIns[0]).not.toHaveProperty("workAuthorizationStatus");
    expect(safeCheckIns.checkIns[0]).not.toHaveProperty("compensation");
    expect(safeCheckIns.checkIns[0]).not.toHaveProperty("clientCredential");
    listCheckIns.mockRestore();
    createCheckIn.mockRestore();
  });

  it("serves and changes only the session consultant's draft or correction-needed time entries", async () => {
    const safeTimeData = {
      designatedHumanOwner: "Casey Rivera",
      assignments: [{ id: 4, projectName: "Northstar Commerce Cloud · Demo", assignmentState: "active" }],
      entries: [{ id: 72, assignmentId: 4, weekEnding: new Date("2026-08-23"), hours: 40, status: "draft", note: "Completed documented delivery hours.", updatedAt: new Date() }],
    };
    const list = vi.spyOn(db, "listConsultantTimeSubmissions").mockResolvedValue(safeTimeData as never);
    const create = vi.spyOn(db, "createConsultantTimeSubmission").mockResolvedValue(safeTimeData.entries[0] as never);
    const update = vi.spyOn(db, "updateConsultantTimeSubmission").mockResolvedValue(safeTimeData.entries[0] as never);
    const submit = vi.spyOn(db, "submitConsultantTimeSubmission").mockResolvedValue({ ...safeTimeData.entries[0], status: "submitted" } as never);
    const caller = appRouter.createCaller(createContext("consultant", 17));
    const input = { assignmentId: 4, weekEnding: new Date("2026-08-30"), hours: 40, note: "Completed documented delivery hours." };

    await expect(caller.consultant.timeSubmissions()).resolves.toEqual(safeTimeData);
    await expect(caller.consultant.createTimeSubmission(input)).resolves.toEqual(safeTimeData.entries[0]);
    await expect(caller.consultant.updateTimeSubmission({ timeEntryId: 72, weekEnding: input.weekEnding, hours: 38, note: "Corrected documented delivery hours." })).resolves.toEqual(safeTimeData.entries[0]);
    await expect(caller.consultant.submitTimeSubmission({ timeEntryId: 72 })).resolves.toMatchObject({ status: "submitted" });
    await expect(caller.consultant.createTimeSubmission({ ...input, hours: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(appRouter.createCaller(createContext("admin", 1)).consultant.timeSubmissions()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(createContext("admin", 1)).consultant.createTimeSubmission(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(list).toHaveBeenCalledWith(17);
    expect(create).toHaveBeenCalledWith(17, input);
    expect(update).toHaveBeenCalledWith(17, 72, expect.objectContaining({ hours: 38 }));
    expect(submit).toHaveBeenCalledWith(17, 72);
    expect(safeTimeData.entries[0]).not.toHaveProperty("commercialRate");
    expect(safeTimeData.entries[0]).not.toHaveProperty("payrollAmount");
    expect(safeTimeData.entries[0]).not.toHaveProperty("invoiceId");
    list.mockRestore();
    create.mockRestore();
    update.mockRestore();
    submit.mockRestore();
  });

  it("prepares private client-approved timesheet upload evidence only for the current consultant's own time entry", async () => {
    const createUpload = vi.spyOn(db, "createConsultantTimesheetUploadSession").mockResolvedValue({ id: "f4c4c2a6-17fb-4d62-b119-784831553898", fileKey: "consultant-timesheets/17/private.pdf", expiresAt: new Date("2026-08-27") } as never);
    const input = { timeEntryId: 72, fileName: "approved-week.pdf", mimeType: "application/pdf" as const, fileSize: 256, confirmClientApproved: true as const };
    const caller = appRouter.createCaller(createContext("consultant", 17));

    await expect(caller.consultant.prepareTimesheetEvidenceUpload(input)).resolves.toMatchObject({ sessionId: "f4c4c2a6-17fb-4d62-b119-784831553898", uploadPath: "/api/consultant/timesheet-upload/f4c4c2a6-17fb-4d62-b119-784831553898" });
    expect(createUpload).toHaveBeenCalledWith(17, { timeEntryId: 72, originalFileName: "approved-week.pdf", mimeType: "application/pdf", fileSize: 256 });
    await expect(caller.consultant.prepareTimesheetEvidenceUpload({ ...input, confirmClientApproved: false })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    for (const role of ["admin", "recruiter", "hr_compliance", "account_manager", "delivery_manager", "project_manager", "finance"] as const) {
      await expect(appRouter.createCaller(createContext(role, 22)).consultant.prepareTimesheetEvidenceUpload(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    createUpload.mockRestore();
  });

  it("returns selected-period entered-hour totals only for the session consultant and never a financial calculation", async () => {
    const summary = { startDate: new Date("2026-08-01"), endDate: new Date("2026-08-31"), entryCount: 2, enteredHoursTotal: 72, statusCounts: { draft: 1, submitted: 1, approved: 0, exception: 0 } };
    const totals = vi.spyOn(db, "getConsultantTimeSubmissionPeriodTotal").mockResolvedValue(summary as never);
    const input = { startDate: new Date("2026-08-01"), endDate: new Date("2026-08-31") };

    await expect(appRouter.createCaller(createContext("consultant", 17)).consultant.timeSubmissionPeriodTotal(input)).resolves.toEqual(summary);
    expect(totals).toHaveBeenCalledWith(17, input.startDate, input.endDate);
    await expect(appRouter.createCaller(createContext("user", 18)).consultant.timeSubmissionPeriodTotal(input)).resolves.toEqual(summary);
    for (const role of ["admin", "recruiter", "hr_compliance", "account_manager", "delivery_manager", "project_manager", "finance"] as const) {
      await expect(appRouter.createCaller(createContext(role, 22)).consultant.timeSubmissionPeriodTotal(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    await expect(appRouter.createCaller(createContext("consultant", 17)).consultant.timeSubmissionPeriodTotal({ startDate: new Date("2026-08-31"), endDate: new Date("2026-08-01") })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(summary).not.toHaveProperty("payroll");
    expect(summary).not.toHaveProperty("billRate");
    expect(summary).not.toHaveProperty("invoiceAmount");
    totals.mockRestore();
  });

  it("returns a dedicated own-record Consultant reconciliation projection with only permitted status filtering and arithmetic", async () => {
    const reconciliation = { startDate: new Date("2026-08-01"), endDate: new Date("2026-08-31"), status: "submitted", entryCount: 1, enteredHoursTotal: 40, evidenceCount: 1, ocrResultCount: 1, rows: [{ timeEntryId: 72, weekEnding: new Date("2026-08-23"), status: "submitted", enteredHours: 40, evidence: [{ evidenceId: 91, originalFileName: "approved-week.pdf", mimeType: "application/pdf", extractionStatus: "extracted", extractedHours: 38, extractionConfidence: "medium", reviewerAssigned: true, differenceHours: 2, comparisonLabel: "Human comparison needed", discrepancyNotes: [{ note: "Confirm the visible totals through human follow-up.", createdAt: new Date("2026-08-26") }] }] }] };
    const getReconciliation = vi.spyOn(db, "getConsultantTimeReconciliation").mockResolvedValue(reconciliation as never);
    const input = { startDate: new Date("2026-08-01"), endDate: new Date("2026-08-31"), status: "submitted" as const };

    await expect(appRouter.createCaller(createContext("consultant", 17)).consultant.timeReconciliation(input)).resolves.toEqual(reconciliation);
    await expect(appRouter.createCaller(createContext("user", 18)).consultant.timeReconciliation(input)).resolves.toEqual(reconciliation);
    expect(getReconciliation).toHaveBeenCalledWith(17, input);
    expect(getReconciliation).toHaveBeenCalledWith(18, input);
    for (const role of ["admin", "recruiter", "hr_compliance", "account_manager", "delivery_manager", "project_manager", "finance"] as const) {
      await expect(appRouter.createCaller(createContext(role, 22)).consultant.timeReconciliation(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    await expect(appRouter.createCaller(createContext("consultant", 17)).consultant.timeReconciliation({ startDate: new Date("2026-08-31"), endDate: new Date("2026-08-01") })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(appRouter.createCaller(createContext("consultant", 17)).consultant.timeReconciliation({ startDate: new Date("2025-01-01"), endDate: new Date("2026-01-03") })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(appRouter.createCaller(createContext("consultant", 17)).consultant.timeReconciliation({ startDate: input.startDate, endDate: input.endDate, status: "reviewed" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(reconciliation.rows[0]).not.toHaveProperty("clientName");
    expect(reconciliation.rows[0]).not.toHaveProperty("reviewerName");
    expect(reconciliation.rows[0].evidence[0]).not.toHaveProperty("fileKey");
    expect(reconciliation.rows[0].evidence[0]).not.toHaveProperty("sourceContent");
    expect(reconciliation).not.toHaveProperty("payroll");
    expect(reconciliation).not.toHaveProperty("billRate");
    expect(reconciliation).not.toHaveProperty("invoiceAmount");
    getReconciliation.mockRestore();
  });

  it("keeps private timesheet evidence completion and OCR retry session-owned, without leaking document or commercial fields", async () => {
    const completedEvidence = vi.spyOn(db, "getCompletedConsultantTimesheetEvidenceBySession").mockResolvedValue(undefined);
    const unavailableSession = vi.spyOn(db, "getActiveConsultantTimesheetUploadSession").mockResolvedValue(undefined);
    const privateEvidence = vi.spyOn(db, "getOwnedConsultantTimesheetEvidenceForProcessing").mockRejectedValue(new Error("Timesheet evidence was not found"));
    const caller = appRouter.createCaller(createContext("consultant", 17));

    await expect(caller.consultant.completeTimesheetEvidenceUpload({ sessionId: "f4c4c2a6-17fb-4d62-b119-784831553898" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.consultant.retryTimesheetHoursExtraction({ evidenceId: 999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(appRouter.createCaller(createContext("admin", 1)).consultant.completeTimesheetEvidenceUpload({ sessionId: "f4c4c2a6-17fb-4d62-b119-784831553898" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const safeEvidence = { id: 91, timeEntryId: 72, originalFileName: "approved-week.pdf", mimeType: "application/pdf", fileSize: 256, extractionStatus: "extracted", extractedHours: 40, extractionConfidence: "high", createdAt: new Date(), updatedAt: new Date() };
    expect(safeEvidence).not.toHaveProperty("fileKey");
    expect(safeEvidence).not.toHaveProperty("fileSha256");
    expect(safeEvidence).not.toHaveProperty("clientContent");
    expect(safeEvidence).not.toHaveProperty("commercialRate");
    completedEvidence.mockRestore();
    unavailableSession.mockRestore();
    privateEvidence.mockRestore();
  });

  it("limits each consultant to five OCR extraction requests per ten minutes", async () => {
    const completedEvidence = vi.spyOn(db, "getCompletedConsultantTimesheetEvidenceBySession").mockResolvedValue(undefined);
    const unavailableSession = vi.spyOn(db, "getActiveConsultantTimesheetUploadSession").mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext("consultant", 17));
    const input = { sessionId: "f4c4c2a6-17fb-4d62-b119-784831553898" };

    for (let index = 0; index < 5; index += 1) {
      await expect(caller.consultant.completeTimesheetEvidenceUpload(input)).rejects.toMatchObject({ code: "NOT_FOUND" });
    }
    await expect(caller.consultant.completeTimesheetEvidenceUpload(input)).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(unavailableSession).toHaveBeenCalledTimes(5);
    completedEvidence.mockRestore();
    unavailableSession.mockRestore();
  });

  it("serves the private timesheet evidence review queue only to Finance and omits document keys, client data, and automated decisions", async () => {
    const safeRows = [{ evidenceId: 91, timeEntryId: 72, originalFileName: "approved-week.pdf", mimeType: "application/pdf", fileSize: 256, extractionStatus: "extracted", extractedHours: 40, extractionConfidence: "high", uploadedAt: new Date(), updatedAt: new Date(), weekEnding: new Date("2026-08-23"), enteredHours: 40, timeEntryStatus: "submitted" }];
    const review = vi.spyOn(db, "listFinanceTimesheetEvidenceReview").mockResolvedValue(safeRows as never);

    await expect(appRouter.createCaller(createContext("finance", 8)).finance.timesheetEvidenceReview()).resolves.toEqual(safeRows);
    for (const role of ["admin", "recruiter", "hr_compliance", "account_manager", "delivery_manager", "project_manager", "consultant", "user"] as const) {
      await expect(appRouter.createCaller(createContext(role, 9)).finance.timesheetEvidenceReview()).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    expect(review).toHaveBeenCalledTimes(1);
    expect(safeRows[0]).not.toHaveProperty("fileKey");
    expect(safeRows[0]).not.toHaveProperty("fileSha256");
    expect(safeRows[0]).not.toHaveProperty("clientName");
    expect(safeRows[0]).not.toHaveProperty("compensation");
    expect(safeRows[0]).not.toHaveProperty("approvalDecision");
    review.mockRestore();
  });

  it("allows only Finance to assign a designated Finance reviewer and record a bounded human discrepancy note", async () => {
    const reviewers = vi.spyOn(db, "listEligibleTimesheetEvidenceReviewers").mockResolvedValue([{ id: 8, name: "Morgan Patel", email: "finance@example.test" }] as never);
    const assign = vi.spyOn(db, "assignFinanceTimesheetEvidenceReviewer").mockResolvedValue({ evidenceId: 91, reviewerUserId: 8, assignedAt: new Date() } as never);
    const addNote = vi.spyOn(db, "addFinanceTimesheetEvidenceDiscrepancyNote").mockResolvedValue({ evidenceId: 91, authorUserId: 8, note: "Entered hours and visible total require human follow-up.", createdAt: new Date() } as never);
    const financeCaller = appRouter.createCaller(createContext("finance", 8));

    await expect(financeCaller.finance.eligibleTimesheetEvidenceReviewers()).resolves.toEqual([{ id: 8, name: "Morgan Patel", email: "finance@example.test" }]);
    await expect(financeCaller.finance.assignTimesheetEvidenceReviewer({ evidenceId: 91, reviewerUserId: 8 })).resolves.toMatchObject({ evidenceId: 91, reviewerUserId: 8 });
    await expect(financeCaller.finance.addTimesheetEvidenceDiscrepancyNote({ evidenceId: 91, note: "Entered hours and visible total require human follow-up." })).resolves.toMatchObject({ evidenceId: 91, authorUserId: 8 });
    expect(assign).toHaveBeenCalledWith(8, 91, 8);
    expect(addNote).toHaveBeenCalledWith(8, 91, "Entered hours and visible total require human follow-up.");
    for (const role of ["admin", "recruiter", "hr_compliance", "account_manager", "delivery_manager", "project_manager", "consultant", "user"] as const) {
      const caller = appRouter.createCaller(createContext(role, 9));
      await expect(caller.finance.eligibleTimesheetEvidenceReviewers()).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.finance.assignTimesheetEvidenceReviewer({ evidenceId: 91, reviewerUserId: 8 })).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.finance.addTimesheetEvidenceDiscrepancyNote({ evidenceId: 91, note: "Entered hours and visible total require human follow-up." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    addNote.mockRejectedValueOnce(new Error("Only the designated Finance reviewer may add a discrepancy note"));
    await expect(financeCaller.finance.addTimesheetEvidenceDiscrepancyNote({ evidenceId: 91, note: "Entered hours and visible total require human follow-up." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    reviewers.mockRestore();
    assign.mockRestore();
    addNote.mockRestore();
  });

  it("allows only Consultant-compatible accounts to acknowledge and submit one factual response for their own reviewer note", async () => {
    const acknowledgement = vi.spyOn(db, "acknowledgeConsultantTimesheetEvidenceDiscrepancy").mockResolvedValue({ reviewerNoteId: 118, acknowledgedAt: new Date("2026-08-27") } as never);
    const response = vi.spyOn(db, "createConsultantTimesheetEvidenceDiscrepancyResponse").mockResolvedValue({ id: 41, reviewerNoteId: 118, body: "The documented source total remains forty hours.", createdAt: new Date("2026-08-27") } as never);
    const consultantCaller = appRouter.createCaller(createContext("consultant", 17));
    const userCaller = appRouter.createCaller(createContext("user", 18));

    await expect(consultantCaller.consultant.acknowledgeTimesheetEvidenceDiscrepancy({ reviewerNoteId: 118 })).resolves.toMatchObject({ reviewerNoteId: 118 });
    await expect(userCaller.consultant.respondToTimesheetEvidenceDiscrepancy({ reviewerNoteId: 118, body: "The documented source total remains forty hours." })).resolves.toMatchObject({ reviewerNoteId: 118, body: "The documented source total remains forty hours." });
    expect(acknowledgement).toHaveBeenCalledWith(17, 118);
    expect(response).toHaveBeenCalledWith(18, 118, "The documented source total remains forty hours.");
    for (const role of ["admin", "recruiter", "hr_compliance", "account_manager", "delivery_manager", "project_manager", "finance"] as const) {
      const caller = appRouter.createCaller(createContext(role, 9));
      await expect(caller.consultant.acknowledgeTimesheetEvidenceDiscrepancy({ reviewerNoteId: 118 })).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.consultant.respondToTimesheetEvidenceDiscrepancy({ reviewerNoteId: 118, body: "The documented source total remains forty hours." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    const safeResult = await userCaller.consultant.respondToTimesheetEvidenceDiscrepancy({ reviewerNoteId: 118, body: "The documented source total remains forty hours." });
    expect(safeResult).not.toHaveProperty("reviewerUserId");
    expect(safeResult).not.toHaveProperty("fileKey");
    expect(safeResult).not.toHaveProperty("clientContent");
    expect(safeResult).not.toHaveProperty("payrollState");
    acknowledgement.mockRestore();
    response.mockRestore();
  });

  it("rejects cross-consultant reviewer notes and keeps duplicate concurrent factual responses retry-safe", async () => {
    const acknowledgement = vi.spyOn(db, "acknowledgeConsultantTimesheetEvidenceDiscrepancy").mockRejectedValueOnce(new Error("Timesheet discrepancy note was not found"));
    const response = vi.spyOn(db, "createConsultantTimesheetEvidenceDiscrepancyResponse").mockResolvedValue({ id: 41, reviewerNoteId: 118, body: "The documented source total remains forty hours.", createdAt: new Date("2026-08-27") } as never);
    const caller = appRouter.createCaller(createContext("consultant", 17));
    const input = { reviewerNoteId: 118, body: "The documented source total remains forty hours." };

    await expect(caller.consultant.acknowledgeTimesheetEvidenceDiscrepancy({ reviewerNoteId: 118 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    const [first, repeated] = await Promise.all([caller.consultant.respondToTimesheetEvidenceDiscrepancy(input), caller.consultant.respondToTimesheetEvidenceDiscrepancy(input)]);
    expect(first).toEqual(repeated);
    expect(response).toHaveBeenCalledTimes(2);
    acknowledgement.mockRestore();
    response.mockRestore();
  });

  it("limits each Consultant to twelve discrepancy acknowledgement or response writes per minute", async () => {
    const acknowledgement = vi.spyOn(db, "acknowledgeConsultantTimesheetEvidenceDiscrepancy").mockImplementation(async (_userId, reviewerNoteId) => ({ reviewerNoteId, acknowledgedAt: new Date() }) as never);
    const caller = appRouter.createCaller(createContext("consultant", 17));
    for (let index = 0; index < 12; index += 1) {
      await expect(caller.consultant.acknowledgeTimesheetEvidenceDiscrepancy({ reviewerNoteId: index + 1 })).resolves.toMatchObject({ reviewerNoteId: index + 1 });
    }
    await expect(caller.consultant.respondToTimesheetEvidenceDiscrepancy({ reviewerNoteId: 99, body: "The documented source total remains forty hours." })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(acknowledgement).toHaveBeenCalledTimes(12);
    acknowledgement.mockRestore();
  });

  it("serves deterministic Consultant Action Inbox items only to consultant-compatible session roles with safe fields", async () => {
    const safeItems = [{ dedupKey: "onboarding-task:41:pending", source: "onboarding_task", title: "Review your workforce profile", status: "action_needed", designatedHumanOwner: "Workforce Operations", destination: "/workspace/onboarding", updatedAt: new Date(), state: "unread" }];
    const inbox = vi.spyOn(db, "listConsultantActionInbox").mockResolvedValue(safeItems as never);

    await expect(appRouter.createCaller(createContext("consultant", 17)).consultant.actionInbox()).resolves.toEqual(safeItems);
    await expect(appRouter.createCaller(createContext("consultant", 17)).consultant.actionInbox({ includeDismissed: true })).resolves.toEqual(safeItems);
    await expect(appRouter.createCaller(createContext("user", 18)).consultant.actionInbox()).resolves.toEqual(safeItems);
    for (const role of ["admin", "recruiter", "hr_compliance", "account_manager", "delivery_manager", "project_manager", "finance"] as const) {
      await expect(appRouter.createCaller(createContext(role, 19)).consultant.actionInbox()).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    expect(inbox).toHaveBeenCalledWith(17, false);
    expect(inbox).toHaveBeenCalledWith(17, true);
    expect(safeItems[0]).not.toHaveProperty("userId");
    expect(safeItems[0]).not.toHaveProperty("readinessDetails");
    expect(safeItems[0]).not.toHaveProperty("compensation");
    expect(safeItems[0]).not.toHaveProperty("clientName");
    expect(safeItems[0]).not.toHaveProperty("colleague");
    inbox.mockRestore();
  });

  it("persists Consultant Action Inbox read and dismiss state only for the session user's deterministic key", async () => {
    const state = vi.spyOn(db, "setConsultantActionInboxState").mockImplementation(async (userId, dedupKey, nextState) => ({ dedupKey, state: nextState }));
    const caller = appRouter.createCaller(createContext("consultant", 17));

    await expect(caller.consultant.markActionRead({ dedupKey: "time-entry:72:draft" })).resolves.toEqual({ dedupKey: "time-entry:72:draft", state: "read" });
    await expect(caller.consultant.dismissAction({ dedupKey: "assignment:4:end_date_soon" })).resolves.toEqual({ dedupKey: "assignment:4:end_date_soon", state: "dismissed" });
    expect(state).toHaveBeenNthCalledWith(1, 17, "time-entry:72:draft", "read");
    expect(state).toHaveBeenNthCalledWith(2, 17, "assignment:4:end_date_soon", "dismissed");
    await expect(appRouter.createCaller(createContext("admin", 1)).consultant.markActionRead({ dedupKey: "time-entry:72:draft" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    state.mockRejectedValueOnce(new Error("Action Inbox item was not found"));
    await expect(caller.consultant.dismissAction({ dedupKey: "foreign:99" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    state.mockRestore();
  });

  it("restores only a still-derived own Action Inbox item, with foreign, expired-source, and non-consultant requests denied", async () => {
    const restore = vi.spyOn(db, "restoreConsultantActionInboxState").mockResolvedValue({ dedupKey: "time-entry:72:draft", state: "read", restoredAt: new Date("2026-09-01T12:00:00.000Z") } as never);
    const caller = appRouter.createCaller(createContext("consultant", 17));

    await expect(caller.consultant.restoreAction({ dedupKey: "time-entry:72:draft" })).resolves.toMatchObject({ state: "read", restoredAt: new Date("2026-09-01T12:00:00.000Z") });
    expect(restore).toHaveBeenCalledWith(17, "time-entry:72:draft");
    restore.mockRejectedValueOnce(new Error("Action Inbox item was not found"));
    await expect(caller.consultant.restoreAction({ dedupKey: "foreign:99" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    restore.mockRejectedValueOnce(new Error("Action Inbox item was not found"));
    await expect(caller.consultant.restoreAction({ dedupKey: "time-entry:72:expired-source" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    for (const role of ["admin", "recruiter", "hr_compliance", "account_manager", "delivery_manager", "project_manager", "finance"] as const) {
      await expect(appRouter.createCaller(createContext(role, 19)).consultant.restoreAction({ dedupKey: "time-entry:72:draft" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    restore.mockRestore();
  });

  it("limits each consultant to twenty Action Inbox state updates per minute", async () => {
    const state = vi.spyOn(db, "setConsultantActionInboxState").mockImplementation(async (_userId, dedupKey, nextState) => ({ dedupKey, state: nextState }));
    const restore = vi.spyOn(db, "restoreConsultantActionInboxState").mockImplementation(async (_userId, dedupKey) => ({ dedupKey, state: "read" as const, restoredAt: new Date() }));
    const caller = appRouter.createCaller(createContext("consultant", 17));

    for (let index = 0; index < 19; index += 1) {
      await expect(caller.consultant.markActionRead({ dedupKey: `time-entry:${index + 1}:draft` })).resolves.toMatchObject({ state: "read" });
    }
    await expect(caller.consultant.restoreAction({ dedupKey: "assignment:4:end_date_soon" })).resolves.toMatchObject({ state: "read" });
    await expect(caller.consultant.dismissAction({ dedupKey: "assignment:4:end_date_soon" })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(state).toHaveBeenCalledTimes(19);
    expect(restore).toHaveBeenCalledTimes(1);
    state.mockRestore();
    restore.mockRestore();
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
