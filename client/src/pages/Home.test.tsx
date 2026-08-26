// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { authState, startLoginSpy, aiTestState, demoAuthState } = vi.hoisted(() => ({
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
  demoAuthState: {
    loginMutate: vi.fn(),
    resetRequestMutate: vi.fn(),
    resetMutate: vi.fn(),
    accounts: [{ id: 2, name: "Riley Brooks", email: "recruiter@demo.vertonsolutions.com", role: "recruiter" }],
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
    auth: {
      demoAccounts: { useQuery: () => ({ data: { accounts: demoAuthState.accounts, sharedPassword: "VertonDemo!2026" } }) },
      demoLogin: { useMutation: (options?: { onSuccess?: () => void }) => ({ mutate: (input: unknown) => { demoAuthState.loginMutate(input); options?.onSuccess?.(); }, isPending: false, error: null }) },
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
    recruiting: {
      newHireProgress: { useQuery: () => ({ data: [], isLoading: false, refetch: vi.fn() }) },
    },
    ai: {
      assist: { useMutation: (options?: { onSuccess?: (data: { briefing: string; task: string; model: string }) => void }) => ({ mutate: (input: unknown) => { aiTestState.mutate(input); if (aiTestState.response) options?.onSuccess?.(aiTestState.response); }, isPending: aiTestState.isPending, error: aiTestState.error }) },
    },
  },
}));

import Home, { countCompletedOnboardingTasks, getAllowedNavigation, getRoleKeyFromStoredRole, isFinanceRole, resolveWorkspacePage } from "./Home";

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

function renderRoute(path: "/" | "/login" | "/workspace") {
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
  demoAuthState.loginMutate.mockReset();
  demoAuthState.resetRequestMutate.mockReset();
  demoAuthState.resetMutate.mockReset();
  window.history.pushState({}, "", "/");
});

describe("Workforce Hub role access", () => {
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

    expect(screen.getByText("Choose a role, then sign in.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Use approved identity/ }));
    expect(startLoginSpy).toHaveBeenCalledTimes(1);
  });

  it("protects the workspace when no authenticated account is present", () => {
    setUnauthenticated();
    renderRoute("/workspace");

    expect(screen.getByText("Choose a role, then sign in.")).toBeTruthy();
    expect(screen.queryByText("Good morning, Verton.")).toBeNull();
  });

  it("renders only consultant-authorized navigation for a consultant account", () => {
    setAuthenticatedRole("consultant", "Riley Consultant");
    renderRoute("/workspace");

    expect(screen.getAllByText("Onboarding").length).toBeGreaterThan(0);
    expect(screen.queryByText("Readiness")).toBeNull();
    expect(screen.queryByText("Controls")).toBeNull();
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
    expect(screen.getByText("Choose a role, then sign in.")).toBeTruthy();
  });

  it("prefills a role credential and submits the demo login flow", async () => {
    const user = userEvent.setup();
    setUnauthenticated();
    renderRoute("/login");

    await user.click(screen.getByText("Recruiter"));
    expect((screen.getByLabelText("Demo email") as HTMLInputElement).value).toBe("recruiter@demo.vertonsolutions.com");
    await user.click(screen.getByRole("button", { name: /Open assigned workspace/ }));
    expect(demoAuthState.loginMutate).toHaveBeenCalledWith({ email: "recruiter@demo.vertonsolutions.com", password: "VertonDemo!2026" });
  });

  it("generates a demo reset code and submits a matching replacement password", async () => {
    const user = userEvent.setup();
    setUnauthenticated();
    renderRoute("/login");

    await user.click(screen.getByRole("button", { name: "Forgot password?" }));
    await user.type(screen.getByLabelText("Reset email"), "recruiter@demo.vertonsolutions.com");
    await user.click(screen.getByRole("button", { name: /Generate demo reset code/ }));
    await user.type(screen.getByLabelText("New demo password"), "ReplacementDemo!2026");
    await user.type(screen.getByLabelText("Confirm demo password"), "ReplacementDemo!2026");
    await user.click(screen.getByRole("button", { name: "Save new password" }));
    expect(demoAuthState.resetRequestMutate).toHaveBeenCalledWith({ email: "recruiter@demo.vertonsolutions.com" });
    expect(demoAuthState.resetMutate).toHaveBeenCalledWith(expect.objectContaining({ password: "ReplacementDemo!2026" }));
  });

  it("sends bounded onboarding state to the AI assistant and renders the returned briefing", async () => {
    const user = userEvent.setup();
    aiTestState.response = { briefing: "Summary\nHuman follow-up\nBoundary", task: "onboarding_guidance", model: "test-model" };
    setAuthenticatedRole("consultant", "Riley Consultant");
    renderRoute("/workspace");

    await user.click(screen.getByRole("button", { name: /Draft next-step guidance/ }));
    expect(aiTestState.mutate).toHaveBeenCalledWith(expect.objectContaining({ task: "onboarding_guidance", context: expect.stringContaining("Current employee onboarding signals") }));
    expect(screen.getByText(/Summary/)).toBeTruthy();
    expect(screen.getByText(/Human follow-up/)).toBeTruthy();
  });

  it("shows the unavailable fallback when the AI service returns an error", () => {
    aiTestState.error = new Error("provider unavailable");
    setAuthenticatedRole("consultant", "Riley Consultant");
    renderRoute("/workspace");

    expect(screen.getByText(/AI assistance is unavailable right now/)).toBeTruthy();
  });

  it("disables AI action controls while an AI briefing is being prepared", () => {
    aiTestState.isPending = true;
    setAuthenticatedRole("consultant", "Riley Consultant");
    renderRoute("/workspace");

    expect(screen.getByRole("button", { name: /Preparing/ }).hasAttribute("disabled")).toBe(true);
  });
});
