import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import { createServer } from "node:http";

const { createContextSpy, getOwnedDocumentSpy, recordViewedSpy, storageGetSignedUrlSpy } = vi.hoisted(() => ({
  createContextSpy: vi.fn(),
  getOwnedDocumentSpy: vi.fn(),
  recordViewedSpy: vi.fn(),
  storageGetSignedUrlSpy: vi.fn(),
}));

vi.mock("./_core/context", () => ({ createContext: createContextSpy }));
vi.mock("./db", () => ({ getConsultantOwnedTimesheetEvidenceDocument: getOwnedDocumentSpy, recordConsultantTimesheetEvidenceViewed: recordViewedSpy }));
vi.mock("./storage", () => ({ storageGetSignedUrl: storageGetSignedUrlSpy }));

import { registerConsultantTimesheetEvidenceViewRoute } from "./consultantTimesheetEvidenceViewRoute";

async function openEvidence(path = "/api/consultant/timesheet-evidence/91") {
  const app = express();
  registerConsultantTimesheetEvidenceViewRoute(app);
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Consultant evidence-view test server did not start");
  try {
    return await fetch(`http://127.0.0.1:${address.port}${path}`);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

describe("Consultant own-timesheet-evidence handoff", () => {
  const realFetch = globalThis.fetch;

  beforeEach(() => {
    createContextSpy.mockReset();
    getOwnedDocumentSpy.mockReset();
    recordViewedSpy.mockReset();
    storageGetSignedUrlSpy.mockReset();
    createContextSpy.mockResolvedValue({ user: { id: 71, role: "consultant" } });
    getOwnedDocumentSpy.mockResolvedValue({ fileKey: "consultant-timesheets/71/private.pdf", mimeType: "application/pdf", originalFileName: "approved-week.pdf" });
    recordViewedSpy.mockResolvedValue(undefined);
    storageGetSignedUrlSpy.mockResolvedValue("https://signed.private.example/timesheet");
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => String(input).startsWith("https://signed.private.example/") ? new Response(Buffer.from("private-timesheet-bytes"), { status: 200, headers: { "Content-Type": "application/pdf" } }) : realFetch(input, init)));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("streams only a same-user Consultant attachment with no-store and anti-sniff headers while keeping private references server-side", async () => {
    const response = await openEvidence();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-security-policy")).toBe("sandbox");
    expect(response.headers.get("content-disposition")).toContain('attachment; filename="approved-week.pdf"');
    expect(response.headers.get("content-type")).toContain("application/pdf");
    expect(await response.text()).toBe("private-timesheet-bytes");
    expect(getOwnedDocumentSpy).toHaveBeenCalledWith(71, 91);
    expect(storageGetSignedUrlSpy).toHaveBeenCalledWith("consultant-timesheets/71/private.pdf");
    expect(recordViewedSpy).toHaveBeenCalledWith(71, 91);
    const serialized = JSON.stringify({ headers: Object.fromEntries(response.headers.entries()), body: "private-timesheet-bytes" });
    expect(serialized).not.toContain("consultant-timesheets");
    expect(serialized).not.toContain("signed.private.example");
    expect(serialized).not.toContain("fileSha256");
  });

  it("rejects unauthenticated and all non-Consultant roles before evidence or storage access", async () => {
    createContextSpy.mockResolvedValueOnce({ user: null });
    expect((await openEvidence()).status).toBe(401);
    for (const role of ["admin", "recruiter", "hr_compliance", "account_manager", "delivery_manager", "project_manager", "finance"] as const) {
      createContextSpy.mockResolvedValueOnce({ user: { id: 8, role } });
      expect((await openEvidence()).status).toBe(403);
    }
    expect(getOwnedDocumentSpy).not.toHaveBeenCalled();
    expect(storageGetSignedUrlSpy).not.toHaveBeenCalled();
  });

  it("safely denies malformed, foreign-evidence, foreign-time-entry, removed, and unsupported-source requests", async () => {
    expect((await openEvidence("/api/consultant/timesheet-evidence/nope")).status).toBe(400);
    getOwnedDocumentSpy.mockResolvedValueOnce(undefined);
    expect((await openEvidence()).status).toBe(404);
    getOwnedDocumentSpy.mockResolvedValueOnce(undefined);
    expect((await openEvidence()).status).toBe(404);
    getOwnedDocumentSpy.mockResolvedValueOnce({ fileKey: "consultant-timesheets/71/private.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", originalFileName: "private.docx" });
    expect((await openEvidence()).status).toBe(415);
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => String(input).startsWith("https://signed.private.example/") ? new Response(null, { status: 404 }) : realFetch(input, init)));
    expect((await openEvidence()).status).toBe(404);
    expect(recordViewedSpy).not.toHaveBeenCalled();
  });
});
