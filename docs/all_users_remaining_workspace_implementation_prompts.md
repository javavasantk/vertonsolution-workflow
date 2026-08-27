# Final All-Users Workspace: Remaining Existing-Capability Implementation Prompts

**Scope:** The authenticated managed Workforce Hub only: React, Node/tRPC, Drizzle, and managed MySQL-compatible TiDB.  
**Purpose:** Provide role-aware, end-to-end prompts for the **remaining verified gaps** in Readiness, Onboarding, Delivery, Time & Billing, Controls, Admin Center, My Profile, and New-Hire Progress.

> **Global implementation boundary.** Preserve cookie-backed sessions, server-side role checks, existing field masking, demo/production isolation, private resume storage, and human review. Do not create employment, work-authorization, eligibility, immigration/legal, hiring, staffing, compensation, payroll, payment, invoice, accounting, notification, export, external integration, customer-review, rating, or testimonial workflows.

## Role and source-of-truth rules

| Rule | Required behavior |
|---|---|
| Server authority | Retain existing protected, Administrator-only, and Administrator/Recruiter procedures as the authorization authority. Client navigation/hiding is supplementary only. |
| Representative UI | Clearly label or remove local arrays, static cards, and inert controls. Never represent them as live operational data or immutable audit evidence. |
| Data minimization | Return only the current approved projections. Exclude password/reset data, raw resumes, private storage keys, readiness detail outside authorized review, and finance commercial fields outside Finance. |
| AI boundary | Keep context bounded and role-aware. AI provides human-reviewed summaries only; it cannot decide access, hiring, readiness, eligibility, staffing, or compensation. |
| User scope | Each prompt applies only to a role that the current route resolver and server contract already permit. Do not broaden a role merely to satisfy a UI layout. |

## 1. Readiness

### R1 — Server-first readiness projection and privacy

> Harden the existing Readiness experience using only current employee-profile fields and permitted reviewer access. Project only administrative workflow state, employment-type label, expiry indicator when already authorized, controlled status note, and update metadata. Enforce role scope at the server before client masking and preserve own-record access for employee self-service. Exclude documents, raw identity data, legal conclusions, eligibility determination, compensation, candidate data, and Finance fields. Add direct procedure tests for every permitted/denied role and sensitive-field absence.

### R2 — Separate live readiness data from representative checklists

> Keep current local Readiness checklist/cards visibly representative until a permitted protected record source exists. Add loading, unavailable, no-record, and masked-field states around existing protected profile data; do not replace a failed query with fake reviewer records. Retain human-review wording and neutral unknown-value fallbacks. Do not add review approval, document upload, legal guidance, expiry automation, tasks, reminders, or decisions.

## 2. Onboarding

### O1 — Database-backed onboarding launchboard signals

> Build the Administrator/Recruiter onboarding launchboard only from the existing protected `onboarding_assignments` projection. Render only onboarding stage, progress percentage, manager confirmation, project association, assignment state, and update time with allowed values `not_started`, `profile_in_progress`, `manager_confirmation`, `ready_for_assignment`, `assigned`, `unassigned`, `pending`, `active`, and `roll_off`. Exclude readiness facts, documents, candidate materials, compensation, and staffing recommendations. Add loading/error/empty states and role/field-exclusion tests.

### O2 — Contain representative persona checklist and reminder UI

> Preserve the existing local onboarding personas, task checklist, and reminder affordance as clearly labeled representative interface material. Do not present task toggles or “Send reminder” as persisted workflow actions. Either remove inert actions or render explanatory noninteractive copy. Do not create onboarding task tables, manager-confirmation mutations, notification delivery, scheduled reminders, assignments, or automation.

## 3. Delivery

### D1 — Role-safe summary projection and Delivery query states

> Refine the existing protected Delivery data path so its clients, projects, demands, assignments, and activities are deliberately projected for each already-authorized role before rendering. Retain current stored status vocabularies and relationships; add loading, unavailable, empty, and missing-client/project relationship states. Label seeded records as internal demonstration data. Do not add demand creation, candidate matching, staffing decisions, assignment creation, notifications, client document storage, commercial fields, or new tables.

### D2 — Persisted project curation only

> Preserve the current inline project editor for Administrator, Account Manager, Delivery Manager, and Project Manager only. Allow only existing project name, delivery status, and project manager name fields, with statuses `planned`, `active`, `at_risk`, and `closing`. Keep server authorization, validation, refresh, and operational activity capture. Finance and Consultant remain view-only. Add confirmation/error/access-matrix tests; do not add project creation/deletion, budget, staffing, or invoice workflows.

## 4. Time & Billing

### TB1 — Read-only billing-readiness detail and field discipline

> Strengthen the existing Time & Billing view using only protected timesheet entries: week ending, hours, status, note, assignment association, and project relationship. Use only `draft`, `submitted`, `approved`, and `exception` states. Add loading, error, successful-empty, and missing-assignment/project states. Keep the module explicitly billing-readiness only; do not add time entry creation/editing, approval mutations, payroll, payments, invoice generation, expense workflow, accounting integration, or scheduled processing.

### TB2 — Finance masking and representative commercial clarity

> Preserve Finance-only visibility of the existing representative commercial values. For non-Finance roles, retain masking and server-first field boundaries; for Finance, label the present values as sample demonstration content unless a real protected database field already exists. Do not create bill-rate, pay-rate, margin, payment, invoice, or accounting persistence. Add regression tests for Finance visibility, non-Finance masking, no sensitive value in protected summary projections, and no commercial action control.

### TB3 — Quarantine inactive approval demonstration

> Remove or clearly quarantine the non-rendered local `TimeBilling` approval control so it cannot imply a working “Approve 40 hours” action. Keep the rendered database-backed Time & Billing module read-only. Add source and UI regression checks confirming no active timesheet approval mutation, invoice action, payroll action, or payment action exists.

## 5. Controls

### C1 — Accurate Controls provenance and audit language

> Rework the active Controls page so local access-posture cards and audit rows are visibly representative explanatory material, not live system telemetry or an immutable ledger. Remove approval-related local event wording that could imply a time-approval workflow. Where an existing permitted source is available, show a narrowly scoped source label for protected role-change history or existing operational activity; otherwise show neutral explanatory content. Do not create a Controls API, audit table, policy engine, event stream, approval feature, or external compliance integration.

### C2 — Remove the inert audit-export implication

> Remove the nonfunctional Controls “Export audit view” action or replace it with noninteractive wording that audit export is unavailable. Do not create CSV/PDF export, server jobs, retention workflow, storage export, reporting integration, or external audit transfer. Add a UI test ensuring no interactive audit-export claim remains.

## 6. Admin Center

### A1 — Deliberate single-role change and self/demo protections

> Improve the existing Administrator Admin Center by adding an accessible confirmation state before `access.assignRole` is called. Show target, prior role, proposed approved role, Confirm, and Cancel. Retain the existing server-owned role set, self-demotion prevention, demo-session denial, role-change audit record, query refresh, and success/error feedback. Make the acting Administrator’s non-admin role choices unavailable in the UI, and display demo administration as read-only while keeping server denial authoritative. Do not add bulk changes, policy editing, role expiry, approval chains, delegations, or notifications.

### A2 — Query states and application-level audit assurance

> Add distinct loading, protected-query error, successful-empty, and retry-safe states for the existing Admin Center directory, permission groups, and role-change history. Keep workforce projections limited to current safe fields and describe audit history accurately as append-only in the application workflow rather than asserting unverified database-level immutability. Test no-op role selection, actor/target/prior/next/timestamp recording, ordering, field exclusions, and all non-admin direct API denials.

## 7. My Profile

### P1 — Own-record profile contract and first-use state

> Preserve My Profile as an authenticated own-record experience for every permitted user, including Administrator. Keep `profile.mine` and `profile.requestReview` derived exclusively from the session user ID; accept only existing employment-type and 8–500-character status-note fields, and retain the `details_requested` transition for authorized human review. Add loading, query-error, mutation-error, success, and “no profile record yet” states. Do not accept a target user ID, expose colleague profiles, allow status/expiry overrides, store documents, select reviewers, or make a legal/eligibility/employment decision.

## 8. New-Hire Progress

### N1 — Live launchboard versus representative fallback

> Refine New-Hire Progress for its current Administrator/Recruiter audience. Use the existing protected safe launchboard projection—name, email, role, onboarding stage, progress, manager confirmation, project name, assignment state, and update time—and show separate loading, unavailable, successful-empty, and preview-only representative states. Do not silently substitute local demo rows after a live empty/error response. Keep restricted readiness data, documents, compensation, and staffing decisions out of the route. Add Administrator/Recruiter success, non-recruiter denial, field-exclusion, and state-separation tests.

### N2 — Read-only human handoffs and shared-route provenance

> Keep existing handoff labels as neutral indicators requiring human follow-up. Use Administrator/Recruiter-neutral copy and state plainly that badges cannot confirm managers, approve onboarding, create assignments, or make staffing decisions. Because the route also contains existing resume parsing and Candidate Finder components, label those sections as separate protected recruiting capabilities; do not convert candidates to new hires or create onboarding assignments from parsed data. Retain their present private-storage, bounded-AI, and human-review limits.

## Cross-workspace regression gate

> Implement a role-by-route regression matrix for the current workspace resolver, protected procedures, and field projections. Verify unauthenticated users return to the secure login; each existing role reaches only permitted pages; direct API calls reject unsupported roles; demo sessions stay isolated; loading/error/empty and representative states are distinct; Finance masking holds; private resume and restricted readiness fields never leak; and all active write operations remain exactly the current candidate, project, own-profile, and single-role-change mutations. Run the complete Vitest suite, TypeScript check, and authenticated desktop/mobile checks. Do not add a new runtime, hosting provider, database, background job, or external service.

## Recommended order

| Order | Workstream | Reason |
|---:|---|---|
| 1 | R1, O1, D1, TB1, P1, N1 | Secure projections and query states before changing presentation. |
| 2 | D2, A1, A2 | Harden the limited existing mutations and audit boundary. |
| 3 | R2, O2, TB2, TB3, C1, C2, N2 | Contain or accurately label representative/inert UI. |
| 4 | Cross-workspace regression gate | Validate privacy, role, state, and responsive behavior end to end. |

## Source references

[1]: ./admin_readiness_end_to_end_review.md "Readiness evidence and current hardening prompts"
[2]: ./admin_onboarding_end_to_end_review.md "Onboarding evidence and current hardening prompts"
[3]: ./admin_delivery_time_billing_end_to_end_review.md "Delivery and Time & Billing evidence and prompts"
[4]: ./admin_controls_admin_center_end_to_end_review.md "Controls and Admin Center evidence and prompts"
[5]: ./admin_profile_new_hire_progress_end_to_end_review.md "My Profile and New-Hire Progress evidence and prompts"
[6]: ../client/src/pages/Home.tsx "Current workspace composition, visibility, and representative UI"
[7]: ../server/routers.ts "Current protected API contracts and role gates"
[8]: ../drizzle/schema.ts "Current persisted state vocabularies"
