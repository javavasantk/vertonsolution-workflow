// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import Home, { countCompletedOnboardingTasks, getAllowedNavigation, isFinanceRole, resolveWorkspacePage } from "./Home";

function renderWorkspace() {
  window.history.pushState({}, "", "/workspace");
  return render(<Home />);
}

afterEach(() => {
  cleanup();
  window.history.pushState({}, "", "/");
});

describe("Workforce Hub role navigation", () => {
  it("limits consultant navigation to employee-relevant workspaces", () => {
    const items = getAllowedNavigation("Consultant").map(item => item.label);

    expect(items).toEqual(["Overview", "Onboarding", "Delivery", "Time & billing"]);
    expect(items).not.toContain("Readiness");
    expect(items).not.toContain("Controls");
  });

  it("allows the authorized compliance reviewer into the restricted readiness workspace", () => {
    const items = getAllowedNavigation("HR & Compliance").map(item => item.label);

    expect(items).toContain("Readiness");
    expect(items).toContain("Controls");
    expect(items).not.toContain("Talent pipeline");
  });

  it("keeps the administrator workspace comprehensive", () => {
    const items = getAllowedNavigation("Administrator").map(item => item.label);

    expect(items).toHaveLength(7);
    expect(items).toContain("Talent pipeline");
    expect(items).toContain("Readiness");
    expect(items).toContain("Time & billing");
  });

  it("falls back to the overview when a role requests an unauthorized workspace", () => {
    expect(resolveWorkspacePage("Consultant", "Readiness")).toBe("Overview");
    expect(resolveWorkspacePage("HR & Compliance", "Readiness")).toBe("Readiness");
  });

  it("calculates interactive onboarding progress from task state", () => {
    expect(countCompletedOnboardingTasks([{ done: true }, { done: false }, { done: true }])).toBe(2);
  });

  it("limits commercial values to the finance role", () => {
    expect(isFinanceRole("Finance")).toBe(true);
    expect(isFinanceRole("Project Manager")).toBe(false);
  });
});

describe("Workforce Hub interactive workflows", () => {
  it("personalizes onboarding by persona and updates checklist progress when a task is completed", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(screen.getByRole("button", { name: "Onboarding" }));
    await user.selectOptions(screen.getByRole("combobox"), "1");

    await screen.findByText("Andre Brooks · Cloud Engineer");
    expect(screen.getByText("4 of 5 completed")).toBeTruthy();

    await user.click(screen.getByText("Manager start confirmation"));
    expect(screen.getByText("5 of 5 completed")).toBeTruthy();
  });

  it("masks commercial figures for a non-finance role and reveals them only after switching to finance", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(screen.getAllByRole("button", { name: "Time & billing" })[0]);
    expect(screen.getAllByText("••••••")).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: /Demo user/ }));
    await user.click(await screen.findByRole("button", { name: /Finance/ }));

    await waitFor(() => expect(screen.getByText("$142/hr")).toBeTruthy());
    expect(screen.getByText("$92/hr")).toBeTruthy();
    expect(screen.getByText("35.2%")).toBeTruthy();
  });

  it("changes the visible approval state when a manager approves time", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(screen.getAllByRole("button", { name: "Time & billing" })[0]);
    await user.click(screen.getByRole("button", { name: "Approve 40 hours" }));

    expect(screen.getByRole("button", { name: /Approved/ })).toBeTruthy();
    expect(screen.getByText("Period ready")).toBeTruthy();
  });

  it("renders the overview fallback when a selected role loses access to the active workspace", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(screen.getAllByRole("button", { name: "Talent pipeline" })[0]);
    expect(screen.getByRole("heading", { name: "Talent pipeline" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /Demo user/ }));
    await user.click(await screen.findByRole("button", { name: /HR & Compliance/ }));

    await waitFor(() => expect(screen.getByText("Good morning, Verton.")).toBeTruthy());
    expect(screen.queryByRole("heading", { name: "Talent pipeline" })).toBeNull();
  });
});
