import { beforeEach, describe, expect, it, vi } from "vitest";

const { lookupSpy, assistantSpy } = vi.hoisted(() => ({ lookupSpy: vi.fn(), assistantSpy: vi.fn() }));

vi.mock("./db", () => ({ getWorkspaceAssistantLookup: lookupSpy }));
vi.mock("./aiService", () => ({ generateWorkspaceAssistantReply: assistantSpy, generateAiBriefing: vi.fn() }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(role: "recruiter" | "consultant"): TrpcContext {
  return {
    user: { id: 77, openId: "assistant-lookup-test", email: "lookup@test.local", name: "Lookup Test", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as TrpcContext["res"],
  };
}

describe("ai.workspaceAssistant database lookups", () => {
  beforeEach(() => { lookupSpy.mockReset(); assistantSpy.mockReset(); });

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

  it("keeps unsupported-role prompts bounded when no database lookup is applicable", async () => {
    lookupSpy.mockResolvedValue({ kind: "none", context: "No database lookup applies to this question. Provide workflow guidance only.", records: [] });
    assistantSpy.mockResolvedValue({ reply: "Continue with the designated human owner.", model: "test", unavailable: false });

    await expect(appRouter.createCaller(createContext("consultant")).ai.workspaceAssistant({ page: "Overview", prompt: "Find candidate profiles with TypeScript skills" })).resolves.toMatchObject({ lookupKind: "none", records: [] });
    expect(assistantSpy).toHaveBeenCalledWith(expect.objectContaining({ databaseContext: expect.stringContaining("No database lookup") }));
  });
});
