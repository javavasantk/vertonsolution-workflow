# Workforce Hub: Implemented Capability Prompt Guide

**Purpose.** This guide converts the **currently implemented** Workforce Hub into reusable implementation prompts. It is intentionally capability-constrained: each prompt may reproduce, harden, or reorganize functionality that already exists, but it must **not** introduce speculative modules such as payroll processing, third-party ATS synchronization, document eligibility adjudication, external email delivery, or autonomous hiring decisions.

> **Non-negotiable boundary:** Work-authorization data is status-based and human-reviewed. Do not make eligibility, hiring, authorization, or employment decisions automatically. Do not persist identity or work-authorization document bytes in database fields. [1]

## 1. Current End-to-End Architecture

| Layer | Implemented approach | Current responsibility |
|---|---|---|
| Web client | React, TypeScript, Tailwind, tRPC hooks | Secure login, role-scoped workspace, recruiter tooling, inline editors, exports, AI panel. |
| Application server | Node.js, Express, tRPC, Zod | Session-aware API procedures, role gates, input bounds, resume completion workflow, AI entry points. |
| Database | MySQL-compatible TiDB with Drizzle ORM | Users, workflow status, role audits, candidates, operational demo records, projects, assignments, timesheets, activities. |
| Object storage | Private object storage | Original PDF/DOCX resume bytes referenced by key; no resume bytes in relational tables. |
| AI | Managed server-side model proxy | Resume extraction, bounded workflow briefings, role-aware workspace assistance. |
| FastAPI reference | Python reference service only | Future migration contract and endpoint validation; it is not the live runtime. |

The portal uses an authenticated root workspace and restricts available navigation, fields, actions, and API procedures according to account role. The public route presents a credential-only protected access page, while the authenticated workspace includes all role-specific interfaces.[2] [3]

## 2. Implemented Roles and Their Practical Scope

| Role | Existing workspace capability |
|---|---|
| Administrator | User list, role assignment, permission-group review, role-change audit history, access-review AI action, project editing. |
| Recruiter | Candidate Finder, resume parse/upload workflow, candidate inline editing, new-hire progress, assignment signals, recruiter AI action. |
| HR & Compliance | Readiness and onboarding coordination views; human-review status only. |
| Account Manager | Client demand and delivery visibility; project editing authorization. |
| Delivery Manager | Assignment and redeployment visibility; project editing authorization. |
| Project Manager | Project delivery and time-approval visibility; project editing authorization. |
| Finance | Time-and-billing view with commercial fields; other roles receive masked values. |
| Consultant | Personal profile, work-readiness update request, onboarding checklist, assignment visibility. |

## 3. Existing End-to-End Flows

| Flow | Entry | Persisted result | Safety boundary |
|---|---|---|---|
| Secure access | Credential login or approved identity | Cookie-backed authenticated session | Demo credential accounts are separate from OAuth identities. |
| Password recovery | Demo account email, one-time code, replacement password | Salted hash and single-use expiry metadata | Demo flow only; no real email delivery. |
| Employee readiness | Consultant profile update request | Status note, employment type, human-review state | No document storage or automated decision. |
| Resume ingestion | Recruiter/admin uploads PDF/DOCX or pastes text | Candidate profile plus private upload reference, if parsing succeeds | 5 MB bound; recruiter/admin only; raw text is not persisted. |
| Candidate discovery | Search, skill filter, experience filter | Candidate profiles | Recruiter-visible profile metadata only. |
| Client-to-delivery | Clients, projects, demands, assignments, activities | Database-backed seeded operational records | Finance values are role-scoped. |
| Time and billing | Timesheet records | Database-backed time entries | Commercial values remain masked outside Finance. |
| AI assistance | Contextual action or bottom-right assistant | No general chat record persistence | Bounded context, role gate, human-review fallback. |
| Inline updates | Candidate or project row | Record update plus activity/audit context | Candidate update: recruiter/admin; project update: approved delivery roles. |

## 4. Implementation Prompts

### Prompt 1 — Protected Entry and Role-Scoped Workspace

```text
Implement the existing Workforce Hub secure entry flow. The public URL must show only a dark protected-access login form with email, password, approved-identity action, and forgot-password action. Do not expose a role directory, shared credentials, or workspace content before authentication.

After successful authentication, create a cookie-backed session and route the user to the role-scoped workspace. Enforce navigation and API access on the server; hiding a client button alone is insufficient. Support these roles only: admin, recruiter, hr_compliance, account_manager, delivery_manager, project_manager, finance, consultant, and the compatibility user role. Ensure unauthorized workspace deep links return to the allowed overview or secure login.

Add unit tests for unauthenticated workspace rejection, role-to-workspace navigation, sign-out, and deep-link recovery.
```

### Prompt 2 — Demo Credential and Password Recovery Flow

```text
Implement the current demo-only credential access flow without altering production OAuth identities. Store a salted password hash, a one-time reset-token hash, token expiry, and isDemo flag on a user. Never return password, password hash, or reset-token digest in API responses.

Implement demo login, reset-request, and password-reset procedures. Use an eight-hour demo session and a single-use 15-minute reset token. Return a generic response for unknown addresses. Present the reset token only inside the designated demonstration interface; do not build external email delivery. Add tests for correct credentials, incorrect credentials, expired tokens, successful password replacement, and session role resolution.
```

### Prompt 3 — Administrator Access Control Center

```text
Build the existing Administrator Control Center. Allow only administrators to list workforce users, view permission groups, assign roles, and review immutable role-change history. Prevent an administrator from removing their own admin role.

When a role is changed, write an audit record with target user, actor user, prior role, next role, and timestamp. Do not expose production administrative records through public demo sessions. Render user role changes in a table with search, a role selector, confirmation state, and visible audit history. Add server tests for administrator-only access, self-demotion prevention, and audit creation.
```

### Prompt 4 — Employee Self-Service Readiness Profile

```text
Implement the existing employee profile and readiness request flow. A signed-in employee may read only their own profile and submit employment type plus a detailed status note for human review. Persist the update as a workflow state such as details_requested; retain expiry status metadata where available.

Do not upload, duplicate, or store work-authorization documents in database fields. Do not label a person eligible or ineligible. The UI must state that a human reviewer owns the determination. Add tests proving one employee cannot read or update another employee profile.
```

### Prompt 5 — Recruiter New-Hire Launchboard

```text
Implement the existing recruiter launchboard from protected onboarding assignments. Display onboarding stage, progress percentage, manager confirmation, project association, and assignment state. Keep restricted readiness detail out of recruiter views.

Use workflow values only: not_started, profile_in_progress, manager_confirmation, ready_for_assignment, assigned, and assignment states unassigned, pending, active, or roll_off. Provide a human-readable exception or handoff indicator without automating a staffing decision.
```

### Prompt 6 — Plain-Text AI Resume Parsing

```text
Implement the existing recruiter/admin plain-text resume parser. Accept 80 to 12,000 characters of plain-text resume content. Send only bounded resume text to a server-side managed AI service and request structured fields: candidate name, contact data, location, summary, years of experience, skills, recent roles, education, recruiter notes, and extraction confidence.

On successful extraction, automatically create or update a recruiter-visible candidate profile in the database with pending_human_review state. Do not make a hiring, eligibility, compensation, or work-authorization decision. If the AI provider is unavailable, return a safe human-review fallback and do not create a candidate profile. Add structured service, router, and client rendering tests.
```

### Prompt 7 — Secure PDF/DOCX Resume Upload and Parse Completion

```text
Implement the existing protected resume file workflow for Recruiter and Administrator roles. Accept only PDF and DOCX files up to 5 MB. First issue a short-lived, recruiter-bound upload session; then send file bytes to a cookie-authenticated server upload endpoint that validates session ownership, filename, MIME type, file size, expiry, and single-use completion state.

Write original bytes to private object storage, not database columns. Store only the upload reference, file name, MIME type, file size, uploader, and candidate relation in the database. Retrieve the protected object for server-side PDF/DOCX text extraction, invoke the structured parser, create the candidate profile only when parsing succeeds, and close the session on success or AI-unavailable fallback. Test invalid types, oversized files, expired sessions, non-recruiter access, storage linkage, and successful candidate persistence.
```

### Prompt 8 — Candidate Finder and Review State

```text
Build the existing Candidate Finder using protected candidate profiles. Allow recruiters and administrators to search name, location, and skills; filter by one extracted skill and experience bucket; and review candidate name, contact metadata, skills, experience, location, and human-review status.

Use only existing review states: pending_human_review, reviewed, archived. Do not expose raw resume text, private resume object keys, work-readiness detail, or finance data. Include an empty state, a result count, and clear wording that parsed information needs recruiter review.
```

### Prompt 9 — Candidate CSV and PDF Export

```text
Implement the existing recruiter export actions for a parsed candidate profile. Generate a client-side CSV and a concise PDF containing candidate name, contact details, location, experience, skills, education, summary, and human-review notes. Name files with a sanitized candidate-based filename.

Do not export raw source resume content, object-storage keys, hidden role data, work-readiness details, or finance fields. Add deterministic tests for CSV rows and PDF text content.
```

### Prompt 10 — Candidate Inline Editing

```text
Implement the current Candidate Finder inline editor. Only Recruiter and Administrator roles may edit an existing candidate’s name, location, years of experience, and bounded skill array. Provide Edit, Save, and Cancel controls in the table row, preserve controlled input state, validate all fields server-side, and refresh the candidate query after a successful save.

Treat the operation as human curation of recruiter-visible metadata, not automated enrichment. Record an operational update activity if the existing data layer supports it. Add role-denial, validation, mutation, and browser-style interaction tests.
```

### Prompt 11 — Database-Backed Client-to-Delivery Lifecycle

```text
Implement the existing protected operational lifecycle screens from database-backed clients, projects, staffing demands, consultant assignments, timesheets, and operational activity records. Seed clearly labeled internal demonstration records idempotently using stable demo keys so reruns never duplicate records.

Render overview metrics and action queues, client/project delivery panels, staffing demand, assignment status, and time-and-billing records from the protected summary query. Label seeded records as internal demonstration data. Do not insert customer reviews, ratings, or testimonials.
```

### Prompt 12 — Project Inline Editing

```text
Implement the existing inline project editor. Allow only Administrator, Account Manager, Delivery Manager, and Project Manager roles to update project name, delivery status, and project manager name. Permit only planned, active, at_risk, and closing as delivery statuses.

Render editing within the delivery table with Save and Cancel actions. Enforce the same authorization server-side and refresh the protected database summary after a saved update. Finance and consultant roles may view only their scoped data and may not update projects.
```

### Prompt 13 — Time and Billing with Field Masking

```text
Build the existing time-and-billing view from protected timesheet entries. Show week ending, hours, status, notes, and assignment association. Use only draft, submitted, approved, and exception states. Render commercial values only for Finance; show masked values to other authorized roles.

This module is a billing-readiness view, not a full payroll system. Do not add payment execution, payroll calculations, invoicing, or external accounting integrations.
```

### Prompt 14 — Context-Specific AI Briefings

```text
Implement the existing narrow AI briefing actions. Permit recruiter_summary only to Recruiter/Admin, access_review only to Administrator, and onboarding_guidance to authorized workflow users. Accept a bounded context string from 12 to 1,600 characters and return a concise human-review briefing.

Show these inline AI actions only in the active recruiter, administrative, or onboarding workflow where the action is meaningful. Remove generic “Draft next-step guidance” controls from unrelated pages. When AI is unavailable, show a designated-human-owner fallback instead of inventing advice.
```

### Prompt 15 — Bottom-Right Workspace Assistant

```text
Implement the existing floating “Ask Workforce Hub” assistant. Render it only inside an authenticated workspace, fixed at the bottom-right, with a collapsible panel, suggested prompts, bounded text input, loading indicator, and safe unavailable state. Accept page names up to 64 characters and prompts from 4 to 600 characters.

The assistant must receive only role, active page, user prompt, and bounded structured lookup context. It must state that it does not make employment, authorization, eligibility, or other decisions. Add desktop/mobile tests for placement, authentication gating, response errors, and prompt bounds.
```

### Prompt 16 — Assistant Candidate and Project Database Queries

```text
Extend the existing workspace assistant with deterministic, role-scoped database lookup. Detect candidate profile or project-status questions from the bounded prompt. Query only recruiter-visible candidate metadata and permitted project status records. Return a structured lookup kind and short record list alongside the AI reply; render a “Database matches” panel inside the assistant chat.

Do not pass unrestricted database rows to the model. Do not return HR/compliance readiness, raw resumes, private upload keys, user-role administration detail, or Finance commercial fields unless the existing role permits those fields. Add tests for candidate lookup, project lookup, unsupported role behavior, prompt limits, and visual browser confirmation.
```

### Prompt 17 — Database Foundation and Idempotent Seed

```text
Implement the current TiDB/Drizzle data foundation. Use normalized tables for users, employee workflow status, onboarding assignments, role-change audit history, candidate profiles, private resume references, clients, projects, staffing demands, assignments, timesheets, and operational activities.

Create a one-off idempotent seed script that uses stable demo keys and creates internal demonstration records only when absent. Include a visible in-app note explaining that TiDB/Drizzle backs the operational records while selected interface demonstrations remain representative. Do not seed reviews, testimonials, real candidate documents, or confidential client data.
```

### Prompt 18 — FastAPI Reference Service, Not Live Runtime

```text
Maintain the existing FastAPI reference service as a future migration artifact, not as the deployed backend. Keep typed JWT-protected contracts for workforce role, access, employee profile, onboarding, recruiter progress, and AI assistance. Preserve the Node/tRPC live application as the active runtime.

Run the Python contract tests as part of the validation suite. Do not claim that FastAPI is deployed, do not start an always-on Python sidecar, and do not change the live authentication runtime without an explicit hosting decision.
```

## 5. Capability Guardrails for Every Prompt

| Always preserve | Never add without a new product decision |
|---|---|
| Server-side role enforcement; protected tRPC procedures; input validation; field masking; audit history; human review; private resume storage; safe AI fallback. | Automatic work-authorization decisions, autonomous hiring/rejection, payroll execution, payments, real email delivery, ATS/CRM sync, document decision engine, public resume access, external background jobs, or a live FastAPI deployment. |

## 6. Recommended Prompt Use Order

Start with Prompts 1–4 for controlled access and workforce status, then 5–10 for recruiting, resume, and candidate workflows. Apply Prompts 11–13 for operational delivery records, Prompts 14–16 for bounded AI, and Prompts 17–18 only when maintaining the current implementation architecture. Each subsequent prompt should retain the constraints and test expectations of prior prompts.

## References

[1]: ../drizzle/schema.ts "Workforce Hub data schema"
[2]: ../server/routers.ts "Workforce Hub protected API router"
[3]: ../client/src/pages/Home.tsx "Workforce Hub user interface and role-scoped workspace"
[4]: ../server/aiService.ts "Bounded AI services"
[5]: ../fastapi_reference/README.md "FastAPI reference implementation"
[6]: ./data-foundation.md "Database foundation and demo data notes"
