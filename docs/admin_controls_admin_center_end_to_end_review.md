# Administrator Controls and Admin Center: Final End-to-End Assessment and Existing-Capability Prompt Guide

**Assessment status:** Final codebase-derived review of the authenticated Administrator experience.  
**Scope:** The active managed React, Node/tRPC, Drizzle, and MySQL-compatible TiDB application only.  
**Author:** Manus AI  
**Evidence standard:** Findings are grounded in the current repository. Reference links identify source and test evidence rather than external materials. This final prompt guide intentionally strengthens present capabilities; it does not authorize new operational workflows.

> **Core conclusion.** The Administrator **Admin Center** is an active, protected, database-backed access-governance capability: it lists safe workforce identity fields, serves server-owned permission-group definitions, persists allowed role changes, and displays database-backed role-change history. The **Controls** page is currently a representative dashboard: its posture claims, audit timeline, and export control are local UI elements with no dedicated Controls query, export contract, or persistent audit feed. The most valuable work is to make that difference unmistakable, improve safe state handling and confirmation, and preserve server-first role control. [1] [2] [3] [4]

## Executive assessment

The current Admin Center is selected only for the Administrator workspace. Its client queries are enabled only when the active role resolves to Administrator; the server separately protects every `access` procedure through centralized `adminProcedure` middleware. The UI directory searches the server-returned safe list of user ID, name, email, role, and last sign-in. Changing a role calls the protected mutation, then refetches the user list and role-change history. [1] [2] [5]

The server validates every submitted role against the stored compatibility-aware role vocabulary. It rejects changes from demo sessions, prevents an administrator from removing their own administrator role, persists the role update, and appends a target/actor/prior-role/next-role/timestamp record to `access_role_changes`. No password hash, reset-token digest, authentication identifier, or readiness data is returned by the workforce directory helper. [2] [3] [4] [6]

The Controls page is broader in presentation but not presently connected. It is visible in navigation to Administrator, HR & Compliance, and Finance; its “Access posture” cards, “Audit activity” rows, and “Export audit view” button use local content. The timeline is expressly labeled representative, and the export control has no action handler. Consequently, Controls must not be described as a live immutable audit log or audit-export system. [1]

| Area | Current state | Assessment |
|---|---|---|
| Admin Center directory | Protected API returns a deliberately narrow workforce-user projection; the Administrator UI supports search. | **Live, database-backed administrative capability.** [1] [2] [3] |
| Role assignment | Role selector invokes an Administrator-only server mutation; mutation writes a role-change record. | **Live persisted capability with server-side guardrails.** [1] [2] [3] |
| Permission model | Eight permission groups are owned and served by the Node router as server configuration. | **Protected server-provided configuration, not database-managed policy records.** [2] [5] |
| Role-change history | Production administrators receive joined, persisted actor/target display records; demo administrators receive an empty history. | **Live database-backed application audit view.** [2] [3] |
| Contextual AI access review | The Admin Center renders an Administrator-only bounded access-review briefing action. | **Existing bounded, human-review assistance.** [1] [2] |
| Controls posture and audit cards | Local arrays and static copy render the whole page; no Controls-specific API is called. | **Representative UI, not an audit-control data system.** [1] |
| Controls export button | Visible button has no click handler, API procedure, export builder, or persistence model. | **Nonfunctional placeholder; not an existing capability.** [1] |

## Architecture and access-path map

The managed Node/tRPC application remains the live authority for administrative access. Frontend route hiding and query enablement improve the user experience, but the backend `adminProcedure` prevents unauthenticated or non-admin callers from invoking the Admin Center contracts directly. The FastAPI reference service and any external deployment path are out of this page’s production flow. [2] [5] [12]

| Layer | Current implementation | Controls / Admin Center responsibility | Required boundary |
|---|---|---|---|
| Workspace navigation | `Controls` is permitted for Administrator, HR & Compliance, and Finance; `Admin center` is permitted only for Administrator. Unpermitted workspace paths resolve to Overview. | Provides role-aware page selection and deep-link recovery. | Client navigation is supplementary; it must not be treated as authorization. [1] |
| Admin Center client hooks | `access.listUsers`, `access.permissionGroups`, and `access.roleChangeHistory` are enabled only for a live Administrator client. `access.assignRole` refetches directory and history after success. | Retrieves administrative data and invokes existing role-change mutation. | Query errors must not appear as “no accounts”; actions need controlled confirmation and self-protection messaging. [1] |
| Controls frontend | `Controls` renders static posture labels, the local `auditRows` array, and an inert export button. | Presents representative governance UI only. | Do not imply persistence, immutable logging, audit export, or a live time approval from this page. [1] |
| tRPC router | `access.*` procedures use `adminProcedure`; `assignRole` applies demo-session and self-demotion checks; permission groups are server constants. | Authoritative access-governance contracts. | Keep checks server-side and retain closed role validation. [2] [5] |
| Database helper | `listWorkforceUsers` selects five safe fields; `assignWorkforceRole` updates a role and appends a role-change record; `listAccessRoleChanges` joins actor and target names. | Implements persisted Admin Center directory and history. | Preserve data minimization and append-only application behavior. [3] |
| Database schemas | `users` contains full approved role enum and `isDemo`; `access_role_changes` records target, actor, prior role, next role, and created-at. | Defines stored administrative facts. | No audit export, policy-management, approval, or Controls-specific table exists. [4] |
| Related AI | `access_review` is only allowed for `admin`; the client sends role counts, permission control counts, and up to five prior/next role pairs as bounded context. | Provides a concise review draft requiring human judgment. | No identity secrets, access decision, readiness fact, or employment decision may enter the AI context. [1] [2] |

## Active rendering versus representative UI

The source contains both live administrative flows and local demonstration constructs. The following distinction prevents an implementation from accidentally promoting a placeholder into a security claim or new workflow. [1]

| Surface | Active on the current page? | Current data / interaction | Correct classification |
|---|---:|---|---|
| Administrator directory | Yes, Admin Center only | Database-backed, narrow `access.listUsers` projection; supports client-side name/email/role search. | Protected live capability. [1] [2] [3] |
| Role selector | Yes, Admin Center only | Immediately calls `access.assignRole` after selection; server writes a role-change history record if changed. | Protected live mutation; confirmation UX needs hardening. [1] [2] [3] |
| Permission model cards | Yes, Admin Center only | Server-served, code-defined eight role groups. | Live server configuration, not editable policy data. [1] [2] |
| Role-change audit | Yes, Admin Center only | Production path reads persisted joined role-change records; demo path returns no history. | Live application-level audit view. [1] [2] [3] |
| “Access posture” cards | Yes, Controls | Three hardcoded claims such as role-scoped navigation and field masking. | Representative explanation, not a real-time control-state feed. [1] |
| “Audit activity” timeline | Yes, Controls | Local `auditRows`, including a literal “Time entry approved” row. | Representative timeline; not connected to `access_role_changes` or `operational_activities`. [1] |
| “Immutable log” pill | Yes, Controls | Static visual label attached to representative rows. | Copy risk: it must not assert immutable persistence for local content. [1] |
| “Export audit view” | Yes, Controls | No `onClick`, download builder, tRPC procedure, or export record model. | Inert placeholder; no audit export exists. [1] |
| AI operations assist | Yes, Admin Center | Calls existing `access_review` AI action with a bounded administrative summary. | Live, Administrator-only advisory; human review remains required. [1] [2] |

## Persisted fields, authorization boundaries, and data minimization

The Admin Center has a narrower data boundary than the Controls page claims. The user listing intentionally returns only fields needed for administrative assignment and display. The dedicated role-change audit similarly returns only the role transition, timestamp, and display names of the target and actor. [3] [4]

| Record / contract | Existing fields or behavior | Current authorized audience | Privacy and security boundary |
|---|---|---|---|
| `users` directory projection | `id`, `name`, `email`, `role`, `lastSignedIn`. | Administrator through `access.listUsers`. | Excludes `openId`, `passwordHash`, reset-token fields, `isDemo`, readiness, resume, financial, and other profile fields. [3] [4] |
| Role assignment input | Positive `userId` and closed role enum including compatibility `user` plus the eight operational roles. | Non-demo Administrator through `access.assignRole`. | Demo callers are denied; self-demotion away from `admin` is denied. [2] [4] |
| `access_role_changes` | Target user ID, actor user ID, previous role, next role, timestamp. | Production Administrator through `access.roleChangeHistory`. | The application exposes no update/delete API for these rows; database-level immutability enforcement is not observed in current code. [2] [3] [4] |
| Permission groups | Eight fixed labels and permission strings declared in Node source. | Administrator through `access.permissionGroups`. | They are reviewable configuration, not a self-service role/policy editor. [2] |
| Demo access directory | `listDemoAccounts()` is used when `ctx.user.isDemo`. | Demo Administrator. | Isolates demo admins from production workforce directory; role changes and history are denied/empty. [2] [6] |
| Admin AI context | Account count, role distribution, permission-group control counts, and up to five role transition pairs. | Administrator for `access_review` only. | Context excludes individual emails, identifiers, passwords, readiness, documents, and business decisions. [1] [2] |
| Controls audit timeline | Local event/actor/target/time strings. | Administrator, HR & Compliance, Finance in the UI. | No server scope or persistence exists; it must remain labeled representative or be replaced by a constrained existing server feed. [1] |

> **Authorization rule.** The Admin Center’s safety depends on server authorization, not its hidden navigation entry. The `adminProcedure` middleware rejects a caller whose authenticated stored role is not `admin`, even if that caller invokes an access procedure directly. [2] [5]

## Verified controls and test evidence

Existing tests demonstrate the core Admin Center authorization and interaction path. They do not prove a live Controls timeline, a working audit export, database-enforced immutability, or comprehensive desktop/mobile Controls and Admin Center browser journeys. [6] [7] [8]

| Evidence | Verified behavior | Remaining limitation |
|---|---|---|
| `access.test.ts` | Non-administrators are rejected from `access.listUsers`; Administrator self-demotion is rejected; a role mutation is passed target, next role, and actor ID; permission groups are Administrator-only and total eight. [6] | It does not cover target-not-found UX, query errors, confirmation before selection, or a full supported-role matrix. |
| `demoAuth.test.ts` | A demo Administrator cannot change roles and sees demo accounts rather than production workforce records. [7] | It does not verify the Admin Center visually disables the selector for demo sessions. |
| `Home.test.tsx` | An authenticated Administrator can route to `/workspace/admin`, search for a user, select `account_manager`, send the mutation payload, and see confirmation/audit headings. It also covers unauthenticated and unauthorized Admin Center deep-link recovery. [8] | It does not cover role-mutation failure, self-role interaction, list/history/permission query failure, Controls content, or responsive Admin Center rendering. |
| `routers.ts`, `db.ts`, and schemas | Role change updates the user role then inserts a role-change record; history joins actor/target display names. [2] [3] [4] | It does not show database constraints that prevent an out-of-band update/delete of audit rows. |
| `demoAuth.browser.test.ts` | Browser flows cover login, recovery, recruiting, assistant, and Delivery/Time & Billing. [9] | It contains **no dedicated browser journey** for Controls or the Admin Center. |

## Verified gaps and capability-constrained remedies

The following items are limited to confirmed gaps in active source and coverage. They avoid inventing a policy engine, external audit system, notifications, or any workforce decision process.

| Priority | Verified gap or risk | Why it matters | Constrained remedy |
|---|---|---|---|
| High | Controls is entirely local representative UI but contains an “Immutable log” visual label and an approval-related event. [1] | Local copy can be mistaken for actual audit evidence or an operational time-approval capability. | Clearly label or replace the display with permitted existing persisted sources; never present local rows as immutable. |
| High | The Controls export button is inert and has no existing export contract. [1] | A visible nonfunctional control falsely implies a compliance/export capability. | Remove it or convert it into non-actionable explanatory UI; do not build an export workflow under this scope. |
| High | Admin Center queries have sparse state treatment; a list failure can read as an empty directory, and role-history / permission-group errors are not surfaced. [1] | Administrative users need to distinguish no data from unavailable protected data. | Add loading/error/empty treatment around existing queries only. |
| High | Role change is sent immediately on selector change; the user-facing prompt has no confirm-before-save step. [1] | An administrative permission change deserves deliberate human confirmation even though server authorization is present. | Add controlled confirmation state around the existing mutation; no new backend action is required. |
| Medium | The self-demotion protection is server-enforced but the Administrator’s own selector remains editable. [1] [2] | Users encounter a predictable rejected request rather than a clear prevention explanation. | Disable/annotate non-admin selections for the acting account while preserving server enforcement. |
| Medium | Demo administrators are server-blocked from changing roles, but active UI selectors can still invite the action. [1] [2] [7] | The interface does not visibly communicate demo-production administrative isolation. | Render a read-only demo-administration state based on existing session metadata and preserve server denial. |
| Medium | Server accepts compatibility role `user`, while the Admin Center selector presents `consultant` and maps `user` back to Consultant for display. [1] [2] [4] | This creates avoidable ambiguity in role display and audit review. | Normalize compatibility-role presentation and test it; retain compatibility support without adding roles. |
| Medium | No dedicated desktop/mobile browser regression covers Controls or Admin Center. [9] | Route and UI regressions could bypass the expected Admin-only experience or revive misleading Controls UI. | Extend the existing authenticated browser-test harness with safe demo/production-appropriate flows. |
| Medium | The role-change log is append-only in the exposed application contract, but no observed schema-level enforcement prevents out-of-band change. [2] [3] [4] | The UI’s immutable-history claim warrants a clearly documented assurance level. | Describe it accurately as immutable in the application workflow; optionally add a migration-level integrity control only after confirming managed-database support and operational need. |

## Implementation prompts, restricted to existing capabilities

These prompts are deliberately ordered. Each one hardens a present frontend, Node/tRPC, Drizzle, or testing capability. **None introduces a new audit product, export feature, notification, workflow automation, employment decision, or external integration.**

### Prompt 1 — Administrator route, server authorization, and safe query projection

> Harden the current Administrator Admin Center without changing the managed runtime. Keep `/workspace/admin` discoverable only to the Administrator role and retain safe recovery of unauthenticated or unauthorized deep links. Preserve `adminProcedure` as the authoritative server gate for `access.listUsers`, `access.assignRole`, `access.permissionGroups`, and `access.roleChangeHistory`. Retain the existing directory projection of only ID, name, email, role, and last sign-in; do not return open IDs, demo flags, password hashes, reset-token data, readiness facts, resumes, finance data, or private storage references. Add direct router tests for unauthenticated, every non-admin role, Administrator, production demo-isolation, and field absence.

**Acceptance conditions:** Direct API calls by non-admin callers fail, client-side hidden navigation remains non-authoritative, and the list contract cannot widen accidentally. [1] [2] [3] [5]

### Prompt 2 — Deliberate role-change confirmation and mutation state

> Improve the existing Admin Center role selector with a controlled, accessible confirmation step before invoking `access.assignRole`. On selection, show the target’s name, current stored role, proposed approved role, and a concise statement that navigation and protected actions will change; offer Confirm and Cancel. Do not add any roles, bulk assignment, policy editing, notification, external approval, or separate mutation. Keep the existing pending state, error notice, success notice, user-list refresh, and role-history refresh. Ensure keyboard controls and focus management are accessible.

**Acceptance conditions:** Cancel sends no mutation; confirm sends exactly the current target/role payload; pending actions cannot duplicate; failures leave displayed directory/audit data unchanged; and success is visible through the existing notice/history refresh. [1] [2] [8]

### Prompt 3 — Self-protection, demo isolation, and compatibility-role clarity

> Clarify existing safeguards in the Admin Center interface while preserving the server as source of truth. For the acting Administrator’s own directory row, make all non-Administrator selections unavailable and explain that an administrator cannot remove their own admin access. For a demonstration administrator, present the demo account directory as read-only and disable role controls with copy explaining that public demo sessions cannot alter roles or access production administrative records. Normalize any stored compatibility `user` role to the existing Consultant presentation in directory and audit copy; do not remove compatibility support or add a ninth operational role. Retain server rejection for self-demotion and demo role changes, then add client and router regression tests.

**Acceptance conditions:** Manipulated client input is still rejected on the server; demo administrators never reach production account data; and a compatibility user is presented consistently as Consultant without data migration. [1] [2] [4] [7]

### Prompt 4 — Admin Center query-state, error, and zero-record handling

> Add component-level loading, error, retry-safe, and zero-record states to the existing Admin Center directory, permission-group, and role-history queries. Do not interpret a failed `access.listUsers` request as “No accounts match this search.” Keep the existing search only over successfully received safe data, maintain the existing no-role-change history message for a successful empty result, and render no fallback production users or permissions. Keep the bounded Admin Center AI action unavailable until the required safe context is available or show the existing human-owner fallback if the AI service is unavailable.

**Acceptance conditions:** Query failures are distinguishable from successful empty results, retries make no mutation, the Admin Center never displays local demonstration users as production data, and AI cannot receive undefined or unrestricted access data. [1] [2] [3]

### Prompt 5 — Accurate role-change history and application-level immutability boundary

> Preserve the existing `access_role_changes` workflow as the Administrator’s persisted role-change history. Keep the stored target user, acting user, prior role, next role, and creation timestamp; retain the joined target/actor display projection; and ensure an unchanged role creates no duplicate audit event. In labels and documentation, describe this as an immutable **application workflow** history because the application exposes no update/delete procedure, rather than claiming unverified database-enforced immutability. Add regression tests for no-op changes, actor/target mapping, descending timestamp ordering, empty history, and absence of update/delete routes. Do not add audit editing, deletions, exports, event streaming, retention automation, or external compliance integrations.

**Acceptance conditions:** Every effective role change yields exactly one persisted history row, unchanged selection yields none, and UI terminology matches the documented assurance boundary. [2] [3] [4]

### Prompt 6 — Replace or clearly contain representative Controls content

> Audit the active Controls page against current data sources. Keep its role-aware navigation availability, but remove or visibly mark local “Access posture” and `auditRows` content as representative explanatory material. Do not label local rows as an immutable log, and remove any literal entry such as “Time entry approved” that could imply a working approval action. Where a live source already exists, a tightly scoped Administrator view may display existing `access.roleChangeHistory` records or existing protected operational activities with explicit source labels; if a permitted live query is unavailable, render neutral explanatory content instead of fabricated events. Do not create a new Controls API, new audit schema, time approval mutation, or staffing/eligibility decision flow.

**Acceptance conditions:** The Controls page cannot be mistaken for a live audit ledger; each displayed live row identifies its existing source; representative content contains no action claim; and no new backend capability is added. [1] [2] [3]

### Prompt 7 — Remove the inert audit-export implication

> Resolve the nonfunctional “Export audit view” control on the Controls page without creating an export feature. Remove the button or render it as explanatory, noninteractive text stating that audit export is not available in this demonstration. Do not add CSV, PDF, download, server export jobs, data retention, external storage, or reporting integrations. Add a focused UI regression test proving the Controls page exposes no actionable audit export until a separately approved data-export capability exists.

**Acceptance conditions:** No clickable audit-export action remains and no user can infer that a compliance artifact was generated. [1]

### Prompt 8 — Bounded Administrator access-review AI

> Preserve the current contextual AI operations assist on the Admin Center only. Keep `access_review` limited to Administrator at the server, accept only the existing bounded context, and send only safe aggregates: account count, role distribution, permission-group control counts, and at most five prior/next role pairs. Continue to require human review before acting and render the designated human-owner fallback when AI is unavailable. Do not pass names, emails, IDs, access tokens, passwords, reset tokens, readiness data, documents, commercial data, or role-change recommendations to the model. Do not render a generic access-review action on the representative Controls page.

**Acceptance conditions:** Non-admin access-review requests fail before the AI service, the prompt remains within existing bounds, and returned text is framed as a human-reviewed observation—not an access, employment, or compliance decision. [1] [2]

### Prompt 9 — Controls and Admin Center regression matrix

> Extend the existing Vitest and authenticated Chromium-style coverage for the Controls and Admin Center pages. Test unauthenticated `/workspace/admin` recovery, every non-admin direct-route rejection, Administrator directory loading/search/error/empty states, permission-group protection, confirmation/cancel/pending/failure/success role mutation states, self-demotion and demo-session denial, compatibility-role presentation, one-row-per-effective-change audit behavior, Admin-only bounded AI action, Controls representative labels, absence of a live approval claim, absence of an audit-export control, and desktop/mobile rendering. Use only existing internal demonstration accounts and records. Do not seed reviews, ratings, testimonials, confidential production records, finance records, or external audit artifacts.

**Acceptance conditions:** The matrix fails if a non-admin reaches Admin Center data, if an unconfirmed change mutates a role, if demo isolation fails, if a query failure looks like a successful empty state, or if representative Controls UI becomes a claimed live capability. [6] [7] [8] [9]

## Recommended implementation order and validation gate

| Order | Prompt | Reason for sequence | Minimum validation before proceeding |
|---:|---|---|---|
| 1 | Server authorization and projection | Locks the trustworthy Admin Center contract before presentation work. | Router role and field-exclusion matrix. |
| 2 | Confirmation and self/demo clarity | Makes the only current administrative mutation deliberate and understandable. | Confirm/cancel/pending/error and server-denial tests. |
| 3 | Query-state treatment | Prevents protected-data failures from appearing as benign emptiness. | Loading/error/empty component tests. |
| 4 | Role-history accuracy | Aligns history wording and behavior with application-level evidence. | Effective/no-op change and history projection tests. |
| 5 | Controls representative containment | Removes misleading claims before connecting any existing source. | Controls source-label and no-action tests. |
| 6 | Inert export removal | Prevents accidental representation of a nonexistent capability. | No clickable audit-export regression. |
| 7 | Bounded AI review | Preserves existing advisory capability after the safe source state is clear. | Admin-only, bounds, exclusion, and unavailable-service tests. |
| 8 | Browser matrix | Confirms navigation, state, and responsive behavior end to end. | Full test suite, TypeScript check, desktop/mobile authenticated flows. |

## Explicitly out of scope

This guide does **not** recommend the following because they do not exist in the verified current Controls/Admin Center capability set:

- Bulk role changes, self-service permission grants, policy editing, custom roles, delegated administration, or an organization-wide entitlement engine.
- Audit deletion/editing, CSV/PDF audit export, external audit platforms, event streaming, retention jobs, scheduled reports, or notifications.
- Timesheet entry, time approval, payroll calculation, invoicing, payments, commercial calculations, accounting records, or external accounting integrations.
- Employment, readiness, work-authorization, eligibility, compensation, hiring, candidate, or staffing decisions, including AI-generated recommendations.
- Customer reviews, ratings, testimonials, real client data, real candidate documents, or confidential production records.
- A FastAPI cutover, Railway/external deployment, external TiDB migration, or any change to the managed Node/tRPC session/authentication runtime.

## Source references

[1]: ../client/src/pages/Home.tsx "Workspace role routing, active Controls and Admin Center components, query/mutation wiring, representative audit rows, and bounded AI context"
[2]: ../server/routers.ts "Access router, closed role validation, demo/self-demotion safeguards, permission groups, and AI task authorization"
[3]: ../server/db.ts "Narrow workforce directory projection, role persistence, append-only role-change insert, and audit display joins"
[4]: ../drizzle/schema.ts "Users role and demo fields plus access-role-change table fields"
[5]: ../server/_core/trpc.ts "Centralized protected and Administrator procedure middleware"
[6]: ../server/access.test.ts "Access router role gates, self-protection, permission group, and mutation contract tests"
[7]: ../server/demoAuth.test.ts "Demo role-change denial and production-directory isolation tests"
[8]: ../client/src/pages/Home.test.tsx "Admin Center client interaction and protected deep-link tests"
[9]: ../server/demoAuth.browser.test.ts "Existing browser regression coverage; no dedicated Controls/Admin Center journey"
[10]: ../docs/admin_delivery_time_billing_end_to_end_review.md "Preceding assessment pattern and related portal boundaries"
[12]: ../fastapi_reference/app/main.py "Future reference service; not the live runtime"
