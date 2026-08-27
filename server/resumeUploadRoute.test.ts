import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import { createServer } from "node:http";

const { createContextSpy, getActiveSessionSpy, storagePutAtKeySpy } = vi.hoisted(() => ({
  createContextSpy: vi.fn(),
  getActiveSessionSpy: vi.fn(),
  storagePutAtKeySpy: vi.fn(),
}));

vi.mock("./_core/context", () => ({ createContext: createContextSpy }));
vi.mock("./db", () => ({ getActiveResumeUploadSession: getActiveSessionSpy }));
vi.mock("./storage", () => ({ storagePutAtKey: storagePutAtKeySpy }));

import { registerResumeUploadRoute } from "./resumeUploadRoute";

const session = {
  id: "f4c4c2a6-17fb-4d62-b119-784831553898",
  userId: 71,
  fileKey: "recruiter-resumes/71/alex-morgan.pdf",
  originalFileName: "alex-morgan.pdf",
  mimeType: "application/pdf",
  fileSize: 24,
  expiresAt: new Date(Date.now() + 60_000),
  completedAt: null,
  createdAt: new Date(),
};

async function upload({ mimeType = "application/pdf", body = new Uint8Array(24) }: { mimeType?: string; body?: Uint8Array } = {}) {
  const app = express();
  registerResumeUploadRoute(app);
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Upload test server did not start");
  try {
    return await fetch(`http://127.0.0.1:${address.port}/api/recruiter/resume-upload/${session.id}`, {
      method: "PUT",
      headers: { "content-type": mimeType },
      body,
    });
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

describe("cookie-authenticated resume upload endpoint", () => {
  beforeEach(() => {
    createContextSpy.mockReset();
    getActiveSessionSpy.mockReset();
    storagePutAtKeySpy.mockReset();
    createContextSpy.mockResolvedValue({ user: { id: 71, role: "recruiter" } });
    getActiveSessionSpy.mockResolvedValue(session);
    storagePutAtKeySpy.mockResolvedValue({ key: session.fileKey, url: "/manus-storage/private" });
  });

  afterEach(() => vi.clearAllMocks());

  it("stores recruiter-owned approved bytes at the private session key only", async () => {
    const response = await upload();
    expect(response.status).toBe(204);
    expect(getActiveSessionSpy).toHaveBeenCalledWith(71, session.id);
    expect(storagePutAtKeySpy).toHaveBeenCalledWith(session.fileKey, expect.any(Buffer), "application/pdf");
  });

  it("rejects non-recruiters, invalid/foreign sessions, MIME mismatches, and wrong byte counts", async () => {
    createContextSpy.mockResolvedValueOnce({ user: { id: 71, role: "consultant" } });
    expect((await upload()).status).toBe(403);

    getActiveSessionSpy.mockResolvedValueOnce(undefined);
    expect((await upload()).status).toBe(400);

    expect((await upload({ mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })).status).toBe(400);
    expect((await upload({ body: new Uint8Array(23) })).status).toBe(400);
    expect(storagePutAtKeySpy).not.toHaveBeenCalled();
  });
});
