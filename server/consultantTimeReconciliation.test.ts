import { describe, expect, it } from "vitest";
import { buildConsultantTimeReconciliation } from "./db";

describe("Consultant time reconciliation arithmetic", () => {
  it("sorts only supplied own-record rows and returns deterministic entered totals, bounded OCR differences, and safe no-OCR states", () => {
    const result = buildConsultantTimeReconciliation(
      [
        { id: 72, weekEnding: new Date("2026-08-23"), hours: 40, status: "submitted" as const },
        { id: 73, weekEnding: new Date("2026-08-16"), hours: 32, status: "draft" as const },
      ],
      [
        { id: 91, timeEntryId: 72, originalFileName: "approved-week.pdf", mimeType: "application/pdf", extractionStatus: "extracted" as const, extractedHours: 38, extractionConfidence: "medium" as const, createdAt: new Date("2026-08-26") },
        { id: 92, timeEntryId: 73, originalFileName: "pending-week.png", mimeType: "image/png", extractionStatus: "needs_human_review" as const, extractedHours: null, extractionConfidence: "low" as const, createdAt: new Date("2026-08-25") },
      ],
      new Set([91]),
      new Map([[91, [{ note: "Confirm the factual visible totals with the designated human reviewer.", createdAt: new Date("2026-08-26") }]]]),
    );

    expect(result).toMatchObject({ entryCount: 2, enteredHoursTotal: 72, evidenceCount: 2, ocrResultCount: 1 });
    expect(result.rows[0]).toMatchObject({ timeEntryId: 72, enteredHours: 40, status: "submitted" });
    expect(result.rows[0].evidence[0]).toMatchObject({ extractedHours: 38, differenceHours: 2, comparisonLabel: "Human comparison needed", reviewerAssigned: true });
    expect(result.rows[1].evidence[0]).toMatchObject({ extractedHours: null, differenceHours: null, comparisonLabel: "No OCR result", reviewerAssigned: false });
    expect(result.rows[0].evidence[0]).not.toHaveProperty("fileKey");
    expect(result.rows[0].evidence[0]).not.toHaveProperty("reviewerName");
    expect(result.rows[0].evidence[0]).not.toHaveProperty("commercialValue");
  });
});
