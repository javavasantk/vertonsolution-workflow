import { z } from "zod";
import { InvokeParams, InvokeResult, invokeLLM } from "./_core/llm";

export const resumeParseSchema = z.object({
  candidateName: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  professionalSummary: z.string(),
  yearsExperience: z.string(),
  skills: z.array(z.string()),
  recentRoles: z.array(z.object({ title: z.string(), company: z.string(), period: z.string() })),
  education: z.array(z.string()),
  recruiterNotes: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low"]),
});

export type ResumeParse = z.infer<typeof resumeParseSchema>;
type ModelInvoker = (params: InvokeParams) => Promise<InvokeResult>;

const unavailableResult: ResumeParse = {
  candidateName: "",
  email: "",
  phone: "",
  location: "",
  professionalSummary: "Resume extraction is temporarily unavailable. Continue with a human review of the supplied text.",
  yearsExperience: "",
  skills: [],
  recentRoles: [],
  education: [],
  recruiterNotes: ["No automated candidate decision has been made.", "Review the original resume before updating the candidate record."],
  confidence: "low",
};

const responseSchema = {
  type: "json_schema",
  json_schema: {
    name: "recruiter_resume_parse",
    strict: true,
    schema: {
      type: "object",
      properties: {
        candidateName: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        location: { type: "string" },
        professionalSummary: { type: "string" },
        yearsExperience: { type: "string" },
        skills: { type: "array", items: { type: "string" } },
        recentRoles: { type: "array", items: { type: "object", properties: { title: { type: "string" }, company: { type: "string" }, period: { type: "string" } }, required: ["title", "company", "period"], additionalProperties: false } },
        education: { type: "array", items: { type: "string" } },
        recruiterNotes: { type: "array", items: { type: "string" } },
        confidence: { type: "string", enum: ["high", "medium", "low"] },
      },
      required: ["candidateName", "email", "phone", "location", "professionalSummary", "yearsExperience", "skills", "recentRoles", "education", "recruiterNotes", "confidence"],
      additionalProperties: false,
    },
  },
} as const;

export async function parseRecruiterResume(resumeText: string, callModel: ModelInvoker = invokeLLM) {
  try {
    const result = await callModel({
      model: "gpt-5-mini",
      maxCompletionTokens: 900,
      messages: [
        {
          role: "system",
          content: "You extract recruiter-visible facts from a resume into strict JSON. Use only the supplied text. Do not infer work authorization, immigration status, protected characteristics, eligibility, salary, candidate fit, ranking, or a hiring recommendation. Leave unavailable fields as empty strings or empty arrays. recruiterNotes must be factual follow-up prompts, not decisions.",
        },
        { role: "user", content: `Extract recruiter-visible profile details from this resume:\n\n${resumeText}` },
      ],
      response_format: responseSchema,
    } as InvokeParams);
    const content = result.choices[0]?.message.content;
    const raw = typeof content === "string" ? content : content?.filter(part => part.type === "text").map(part => part.text).join("") ?? "";
    return { profile: resumeParseSchema.parse(JSON.parse(raw)), model: result.model, unavailable: false };
  } catch (error) {
    console.warn("[Resume parser] Managed extraction unavailable:", error instanceof Error ? error.message : "unknown provider error");
    return { profile: unavailableResult, model: "unavailable", unavailable: true };
  }
}
