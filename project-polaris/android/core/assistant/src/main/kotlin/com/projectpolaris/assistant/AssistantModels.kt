package com.projectpolaris.assistant

import java.time.Instant
import java.util.UUID

enum class AssistantCapability {
    TASK_EXTRACTION,
    TASK_BREAKDOWN,
}

enum class AssistantConsentState {
    NOT_ASKED,
    DECLINED,
    GRANTED,
    WITHDRAWN,
}

enum class AssistantAvailability {
    AVAILABLE,
    OFFLINE,
    SIGN_IN_REQUIRED,
    CONSENT_REQUIRED,
    DISABLED_BY_FEATURE_FLAG,
    SERVICE_UNAVAILABLE,
}

data class AssistantConsentReceipt(
    val capability: AssistantCapability,
    val policyVersion: String,
    val locale: String,
    val state: AssistantConsentState,
    val recordedAt: Instant,
)

data class SelectedAssistantContent(
    val sourceId: UUID?,
    val sourceKind: SourceKind,
    val contentPreview: String,
    val includesNotes: Boolean = false,
) {
    enum class SourceKind { INBOX_ITEM, SELECTED_TEXT, TASK }
}

data class DraftAction(
    val candidateId: UUID,
    val label: String,
    val sourceEvidence: String?,
    val confidence: Confidence,
    val requiresConfirmation: Boolean = true,
) {
    enum class Confidence { LOW, MEDIUM, HIGH }
}

data class AssistantDraft(
    val draftId: UUID,
    val capability: AssistantCapability,
    val language: String,
    val summary: String,
    val uncertainties: List<String>,
    val userQuestions: List<String>,
    val draftActions: List<DraftAction>,
    val safetyFlags: List<String>,
    val contextFingerprint: String,
    val expiresAt: Instant,
    val requiresConfirmation: Boolean = true,
)

data class ConfirmationReceipt(
    val receiptId: UUID,
    val draftId: UUID,
    val workspaceId: UUID,
    val capability: AssistantCapability,
    val allowedCandidateIds: Set<UUID>,
    val contextFingerprint: String,
    val expiresAt: Instant,
)

sealed interface AssistantUiState {
    data object Idle : AssistantUiState
    data class LocalFallback(
        val availability: AssistantAvailability,
        val messageKey: String,
        val localAction: LocalFallbackAction,
    ) : AssistantUiState
    data class Disclosure(
        val capability: AssistantCapability,
        val selectedContent: SelectedAssistantContent,
        val messageKey: String,
    ) : AssistantUiState
    data object RequestingDraft : AssistantUiState
    data class ReviewingDraft(val draft: AssistantDraft) : AssistantUiState
    data class ConfirmingDraft(val draft: AssistantDraft, val selectedCandidateIds: Set<UUID>) : AssistantUiState
    data class Error(val messageKey: String, val retryable: Boolean) : AssistantUiState
}

enum class LocalFallbackAction {
    KEEP_AS_NOTE,
    CREATE_TASK_MANUALLY,
    USE_MANUAL_SMALLER_STEP,
    CONTINUE_PLANNING,
}
