package com.projectpolaris.assistant

import java.time.Clock
import java.util.UUID
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

interface AssistantApi {
    suspend fun requestDraft(request: AssistantRequest): AssistantDraft
    suspend fun issueReceipt(draftId: UUID): ConfirmationReceipt
    suspend fun approveDraft(request: AssistantApprovalRequest): AssistantApprovalResult
}

interface LocalAssistantFallback {
    suspend fun keepAsNote(source: SelectedAssistantContent)
    suspend fun openManualTaskCreation(source: SelectedAssistantContent)
    suspend fun openManualSmallerStep(taskId: UUID)
}

interface LocalDomainMutationGateway {
    /**
     * Implemented by normal offline-first domain use cases. This gateway must
     * write Room data and an idempotent outbox operation atomically only after
     * a server-issued approval receipt has been validated.
     */
    suspend fun applyApprovedDraft(
        receipt: ConfirmationReceipt,
        selectedCandidateIds: Set<UUID>,
        result: AssistantApprovalResult,
    )
}

data class AssistantRequest(
    val requestId: UUID,
    val workspaceId: UUID,
    val capability: AssistantCapability,
    val assistantResponseLocale: String,
    val selectedContent: SelectedAssistantContent,
    val policyVersion: String,
    val contextFingerprint: String,
    val idempotencyKey: UUID,
)

data class AssistantApprovalRequest(
    val draftId: UUID,
    val receiptId: UUID,
    val selectedCandidateIds: Set<UUID>,
    val contextFingerprint: String,
)

data class AssistantApprovalResult(
    val approvalReceiptId: UUID,
    val acceptedCandidateIds: Set<UUID>,
    val requiresLocalDomainMutation: Boolean,
)

class AssistantDraftCoordinator(
    private val api: AssistantApi,
    private val fallback: LocalAssistantFallback,
    private val domainMutationGateway: LocalDomainMutationGateway,
    private val clock: Clock,
) {
    private val mutableState = MutableStateFlow<AssistantUiState>(AssistantUiState.Idle)
    val state: StateFlow<AssistantUiState> = mutableState.asStateFlow()

    fun begin(
        availability: AssistantAvailability,
        capability: AssistantCapability,
        selectedContent: SelectedAssistantContent,
    ) {
        if (availability != AssistantAvailability.AVAILABLE) {
            mutableState.value = AssistantUiState.LocalFallback(
                availability = availability,
                messageKey = fallbackMessage(availability),
                localAction = if (capability == AssistantCapability.TASK_EXTRACTION) {
                    LocalFallbackAction.CREATE_TASK_MANUALLY
                } else {
                    LocalFallbackAction.USE_MANUAL_SMALLER_STEP
                },
            )
            return
        }
        mutableState.value = AssistantUiState.Disclosure(
            capability = capability,
            selectedContent = selectedContent,
            messageKey = "assistant_disclosure_before_send",
        )
    }

    suspend fun requestDraftAfterConsent(request: AssistantRequest) {
        require(request.selectedContent.contentPreview.isNotBlank())
        mutableState.value = AssistantUiState.RequestingDraft
        runCatching { api.requestDraft(request) }
            .onSuccess { draft ->
                if (draft.requiresConfirmation && draft.contextFingerprint == request.contextFingerprint) {
                    mutableState.value = AssistantUiState.ReviewingDraft(draft)
                } else {
                    mutableState.value = AssistantUiState.Error("assistant_error_invalid_draft", false)
                }
            }
            .onFailure {
                mutableState.value = AssistantUiState.LocalFallback(
                    AssistantAvailability.SERVICE_UNAVAILABLE,
                    "assistant_error_unavailable",
                    if (request.capability == AssistantCapability.TASK_EXTRACTION) {
                        LocalFallbackAction.CREATE_TASK_MANUALLY
                    } else {
                        LocalFallbackAction.USE_MANUAL_SMALLER_STEP
                    },
                )
            }
    }

    fun beginConfirmation(selectedCandidateIds: Set<UUID>) {
        val reviewing = mutableState.value as? AssistantUiState.ReviewingDraft ?: return
        if (selectedCandidateIds.isEmpty() ||
            selectedCandidateIds.any { id -> reviewing.draft.draftActions.none { it.candidateId == id } }
        ) {
            mutableState.value = AssistantUiState.Error("assistant_error_invalid_selection", false)
            return
        }
        mutableState.value = AssistantUiState.ConfirmingDraft(reviewing.draft, selectedCandidateIds)
    }

    suspend fun confirmSelectedDrafts(workspaceId: UUID) {
        val confirming = mutableState.value as? AssistantUiState.ConfirmingDraft ?: return
        if (confirming.draft.expiresAt.isBefore(clock.instant())) {
            mutableState.value = AssistantUiState.Error("assistant_error_draft_expired", false)
            return
        }

        runCatching {
            val receipt = api.issueReceipt(confirming.draft.draftId)
            require(receipt.workspaceId == workspaceId)
            require(receipt.draftId == confirming.draft.draftId)
            require(receipt.contextFingerprint == confirming.draft.contextFingerprint)
            require(receipt.expiresAt.isAfter(clock.instant()))
            require(confirming.selectedCandidateIds.all(receipt.allowedCandidateIds::contains))
            val result = api.approveDraft(
                AssistantApprovalRequest(
                    draftId = confirming.draft.draftId,
                    receiptId = receipt.receiptId,
                    selectedCandidateIds = confirming.selectedCandidateIds,
                    contextFingerprint = confirming.draft.contextFingerprint,
                ),
            )
            require(result.requiresLocalDomainMutation)
            domainMutationGateway.applyApprovedDraft(receipt, confirming.selectedCandidateIds, result)
        }.onSuccess {
            mutableState.value = AssistantUiState.Idle
        }.onFailure {
            // No local task mutation is attempted on failed receipt/approval validation.
            mutableState.value = AssistantUiState.Error("assistant_error_confirmation_invalid", false)
        }
    }

    suspend fun applyFallback(action: LocalFallbackAction, source: SelectedAssistantContent, taskId: UUID? = null) {
        when (action) {
            LocalFallbackAction.KEEP_AS_NOTE -> fallback.keepAsNote(source)
            LocalFallbackAction.CREATE_TASK_MANUALLY -> fallback.openManualTaskCreation(source)
            LocalFallbackAction.USE_MANUAL_SMALLER_STEP -> requireNotNull(taskId).let(fallback::openManualSmallerStep)
            LocalFallbackAction.CONTINUE_PLANNING -> Unit
        }
        mutableState.value = AssistantUiState.Idle
    }

    fun rejectDraft() {
        // Rejecting a draft never mutates the source task or Inbox item.
        mutableState.value = AssistantUiState.Idle
    }

    private fun fallbackMessage(availability: AssistantAvailability): String = when (availability) {
        AssistantAvailability.OFFLINE -> "assistant_error_offline"
        AssistantAvailability.SIGN_IN_REQUIRED -> "assistant_error_sign_in_optional"
        AssistantAvailability.CONSENT_REQUIRED -> "assistant_error_consent_required"
        AssistantAvailability.DISABLED_BY_FEATURE_FLAG -> "assistant_error_unavailable"
        AssistantAvailability.SERVICE_UNAVAILABLE -> "assistant_error_unavailable"
        AssistantAvailability.AVAILABLE -> "assistant_error_unavailable"
    }
}
