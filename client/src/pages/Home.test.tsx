// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { authState, startLoginSpy, aiTestState, workspaceAssistantState, demoAuthState, resumeTestState } = vi.hoisted(() => ({
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
    resetRequestMutate: vi.fn(),
    resetMutate: vi.fn(),
    accounts: [{ id: 2, name: "Riley Brooks", email: "recruiter@demo.vertonsolutions.com", role: "recruiter" }],
    loginAs: null as any,
  },
  resumeTestState: {
    mutate: vi.fn(),
    uploadMutate: vi.fn(),
    isPending: false,
    error: null as Error | null,
    response: { profile: { candidateName: "Alex Morgan", email: "alex@example.com", phone: "555-0100", location: "Austin, TX", professionalSummary: "Full-stack engineer with cloud delivery experience.", yearsExperience: "6 years", skills: ["TypeScript", "React", "AWS"], recentRoles: [{ title: "Software Engineer", company: "Northstar", period: "2022–present" }], education: ["B.S. Computer Science"], recruiterNotes: ["Confirm project availability with the candidate."], confidence: "high" }, model: "test-model", unavailable: false } as any,
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
      demoLogin: { useMutation: (options?: { onSuccess?: () => void }) => ({ mutate: (input: unknown) => { demoAuthState.loginMutate(input); if (demoAuthState.loginAs) { authState.user = demoAuthState.loginAs; authState.isAuthenticated = true; } options?.onSuccess?.(); }, isPending: false, error: null }) },
      requestDemoPasswordReset: { useMutation: (options?: { onSuccess?: (data: { message: string; resetToken: string | null }) => void }) => ({ mutate: (input: unknown) => { demoAuthState.resetRequestMutate(input); options?.onSuccess?.({ message: "A one-time demonstration reset code is ready.", resetToken: "demo-reset-token-1234567890" }); }, isPending: false, error: null }) },
      resetDemoPassword: { useMutation: (options?: { onSuccess?: () => void }) => ({ mutate: (input: unknown) => { demoAuthState.resetMutate(input); options?.onSuccess?.(); }, isPending: false, error: null }) },
    },
    access: {
      listUsers: { useQuery: () => ({ data: [], isLoading: false, refetch: vi.fn() }) },
      assignRole: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      permissionGroups: { useQuery: () => ({ data: [], isLoading: false, refetch: vi.fn() }) },
      roleChangeHistory: { useQuery: () => ({ data: [], isLoading: false, refetch: vi.fn() }) },
    },
    profile: {
      mine: { useQuery: () => ({ data: undefined, refetch: vi.fn() }) },
      requestReview: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    portal: {
      demoSummary: { useQuery: () => ({ data: { clients: [{ id: 1, name: "Northstar Retail · Demo", industry: "Retail", location: "Dallas, TX", status: "active" }], projects: [{ id: 1, name: "Northstar Commerce Cloud · Demo", deliveryStatus: "active", projectManagerName: "Casey Rivera" }], demands: [{ id: 1, status: "open", title: "Database Lead Engineer", priority: "high", clientId: 1, openings: 1 }], assignments: [{ id: 1, assignmentState: "active", projectId: 1, clientId: 1, allocationPercent: 100, managerName: "Casey Rivera" }], timesheets: [{ id: 1, status: "approved", hours: 40, weekEnding: new Date("2026-08-23") }], activities: [{ id: 1, entityType: "assignment", title: "Demo assignment extension review", activityState: "attention" }] } }) },
    },
    recruiting: {
      newHireProgress: { useQuery: () => ({ data: [], isLoading: false, refetch: vi.fn() }) },
      listCandidates: { useQuery: () => ({ data: [], isLoading: false, refetch: vi.fn() }) },
      parseResume: { useMutation: (options?: { onSuccess?: (data: unknown) => void }) => ({ mutate: (input: unknown) => { resumeTestState.mutate(input); options?.onSuccess?.(resumeTestState.response); }, isPending: resumeTestState.isPending, error: resumeTestState.error }) },
      prepareResumeUpload: { useMutation: () => ({ mutateAsync: async (input: unknown) => { resumeTestState.uploadMutate(input); return { sessionId: "f4c4c2a6-17fb-4d62-b119-784831553898", uploadPath: "/api/recruiter/resume-upload/f4c4c2a6-17fb-4d62-b119-784831553898", expiresAt: new Date() }; }, isPending: false, error: null }) },
      completeResumeUpload: { useMutation: (options?: { onSuccess?: (data: unknown) => void }) => ({ mutate: (input: unknown) => { resumeTestState.uploadMutate(input); options?.onSuccess?.({ ...resumeTestState.response, fileName: "alex-morgan.pdf" }); }, mutateAsync: async (input: unknown) => { resumeTestState.uploadMutate(input); const result = { ...resumeTestState.response, fileName: "alex-morgan.pdf" }; options?.onSuccess?.(result); return result; }, isPending: false, error: null }) },
    },
    ai: {
      assist: { useMutation: (options?: { onSuccess?: (data: { briefing: string; task: string; model: string }) => void }) => ({ mutate: (input: unknown) => { aiTestState.mutate(input); if (aiTestState.response) options?.onSuccess?.(aiTestState.response); }, isPending: aiTestState.isPending, error: aiTestState.error }) },
      workspaceAssistant: { useMutation: (options?: { onSuccess?: (data: { reply: string; model: string; unavailable: boolean }) => void }) => ({ mutate: (input: unknown) => { workspaceAssistantState.mutate(input); options?.onSuccess?.(workspaceAssistantState.response); }, isPending: workspaceAssistantState.isPending, error: workspaceAssistantState.error }) },
    },
  },
}));

import Home, { buildCandidateResumeCsv, buildCandidateResumePdfText, countCompletedOnboardingTasks, getAllowedNavigation, getRoleKeyFromStoredRole, isFinanceRole, resolveWorkspacePage } from "./Home";

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

function renderRoute(path: "/" | "/login" | "/workspace" | "/workspace/recruiting") {
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
  demoAuthState.loginMutate.mockReset();
  demoAuthState.resetRequestMutate.mockReset();
  demoAuthState.resetMutate.mockReset();
  demoAuthState.loginAs = null;
  resumeTestState.mutate.mockReset();
  resumeTestState.uploadMutate.mockReset();
  resumeTestState.isPending = false;
  resumeTestState.error = null;
  window.history.pushState({}, "", "/");
});

describe("Workforce Hub role access", () => {
  it("builds structured CSV and PDF export content from extracted candidate details", () => {
    const profile = { candidateName: "Alex Morgan", email: "alex@example.com", phone: "555-0100", location: "Austin, TX", yearsExperience: "6 years", skills: ["TypeScript", "React"], education: ["B.S. Computer Science"], professionalSummary: "Full-stack engineer", recruiterNotes: ["Confirm availability"] };
    const csv = buildCandidateResumeCsv(profile);
    const pdf = buildCandidateResumePdfText(profile);
    expect(csv).toContain('"Candidate name","Alex Morgan"');
    expect(csv).toContain('"Skills","TypeScript; React"');
    expect(pdf).toContain("Candidate: Alex Morgan");
    expect(pdf).toContain("Human review notes: Confirm availability");
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
  });
});

describe("Workforce Hub login and protected workflow behavior", () => {
  it("presents the secure login experience and starts the approved identity flow", async () => {
    const user = userEvent.setup();
    setUnauthenticated();
    renderRoute("/login");

    expect(screen.getByText("Sign in to Workforce Hub.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Use approved identity/ }));
    expect(startLoginSpy).toHaveBeenCalledTimes(1);
  });

  it("protects the workspace when no authenticated account is present", () => {
    setUnauthenticated();
    renderRoute("/workspace");

    expect(screen.getByText("Sign in to Workforce Hub.")).toBeTruthy();
    expect(screen.queryByText("Good morning, Verton.")).toBeNull();
  });

  it("renders only consultant-authorized navigation for a consultant account", () => {
    setAuthenticatedRole("consultant", "Riley Consultant");
    renderRoute("/workspace");

    expect(screen.getAllByText("Onboarding").length).toBeGreaterThan(0);
    expect(screen.queryByText("Readiness")).toBeNull();
    expect(screen.queryByText("Controls")).toBeNull();
  });

  it("renders protected database-backed demo summary records in the authenticated overview", () => {
    setAuthenticatedRole("consultant", "Jamie Consultant");
    renderRoute("/workspace");

    expect(screen.getByText(/MySQL-compatible TiDB via Drizzle ORM/)).toBeTruthy();
    expect(screen.getByText("Demo assignment extension review")).toBeTruthy();
    expect(screen.getByText("Database-backed operational activity.")).toBeTruthy();
  });

  it("renders seeded staffing demand, assignments, and timesheets in their protected operational views", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("consultant", "Jamie Consultant");
    renderRoute("/workspace");

    await user.click(screen.getAllByRole("button", { name: "Delivery" })[0]!);
    expect(screen.getByText("Database Lead Engineer")).toBeTruthy();
    expect(screen.getAllByText("Northstar Commerce Cloud · Demo").length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole("button", { name: "Time & billing" })[0]!);
    expect(screen.getByText("Timesheet #1")).toBeTruthy();
    expect(screen.getByText("40")).toBeTruthy();
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

  it("updates a consultant onboarding checklist after completing a task", async () => {
    const user = userEvent.setup();
    setAuthenticatedRole("consultant", "Riley Consultant");
    renderRoute("/workspace");

    await user.click(screen.getAllByRole("button", { name: "Onboarding" })[0]);
    expect(screen.getByText("2 of 5 completed")).toBeTruthy();
    await user.click(screen.getByText("Complete requested documents"));
    expect(screen.getByText("3 of 5 completed")).toBeTruthy();
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
  });

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
    expect(screen.getByText(/Summary/)).toBeTruthy();
    expect(screen.getByText(/Human follow-up/)).toBeTruthy();
  });

  it("shows the floating assistant fallback when its service returns an error", async () => {
    const user = userEvent.setup();
    workspaceAssistantState.error = new Error("provider unavailable");
    setAuthenticatedRole("consultant", "Riley Consultant");
    renderRoute("/workspace");

    await user.click(screen.getByRole("button", { name: /Open AI assistant/ }));
    expect(screen.getByText(/The assistant is unavailable/)).toBeTruthy();
  });

  it("disables floating assistant prompts while a response is being prepared", async () => {
    const user = userEvent.setup();
    workspaceAssistantState.isPending = true;
    setAuthenticatedRole("consultant", "Riley Consultant");
    renderRoute("/workspace");

    await user.click(screen.getByRole("button", { name: /Open AI assistant/ }));
    expect(screen.getByRole("button", { name: "What can I do on this page?" }).hasAttribute("disabled")).toBe(true);
  });
});
