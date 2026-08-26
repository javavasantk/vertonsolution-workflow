import { InvokeParams, InvokeResult, invokeLLM } from "./_core/llm";

export type AiTask = "recruiter_summary" | "onboarding_guidance" | "access_review";

type ModelInvoker = (params: InvokeParams) => Promise<InvokeResult>;

const aiTaskInstructions: Record<AiTask, string> = {
  recruiter_summary: "Create a concise recruiter handoff summary from the supplied onboarding and assignment signals. Prioritize human follow-up actions.",
  onboarding_guidance: "Create practical onboarding guidance for the signed-in employee based only on the supplied task context. Suggest a human owner for each follow-up.",
  access_review: "Create a concise administrator access-review briefing from the supplied role and audit context. Identify governance follow-ups without changing or recommending automatic permissions.",
};

export async function generateAiBriefing(task: AiTask, context: string, callModel: ModelInvoker = invokeLLM) {
  let result: InvokeResult;
  try {
    result = await callModel({
      model: "claude-haiku-4-5",
      maxTokens: 500,
      messages: [
        {
          role: "system",
          content: "You are Verton Workforce Hub's operational writing assistant. Produce a short, practical briefing using only the supplied context. Do not make legal, immigration, or work-authorization eligibility decisions. Do not request documents or infer authorization status. Use clear headings: Summary, Human follow-up, Boundary.",
        },
        { role: "user", content: `${aiTaskInstructions[task]}\n\nContext:\n${context}` },
      ],
    });
  } catch {
    return {
      briefing: "Summary\nAI assistance is temporarily unavailable.\n\nHuman follow-up\nContinue this workflow with the designated human owner.\n\nBoundary\nNo automated eligibility or authorization decision has been made.",
      task,
      model: "unavailable",
      unavailable: true,
    };
  }

  const content = result.choices[0]?.message.content;
  const briefing = typeof content === "string"
    ? content
    : content?.filter(part => part.type === "text").map(part => part.text).join("\n") ?? "No AI briefing was returned.";

  return { briefing, task, model: result.model, unavailable: false };
}
