# Administrator Delivery and Time & Billing: Final End-to-End Assessment and Existing-Capability Prompt Guide

**Assessment status:** Final codebase-derived review of the authenticated Administrator workspace.  
**Scope:** The currently managed React, Node/tRPC, Drizzle, and MySQL-compatible TiDB implementation only.  
**Author:** Manus AI  
**Evidence standard:** Every finding below is grounded in the current repository. Reference links identify the implementation or test evidence; they are not external sources. The prompts are deliberately constrained to verified present capabilities and do not authorize new operational workflows.

> **Core conclusion.** Delivery is substantially connected to protected, normalized operational records and includes a real, server-authorized project update path. Time & Billing is a protected, database-backed **billing-readiness** view for time-entry status and associations. It is not a payroll, invoicing, accounting, or payment module. The remaining work is principally privacy hardening, state handling, and representative-UI clarity—not creation of new business workflows. [1] [2] [3]

## Executive assessment

The authenticated `Delivery` page renders three active layers: database-backed staffing-demand and assignment signals, database-backed client/project/capacity panels, and a role-gated inline project editor. The editor persists only a project name, delivery status, and project-manager name; the Node route validates the permitted status vocabulary and rechecks the allowed roles before persistence. Each saved project update also writes an **operational activity**, which is a delivery-status record rather than an immutable role-access audit. [1] [2] [4]

The authenticated `Time & billing` page renders a database-backed time-entry summary plus a detail table that joins available assignment and project records in the client. The displayed operational fields are week ending, hours, status, assignment/project association, and note. The existing state model is deliberately constrained to `draft`, `submitted`, `approved`, and `exception`. There is no rendered mutation for entering, editing, submitting, approving, invoicing, paying, or calculating payroll. [1] [3] [5]

The principal verified risk is the protected-but-broad `portal.demoSummary` response. Any authenticated workspace user currently receives the same normalized collections of client, project, demand, assignment, timesheet, and activity rows. This is **not evidence of a present commercial-field leak**: the relevant tables contain no bill-rate, pay-rate, or margin columns. It is, however, a clear reason to add server-first role projections and explicit permitted relationship scope before any sensitive fields are ever added. [2] [3] [4]

| Area | Current state | Assessment |
|---|---|---|
| Delivery data | Active rendered components read protected summary collections populated from clients, projects, demands, assignments, and activities. | **Database-backed operational capability.** [1] [4] |
| Project editing | Four delivery roles, including Administrator, can update the three supported project fields after server validation. | **Real persisted curation capability.** [2] [4] |
| Timesheet display | Active rendered summary and detail components read protected timesheet rows and resolve assignment/project names when present. | **Database-backed billing-readiness capability.** [1] [4] |
| Commercial values | The visible rates and contribution percentage are literal sample values; visibility is decided by the active client role. | **Representative masking demonstration, not stored finance data.** [1] [3] |
| Approval UI | A legacy component contains local approval state and an “Approve 40 hours” control, but it is not selected by the active page router and has no backed mutation. | **Unrendered representative UI; it must not imply a live approval process.** [1] |
| Server data minimization | The protected summary is authenticated but uses broad table reads and raw-normalized row return. | **Verified hardening gap.** [2] [4] |

## Architecture and request-path map

The live managed application remains the authoritative runtime. The frontend obtains the authenticated portal summary through tRPC; Node is responsible for authentication and mutation authorization; Drizzle reads and writes the managed TiDB-compatible database. The FastAPI directory remains a non-live migration reference and is not part of these pages’ production request path. [2] [4] [10]

| Layer | Current implementation | Delivery / Time & Billing responsibility | Boundary that must remain intact |
|---|---|---|---|
| Workspace routing | `Home.tsx` resolves the permitted workspace page and renders Delivery as `Delivery`, `DatabaseDeliveryLifecycle`, and `InlineProjectTable`; it renders Time & Billing as `DatabaseTimeBilling`, `TimesheetDetailTable`, and `FinanceScope`. | Selects active page components after authenticated workspace access. | Do not treat client routing or conditional controls as authorization. [1] |
| Client data access | Both pages consume the protected `portal.demoSummary` query. | Supplies displayed operational collections and client-side relationship maps. | Queries need explicit loading, failure, and zero-row treatments. [1] [2] |
| Node/tRPC API | `portal.demoSummary` is protected. `portal.updateProject` validates supported input and server-enforces delivery edit roles. | Establishes authenticated access and the persisted project-update contract. | Role checks must remain server-side and must precede DB writes. [2] |
| Data helper | `getDemoPortalSummary()` reads client, project, demand, assignment, timesheet, and activity tables; `updateClientProject()` updates a project and inserts an activity. | Provides read aggregation and real project persistence. | Replace broad return shape with allowed field projections before expanding data sensitivity. [4] |
| Database | Drizzle schemas define normalized clients/projects/demands/assignments/timesheets/activities and closed state vocabularies. | Stores the live operational demonstration records. | Do not invent finance, payroll, payment, or accounting tables for this scope. [3] |
| Related assistant | The workspace assistant can perform a bounded, role-limited project-status lookup that returns project name, delivery status, and project manager. | Provides safe read-only project-status context on these pages. | Do not broaden lookup context to timesheets, notes, finance samples, readiness, or unrestricted rows. [4] [9] |

## Active rendered surfaces versus representative or inactive UI

The distinction below is essential for implementation planning. A component being present in `Home.tsx` does not mean it is reachable from the active Administrator page. Work should strengthen the selected page composition rather than silently promote an old local array or control into a business capability. [1]

| Page surface | Rendered by current page selection? | Record source / behavior | Correct classification |
|---|---:|---|---|
| `Delivery` | Yes | Uses summary demands and assignments for operational cards. | Protected database-backed. [1] [4] |
| `DatabaseDeliveryLifecycle` | Yes | Uses summary clients, projects, and assignments with client/project relationship lookup. | Protected database-backed. [1] [4] |
| `InlineProjectTable` | Yes | Uses summary projects; invokes persisted project-update mutation when role allows. | Protected database-backed with server-authorized curation. [1] [2] [4] |
| Earlier `DeliveryLifecycle` | No | Contains local array-based portfolio, health, and availability content. | Legacy representative UI; do not re-enable as a fallback. [1] |
| `DatabaseTimeBilling` | Yes | Uses summary timesheets to show entry count, approved count, status, hours, and week ending. | Protected database-backed. [1] [4] |
| `TimesheetDetailTable` | Yes | Uses summary timesheets, assignments, and projects for approved field display and relationship fallback. | Protected database-backed. [1] [4] |
| `FinanceScope` | Yes | Renders literal `$142/hr`, `$92/hr`, and `35.2%`; masks client-side when role is not Finance. | Explicitly representative sample masking only. [1] [3] |
| Earlier `TimeBilling` approval control | No | Holds local `timeApproved` state and an “Approve 40 hours” button without a current mutation. | Unrendered representative UI; quarantine or remove from the source path. [1] |

## Data model, field, and role boundaries

The data model is normalized and has defined operational state vocabularies. It has no persisted commercial values. The summary query currently provides a superset of these operational rows to authenticated users; therefore, the table separates **current behavior** from the target hardening posture. [2] [3] [4]

| Record family | Existing stored fields relevant to these pages | Current active use | Current role boundary | Required hardening boundary |
|---|---|---|---|---|
| Client accounts | ID, stable demo key, name, industry, location, operational status. | Portfolio cards and relationship labels. | Included in the protected common summary. | Project only the permitted identity/status fields for each page and role. [3] [4] |
| Client projects | Client relation, name, technology stack JSON, `planned|active|at_risk|closing`, manager, dates. | Project health and editor table. | All authenticated users receive rows; edit only for admin/account manager/delivery manager/project manager. | Give non-edit roles a read-specific projection and keep the edit allowlist server-enforced. [2] [3] |
| Staffing demands | Client/project relations, title, skills JSON, openings, priority, `open|submitted|filled|on_hold`, target date. | Delivery demand display. | Included in the protected common summary. | Define a role-safe, page-appropriate demand projection; do not create candidate or staffing-decision actions. [3] [4] |
| Consultant assignments | User/client/project relations, manager, allocation, `pending|active|extension_due|roll_off|bench`, dates, billable flag. | Capacity signal and time-entry association. | Included in the protected common summary. | Deliberately scope assignment rows and fields for each role; preserve relationship fallbacks. [3] [4] |
| Timesheet entries | User/assignment relation, week ending, hours, `draft|submitted|approved|exception`, note. | Read-only billing-readiness summary and detail table. | Included in the protected common summary. | Return only role-permitted time-entry metadata; never infer an approval or payment authority. [1] [3] [4] |
| Operational activities | Entity type, title, detail, `open|attention|complete`, occurred-at time. | Updated after a persisted project edit; available in the common summary. | Included in the protected common summary. | Keep operational activity distinct from immutable access-role audit history and scope it intentionally. [3] [4] |
| Sample commercial card | No table-backed rate, pay, margin, invoice, or payment fields exist. | Finance sees literals; others see masked literals. | Client-side active-role condition only. | Keep as a labeled representative visual until a separately approved server-scoped model exists. [1] [3] |

> **Authorization rule.** User-interface hiding is supplementary only. The authoritative permission check for project updates must remain in `portal.updateProject`; client-side `canEdit` exists solely to present the correct controls. [1] [2]

## Verified controls and test evidence

Current coverage establishes several important baseline behaviors. It does not yet prove route-specific failure states, field-level summary projections, or that every inactive legacy control is absent from future build output. Those omissions are the basis for the constrained prompts later in this guide. [5] [6] [7] [8]

| Evidence | Verified fact | What it does not establish |
|---|---|---|
| `portal.router.test.ts` | An authenticated caller can use `portal.demoSummary`; consultant and finance callers are rejected from project mutation; Administrator, Account Manager, Delivery Manager, and Project Manager are allowed; invalid project status is rejected. [5] | It does not prove least-privilege summary field projections or row scoping. |
| `timesheet.contract.test.ts` | Time-entry status vocabulary is restricted to `draft`, `submitted`, `approved`, and `exception`. [6] | It does not create an approval transition or approval mutation. |
| `Home.test.tsx` | Database-backed Delivery and Time & Billing content render, a consultant sees masked commercial samples, Finance sees sample values, and project editing/refetch interactions are covered. [7] | It does not establish server-backed commercial values or comprehensive query-state handling. |
| `demoAuth.browser.test.ts` | Authenticated desktop and mobile flows reach Delivery and Time & Billing, render database-backed content, and show non-Finance masking. [8] | It does not prove all role combinations, direct deep-link recovery for each page, or direct API projection safety. |
| `db.ts` plus schema | Project update persists to `client_projects` and inserts an operational activity; summary pulls six operational collections from normalized tables. [3] [4] | It does not represent a finance ledger, immutable authorization audit, or a time-approval workflow. |

## Verified gaps and capability-constrained remedies

The table identifies only gaps that can be verified from current code and tests. It deliberately avoids adding capabilities that have no present model, route, authorization contract, or user-approved operational boundary.

| Priority | Verified gap or risk | Why it matters | Constrained remedy |
|---|---|---|---|
| High | `portal.demoSummary` returns broad normalized rows after authentication, rather than role-specific presentation shapes. [2] [4] | A protected superset makes future privacy mistakes more likely as records evolve. | Add server-side allowlisted presentation projections and role/relationship filters using existing tables and fields only. |
| High | Delivery and Time & Billing dereference query data with empty-array defaults but have no dedicated loading, error, or zero-record experience. [1] | Empty, failed, and not-yet-loaded states can appear indistinguishable and undermine operational trust. | Add query-state UI without adding actions, seed data, or fallback business records. |
| High | Commercial samples are literal client-side values and may be mistaken for real finance data despite current copy. [1] [3] | The UI could overstate the maturity or provenance of commercial controls. | Make representative/demo wording unambiguous and retain masking; do not persist or calculate commercial data. |
| Medium | A legacy unrendered timesheet approval control carries local state and could be reintroduced accidentally. [1] | It could falsely communicate approval authority or trigger unsupported workflow expectations. | Remove it or isolate it from the active page path with a source-level regression test; do not build an approval endpoint. |
| Medium | Relationship labels fall back independently, but the pages lack explicit empty/relation-missing treatments. [1] | Partial seeded or real operational rows should remain understandable without fabricated names. | Add neutral fallback and empty-state copy based on existing IDs/fields only. |
| Medium | Project edits create operational activity, but current page treatment does not clearly frame that record as operational status history rather than access audit history. [4] | Auditors and users can confuse materially different event types. | Display or label the existing activity boundary accurately; do not create an additional audit system. |
| Medium | Existing tests do not form one route/role/field-mask/no-action regression matrix for these two pages. [5] [6] [7] [8] | Regressions could reintroduce broad data, inactive approval language, or off-scope commerce actions. | Extend current Vitest and Chromium-style coverage using the existing demo session and seeded records. |

## Implementation prompts, restricted to existing capabilities

The following prompts are intentionally sequenced. Each one strengthens an already existing frontend, Node/tRPC, Drizzle, or test capability. **Do not combine them into a new staffing, finance, time-entry, or accounting product.**

### Prompt 1 — Server-first Delivery and Time & Billing summary projections

> Harden the existing protected `portal.demoSummary` contract without changing the managed runtime or creating new tables. Keep the query authenticated, then construct allowlisted presentation objects from the existing client accounts, projects, staffing demands, consultant assignments, timesheet entries, and operational activities. Apply role and relationship scope before returning data: preserve Administrator’s existing operational review capability, preserve the current delivery-role project-status view, and ensure Finance, Consultant, and unrelated roles receive only the existing operational fields their current page needs. Parse only the existing JSON technology-stack and skill arrays. Do not return raw Drizzle rows, readiness data, resume data, user-role administration records, private object-storage references, or future commercial fields. Add direct router tests that assert allowed fields are present, disallowed fields are absent, unauthorized row relationships are excluded, and no data model or state vocabulary changes.

**Acceptance conditions:** The existing rendered Delivery and Time & Billing fields still work from typed summary projections; `portal.updateProject` remains separately authorized; authenticated callers cannot receive a newly introduced broad raw row; and no finance schema is added. [2] [3] [4]

### Prompt 2 — Delivery query-state and internal-demo provenance treatment

> Strengthen the active `Delivery`, `DatabaseDeliveryLifecycle`, and `InlineProjectTable` composition around the existing protected summary query. Add compact component-level loading skeletons, a retry-safe failure message, and neutral zero-record states for demands, assignments, clients, and projects. Keep each active database-backed panel visibly labeled as internal demonstration data when it renders seeded records. Do not fall back to `DeliveryLifecycle` local arrays, invent delivery metrics, add staffing recommendations, or create client outreach/notification behavior. Preserve accessible table semantics and the current role-resolved page routing.

**Acceptance conditions:** A loading summary never presents fabricated activity, a query error never shows stale representative content as live data, and a zero-row response produces neutral page-specific copy instead of a blank table. [1] [4]

### Prompt 3 — Neutral Delivery relationship rendering and fallbacks

> Refine the existing database-backed Delivery renderers so client, project, staffing-demand, and assignment relationships are resolved from the protected summary projection by ID and remain intelligible when a permitted relationship is missing. Use only neutral labels such as “Client pending,” “Project assignment,” or “Manager pending,” with no fabricated personnel, client, capacity, milestone, health, or staffing-decision information. Keep existing displays limited to project delivery status, assignment state, allocation, demand openings/priority/status, and stored relationship labels. Add focused component tests for missing client, project, manager, and assignment references.

**Acceptance conditions:** Rendering cannot throw on partial records, no local delivery arrays are used as substitutes, and the fallback copy does not imply a decision, commitment, or hidden record. [1] [3] [4]

### Prompt 4 — Persisted project editor, authorization, and activity boundary

> Harden the existing inline project editor, not its scope. Retain Edit, Save, and Cancel for only Administrator, Account Manager, Delivery Manager, and Project Manager. Permit exactly the current fields—project name, project manager name, and delivery status—and exactly the four valid statuses `planned`, `active`, `at_risk`, and `closing`. Keep server-side authorization and validation in `portal.updateProject`, disable duplicate submission while pending, surface a concise mutation failure without altering local records, and refresh the protected summary only after success. When describing the existing appended operational activity, label it as a project-status operational record, not a role-access audit. Add direct and browser-style tests for every allowed and denied role, invalid status, failure behavior, cancel behavior, refresh behavior, and `at_risk` activity state.

**Acceptance conditions:** Finance and Consultant remain view-only even if a client control is manipulated; a rejected mutation changes neither project display nor activity display; and no new editable project, assignment, or demand field is introduced. [1] [2] [4] [5]

### Prompt 5 — Time & Billing read-only query states and field discipline

> Strengthen the active `DatabaseTimeBilling` and `TimesheetDetailTable` using only the existing protected time-entry projection. Provide loading, failure, and zero-entry states while retaining the current fields: week ending, hours, `draft|submitted|approved|exception` status, assignment/project association, and note. Make all status counts derive only from returned rows and show neutral relationship fallback copy when an assignment or project is absent. Preserve the existing billing-readiness boundary notice. Do not add time-entry creation, editing, submission, approval, rejection, payroll computation, invoice generation, payment execution, tax handling, accounting synchronization, or external integrations.

**Acceptance conditions:** Every display state is traceable to existing timesheet rows, status vocabulary remains closed, and the page contains no button, copy, or endpoint that implies a payroll or approval action. [1] [3] [6]

### Prompt 6 — Finance sample masking and representative-data clarity

> Preserve the existing `FinanceScope` behavior as a representative demonstration only. Continue to mask the literal sample commercial values for every non-Finance role and show them only to Finance in the authenticated workspace. Strengthen the copy so it explicitly says these are sample values used to demonstrate role masking and are not persisted client bill rates, consultant pay rates, margins, invoices, payroll results, or payment records. Do not add pay, bill, margin, invoice, payment, or calculation columns to Drizzle; do not pass commercial values through `portal.demoSummary`; and do not broaden the assistant lookup context. Add component and router-contract regression tests that prove no non-Finance result contains the sample values and no API response presents those values as stored data.

**Acceptance conditions:** The Finance card remains visually understandable but cannot be mistaken for a live commercial ledger, and all other roles receive the mask rather than an omitted or fabricated value. [1] [2] [3]

### Prompt 7 — Quarantine inactive local approval UI

> Audit the unrendered legacy `TimeBilling` component and prevent it from being presented as a live feature. Either remove the local `timeApproved` / “Approve 40 hours” demonstration from the active source tree or isolate it so `PageContent` and future route selection cannot render it. Do not add a tRPC mutation, database transition, audit event, or authorization policy for time approval. Add a focused source or component regression test asserting the active Time & Billing route contains the existing read-only billing-readiness tables and boundary copy but no approval control or approval mutation invocation.

**Acceptance conditions:** An authenticated Administrator cannot encounter an apparent time-approval action on the active page, and implementation retains the existing `approved` value as a displayed record state only. [1] [3] [6]

### Prompt 8 — Delivery and Time & Billing regression matrix

> Add a compact regression matrix for the active authenticated Delivery and Time & Billing routes using the existing demo credential sessions, seeded operational records, Vitest contracts, and Chromium-style browser checks. Cover direct route recovery, Administrator data rendering, Finance sample visibility, non-Finance masks, project-editor allow/deny roles, invalid delivery status rejection, timesheet state vocabulary, missing-relationship fallback, summary projection exclusions, loading/error/empty states, absence of local fallback arrays, absence of approval controls, and the billing-readiness no-payroll/no-invoice/no-payment boundary. Keep all test records as the already labeled internal demonstrations. Do not seed commercial records, customer reviews, ratings, testimonials, real client records, candidate documents, or confidential data.

**Acceptance conditions:** The matrix fails if role masking regresses, if an unauthorized project update succeeds, if an unknown time/project relationship crashes rendering, if inactive approval UI returns, or if an off-scope commercial action is introduced. [5] [6] [7] [8]

## Recommended implementation order and validation gate

| Order | Prompt | Why this order protects the live portal | Minimum validation before proceeding |
|---:|---|---|---|
| 1 | Server-first projections | Establishes the trusted presentation contract before UI refinement. | Router contract tests for role/field/relationship projection. |
| 2 | Finance sample clarity | Prevents a visual sample from being mistaken for stored commercial data. | Finance/non-Finance component and API-exclusion tests. |
| 3 | Delivery states and relationship fallbacks | Makes the primary Delivery UI reliable on the new projection contract. | Component states plus partial-record tests. |
| 4 | Project editor hardening | Confirms the only existing delivery mutation remains controlled. | Full allowed/denied/status/failure test matrix. |
| 5 | Time & Billing states and field discipline | Protects the read-only operational view after scoped timesheet projection. | Status-contract and rendered boundary tests. |
| 6 | Quarantine inactive approval UI | Removes misleading latent control surface before broad regression. | Active route contains no approval action or mutation. |
| 7 | Cross-route regression matrix | Verifies the combined security, provenance, and responsive behavior. | Full test suite, TypeScript check, and desktop/mobile authenticated checks. |

## Explicitly out of scope

This assessment does **not** recommend any of the following because the current capabilities, data model, or approved business boundaries do not support them:

- Timesheet creation, editing, submission, approval, rejection, or approval automation.
- Payroll calculation, compensation administration, payment execution, invoicing, tax computation, accounting ledger entries, or external accounting integrations.
- Persistence, computation, or server return of bill rates, pay rates, margins, invoice amounts, or payment data.
- Candidate selection, staffing decisions, employee eligibility or work-authorization decisions, or AI-generated employment recommendations.
- Client outreach, notifications, task-management workflows, scheduling automation, or customer review, rating, or testimonial records.
- A FastAPI cutover, Railway deployment work, external database migration, or alteration of the managed Node/tRPC authentication runtime.

## Source references

[1]: ../client/src/pages/Home.tsx "Active page composition, database-backed delivery/time components, Finance sample card, legacy component presence, and routing"
[2]: ../server/routers.ts "Protected portal summary and server-authorized project update contract"
[3]: ../drizzle/schema.ts "Normalized client, project, demand, assignment, timesheet, and operational-activity schemas"
[4]: ../server/db.ts "Summary aggregation, JSON normalization, project persistence, activity creation, and bounded project lookup"
[5]: ../server/portal.router.test.ts "Summary authentication and project-update authorization/status tests"
[6]: ../server/timesheet.contract.test.ts "Closed timesheet status vocabulary test"
[7]: ../client/src/pages/Home.test.tsx "Rendered Delivery/Time & Billing, masking, and interaction tests"
[8]: ../server/demoAuth.browser.test.ts "Authenticated desktop/mobile route, rendering, and non-Finance masking checks"
[9]: ../server/db.ts#L370-L394 "Role-limited assistant project-status lookup"
[10]: ../fastapi_reference/app/main.py "Future reference service; not the live runtime"
