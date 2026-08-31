export const MAX_TIMESHEET_EVIDENCE_BYTES = 5 * 1024 * 1024;

export const allowedTimesheetEvidenceMimeTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const;

export type TimesheetEvidenceMetadata = {
  fileName: string;
  mimeType: string;
  fileSize: number;
};

function extensionFor(fileName: string) {
  return fileName.trim().toLowerCase().split(".").pop() ?? "";
}

export function validateTimesheetEvidenceMetadata(input: TimesheetEvidenceMetadata) {
  const fileName = input.fileName.trim().replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 255);
  const extension = extensionFor(fileName);
  const expectedMimeType = extension === "pdf"
    ? "application/pdf"
    : ["jpg", "jpeg"].includes(extension)
      ? "image/jpeg"
      : extension === "png"
        ? "image/png"
        : undefined;

  if (!fileName || !expectedMimeType) throw new Error("Upload a PDF, PNG, or JPEG timesheet.");
  if (input.mimeType !== expectedMimeType || !allowedTimesheetEvidenceMimeTypes.includes(input.mimeType as (typeof allowedTimesheetEvidenceMimeTypes)[number])) {
    throw new Error("The timesheet file type does not match the approved format.");
  }
  if (!Number.isInteger(input.fileSize) || input.fileSize < 1 || input.fileSize > MAX_TIMESHEET_EVIDENCE_BYTES) {
    throw new Error("Timesheet uploads must be between 1 byte and 5 MB.");
  }
  return { fileName, extension };
}

export function validateTimesheetEvidenceBytes(input: TimesheetEvidenceMetadata & { bytes: Buffer }) {
  const { fileName, extension } = validateTimesheetEvidenceMetadata(input);
  const bytes = input.bytes;
  const isPdf = bytes.subarray(0, 4).toString() === "%PDF";
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if ((extension === "pdf" && !isPdf) || (extension === "png" && !isPng) || (["jpg", "jpeg"].includes(extension) && !isJpeg)) {
    throw new Error("The uploaded file signature does not match the selected timesheet format.");
  }
  return { fileName, extension, bytes };
}
