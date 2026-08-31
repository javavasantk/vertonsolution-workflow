import { describe, expect, it } from "vitest";
import { MAX_TIMESHEET_EVIDENCE_BYTES, validateTimesheetEvidenceBytes, validateTimesheetEvidenceMetadata } from "./timesheetEvidenceFileService";

describe("timesheet evidence file validation", () => {
  it("accepts only matching PDF, PNG, and JPEG metadata and binary signatures within the private upload limit", () => {
    expect(validateTimesheetEvidenceMetadata({ fileName: "approved-week.pdf", mimeType: "application/pdf", fileSize: 12 })).toMatchObject({ extension: "pdf" });
    expect(validateTimesheetEvidenceBytes({ fileName: "approved-week.pdf", mimeType: "application/pdf", fileSize: 8, bytes: Buffer.from("%PDF-1.7") })).toMatchObject({ extension: "pdf" });
    expect(validateTimesheetEvidenceBytes({ fileName: "approved-week.png", mimeType: "image/png", fileSize: 8, bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) })).toMatchObject({ extension: "png" });
    expect(validateTimesheetEvidenceBytes({ fileName: "approved-week.jpg", mimeType: "image/jpeg", fileSize: 3, bytes: Buffer.from([0xff, 0xd8, 0xff]) })).toMatchObject({ extension: "jpg" });
  });

  it("rejects unsupported file types, spoofed content signatures, and oversized evidence before storage", () => {
    expect(() => validateTimesheetEvidenceMetadata({ fileName: "approved-week.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", fileSize: 32 })).toThrow("PDF, PNG, or JPEG");
    expect(() => validateTimesheetEvidenceMetadata({ fileName: "approved-week.pdf", mimeType: "image/png", fileSize: 32 })).toThrow("does not match");
    expect(() => validateTimesheetEvidenceBytes({ fileName: "approved-week.pdf", mimeType: "application/pdf", fileSize: 8, bytes: Buffer.from("not-a-pdf") })).toThrow("signature");
    expect(() => validateTimesheetEvidenceMetadata({ fileName: "approved-week.png", mimeType: "image/png", fileSize: MAX_TIMESHEET_EVIDENCE_BYTES + 1 })).toThrow("5 MB");
  });
});
