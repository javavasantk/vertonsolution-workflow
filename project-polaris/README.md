# Project Polaris

Project Polaris is a **separate, additive monorepo** inside this repository. It does not alter the existing Verton Workforce Hub application. The workspace implements the credential-free foundation of the Project Polaris Prompt 13 milestone: a bounded, draft-only assistant contract; privacy-safe analytics validation; privacy dashboard state; contract validation; Android local fallback models; and secure cloud delivery scaffolding.

> **Current implementation boundary:** the backend uses safe in-memory adapters and a rejecting authentication verifier by default. It cannot connect to Firebase, an AI provider, PostgreSQL, Redis, or Google Cloud until protected environment configuration, service accounts, migrations, and provider contracts have been reviewed and added. This is intentional: no production data or credential is accepted by the scaffold.

| Directory | Purpose |
|---|---|
| `android/` | Kotlin/Compose application scaffold and framework-independent assistant draft/fallback coordinator. |
| `backend/` | NestJS modular-monolith foundation for consent-gated drafts, privacy, and analytics validation. |
| `contracts/` | Authoritative OpenAPI 3.1 API contract. |
| `infra/` | Terraform modules/templates for Cloud Run and baseline monitoring. |
| `docs/` | Architecture, AI safety, analytics, privacy, deployment, and decision records. |
| `scripts/` | Safe validation and guarded staging-deployment helper scripts. |

## Local validation

Use Node.js 22 and pnpm 11. Run the following from this directory:

```bash
pnpm install --ignore-scripts
pnpm check
pnpm contract:check
pnpm test
node scripts/check-no-secrets.mjs
```

The Android scaffold is intentionally not built in this environment because an Android SDK and Gradle wrapper are not yet provisioned. Once the Android build toolchain is supplied, run the Android module’s Gradle checks before treating it as release-ready.

## Safe delivery sequence

Staging deployment must use federated CI credentials and a reviewed immutable container image digest. The guarded staging helper requires `POLARIS_DEPLOY_ENVIRONMENT=staging`, `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_REGION`, and `BACKEND_IMAGE_DIGEST`, and it produces a plan only. It never runs a production deployment.

```bash
POLARIS_DEPLOY_ENVIRONMENT=staging \
GOOGLE_CLOUD_PROJECT=YOUR_STAGING_PROJECT \
GOOGLE_CLOUD_REGION=YOUR_APPROVED_REGION \
BACKEND_IMAGE_DIGEST=YOUR_ARTIFACT_DIGEST \
./scripts/deploy-staging.sh
```

Read `docs/deployment.md` before any cloud configuration or promotion. Never add credentials, real student content, provider prompts, Firebase Admin keys, export URLs, or production project settings to this repository.
