import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import { createServer } from "node:http";

const { createContextSpy, getDocumentSpy, storageGetSignedUrlSpy } = vi.hoisted(() => ({
  createContextSpy: vi.fn(),
  getDocumentSpy: vi.fn(),
  storageGetSignedUrlSpy: vi.fn(),
}));

vi.mock("./_core/context", () => ({ createContext: createContextSpy }));
vi.mock("./db", () => ({ getFinanceTimesheetEvidenceDocument: getDocumentSpy }));
vi.mock("./storage", () => ({ storageGetSignedUrl: storageGetSignedUrlSpy }));

import { registerTimesheetEvidenceReviewRoute } from "./timesheetEvidenceReviewRoute";

async function openEvidence(path = "/api/finance/timesheet-evidence/91") {
  const app = express();
  registerTimesheetEvidenceReviewRoute(app);
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Evidence review test server did not start");
  try {
    return await fetch(`http://127.0.0.1:${address.port}${path}`, { redirect: "manual" });
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

describe("Finance private timesheet evidence handoff", () => {
  beforeEach(() => {
    createContextSpy.mockReset();
    getDocumentSpy.mockReset();
    storageGetSignedUrlSpy.mockReset();
    createContextSpy.mockResolvedValue({ user: { id: 8, role: "finance" } });
    getDocumentSpy.mockResolvedValue({ fileKey: "consultant-timesheets/71/private.pdf", mimeType: "application/pdf", originalFileName: "approved-week.pdf" });
    storageGetSignedUrlSpy.mockResolvedValue("https://signed.private.example/timesheet");
  });

  afterEach(() => vi.clearAllMocks());

  it("uses an authenticated Finance session to issue a no-store redirect without returning the object key", async () => {
    const response = await openEvidence();
    expect(response.status).toBe(307);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("location")).toBe("https://signed.private.example/timesheet");
    expect(await response.text()).not.toContain("consultant-timesheets");
    expect(getDocumentSpy).toHaveBeenCalledWith(91);
    expect(storageGetSignedUrlSpy).toHaveBeenCalledWith("consultant-timesheets/71/private.pdf");
  });

  it("rejects non-Finance sessions, malformed IDs, and absent evidence before accessing private storage", async () => {
    createContextSpy.mockResolvedValueOnce({ user: { id: 71, role: "consultant" } });
    expect((await openEvidence()).status).toBe(403);
    expect((await openEvidence("/api/finance/timesheet-evidence/nope")).status).toBe(400);
    getDocumentSpy.mockResolvedValueOnce(undefined);
    expect((await openEvidence()).status).toBe(404);
    expect(storageGetSignedUrlSpy).not.toHaveBeenCalled();
  });
});
