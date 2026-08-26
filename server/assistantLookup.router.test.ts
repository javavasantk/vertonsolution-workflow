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
    lookupSpy.mockResolvedValue({ kind: "candidate", context: "Candidate: Alex Morgan; skills: TypeScript, React.", records: [{ id: 1, candidateName: "Alex Morgan", skills: ["TypeScript", "React"] }] });
    assistantSpy.mockResolvedValue({ reply: "Alex Morgan is a recruiter-visible match.", model: "test", unavailable: false });

    await expect(appRouter.createCaller(createContext("recruiter")).ai.workspaceAssistant({ page: "New-hire progress", prompt: "Find candidate profiles with TypeScript skills" })).resolves.toMatchObject({ lookupKind: "candidate", records: [{ candidateName: "Alex Morgan" }] });
    expect(lookupSpy).toHaveBeenCalledWith("recruiter", "Find candidate profiles with TypeScript skills");
    expect(assistantSpy).toHaveBeenCalledWith(expect.objectContaining({ databaseContext: expect.stringContaining("Alex Morgan") }));
  });

  it("keeps unsupported-role prompts bounded when no database lookup is applicable", async () => {
    lookupSpy.mockResolvedValue({ kind: "none", context: "No database lookup applies to this question. Provide workflow guidance only.", records: [] });
    assistantSpy.mockResolvedValue({ reply: "Continue with the designated human owner.", model: "test", unavailable: false });

    await expect(appRouter.createCaller(createContext("consultant")).ai.workspaceAssistant({ page: "Overview", prompt: "Find candidate profiles with TypeScript skills" })).resolves.toMatchObject({ lookupKind: "none", records: [] });
    expect(assistantSpy).toHaveBeenCalledWith(expect.objectContaining({ databaseContext: expect.stringContaining("No database lookup") }));
  });
});
