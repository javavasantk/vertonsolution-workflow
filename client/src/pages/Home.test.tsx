// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { authState, startLoginSpy, aiTestState, workspaceAssistantState, demoAuthState, resumeTestState, adminTestState, portalTestState, readinessTestState, newHireTestState } = vi.hoisted(() => ({
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
      mine: { useQuery: () => ({ data: undefined, refetch: vi.fn() }) },
      readinessRecords: { useQuery: () => ({ data: readinessTestState.records, isLoading: readinessTestState.isLoading, error: readinessTestState.error, refetch: vi.fn() }) },
      requestReview: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    portal: {
      demoSummary: { useQuery: () => ({ data: { clients: [{ id: 1, name: "Northstar Retail · Demo", industry: "Retail", location: "Dallas, TX", status: "active" }], projects: [{ id: 1, name: "Northstar Commerce Cloud · Demo", deliveryStatus: "active", projectManagerName: "Casey Rivera" }], demands: [{ id: 1, status: "open", title: "Database Lead Engineer", priority: "high", clientId: 1, openings: 1 }], assignments: [{ id: 1, assignmentState: "active", projectId: 1, clientId: 1, allocationPercent: 100, managerName: "Casey Rivera" }], timesheets: [{ id: 1, assignmentId: 1, status: "approved", hours: 40, note: "Internal demonstration time entry", weekEnding: new Date("2026-08-23") }], activities: [{ id: 1, entityType: "assignment", title: "Demo assignment extension review", activityState: "attention" }] }, refetch: portalTestState.summaryRefetch }) },
      updateProject: { useMutation: (options?: { onSuccess?: () => void; onError?: () => void }) => ({ mutate: (input: unknown) => { portalTestState.projectUpdateMutate(input); if (portalTestState.projectUpdateError) options?.onError?.(); else options?.onSuccess?.(); }, isPending: false }) },
    },
    recruiting: {
      newHireProgress: { useQuery: () => ({ data: newHireTestState.records, isLoading: newHireTestState.isLoading, error: newHireTestState.error, refetch: vi.fn() }) },
      listCandidates: { useQuery: () => ({ data: resumeTestState.candidates, isLoading: false, refetch: vi.fn() }) },
      updateCandidate: { useMutation: (options?: { onSuccess?: () => void }) => ({ mutate: (input: unknown) => { resumeTestState.candidateUpdateMutate(input); options?.onSuccess?.(); }, isPending: false }) },
      parseResume: { useMutation: (options?: { onSuccess?: (data: unknown) => void }) => ({ mutate: (input: unknown) => { resumeTestState.mutate(input); options?.onSuccess?.(resumeTestState.response); }, isPending: resumeTestState.isPending, error: resumeTestState.error }) },
      prepareResumeUpload: { useMutation: () => ({ mutateAsync: async (input: unknown) => { resumeTestState.uploadMutate(input); return { sessionId: "f4c4c2a6-17fb-4d62-b119-784831553898", uploadPath: "/api/recruiter/resume-upload/f4c4c2a6-17fb-4d62-b119-784831553898", expiresAt: new Date() }; }, isPending: false, error: null }) },
      completeResumeUpload: { useMutation: (options?: { onSuccess?: (data: unknown) => void }) => ({ mutate: (input: unknown) => { resumeTestState.uploadMutate(input); options?.onSuccess?.({ ...resumeTestState.response, fileName: "alex-morgan.pdf" }); }, mutateAsync: async (input: unknown) => { resumeTestState.uploadMutate(input); const result = { ...resumeTestState.response, fileName: "alex-morgan.pdf" }; options?.onSuccess?.(result); return result; }, isPending: false, error: null }) },
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
    expect(items).toEqual(["Overview", "Onboarding", "Delivery", "Time & billing", "My profile"]);
    expect(items).not.toContain("Readiness");
    expect(items).not.toContain("Controls");
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

  it("lets an administrator search users, select an approved role, and see a save confirmation", async () => {
    const user = userEvent.setup();
    adminTestState.users = [{ id: 42, name: "Jordan Lee", email: "jordan@vertonsolutions.com", role: "consultant", lastSignedIn: new Date("2026-08-26") }];
    setAuthenticatedRole("admin", "Avery Admin");
    renderRoute("/workspace/admin");

    await user.type(screen.getByLabelText("Search user directory"), "Jordan");
    await user.selectOptions(screen.getByLabelText("Role for Jordan Lee"), "account_manager");

    expect(adminTestState.roleChangeMutate).toHaveBeenCalledWith({ userId: 42, role: "account_manager" });
    expect(screen.getByText("Jordan Lee now has the Account Manager role.")).toBeTruthy();
    expect(screen.getByText("Role-change audit")).toBeTruthy();
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
    newHireTestState.records = [{ id: 8, onboardingStage: "manager_confirmation", progressPercent: 80, managerConfirmed: false, projectName: "Client Project", assignmentState: "pending", updatedAt: new Date("2026-08-27") }];
    setAuthenticatedRole("admin", "Avery Admin");
    renderRoute("/workspace/recruiting");

    expect(screen.getByText("Administrator & recruiter workspace")).toBeTruthy();
    expect(screen.getByText("Record #8")).toBeTruthy();
    expect(screen.getByText("Client Project")).toBeTruthy();
    expect(screen.queryByText("Readiness status")).toBeNull();
    expect(screen.queryByText("Candidate materials")).toBeNull();
  });

  it("renders loading, unavailable, and empty states for protected New-hire Progress without demo fallback", () => {
    newHireTestState.isLoading = true;
    setAuthenticatedRole("recruiter", "Riley Recruiter");
    renderRoute("/workspace/recruiting");
    expect(screen.getByText("Loading protected onboarding and assignment signals…")).toBeTruthy();

    cleanup();
    newHireTestState.isLoading = false;
    newHireTestState.error = new Error("Unavailable");
    renderRoute("/workspace/recruiting");
    expect(screen.getByText("Protected onboarding signals are unavailable.")).toBeTruthy();
    expect(screen.getByText(/No representative records are substituted/)).toBeTruthy();

    cleanup();
    newHireTestState.error = null;
    renderRoute("/workspace/recruiting");
    expect(screen.getByText("No protected onboarding records are available.")).toBeTruthy();
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

  it("shows the consultant onboarding checklist as a noninteractive representative reference", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("consultant", "Riley Consultant");
    renderRoute("/workspace");

    await user.click(screen.getAllByRole("button", { name: "Onboarding" })[0]);
    expect(screen.getByText("Representative onboarding interface")).toBeTruthy();
    expect(screen.getByText(/not persisted onboarding tasks/)).toBeTruthy();
    expect(screen.getByText(/Reminder delivery is not enabled/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Send reminder" })).toBeNull();
    expect(countCompletedOnboardingTasks([{ done: true }, { done: false }, { done: true }])).toBe(2);
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
