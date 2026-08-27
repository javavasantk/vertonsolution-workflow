import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateAiBriefingSpy, generateWorkspaceAssistantReplySpy } = vi.hoisted(() => ({
  generateAiBriefingSpy: vi.fn(),
  generateWorkspaceAssistantReplySpy: vi.fn(),
}));

vi.mock("./aiService", () => ({
  generateAiBriefing: generateAiBriefingSpy,
  generateWorkspaceAssistantReply: generateWorkspaceAssistantReplySpy,
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(role: "admin" | "recruiter" | "consultant"): TrpcContext {
  return {
    user: {
      id: 51,
      openId: "ai-router-test-user",
      email: "ai-router-test@verton.local",
      name: "AI Router Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as TrpcContext["res"],
  };
}

describe("ai.assist tRPC procedure", () => {
  beforeEach(() => {
    generateAiBriefingSpy.mockReset();
    generateWorkspaceAssistantReplySpy.mockReset();
  });

  it("delivers a recruiter handoff task through the protected procedure", async () => {
    generateAiBriefingSpy.mockResolvedValue({ briefing: "Recruiter summary", task: "recruiter_summary", model: "test", unavailable: false });
    const caller = appRouter.createCaller(createContext("recruiter"));

    await expect(caller.ai.assist({ task: "recruiter_summary", context: "Manager confirmation and assignment follow-up are pending." })).resolves.toMatchObject({ briefing: "Recruiter summary" });
    expect(generateAiBriefingSpy).toHaveBeenCalledWith("recruiter_summary", "Manager confirmation and assignment follow-up are pending.");
  });

  it("delivers onboarding guidance for a consultant through the protected procedure", async () => {
    generateAiBriefingSpy.mockResolvedValue({ briefing: "Onboarding guidance", task: "onboarding_guidance", model: "test", unavailable: false });
    const caller = appRouter.createCaller(createContext("consultant"));

    await expect(caller.ai.assist({ task: "onboarding_guidance", context: "Two onboarding tasks are complete and manager confirmation is needed." })).resolves.toMatchObject({ task: "onboarding_guidance" });
  });

  it("delivers access review only for an administrator", async () => {
    generateAiBriefingSpy.mockResolvedValue({ briefing: "Access review", task: "access_review", model: "test", unavailable: false });
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.ai.assist({ task: "access_review", context: "Role audit records show no changes in the latest review period." })).resolves.toMatchObject({ task: "access_review" });
  });

  it("rejects task-specific AI briefings before model invocation when the role is not authorized", async () => {
    const recruiterCaller = appRouter.createCaller(createContext("recruiter"));
    const consultantCaller = appRouter.createCaller(createContext("consultant"));

    await expect(recruiterCaller.ai.assist({ task: "access_review", context: "Role audit records show no changes in the latest review period." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(consultantCaller.ai.assist({ task: "recruiter_summary", context: "Manager confirmation and assignment follow-up are pending." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(generateAiBriefingSpy).not.toHaveBeenCalled();
  });

  it("rejects invalid bounded context before calling the generation service", async () => {
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.ai.assist({ task: "access_review", context: "short" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.ai.assist({ task: "access_review", context: "x".repeat(1601) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(generateAiBriefingSpy).not.toHaveBeenCalled();
  });

  it("returns the safe unavailable fallback supplied by the generation service", async () => {
    generateAiBriefingSpy.mockResolvedValue({ briefing: "Continue with the designated human owner.", task: "access_review", model: "unavailable", unavailable: true });
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.ai.assist({ task: "access_review", context: "Role audit records show no changes in the latest review period." })).resolves.toMatchObject({ unavailable: true, model: "unavailable" });
  });

  it("returns the safe unavailable fallback for recruiter and consultant task paths", async () => {
    generateAiBriefingSpy.mockResolvedValue({ briefing: "Continue with the designated human owner.", task: "recruiter_summary", model: "unavailable", unavailable: true });
    const recruiterCaller = appRouter.createCaller(createContext("recruiter"));

    await expect(recruiterCaller.ai.assist({ task: "recruiter_summary", context: "Manager confirmation and assignment follow-up are pending." })).resolves.toMatchObject({ unavailable: true });

    generateAiBriefingSpy.mockResolvedValue({ briefing: "Continue with the designated human owner.", task: "onboarding_guidance", model: "unavailable", unavailable: true });
    const consultantCaller = appRouter.createCaller(createContext("consultant"));

    await expect(consultantCaller.ai.assist({ task: "onboarding_guidance", context: "Two onboarding tasks are complete and manager confirmation is needed." })).resolves.toMatchObject({ unavailable: true });
  });

  it("delivers bounded role and workspace context through the floating assistant procedure", async () => {
    generateWorkspaceAssistantReplySpy.mockResolvedValue({ reply: "Use Candidate Finder to review recruiter-visible skills.", model: "test", unavailable: false });
    const caller = appRouter.createCaller(createContext("recruiter"));

    await expect(caller.ai.workspaceAssistant({ page: "New-hire progress", prompt: "How do I use Candidate Finder?" })).resolves.toMatchObject({ reply: "Use Candidate Finder to review recruiter-visible skills." });
    expect(generateWorkspaceAssistantReplySpy).toHaveBeenCalledWith(expect.objectContaining({ role: "recruiter", page: "New-hire progress", prompt: "How do I use Candidate Finder?", databaseContext: expect.stringContaining("candidate") }));
  });

  it("rejects an oversized workspace assistant prompt before calling the model", async () => {
    const caller = appRouter.createCaller(createContext("consultant"));
    await expect(caller.ai.workspaceAssistant({ page: "Overview", prompt: "x".repeat(601) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(generateWorkspaceAssistantReplySpy).not.toHaveBeenCalled();
  });
});
