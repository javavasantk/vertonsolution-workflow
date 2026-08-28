# ADR 0013: Start Prompt 13 with rejecting external adapters

**Status:** Accepted

## Context

The selected repository did not contain the Android, NestJS, PostgreSQL, Firebase, Google Cloud, or earlier Prompt 01–12 implementation required for a live Project Polaris assistant. Production credentials, cloud projects, provider agreements, retention settings, and approved legal copy are not present in source control and must not be invented.

## Decision

The initial Prompt 13 implementation creates a separate additive monorepo and uses in-memory repositories, a deterministic draft provider, and a rejecting authentication verifier by default. The feature gate is disabled by default. The source provides the bounded contracts, deterministic policy checks, tenant/consent interfaces, confirmation receipts, analytics allow-list, privacy state, OpenAPI contract, Android local-fallback coordinator, Terraform templates, CI validation, and operational documentation needed for later safe integration.

## Consequences

No external service is called, no student data can leave the local client through the checked-in scaffold, and all live assistant routes reject authorization by default. A later controlled milestone must replace adapters with Firebase verification, PostgreSQL migrations, secure provider adapter, Cloud Tasks/Storage, Redis, and Google Cloud resources after protected configuration and staging tests are available. This preserves the local-first product promise at the cost of deliberately deferring a production AI enablement.
