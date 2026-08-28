import { randomUUID } from "node:crypto";
import {
  AssistantDraft,
  AssistantProviderInput,
  LLMProvider,
} from "./assistant.types";

/**
 * Test/development-only provider. Production wiring must replace this adapter
 * with a server-side provider implementation protected by configuration,
 * policy checks, structured-output validation, and a feature gate.
 */
export class DeterministicDraftProvider implements LLMProvider {
  public async createDraft(
    input: AssistantProviderInput
  ): Promise<AssistantDraft> {
    const cleaned = input.selectedContent.trim().replace(/\s+/g, " ");
    const label =
      cleaned.length > 0 ? cleaned.slice(0, 96) : "Review the selected work";
    const actionLabel =
      input.capability === "TASK_EXTRACTION"
        ? `Review: ${label}`
        : `Start with: ${label}`;

    return {
      draftId: randomUUID(),
      capability: input.capability,
      language: input.locale,
      summary:
        input.capability === "TASK_EXTRACTION"
          ? "Here are draft tasks based only on the text you selected."
          : "Here are small draft steps for the task you selected.",
      uncertainties: [
        "Please review names, deadlines, and any course details before saving.",
      ],
      learnerQuestions: [],
      draftActions: [
        {
          candidateId: randomUUID(),
          label: actionLabel,
          sourceEvidence: label,
          confidence: "LOW",
          requiresConfirmation: true,
        },
      ],
      safetyFlags: ["NONE"],
      requiresConfirmation: true,
      contextFingerprint: "",
      expiresAt: new Date(Date.now() + 30 * 60 * 1_000),
    };
  }
}
