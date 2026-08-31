import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import { createServer } from "node:http";

const { createContextSpy, getActiveSessionSpy, storagePutAtKeySpy } = vi.hoisted(() => ({
  createContextSpy: vi.fn(),
  getActiveSessionSpy: vi.fn(),
  storagePutAtKeySpy: vi.fn(),
}));

vi.mock("./_core/context", () => ({ createContext: createContextSpy }));
vi.mock("./db", () => ({ getActiveConsultantTimesheetUploadSession: getActiveSessionSpy }));
vi.mock("./storage", () => ({ storagePutAtKey: storagePutAtKeySpy }));

import { registerTimesheetUploadRoute } from "./timesheetUploadRoute";

const session = {
  id: "b6d2ba3c-6f44-4d4c-b7f9-9a457bca80f2",
  userId: 71,
  timeEntryId: 72,
  fileKey: "consultant-timesheets/71/approved-week.pdf",
  originalFileName: "approved-week.pdf",
  mimeType: "application/pdf",
  fileSize: 24,
  expiresAt: new Date(Date.now() + 60_000),
  completedAt: null,
  createdAt: new Date(),
};

async function upload({ mimeType = "application/pdf", body = Buffer.concat([Buffer.from("%PDF-1.7"), Buffer.alloc(16)]) }: { mimeType?: string; body?: Buffer } = {}) {
  const app = express();
  registerTimesheetUploadRoute(app);
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Timesheet upload test server did not start");
  try {
    return await fetch(`http://127.0.0.1:${address.port}/api/consultant/timesheet-upload/${session.id}`, { method: "PUT", headers: { "content-type": mimeType }, body });
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

describe("cookie-authenticated consultant timesheet upload endpoint", () => {
  beforeEach(() => {
    createContextSpy.mockReset();
    getActiveSessionSpy.mockReset();
    storagePutAtKeySpy.mockReset();
    createContextSpy.mockResolvedValue({ user: { id: 71, role: "consultant" } });
    getActiveSessionSpy.mockResolvedValue(session);
    storagePutAtKeySpy.mockResolvedValue({ key: session.fileKey, url: "/manus-storage/private" });
  });

  afterEach(() => vi.clearAllMocks());

  it("stores only consultant-owned PDF bytes at the private pre-approved session key", async () => {
    const response = await upload();
    expect(response.status).toBe(204);
    expect(getActiveSessionSpy).toHaveBeenCalledWith(71, session.id);
    expect(storagePutAtKeySpy).toHaveBeenCalledWith(session.fileKey, expect.any(Buffer), "application/pdf");
  });

  it("rejects other roles, unavailable sessions, spoofed file signatures, MIME mismatches, and wrong byte counts", async () => {
    createContextSpy.mockResolvedValueOnce({ user: { id: 71, role: "finance" } });
    expect((await upload()).status).toBe(403);

    getActiveSessionSpy.mockResolvedValueOnce(undefined);
    expect((await upload()).status).toBe(400);

    expect((await upload({ mimeType: "image/png" })).status).toBe(400);
    expect((await upload({ body: Buffer.alloc(24) })).status).toBe(400);
    expect((await upload({ body: Buffer.concat([Buffer.from("%PDF-1.7"), Buffer.alloc(15)]) })).status).toBe(400);
    expect(storagePutAtKeySpy).not.toHaveBeenCalled();
  });
});
