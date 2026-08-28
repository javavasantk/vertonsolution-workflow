import { Module } from "@nestjs/common";
import { AnalyticsService } from "./analytics/analytics.service";
import { AssistantController } from "./assistant/assistant.controller";
import { DeterministicDraftProvider } from "./assistant/deterministic-draft.provider";
import { AssistantPolicyService } from "./assistant/assistant-policy.service";
import {
  ASSISTANT_CONSENT_REPOSITORY,
  ASSISTANT_DRAFT_REPOSITORY,
  ASSISTANT_RECEIPT_REPOSITORY,
  AssistantService,
  InMemoryConsentRepository,
  InMemoryDraftRepository,
  InMemoryReceiptRepository,
  LLM_PROVIDER,
} from "./assistant/assistant.service";
import {
  FIREBASE_TOKEN_VERIFIER,
  PolarisAuthGuard,
  RejectingTokenVerifier,
} from "./auth/principal";
import {
  FeatureGateService,
  loadConfig,
  POLARIS_CONFIG,
} from "./config/config";
import { PrivacyService } from "./privacy/privacy.service";
import { HealthController } from "./common/health.controller";

@Module({
  controllers: [AssistantController, HealthController],
  providers: [
    { provide: POLARIS_CONFIG, useFactory: () => loadConfig() },
    FeatureGateService,
    AssistantPolicyService,
    AssistantService,
    AnalyticsService,
    PrivacyService,
    PolarisAuthGuard,
    { provide: FIREBASE_TOKEN_VERIFIER, useClass: RejectingTokenVerifier },
    {
      provide: ASSISTANT_CONSENT_REPOSITORY,
      useValue: new InMemoryConsentRepository([]),
    },
    {
      provide: ASSISTANT_DRAFT_REPOSITORY,
      useValue: new InMemoryDraftRepository(),
    },
    {
      provide: ASSISTANT_RECEIPT_REPOSITORY,
      useValue: new InMemoryReceiptRepository(),
    },
    { provide: LLM_PROVIDER, useClass: DeterministicDraftProvider },
  ],
})
export class AppModule {}
