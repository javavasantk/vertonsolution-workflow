# Deployment and Production Operations

Project Polaris uses one NestJS modular-monolith container for Cloud Run. PostgreSQL is canonical; Redis is limited to short-lived rate limits, idempotency coordination, allowed caches, and queue coordination. The Android app must remain useful when the backend is unavailable.

## Environment boundaries

Dev, staging, and production require separate projects or clearly isolated resources, service accounts, databases, Redis namespaces, storage prefixes/buckets, queues, feature flags, alert routing, retention configuration, and budgets. Staging uses synthetic accounts/content only. Production configuration and credentials never appear in source control.

## Staging release sequence

1. Run format, type, unit, contract, localization, accessibility, secret, dependency, container, and Terraform checks.
2. Build an immutable backend container, scan it, and publish by digest.
3. Produce a reviewed Terraform plan through federated CI identity.
4. Run safe migration preflight and compatible migration step.
5. Deploy a staging Cloud Run revision with assistant and analytics forwarding disabled by default.
6. Execute synthetic health, authentication rejection, tenant-isolation, assistant policy/schema/confirmation, analytics consent, export/deletion, storage authorization, and redaction smoke tests.
7. Review dashboards, alerts, queue state, costs, and current locale release report.
8. Publish the redacted staging report and confirm rollback/kill-switch readiness.

Production promotion is not an automated consequence of staging success. It requires protected-environment approval, an approved immutable digest, security/privacy/AI review, current language QA evidence, safe migration/forward-fix plan, budget approval, and an explicit release decision.

## Alerts and runbooks

Alert categories include API readiness/error/latency, authorization anomaly, database connection/capacity/backup, sync/job backlog/dead-letter, assistant policy/schema/timeout/cost, export/deletion job failure, storage authorization, redaction/secret scan, feature-flag drift, locale-release drift, and budget threshold. Alerts contain only safe operational metadata; never include learner content, task details, tokens, prompts, export URLs, or identifiers.

An assistant kill switch prevents new provider submissions before content leaves the backend. It does not disable local manual planning, delete drafts, or erase local Android data. Equivalent safe pause controls protect analytics forwarding, sync transmission, export delivery, and deletion intake. See the relevant incident runbook before use.
