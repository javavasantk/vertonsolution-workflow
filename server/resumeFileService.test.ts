import { describe, expect, it } from "vitest";
import { decodeAndValidateResume, MAX_RESUME_BYTES } from "./resumeFileService";

describe("resume file validation", () => {
  it("accepts a PDF with matching extension, MIME type, and magic bytes", () => {
    const result = decodeAndValidateResume({ fileName: "alex-morgan.pdf", mimeType: "application/pdf", base64: Buffer.from("%PDF-1.7 sample").toString("base64") });
    expect(result.fileName).toBe("alex-morgan.pdf");
  });

  it("rejects unsupported formats, mismatched bytes, and oversized files", () => {
    expect(() => decodeAndValidateResume({ fileName: "alex.txt", mimeType: "text/plain", base64: Buffer.from("resume").toString("base64") })).toThrow(/PDF or DOCX/);
    expect(() => decodeAndValidateResume({ fileName: "alex.pdf", mimeType: "application/pdf", base64: Buffer.from("not a PDF").toString("base64") })).toThrow(/valid PDF/);
    expect(() => decodeAndValidateResume({ fileName: "alex.pdf", mimeType: "application/pdf", base64: Buffer.concat([Buffer.from("%PDF"), Buffer.alloc(MAX_RESUME_BYTES)]).toString("base64") })).toThrow(/5 MB/);
  });
});
