import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const allowedResumeMimeTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] as const;

export type ResumeUploadInput = {
  fileName: string;
  mimeType: string;
  base64: string;
};

function extensionFor(fileName: string) {
  return fileName.trim().toLowerCase().split(".").pop() ?? "";
}

export function validateResumeMetadata(input: { fileName: string; mimeType: string; fileSize: number }) {
  const fileName = input.fileName.trim().replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 255);
  const extension = extensionFor(fileName);
  if (!fileName || !["pdf", "docx"].includes(extension)) throw new Error("Upload a PDF or DOCX resume.");
  if (!allowedResumeMimeTypes.includes(input.mimeType as (typeof allowedResumeMimeTypes)[number])) throw new Error("The resume file type is not supported.");
  if (!Number.isInteger(input.fileSize) || input.fileSize < 1 || input.fileSize > MAX_RESUME_BYTES) throw new Error("Resume uploads must be between 1 byte and 5 MB.");
  return { fileName, extension };
}

export function decodeAndValidateResume(input: ResumeUploadInput) {
  const bytes = Buffer.from(input.base64, "base64");
  const { fileName, extension } = validateResumeMetadata({ fileName: input.fileName, mimeType: input.mimeType, fileSize: bytes.length });

  if (extension === "pdf" && bytes.subarray(0, 4).toString() !== "%PDF") throw new Error("The uploaded file is not a valid PDF.");
  if (extension === "docx" && bytes.subarray(0, 2).toString() !== "PK") throw new Error("The uploaded file is not a valid DOCX document.");
  return { fileName, extension, bytes };
}

export async function extractResumeTextFromBytes(input: { fileName: string; mimeType: string; bytes: Buffer }) {
  const { fileName, extension } = validateResumeMetadata({ fileName: input.fileName, mimeType: input.mimeType, fileSize: input.bytes.length });
  const bytes = input.bytes;
  if (extension === "pdf" && bytes.subarray(0, 4).toString() !== "%PDF") throw new Error("The uploaded file is not a valid PDF.");
  if (extension === "docx" && bytes.subarray(0, 2).toString() !== "PK") throw new Error("The uploaded file is not a valid DOCX document.");
  let text = "";
  if (extension === "pdf") {
    const parser = new PDFParse({ data: bytes });
    try { text = (await parser.getText()).text; } finally { await parser.destroy(); }
  } else {
    text = (await mammoth.extractRawText({ buffer: bytes })).value;
  }
  const normalized = text.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
  if (normalized.length < 80) throw new Error("No usable resume text was found in this file. Upload a text-based PDF or DOCX document.");
  return { fileName, bytes, text: normalized.slice(0, 12_000) };
}

export async function extractResumeText(input: ResumeUploadInput) {
  const { fileName, bytes } = decodeAndValidateResume(input);
  return extractResumeTextFromBytes({ fileName, mimeType: input.mimeType, bytes });
}
