import { beforeEach, describe, expect, it, vi } from "vitest";

const { parseRecruiterResumeSpy, createCandidateProfileSpy } = vi.hoisted(() => ({ parseRecruiterResumeSpy: vi.fn(), createCandidateProfileSpy: vi.fn() }));

vi.mock("./resumeParserService", () => ({ parseRecruiterResume: parseRecruiterResumeSpy }));
vi.mock("./db", () => ({ createCandidateProfile: createCandidateProfileSpy }));

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
  beforeEach(() => { parseRecruiterResumeSpy.mockReset(); createCandidateProfileSpy.mockReset(); createCandidateProfileSpy.mockResolvedValue({ id: 1, candidateName: "Alex Morgan" }); });

  it("allows recruiters to parse bounded resume text", async () => {
    parseRecruiterResumeSpy.mockResolvedValue({ profile: { candidateName: "Alex Morgan", skills: ["TypeScript"] }, model: "test", unavailable: false });
    const caller = appRouter.createCaller(createContext("recruiter"));

    await expect(caller.recruiting.parseResume({ resumeText })).resolves.toMatchObject({ profile: { candidateName: "Alex Morgan" } });
    expect(parseRecruiterResumeSpy).toHaveBeenCalledWith(resumeText);
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
});
