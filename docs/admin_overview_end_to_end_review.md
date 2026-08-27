# Administrator Overview: End-to-End Review and Existing-Capability Implementation Prompts

**Purpose.** This assessment covers the authenticated **Administrator Overview** at `/workspace`, its adjacent administrative controls, and the existing records that already power it. It identifies where the current experience is truly database-backed, where it is intentionally representative interface material, and how to harden the existing capability set without inventing ATS, payroll, eligibility, accounting, notification, or external-integration features.

> **Safety boundary.** This portal supports operational workflow visibility and human curation. It must not make hiring, staffing, work-authorization, eligibility, legal, payroll, compensation, or access-governance decisions automatically. Raw resume bytes remain in private storage and are never included in overview data, AI context, or database summary projections. [1] [2]

## 1. Current End-to-End Architecture

The Administrator Overview is a page in the managed Node/Express/tRPC Workforce Hub. It is not an independently deployed FastAPI service. An authenticated cookie-backed session resolves the user role; the React workspace then normalizes both navigation and direct paths to the role’s permitted pages. Server authorization remains authoritative for protected records and mutations. [3] [4]

| Layer | Current implementation | Administrator Overview responsibility |
|---|---|---|
| Entry and session | Credential and approved-identity login with managed cookie session | Reject unauthenticated workspace routes and recover unauthorized deep links to a permitted page. |
| React workspace | `Home.tsx`, role-scoped navigation, active-page router | Renders `/workspace` as Overview and routes administrators to Controls and Admin Center. |
| Protected API | Node.js, Express, tRPC, Zod | Provides the portal summary and administrator-only user, role, permission-group, and audit procedures. |
| Data access | Drizzle ORM over managed MySQL-compatible TiDB | Reads normalized clients, projects, demands, assignments, timesheets, activities, users, and role audits. |
| Storage | Private object storage | Retains upload bytes outside overview records; no resume file content belongs in overview responses. |
| AI | Managed server-side model access | Provides an administrator-only, bounded access-review briefing from aggregate role, permission, and recent-audit signals. |

## 2. Administrator Journey and Authorization Path

An administrator enters through the protected login flow. Once the session is resolved as `admin`, the workspace navigation includes **Overview**, **Talent pipeline**, **Readiness**, **Onboarding**, **Delivery**, **Time & billing**, **Controls**, **Admin center**, **My profile**, and **New-hire progress**. A direct route such as `/workspace/admin` is accepted for the administrator, but the same route resolves to `/workspace` for an account without that permission. [4]

The Overview itself is rendered from the protected `portal.demoSummary` query. This summary returns clients, projects, staffing demands, consultant assignments, timesheet entries, and operational activities. The Administration Center separately calls three administrator-only procedures: `access.listUsers`, `access.permissionGroups`, and `access.roleChangeHistory`. A role update calls `access.assignRole`; the server blocks self-demotion and writes a role-change audit record. [2] [3]

```mermaid
flowchart LR
    A[Authenticated administrator session] --> B[/workspace Overview]
    B --> C[portal.demoSummary]
    C --> D[Clients]
    C --> E[Projects]
    C --> F[Staffing demands]
    C --> G[Assignments]
    C --> H[Timesheets]
    C --> I[Operational activities]
    B --> J[Controls]
    B --> K[Admin center]
    K --> L[access.listUsers]
    K --> M[access.permissionGroups]
    K --> N[access.roleChangeHistory]
    K --> O[access.assignRole + audit]
    K --> P[Bounded access-review AI]
```

## 3. Current Capability Map

| Overview area | Current source | Current behavior | End-to-end assessment |
|---|---|---|---|
| Operational metric cards | `portal.demoSummary` | Counts open demand, active assignments, bench signals, and approved timesheets. | **Database-backed.** Calculations occur in the client from protected records. |
| Data provenance strip | Static explanatory copy | Identifies TiDB/Drizzle and internal demonstration records. | **Implemented.** Correctly distinguishes seeded operational data from representative interface content. |
| Action queue | `operational_activities` | Shows three latest protected activities and routes to a relevant workspace. | **Database-backed.** Routes are deterministic by activity entity type. |
| Assignment change signals | `consultant_assignments` plus client/project maps | Shows non-active assignment states and associated project/client labels. | **Database-backed.** It is a status signal, not an automated staffing recommendation. |
| Priority demand | `staffing_demands` plus client map | Shows demand title, client, openings, status, and priority. | **Database-backed.** It contains no applicant ranking or selection action. |
| Recruiting flow graphic | Local hard-coded five-stage values | Shows Sourced, Screened, Submitted, Interview, and Offer counts. | **Representative only.** No normalized pipeline-stage table or matching protected query currently exists. |
| This week control | Static button | Displays a time label but does not filter the summary. | **Representative only.** It must not imply a working time filter. |
| View exceptions | Client route transition | Routes to Controls. | **Partially implemented.** It does not currently filter a database-derived exception list. |
| Controls page | Mixed representative controls and static audit content | Shows governance posture and representative audit activity. | **Adjacent capability.** The immutable role-change audit lives in Admin Center, not this static panel. |
| Admin Center | Protected access procedures | Searches workforce users, assigns roles, lists permission groups, and displays role-change audit history. | **Server-enforced and database-backed** outside demo-session production data isolation. |
| Access-review AI | Bounded aggregate access context | Available only on Admin Center; gives a human-reviewed briefing. | **Server-gated and bounded.** It must not change permissions or recommend automatic access changes. |

## 4. Verified Security and Data Boundaries

The user directory and permission groups are administrator-only server procedures, while administrative role updates are audited and cannot remove the actor’s own administrator role. Demo administrators may use their isolated demonstration account but cannot modify production roles or read production role-history records. [3] [5]

The generic portal summary is protected by authentication, but it is intentionally used by multiple role-specific workspace views. Therefore, administrator overview enhancements should derive only the fields already appropriate for an administrator and must not accidentally add raw resume text, private object keys, readiness metadata, password/reset values, or finance-only commercial values to the response or AI context. [2] [6]

| Domain | Permitted on the administrator overview | Must remain excluded |
|---|---|---|
| Operations | Client/project names, project status, demand title/status/priority/openings, assignment state/allocation, timesheet status/hours/week ending, activity title/state/time. | Confidential client documents, unmanaged external-account data, unsupported workflow records. |
| Access governance | User name/email/role/last sign-in, permission-group labels and counts, role-change actor/target/before/after/time. | Passwords, password hashes, reset token digests, session values, automated permission decisions. |
| Candidate/resume | Only an aggregate count or approved recruiter-visible metadata when using the existing recruiter/admin candidate query. | Raw source resume text, uploaded file bytes, private object-storage keys, work-readiness metadata. |
| Finance | Existing high-level timesheet approval signals. | Pay rate, bill rate, margin, payment, payroll, invoices, accounting data, unless separately rendered in the existing Finance-only view. |
| AI | Aggregate role distribution, permission-control counts, and the five most recent role transitions. | Whole database rows, user directory records, readiness data, documents, or unrestricted audit history. |

## 5. Current Gaps and Their Permitted Resolution

The following are **implementation-quality gaps**, not requests for new product modules. Each proposed resolution uses data models, procedures, roles, and screens already present in the Workforce Hub.

| Gap | Why it matters | Existing-capability resolution |
|---|---|---|
| Hard-coded recruiting funnel numbers | The chart appears operational but is not generated by the candidate-profile data model. | Replace it with a clearly labeled candidate-review summary derived from existing `pending_human_review`, `reviewed`, and `archived` profiles, or retain it with an explicit “representative interface metric” label. Do not add new recruiting pipeline states. |
| Static “This week” control | It resembles a filter but has no current data behavior. | Make it non-interactive explanatory content, or restrict it to an existing week-ending filter on the current timesheet collection. Do not add a date-reporting subsystem. |
| “View exceptions” is a route label rather than a filtered result | An administrator can arrive at Controls without a database-derived exception set. | Derive a bounded review count from existing `attention` activities, `exception` timesheets, `roll_off` assignments, and high/critical open demands; route to the existing relevant pages. Do not create an automatic escalations engine. |
| Overview lacks an administrator governance snapshot | Role and audit data exist but are visible only after navigating to Admin Center. | Add an aggregate-only governance strip using existing admin queries: account count, role distribution, permission-group count, and recent role-change count. Keep directory details in Admin Center. |
| Role selector mutates immediately | The UI provides save feedback but lacks a pre-save confirmation step for a material access change. | Add a lightweight confirmation state using the existing `assignRole` procedure and audit behavior. Do not add bulk role management or automatic role policy. |
| Limited overview-specific error/empty state coverage | Summary calls can return an empty collection when data is unavailable. | Add loading, unavailable, and empty-state UI around the existing summary collections; do not synthesize operational metrics. |

## 6. Existing-Capability Implementation Prompts

The following prompts are ordered so each can be implemented and validated independently. They are deliberately constrained to existing routes, procedures, tables, and roles.

### Prompt A — Administrator Overview Operational Snapshot

```text
Implement the existing authenticated Administrator Overview at /workspace using only the protected portal summary already backed by clients, projects, staffing demands, consultant assignments, timesheets, and operational activities.

Render open staffing demand, active assignments, bench availability, and timesheet approval rate from the returned records. Keep database queries protected and do not introduce a separate public dashboard endpoint. Add explicit loading, unavailable, and empty states; do not fabricate counts when the summary is empty or unavailable.

Label seeded records as internal demonstration data and retain the TiDB/Drizzle provenance note. Exclude resume content, private storage references, readiness data, credentials, and Finance-only commercial values. Add router and client tests for authenticated summary access, metric calculations, loading/empty behavior, and sensitive-field exclusion.
```

### Prompt B — Administrator Candidate Review Summary Instead of a Synthetic Recruiting Funnel

```text
Replace the representative hard-coded Recruiting flow chart on the Administrator Overview with a protected aggregate based on the existing recruiter/admin candidate-profile query. Count only the established review states: pending_human_review, reviewed, and archived.

Render this as a Candidate review flow with clear recruiter-review wording and a route to the existing Talent pipeline or Candidate Finder workflow. Do not add sourced, screened, submitted, interview, offer, ranking, scoring, or hiring-decision pipeline fields because they are not current database capabilities.

Do not display candidate contact records, raw resumes, private upload keys, work-readiness data, compensation, or Finance fields in this overview aggregate. Add tests that confirm state counts, empty behavior, protected access, and absence of prohibited fields.
```

### Prompt C — Existing-Record Attention Queue and Exception Routing

```text
Enhance the existing Administrator Overview Action queue using only protected operationalActivities, timesheetEntries, consultantAssignments, and staffingDemands already returned by portal.demoSummary.

Derive human-review attention signals only from activityState=attention, timesheet status=exception, assignmentState=roll_off or extension_due, and open staffing demands with high or critical priority. Display a short, deterministic list with record type, existing status, and a safe route to the current Controls, Time & billing, or Delivery page. This is navigation and visibility only; it must not create reminders, auto-escalate, change assignment status, or make staffing decisions.

If no qualifying records exist, show a clear empty state. Add tests for each allowed source status, route selection, empty state, bounded item count, and exclusion of readiness/finance-only detail.
```

### Prompt D — Administrator Governance Snapshot and Safe Drill-Through

```text
Add a compact Administrator Governance Snapshot to the authenticated Overview using existing administrator-only access.listUsers, access.permissionGroups, and access.roleChangeHistory procedures.

Show aggregate-only signals: workforce account count, role distribution, permission-group count, and recent role-change event count. Provide a drill-through link to the existing Admin Center. Do not render passwords, reset data, session information, full directory rows, or automatic role recommendations in the overview.

Keep all three source procedures server-authorized for administrators. Demo administrators must continue to receive only their isolated demo directory and no production role-change history. Add tests for administrator visibility, non-administrator denial, aggregate calculation, demo-session isolation, and drill-through routing.
```

### Prompt E — Confirmed Single-Role Change Using Existing Audit Controls

```text
Refine the existing Administrator Control Center role selector into a controlled single-user role-change flow. Preserve the current approved roles, server-side Zod validation, self-demotion prevention, access.assignRole procedure, and immutable role-change audit data model.

When an administrator selects a different role, display a confirmation state naming the target user, prior role, and next role. Only invoke the protected mutation after confirmation. On success, refresh the workforce-user list and role-change history, then show a concise confirmation. On failure, preserve the current role and show an accessible error.

Do not add bulk changes, automated access recommendations, role expiry, approval chains, or external notifications. Add tests for cancellation, confirmed mutation, self-demotion rejection, actor/target/before/after/timestamp audit creation, query refresh, and demo-session production-record isolation.
```

### Prompt F — Bounded Administrator Access-Review Briefing

```text
Retain the existing access_review AI action only inside the Administrator Control Center. Build its context from existing safe aggregates: account count, role distribution, permission-group control counts, and at most five recent role transitions without directory emails or sensitive fields.

Keep access_review administrator-only on the server and enforce the existing 12–1,600 character context boundary. The output must be a concise human-review briefing that states it cannot change permissions, decide access, make employment decisions, or replace governance review. When the managed AI provider is unavailable, show the designated-human-owner fallback and do not invent advice.

Do not show generic AI guidance on unrelated overview pages and do not pass unrestricted rows, readiness information, resumes, storage keys, or Finance commercial values to the model. Add authorization, bound, safe-context, fallback, and client-placement tests.
```

### Prompt G — Administrator Overview Regression and Accessibility Contract

```text
Create a focused Administrator Overview regression contract around existing functionality. Validate unauthenticated redirect to secure login; administrator deep-link acceptance; non-administrator fallback to an allowed overview; protected portal-summary queries; admin-only governance procedures; action-queue routing; data-provenance wording; internal demonstration labels; and Finance-field exclusion.

Add desktop and mobile browser-style tests for responsive overview cards, keyboard-reachable drill-through controls, accessible status messaging, loading/unavailable states, and bottom-right authenticated Workspace Assistant placement. Do not add public analytics, telemetry, new reporting exports, or data collection.
```

## 7. Recommended Implementation Order

Start with **Prompt A**, then **Prompt B** so the overview’s recruiting visual no longer implies unavailable pipeline data. Add **Prompt C** for the action queue, then **Prompt D** and **Prompt E** for governance visibility and deliberate role changes. **Prompt F** preserves the narrow AI boundary, while **Prompt G** verifies the completed experience across authentication, data, and responsive interaction.

## 8. Explicit Non-Goals

The following remain outside the current Administrator Overview capability set: applicant ranking, hiring decisions, automated staffing or assignment selection, work-authorization adjudication, legal or immigration advice, document review/storage in relational fields, payroll, payment execution, invoicing, accounting sync, external ATS/CRM sync, email delivery, scheduled escalation, and customer reviews, ratings, or testimonials.

## References

[1]: ../drizzle/schema.ts "Normalized Workforce Hub schema"
[2]: ../server/db.ts "Managed Drizzle data helpers and protected portal summary"
[3]: ../server/routers.ts "tRPC role-protected application procedures"
[4]: ../client/src/pages/Home.tsx "Authenticated workspace, Administrator Overview, routing, and UI"
[5]: ../server/access.test.ts "Administrator authorization and role-audit tests"
[6]: ../server/portal.router.test.ts "Protected portal summary and project authorization tests"
