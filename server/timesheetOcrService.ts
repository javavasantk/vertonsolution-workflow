import { z } from "zod";
import { InvokeParams, InvokeResult, invokeLLM } from "./_core/llm";

const ocrResultSchema = z.object({
  totalHours: z.number().int().min(0).max(168).nullable(),
  confidence: z.enum(["high", "medium", "low"]),
});

const responseSchema = {
  type: "json_schema",
  json_schema: {
    name: "consultant_timesheet_total_hours",
    strict: true,
    schema: {
      type: "object",
      properties: {
        totalHours: { anyOf: [{ type: "integer", minimum: 0, maximum: 168 }, { type: "null" }] },
        confidence: { type: "string", enum: ["high", "medium", "low"] },
      },
      required: ["totalHours", "confidence"],
      additionalProperties: false,
    },
  },
} as const;

type ModelInvoker = (params: InvokeParams) => Promise<InvokeResult>;

export type TimesheetOcrResult = {
  extractionStatus: "extracted" | "needs_human_review";
  extractedHours: number | null;
  extractionConfidence: "high" | "medium" | "low";
};

/**
 * Reads only the total hours printed on a consultant-owned uploaded timesheet.
 * The result is not an approval and never updates the entered hours automatically.
 */
export async function extractTimesheetTotalHours(input: {
  signedFileUrl: string;
  mimeType: "application/pdf" | "image/png" | "image/jpeg";
}, callModel: ModelInvoker = invokeLLM): Promise<TimesheetOcrResult> {
  try {
    const fileContent = input.mimeType === "application/pdf"
      ? { type: "file_url" as const, file_url: { url: input.signedFileUrl, mime_type: "application/pdf" as const } }
      : { type: "image_url" as const, image_url: { url: input.signedFileUrl, detail: "high" as const } };
    const result = await callModel({
      model: "gemini-3-flash-preview",
      maxTokens: 300,
      messages: [
        {
          role: "system",
          content: "You perform a narrow OCR extraction for a consultant-provided timesheet. Return only the weekly total hours visible in the supplied document. Prefer an explicitly labelled total. If no explicit total exists, calculate a total only when every clearly-labelled daily worked-hours value for one week is visible and unambiguous. Otherwise return null with low confidence. Do not infer missing values. Do not assess client approval, employment, eligibility, compensation, payroll, billing, invoices, or any legal or staffing decision.",
        },
        { role: "user", content: [{ type: "text", text: "Extract the total hours from this uploaded timesheet for human review." }, fileContent] },
      ],
      response_format: responseSchema,
    } as InvokeParams);
    const content = result.choices[0]?.message.content;
    const raw = typeof content === "string" ? content : content?.filter(part => part.type === "text").map(part => part.text).join("") ?? "";
    const parsed = ocrResultSchema.parse(JSON.parse(raw));
    if (parsed.totalHours === null) return { extractionStatus: "needs_human_review", extractedHours: null, extractionConfidence: "low" };
    return { extractionStatus: "extracted", extractedHours: parsed.totalHours, extractionConfidence: parsed.confidence };
  } catch (error) {
    console.warn("[Timesheet OCR] Managed extraction unavailable:", error instanceof Error ? error.message : "unknown provider error");
    return { extractionStatus: "needs_human_review", extractedHours: null, extractionConfidence: "low" };
  }
}
