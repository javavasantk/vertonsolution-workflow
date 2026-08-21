# Project Polaris — Backend Gap Audit and End-to-End Implementation Prompts

**Scope:** Current stack only — **Node.js, Express, tRPC, TypeScript, Drizzle ORM, MySQL/TiDB, React/Vite**.  
**Purpose:** Identify the backend capabilities that are implemented today, the production gaps that remain, and provide copy-paste prompts to implement those gaps without replacing the existing application.

> This is a **backend maturity audit**, not a claim that the current application is unsafe or unusable. The existing platform already has working authentication, protected workspace routes, a deterministic AeroForge solver, entitlement checks, Razorpay-ready order/signature/webhook paths, membership records, inquiry persistence, evidence-backed certificate issuance, and a server-side Squad Pro Co-Pilot. The prompts below focus on taking those foundations to a production-operational standard.

## 1. Current backend capability map

| Capability | Current implementation | Backend maturity gap |
|---|---|---|
| Password authentication | Hashed password signup/sign-in and HttpOnly session cookies | No login throttling, email verification, password reset, session revocation, or credential-change flow |
| Google OAuth | Start/callback, state cookie, verified email check, session issuance | No PKCE; redirect origin comes from a client input; provider subject is not persisted independently; production consent success not acceptance-tested |
| Authorization | tRPC public/protected/admin procedures plus plan checks | No centralized policy layer, audit trail, or database-enforced tenancy/FKs |
| Catalog | SQL seed table with ten records; UI content rendered | No public catalog API, no enrollment flow, no admin content workflow, no search/pagination API |
| Inquiries | Validated public tRPC mutation persisted to SQL | No spam protection, reviewer workflow, owner notification, or inquiry lifecycle/status |
| AeroForge | Server-saved trials and Builder entitlement gate | Missing range-policy/version metadata, trial lifecycle/deletion/export, and broader ownership/integration coverage |
| Subscriptions | Plan definitions, order creation, client-signature verification, raw webhook validation, SQL records | Not yet a complete recurring Razorpay subscription lifecycle; no event ledger/idempotency record, expiry reconciler, refund lifecycle, or real provider acceptance run |
| Workspace | Backlog creation/status updates, trial/certificate/membership read model | No task update/delete, comments/attachments, optimistic conflict control, or audit history |
| Certificates | Admin-controlled issue flow backed by a saved user-owned engineering trial | No public credential verification endpoint, reviewer queue, audit trail, revocation, or certificate template/rendering workflow |
| AI Co-Pilot | Server-side Squad Pro access gate and persisted messages | No quota/rate limit, moderation/injection boundary, retention controls, trace IDs, model fallback, or cost telemetry |
| Operations | Basic health query and structured application pieces | No readiness DB check, request IDs, security headers, rate limits, metrics, alerting, CI, backup/restore runbook, or migration gates |
| Privacy | Static public policy route | No consent/version records, account export/deletion process, retention policy, or administrative data tooling |

## 2. Priority order

| Priority | Prompt | Why it comes first |
|---|---|---|
| P0 | 0. Delivery guardrails | Ensures every later change is migration-safe, testable, and reversible |
| P0 | 1. Security edge and request governance | Cookie-authenticated APIs need CSRF, rate limits, request correlation, and safer payload limits |
| P0 | 2. Authentication and Google OAuth hardening | Protects account identity and session lifecycle |
| P0 | 3. Entitlement source of truth | Prevents stale `users.planId` values from granting access after expiry/cancellation |
| P0 | 4. Razorpay recurring lifecycle | Required before turning on real subscriptions |
| P1 | 5. Data integrity and audit trail | Adds foreign keys, uniqueness, lifecycle constraints, and accountability |
| P1 | 6. Catalog, enrollment, and content APIs | Converts seeded/UI-only content into backend-managed learning flows |
| P1 | 7. Workspace and certificate operations | Completes user/project lifecycle and verifiable credentials |
| P1 | 8. AeroForge run governance | Adds reproducibility, export, data lifecycle, and safety metadata |
| P1 | 9. AI Co-Pilot reliability and cost controls | Makes the premium AI feature operationally safe |
| P2 | 10. Inquiry CRM and notifications | Turns contact forms into a managed operational workflow |
| P2 | 11. Privacy and user-data lifecycle | Completes account/deletion/export obligations |
| P0 | 12. Tests, CI, observability, and release workflow | Gates each backend change before production |

---

## Prompt 0 — Backend delivery guardrails

```text
You are extending the existing Project Polaris backend. Keep its current stack:
- Node.js + TypeScript + Express 4
- tRPC 11 for application APIs under /api/trpc
- Drizzle ORM with MySQL/TiDB
- React/Vite frontend
- Existing Manus OAuth session SDK and HttpOnly session cookies

Do not replace the stack with Python, Next.js, REST-only APIs, Prisma, Supabase, Stripe, or a different payment provider. Preserve existing routes and database data.

For every change:
1. Read the affected schema, db helper, router, and existing test files before editing.
2. Add or update Drizzle schema first.
3. Generate an Alembic-equivalent Drizzle migration with `pnpm drizzle-kit generate`, review the SQL, and apply it safely.
4. Make data migrations backward-compatible. Do not add a NOT NULL column to populated tables without a safe backfill plan.
5. Put database access in server/db.ts or focused repository modules, not React components.
6. Put authorization in reusable tRPC middleware/helpers, not only frontend conditionals.
7. Add Vitest coverage for success, failure, ownership, duplicate/retry, and role/plan-gate cases.
8. Run `pnpm test`, `pnpm check`, and `pnpm build` before finishing.
9. Use a descriptive checkpoint only after all changed TODO items are checked.

First return a short implementation plan and the exact files/migrations to change. Then implement the requested prompt completely.
```

---

## Prompt 1 — Security edge, request governance, and abuse protection

```text
Harden the existing Express/tRPC backend without changing user-facing routes.

Implement these production controls:

1. Add a request-ID middleware. Accept a valid incoming X-Request-ID or create a UUID. Attach it to request context, API error responses, and structured logs.
2. Set Express `trust proxy` correctly for the managed deployment and add security headers with Helmet or equivalent: CSP, X-Content-Type-Options, Referrer-Policy, frame-ancestors protection, HSTS only in HTTPS production, and a conservative Permissions-Policy.
3. Add an explicit CORS allowlist derived from a typed environment variable. Do not use wildcard origins with credentials.
4. Reduce global JSON/body limits from 50 MB to a small default such as 1 MB. Create narrowly scoped larger limits only for future authenticated upload routes.
5. Add rate limits backed by a durable/shared mechanism if available; otherwise build an interface with an in-memory development adapter and production Redis adapter. Apply differentiated limits to:
   - signup/signin: per IP and per email identifier
   - Google OAuth start/callback
   - inquiry submission
   - Razorpay webhook
   - AI Co-Pilot calls: per authenticated user
6. Add CSRF protection for cookie-authenticated mutation routes. Use a double-submit or signed token approach compatible with tRPC. Exempt only verified third-party raw-body webhook endpoints.
7. Add centralized tRPC error formatting that returns safe public messages plus request ID, while logging the original exception server-side.
8. Add `GET /health/live` and `GET /health/ready`; readiness must make a lightweight database query and report dependency status without exposing secrets.

Create tests for CORS rejection, rate-limit behavior, CSRF rejection/acceptance, request ID propagation, safe error shape, live health, and failed readiness when the DB is unavailable. Document required environment variables and proxy assumptions.
```

---

## Prompt 2 — Authentication, session lifecycle, and Google OAuth hardening

```text
Upgrade the existing password and Google OAuth backend while preserving current user accounts and cookie-based sessions.

Password and sessions:
1. Add normalized-email uniqueness enforcement and make signup race-safe by catching database uniqueness errors and returning a stable CONFLICT error.
2. Add password-reset request and completion flows. Store only hashed, single-use, short-lived reset tokens in a new SQL table. Use a pluggable mail adapter; do not expose whether an email exists.
3. Add email verification state and an opt-in verification-token flow. Do not silently mark password accounts verified.
4. Add `auth_sessions` table: id, userId, session token hash/jti, createdAt, expiresAt, revokedAt, ip hash, user agent hash, lastSeenAt. Issue short-lived access session plus renewable session, or retain current session SDK while recording/revoking its opaque session identifier where possible.
5. Add logout-all-sessions and revoke-session operations. Revoke sessions after password reset/change.
6. Record authentication audit events: signup, successful sign-in, failed sign-in (no password), logout, reset requested/completed, OAuth link/unlink.

Google OAuth:
1. Add PKCE (S256 code verifier/challenge) to OAuth start/callback. Store the verifier with the state nonce in a secure short-lived HttpOnly cookie or server-side state store.
2. Remove client-controlled arbitrary origins from the OAuth callback design. Derive redirect_uri from a single server-owned PUBLIC_APP_URL environment variable or an explicit allowlist. Reject mismatches.
3. Add OAuth identity table: provider, providerSubject, userId, providerEmail, linkedAt, lastUsedAt; unique(provider, providerSubject). Migrate existing Google users safely.
4. Do not automatically attach a Google identity to an existing password account purely by matching email. Require the signed-in account holder to explicitly link it, or use an account-link confirmation flow.
5. Preserve state validation, secure cookies, verified Google email requirement, and safe error redirects.

Write tests for duplicate signup race handling, reset token replay rejection, email verification, session revocation, logout-all, PKCE challenge generation/validation, invalid OAuth state, origin allowlist rejection, provider-subject uniqueness, and explicit account-link rules. Include a post-publish manual acceptance checklist for a real Google consent return.
```

---

## Prompt 3 — Entitlement source of truth and subscription expiry reconciliation

```text
Fix subscription entitlement consistency in the current Project Polaris backend.

Current issue to address: user.planId is denormalized and used by tRPC authorization, while subscriptions have their own status and period fields. A cancelled or expired subscription can leave a stale paid plan on the user row.

Implement:
1. Define a single `resolveEntitlements(userId)` server function. It must select the current valid subscription by status and period, derive effective plan, and return capability flags. Explorer is the fallback.
2. Add indexes that support entitlement lookup by userId, status, and currentPeriodEnd.
3. Update `protectedProcedure` or an entitlement middleware so save-trial, certificates, and Co-Pilot gates use effective entitlements—not only a stale `ctx.user.planId`.
4. Retain users.planId only as a cache if needed, but update it transactionally and never trust it as the sole authority.
5. Implement an idempotent reconciliation service that expires subscriptions whose currentPeriodEnd has passed and downgrades the cached plan only when no other active paid subscription remains.
6. Use a webhook-first design plus a scheduled reconciliation trigger. Do not rely on an endless in-process interval. Provide a command/function usable from a managed scheduler.
7. Add a `subscription_events` table for provider/local lifecycle events with provider event ID unique, type, subscription ID, payload JSON, processedAt, processing result, and error text.

Test: active Builder, active Squad Pro, cancelled-but-in-period, expired, failed, overlapping records, stale users.planId cache, and idempotent reconciliation. Verify every gated tRPC procedure now behaves from effective entitlement data.
```

---

## Prompt 4 — Complete Razorpay recurring billing lifecycle

```text
Complete the existing Razorpay backend integration for real recurring subscriptions. Razorpay is the only payment provider.

Keep the existing safe configuration-required UI when secrets are absent. In configured mode, implement:

1. Plan configuration:
   - Add RAZORPAY_BUILDER_PLAN_ID, RAZORPAY_BUILDER_ANNUAL_PLAN_ID, and RAZORPAY_SQUAD_PRO_PLAN_ID.
   - Map internal plan IDs server-side. Never accept a Razorpay plan ID from the browser.
   - Validate all payment environment variables at startup in production.

2. Recurring subscription creation:
   - Use Razorpay’s subscription API for Builder monthly, Builder Annual, and Squad Pro monthly.
   - Persist a created local subscription and payment attempt transactionally before returning Checkout data.
   - Store razorpaySubscriptionId after provider creation.
   - Make create operations idempotent with a client idempotency key plus server constraints, preventing accidental duplicate purchases on double-click/retry.

3. Webhook event ledger and lifecycle:
   - Verify raw body signature before parsing.
   - Insert the provider event ID into subscription_events with a unique index before state mutation; treat duplicate events as 200/idempotent.
   - Handle payment.captured, payment.failed, payment.refunded, subscription.activated, subscription.charged, subscription.pending, subscription.halted, subscription.cancelled, and subscription.completed/expired according to the current provider schema.
   - Update local payment/subscription records transactionally and invoke the entitlement reconciliation path.
   - Persist sanitized provider payloads and processing outcomes for support/audit.

4. Verification and cancellation:
   - Keep client checkout signature verification as a fast confirmation, but treat verified webhook events as the durable source of truth.
   - Cancel only at cycle end using the provider subscription ID.
   - Preserve paid access through currentPeriodEnd.
   - Add an idempotent grace-period/expiry command and do not downgrade early.
   - Support refund and charge failure states without deleting financial history.

5. Secure failure behavior:
   - No provider secret reaches the client.
   - Do not activate a membership when signature checks fail, payloads reference another user, amount/currency differs, or plan metadata mismatches local records.
   - Add retries/dead-letter logging for recoverable provider processing failures.

Write unit and integration tests for each lifecycle transition, duplicate webhook delivery, out-of-order events, signature failure, order/subscription ownership mismatch, cancellation grace period, refund, and expiry reconciliation. Add a test-mode runbook: test checkout, test webhook, test renewal, test cancellation, test expiry, and move to live keys only after all pass. Follow Razorpay’s current subscription and webhook documentation. [1] [2]
```

---

## Prompt 5 — Database integrity, tenancy, lifecycle, and audit events

```text
Strengthen Drizzle/MySQL database integrity for the existing Polaris schema without data loss.

Implement safe migrations for:
1. Add foreign keys or documented enforced relationships for userId across subscriptions, payments, trials, backlog items, enrollments, certificates, copilot messages, and inquiries where ownership applies. Choose ON DELETE behavior deliberately; do not cascade financial/payment data blindly.
2. Add missing unique constraints:
   - certificates.credentialCode
   - one enrollment per (userId, catalogSlug)
   - one certificate per (userId, sourceTrialId) when sourceTrialId is present
   - provider event IDs in subscription_events
   - OAuth provider+subject identity
3. Add indexes for high-frequency paths: subscription entitlement queries, payment lookup, trial ownership, backlog ownership/status, certificate verification code, inquiry review status, and AI conversation retrieval.
4. Add createdAt/updatedAt consistently to mutable business tables where missing.
5. Add audit_events table with actorUserId nullable, targetUserId nullable, entityType, entityId, action, metadata JSON/text, requestId, createdAt. Record certificate issuance, plan change, payment event, admin reviewer action, auth-sensitive action, and account deletion request.
6. Add `deletedAt` / status fields only where product requirements need soft deletion. Do not soft-delete payments or issued certificates; use revocation/status records instead.
7. Wrap multi-table changes such as checkout activation, certificate issuance, and reviewer completion in database transactions.

Return the migration review, backfill strategy, query plans for the new indexes, and tests that prove uniqueness, ownership, transaction rollback, and no orphan rows on key workflows.
```

---

## Prompt 6 — Backend-managed catalog, enrollment, and learning progress

```text
Turn the existing catalog seed data into complete backend learning workflows.

Implement tRPC routers and SQL helpers for:
1. Public catalog listing with validated filters: type, domain, difficulty, status, required tier, search text, cursor pagination, and stable sort order.
2. Public course/program detail by slug using only published records.
3. Authenticated enrollment request/start. Enforce required subscription tier server-side. Prevent duplicate enrollment through a database constraint.
4. Authenticated progress update rules. Do not permit arbitrary progress=100 client writes. Define credible progress events such as completed lesson, submitted project, or reviewer verification.
5. Admin content CRUD for catalog records with published/draft state, sort order, and audit events.
6. Admin/reviewer queue for progress evidence that may lead to certificate eligibility.
7. Optional full-text search interface using MySQL/TiDB-compatible indexing, with a safe fallback if unavailable.

Add tests for public visibility, unpublished content protection, filter correctness, cursor stability, tier restrictions, duplicate enrollment, forged progress rejection, legitimate reviewer completion, and admin authorization.
```

---

## Prompt 7 — Workspace task lifecycle and collaboration-safe APIs

```text
Extend the student workspace backend beyond create/status-only backlog behavior.

Implement:
1. Backlog item read, create, update, status transition, delete/archive, and list APIs. All use ownership filters in SQL.
2. Optimistic concurrency via updatedAt/version: reject stale edits with a conflict response that returns latest record details.
3. Task activity/audit history: created, edited, moved, archived, due-date change, priority change.
4. Optional task comments table, strictly owned/authorized, with rate limits and text sanitization.
5. Saved trial detail and export endpoint. Export only the signed-in user’s records in CSV/JSON, include solver version/reference metadata, and rate-limit export generation.
6. A user dashboard aggregate query that returns counts and the most recent records efficiently without N+1 database queries.

Test cross-user access denial for every item type, stale update conflict, archive semantics, audit writing, export ownership, dashboard aggregation, and empty states.
```

---

## Prompt 8 — Certificate review queue, public verification, revocation, and evidence integrity

```text
Complete the evidence-backed certificate backend.

Preserve the current rule that a certificate requires a user-owned saved AeroForge trial and a verified completion. Add:

1. Reviewer queue:
   - Pending completion-review table or status model with submitted evidence trial ID, target catalog item, reviewer ID, decision, rationale, timestamps.
   - Students may submit eligible saved trials for review; they may not self-mark completion or self-issue certificates.
   - Admin/reviewer may approve or reject with reason. Approval atomically creates/updates enrollment completion evidence.

2. Certificate lifecycle:
   - Issue only from an approved review/completion.
   - Generate unique non-guessable credential codes.
   - Add certificate status enum(active, revoked), revokedAt, revokedReason nullable, issuedByUserId, reviewId.
   - Never delete an issued certificate just because a user deletes a visible workspace record.

3. Public verification:
   - Add public `certificate.verify` query/route accepting credential code.
   - Return minimal data: verified status, title/program type, issue date, and revoked state. Do not leak email, private trials, internal IDs, or user profile data.

4. Admin audit and access:
   - Require admin/reviewer role for decisions and revocations.
   - Write audit_events for every review, decision, issuance, verification lookup summary, and revocation.

Write integration tests for student submission, cross-user trial rejection, reviewer approval, certificate issue, public valid/invalid/revoked verification, duplicate prevention, and transaction rollback if any evidence step fails.
```

---

## Prompt 9 — AeroForge reproducibility, input policy, and run lifecycle

```text
Harden the AeroForge backend as an educational engineering record system.

Implement:
1. Strict server-side input policy per challenge: min/max Mach, AoA, and altitude; precise validation errors; finite-number checks; unit annotations.
2. Solver metadata on each saved run: solverVersion, modelType = reduced_order_educational, challenge configuration version, benchmark source label/version, and assumptions text.
3. Persist a normalized immutable input/output snapshot JSON alongside existing numeric columns so runs remain reproducible if solver code later changes.
4. Add trial detail query, authenticated export (CSV/JSON), and user-controlled archive/delete policy. If a run is referenced by an active certificate, preserve it and archive rather than hard-delete.
5. Add server-side comparison endpoint for two user-owned trials: deltas for Mach, AoA, altitude, CL, CD, L/D, airspeed, and benchmark delta.
6. Add API output disclaimer that values are educational reduced-order approximations, not CFD, flight certification, or safety-critical analysis.

Write tests for all constraint boundaries, solver-version persistence, reproducibility snapshot, compare ownership protection, certificate-protected archive behavior, and export response correctness.
```

---

## Prompt 10 — Squad Pro AI Co-Pilot reliability, safety, and cost governance

```text
Productionize the existing server-side Squad Pro AI Co-Pilot.

Implement:
1. Central AI provider adapter with configurable model, timeout, retry policy for safe transient errors, circuit breaker, and provider-independent interface.
2. Per-user and per-plan quotas: messages/day, input chars/day, output tokens/day. Store usage in SQL and enforce before provider calls.
3. Per-user rate limiting plus global concurrency limit to protect the API.
4. Conversation model with conversationId, message role, createdAt, model, token estimate/actual when available, requestId, completion status, failure code. Keep migration compatibility with current copilot_messages.
5. Safe context construction: include only the user’s own recent messages and optional selected AeroForge data that the user owns. Limit context size deterministically.
6. System safety instruction: distinguish educational approximations from certification-grade analysis; state assumptions; do not invent experiments/citations; do not provide unsafe operational advice; do not make payments/subscription decisions; do not fabricate credential evidence.
7. Prompt-injection boundary: treat user-provided content as data, not privileged system instructions. Sanitize/render markdown safely on frontend.
8. Data retention setting and user conversation delete/export endpoint.
9. Structured model telemetry: latency, selected model, response outcome, quota rejection, token/cost estimate; never log prompt contents by default in production.

Test Explorer/Builder denial before model adapter execution, Squad Pro quota success/limit, retry behavior, timeout safe error, only-own-history access, conversation deletion/export, and model adapter mocks. Do not invoke paid models in unit tests.
```

---

## Prompt 11 — Inquiry CRM, anti-spam, reviewer operations, and notifications

```text
Turn contact and school inquiry persistence into an operational backend workflow.

Implement:
1. Add inquiry status enum(new, triaged, in_progress, closed, spam), assignedToUserId nullable, internalNotes, repliedAt, source metadata, and updatedAt.
2. Add public anti-spam: rate limit, honeypot field, timestamp/minimum-fill-time validation, body-size limit, and optional CAPTCHA adapter behind environment configuration. Never reveal anti-spam internals in responses.
3. Add admin-only inquiry list/detail/update/assign APIs with filter cursor pagination and audit events.
4. Add owner notification adapter invoked on legitimate new inquiry. Make delivery failure non-blocking but observable/retryable.
5. Add safe acknowledgement email adapter, default disabled until transactional email is configured.
6. Retention/deletion policy fields so expired inquiries can be anonymized by a scheduler rather than an in-process loop.

Test validation, spam rejection, rate limiting, admin authorization, status transitions, notification retry/outbox behavior, and anonymization scheduling command.
```

---

## Prompt 12 — Privacy, data export/deletion, and administrative governance

```text
Implement user-data lifecycle operations for Project Polaris.

Add:
1. Account data export request endpoint. Generate a user-owned JSON export containing profile, enrollments, trials, workspace tasks, certificates, subscription summary, and Co-Pilot messages where allowed. Exclude secrets, internal audit notes, and other users’ data.
2. Account deletion request workflow with confirmation, grace period, admin processing state, and audit trail. Do not silently hard-delete payment/financial records; anonymize or retain only what is legally/operationally necessary according to documented policy.
3. Consent/version record table for privacy policy and terms acceptance, including policy version and timestamp. Require recorded acceptance at account creation if product policy requires it.
4. Admin data-governance APIs for export/delete request status without exposing private user content unnecessarily.
5. Retention configuration and scheduler-compatible purge/anonymize commands.

Provide a data map, exact retention decisions for each table, safe migrations, and tests proving an export contains only the requesting user’s data and deletion does not orphan financial/audit records.
```

---

## Prompt 13 — Observability, CI/CD, migrations, backup, and release discipline

```text
Add production operations for the existing Project Polaris backend.

Implement:
1. Structured logs with requestId, route/procedure, authenticated user ID if present, latency, status, and safe error code. Never log passwords, OAuth codes, cookie values, Razorpay secrets/signatures, or full AI prompts.
2. Metrics endpoints or adapter for request rate/error/latency, login failures, OAuth callback errors, webhook verification/processing status, subscription transitions, trial saves, certificate events, AI quota/latency/errors, and inquiry spam rejections.
3. Alerting hooks for repeated Razorpay webhook failures, payment activation mismatch, DB readiness failure, OAuth token exchange failures, and AI provider circuit-open status.
4. CI pipeline that runs pnpm test, pnpm check, pnpm build, migration generation validation, and a migration smoke test against disposable MySQL/TiDB.
5. Migration release gate: apply migrations before deploy only through an explicit audited command; run database backup/snapshot first; block destructive migrations without a manual review flag.
6. Backup/restore runbook with RPO/RTO targets, restore verification, encrypted secret management, and production environment matrix.
7. Add dependency audit and lockfile validation.

Write a README section with local development, test DB setup, migration workflow, env variables, health checks, deployment, rollback, incident response, and post-deploy acceptance checks.
```

---

## Prompt 14 — Comprehensive backend integration test suite

```text
Build a comprehensive automated backend test suite for Project Polaris.

Retain existing Vitest unit tests and add integration tests against a disposable MySQL/TiDB database. Test real Drizzle migrations and real tRPC callers or HTTP routes where possible.

Required coverage:
1. Auth: signup race, sign-in, wrong password, login throttle, password reset, session revoke, protected context, OAuth state/PKCE/linking.
2. Authorization: cross-user ownership denial for trials, backlog, certificates, exports, AI history, and admin procedures.
3. Entitlements: every plan/capability pair; active, cancelled-in-period, expired, failed, overlapping, and stale cache states.
4. Payments: configuration-required state, recurring subscription create idempotency, signature verification, all webhook transitions, duplicate/out-of-order events, refund, cancellation, grace period, expiry reconciliation.
5. Catalog/enrollment: public/draft visibility, filters, duplicate enrollment, forged progress rejection, reviewer approval.
6. Certificates: evidence chain, approval, public verification, revocation, duplicate prevention.
7. AeroForge: valid/invalid ranges, deterministic snapshot, compare/export ownership, archived/certificate-referenced trial behavior.
8. Co-Pilot: plan gate, quota, rate limit, timeout/retry, private history, delete/export.
9. Inquiries: validation, spam controls, triage access, notifications/outbox.
10. Security/operations: CSRF, CORS, body limit, request IDs, error shape, live/ready health, audit events.

Add a browser-level smoke suite for auth redirect, plan gate UI, trial save, workspace reload, pricing config-required state, and inquiry response. Make CI fail on type errors, migration drift, test failure, and unsafe secret scanning.
```

---

## Final implementation audit prompt

```text
Audit the current Project Polaris backend after all prompts have been implemented. Return a table with: capability, implemented code paths, database tables/migrations, authorization rule, tests, observability signal, status, and remaining manual acceptance check.

Do not call a capability complete if only a frontend control or tRPC procedure exists. Confirm database integrity, ownership enforcement, retry/idempotency behavior, plan lifecycle behavior, server-side secrets, and error/reload behavior. Explicitly distinguish:
- Implemented and tested.
- Implemented but needing provider acceptance testing.
- Deferred by product decision.
- Not implemented.

Run pnpm test, pnpm check, pnpm build, migration smoke tests, and the browser smoke suite. Include exact next commands for any deferred live Razorpay or production Google OAuth validation.
```

## References

[1] [Razorpay — Subscriptions API](https://razorpay.com/docs/api/payments/subscriptions/)

[2] [Razorpay — Webhooks](https://razorpay.com/docs/webhooks/)
