import { describe, expect, it, vi } from "vitest";
import { extractTimesheetTotalHours } from "./timesheetOcrService";

describe("timesheet OCR total-hours extraction", () => {
  it("returns only a bounded total-hours extraction for human review from a private signed file URL", async () => {
    const model = vi.fn().mockResolvedValue({ model: "gemini-3-flash-preview", choices: [{ message: { content: JSON.stringify({ totalHours: 40, confidence: "high" }) } }] });

    await expect(extractTimesheetTotalHours({ signedFileUrl: "https://private.example/timesheet.pdf", mimeType: "application/pdf" }, model)).resolves.toEqual({ extractionStatus: "extracted", extractedHours: 40, extractionConfidence: "high" });
    expect(model).toHaveBeenCalledWith(expect.objectContaining({ model: "gemini-3-flash-preview", maxTokens: 300, messages: expect.arrayContaining([expect.objectContaining({ role: "user", content: expect.arrayContaining([expect.objectContaining({ type: "file_url", file_url: expect.objectContaining({ url: "https://private.example/timesheet.pdf", mime_type: "application/pdf" }) })]) })]) }));
  });

  it("uses a safe human-review fallback when OCR cannot produce an unambiguous total", async () => {
    const noTotal = vi.fn().mockResolvedValue({ model: "gemini-3-flash-preview", choices: [{ message: { content: JSON.stringify({ totalHours: null, confidence: "low" }) } }] });
    const unavailable = vi.fn().mockRejectedValue(new Error("unavailable"));

    await expect(extractTimesheetTotalHours({ signedFileUrl: "https://private.example/timesheet.png", mimeType: "image/png" }, noTotal)).resolves.toEqual({ extractionStatus: "needs_human_review", extractedHours: null, extractionConfidence: "low" });
    await expect(extractTimesheetTotalHours({ signedFileUrl: "https://private.example/timesheet.png", mimeType: "image/png" }, unavailable)).resolves.toEqual({ extractionStatus: "needs_human_review", extractedHours: null, extractionConfidence: "low" });
  });
});
