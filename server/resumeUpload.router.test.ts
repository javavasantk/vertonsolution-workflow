import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { validateResumeMetadataSpy, extractResumeTextFromBytesSpy, parseRecruiterResumeSpy, storageGetSignedUrlSpy, createResumeUploadSessionSpy, getActiveResumeUploadSessionSpy, completeResumeUploadSessionSpy, createCandidateProfileSpy } = vi.hoisted(() => ({ validateResumeMetadataSpy: vi.fn(), extractResumeTextFromBytesSpy: vi.fn(), parseRecruiterResumeSpy: vi.fn(), storageGetSignedUrlSpy: vi.fn(), createResumeUploadSessionSpy: vi.fn(), getActiveResumeUploadSessionSpy: vi.fn(), completeResumeUploadSessionSpy: vi.fn(), createCandidateProfileSpy: vi.fn() }));

vi.mock("./resumeFileService", () => ({ validateResumeMetadata: validateResumeMetadataSpy, extractResumeTextFromBytes: extractResumeTextFromBytesSpy }));
vi.mock("./resumeParserService", () => ({ parseRecruiterResume: parseRecruiterResumeSpy }));
vi.mock("./storage", () => ({ storageGetSignedUrl: storageGetSignedUrlSpy }));
vi.mock("./db", () => ({ createResumeUploadSession: createResumeUploadSessionSpy, getActiveResumeUploadSession: getActiveResumeUploadSessionSpy, completeResumeUploadSession: completeResumeUploadSessionSpy, createCandidateProfile: createCandidateProfileSpy }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(role: "admin" | "recruiter" | "consultant"): TrpcContext {
  return { user: { id: 64, openId: "upload-test", email: "upload@test.local", name: "Upload Tester", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: vi.fn() } as TrpcContext["res"] };
}

const input = { fileName: "alex-morgan.pdf", mimeType: "application/pdf" as const, fileSize: 24 };
const session = { id: "f4c4c2a6-17fb-4d62-b119-784831553898", userId: 64, fileKey: "recruiter-resumes/64/alex.pdf_hash", originalFileName: "alex-morgan.pdf", mimeType: "application/pdf", fileSize: 24, expiresAt: new Date(Date.now() + 60_000), completedAt: null, createdAt: new Date() };

describe("recruiting signed resume upload", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new Uint8Array(24).buffer }));
    validateResumeMetadataSpy.mockReset(); extractResumeTextFromBytesSpy.mockReset(); parseRecruiterResumeSpy.mockReset(); storageGetSignedUrlSpy.mockReset(); createResumeUploadSessionSpy.mockReset(); getActiveResumeUploadSessionSpy.mockReset(); completeResumeUploadSessionSpy.mockReset(); createCandidateProfileSpy.mockReset();
    validateResumeMetadataSpy.mockReturnValue({ fileName: input.fileName, extension: "pdf" });
    createResumeUploadSessionSpy.mockResolvedValue({ id: session.id, fileKey: session.fileKey, expiresAt: session.expiresAt });
    getActiveResumeUploadSessionSpy.mockResolvedValue(session);
    storageGetSignedUrlSpy.mockResolvedValue("https://download.example.test/resume");
    extractResumeTextFromBytesSpy.mockResolvedValue({ fileName: input.fileName, bytes: Buffer.alloc(24), text: "Alex Morgan has TypeScript, React, AWS, and documented full-stack delivery experience." });
    parseRecruiterResumeSpy.mockResolvedValue({ unavailable: false, model: "test", profile: { candidateName: "Alex Morgan", email: "alex@example.com", phone: "", location: "Austin, TX", professionalSummary: "Engineer", yearsExperience: "6 years", skills: ["TypeScript"], recentRoles: [], education: [], recruiterNotes: ["Human review required"], confidence: "high" } });
    createCandidateProfileSpy.mockResolvedValue({ id: 8, candidateName: "Alex Morgan", skills: ["TypeScript"] });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("issues a recruiter-bound short-lived target then completes parsing from stored bytes", async () => {
    const caller = appRouter.createCaller(context("recruiter"));
    const prepared = await caller.recruiting.prepareResumeUpload(input);
    expect(prepared).toMatchObject({ sessionId: session.id, uploadPath: `/api/recruiter/resume-upload/${session.id}` });
    const completed = await caller.recruiting.completeResumeUpload({ sessionId: session.id });
    expect(completed).toMatchObject({ fileName: "alex-morgan.pdf", candidate: { id: 8 } });
    expect(createCandidateProfileSpy).toHaveBeenCalledWith(64, expect.objectContaining({ candidateName: "Alex Morgan" }), expect.objectContaining({ fileKey: session.fileKey }));
    expect(completeResumeUploadSessionSpy).toHaveBeenCalledWith(session.id);
  });

  it("retries a short-lived private retrieval failure before parsing the uploaded bytes", async () => {
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new Uint8Array(24).buffer });
    vi.stubGlobal("fetch", fetchSpy);

    await expect(appRouter.createCaller(context("recruiter")).recruiting.completeResumeUpload({ sessionId: session.id })).resolves.toMatchObject({ fileName: "alex-morgan.pdf", candidate: { id: 8 } });
    expect(storageGetSignedUrlSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("rejects non-recruiters and invalid upload metadata before a storage target is created", async () => {
    await expect(appRouter.createCaller(context("consultant")).recruiting.prepareResumeUpload(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context("recruiter")).recruiting.prepareResumeUpload({ ...input, mimeType: "text/plain" as any })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("returns a safe human-review fallback and closes the upload session when AI parsing is unavailable", async () => {
    parseRecruiterResumeSpy.mockResolvedValue({ unavailable: true, model: "unavailable", profile: { candidateName: "", email: "", phone: "", location: "", professionalSummary: "", yearsExperience: "", skills: [], recentRoles: [], education: [], recruiterNotes: ["No automated candidate decision was made. Continue with human review."], confidence: "low" } });
    const result = await appRouter.createCaller(context("recruiter")).recruiting.completeResumeUpload({ sessionId: session.id });
    expect(result).toMatchObject({ unavailable: true, candidate: null });
    expect(createCandidateProfileSpy).not.toHaveBeenCalled();
    expect(completeResumeUploadSessionSpy).toHaveBeenCalledWith(session.id);
  });
});
