import { createHash } from "node:crypto";
import { storageGetSignedUrl } from "./storage";
import { validateTimesheetEvidenceBytes } from "./timesheetEvidenceFileService";
import { extractTimesheetTotalHours, type TimesheetOcrResult } from "./timesheetOcrService";

type StoredTimesheetFile = {
  fileKey: string;
  originalFileName: string;
  mimeType: "application/pdf" | "image/png" | "image/jpeg";
  fileSize: number;
};

async function readAndValidatePrivateTimesheet(input: StoredTimesheetFile) {
  const signedFileUrl = await storageGetSignedUrl(input.fileKey);
  const response = await fetch(signedFileUrl);
  if (!response.ok) throw new Error("The uploaded timesheet file could not be retrieved securely.");
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length !== input.fileSize) throw new Error("The stored timesheet file does not match the approved upload size.");
  validateTimesheetEvidenceBytes({ fileName: input.originalFileName, mimeType: input.mimeType, fileSize: bytes.length, bytes });
  return { signedFileUrl, bytes };
}

/** Retrieves a private consultant-owned object server-side and returns no document content, only a file digest and bounded OCR result. */
export async function processPrivateTimesheetForHours(input: StoredTimesheetFile): Promise<{ fileSha256: string; ocr: TimesheetOcrResult }> {
  const { signedFileUrl, bytes } = await readAndValidatePrivateTimesheet(input);
  const fileSha256 = createHash("sha256").update(bytes).digest("hex");
  const ocr = await extractTimesheetTotalHours({ signedFileUrl, mimeType: input.mimeType });
  return { fileSha256, ocr };
}
