import { describe, expect, it } from "vitest";
import { DeterministicDraftProvider } from "../src/assistant/deterministic-draft.provider";
import { AssistantPolicyService } from "../src/assistant/assistant-policy.service";
import {
  AssistantAccessError,
  AssistantService,
  InMemoryConsentRepository,
  InMemoryDraftRepository,
  InMemoryReceiptRepository,
} from "../src/assistant/assistant.service";
import { FeatureGateService, PolarisConfig } from "../src/config/config";
import { TaskExtractionRequest } from "../src/assistant/assistant.types";

const accountId = "11111111-1111-4111-8111-111111111111";
const workspaceId = "22222222-2222-4222-8222-222222222222";
const requestId = "33333333-3333-4333-8333-333333333333";
const idempotencyKey = "44444444-4444-4444-8444-444444444444";

function config(assistantEnabled = true): PolarisConfig {
  return {
    environment: "test",
    port: 3000,
    assistantEnabled,
    analyticsEnabled: false,
    maxAssistantInputCharacters: 12_000,
    assistantDraftTtlSeconds: 1_800,
    confirmationTtlSeconds: 600,
  };
}

function makeService(assistantEnabled = true) {
  const configuration = config(assistantEnabled);
  return new AssistantService(
    configuration,
    new FeatureGateService(configuration),
    new AssistantPolicyService(),
    new InMemoryConsentRepository([
      {
        accountId,
        capability: "TASK_EXTRACTION",
        policyVersion: "ai-notice-v1",
        decision: "GRANTED",
        recordedAt: new Date(),
      },
    ]),
    new InMemoryDraftRepository(),
    new InMemoryReceiptRepository(),
    new DeterministicDraftProvider()
  );
}

function extractionRequest(
  content = "Read chapter 3 and prepare notes"
): TaskExtractionRequest {
  return {
    requestId,
    workspaceId,
    capability: "TASK_EXTRACTION",
    assistantResponseLocale: "en-IN",
    source: { kind: "SELECTED_TEXT", content },
    consentReceiptVersion: "ai-notice-v1",
    contextFingerprint: "source-revision-7",
    clientRequestIdempotencyKey: idempotencyKey,
  };
}

describe("AssistantService", () => {
  it("returns a reviewable draft only after consent and workspace authorization", async () => {
    const service = makeService();
    const draft = await service.requestDraft(
      { accountId, workspaceIds: new Set([workspaceId]) },
      extractionRequest()
    );

    expect(draft.capability).toBe("TASK_EXTRACTION");
    expect(draft.requiresConfirmation).toBe(true);
    expect(draft.draftActions).toHaveLength(1);
    expect(draft.draftActions[0]?.requiresConfirmation).toBe(true);
    expect(draft.contextFingerprint).toBe("source-revision-7");
  });

  it("does not permit a draft from a workspace outside the authenticated scope", async () => {
    const service = makeService();
    await expect(
      service.requestDraft(
        { accountId, workspaceIds: new Set() },
        extractionRequest()
      )
    ).rejects.toMatchObject({ code: "AUTHORIZATION_FAILED" });
  });

  it("refuses a request framed as an assessed answer rather than a planning draft", async () => {
    const service = makeService();
    await expect(
      service.requestDraft(
        { accountId, workspaceIds: new Set([workspaceId]) },
        extractionRequest("Write my graded assignment so I can submit it.")
      )
    ).rejects.toMatchObject({ code: "POLICY_REFUSED" });
  });

  it("issues a one-time, account-bound confirmation receipt", async () => {
    const service = makeService();
    const principal = { accountId, workspaceIds: new Set([workspaceId]) };
    const draft = await service.requestDraft(principal, extractionRequest());
    const receipt = await service.issueConfirmationReceipt(
      principal,
      draft.draftId
    );
    const selectedCandidateIds = [draft.draftActions[0]?.candidateId ?? ""];

    await expect(
      service.consumeApprovedDraft(principal, {
        receiptId: receipt.receiptId,
        selectedCandidateIds,
        contextFingerprint: draft.contextFingerprint,
      })
    ).resolves.toMatchObject({ receiptId: receipt.receiptId });

    await expect(
      service.consumeApprovedDraft(principal, {
        receiptId: receipt.receiptId,
        selectedCandidateIds,
        contextFingerprint: draft.contextFingerprint,
      })
    ).rejects.toMatchObject({ code: "CONFIRMATION_INVALID" });
  });
});
