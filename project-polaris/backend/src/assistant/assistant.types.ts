export const SUPPORTED_ASSISTANT_CAPABILITIES = [
  "TASK_EXTRACTION",
  "TASK_BREAKDOWN",
] as const;

export type AssistantCapability =
  (typeof SUPPORTED_ASSISTANT_CAPABILITIES)[number];

export type DraftConfidence = "LOW" | "MEDIUM" | "HIGH";
export type SafetyFlag =
  | "NONE"
  | "ASSESSMENT_ANSWER_REQUEST"
  | "UNSUPPORTED_CAPABILITY"
  | "SENSITIVE_OR_UNSAFE_CONTENT"
  | "INVALID_REQUEST";

export type PolicyDecision =
  | "ALLOW"
  | "REFUSE_ASSESSMENT_ANSWER"
  | "REFUSE_UNSUPPORTED_CAPABILITY"
  | "REFUSE_SENSITIVE_OR_UNSAFE_CONTENT"
  | "REQUIRE_LEARNER_CLARIFICATION"
  | "REQUEST_TOO_LARGE_OR_INVALID"
  | "CONSENT_OR_AUTH_REQUIRED"
  | "SERVICE_UNAVAILABLE";

export interface AuthenticatedPrincipal {
  readonly accountId: string;
  readonly workspaceIds: ReadonlySet<string>;
}

export interface AssistantConsent {
  readonly accountId: string;
  readonly capability: AssistantCapability;
  readonly policyVersion: string;
  readonly decision: "GRANTED" | "DECLINED" | "WITHDRAWN";
  readonly recordedAt: Date;
}

export interface TaskExtractionRequest {
  readonly requestId: string;
  readonly workspaceId: string;
  readonly capability: "TASK_EXTRACTION";
  readonly assistantResponseLocale: string;
  readonly source: {
    readonly kind: "INBOX_ITEM" | "SELECTED_TEXT";
    readonly id?: string;
    readonly content: string;
  };
  readonly consentReceiptVersion: string;
  readonly contextFingerprint: string;
  readonly clientRequestIdempotencyKey: string;
}

export interface TaskBreakdownRequest {
  readonly requestId: string;
  readonly workspaceId: string;
  readonly capability: "TASK_BREAKDOWN";
  readonly assistantResponseLocale: string;
  readonly sourceTask: {
    readonly taskId: string;
    readonly taskRevision: number;
    readonly title: string;
    readonly notes?: string;
    readonly effortEstimate?: "TINY" | "SMALL" | "MEDIUM" | "LARGE";
    readonly dueContext?: string;
  };
  readonly consentReceiptVersion: string;
  readonly contextFingerprint: string;
  readonly clientRequestIdempotencyKey: string;
}

export type AssistantRequest = TaskExtractionRequest | TaskBreakdownRequest;

export interface DraftAction {
  readonly candidateId: string;
  readonly label: string;
  readonly sourceEvidence?: string;
  readonly confidence: DraftConfidence;
  readonly requiresConfirmation: true;
}

export interface AssistantDraft {
  readonly draftId: string;
  readonly capability: AssistantCapability;
  readonly language: string;
  readonly summary: string;
  readonly uncertainties: readonly string[];
  readonly learnerQuestions: readonly string[];
  readonly draftActions: readonly DraftAction[];
  readonly safetyFlags: readonly SafetyFlag[];
  readonly requiresConfirmation: true;
  readonly contextFingerprint: string;
  readonly expiresAt: Date;
}

export interface AssistantProviderInput {
  readonly capability: AssistantCapability;
  readonly locale: string;
  readonly selectedContent: string;
}

export interface LLMProvider {
  createDraft(input: AssistantProviderInput): Promise<AssistantDraft>;
}

export interface ConfirmationReceipt {
  readonly receiptId: string;
  readonly draftId: string;
  readonly accountId: string;
  readonly workspaceId: string;
  readonly capability: AssistantCapability;
  readonly contextFingerprint: string;
  readonly allowedCandidateIds: readonly string[];
  readonly expiresAt: Date;
  readonly oneTimeNonce: string;
}

export interface ApprovedDraftMutation {
  readonly receiptId: string;
  readonly selectedCandidateIds: readonly string[];
  readonly contextFingerprint: string;
}
