import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  FeatureGateService,
  POLARIS_CONFIG,
  PolarisConfig,
} from "../config/config";
import { AssistantPolicyService } from "./assistant-policy.service";
import {
  ApprovedDraftMutation,
  AssistantConsent,
  AssistantDraft,
  AssistantRequest,
  AuthenticatedPrincipal,
  ConfirmationReceipt,
  LLMProvider,
} from "./assistant.types";

export const ASSISTANT_CONSENT_REPOSITORY = Symbol(
  "ASSISTANT_CONSENT_REPOSITORY"
);
export const ASSISTANT_DRAFT_REPOSITORY = Symbol("ASSISTANT_DRAFT_REPOSITORY");
export const ASSISTANT_RECEIPT_REPOSITORY = Symbol(
  "ASSISTANT_RECEIPT_REPOSITORY"
);
export const LLM_PROVIDER = Symbol("LLM_PROVIDER");

export class AssistantAccessError extends Error {
  public constructor(
    public readonly code:
      | "AUTHORIZATION_FAILED"
      | "CONSENT_REQUIRED"
      | "ASSISTANT_DISABLED"
      | "POLICY_REFUSED"
      | "DRAFT_NOT_FOUND"
      | "CONFIRMATION_INVALID",
    public readonly safeMessageKey: string
  ) {
    super(code);
  }
}

export interface ConsentRepository {
  findGranted(
    accountId: string,
    capability: AssistantRequest["capability"],
    policyVersion: string
  ): Promise<AssistantConsent | undefined>;
}

export interface DraftRepository {
  save(
    draft: AssistantDraft,
    accountId: string,
    workspaceId: string
  ): Promise<void>;
  find(
    draftId: string
  ): Promise<
    | { draft: AssistantDraft; accountId: string; workspaceId: string }
    | undefined
  >;
}

export interface ReceiptRepository {
  save(receipt: ConfirmationReceipt): Promise<void>;
  consume(receiptId: string): Promise<ConfirmationReceipt | undefined>;
}

@Injectable()
export class AssistantService {
  public constructor(
    @Inject(POLARIS_CONFIG) private readonly config: PolarisConfig,
    private readonly gates: FeatureGateService,
    private readonly policy: AssistantPolicyService,
    @Inject(ASSISTANT_CONSENT_REPOSITORY)
    private readonly consentRepository: ConsentRepository,
    @Inject(ASSISTANT_DRAFT_REPOSITORY)
    private readonly draftRepository: DraftRepository,
    @Inject(ASSISTANT_RECEIPT_REPOSITORY)
    private readonly receiptRepository: ReceiptRepository,
    @Inject(LLM_PROVIDER) private readonly provider: LLMProvider
  ) {}

  public async requestDraft(
    principal: AuthenticatedPrincipal,
    request: AssistantRequest
  ): Promise<AssistantDraft> {
    if (!this.gates.isAssistantEnabled()) {
      throw new AssistantAccessError(
        "ASSISTANT_DISABLED",
        "assistant_error_unavailable"
      );
    }
    if (!principal.workspaceIds.has(request.workspaceId)) {
      throw new AssistantAccessError(
        "AUTHORIZATION_FAILED",
        "assistant_error_not_authorized"
      );
    }

    const consent = await this.consentRepository.findGranted(
      principal.accountId,
      request.capability,
      request.consentReceiptVersion
    );
    if (!consent) {
      throw new AssistantAccessError(
        "CONSENT_REQUIRED",
        "assistant_error_consent_required"
      );
    }

    const policyResult = this.policy.evaluate(
      request,
      this.config.maxAssistantInputCharacters
    );
    if (policyResult.decision !== "ALLOW") {
      throw new AssistantAccessError(
        "POLICY_REFUSED",
        policyResult.safeMessageKey
      );
    }

    const rawDraft = await this.provider.createDraft({
      capability: request.capability,
      locale: request.assistantResponseLocale,
      selectedContent: this.policy.selectedContent(request),
    });

    const draft = this.validateAndNormalizeDraft(
      { ...rawDraft, contextFingerprint: request.contextFingerprint },
      request
    );
    await this.draftRepository.save(
      draft,
      principal.accountId,
      request.workspaceId
    );
    return draft;
  }

  public async issueConfirmationReceipt(
    principal: AuthenticatedPrincipal,
    draftId: string
  ): Promise<ConfirmationReceipt> {
    const record = await this.draftRepository.find(draftId);
    if (
      !record ||
      record.accountId !== principal.accountId ||
      !principal.workspaceIds.has(record.workspaceId)
    ) {
      throw new AssistantAccessError(
        "DRAFT_NOT_FOUND",
        "assistant_error_draft_not_found"
      );
    }
    if (record.draft.expiresAt <= new Date()) {
      throw new AssistantAccessError(
        "CONFIRMATION_INVALID",
        "assistant_error_draft_expired"
      );
    }

    const receipt: ConfirmationReceipt = {
      receiptId: randomUUID(),
      draftId: record.draft.draftId,
      accountId: principal.accountId,
      workspaceId: record.workspaceId,
      capability: record.draft.capability,
      contextFingerprint: record.draft.contextFingerprint,
      allowedCandidateIds: record.draft.draftActions.map(
        action => action.candidateId
      ),
      expiresAt: new Date(
        Date.now() + this.config.confirmationTtlSeconds * 1_000
      ),
      oneTimeNonce: randomUUID(),
    };
    await this.receiptRepository.save(receipt);
    return receipt;
  }

  public async consumeApprovedDraft(
    principal: AuthenticatedPrincipal,
    approval: ApprovedDraftMutation
  ): Promise<ConfirmationReceipt> {
    const receipt = await this.receiptRepository.consume(approval.receiptId);
    if (
      !receipt ||
      receipt.expiresAt <= new Date() ||
      receipt.accountId !== principal.accountId ||
      !principal.workspaceIds.has(receipt.workspaceId) ||
      receipt.contextFingerprint !== approval.contextFingerprint ||
      approval.selectedCandidateIds.some(
        id => !receipt.allowedCandidateIds.includes(id)
      )
    ) {
      throw new AssistantAccessError(
        "CONFIRMATION_INVALID",
        "assistant_error_confirmation_invalid"
      );
    }
    return receipt;
  }

  private validateAndNormalizeDraft(
    draft: AssistantDraft,
    request: AssistantRequest
  ): AssistantDraft {
    if (
      draft.capability !== request.capability ||
      draft.language !== request.assistantResponseLocale ||
      draft.contextFingerprint !== request.contextFingerprint ||
      draft.requiresConfirmation !== true ||
      draft.draftActions.length === 0 ||
      draft.draftActions.length > 8 ||
      draft.draftActions.some(
        action =>
          action.requiresConfirmation !== true ||
          action.label.trim().length === 0
      )
    ) {
      throw new AssistantAccessError(
        "POLICY_REFUSED",
        "assistant_error_invalid_draft"
      );
    }

    return {
      ...draft,
      draftActions: draft.draftActions.map(action => ({
        ...action,
        sourceEvidence: action.sourceEvidence?.slice(0, 240),
        label: action.label.slice(0, 240),
      })),
      uncertainties: draft.uncertainties
        .slice(0, 4)
        .map(value => value.slice(0, 240)),
      learnerQuestions: draft.learnerQuestions
        .slice(0, 3)
        .map(value => value.slice(0, 240)),
    };
  }
}

export class InMemoryConsentRepository implements ConsentRepository {
  public constructor(private readonly records: readonly AssistantConsent[]) {}

  public async findGranted(
    accountId: string,
    capability: AssistantRequest["capability"],
    policyVersion: string
  ): Promise<AssistantConsent | undefined> {
    return this.records.find(
      record =>
        record.accountId === accountId &&
        record.capability === capability &&
        record.policyVersion === policyVersion &&
        record.decision === "GRANTED"
    );
  }
}

export class InMemoryDraftRepository implements DraftRepository {
  private readonly drafts = new Map<
    string,
    { draft: AssistantDraft; accountId: string; workspaceId: string }
  >();

  public async save(
    draft: AssistantDraft,
    accountId: string,
    workspaceId: string
  ): Promise<void> {
    this.drafts.set(draft.draftId, { draft, accountId, workspaceId });
  }

  public async find(draftId: string) {
    return this.drafts.get(draftId);
  }
}

export class InMemoryReceiptRepository implements ReceiptRepository {
  private readonly receipts = new Map<string, ConfirmationReceipt>();

  public async save(receipt: ConfirmationReceipt): Promise<void> {
    this.receipts.set(receipt.receiptId, receipt);
  }

  public async consume(
    receiptId: string
  ): Promise<ConfirmationReceipt | undefined> {
    const receipt = this.receipts.get(receiptId);
    this.receipts.delete(receiptId);
    return receipt;
  }
}
