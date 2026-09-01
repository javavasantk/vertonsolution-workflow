// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { authState, startLoginSpy, aiTestState, workspaceAssistantState, demoAuthState, resumeTestState, adminTestState, portalTestState, readinessTestState, newHireTestState, profileTestState, consultantMyWorkTestState, consultantActivityTimelineTestState, consultantEngagementTestState, consultantEngagementContinuityTestState, consultantTaskTestState, consultantCheckInTestState, consultantTimeSubmissionTestState, consultantTimeReconciliationTestState, consultantActionInboxTestState, financeTimesheetEvidenceTestState } = vi.hoisted(() => ({
  authState: {
    user: null as any,
    loading: false,
    error: null,
    isAuthenticated: false,
    refresh: vi.fn(),
    logout: vi.fn(),
  },
  startLoginSpy: vi.fn(),
  aiTestState: {
    mutate: vi.fn(),
    isPending: false,
    error: null as Error | null,
    response: null as { briefing: string; task: string; model: string } | null,
  },
  workspaceAssistantState: {
    mutate: vi.fn(),
    isPending: false,
    error: null as Error | null,
    response: { reply: "Use the assigned workflow controls and confirm the designated human owner before acting.", model: "test-model", unavailable: false },
  },
  demoAuthState: {
    loginMutate: vi.fn(),
    loginPending: false,
    resetRequestMutate: vi.fn(),
    resetMutate: vi.fn(),
    accounts: [{ id: 2, name: "Riley Brooks", email: "recruiter@demo.vertonsolutions.com", role: "recruiter" }],
    loginAs: null as any,
  },
  resumeTestState: {
    mutate: vi.fn(),
    uploadMutate: vi.fn(),
    candidateUpdateMutate: vi.fn(),
    candidates: [{ id: 31, candidateName: "Lena Garcia", email: "lena@example.com", location: "Denver, CO", yearsExperience: "6 years", skills: ["TypeScript", "React"], reviewState: "pending" }, { id: 32, candidateName: "Owen Miller", email: "owen@example.com", location: "Chicago, IL", yearsExperience: "8 years", skills: ["Java", "Spring"], reviewState: "reviewed" }] as any[],
    isPending: false,
    error: null as Error | null,
    candidatesLoading: false,
    candidatesError: null as Error | null,
    candidateDetail: { id: 31, candidateName: "Lena Garcia", email: "lena@example.com", phone: "555-0199", location: "Denver, CO", professionalSummary: "Test automation engineer.", yearsExperience: "6 years", skills: ["TypeScript", "React"], recentRoles: [{ title: "QA Engineer", company: "Northstar", period: "2022–present" }], education: ["B.S. Computer Science"], recruiterNotes: ["Confirm experience."], confidence: "medium", reviewState: "pending_human_review" } as any,
    candidateDetailLoading: false,
    candidateDetailError: null as Error | null,
    completeUploadError: null as Error | null,
    response: { profile: { candidateName: "Alex Morgan", email: "alex@example.com", phone: "555-0100", location: "Austin, TX", professionalSummary: "Full-stack engineer with cloud delivery experience.", yearsExperience: "6 years", skills: ["TypeScript", "React", "AWS"], recentRoles: [{ title: "Software Engineer", company: "Northstar", period: "2022–present" }], education: ["B.S. Computer Science"], recruiterNotes: ["Confirm project availability with the candidate."], confidence: "high" }, model: "test-model", unavailable: false } as any,
  },
  adminTestState: {
    users: [] as any[],
    roleChangeMutate: vi.fn(),
  },
  portalTestState: {
    projectUpdateMutate: vi.fn(),
    summaryRefetch: vi.fn(),
    projectUpdateError: false,
  },
  readinessTestState: {
    records: [] as any[],
    isLoading: false,
    error: null as Error | null,
  },
  newHireTestState: {
    records: [] as any[],
    isLoading: false,
    error: null as Error | null,
  },
  profileTestState: {
    record: undefined as any,
    isLoading: false,
    error: null as Error | null,
    history: [] as any[],
    historyLoading: false,
    historyError: null as Error | null,
    historyRefetch: vi.fn(),
    mutation: vi.fn(),
    mutationError: false,
  },
  consultantMyWorkTestState: {
    data: { profile: { profileUpdateState: "details_requested", updatedAt: new Date("2026-08-26") }, onboarding: { onboardingStage: "manager_confirmation", progressPercent: 82, assignmentState: "active", updatedAt: new Date("2026-08-26") }, assignment: { id: 1, projectName: "Northstar Commerce Cloud · Demo", clientName: "Northstar Retail · Demo", managerName: "Casey Rivera", allocationPercent: 100, assignmentState: "active", startDate: null, endDate: null, updatedAt: new Date("2026-08-26") }, latestTimesheet: { assignmentId: 1, weekEnding: new Date("2026-08-23"), hours: 40, status: "submitted", updatedAt: new Date("2026-08-26") } } as any,
    isLoading: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
  consultantActivityTimelineTestState: {
    firstPage: { items: [{ eventType: "time_entry_submitted", source: "time_submission", summary: "You submitted a time entry for designated human review.", occurredAt: new Date("2026-08-26T12:00:00.000Z"), destination: "/workspace/time-submission", cursor: "first-cursor" }, { eventType: "check_in_submitted", source: "check_in", summary: "You recorded a factual check-in.", occurredAt: new Date("2026-08-25T12:00:00.000Z"), destination: "/workspace/check-ins", cursor: "next-cursor" }], nextCursor: "next-cursor" } as any,
    nextPage: { items: [{ eventType: "profile_update_requested", source: "profile", summary: "You submitted a profile update request for human review.", occurredAt: new Date("2026-08-24T12:00:00.000Z"), destination: "/workspace/profile", cursor: "final-cursor" }], nextCursor: null } as any,
    isLoading: false,
    error: null as Error | null,
    refetch: vi.fn(),
    lastInput: undefined as any,
  },
  consultantEngagementTestState: {
    data: { assignment: { id: 1, projectName: "Northstar Commerce Cloud · Demo", clientName: "Northstar Retail · Demo", managerName: "Casey Rivera", allocationPercent: 100, assignmentState: "active", startDate: new Date("2026-08-01"), endDate: null, updatedAt: new Date("2026-08-26") }, hasActiveAssignment: true, latestTimesheet: { assignmentId: 1, weekEnding: new Date("2026-08-23"), hours: 40, status: "submitted", updatedAt: new Date("2026-08-26") } } as any,
    isLoading: false,
    error: null as Error | null,
  },
  consultantEngagementContinuityTestState: {
    data: { assignment: { projectLabel: "Northstar Commerce Cloud · Demo", managerLabel: "Casey Rivera", assignmentState: "active", endDate: new Date("2026-12-31"), updatedAt: new Date("2026-08-26") }, hasActiveAssignment: true, designatedHumanOwner: "Casey Rivera", notes: [{ id: 81, category: "handoff_context", factualNote: "The latest implementation handoff context is recorded for the designated human owner.", createdAt: new Date("2026-08-26") }] } as any,
    isLoading: false,
    error: null as Error | null,
    mutate: vi.fn(),
    mutationError: null as Error | null,
    refetch: vi.fn(),
  },
  consultantTaskTestState: {
    tasks: [{ id: 41, title: "Review your workforce profile", taskType: "profile", description: "Review current personal workflow fields.", ownerGroup: "consultant", dueDate: new Date("2026-09-01"), consultantCompletionState: "pending", acknowledgedAt: null, updatedAt: new Date("2026-08-26") }] as any[],
    isLoading: false,
    error: null as Error | null,
    mutate: vi.fn(),
    mutationError: null as Error | null,
    refetch: vi.fn(),
  },
  consultantCheckInTestState: {
    data: { designatedHumanOwner: "Casey Rivera", checkIns: [{ id: 61, category: "work_update", factualNote: "Completed the documented project walkthrough with the delivery contact.", createdAt: new Date("2026-08-26") }] } as any,
    isLoading: false,
    error: null as Error | null,
    mutate: vi.fn(),
    mutationError: null as Error | null,
    refetch: vi.fn(),
  },
  consultantTimeSubmissionTestState: {
    data: { designatedHumanOwner: "Casey Rivera", assignments: [{ id: 1, projectName: "Northstar Commerce Cloud · Demo", assignmentState: "active" }], entries: [{ id: 71, assignmentId: 1, weekEnding: new Date("2026-08-23"), hours: 40, status: "draft", note: "Completed the planned project delivery hours.", updatedAt: new Date("2026-08-26"), evidence: [] }] } as any,
    isLoading: false,
    error: null as Error | null,
    create: vi.fn(),
    update: vi.fn(),
    submit: vi.fn(),
    prepareEvidence: vi.fn(),
    completeEvidence: vi.fn(),
    retryEvidence: vi.fn(),
    acknowledgeDiscrepancy: vi.fn(),
    respondToDiscrepancy: vi.fn(),
    mutationError: null as Error | null,
    evidenceError: null as Error | null,
    discrepancyError: null as Error | null,
    refetch: vi.fn(),
    periodTotal: { startDate: new Date("2026-08-01"), endDate: new Date("2026-08-31"), entryCount: 1, enteredHoursTotal: 40, statusCounts: { draft: 1, submitted: 0, approved: 0, exception: 0 } } as any,
    periodTotalLoading: false,
    periodTotalError: null as Error | null,
    periodTotalRefetch: vi.fn(),
  },
  consultantTimeReconciliationTestState: {
    data: { startDate: new Date("2026-08-01"), endDate: new Date("2026-08-31"), status: null, entryCount: 1, enteredHoursTotal: 40, evidenceCount: 1, ocrResultCount: 1, rows: [{ timeEntryId: 71, weekEnding: new Date("2026-08-23"), status: "draft", enteredHours: 40, evidence: [{ evidenceId: 91, originalFileName: "approved-week.pdf", mimeType: "application/pdf", extractionStatus: "extracted", extractedHours: 38, extractionConfidence: "medium", reviewerAssigned: true, differenceHours: 2, comparisonLabel: "Human comparison needed", discrepancyNotes: [{ note: "Please provide factual clarification for the visible source total.", createdAt: new Date("2026-08-26") }], createdAt: new Date("2026-08-26") }] }] } as any,
    isLoading: false,
    error: null as Error | null,
    refetch: vi.fn(),
    lastInput: undefined as any,
  },
  consultantActionInboxTestState: {
    items: [{ dedupKey: "onboarding-task:41:pending", source: "onboarding_task", title: "Review your workforce profile", status: "action_needed", designatedHumanOwner: "Workforce Operations", destination: "/workspace/onboarding", updatedAt: new Date("2026-08-26"), agingLabel: "Updated this week", state: "unread", dismissedAt: null, restoredAt: null, stateUpdatedAt: null }] as any[],
    isLoading: false,
    error: null as Error | null,
    markRead: vi.fn(),
    dismiss: vi.fn(),
    restore: vi.fn(),
    mutationError: null as Error | null,
    refetch: vi.fn(),
    lastInput: undefined as any,
  },
  financeTimesheetEvidenceTestState: {
    data: [] as any[],
    isLoading: false,
    error: null as Error | null,
    refetch: vi.fn(),
    reviewers: [{ id: 1, name: "Finley Finance", email: "finance@vertonsolutions.test" }] as any[],
    reviewersLoading: false,
    reviewersError: null as Error | null,
    assignReviewer: vi.fn(),
    addNote: vi.fn(),
    mutationError: null as Error | null,
  },
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => authState,
}));

vi.mock("@/const", () => ({
  startLogin: startLoginSpy,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { invalidate: vi.fn(async () => undefined) } } }),
    auth: {
      demoAccounts: { useQuery: () => ({ data: { accounts: demoAuthState.accounts, sharedPassword: "VertonDemo!2026" } }) },
      demoLogin: { useMutation: (options?: { onSuccess?: () => void }) => ({ mutate: (input: unknown) => { demoAuthState.loginMutate(input); if (demoAuthState.loginAs) { authState.user = demoAuthState.loginAs; authState.isAuthenticated = true; } options?.onSuccess?.(); }, isPending: demoAuthState.loginPending, error: null }) },
      requestDemoPasswordReset: { useMutation: (options?: { onSuccess?: (data: { message: string; resetToken: string | null }) => void }) => ({ mutate: (input: unknown) => { demoAuthState.resetRequestMutate(input); options?.onSuccess?.({ message: "A one-time demonstration reset code is ready.", resetToken: "demo-reset-token-1234567890" }); }, isPending: false, error: null }) },
      resetDemoPassword: { useMutation: (options?: { onSuccess?: () => void }) => ({ mutate: (input: unknown) => { demoAuthState.resetMutate(input); options?.onSuccess?.(); }, isPending: false, error: null }) },
    },
    access: {
      listUsers: { useQuery: () => ({ data: adminTestState.users, isLoading: false, refetch: vi.fn() }) },
      assignRole: { useMutation: (options?: { onSuccess?: (result: { success: true }, input: { userId: number; role: string }) => void }) => ({ mutate: (input: { userId: number; role: string }) => { adminTestState.roleChangeMutate(input); options?.onSuccess?.({ success: true }, input); }, isPending: false }) },
      permissionGroups: { useQuery: () => ({ data: [], isLoading: false, refetch: vi.fn() }) },
      roleChangeHistory: { useQuery: () => ({ data: [], isLoading: false, refetch: vi.fn() }) },
    },
    profile: {
      mine: { useQuery: () => ({ data: profileTestState.record, isLoading: profileTestState.isLoading, error: profileTestState.error, refetch: vi.fn() }) },
      requestHistory: { useQuery: () => ({ data: profileTestState.history, isLoading: profileTestState.historyLoading, error: profileTestState.historyError, refetch: profileTestState.historyRefetch }) },
      readinessRecords: { useQuery: () => ({ data: readinessTestState.records, isLoading: readinessTestState.isLoading, error: readinessTestState.error, refetch: vi.fn() }) },
      requestReview: { useMutation: (options?: { onSuccess?: () => void; onError?: () => void }) => ({ mutate: (input: unknown) => { profileTestState.mutation(input); if (profileTestState.mutationError) options?.onError?.(); else options?.onSuccess?.(); }, isPending: false }),
    },
    },
    consultant: {
      myWork: { useQuery: () => ({ data: consultantMyWorkTestState.data, isLoading: consultantMyWorkTestState.isLoading, error: consultantMyWorkTestState.error, refetch: consultantMyWorkTestState.refetch }) },
      personalActivityTimeline: { useQuery: (input: any) => { consultantActivityTimelineTestState.lastInput = input; return { data: input?.cursor ? consultantActivityTimelineTestState.nextPage : consultantActivityTimelineTestState.firstPage, isLoading: consultantActivityTimelineTestState.isLoading, error: consultantActivityTimelineTestState.error, refetch: consultantActivityTimelineTestState.refetch }; } },
      myEngagement: { useQuery: () => ({ data: consultantEngagementTestState.data, isLoading: consultantEngagementTestState.isLoading, error: consultantEngagementTestState.error, refetch: vi.fn() }) },
      engagementContinuity: { useQuery: () => ({ data: consultantEngagementContinuityTestState.data, isLoading: consultantEngagementContinuityTestState.isLoading, error: consultantEngagementContinuityTestState.error, refetch: consultantEngagementContinuityTestState.refetch }) },
      submitEngagementContinuityNote: { useMutation: (options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => ({ mutate: (input: unknown) => { consultantEngagementContinuityTestState.mutate(input); if (consultantEngagementContinuityTestState.mutationError) options?.onError?.(consultantEngagementContinuityTestState.mutationError); else options?.onSuccess?.(); }, isPending: false, error: consultantEngagementContinuityTestState.mutationError }) },
      checkIns: { useQuery: () => ({ data: consultantCheckInTestState.data, isLoading: consultantCheckInTestState.isLoading, error: consultantCheckInTestState.error, refetch: consultantCheckInTestState.refetch }) },
      submitCheckIn: { useMutation: (options?: { onSuccess?: () => void; onError?: () => void }) => ({ mutate: (input: unknown) => { consultantCheckInTestState.mutate(input); if (consultantCheckInTestState.mutationError) options?.onError?.(); else options?.onSuccess?.(); }, isPending: false, error: consultantCheckInTestState.mutationError }) },
      timeSubmissions: { useQuery: () => ({ data: consultantTimeSubmissionTestState.data, isLoading: consultantTimeSubmissionTestState.isLoading, error: consultantTimeSubmissionTestState.error, refetch: consultantTimeSubmissionTestState.refetch }) },
      timeSubmissionPeriodTotal: { useQuery: () => ({ data: consultantTimeSubmissionTestState.periodTotal, isLoading: consultantTimeSubmissionTestState.periodTotalLoading, error: consultantTimeSubmissionTestState.periodTotalError, refetch: consultantTimeSubmissionTestState.periodTotalRefetch }) },
      timeReconciliation: { useQuery: (input: any) => { consultantTimeReconciliationTestState.lastInput = input; return { data: consultantTimeReconciliationTestState.data, isLoading: consultantTimeReconciliationTestState.isLoading, error: consultantTimeReconciliationTestState.error, refetch: consultantTimeReconciliationTestState.refetch }; } },
      createTimeSubmission: { useMutation: (options?: { onSuccess?: () => void; onError?: () => void }) => ({ mutate: (input: unknown) => { consultantTimeSubmissionTestState.create(input); if (consultantTimeSubmissionTestState.mutationError) options?.onError?.(); else options?.onSuccess?.(); }, isPending: false, error: consultantTimeSubmissionTestState.mutationError }) },
      updateTimeSubmission: { useMutation: (options?: { onSuccess?: () => void; onError?: () => void }) => ({ mutate: (input: unknown) => { consultantTimeSubmissionTestState.update(input); if (consultantTimeSubmissionTestState.mutationError) options?.onError?.(); else options?.onSuccess?.(); }, isPending: false, error: consultantTimeSubmissionTestState.mutationError }) },
      submitTimeSubmission: { useMutation: (options?: { onSuccess?: () => void; onError?: () => void }) => ({ mutate: (input: unknown) => { consultantTimeSubmissionTestState.submit(input); if (consultantTimeSubmissionTestState.mutationError) options?.onError?.(); else options?.onSuccess?.(); }, isPending: false, error: consultantTimeSubmissionTestState.mutationError }) },
      prepareTimesheetEvidenceUpload: { useMutation: () => ({ mutateAsync: async (input: unknown) => { consultantTimeSubmissionTestState.prepareEvidence(input); if (consultantTimeSubmissionTestState.evidenceError) throw consultantTimeSubmissionTestState.evidenceError; return { sessionId: "b6d2ba3c-6f44-4d4c-b7f9-9a457bca80f2", uploadPath: "/api/consultant/timesheet-upload/b6d2ba3c-6f44-4d4c-b7f9-9a457bca80f2", expiresAt: new Date() }; }, isPending: false, error: consultantTimeSubmissionTestState.evidenceError }) },
      completeTimesheetEvidenceUpload: { useMutation: (options?: { onSuccess?: (data: any) => void; onError?: (error: Error) => void }) => ({ mutate: (input: unknown) => { consultantTimeSubmissionTestState.completeEvidence(input); if (consultantTimeSubmissionTestState.evidenceError) options?.onError?.(consultantTimeSubmissionTestState.evidenceError); else options?.onSuccess?.({ id: 91, timeEntryId: 71, originalFileName: "approved-week.pdf", mimeType: "application/pdf", fileSize: 24, extractionStatus: "extracted", extractedHours: 40, extractionConfidence: "high", createdAt: new Date("2026-08-26"), updatedAt: new Date("2026-08-26") }); }, mutateAsync: async (input: unknown) => { consultantTimeSubmissionTestState.completeEvidence(input); if (consultantTimeSubmissionTestState.evidenceError) { options?.onError?.(consultantTimeSubmissionTestState.evidenceError); throw consultantTimeSubmissionTestState.evidenceError; } const result = { id: 91, timeEntryId: 71, originalFileName: "approved-week.pdf", mimeType: "application/pdf", fileSize: 24, extractionStatus: "extracted", extractedHours: 40, extractionConfidence: "high", createdAt: new Date("2026-08-26"), updatedAt: new Date("2026-08-26") }; options?.onSuccess?.(result); return result; }, isPending: false, error: consultantTimeSubmissionTestState.evidenceError }) },
      retryTimesheetHoursExtraction: { useMutation: (options?: { onSuccess?: (data: any) => void; onError?: (error: Error) => void }) => ({ mutate: (input: unknown) => { consultantTimeSubmissionTestState.retryEvidence(input); if (consultantTimeSubmissionTestState.evidenceError) options?.onError?.(consultantTimeSubmissionTestState.evidenceError); else options?.onSuccess?.({ id: 91, timeEntryId: 71, extractionStatus: "extracted", extractedHours: 40, extractionConfidence: "high" }); }, isPending: false, error: consultantTimeSubmissionTestState.evidenceError }) },
      acknowledgeTimesheetEvidenceDiscrepancy: { useMutation: (options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => ({ mutate: (input: unknown) => { consultantTimeSubmissionTestState.acknowledgeDiscrepancy(input); if (consultantTimeSubmissionTestState.discrepancyError) options?.onError?.(consultantTimeSubmissionTestState.discrepancyError); else options?.onSuccess?.(); }, isPending: false, error: consultantTimeSubmissionTestState.discrepancyError }) },
      respondToTimesheetEvidenceDiscrepancy: { useMutation: (options?: { onSuccess?: (data: any, input: any) => void; onError?: (error: Error) => void }) => ({ mutate: (input: any) => { consultantTimeSubmissionTestState.respondToDiscrepancy(input); if (consultantTimeSubmissionTestState.discrepancyError) options?.onError?.(consultantTimeSubmissionTestState.discrepancyError); else options?.onSuccess?.({ ...input, createdAt: new Date() }, input); }, isPending: false, error: consultantTimeSubmissionTestState.discrepancyError }) },
      actionInbox: { useQuery: (input: unknown) => { consultantActionInboxTestState.lastInput = input; return { data: consultantActionInboxTestState.items, isLoading: consultantActionInboxTestState.isLoading, error: consultantActionInboxTestState.error, refetch: consultantActionInboxTestState.refetch }; } },
      markActionRead: { useMutation: (options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => ({ mutate: (input: unknown) => { consultantActionInboxTestState.markRead(input); if (consultantActionInboxTestState.mutationError) options?.onError?.(consultantActionInboxTestState.mutationError); else options?.onSuccess?.(); }, isPending: false, error: consultantActionInboxTestState.mutationError }) },
      dismissAction: { useMutation: (options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => ({ mutate: (input: unknown) => { consultantActionInboxTestState.dismiss(input); if (consultantActionInboxTestState.mutationError) options?.onError?.(consultantActionInboxTestState.mutationError); else options?.onSuccess?.(); }, isPending: false, error: consultantActionInboxTestState.mutationError }) },
      restoreAction: { useMutation: (options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => ({ mutate: (input: unknown) => { consultantActionInboxTestState.restore(input); if (consultantActionInboxTestState.mutationError) options?.onError?.(consultantActionInboxTestState.mutationError); else options?.onSuccess?.(); }, isPending: false, error: consultantActionInboxTestState.mutationError }) },
    },
    finance: {
      timesheetEvidenceReview: { useQuery: () => ({ data: financeTimesheetEvidenceTestState.data, isLoading: financeTimesheetEvidenceTestState.isLoading, error: financeTimesheetEvidenceTestState.error, refetch: financeTimesheetEvidenceTestState.refetch }) },
      eligibleTimesheetEvidenceReviewers: { useQuery: () => ({ data: financeTimesheetEvidenceTestState.reviewers, isLoading: financeTimesheetEvidenceTestState.reviewersLoading, error: financeTimesheetEvidenceTestState.reviewersError, refetch: vi.fn() }) },
      assignTimesheetEvidenceReviewer: { useMutation: (options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => ({ mutate: (input: unknown) => { financeTimesheetEvidenceTestState.assignReviewer(input); if (financeTimesheetEvidenceTestState.mutationError) options?.onError?.(financeTimesheetEvidenceTestState.mutationError); else options?.onSuccess?.(); }, isPending: false, error: financeTimesheetEvidenceTestState.mutationError }) },
      addTimesheetEvidenceDiscrepancyNote: { useMutation: (options?: { onSuccess?: (data: unknown, input: any) => void; onError?: (error: Error) => void }) => ({ mutate: (input: any) => { financeTimesheetEvidenceTestState.addNote(input); if (financeTimesheetEvidenceTestState.mutationError) options?.onError?.(financeTimesheetEvidenceTestState.mutationError); else options?.onSuccess?.({ ...input, createdAt: new Date() }, input); }, isPending: false, error: financeTimesheetEvidenceTestState.mutationError }) },
    },
    onboarding: {
      myTasks: { useQuery: () => ({ data: consultantTaskTestState.tasks, isLoading: consultantTaskTestState.isLoading, error: consultantTaskTestState.error, refetch: consultantTaskTestState.refetch }) },
      acknowledgeTask: { useMutation: (options?: { onSuccess?: () => void }) => ({ mutate: (input: unknown) => { consultantTaskTestState.mutate(input); options?.onSuccess?.(); }, isPending: false, error: consultantTaskTestState.mutationError }) },
    },
    portal: {
      demoSummary: { useQuery: () => ({ data: { clients: [{ id: 1, name: "Northstar Retail · Demo", industry: "Retail", location: "Dallas, TX", status: "active" }], projects: [{ id: 1, name: "Northstar Commerce Cloud · Demo", deliveryStatus: "active", projectManagerName: "Casey Rivera" }], demands: [{ id: 1, status: "open", title: "Database Lead Engineer", priority: "high", clientId: 1, openings: 1 }], assignments: [{ id: 1, assignmentState: "active", projectId: 1, clientId: 1, allocationPercent: 100, managerName: "Casey Rivera" }], timesheets: [{ id: 1, assignmentId: 1, status: "approved", hours: 40, note: "Internal demonstration time entry", weekEnding: new Date("2026-08-23") }], activities: [{ id: 1, entityType: "assignment", title: "Demo assignment extension review", activityState: "attention" }] }, refetch: portalTestState.summaryRefetch }) },
      updateProject: { useMutation: (options?: { onSuccess?: () => void; onError?: () => void }) => ({ mutate: (input: unknown) => { portalTestState.projectUpdateMutate(input); if (portalTestState.projectUpdateError) options?.onError?.(); else options?.onSuccess?.(); }, isPending: false }) },
    },
    recruiting: {
      newHireProgress: { useQuery: () => ({ data: newHireTestState.records, isLoading: newHireTestState.isLoading, error: newHireTestState.error, refetch: vi.fn() }) },
      listCandidates: { useQuery: () => ({ data: resumeTestState.candidates, isLoading: resumeTestState.candidatesLoading, error: resumeTestState.candidatesError, refetch: vi.fn() }) },
      getCandidate: { useQuery: () => ({ data: resumeTestState.candidateDetail, isLoading: resumeTestState.candidateDetailLoading, error: resumeTestState.candidateDetailError, refetch: vi.fn() }) },
      updateCandidate: { useMutation: (options?: { onSuccess?: () => void }) => ({ mutate: (input: unknown) => { resumeTestState.candidateUpdateMutate(input); options?.onSuccess?.(); }, isPending: false }) },
      parseResume: { useMutation: (options?: { onSuccess?: (data: unknown) => void }) => ({ mutate: (input: unknown) => { resumeTestState.mutate(input); options?.onSuccess?.(resumeTestState.response); }, isPending: resumeTestState.isPending, error: resumeTestState.error }) },
      prepareResumeUpload: { useMutation: () => ({ mutateAsync: async (input: unknown) => { resumeTestState.uploadMutate(input); return { sessionId: "f4c4c2a6-17fb-4d62-b119-784831553898", uploadPath: "/api/recruiter/resume-upload/f4c4c2a6-17fb-4d62-b119-784831553898", expiresAt: new Date() }; }, isPending: false, error: null }) },
      completeResumeUpload: { useMutation: (options?: { onSuccess?: (data: unknown) => void }) => ({ mutate: (input: unknown) => { resumeTestState.uploadMutate(input); if (!resumeTestState.completeUploadError) options?.onSuccess?.({ ...resumeTestState.response, fileName: "alex-morgan.pdf" }); }, mutateAsync: async (input: unknown) => { resumeTestState.uploadMutate(input); if (resumeTestState.completeUploadError) throw resumeTestState.completeUploadError; const result = { ...resumeTestState.response, fileName: "alex-morgan.pdf" }; options?.onSuccess?.(result); return result; }, isPending: false, error: resumeTestState.completeUploadError }) },
    },
    ai: {
      assist: { useMutation: (options?: { onSuccess?: (data: { briefing: string; task: string; model: string }) => void }) => ({ mutate: (input: unknown) => { aiTestState.mutate(input); if (aiTestState.response) options?.onSuccess?.(aiTestState.response); }, isPending: aiTestState.isPending, error: aiTestState.error }) },
      workspaceAssistant: { useMutation: (options?: { onSuccess?: (data: { reply: string; model: string; unavailable: boolean; lookupKind?: string; records?: unknown[] }) => void }) => ({ mutate: (input: unknown) => { workspaceAssistantState.mutate(input); options?.onSuccess?.(workspaceAssistantState.response); }, isPending: workspaceAssistantState.isPending, error: workspaceAssistantState.error }) },
    },
  },
}));

import Home, { buildCandidateExportFilename, buildCandidateResumeCsv, buildCandidateResumePdfText, countCompletedOnboardingTasks, formatCandidateReviewState, getAllowedNavigation, getRecruiterHandoffIndicator, getRoleKeyFromStoredRole, isFinanceRole, resolveWorkspacePage, resolveWorkspacePath } from "./Home";

function setAuthenticatedRole(role: string, name = "Avery Morgan") {
  authState.user = {
    id: 1,
    openId: "test-user",
    email: "avery@vertonsolutions.com",
    name,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  authState.isAuthenticated = true;
  authState.loading = false;
  authState.logout = vi.fn(async () => {
    authState.user = null;
    authState.isAuthenticated = false;
  });
}

function setUnauthenticated() {
  authState.user = null;
  authState.isAuthenticated = false;
  authState.loading = false;
  authState.logout = vi.fn();
}

function renderRoute(path: string) {
  window.history.pushState({}, "", path);
  return render(<Home />);
}

afterEach(() => {
  cleanup();
  setUnauthenticated();
  startLoginSpy.mockReset();
  aiTestState.mutate.mockReset();
  aiTestState.isPending = false;
  aiTestState.error = null;
  aiTestState.response = null;
  workspaceAssistantState.mutate.mockReset();
  workspaceAssistantState.isPending = false;
  workspaceAssistantState.error = null;
  workspaceAssistantState.response = { reply: "Use the assigned workflow controls and confirm the designated human owner before acting.", model: "test-model", unavailable: false };
  demoAuthState.loginMutate.mockReset();
  demoAuthState.loginPending = false;
  demoAuthState.resetRequestMutate.mockReset();
  demoAuthState.resetMutate.mockReset();
  demoAuthState.loginAs = null;
  resumeTestState.mutate.mockReset();
  resumeTestState.uploadMutate.mockReset();
  resumeTestState.candidateUpdateMutate.mockReset();
  resumeTestState.candidates = [{ id: 31, candidateName: "Lena Garcia", email: "lena@example.com", location: "Denver, CO", yearsExperience: "6 years", skills: ["TypeScript", "React"], reviewState: "pending" }, { id: 32, candidateName: "Owen Miller", email: "owen@example.com", location: "Chicago, IL", yearsExperience: "8 years", skills: ["Java", "Spring"], reviewState: "reviewed" }];
  resumeTestState.isPending = false;
  resumeTestState.error = null;
  resumeTestState.candidatesLoading = false;
  resumeTestState.candidatesError = null;
  resumeTestState.candidateDetail = { id: 31, candidateName: "Lena Garcia", email: "lena@example.com", phone: "555-0199", location: "Denver, CO", professionalSummary: "Test automation engineer.", yearsExperience: "6 years", skills: ["TypeScript", "React"], recentRoles: [{ title: "QA Engineer", company: "Northstar", period: "2022–present" }], education: ["B.S. Computer Science"], recruiterNotes: ["Confirm experience."], confidence: "medium", reviewState: "pending_human_review" };
  resumeTestState.candidateDetailLoading = false;
  resumeTestState.candidateDetailError = null;
  resumeTestState.completeUploadError = null;
  adminTestState.users = [];
  adminTestState.roleChangeMutate.mockReset();
  portalTestState.projectUpdateMutate.mockReset();
  portalTestState.summaryRefetch.mockReset();
  portalTestState.projectUpdateError = false;
  readinessTestState.records = [];
  readinessTestState.isLoading = false;
  readinessTestState.error = null;
  newHireTestState.records = [];
  newHireTestState.isLoading = false;
  newHireTestState.error = null;
  profileTestState.record = undefined;
  profileTestState.isLoading = false;
  profileTestState.error = null;
  profileTestState.history = [];
  profileTestState.historyLoading = false;
  profileTestState.historyError = null;
  profileTestState.historyRefetch.mockReset();
  profileTestState.mutation.mockReset();
  profileTestState.mutationError = false;
  consultantMyWorkTestState.data = { profile: { profileUpdateState: "details_requested", updatedAt: new Date("2026-08-26") }, onboarding: { onboardingStage: "manager_confirmation", progressPercent: 82, assignmentState: "active", updatedAt: new Date("2026-08-26") }, assignment: { id: 1, projectName: "Northstar Commerce Cloud · Demo", clientName: "Northstar Retail · Demo", managerName: "Casey Rivera", allocationPercent: 100, assignmentState: "active", startDate: null, endDate: null, updatedAt: new Date("2026-08-26") }, latestTimesheet: { assignmentId: 1, weekEnding: new Date("2026-08-23"), hours: 40, status: "submitted", updatedAt: new Date("2026-08-26") } };
  consultantMyWorkTestState.isLoading = false;
  consultantMyWorkTestState.error = null;
  consultantMyWorkTestState.refetch.mockReset();
  consultantActivityTimelineTestState.firstPage = { items: [{ eventType: "time_entry_submitted", source: "time_submission", summary: "You submitted a time entry for designated human review.", occurredAt: new Date("2026-08-26T12:00:00.000Z"), destination: "/workspace/time-submission", cursor: "first-cursor" }, { eventType: "check_in_submitted", source: "check_in", summary: "You recorded a factual check-in.", occurredAt: new Date("2026-08-25T12:00:00.000Z"), destination: "/workspace/check-ins", cursor: "next-cursor" }], nextCursor: "next-cursor" };
  consultantActivityTimelineTestState.nextPage = { items: [{ eventType: "profile_update_requested", source: "profile", summary: "You submitted a profile update request for human review.", occurredAt: new Date("2026-08-24T12:00:00.000Z"), destination: "/workspace/profile", cursor: "final-cursor" }], nextCursor: null };
  consultantActivityTimelineTestState.isLoading = false;
  consultantActivityTimelineTestState.error = null;
  consultantActivityTimelineTestState.refetch.mockReset();
  consultantActivityTimelineTestState.lastInput = undefined;
  consultantEngagementTestState.data = { assignment: { id: 1, projectName: "Northstar Commerce Cloud · Demo", clientName: "Northstar Retail · Demo", managerName: "Casey Rivera", allocationPercent: 100, assignmentState: "active", startDate: new Date("2026-08-01"), endDate: null, updatedAt: new Date("2026-08-26") }, hasActiveAssignment: true, latestTimesheet: { assignmentId: 1, weekEnding: new Date("2026-08-23"), hours: 40, status: "submitted", updatedAt: new Date("2026-08-26") } };
  consultantEngagementTestState.isLoading = false;
  consultantEngagementTestState.error = null;
  consultantEngagementContinuityTestState.data = { assignment: { projectLabel: "Northstar Commerce Cloud · Demo", managerLabel: "Casey Rivera", assignmentState: "active", endDate: new Date("2026-12-31"), updatedAt: new Date("2026-08-26") }, hasActiveAssignment: true, designatedHumanOwner: "Casey Rivera", notes: [{ id: 81, category: "handoff_context", factualNote: "The latest implementation handoff context is recorded for the designated human owner.", createdAt: new Date("2026-08-26") }] };
  consultantEngagementContinuityTestState.isLoading = false;
  consultantEngagementContinuityTestState.error = null;
  consultantEngagementContinuityTestState.mutate.mockReset();
  consultantEngagementContinuityTestState.mutationError = null;
  consultantEngagementContinuityTestState.refetch.mockReset();
  consultantTaskTestState.tasks = [{ id: 41, title: "Review your workforce profile", taskType: "profile", description: "Review current personal workflow fields.", ownerGroup: "consultant", dueDate: new Date("2026-09-01"), consultantCompletionState: "pending", acknowledgedAt: null, updatedAt: new Date("2026-08-26") }];
  consultantTaskTestState.isLoading = false;
  consultantTaskTestState.error = null;
  consultantTaskTestState.mutate.mockReset();
  consultantTaskTestState.mutationError = null;
  consultantTaskTestState.refetch.mockReset();
  consultantCheckInTestState.data = { designatedHumanOwner: "Casey Rivera", checkIns: [{ id: 61, category: "work_update", factualNote: "Completed the documented project walkthrough with the delivery contact.", createdAt: new Date("2026-08-26") }] };
  consultantCheckInTestState.isLoading = false;
  consultantCheckInTestState.error = null;
  consultantCheckInTestState.mutate.mockReset();
  consultantCheckInTestState.mutationError = null;
  consultantCheckInTestState.refetch.mockReset();
  consultantTimeSubmissionTestState.data = { designatedHumanOwner: "Casey Rivera", assignments: [{ id: 1, projectName: "Northstar Commerce Cloud · Demo", assignmentState: "active" }], entries: [{ id: 71, assignmentId: 1, weekEnding: new Date("2026-08-23"), hours: 40, status: "draft", note: "Completed the planned project delivery hours.", updatedAt: new Date("2026-08-26"), evidence: [] }] };
  consultantTimeSubmissionTestState.isLoading = false;
  consultantTimeSubmissionTestState.error = null;
  consultantTimeSubmissionTestState.create.mockReset();
  consultantTimeSubmissionTestState.update.mockReset();
  consultantTimeSubmissionTestState.submit.mockReset();
  consultantTimeSubmissionTestState.prepareEvidence.mockReset();
  consultantTimeSubmissionTestState.completeEvidence.mockReset();
  consultantTimeSubmissionTestState.retryEvidence.mockReset();
  consultantTimeSubmissionTestState.acknowledgeDiscrepancy.mockReset();
  consultantTimeSubmissionTestState.respondToDiscrepancy.mockReset();
  consultantTimeSubmissionTestState.mutationError = null;
  consultantTimeSubmissionTestState.evidenceError = null;
  consultantTimeSubmissionTestState.discrepancyError = null;
  consultantTimeSubmissionTestState.refetch.mockReset();
  consultantTimeSubmissionTestState.periodTotal = { startDate: new Date("2026-08-01"), endDate: new Date("2026-08-31"), entryCount: 1, enteredHoursTotal: 40, statusCounts: { draft: 1, submitted: 0, approved: 0, exception: 0 } };
  consultantTimeReconciliationTestState.data = { startDate: new Date("2026-08-01"), endDate: new Date("2026-08-31"), status: null, entryCount: 1, enteredHoursTotal: 40, evidenceCount: 1, ocrResultCount: 1, rows: [{ timeEntryId: 71, weekEnding: new Date("2026-08-23"), status: "draft", enteredHours: 40, evidence: [{ evidenceId: 91, originalFileName: "approved-week.pdf", mimeType: "application/pdf", extractionStatus: "extracted", extractedHours: 38, extractionConfidence: "medium", reviewerAssigned: true, differenceHours: 2, comparisonLabel: "Human comparison needed", discrepancyNotes: [{ note: "Please provide factual clarification for the visible source total.", createdAt: new Date("2026-08-26") }], createdAt: new Date("2026-08-26") }] }] };
  consultantTimeReconciliationTestState.isLoading = false;
  consultantTimeReconciliationTestState.error = null;
  consultantTimeReconciliationTestState.refetch.mockReset();
  consultantTimeReconciliationTestState.lastInput = undefined;
  consultantTimeSubmissionTestState.periodTotalLoading = false;
  consultantTimeSubmissionTestState.periodTotalError = null;
  consultantTimeSubmissionTestState.periodTotalRefetch.mockReset();
  consultantActionInboxTestState.items = [{ dedupKey: "onboarding-task:41:pending", source: "onboarding_task", title: "Review your workforce profile", status: "action_needed", designatedHumanOwner: "Workforce Operations", destination: "/workspace/onboarding", updatedAt: new Date("2026-08-26"), agingLabel: "Updated this week", state: "unread", dismissedAt: null, restoredAt: null, stateUpdatedAt: null }];
  consultantActionInboxTestState.isLoading = false;
  consultantActionInboxTestState.error = null;
  consultantActionInboxTestState.markRead.mockReset();
  consultantActionInboxTestState.dismiss.mockReset();
  consultantActionInboxTestState.restore.mockReset();
  consultantActionInboxTestState.mutationError = null;
  consultantActionInboxTestState.refetch.mockReset();
  consultantActionInboxTestState.lastInput = undefined;
  financeTimesheetEvidenceTestState.data = [];
  financeTimesheetEvidenceTestState.isLoading = false;
  financeTimesheetEvidenceTestState.error = null;
  financeTimesheetEvidenceTestState.refetch.mockReset();
  financeTimesheetEvidenceTestState.reviewers = [{ id: 1, name: "Finley Finance", email: "finance@vertonsolutions.test" }];
  financeTimesheetEvidenceTestState.reviewersLoading = false;
  financeTimesheetEvidenceTestState.reviewersError = null;
  financeTimesheetEvidenceTestState.assignReviewer.mockReset();
  financeTimesheetEvidenceTestState.addNote.mockReset();
  financeTimesheetEvidenceTestState.mutationError = null;
  window.history.pushState({}, "", "/");
});

describe("Workforce Hub role access", () => {
  it("builds structured CSV and PDF export content from extracted candidate details", () => {
    const profile = { candidateName: "Alex Morgan", email: "alex@example.com", phone: "555-0100", location: "Austin, TX", yearsExperience: "6 years", skills: ["TypeScript", "React"], education: ["B.S. Computer Science"], professionalSummary: "Full-stack engineer", recruiterNotes: ["Confirm availability"], rawResumeText: "private source resume", fileKey: "private/object-key", workAuthorizationStatus: "restricted", commercialRate: 200 } as any;
    const csv = buildCandidateResumeCsv(profile);
    const pdf = buildCandidateResumePdfText(profile);
    expect(csv).toContain('"Candidate name","Alex Morgan"');
    expect(csv).toContain('"Skills","TypeScript; React"');
    expect(pdf).toContain("Candidate: Alex Morgan");
    expect(pdf).toContain("Human review notes: Confirm availability");
    expect(`${csv}\n${pdf}`).not.toContain("private source resume");
    expect(`${csv}\n${pdf}`).not.toContain("private/object-key");
    expect(`${csv}\n${pdf}`).not.toContain("restricted");
    expect(`${csv}\n${pdf}`).not.toContain("200");
  });

  it("creates deterministic sanitized candidate-based export filenames", () => {
    expect(buildCandidateExportFilename("Alex Morgan / ../../Finance", "csv")).toBe("alex-morgan-finance-resume-parse.csv");
    expect(buildCandidateExportFilename("", "pdf")).toBe("candidate-resume-parse.pdf");
  });
  it("maps stored account roles to their intended workspace role", () => {
    expect(getRoleKeyFromStoredRole("admin")).toBe("Administrator");
    expect(getRoleKeyFromStoredRole("hr_compliance")).toBe("HR & Compliance");
    expect(getRoleKeyFromStoredRole("user")).toBe("Consultant");
  });

  it("limits consultant navigation to employee-relevant workspaces", () => {
    const items = getAllowedNavigation("Consultant").map(item => item.label);
    expect(items).toEqual(["Overview", "My work", "My activity", "My engagement", "Engagement continuity", "Check-ins", "Time submission", "Time reconciliation", "Action inbox", "Onboarding", "Delivery", "Time & billing", "My profile"]);
    expect(items).not.toContain("Readiness");
    expect(items).not.toContain("Controls");
  });

  it("renders the Consultant-only read-only time reconciliation with bounded filters, human comparison language, and safe own-record fields", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("consultant", "Jamie Chen");
    renderRoute("/workspace/time-reconciliation");

    expect(screen.getByRole("heading", { name: "Time reconciliation" })).toBeTruthy();
    expect(screen.getByText("Own records only")).toBeTruthy();
    expect(screen.getByText("Entered hours")).toBeTruthy();
    expect(screen.getAllByText("Human comparison needed")[0]).toBeTruthy();
    expect(screen.getAllByText("Difference: 2 h")[0]).toBeTruthy();
    expect(screen.getAllByText("Please provide factual clarification for the visible source total.")[0]).toBeTruthy();
    expect(screen.queryByText(/payroll|billable amount|invoice|margin|utilization/i)).toBeNull();
    expect(screen.queryByText(/Casey Rivera|private storage|fileKey|client name/i)).toBeNull();
    await user.selectOptions(screen.getByLabelText("Reconciliation status filter"), "submitted");
    await waitFor(() => expect(consultantTimeReconciliationTestState.lastInput).toMatchObject({ status: "submitted" }));
    const revise = screen.getAllByRole("button", { name: "Revise in Time submission" })[0];
    revise.focus();
    expect(document.activeElement).toBe(revise);
    await user.keyboard("{Enter}");
    await waitFor(() => expect(window.location.pathname).toBe("/workspace/time-submission"));
  });

  it("keeps Consultant reconciliation loading, unavailable, no-time, no-evidence, and no-OCR states distinct", () => {
    setAuthenticatedRole("consultant", "Jamie Chen");
    consultantTimeReconciliationTestState.isLoading = true;
    let view = renderRoute("/workspace/time-reconciliation");
    expect(screen.getByText("Loading your protected time reconciliation…")).toBeTruthy();
    view.unmount();

    consultantTimeReconciliationTestState.isLoading = false;
    consultantTimeReconciliationTestState.error = new Error("Unavailable");
    view = renderRoute("/workspace/time-reconciliation");
    expect(screen.getByText("Your protected reconciliation is unavailable.")).toBeTruthy();
    view.unmount();

    consultantTimeReconciliationTestState.error = null;
    consultantTimeReconciliationTestState.data = { startDate: new Date("2026-08-01"), endDate: new Date("2026-08-31"), status: null, entryCount: 0, enteredHoursTotal: 0, evidenceCount: 0, ocrResultCount: 0, rows: [] };
    view = renderRoute("/workspace/time-reconciliation");
    expect(screen.getByText("No time entries in this period")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open Time submission" })).toBeTruthy();
    view.unmount();

    consultantTimeReconciliationTestState.data = { startDate: new Date("2026-08-01"), endDate: new Date("2026-08-31"), status: null, entryCount: 1, enteredHoursTotal: 40, evidenceCount: 0, ocrResultCount: 0, rows: [{ timeEntryId: 71, weekEnding: new Date("2026-08-23"), status: "draft", enteredHours: 40, evidence: [] }] };
    view = renderRoute("/workspace/time-reconciliation");
    expect(screen.getByText(/No evidence in this period/i)).toBeTruthy();
    view.unmount();

    consultantTimeReconciliationTestState.data = { startDate: new Date("2026-08-01"), endDate: new Date("2026-08-31"), status: null, entryCount: 1, enteredHoursTotal: 40, evidenceCount: 1, ocrResultCount: 0, rows: [{ timeEntryId: 71, weekEnding: new Date("2026-08-23"), status: "draft", enteredHours: 40, evidence: [{ evidenceId: 91, originalFileName: "pending-week.pdf", mimeType: "application/pdf", extractionStatus: "needs_human_review", extractedHours: null, extractionConfidence: "low", reviewerAssigned: false, differenceHours: null, comparisonLabel: "No OCR result", discrepancyNotes: [], createdAt: new Date("2026-08-26") }] }] };
    view = renderRoute("/workspace/time-reconciliation");
    expect(screen.getByText(/No OCR result in this period/i)).toBeTruthy();
    expect(within(view.container).getAllByText("pending-week.pdf")[0]).toBeTruthy();
  });

  it("renders the consultant-only My Work dashboard from safe own-record signals", () => {
    setAuthenticatedRole("consultant", "Jamie Chen");
    renderRoute("/workspace/my-work");

    expect(screen.getByRole("heading", { name: "My work" })).toBeTruthy();
    expect(screen.getByText("Own-record view")).toBeTruthy();
    expect(screen.getByText("Northstar Commerce Cloud · Demo")).toBeTruthy();
    expect(screen.getByText(/submitted · 40 hours/i)).toBeTruthy();
    expect(screen.getByText(/does not expose colleague records, client documents, restricted readiness content/i)).toBeTruthy();
    expect(screen.getByText(/Manager: Casey Rivera/)).toBeTruthy();
    expect(screen.queryByText("Candidate Finder")).toBeNull();
  });

  it("renders the consultant-only Personal Activity Timeline with safe sources, cursor pagination, and permitted destinations", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("consultant", "Jamie Chen");
    const view = renderRoute("/workspace/my-activity");

    expect(screen.getByRole("heading", { name: "My activity" })).toBeTruthy();
    expect(screen.getByText("You submitted a time entry for designated human review.")).toBeTruthy();
    expect(screen.getByText("You recorded a factual check-in.")).toBeTruthy();
    expect(screen.getByText(/excludes colleague activity, task content, reviewer identity, document content, storage keys/i)).toBeTruthy();
    expect(screen.queryByText(/Northstar|private\/|work authorization|payroll amount/i)).toBeNull();
    const openTimeSubmission = screen.getByRole("button", { name: "Open time submission" });
    openTimeSubmission.focus();
    expect(document.activeElement).toBe(openTimeSubmission);
    await user.click(openTimeSubmission);
    await waitFor(() => expect(window.location.pathname).toBe("/workspace/time-submission"));

    view.unmount();
    renderRoute("/workspace/my-activity");
    await user.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() => expect(consultantActivityTimelineTestState.lastInput).toEqual({ cursor: "next-cursor", limit: 12 }));
    expect(screen.getByText("You submitted a profile update request for human review.")).toBeTruthy();
    expect(screen.getByText("End of your protected activity history.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "First page" }));
    await waitFor(() => expect(consultantActivityTimelineTestState.lastInput).toEqual({ limit: 12 }));
  });

  it("keeps Personal Activity Timeline loading, unavailable, successful-empty, and later-page empty states distinct", () => {
    setAuthenticatedRole("consultant", "Jamie Chen");
    consultantActivityTimelineTestState.isLoading = true;
    const view = renderRoute("/workspace/my-activity");
    expect(screen.getByText("Loading your protected activity history…")).toBeTruthy();

    consultantActivityTimelineTestState.isLoading = false;
    consultantActivityTimelineTestState.error = new Error("Unavailable");
    view.rerender(<Home />);
    expect(screen.getByText("Your protected activity history is unavailable.")).toBeTruthy();

    consultantActivityTimelineTestState.error = null;
    consultantActivityTimelineTestState.firstPage = { items: [], nextCursor: null };
    view.rerender(<Home />);
    expect(screen.getByText("No protected activity yet.")).toBeTruthy();
    expect(screen.getByText(/does not display a representative history, colleague activity, or any decision outcome/i)).toBeTruthy();
  });

  it("renders the consultant-only Action Inbox from safe own-record reminders and supports accessible state changes", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("consultant", "Jamie Chen");
    renderRoute("/workspace/action-inbox");

    expect(screen.getByRole("heading", { name: "Action Inbox" })).toBeTruthy();
    expect(screen.getByText("Review your workforce profile")).toBeTruthy();
    expect(screen.getByText(/Source: Onboarding task/)).toBeTruthy();
    expect(screen.getByText(/Human owner: Workforce Operations/)).toBeTruthy();
    expect(screen.getByText(/does not send external messages or make decisions/)).toBeTruthy();
    expect(screen.getByText(/excludes readiness details, compensation, client-confidential data, colleague data/i)).toBeTruthy();
    const markRead = screen.getByRole("button", { name: "Mark read" });
    markRead.focus();
    expect(document.activeElement).toBe(markRead);
    await user.keyboard("{Enter}");
    await waitFor(() => expect(consultantActionInboxTestState.markRead).toHaveBeenCalledWith({ dedupKey: "onboarding-task:41:pending" }));
    expect(consultantActionInboxTestState.refetch).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(consultantActionInboxTestState.dismiss).toHaveBeenCalledWith({ dedupKey: "onboarding-task:41:pending" });
  });

  it("provides keyboard-accessible dismissed-item recovery with source aging, visible state timestamps, and permitted destinations only", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("consultant", "Jamie Chen");
    consultantActionInboxTestState.items = [
      { dedupKey: "onboarding-task:41:pending", source: "onboarding_task", title: "Review your workforce profile", status: "action_needed", designatedHumanOwner: "Workforce Operations", destination: "/workspace/onboarding", updatedAt: new Date("2026-08-26"), agingLabel: "Older than seven days", state: "read", dismissedAt: new Date("2026-08-22"), restoredAt: new Date("2026-09-01T08:00:00.000Z"), stateUpdatedAt: new Date("2026-09-01T08:00:00.000Z") },
      { dedupKey: "time-entry:72:draft", source: "time_entry", title: "Draft time entry is ready for your review", status: "action_needed", designatedHumanOwner: "Designated time reviewer", destination: "/workspace/time-submission", updatedAt: new Date("2026-08-20"), agingLabel: "Older than seven days", state: "dismissed", dismissedAt: new Date("2026-08-30T10:00:00.000Z"), restoredAt: null, stateUpdatedAt: new Date("2026-08-30T10:00:00.000Z") },
    ];
    renderRoute("/workspace/action-inbox");

    expect(screen.getByText("Restored", { exact: false })).toBeTruthy();
    expect(screen.getByText(/Older than seven days/)).toBeTruthy();
    const activeTab = screen.getByRole("tab", { name: "Active" });
    activeTab.focus();
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(consultantActionInboxTestState.lastInput).toEqual({ includeDismissed: true }));
    expect(screen.getByRole("tab", { name: "Dismissed" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("Your dismissed reminders")).toBeTruthy();
    expect(screen.getAllByText("Dismissed", { exact: false })[0]).toBeTruthy();
    const restore = screen.getByRole("button", { name: "Restore" });
    restore.focus();
    expect(document.activeElement).toBe(restore);
    await user.keyboard("{Enter}");
    await waitFor(() => expect(consultantActionInboxTestState.restore).toHaveBeenCalledWith({ dedupKey: "time-entry:72:draft" }));
    expect(screen.getByText(/Action restored to your active inbox/i)).toBeTruthy();
    expect(screen.queryByText(/send email|send sms|push notification|Slack|schedule reminder/i)).toBeNull();
    await user.click(screen.getByRole("button", { name: /Open destination/ }));
    await waitFor(() => expect(window.location.pathname).toBe("/workspace/time-submission"));
  });

  it("keeps Action Inbox loading, unavailable, successful-empty, and permitted-destination behavior distinct", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("consultant", "Jamie Chen");
    consultantActionInboxTestState.isLoading = true;
    const view = renderRoute("/workspace/action-inbox");
    expect(screen.getByText("Loading your protected Action Inbox…")).toBeTruthy();

    consultantActionInboxTestState.isLoading = false;
    consultantActionInboxTestState.error = new Error("Unavailable");
    view.rerender(<Home />);
    expect(screen.getByText("Your Action Inbox is unavailable.")).toBeTruthy();

    consultantActionInboxTestState.error = null;
    consultantActionInboxTestState.items = [];
    view.rerender(<Home />);
    expect(screen.getByText("Your Action Inbox is clear.")).toBeTruthy();

    consultantActionInboxTestState.items = [{ dedupKey: "time-entry:72:draft", source: "time_entry", title: "Draft time entry is ready for your review", status: "action_needed", designatedHumanOwner: "Designated time reviewer", destination: "/workspace/time-submission", updatedAt: new Date("2026-08-26"), state: "read" }];
    view.rerender(<Home />);
    await user.click(screen.getByRole("button", { name: /Open destination/ }));
    await waitFor(() => expect(window.location.pathname).toBe("/workspace/time-submission"));
    expect(consultantActionInboxTestState.markRead).not.toHaveBeenCalled();
  });

  it("keeps the dismissed Action Inbox empty state distinct from active reminders", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("consultant", "Jamie Chen");
    consultantActionInboxTestState.items = [{ dedupKey: "onboarding-task:41:pending", source: "onboarding_task", title: "Review your workforce profile", status: "action_needed", designatedHumanOwner: "Workforce Operations", destination: "/workspace/onboarding", updatedAt: new Date("2026-08-26"), agingLabel: "Updated this week", state: "read", dismissedAt: null, restoredAt: null, stateUpdatedAt: null }];
    renderRoute("/workspace/action-inbox");
    await user.click(screen.getByRole("tab", { name: "Dismissed" }));
    expect(screen.getByText("No dismissed reminders are available.")).toBeTruthy();
  });

  it("keeps My Work loading, unavailable, empty, and no-assignment states distinct", () => {
    setAuthenticatedRole("consultant", "Jamie Chen");
    consultantMyWorkTestState.isLoading = true;
    const view = renderRoute("/workspace/my-work");
    expect(screen.getByText("Loading your protected work summary…")).toBeTruthy();

    consultantMyWorkTestState.isLoading = false;
    consultantMyWorkTestState.error = new Error("Unavailable");
    view.rerender(<Home />);
    expect(screen.getByText("Your protected work summary is unavailable.")).toBeTruthy();

    consultantMyWorkTestState.error = null;
    consultantMyWorkTestState.data = { profile: null, onboarding: null, assignment: null, latestTimesheet: null };
    view.rerender(<Home />);
    expect(screen.getByText("No protected work records are available yet.")).toBeTruthy();

    consultantMyWorkTestState.data = { profile: { profileUpdateState: "details_requested", updatedAt: new Date() }, onboarding: null, assignment: null, latestTimesheet: null };
    view.rerender(<Home />);
    expect(screen.getByText("No current assignment.")).toBeTruthy();
  });

  it("renders Consultant Check-ins as a bounded own-record factual update workflow", async () => {
    setAuthenticatedRole("consultant", "Jamie Chen");
    const user = userEvent.setup();
    renderRoute("/workspace/check-ins");

    expect(screen.getByRole("heading", { name: "Consultant check-ins" })).toBeTruthy();
    expect(screen.getByText("Casey Rivera")).toBeTruthy();
    expect(screen.getByText(/Completed the documented project walkthrough/)).toBeTruthy();
    const submit = screen.getByRole("button", { name: "Record factual check-in" });
    expect(submit.getAttribute("disabled")).not.toBeNull();
    await user.selectOptions(screen.getByLabelText("Check-in category"), "support_note");
    await user.type(screen.getByLabelText("Factual check-in note"), "Requested clarification on the documented delivery meeting time.");
    await user.click(screen.getByRole("button", { name: "Record factual check-in" }));

    await waitFor(() => expect(consultantCheckInTestState.mutate).toHaveBeenCalledWith({ category: "support_note", factualNote: "Requested clarification on the documented delivery meeting time." }));
    expect(screen.getByText(/recorded for the designated human owner/i)).toBeTruthy();
    expect(screen.getByText(/does not automatically route, notify, or decide anything/i)).toBeTruthy();
  });

  it("keeps Consultant Check-ins loading, unavailable, and successful-empty states distinct", () => {
    setAuthenticatedRole("consultant", "Jamie Chen");
    consultantCheckInTestState.isLoading = true;
    const view = renderRoute("/workspace/check-ins");
    expect(screen.getByText("Loading your factual check-ins…")).toBeTruthy();

    consultantCheckInTestState.isLoading = false;
    consultantCheckInTestState.error = new Error("Unavailable");
    view.rerender(<Home />);
    expect(screen.getByText("Your factual check-ins are unavailable.")).toBeTruthy();

    consultantCheckInTestState.error = null;
    consultantCheckInTestState.data = { designatedHumanOwner: "Casey Rivera", checkIns: [] };
    view.rerender(<Home />);
    expect(screen.getByText("No factual check-ins yet.")).toBeTruthy();
    expect(screen.getByText(/successful empty state has no representative substitute/i)).toBeTruthy();
  });

  it("limits finance visibility to the commercial access role", () => {
    expect(isFinanceRole("Finance")).toBe(true);
    expect(isFinanceRole("Project Manager")).toBe(false);
  });

  it("falls back to the overview when an account role requests an unauthorized workspace", () => {
    expect(resolveWorkspacePage("Consultant", "Readiness")).toBe("Overview");
    expect(resolveWorkspacePage("HR & Compliance", "Readiness")).toBe("Readiness");
    expect(resolveWorkspacePath("Consultant", "/workspace/admin")).toBe("/workspace");
    expect(resolveWorkspacePath("Administrator", "/workspace/admin")).toBe("/workspace/admin");
    expect(resolveWorkspacePath("Consultant", "/workspace/action-inbox")).toBe("/workspace/action-inbox");
    expect(resolveWorkspacePath("Administrator", "/workspace/action-inbox")).toBe("/workspace");
    expect(resolveWorkspacePath("Consultant", "/workspace/my-activity")).toBe("/workspace/my-activity");
    expect(resolveWorkspacePath("Administrator", "/workspace/my-activity")).toBe("/workspace");
  });

  it("labels recruiter handoffs from approved onboarding and assignment workflow values without making a staffing decision", () => {
    expect(getRecruiterHandoffIndicator({ onboardingStage: "manager_confirmation", managerConfirmed: false, assignmentState: "pending" })).toBe("Manager confirmation needed");
    expect(getRecruiterHandoffIndicator({ onboardingStage: "ready_for_assignment", managerConfirmed: true, assignmentState: "unassigned" })).toBe("Assignment handoff needed");
    expect(getRecruiterHandoffIndicator({ onboardingStage: "assigned", managerConfirmed: true, assignmentState: "active" })).toBe("No handoff flagged");
  });

  it("uses only the approved candidate review-state labels", () => {
    expect(formatCandidateReviewState("pending_human_review")).toBe("Human review pending");
    expect(formatCandidateReviewState("reviewed")).toBe("Human reviewed");
    expect(formatCandidateReviewState("archived")).toBe("Archived");
  });
});

describe("Workforce Hub login and protected workflow behavior", () => {
  it("presents the secure login experience and starts the approved identity flow", async () => {
    const user = userEvent.setup();
    setUnauthenticated();
    renderRoute("/login");

    expect(screen.getByText("Sign in to Workforce Hub.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Use approved identity/ }));
    expect(startLoginSpy).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: /Open AI assistant/ })).toBeNull();
  });

  it("positions the authenticated Workspace Assistant responsively at the bottom-right", () => {
    setAuthenticatedRole("consultant", "Riley Consultant");
    renderRoute("/workspace");

    const trigger = screen.getByRole("button", { name: /Open AI assistant/ });
    expect(trigger.parentElement?.className).toContain("fixed bottom-4 right-4");
    expect(trigger.parentElement?.className).toContain("sm:bottom-6");
    expect(trigger.parentElement?.className).toContain("sm:right-6");
  });

  it("protects the workspace when no authenticated account is present", () => {
    setUnauthenticated();
    renderRoute("/workspace");

    expect(screen.getByText("Sign in to Workforce Hub.")).toBeTruthy();
    expect(screen.queryByText("Good morning, Verton.")).toBeNull();
  });

  it("returns an unauthenticated workspace deep link to the secure login route", async () => {
    setUnauthenticated();
    renderRoute("/workspace/admin");

    expect(screen.getByText("Sign in to Workforce Hub.")).toBeTruthy();
    await waitFor(() => expect(window.location.pathname).toBe("/login"));
    expect(screen.queryByText("Administrator workspace")).toBeNull();
  });

  it("returns an authenticated user from an unauthorized workspace deep link to their allowed overview", async () => {
    setAuthenticatedRole("consultant", "Jamie Consultant");
    renderRoute("/workspace/admin");

    await waitFor(() => expect(window.location.pathname).toBe("/workspace"));
    expect(screen.getByText("Good morning, Verton.")).toBeTruthy();
    expect(screen.queryByText("Administrator workspace")).toBeNull();
  });

  it("renders only consultant-authorized navigation for a consultant account", () => {
    setAuthenticatedRole("consultant", "Riley Consultant");
    renderRoute("/workspace");

    expect(screen.getAllByText("Onboarding").length).toBeGreaterThan(0);
    expect(screen.queryByText("Readiness")).toBeNull();
    expect(screen.queryByText("Controls")).toBeNull();
  });

  it("keeps the responsive representative preview distinct from the protected candidate-detail route and authorized profile-addition journey", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("admin", "Avery Admin");
    renderRoute("/workspace");

    await user.click(screen.getByRole("button", { name: "Talent pipeline" }));
    await user.click(screen.getAllByText("Priya Shah")[0]);
    await user.click(screen.getByRole("button", { name: /Open profile/ }));

    const profile = screen.getByRole("dialog", { name: "Priya Shah talent profile preview" });
    expect(within(profile).getByText("Representative talent profile preview")).toBeTruthy();
    expect(within(profile).getByText("Python · Snowflake · dbt")).toBeTruthy();
    expect(within(profile).queryByText("private resume object key")).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(within(profile).getByRole("button", { name: "Close talent profile" })));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Priya Shah talent profile preview" })).toBeNull();

    await user.click(screen.getAllByRole("button", { name: /Open candidate profile/ })[0]);
    await waitFor(() => expect(window.location.pathname).toBe("/workspace/talent/31"));
    expect(screen.getByText("Recruiter-visible candidate profile for human review.")).toBeTruthy();
    expect(screen.getByText("Test automation engineer.")).toBeTruthy();
    expect(screen.queryByText("resumeObjectKey")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
    await waitFor(() => expect(window.location.pathname).toBe("/workspace"));

    await user.click(screen.getByRole("button", { name: "Talent pipeline" }));
    await user.click(screen.getByRole("button", { name: /Add talent profile/ }));
    expect(screen.getAllByText("New-hire progress").length).toBeGreaterThan(0);
  });

  it("shows distinct Talent Pipeline loading and successful-empty states without representative candidate substitution", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("recruiter", "Riley Recruiter");
    resumeTestState.candidatesLoading = true;
    renderRoute("/workspace");
    await user.click(screen.getByRole("button", { name: "Talent pipeline" }));
    expect(screen.getByText("Loading protected candidate profiles…")).toBeTruthy();

    cleanup();
    resumeTestState.candidatesLoading = false;
    resumeTestState.candidates = [];
    renderRoute("/workspace");
    await user.click(screen.getByRole("button", { name: "Talent pipeline" }));
    expect(screen.getByText("No protected candidate profiles yet.")).toBeTruthy();
    expect(screen.queryByText("Lena Garcia")).toBeTruthy();
  });

  it("lets an administrator review and confirm one approved role change before saving", async () => {
    const user = userEvent.setup();
    adminTestState.users = [{ id: 42, name: "Jordan Lee", email: "jordan@vertonsolutions.com", role: "consultant", lastSignedIn: new Date("2026-08-26") }];
    setAuthenticatedRole("admin", "Avery Admin");
    renderRoute("/workspace/admin");

    await user.type(screen.getByLabelText("Search user directory"), "Jordan");
    await user.selectOptions(screen.getByLabelText("Proposed role for Jordan Lee"), "consultant");
    expect(adminTestState.roleChangeMutate).not.toHaveBeenCalled();
    await user.selectOptions(screen.getByLabelText("Proposed role for Jordan Lee"), "account_manager");
    expect(adminTestState.roleChangeMutate).not.toHaveBeenCalled();
    const confirmation = screen.getByRole("region", { name: "Confirm role change" });
    expect(confirmation).toBeTruthy();
    expect(within(confirmation).getByText("Jordan Lee")).toBeTruthy();
    expect(within(confirmation).getByText("Consultant")).toBeTruthy();
    expect(within(confirmation).getByText("Account Manager")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Confirm role change" }));

    expect(adminTestState.roleChangeMutate).toHaveBeenCalledWith({ userId: 42, role: "account_manager" });
    expect(screen.getByText("Jordan Lee now has the Account Manager role.")).toBeTruthy();
    expect(screen.getByText("Role-change history")).toBeTruthy();
  });

  it("keeps Administrator demo sessions read-only in the role-change interface", () => {
    adminTestState.users = [{ id: 42, name: "Jordan Lee", email: "jordan@vertonsolutions.com", role: "consultant", lastSignedIn: new Date("2026-08-26") }];
    setAuthenticatedRole("admin", "Avery Admin");
    authState.user.isDemo = true;
    renderRoute("/workspace/admin");

    expect(screen.getByText("Demo administration · read only")).toBeTruthy();
    expect(screen.getByText(/Server denial remains authoritative/)).toBeTruthy();
    expect((screen.getByLabelText("Proposed role for Jordan Lee") as HTMLSelectElement).disabled).toBe(true);
  });

  it("renders protected database-backed demo summary records in the authenticated overview", () => {
    setAuthenticatedRole("consultant", "Jamie Consultant");
    renderRoute("/workspace");

    expect(screen.getByText(/MySQL-compatible TiDB via Drizzle ORM/)).toBeTruthy();
    expect(screen.getByText(/selected interface demonstrations remain representative/i)).toBeTruthy();
    expect(screen.getByText("Demo assignment extension review")).toBeTruthy();
    expect(screen.getByText("Database-backed operational activity.")).toBeTruthy();
    expect(screen.getAllByText(/Internal demonstration data/).length).toBeGreaterThan(0);
  });

  it("shows an honest empty authorized-readiness state and labels static panels as representative", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("admin", "Avery Admin");
    renderRoute("/workspace");

    await user.click(screen.getAllByRole("button", { name: "Readiness" })[0]!);
    expect(screen.getByText("No authorized readiness records are available.")).toBeTruthy();
    expect(screen.getByText(/Representative reference panels below/)).toBeTruthy();
  });

  it("renders New-hire Progress from only protected onboarding and assignment signals", () => {
    newHireTestState.records = [{ id: 8, name: "Jordan Lee", email: "jordan@vertonsolutions.com", role: "consultant", onboardingStage: "manager_confirmation", progressPercent: 80, managerConfirmed: false, projectName: "Client Project", assignmentState: "pending", updatedAt: new Date("2026-08-27") }];
    setAuthenticatedRole("admin", "Avery Admin");
    renderRoute("/workspace/recruiting");

    expect(screen.getByText("Administrator & recruiter workspace")).toBeTruthy();
    expect(screen.getByText("Jordan Lee")).toBeTruthy();
    expect(screen.getByText(/jordan@vertonsolutions.com.*Consultant/)).toBeTruthy();
    expect(screen.getByText("Client Project")).toBeTruthy();
    expect(screen.queryByText("Readiness status")).toBeNull();
    expect(screen.queryByText("Candidate materials")).toBeNull();
  });

  it("renders loading, unavailable, and empty states for protected New-hire Progress without demo fallback", () => {
    newHireTestState.isLoading = true;
    setAuthenticatedRole("recruiter", "Riley Recruiter");
    renderRoute("/workspace/recruiting");
    expect(screen.getByText("Loading protected new-hire progress records…")).toBeTruthy();

    cleanup();
    newHireTestState.isLoading = false;
    newHireTestState.error = new Error("Unavailable");
    renderRoute("/workspace/recruiting");
    expect(screen.getByText("Protected new-hire progress records are unavailable.")).toBeTruthy();
    expect(screen.getByText(/No local demonstration rows replace an unavailable response/)).toBeTruthy();

    cleanup();
    newHireTestState.error = null;
    renderRoute("/workspace/recruiting");
    expect(screen.getByText("No protected new-hire progress records are available.")).toBeTruthy();
  });

  it("labels adjacent resume parsing and Candidate Finder as separate protected recruiting capabilities", () => {
    setAuthenticatedRole("recruiter", "Riley Recruiter");
    renderRoute("/workspace/recruiting");

    expect(screen.getByText(/Separate protected recruiting capabilities below/)).toBeTruthy();
    expect(screen.getByText(/cannot create onboarding assignments or convert a candidate into a new hire/)).toBeTruthy();
  });

  it("renders My Profile loading, error, first-use, mutation-error, and success states without a target user", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("admin", "Avery Admin");
    profileTestState.isLoading = true;
    renderRoute("/workspace/profile");
    expect(screen.getByText("Loading your protected profile record…")).toBeTruthy();

    cleanup();
    profileTestState.isLoading = false;
    profileTestState.error = new Error("Unavailable");
    renderRoute("/workspace/profile");
    expect(screen.getByText("Your protected profile record is unavailable.")).toBeTruthy();

    cleanup();
    profileTestState.error = null;
    renderRoute("/workspace/profile");
    expect(screen.getByText("No profile record yet.")).toBeTruthy();
    await user.selectOptions(screen.getByLabelText("Work authorization category"), "H-1B");
    await user.type(screen.getByLabelText("Status note"), "Please review my administrative profile update.");
    expect((screen.getByLabelText("Work authorization category") as HTMLSelectElement).value).toBe("H-1B");
    expect((screen.getByLabelText("Status note") as HTMLTextAreaElement).value).toBe("Please review my administrative profile update.");
    expect((screen.getByRole("button", { name: /Submit update for human review/ }) as HTMLButtonElement).disabled).toBe(false);
    profileTestState.mutationError = true;
    await user.click(screen.getByRole("button", { name: /Submit update for human review/ }));
    expect(profileTestState.mutation).toHaveBeenCalledWith({ employmentType: "H-1B", statusNote: "Please review my administrative profile update." });
    expect(screen.getByText(/profile update could not be submitted/)).toBeTruthy();

    profileTestState.mutationError = false;
    await user.click(screen.getByRole("button", { name: /Submit update for human review/ }));
    expect(screen.getByText(/Update submitted. An authorized reviewer/)).toBeTruthy();
  });

  it("renders only chronological own My Profile Request History snapshots with first-use, error, and refresh states", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("consultant", "Jamie Chen");
    profileTestState.record = { employmentType: "H-1B", workAuthorizationStatus: "details_requested", statusNote: "Awaiting human review.", updatedAt: new Date("2026-08-26") };
    profileTestState.history = [
      { requestId: 42, employmentType: "H-1B", statusNote: "Please review my updated administrative profile details.", requestState: "details_requested", submittedAt: new Date("2026-08-28T12:00:00.000Z") },
      { requestId: 41, employmentType: "F-1 OPT", statusNote: "Please review my earlier submitted update.", requestState: "details_requested", submittedAt: new Date("2026-08-27T12:00:00.000Z") },
    ];
    renderRoute("/workspace/profile");

    const history = screen.getByRole("region", { name: "My Profile Request History" });
    expect(history).toBeTruthy();
    expect(screen.getByText("Request #42")).toBeTruthy();
    expect(screen.getByText("Request #41")).toBeTruthy();
    const requestRows = within(screen.getByRole("list", { name: "Profile requests in chronological reading order" })).getAllByRole("listitem");
    expect(requestRows[0]?.textContent).toContain("Request #42");
    expect(requestRows[1]?.textContent).toContain("Request #41");
    expect(screen.getByText(/records personal requests for human review, not an authorization/i)).toBeTruthy();
    expect(history.textContent).not.toContain("Reviewer name:");
    expect(history.textContent).not.toContain("Reviewer commentary:");
    expect(history.textContent).not.toContain("Private document key:");
    expect(screen.queryByRole("button", { name: /reviewer|document|delete|edit/i })).toBeNull();

    await user.selectOptions(screen.getByLabelText("Work authorization category"), "H-1B");
    await user.type(screen.getByLabelText("Status note"), "Please record this additional profile update for review.");
    await user.click(screen.getByRole("button", { name: /Submit update for human review/ }));
    expect(profileTestState.historyRefetch).toHaveBeenCalled();

    cleanup();
    profileTestState.history = [];
    renderRoute("/workspace/profile");
    expect(screen.getByText("No profile requests have been submitted yet.")).toBeTruthy();

    cleanup();
    profileTestState.historyError = new Error("Unavailable");
    renderRoute("/workspace/profile");
    expect(screen.getByText("Your profile request history is unavailable.")).toBeTruthy();
    const retry = screen.getByRole("button", { name: "Retry history" });
    retry.focus();
    expect(document.activeElement).toBe(retry);
  });

  it("renders loading and unavailable states without substituting representative data for live Readiness records", async () => {
    const user = userEvent.setup();
    readinessTestState.isLoading = true;
    setAuthenticatedRole("admin", "Avery Admin");
    renderRoute("/workspace");

    await user.click(screen.getAllByRole("button", { name: "Readiness" })[0]!);
    expect(screen.getByText("Loading authorized readiness workflow records…")).toBeTruthy();

    cleanup();
    readinessTestState.isLoading = false;
    readinessTestState.error = new Error("Unavailable");
    renderRoute("/workspace");
    await user.click(screen.getAllByRole("button", { name: "Readiness" })[0]!);
    expect(screen.getByText("Authorized readiness records are unavailable.")).toBeTruthy();
    expect(screen.getByText(/not a substitute for live records/)).toBeTruthy();
  });

  it("masks names in the live Readiness projection while retaining safe workflow fields", async () => {
    const user = userEvent.setup();
    readinessTestState.records = [{ userId: 18, name: "Taylor Nguyen", workAuthorizationStatus: "human_review", employmentType: "Employment category", statusNote: "Human review is required.", expiryDate: null, updatedAt: new Date("2026-08-27") }];
    setAuthenticatedRole("hr_compliance", "Harper Compliance");
    renderRoute("/workspace");

    await user.click(screen.getAllByRole("button", { name: "Readiness" })[0]!);
    expect(screen.getByText("T. Workforce user")).toBeTruthy();
    expect(screen.queryByText("Taylor Nguyen")).toBeNull();
    expect(screen.getAllByText("Human review").length).toBeGreaterThan(0);
  });

  it("renders seeded staffing demand, assignments, and timesheets in their protected operational views", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("consultant", "Jamie Consultant");
    renderRoute("/workspace");

    await user.click(screen.getAllByRole("button", { name: "Delivery" })[0]!);
    expect(screen.getByText("Database Lead Engineer")).toBeTruthy();
    expect(screen.getAllByText("Northstar Commerce Cloud · Demo").length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole("button", { name: "Time & billing" })[0]!);
    await waitFor(() => expect(screen.getByText("Time & billing readiness")).toBeTruthy());
    expect(screen.getAllByText("40").length).toBeGreaterThan(0);
    expect(screen.getByText("active · Northstar Commerce Cloud · Demo")).toBeTruthy();
    expect(screen.getByText("Internal demonstration time entry")).toBeTruthy();
    expect(screen.getByText(/No entry creation\/editing, approval, payroll, payment, invoice, expense, accounting, or scheduled processing action is available/i)).toBeTruthy();
    expect(screen.getAllByText("••••••").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /approve|invoice|payroll|payment/i })).toBeNull();
  });

  it("reveals commercial values for an authenticated finance account", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("finance", "Finley Finance");
    renderRoute("/workspace");

    await user.click(screen.getAllByRole("button", { name: "Time & billing" })[0]);
    expect(screen.getByText("$142/hr")).toBeTruthy();
    expect(screen.getByText("$92/hr")).toBeTruthy();
    expect(screen.getByText("35.2%")).toBeTruthy();
  });

  it("renders Finance-only private timesheet evidence review with safe metadata and distinct query states", async () => {
    const user = userEvent.setup();
    financeTimesheetEvidenceTestState.data = [{ evidenceId: 91, timeEntryId: 72, originalFileName: "approved-week.pdf", mimeType: "application/pdf", fileSize: 256, extractionStatus: "extracted", extractedHours: 40, extractionConfidence: "high", uploadedAt: new Date("2026-08-26"), updatedAt: new Date("2026-08-26"), weekEnding: new Date("2026-08-23"), enteredHours: 40, timeEntryStatus: "submitted" }];
    setAuthenticatedRole("finance", "Finley Finance");
    renderRoute("/workspace/time-submission");
    expect(screen.queryByText("Private timesheet evidence review")).toBeNull();
    cleanup();

    renderRoute("/workspace/time-billing");
    await user.click(screen.getAllByRole("button", { name: "Time & billing" })[0]);
    expect(screen.getByText("Private timesheet evidence review")).toBeTruthy();
    expect(screen.getByText("approved-week.pdf")).toBeTruthy();
    expect(screen.getByText(/OCR total: 40 hours/)).toBeTruthy();
    const source = screen.getByRole("link", { name: /Open private source/ });
    expect(source.getAttribute("href")).toBe("/api/finance/timesheet-evidence/91");
    expect(screen.queryByText(/fileKey|consultant-timesheets\//i)).toBeNull();
    expect(screen.getByText(/Reviewer assignment and notes do not approve time, alter entered hours, calculate payroll/i)).toBeTruthy();
    cleanup();

    financeTimesheetEvidenceTestState.isLoading = true;
    renderRoute("/workspace/time-billing");
    await user.click(screen.getAllByRole("button", { name: "Time & billing" })[0]);
    expect(screen.getByText("Loading private timesheet evidence review queue…")).toBeTruthy();
    cleanup();

    financeTimesheetEvidenceTestState.isLoading = false;
    financeTimesheetEvidenceTestState.error = new Error("Unavailable");
    renderRoute("/workspace/time-billing");
    await user.click(screen.getAllByRole("button", { name: "Time & billing" })[0]);
    expect(screen.getByText("Private timesheet evidence is unavailable.")).toBeTruthy();
    cleanup();

    financeTimesheetEvidenceTestState.error = null;
    financeTimesheetEvidenceTestState.data = [];
    renderRoute("/workspace/time-billing");
    await user.click(screen.getAllByRole("button", { name: "Time & billing" })[0]);
    expect(screen.getByText("No private timesheet evidence is awaiting review.")).toBeTruthy();
  });

  it("allows Finance to assign a designated reviewer and only that reviewer to record a factual discrepancy note", async () => {
    const user = userEvent.setup();
    financeTimesheetEvidenceTestState.data = [{ evidenceId: 91, timeEntryId: 72, originalFileName: "approved-week.pdf", mimeType: "application/pdf", fileSize: 256, extractionStatus: "extracted", extractedHours: 40, extractionConfidence: "high", uploadedAt: new Date("2026-08-26"), updatedAt: new Date("2026-08-26"), weekEnding: new Date("2026-08-23"), enteredHours: 40, timeEntryStatus: "submitted", reviewerUserId: null, reviewerName: null, reviewerAssignedAt: null, discrepancyNotes: [] }];
    setAuthenticatedRole("finance", "Finley Finance");
    renderRoute("/workspace/time-billing");
    await user.click(screen.getAllByRole("button", { name: "Time & billing" })[0]);
    await user.selectOptions(screen.getByLabelText("Designated reviewer for evidence 91"), "1");
    await user.click(screen.getByRole("button", { name: "Save designated reviewer" }));
    expect(financeTimesheetEvidenceTestState.assignReviewer).toHaveBeenCalledWith({ evidenceId: 91, reviewerUserId: 1 });
    cleanup();

    financeTimesheetEvidenceTestState.data = [{ ...financeTimesheetEvidenceTestState.data[0], reviewerUserId: 1, reviewerName: "Finley Finance", reviewerAssignedAt: new Date("2026-08-26") }];
    renderRoute("/workspace/time-billing");
    await user.click(screen.getAllByRole("button", { name: "Time & billing" })[0]);
    const note = screen.getByLabelText("Discrepancy note for evidence 91");
    await user.type(note, "Entered hours and the visible total require human follow-up.");
    await user.click(screen.getByRole("button", { name: "Record human note" }));
    expect(financeTimesheetEvidenceTestState.addNote).toHaveBeenCalledWith({ evidenceId: 91, note: "Entered hours and the visible total require human follow-up." });
    expect(screen.getByText(/It did not change the time entry or make a decision/i)).toBeTruthy();
  });

  it("shows Finance only safe Consultant factual acknowledgement and response fields for protected evidence review", async () => {
    const user = userEvent.setup();
    financeTimesheetEvidenceTestState.data = [{ evidenceId: 91, timeEntryId: 72, originalFileName: "approved-week.pdf", mimeType: "application/pdf", fileSize: 256, extractionStatus: "extracted", extractedHours: 40, extractionConfidence: "high", uploadedAt: new Date("2026-08-26"), updatedAt: new Date("2026-08-26"), weekEnding: new Date("2026-08-23"), enteredHours: 40, timeEntryStatus: "submitted", reviewerUserId: 1, reviewerName: "Finley Finance", reviewerAssignedAt: new Date("2026-08-26"), discrepancyNotes: [{ id: 118, note: "Entered and visible source totals require factual human follow-up.", createdAt: new Date("2026-08-26"), consultantAcknowledgedAt: new Date("2026-08-27"), consultantResponse: { body: "The documented source total remains forty hours.", createdAt: new Date("2026-08-27") } }] }];
    setAuthenticatedRole("finance", "Finley Finance");
    renderRoute("/workspace/time-billing");
    await user.click(screen.getAllByRole("button", { name: "Time & billing" })[0]);

    expect(screen.getByRole("region", { name: "Consultant factual discrepancy responses" })).toBeTruthy();
    expect(screen.getByText("The documented source total remains forty hours.")).toBeTruthy();
    expect(screen.getByText(/Consultant acknowledged this note/)).toBeTruthy();
    expect(screen.getByText(/Only the original designated reviewer may continue to add factual reviewer notes/i)).toBeTruthy();
    expect(screen.queryByText(/authorUserId|fileKey|consultant-timesheets\/|private storage/i)).toBeNull();
  });

  it("labels Controls material as representative and exposes no audit-export or approval action", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("admin", "Avery Admin");
    renderRoute("/workspace");

    await user.click(screen.getAllByRole("button", { name: "Controls" })[0]!);
    expect(screen.getByText("Representative access posture")).toBeTruthy();
    expect(screen.getByText("Representative event examples")).toBeTruthy();
    expect(screen.getByText("Audit export unavailable")).toBeTruthy();
    expect(screen.getByText(/not live telemetry, an event stream, or an immutable ledger/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /export audit|approve/i })).toBeNull();
  });

  it("renders and acknowledges protected consultant personal tasks without showing the representative checklist", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("consultant", "Riley Consultant");
    renderRoute("/workspace");

    await user.click(screen.getAllByRole("button", { name: "Onboarding" })[0]);
    expect(screen.getByText("Protected personal tasks")).toBeTruthy();
    expect(screen.getByText("Review your workforce profile")).toBeTruthy();
    expect(screen.getByText(/acknowledgement records that you have seen a task/i)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Acknowledge task" }));
    expect(consultantTaskTestState.mutate).toHaveBeenCalledWith({ taskId: 41 });
    expect(consultantTaskTestState.refetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Representative onboarding interface")).toBeNull();
    expect(screen.queryByRole("button", { name: "Send reminder" })).toBeNull();
  });

  it("separates loading, unavailable, and successful-empty states for consultant personal tasks", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("consultant", "Riley Consultant");
    consultantTaskTestState.isLoading = true;
    renderRoute("/workspace");
    await user.click(screen.getAllByRole("button", { name: "Onboarding" })[0]);
    expect(screen.getByText("Loading your assigned onboarding tasks…")).toBeTruthy();
    cleanup();

    consultantTaskTestState.isLoading = false;
    consultantTaskTestState.error = new Error("Unavailable");
    renderRoute("/workspace");
    await user.click(screen.getAllByRole("button", { name: "Onboarding" })[0]);
    expect(screen.getByText("Your personal onboarding tasks are unavailable.")).toBeTruthy();
    cleanup();

    consultantTaskTestState.error = null;
    consultantTaskTestState.tasks = [];
    renderRoute("/workspace");
    await user.click(screen.getAllByRole("button", { name: "Onboarding" })[0]);
    expect(screen.getByText("No assigned onboarding tasks yet.")).toBeTruthy();
  });

  it("renders protected Consultant My Engagement data and separates live states", async () => {
    setAuthenticatedRole("consultant", "Riley Consultant");
    renderRoute("/workspace/my-engagement");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Current assignment" })).toBeTruthy());
    expect(screen.getByText("Northstar Commerce Cloud · Demo")).toBeTruthy();
    expect(screen.getByText("Northstar Retail · Demo")).toBeTruthy();
    expect(screen.getByText("Casey Rivera")).toBeTruthy();
    expect(screen.getByText(/No time entry, approval, invoice, payroll, payment, or commercial action is available/i)).toBeTruthy();
    expect(screen.queryByText(/commercial rate|candidate profile|readiness details/i)).toBeNull();
    cleanup();

    consultantEngagementTestState.isLoading = true;
    renderRoute("/workspace/my-engagement");
    expect(screen.getByText("Loading your protected engagement…")).toBeTruthy();
    cleanup();

    consultantEngagementTestState.isLoading = false;
    consultantEngagementTestState.error = new Error("Unavailable");
    renderRoute("/workspace/my-engagement");
    expect(screen.getByText("Your engagement details are unavailable.")).toBeTruthy();
    cleanup();

    consultantEngagementTestState.error = null;
    consultantEngagementTestState.data = { assignment: { assignmentState: "extension_due" }, hasActiveAssignment: false, latestTimesheet: null };
    renderRoute("/workspace/my-engagement");
    expect(screen.getByText("No active assignment")).toBeTruthy();
    expect(screen.getByText(/extension handoff requires human follow-up/i)).toBeTruthy();
  });

  it("records a factual Consultant engagement continuity note with safe assignment context and designated human follow-up", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("consultant", "Riley Consultant");
    renderRoute("/workspace/engagement-continuity");

    expect(screen.getByRole("heading", { name: "Engagement continuity" })).toBeTruthy();
    expect(screen.getByText("Source: assignment record", { exact: false })).toBeTruthy();
    expect(screen.getByText("Casey Rivera")).toBeTruthy();
    expect(screen.getByText("Your continuity history")).toBeTruthy();
    expect(screen.getByText("The latest implementation handoff context is recorded for the designated human owner.")).toBeTruthy();
    expect(screen.queryByText(/Northstar Retail|client credential|peer name|performance rating|work authorization|compensation amount/i)).toBeNull();
    expect(screen.getByRole("button", { name: "Record factual note" }).hasAttribute("disabled")).toBe(true);

    const note = screen.getByLabelText("Engagement continuity factual note");
    note.focus();
    expect(document.activeElement).toBe(note);
    await user.selectOptions(screen.getByLabelText("Engagement continuity category"), "support_needed");
    await user.type(note, "I need a factual owner follow-up on the recorded handoff context.");
    expect(screen.getByText(/\/ 500 characters/i)).toBeTruthy();
    const submit = screen.getByRole("button", { name: "Record factual note" });
    expect(submit.hasAttribute("disabled")).toBe(false);
    await user.click(submit);
    expect(consultantEngagementContinuityTestState.mutate).toHaveBeenCalledWith({ category: "support_needed", factualNote: "I need a factual owner follow-up on the recorded handoff context." });
    expect(consultantEngagementContinuityTestState.refetch).toHaveBeenCalled();
    expect(screen.getByText(/did not request or change an assignment outcome/i)).toBeTruthy();
    expect(screen.getByText(/do not request or approve an extension, decide roll-off or redeployment, modify assignments, trigger notifications/i)).toBeTruthy();
  });

  it("keeps Consultant engagement continuity loading, unavailable, and no-assignment states distinct", () => {
    setAuthenticatedRole("consultant", "Riley Consultant");
    consultantEngagementContinuityTestState.isLoading = true;
    let view = renderRoute("/workspace/engagement-continuity");
    expect(screen.getByText("Loading your protected engagement continuity…")).toBeTruthy();
    view.unmount();

    consultantEngagementContinuityTestState.isLoading = false;
    consultantEngagementContinuityTestState.error = new Error("Unavailable");
    view = renderRoute("/workspace/engagement-continuity");
    expect(screen.getByText("Your engagement continuity details are unavailable.")).toBeTruthy();
    view.unmount();

    consultantEngagementContinuityTestState.error = null;
    consultantEngagementContinuityTestState.data = { assignment: null, hasActiveAssignment: false, designatedHumanOwner: "Designated engagement owner", notes: [] };
    renderRoute("/workspace/engagement-continuity");
    expect(screen.getByText("No assignment available")).toBeTruthy();
    expect(screen.getByText(/does not create an assignment merely to save a continuity note/i)).toBeTruthy();
  });

  it("limits Consultant Time Submission to own active assignments, draft/correction edits, and human review", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("consultant", "Riley Consultant");
    renderRoute("/workspace/time-submission");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Your time entries" })).toBeTruthy());
    expect(screen.getByText("Casey Rivera")).toBeTruthy();
    expect(screen.getByText("Selected-period work hours")).toBeTruthy();
    expect(screen.getByText("Total entered work hours")).toBeTruthy();
    expect(screen.getByText("40")).toBeTruthy();
    expect(screen.getByText(/cannot approve time, calculate payroll, create an invoice, issue payment, or connect to accounting/i)).toBeTruthy();
    expect(screen.queryByText(/commercial rate|pay rate/i)).toBeNull();
    await user.selectOptions(screen.getByLabelText("Time submission assignment"), "1");
    fireEvent.change(screen.getByLabelText("Time entry week ending"), { target: { value: "2026-09-01" } });
    await user.type(screen.getByLabelText("Time entry hours"), "40");
    await user.type(screen.getByLabelText("Time entry note"), "Completed the planned implementation work for the week.");
    await user.click(screen.getByRole("button", { name: "Create draft entry" }));
    await waitFor(() => expect(consultantTimeSubmissionTestState.create).toHaveBeenCalledWith(expect.objectContaining({ assignmentId: 1, hours: 40, note: "Completed the planned implementation work for the week." })));
    await user.click(screen.getByRole("button", { name: "Submit for human review" }));
    expect(consultantTimeSubmissionTestState.submit).toHaveBeenCalledWith({ timeEntryId: 71 });
    cleanup();

    consultantTimeSubmissionTestState.isLoading = true;
    renderRoute("/workspace/time-submission");
    expect(screen.getByText("Loading your protected time entries…")).toBeTruthy();
    cleanup();

    consultantTimeSubmissionTestState.isLoading = false;
    consultantTimeSubmissionTestState.error = new Error("Unavailable");
    renderRoute("/workspace/time-submission");
    expect(screen.getByText("Your time-submission records are unavailable.")).toBeTruthy();
    cleanup();

    consultantTimeSubmissionTestState.error = null;
    consultantTimeSubmissionTestState.data = { designatedHumanOwner: "Casey Rivera", assignments: [], entries: [] };
    renderRoute("/workspace/time-submission");
    expect(screen.getByText("No active assignment is available for time submission.")).toBeTruthy();
    expect(screen.getByText("No protected time entries yet.")).toBeTruthy();
  });

  it("keeps private upload visible for an existing own draft timesheet and presents the OCR total only for human review", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);
    consultantTimeSubmissionTestState.data = { designatedHumanOwner: "Casey Rivera", assignments: [{ id: 1, projectName: "Northstar Commerce Cloud · Demo", assignmentState: "active" }], entries: [{ id: 71, assignmentId: 1, weekEnding: new Date("2026-08-23"), hours: 40, status: "draft", note: "Draft own-record time entry.", updatedAt: new Date("2026-08-26"), evidence: [] }] };
    setAuthenticatedRole("consultant", "Jamie Chen");
    renderRoute("/workspace/time-submission");

    expect(screen.getByText("Client-approved timesheet evidence")).toBeTruthy();
    expect(screen.getByText(/PDF, PNG, or JPEG only · 5 MB maximum/i)).toBeTruthy();
    await user.selectOptions(screen.getByLabelText("Timesheet evidence entry"), "71");
    const file = new File(["%PDF approved timesheet"], "approved-week.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText("Timesheet evidence upload"), file);
    const uploadButton = screen.getByRole("button", { name: "Upload & extract total hours" }) as HTMLButtonElement;
    expect(uploadButton.disabled).toBe(true);
    await user.click(screen.getByLabelText("Confirm client-approved timesheet"));
    expect(uploadButton.disabled).toBe(false);
    await user.click(uploadButton);

    await waitFor(() => expect(consultantTimeSubmissionTestState.prepareEvidence).toHaveBeenCalledWith(expect.objectContaining({ timeEntryId: 71, fileName: "approved-week.pdf", fileSize: file.size, confirmClientApproved: true })));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith("/api/consultant/timesheet-upload/b6d2ba3c-6f44-4d4c-b7f9-9a457bca80f2", expect.objectContaining({ method: "PUT", credentials: "include" })));
    await waitFor(() => expect(consultantTimeSubmissionTestState.completeEvidence).toHaveBeenCalledWith({ sessionId: "b6d2ba3c-6f44-4d4c-b7f9-9a457bca80f2" }));
    expect(screen.getByText(/Hours extracted: 40/)).toBeTruthy();
    expect(screen.getByText(/has not changed your time entry/i)).toBeTruthy();
    expect(screen.getByText(/cannot approve time, determine eligibility, calculate payroll, create invoices, issue payments/i)).toBeTruthy();
    vi.unstubAllGlobals();
  });

  it("lets a Consultant acknowledge an own reviewer note and submit one bounded factual response without changing any timesheet outcome", async () => {
    const user = userEvent.setup();
    consultantTimeSubmissionTestState.data = { designatedHumanOwner: "Casey Rivera", assignments: [{ id: 1, projectName: "Northstar Commerce Cloud · Demo", assignmentState: "active" }], entries: [{ id: 71, assignmentId: 1, weekEnding: new Date("2026-08-23"), hours: 40, status: "submitted", note: "Submitted own-record time entry.", updatedAt: new Date("2026-08-26"), evidence: [{ id: 91, originalFileName: "approved-week.pdf", mimeType: "application/pdf", fileSize: 24, extractionStatus: "extracted", extractedHours: 40, extractionConfidence: "high", createdAt: new Date("2026-08-26"), updatedAt: new Date("2026-08-26"), designatedReviewerAssigned: true, discrepancyNotes: [{ id: 118, evidenceId: 91, note: "Entered and visible source totals require factual human follow-up.", createdAt: new Date("2026-08-26"), acknowledgedAt: null, response: null }] }] }] };
    setAuthenticatedRole("consultant", "Jamie Chen");
    renderRoute("/workspace/time-submission");

    expect(screen.getByRole("region", { name: "Timesheet discrepancy follow-up" })).toBeTruthy();
    expect(screen.getAllByText("Entered and visible source totals require factual human follow-up.")).toHaveLength(2);
    const acknowledge = screen.getByRole("button", { name: "Acknowledge note" });
    acknowledge.focus();
    expect(document.activeElement).toBe(acknowledge);
    await user.keyboard("{Enter}");
    expect(consultantTimeSubmissionTestState.acknowledgeDiscrepancy).toHaveBeenCalledWith({ reviewerNoteId: 118 });
    expect(screen.getByText(/acknowledgement was recorded for designated human follow-up/i)).toBeTruthy();

    const response = screen.getByLabelText("Factual response for discrepancy note 118");
    await user.type(response, "Too short");
    expect((screen.getByRole("button", { name: "Send factual response for human follow-up" }) as HTMLButtonElement).disabled).toBe(true);
    await user.type(response, " but the documented total remains forty hours.");
    expect(screen.getByText(`${(response as HTMLTextAreaElement).value.length}/500`)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Send factual response for human follow-up" }));
    expect(consultantTimeSubmissionTestState.respondToDiscrepancy).toHaveBeenCalledWith({ reviewerNoteId: 118, body: "Too short but the documented total remains forty hours." });
    expect(screen.getByText(/human reviewer remains responsible for resolving the discrepancy/i)).toBeTruthy();
    expect(screen.queryByText(/reviewerUserId|fileKey|private\//i)).toBeNull();

    cleanup();
    consultantTimeSubmissionTestState.discrepancyError = new Error("Your timesheet discrepancy note was not found");
    renderRoute("/workspace/time-submission");
    await user.click(screen.getByRole("button", { name: "Acknowledge note" }));
    expect(screen.getByText("Your timesheet discrepancy note was not found")).toBeTruthy();
  });

  it("renders a keyboard-accessible private-source handoff only for the Consultant's own evidence metadata", async () => {
    consultantTimeSubmissionTestState.data = { designatedHumanOwner: "Casey Rivera", assignments: [{ id: 1, projectName: "Northstar Commerce Cloud · Demo", assignmentState: "active" }], entries: [{ id: 71, assignmentId: 1, weekEnding: new Date("2026-08-23"), hours: 40, status: "submitted", note: "Submitted own-record time entry.", updatedAt: new Date("2026-08-26"), evidence: [{ id: 91, originalFileName: "approved-week.pdf", mimeType: "application/pdf", fileSize: 24, extractionStatus: "extracted", extractedHours: 40, extractionConfidence: "high", createdAt: new Date("2026-08-26"), updatedAt: new Date("2026-08-26") }] }] };
    setAuthenticatedRole("consultant", "Jamie Chen");
    renderRoute("/workspace/time-submission");

    expect(screen.getByRole("region", { name: "Your private timesheet sources" })).toBeTruthy();
    const privateSource = screen.getByRole("link", { name: "Open your private source approved-week.pdf" });
    expect(privateSource.getAttribute("href")).toBe("/api/consultant/timesheet-evidence/91");
    expect(privateSource.getAttribute("target")).toBe("_blank");
    privateSource.focus();
    expect(document.activeElement).toBe(privateSource);
    expect(screen.getByText(/Opening a source records at most one factual own-account viewing event/i)).toBeTruthy();
    expect(screen.queryByText(/consultant-timesheets\/|fileKey|fileSha256|signed\.private/i)).toBeNull();

    cleanup();
    consultantTimeSubmissionTestState.data = { designatedHumanOwner: "Casey Rivera", assignments: [{ id: 1, projectName: "Northstar Commerce Cloud · Demo", assignmentState: "active" }], entries: [{ id: 71, assignmentId: 1, weekEnding: new Date("2026-08-23"), hours: 40, status: "draft", note: "Draft own-record time entry.", updatedAt: new Date("2026-08-26"), evidence: [] }] };
    renderRoute("/workspace/time-submission");
    expect(screen.queryByRole("link", { name: /Open your private source/i })).toBeNull();
  });

  it("keeps OCR retry and no-existing-entry states distinct without exposing private document content", async () => {
    const user = userEvent.setup();
    consultantTimeSubmissionTestState.data = { designatedHumanOwner: "Casey Rivera", assignments: [{ id: 1, projectName: "Northstar Commerce Cloud · Demo", assignmentState: "active" }], entries: [{ id: 71, assignmentId: 1, weekEnding: new Date("2026-08-23"), hours: 40, status: "submitted", note: "Submitted for designated review.", updatedAt: new Date("2026-08-26"), evidence: [{ id: 91, originalFileName: "approved-week.pdf", mimeType: "application/pdf", fileSize: 24, extractionStatus: "needs_human_review", extractedHours: null, extractionConfidence: "low", createdAt: new Date("2026-08-26"), updatedAt: new Date("2026-08-26") }] }] };
    setAuthenticatedRole("consultant", "Jamie Chen");
    renderRoute("/workspace/time-submission");

    expect(screen.getAllByText("approved-week.pdf")).toHaveLength(2);
    expect(screen.getByText(/OCR total: Not available/)).toBeTruthy();
    expect(screen.queryByText(/consultant-timesheets\/|fileSha256|fileKey/i)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Retry hours extraction" }));
    expect(consultantTimeSubmissionTestState.retryEvidence).toHaveBeenCalledWith({ evidenceId: 91 });
    cleanup();

    consultantTimeSubmissionTestState.data = { designatedHumanOwner: "Casey Rivera", assignments: [{ id: 1, projectName: "Northstar Commerce Cloud · Demo", assignmentState: "active" }], entries: [{ id: 71, assignmentId: 1, weekEnding: new Date("2026-08-23"), hours: 40, status: "draft", note: "Draft record.", updatedAt: new Date("2026-08-26"), evidence: [] }] };
    renderRoute("/workspace/time-submission");
    expect(screen.getByText("Upload a private approved timesheet")).toBeTruthy();
    expect(screen.getByRole("option", { name: /Week ending.*draft/i })).toBeTruthy();
  });

  it("renders selected-period total loading, unavailable, and successful-empty states without a payroll calculation", async () => {
    setAuthenticatedRole("consultant", "Jamie Chen");
    consultantTimeSubmissionTestState.periodTotalLoading = true;
    renderRoute("/workspace/time-submission");
    expect(screen.getByText("Calculating your protected period total…")).toBeTruthy();
    cleanup();

    consultantTimeSubmissionTestState.periodTotalLoading = false;
    consultantTimeSubmissionTestState.periodTotalError = new Error("Unavailable");
    renderRoute("/workspace/time-submission");
    expect(screen.getByText("Your selected-period total is unavailable.")).toBeTruthy();
    cleanup();

    consultantTimeSubmissionTestState.periodTotalError = null;
    consultantTimeSubmissionTestState.periodTotal = { startDate: new Date("2026-08-01"), endDate: new Date("2026-08-31"), entryCount: 0, enteredHoursTotal: 0, statusCounts: { draft: 0, submitted: 0, approved: 0, exception: 0 } };
    renderRoute("/workspace/time-submission");
    expect(screen.getByText("0 entries in this period")).toBeTruthy();
    expect(screen.getByText(/This is not payroll, billing, approval, or an OCR replacement/i)).toBeTruthy();
  });

  it("signs out an authenticated user and returns them to the login screen", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("admin", "Avery Admin");
    renderRoute("/workspace");

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(authState.logout).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Sign in to Workforce Hub.")).toBeTruthy();
  });

  it("submits an explicit credential login without exposing role choices", async () => {
    const user = userEvent.setup();
    setUnauthenticated();
    renderRoute("/login");

    expect(screen.getAllByAltText("Verton Solution Inc. company logo").length).toBeGreaterThan(0);
    expect(screen.queryByText("Recruiter")).toBeNull();
    await user.type(screen.getByLabelText("Email address"), "recruiter@demo.vertonsolutions.com");
    await user.type(screen.getByLabelText("Password"), "VertonDemo!2026");
    await user.click(screen.getByRole("button", { name: /Enter Workforce Hub/ }));
    expect(demoAuthState.loginMutate).toHaveBeenCalledWith({ email: "recruiter@demo.vertonsolutions.com", password: "VertonDemo!2026" });
  });

  it("renders a disabled, portal-style busy state while credential authentication is pending", () => {
    demoAuthState.loginPending = true;
    setUnauthenticated();
    renderRoute("/login");

    const button = screen.getByRole("button", { name: /Verifying credentials/ });
    expect(button).toHaveProperty("disabled", true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.querySelector(".animate-spin")).toBeTruthy();
  });

  it("generates a demo reset code and submits a matching replacement password", async () => {
    const user = userEvent.setup();
    setUnauthenticated();
    renderRoute("/login");

    await user.click(screen.getByRole("button", { name: "Forgot password?" }));
    await user.type(screen.getByLabelText("Reset email"), "recruiter@demo.vertonsolutions.com");
    await user.click(screen.getByRole("button", { name: /Generate reset code/ }));
    await user.type(screen.getByLabelText("New password"), "ReplacementDemo!2026");
    await user.type(screen.getByLabelText("Confirm password"), "ReplacementDemo!2026");
    await user.click(screen.getByRole("button", { name: "Save new password" }));
    expect(demoAuthState.resetRequestMutate).toHaveBeenCalledWith({ email: "recruiter@demo.vertonsolutions.com" });
    expect(demoAuthState.resetMutate).toHaveBeenCalledWith(expect.objectContaining({ password: "ReplacementDemo!2026" }));
  });

  it("completes the demo recovery journey and opens the assigned recruiter workspace", async () => {
    const user = userEvent.setup();
    demoAuthState.loginAs = {
      id: 2,
      openId: "demo_recruiter",
      email: "recruiter@demo.vertonsolutions.com",
      name: "Riley Brooks",
      loginMethod: "demo-credentials",
      role: "recruiter",
      isDemo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    setUnauthenticated();
    renderRoute("/login");

    await user.click(screen.getByRole("button", { name: "Forgot password?" }));
    await user.type(screen.getByLabelText("Reset email"), "recruiter@demo.vertonsolutions.com");
    await user.click(screen.getByRole("button", { name: /Generate reset code/ }));
    await user.type(screen.getByLabelText("New password"), "ReplacementDemo!2026");
    await user.type(screen.getByLabelText("Confirm password"), "ReplacementDemo!2026");
    await user.click(screen.getByRole("button", { name: "Save new password" }));
    expect(screen.getByText(/Password reset successfully/)).toBeTruthy();

    await user.clear(screen.getByLabelText("Email address"));
    await user.type(screen.getByLabelText("Email address"), "recruiter@demo.vertonsolutions.com");
    await user.type(screen.getByLabelText("Password"), "ReplacementDemo!2026");
    await user.click(screen.getByRole("button", { name: /Enter Workforce Hub/ }));

    expect(demoAuthState.loginMutate).toHaveBeenCalledWith({ email: "recruiter@demo.vertonsolutions.com", password: "ReplacementDemo!2026" });
    expect(screen.getByText("Recruiter workspace")).toBeTruthy();
    expect(screen.queryByText("Readiness")).toBeNull();
  });

  it("lets a recruiter parse pasted resume text and review extracted candidate details", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("recruiter", "Riley Recruiter");
    renderRoute("/workspace/recruiting");

    const resumeInput = screen.getByLabelText("Resume text") as HTMLTextAreaElement;
    await user.type(resumeInput, "Alex Morgan is a full-stack engineer with six years of TypeScript, React, AWS, and cloud delivery experience. Alex has delivered web platforms for Northstar and is based in Austin, Texas. Contact alex@example.com.");
    expect(resumeInput.value.length).toBeGreaterThan(80);
    const parseButton = screen.getByRole("button", { name: /Parse pasted resume/ }) as HTMLButtonElement;
    expect(parseButton.disabled).toBe(false);
    await user.click(parseButton);
    expect(resumeTestState.mutate).toHaveBeenCalledWith(expect.objectContaining({ resumeText: expect.stringContaining("Alex Morgan") }));
    expect(screen.getByText("Alex Morgan")).toBeTruthy();
    expect(screen.getAllByText("TypeScript").length).toBeGreaterThan(0);
    expect(screen.getByText(/Prepare for human review/)).toBeTruthy();
  }, 10_000);

  it("starts the protected direct-upload flow and exposes result exports", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);
    const createObjectUrl = vi.fn(() => "blob:resume-export");
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    setAuthenticatedRole("recruiter", "Riley Recruiter");
    renderRoute("/workspace/recruiting");
    const file = new File(["%PDF example resume"], "alex-morgan.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText("Resume file upload"), file);
    await user.click(screen.getByRole("button", { name: /Upload & parse resume/ }));
    await waitFor(() => expect(resumeTestState.uploadMutate).toHaveBeenCalledWith(expect.objectContaining({ fileName: "alex-morgan.pdf", fileSize: file.size })));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith("/api/recruiter/resume-upload/f4c4c2a6-17fb-4d62-b119-784831553898", expect.objectContaining({ method: "PUT" })));
    expect(screen.getByRole("button", { name: /CSV/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /PDF/ })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /CSV/ }));
    expect(createObjectUrl).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("renders one red protected-upload outcome when the stored file cannot be retrieved", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    resumeTestState.completeUploadError = new Error("The resume upload could not be retrieved. Upload the file again.");
    setAuthenticatedRole("recruiter", "Riley Recruiter");
    renderRoute("/workspace/recruiting");
    const file = new File(["%PDF example resume"], "alex-morgan.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText("Resume file upload"), file);
    await user.click(screen.getByRole("button", { name: /Upload & parse resume/ }));

    const message = "The resume upload could not be retrieved. Upload the file again.";
    await waitFor(() => expect(screen.getAllByRole("status").some(status => status.textContent === message)).toBe(true));
    expect(screen.getAllByText(message)).toHaveLength(1);
    expect(screen.getAllByRole("status").find(status => status.textContent === message)?.className).toContain("bg-rose-50");
    expect(screen.getByText("Supported beside this chooser: PDF or DOCX only, up to 5 MB.")).toBeTruthy();
    expect(screen.getByText(/Upload status: Upload not completed/)).toBeTruthy();

    resumeTestState.completeUploadError = null;
    await user.click(screen.getByRole("button", { name: "Retry resume upload" }));
    await waitFor(() => expect(screen.getByText(/Complete — parsed details are ready for human review/)).toBeTruthy());
    expect(resumeTestState.uploadMutate).toHaveBeenCalledTimes(4);
    vi.unstubAllGlobals();
  });

  it("filters recruiter-visible candidates by search, skill, and experience", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("recruiter", "Riley Recruiter");
    renderRoute("/workspace/recruiting");
    const finder = screen.getByText("Candidate finder").closest("section") as HTMLElement;
    await user.type(screen.getByLabelText("Search candidates"), "Lena");
    expect(within(finder).getByText("Lena Garcia")).toBeTruthy();
    expect(within(finder).queryByText("Owen Miller")).toBeNull();
    await user.clear(screen.getByLabelText("Search candidates"));
    await user.selectOptions(screen.getByLabelText("Filter by skill"), "Java");
    expect(within(finder).getByText("Owen Miller")).toBeTruthy();
    await user.selectOptions(screen.getByLabelText("Filter by experience"), "4-7");
    expect(within(finder).getByText(/No candidate profiles match these filters/)).toBeTruthy();
    expect(within(finder).getByText(/Parsed information requires recruiter review before use/)).toBeTruthy();
  });

  it("edits a database-backed candidate row inline and submits validated recruiter changes", async () => {
    const user = userEvent.setup();
    resumeTestState.candidates = [{ id: 41, candidateName: "Alex Morgan", email: "alex@example.com", location: "Austin, TX", yearsExperience: "6 years", skills: ["TypeScript", "React"], reviewState: "pending" }];
    setAuthenticatedRole("recruiter", "Riley Recruiter");
    renderRoute("/workspace/recruiting");

    await user.click(screen.getByRole("button", { name: "Edit Alex Morgan" }));
    const nameInput = screen.getByLabelText("Edit candidate name") as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, "Alex Morgan Updated");
    await user.click(screen.getByRole("button", { name: "Save candidate edit" }));
    expect(resumeTestState.candidateUpdateMutate).toHaveBeenCalledWith(expect.objectContaining({ candidateId: 41, candidateName: "Alex Morgan Updated", skills: ["TypeScript", "React"] }));
  });

  it("keeps candidate row inputs controlled and cancels without submitting a curation mutation", async () => {
    const user = userEvent.setup();
    resumeTestState.candidates = [{ id: 42, candidateName: "Jordan Parker", email: "jordan@example.com", location: "Austin, TX", yearsExperience: "5 years", skills: ["Python"], reviewState: "pending_human_review" }];
    setAuthenticatedRole("recruiter", "Riley Recruiter");
    renderRoute("/workspace/recruiting");

    await user.click(screen.getByRole("button", { name: "Edit Jordan Parker" }));
    const locationInput = screen.getByLabelText("Edit candidate location") as HTMLInputElement;
    expect(locationInput.value).toBe("Austin, TX");
    await user.clear(locationInput);
    await user.type(locationInput, "Denver, CO");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText("Edit candidate location")).toBeNull();
    expect(resumeTestState.candidateUpdateMutate).not.toHaveBeenCalled();
  });

  it("saves a delivery-authorized inline project edit and refreshes the protected summary", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("project_manager", "Casey Project Manager");
    renderRoute("/workspace");
    await user.click(screen.getAllByRole("button", { name: "Delivery" })[0]!);

    await user.click(screen.getByRole("button", { name: "Edit Northstar Commerce Cloud · Demo" }));
    await user.clear(screen.getByLabelText("Edit project name"));
    await user.type(screen.getByLabelText("Edit project name"), "Northstar Delivery Cloud · Demo");
    await user.selectOptions(screen.getByLabelText("Edit project status"), "at_risk");
    await user.clear(screen.getByLabelText("Edit project manager"));
    await user.type(screen.getByLabelText("Edit project manager"), "Taylor Nguyen");
    await user.click(screen.getByRole("button", { name: "Review project edit" }));
    expect(portalTestState.projectUpdateMutate).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Confirm project edit" }));

    expect(portalTestState.projectUpdateMutate).toHaveBeenCalledWith({ projectId: 1, name: "Northstar Delivery Cloud · Demo", deliveryStatus: "at_risk", projectManagerName: "Taylor Nguyen" });
    expect(portalTestState.summaryRefetch).toHaveBeenCalledOnce();
    expect(screen.queryByLabelText("Edit project name")).toBeNull();
  });

  it("shows a clear error after a confirmed project curation save fails", async () => {
    const user = userEvent.setup();
    portalTestState.projectUpdateError = true;
    setAuthenticatedRole("delivery_manager", "Taylor Delivery Manager");
    renderRoute("/workspace");
    await user.click(screen.getAllByRole("button", { name: "Delivery" })[0]!);
    await user.click(screen.getByRole("button", { name: "Edit Northstar Commerce Cloud · Demo" }));
    await user.click(screen.getByRole("button", { name: "Review project edit" }));
    await user.click(screen.getByRole("button", { name: "Confirm project edit" }));

    expect(screen.getByText("The project update could not be saved. Review your authorized role and try again.")).toBeTruthy();
    expect(portalTestState.summaryRefetch).not.toHaveBeenCalled();
  });

  it("keeps a consultant project delivery view read-only", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("consultant", "Scoped consultant");
    renderRoute("/workspace");
    await user.click(screen.getAllByRole("button", { name: "Delivery" })[0]!);

    expect(screen.queryByRole("button", { name: "Edit Northstar Commerce Cloud · Demo" })).toBeNull();
    expect(screen.getByText("View only")).toBeTruthy();
  });

  it("keeps finance project updates out of the scoped navigation and view", () => {
    setAuthenticatedRole("finance", "Scoped finance");
    renderRoute("/workspace");

    expect(screen.queryByRole("button", { name: "Delivery" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit Northstar Commerce Cloud · Demo" })).toBeNull();
  });

  it("shows onboarding drafting only in its active workflow context and renders the returned briefing", async () => {
    const user = userEvent.setup();
    aiTestState.response = { briefing: "Summary\nHuman follow-up\nBoundary", task: "onboarding_guidance", model: "test-model" };
    setAuthenticatedRole("consultant", "Riley Consultant");
    renderRoute("/workspace");

    expect(screen.queryByRole("button", { name: /Draft next-step guidance/ })).toBeNull();
    await user.click(screen.getAllByRole("button", { name: "Onboarding" })[0]!);
    await user.click(screen.getByRole("button", { name: /Draft onboarding follow-up/ }));
    expect(aiTestState.mutate).toHaveBeenCalledWith(expect.objectContaining({ task: "onboarding_guidance", context: expect.stringContaining("Current employee onboarding signals") }));
    expect(JSON.stringify(aiTestState.mutate.mock.calls[0]?.[0])).not.toContain("workAuthorizationStatus");
    expect(screen.getByText(/Summary/)).toBeTruthy();
    expect(screen.getByText(/Human follow-up/)).toBeTruthy();
  });

  it("keeps generic briefing actions out of unrelated pages and shows a designated-human-owner fallback", async () => {
    const user = userEvent.setup();
    aiTestState.error = new Error("provider unavailable");
    setAuthenticatedRole("consultant", "Riley Consultant");
    renderRoute("/workspace");

    expect(screen.queryByRole("button", { name: /Draft .*follow-up|Draft access review|Draft recruiter handoff/ })).toBeNull();
    await user.click(screen.getAllByRole("button", { name: "Onboarding" })[0]!);
    expect(screen.getByRole("button", { name: /Draft onboarding follow-up/ })).toBeTruthy();
    expect(screen.getAllByText(/designated human owner/i).length).toBeGreaterThan(0);
  });

  it("shows the floating assistant fallback when its service returns an error", async () => {
    const user = userEvent.setup();
    workspaceAssistantState.error = new Error("provider unavailable");
    setAuthenticatedRole("consultant", "Riley Consultant");
    renderRoute("/workspace");

    await user.click(screen.getByRole("button", { name: /Open AI assistant/ }));
    expect(screen.getByText(/The assistant is unavailable/)).toBeTruthy();
  });

  it("renders bounded database candidate matches returned through the recruiter assistant", async () => {
    const user = userEvent.setup();
    workspaceAssistantState.response = { reply: "I found a recruiter-visible match.", model: "test-model", unavailable: false, lookupKind: "candidate", records: [{ id: 41, candidateName: "Alex Morgan", location: "Austin, TX", yearsExperience: "6 years", skills: ["TypeScript", "React"] }] } as any;
    setAuthenticatedRole("recruiter", "Riley Recruiter");
    renderRoute("/workspace/recruiting");

    await user.click(screen.getByRole("button", { name: /Open AI assistant/ }));
    await user.click(screen.getByRole("button", { name: "Find candidate profiles with Java skills" }));
    expect(workspaceAssistantState.mutate).toHaveBeenCalledWith(expect.objectContaining({ prompt: "Find candidate profiles with Java skills" }));
    expect(screen.getAllByText((_, element) => Boolean(element?.textContent?.includes("Database matches (candidate)"))).length).toBeGreaterThan(0);
    expect(screen.getAllByText((_, element) => Boolean(element?.textContent?.includes("Alex Morgan — Austin, TX"))).length).toBeGreaterThan(0);
  });

  it("renders bounded project-status database matches inside the authenticated assistant", async () => {
    const user = userEvent.setup();
    workspaceAssistantState.response = { reply: "Northstar is active.", model: "test-model", unavailable: false, lookupKind: "project", records: [{ id: 7, name: "Northstar Commerce Cloud · Demo", deliveryStatus: "active", projectManagerName: "Casey Rivera" }] } as any;
    setAuthenticatedRole("delivery_manager", "Taylor Delivery");
    renderRoute("/workspace/delivery");

    await user.click(screen.getByRole("button", { name: /Open AI assistant/ }));
    await user.click(screen.getByRole("button", { name: "Show project status" }));
    expect(screen.getAllByText((_, element) => Boolean(element?.textContent?.includes("Database matches (project)"))).length).toBeGreaterThan(0);
    expect(screen.getAllByText((_, element) => Boolean(element?.textContent?.includes("Northstar Commerce Cloud · Demo — active; Casey Rivera"))).length).toBeGreaterThan(0);
  });

  it("disables floating assistant prompts while a response is being prepared", async () => {
    const user = userEvent.setup();
    workspaceAssistantState.isPending = true;
    setAuthenticatedRole("consultant", "Riley Consultant");
    renderRoute("/workspace");

    await user.click(screen.getByRole("button", { name: /Open AI assistant/ }));
    expect(screen.getByRole("button", { name: "What can I do on this page?" }).hasAttribute("disabled")).toBe(true);
  });

  it("gates typed workspace assistant prompts to the required 4–600 character range", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("consultant", "Riley Consultant");
    renderRoute("/workspace");

    await user.click(screen.getByRole("button", { name: /Open AI assistant/ }));
    const input = screen.getByLabelText("Ask about this workspace…");
    expect(input.getAttribute("maxlength")).toBe("600");
    await user.type(input, "ask");
    expect(screen.getByRole("button", { name: "Send assistant message" }).hasAttribute("disabled")).toBe(true);
    await user.type(input, " now");
    await user.click(screen.getByRole("button", { name: "Send assistant message" }));
    expect(workspaceAssistantState.mutate).toHaveBeenCalledWith(expect.objectContaining({ prompt: "ask now" }));
  });
});
