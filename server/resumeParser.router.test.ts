import { beforeEach, describe, expect, it, vi } from "vitest";

const { parseRecruiterResumeSpy, createCandidateProfileSpy, updateCandidateProfileSpy } = vi.hoisted(() => ({ parseRecruiterResumeSpy: vi.fn(), createCandidateProfileSpy: vi.fn(), updateCandidateProfileSpy: vi.fn() }));

vi.mock("./resumeParserService", () => ({ parseRecruiterResume: parseRecruiterResumeSpy }));
vi.mock("./db", () => ({ createCandidateProfile: createCandidateProfileSpy, updateCandidateProfile: updateCandidateProfileSpy }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(role: "admin" | "recruiter" | "consultant"): TrpcContext {
  return {
    user: { id: 91, openId: "resume-parser-test-user", email: "resume@test.local", name: "Resume Test User", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as TrpcContext["res"],
  };
}

const resumeText = "Alex Morgan is a full-stack engineer with TypeScript, React, AWS, cloud delivery, and six years of documented experience across web platforms.";

describe("recruiting.parseResume", () => {
  beforeEach(() => { parseRecruiterResumeSpy.mockReset(); createCandidateProfileSpy.mockReset(); updateCandidateProfileSpy.mockReset(); createCandidateProfileSpy.mockResolvedValue({ id: 1, candidateName: "Alex Morgan" }); });

  it("allows recruiters to parse bounded resume text", async () => {
    parseRecruiterResumeSpy.mockResolvedValue({ profile: { candidateName: "Alex Morgan", skills: ["TypeScript"] }, model: "test", unavailable: false });
    const caller = appRouter.createCaller(createContext("recruiter"));

    await expect(caller.recruiting.parseResume({ resumeText })).resolves.toMatchObject({ profile: { candidateName: "Alex Morgan" } });
    expect(parseRecruiterResumeSpy).toHaveBeenCalledWith(resumeText);
    expect(createCandidateProfileSpy).toHaveBeenCalledWith(91, expect.objectContaining({ candidateName: "Alex Morgan", skills: ["TypeScript"] }));
  });

  it("returns a safe non-persisting result when managed extraction is unavailable", async () => {
    parseRecruiterResumeSpy.mockResolvedValue({ profile: { candidateName: "", confidence: "low", recruiterNotes: ["Continue with human review."], skills: [] }, model: "unavailable", unavailable: true });
    const caller = appRouter.createCaller(createContext("recruiter"));

    await expect(caller.recruiting.parseResume({ resumeText })).resolves.toMatchObject({ unavailable: true, candidate: null, profile: { confidence: "low" } });
    expect(createCandidateProfileSpy).not.toHaveBeenCalled();
  });

  it("allows recruiters to persist reviewed inline candidate updates", async () => {
    updateCandidateProfileSpy.mockResolvedValue({ id: 1, candidateName: "Alex Morgan", skills: ["TypeScript", "React"] });
    const input = { candidateId: 1, candidateName: "Alex Morgan", location: "Austin, TX", yearsExperience: "6 years", skills: ["TypeScript", "React"] };
    await expect(appRouter.createCaller(createContext("recruiter")).recruiting.updateCandidate(input)).resolves.toMatchObject({ candidateName: "Alex Morgan" });
    expect(updateCandidateProfileSpy).toHaveBeenCalledWith(1, 91, expect.objectContaining({ skills: ["TypeScript", "React"] }));
  });

  it("rejects invalid candidate curation fields before the database mutation", async () => {
    const caller = appRouter.createCaller(createContext("recruiter"));
    await expect(caller.recruiting.updateCandidate({ candidateId: 1, candidateName: "A", location: "Austin, TX", yearsExperience: "6 years", skills: ["TypeScript"] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.recruiting.updateCandidate({ candidateId: 1, candidateName: "Alex Morgan", location: "Austin, TX", yearsExperience: "6 years", skills: Array.from({ length: 21 }, (_, index) => `Skill ${index}`) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(updateCandidateProfileSpy).not.toHaveBeenCalled();
  });

  it("allows administrators and rejects consultants", async () => {
    parseRecruiterResumeSpy.mockResolvedValue({ profile: { candidateName: "Alex Morgan" }, model: "test", unavailable: false });
    await expect(appRouter.createCaller(createContext("admin")).recruiting.parseResume({ resumeText })).resolves.toMatchObject({ model: "test" });
    await expect(appRouter.createCaller(createContext("consultant")).recruiting.parseResume({ resumeText })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects too-short resume text before parsing", async () => {
    const caller = appRouter.createCaller(createContext("recruiter"));
    await expect(caller.recruiting.parseResume({ resumeText: "too short" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(parseRecruiterResumeSpy).not.toHaveBeenCalled();
  });

  it("rejects resume text above the 12,000-character privacy bound before parsing", async () => {
    const caller = appRouter.createCaller(createContext("recruiter"));
    await expect(caller.recruiting.parseResume({ resumeText: "x".repeat(12_001) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(parseRecruiterResumeSpy).not.toHaveBeenCalled();
  });
});
