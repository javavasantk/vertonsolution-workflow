import { beforeEach, describe, expect, it, vi } from "vitest";

const { lookupSpy, consultantLookupSpy, assistantSpy } = vi.hoisted(() => ({ lookupSpy: vi.fn(), consultantLookupSpy: vi.fn(), assistantSpy: vi.fn() }));

vi.mock("./db", () => ({ getWorkspaceAssistantLookup: lookupSpy, getConsultantWorkspaceAssistantLookup: consultantLookupSpy }));
vi.mock("./aiService", () => ({ generateWorkspaceAssistantReply: assistantSpy, generateAiBriefing: vi.fn() }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(role: "recruiter" | "consultant" | "user" | "finance"): TrpcContext {
  return {
    user: { id: 77, openId: "assistant-lookup-test", email: "lookup@test.local", name: "Lookup Test", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as TrpcContext["res"],
  };
}

describe("ai.workspaceAssistant database lookups", () => {
  beforeEach(() => { lookupSpy.mockReset(); consultantLookupSpy.mockReset(); assistantSpy.mockReset(); });

  it("returns recruiter-visible candidate matches through a bounded lookup", async () => {
    lookupSpy.mockResolvedValue({ kind: "candidate", context: "Candidate: Alex Morgan; location: Austin, TX; experience: 6 years; skills: TypeScript, React; review: pending_human_review.", records: [{ id: 1, candidateName: "Alex Morgan", location: "Austin, TX", yearsExperience: "6 years", skills: ["TypeScript", "React"], reviewState: "pending_human_review" }] });
    assistantSpy.mockResolvedValue({ reply: "Alex Morgan is a recruiter-visible match.", model: "test", unavailable: false });

    await expect(appRouter.createCaller(createContext("recruiter")).ai.workspaceAssistant({ page: "New-hire progress", prompt: "Find candidate profiles with TypeScript skills" })).resolves.toMatchObject({ lookupKind: "candidate", records: [{ candidateName: "Alex Morgan" }] });
    expect(lookupSpy).toHaveBeenCalledWith("recruiter", "Find candidate profiles with TypeScript skills");
    expect(assistantSpy).toHaveBeenCalledWith(expect.objectContaining({ databaseContext: expect.stringContaining("Alex Morgan") }));
    expect(JSON.stringify(assistantSpy.mock.calls[0]?.[0]?.databaseContext)).not.toMatch(/resume|upload|readiness|workAuthorization|email|phone/i);
  });

  it("returns database-backed project status records through a bounded lookup", async () => {
    lookupSpy.mockResolvedValue({ kind: "project", context: "Project: Northstar Commerce Cloud · Demo; status: active; manager: Casey Rivera.", records: [{ id: 1, name: "Northstar Commerce Cloud · Demo", deliveryStatus: "active", projectManagerName: "Casey Rivera" }] });
    assistantSpy.mockResolvedValue({ reply: "Northstar Commerce Cloud is active and owned by Casey Rivera.", model: "test", unavailable: false });

    await expect(appRouter.createCaller(createContext("recruiter")).ai.workspaceAssistant({ page: "New-hire progress", prompt: "What is the status of the Northstar project?" })).resolves.toMatchObject({ lookupKind: "project", records: [{ deliveryStatus: "active" }] });
    expect(lookupSpy).toHaveBeenCalledWith("recruiter", "What is the status of the Northstar project?");
    expect(assistantSpy).toHaveBeenCalledWith(expect.objectContaining({ databaseContext: expect.stringContaining("Northstar Commerce Cloud") }));
  });

  it("keeps unsupported Consultant prompts bounded when no own-record lookup is applicable", async () => {
    consultantLookupSpy.mockResolvedValue({ kind: "none", context: "No protected own-record lookup applies to this question. Provide workflow guidance only.", records: [], unavailable: false });
    assistantSpy.mockResolvedValue({ reply: "Continue with the designated human owner.", model: "test", unavailable: false });

    await expect(appRouter.createCaller(createContext("consultant")).ai.workspaceAssistant({ page: "Overview", prompt: "Find candidate profiles with TypeScript skills" })).resolves.toMatchObject({ lookupKind: "none", records: [] });
    expect(consultantLookupSpy).toHaveBeenCalledWith(77, "Find candidate profiles with TypeScript skills", null);
    expect(lookupSpy).not.toHaveBeenCalled();
    expect(assistantSpy).toHaveBeenCalledWith(expect.objectContaining({ databaseContext: expect.stringContaining("No protected own-record lookup") }));
  });

  it("passes only the Consultant session user and minimal owned onboarding context to the assistant", async () => {
    consultantLookupSpy.mockResolvedValue({
      kind: "consultant_onboarding",
      context: "Onboarding task: Confirm workspace access; completion: assigned; due date: 2026-09-10; owner group: Operations.",
      records: [{ title: "Confirm workspace access", completionState: "assigned", dueDate: "2026-09-10", ownerGroup: "Operations", destination: "/workspace/onboarding" }],
      unavailable: false,
    });
    assistantSpy.mockResolvedValue({ reply: "One own onboarding task is available for the Operations owner group.", model: "test", unavailable: false });

    const result = await appRouter.createCaller(createContext("consultant")).ai.workspaceAssistant({ page: "My work", prompt: "Show my onboarding tasks" });
    expect(result).toMatchObject({ lookupKind: "consultant_onboarding", records: [{ title: "Confirm workspace access", destination: "/workspace/onboarding" }] });
    expect(consultantLookupSpy).toHaveBeenCalledWith(77, "Show my onboarding tasks", null);
    expect(JSON.stringify(assistantSpy.mock.calls[0]?.[0]?.databaseContext)).not.toMatch(/document|storage|reviewer|readiness|authorization|candidate|compensation|payroll|invoice|payment|client/i);
  });

  it("passes an explicit selected period only for a bounded Consultant hours lookup and caps returned matches at five", async () => {
    const records = Array.from({ length: 6 }, (_, index) => ({ periodStart: "2026-09-01", periodEnd: "2026-09-30", enteredHoursTotal: index + 1, entryCount: 1, destination: "/workspace/time-submission" }));
    consultantLookupSpy.mockResolvedValue({ kind: "consultant_period_hours", context: "Selected period total is 40 entered hours.", records, unavailable: false });
    assistantSpy.mockResolvedValue({ reply: "The selected period has an entered-hours total.", model: "test", unavailable: false });

    const result = await appRouter.createCaller(createContext("consultant")).ai.workspaceAssistant({ page: "Time submission", prompt: "How many hours are in my selected period?", periodStartDate: new Date("2026-09-01T00:00:00.000Z"), periodEndDate: new Date("2026-09-30T23:59:59.999Z") });
    expect(result.lookupKind).toBe("consultant_period_hours");
    expect(result.records).toHaveLength(5);
    expect(consultantLookupSpy).toHaveBeenCalledWith(77, "How many hours are in my selected period?", { startDate: new Date("2026-09-01T00:00:00.000Z"), endDate: new Date("2026-09-30T23:59:59.999Z") });
  });

  it("returns a safe unavailable fallback without invoking the model when the Consultant own-record lookup is unavailable", async () => {
    consultantLookupSpy.mockResolvedValue({ kind: "consultant_time_records", context: "The protected own-record lookup is temporarily unavailable.", records: [], unavailable: true });

    await expect(appRouter.createCaller(createContext("consultant")).ai.workspaceAssistant({ page: "Time submission", prompt: "Show my submitted time records" })).resolves.toMatchObject({ unavailable: true, lookupKind: "none", records: [], model: "unavailable" });
    expect(assistantSpy).not.toHaveBeenCalled();
  });

  it("allows the compatibility user role through the own-record path and keeps other roles out of it", async () => {
    consultantLookupSpy.mockResolvedValueOnce({ kind: "consultant_profile_request", context: "No personal profile request history is available.", records: [], unavailable: false });
    lookupSpy.mockResolvedValueOnce({ kind: "none", context: "No database lookup applies to this question. Provide workflow guidance only.", records: [] });
    assistantSpy.mockResolvedValue({ reply: "Continue with the designated human owner.", model: "test", unavailable: false });

    await appRouter.createCaller(createContext("user")).ai.workspaceAssistant({ page: "My profile", prompt: "What is my profile request status?" });
    expect(consultantLookupSpy).toHaveBeenCalledWith(77, "What is my profile request status?", null);

    await appRouter.createCaller(createContext("finance")).ai.workspaceAssistant({ page: "Time & billing", prompt: "What is my profile request status?" });
    expect(lookupSpy).toHaveBeenCalledWith("finance", "What is my profile request status?");
    expect(consultantLookupSpy).toHaveBeenCalledTimes(1);
  });
});
