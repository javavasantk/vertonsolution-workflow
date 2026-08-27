# Verton Workforce Hub: Complete User Prompt Inventory

**Purpose:** A single reference of the implementation and assessment prompts previously requested for Verton Solution Inc.’s Workforce Hub.  
**Current platform direction:** Use the managed Workforce Hub stack only: React/Vite, Node/Express/tRPC, Drizzle, managed MySQL-compatible TiDB, managed private storage, and managed AI. The earlier external Railway/TiDB/FastAPI deployment path was withdrawn and is listed only as historical context.

> **How to use this reference:** Send one numbered implementation prompt at a time. The live portal must retain server-side RBAC, protected login, cookie sessions, demo/production separation, role-based masking, private resume storage, bounded AI, and human review. No prompt authorizes an automated employment, hiring, eligibility, work-authorization, staffing, compensation, payroll, payment, invoice, or accounting decision.

## A. Foundational implementation prompts

| No. | Prompt title | Status |
|---:|---|---|
| 1 | Protected Entry and Role-Scoped Workspace | Completed |
| 2 | Demo Credential and Password Recovery Flow | Completed |
| 3 | Administrator Access Control Center | Completed |
| 5 | Recruiter New-Hire Launchboard | Completed |
| 6 | Plain-Text AI Resume Parsing | Completed |
| 7 | Secure PDF/DOCX Resume Upload and Parse Completion | Completed |
| 8 | Candidate Finder and Review State | Completed |
| 9 | Candidate CSV and PDF Export | Completed |
| 10 | Candidate Inline Editing | Completed |
| 11 | Database-Backed Client-to-Delivery Lifecycle | Completed |
| 12 | Project Inline Editing | Completed |
| 13 | Time and Billing with Field Masking | Completed |
| 14 | Context-Specific AI Briefings | Completed |
| 15 | Bottom-Right Workspace Assistant | Completed |
| 16 | Assistant Candidate and Project Database Queries | Completed |
| 17 | Database Foundation and Idempotent Seed | Completed |
| 18 | FastAPI Reference Service, Not Live Runtime | Completed — reference only |

### Prompt 1 — Protected Entry and Role-Scoped Workspace

> Implement the existing Workforce Hub secure entry flow. The public URL must show only a dark protected-access login form with email, password, approved-identity action, and forgot-password action. Do not expose a role directory, shared credentials, or workspace content before authentication.
>
> After successful authentication, create a cookie-backed session and route the user to the role-scoped workspace. Enforce navigation and API access on the server; hiding a client button alone is insufficient. Support only `admin`, `recruiter`, `hr_compliance`, `account_manager`, `delivery_manager`, `project_manager`, `finance`, `consultant`, and compatibility `user`. Ensure unauthorized workspace deep links return to the allowed overview or secure login. Add tests for unauthenticated workspace rejection, role-to-workspace navigation, sign-out, and deep-link recovery.

### Prompt 2 — Demo Credential and Password Recovery Flow

> Implement the current demo-only credential access flow without altering production OAuth identities. Store a salted password hash, one-time reset-token hash, token expiry, and `isDemo` flag. Never return passwords, password hashes, or reset-token digests.
>
> Implement demo login, reset request, and password reset with an eight-hour demo session and a single-use 15-minute reset token. Return a generic response for unknown addresses. Present the reset token only in the designated demonstration interface; do not build email delivery. Test valid/invalid credentials, expired tokens, replacement passwords, and session role resolution.

### Prompt 3 — Administrator Access Control Center

> Allow only administrators to list workforce users, view permission groups, assign approved roles, and review immutable role-change history. Prevent an administrator from removing their own admin role. On effective role change, write target user, actor user, prior role, next role, and timestamp. Keep public demo sessions isolated from production administrative records. Render search, role selector, confirmation state, and visible audit history. Test Administrator-only access, self-demotion prevention, audit creation, and demo isolation.

### Prompt 5 — Recruiter New-Hire Launchboard

> Implement the protected new-hire launchboard from onboarding assignments. Show onboarding stage, progress percentage, manager confirmation, project association, and assignment state; keep restricted readiness details out of recruiter views. Use only `not_started`, `profile_in_progress`, `manager_confirmation`, `ready_for_assignment`, `assigned`, and assignment states `unassigned`, `pending`, `active`, or `roll_off`. Provide a human-readable handoff indicator without automating a staffing decision.

### Prompt 6 — Plain-Text AI Resume Parsing

> Permit Recruiter/Admin plain-text parsing from 80 to 12,000 characters. Send only bounded resume text to server-side managed AI and request candidate name, contact data, location, summary, years of experience, skills, recent roles, education, recruiter notes, and extraction confidence. On successful extraction, create or update a recruiter-visible candidate profile with `pending_human_review`. Make no hiring, eligibility, compensation, or work-authorization decision. Return a human-review fallback and do not persist a profile if AI is unavailable. Test service, router, and rendering behavior.

### Prompt 7 — Secure PDF/DOCX Resume Upload and Parse Completion

> Permit Recruiter/Admin PDF and DOCX uploads only, maximum 5 MB. Issue a short-lived recruiter-bound upload session; validate session ownership, filename, MIME type, file size, expiry, and single-use completion in the authenticated upload endpoint. Keep original bytes in private object storage, not TiDB. Persist only approved metadata and candidate relationship. Extract server-side text, parse it, persist only successful results, and close the session on success or AI fallback. Test invalid type/size/session/role, storage linkage, persistence, and fallback.

### Prompt 8 — Candidate Finder and Review State

> Let Recruiter/Admin search protected candidate profiles by name, location, and skills; filter by one extracted skill and experience bucket. Display recruiter-visible name, contact metadata, skills, experience, location, and review state. Use only `pending_human_review`, `reviewed`, and `archived`. Exclude raw resume text, private object keys, readiness detail, and Finance data. Include count, empty state, and recruiter-review wording.

### Prompt 9 — Candidate CSV and PDF Export

> Generate client-side CSV and concise PDF for a parsed candidate profile using candidate name, contact details, location, experience, skills, education, summary, and human-review notes. Use sanitized candidate-based filenames. Exclude raw source resume, private storage keys, hidden role data, readiness data, and Finance fields. Test CSV rows and PDF text deterministically.

### Prompt 10 — Candidate Inline Editing

> Permit only Recruiter/Admin to curate existing candidate name, location, years of experience, and bounded skill array. Use controlled Edit, Save, and Cancel state; validate server-side; refresh the candidate query; and record an operational update activity where supported. Treat this as human curation, not automated enrichment. Test role denial, validation, mutation, activity, and browser-style interaction.

### Prompt 11 — Database-Backed Client-to-Delivery Lifecycle

> Render protected lifecycle screens from database-backed clients, projects, staffing demands, consultant assignments, timesheets, and operational activities. Seed clearly labeled internal demonstration records idempotently with stable keys. Render overview metrics/action queues, client/project delivery panels, demand, assignment status, and time/billing records from the protected summary. Do not insert customer reviews, ratings, testimonials, real candidate documents, or confidential client data.

### Prompt 12 — Project Inline Editing

> Permit only Administrator, Account Manager, Delivery Manager, and Project Manager to update project name, delivery status, and project manager name. Allow only `planned`, `active`, `at_risk`, and `closing`. Render controlled Save/Cancel editing, enforce the same authorization server-side, and refresh the protected summary after save. Finance and Consultant remain scoped view-only. Test all role and validation boundaries.

### Prompt 13 — Time and Billing with Field Masking

> Build Time & Billing from protected timesheets and display week ending, hours, status, notes, and assignment association. Use only `draft`, `submitted`, `approved`, and `exception`. Render commercial values only for Finance and masked values for other authorized roles. This is a billing-readiness view only: do not add payment execution, payroll calculation, invoicing, or external accounting.

### Prompt 14 — Context-Specific AI Briefings

> Permit `recruiter_summary` only to Recruiter/Admin, `access_review` only to Administrator, and `onboarding_guidance` only to authorized workflow users. Accept context only from 12 to 1,600 characters and return concise human-review briefings. Render actions only in their meaningful active workflow; remove generic next-step controls from unrelated pages. If unavailable, identify the designated human owner rather than inventing advice.

### Prompt 15 — Bottom-Right Workspace Assistant

> Render the floating “Ask Workforce Hub” assistant only in authenticated workspaces, fixed bottom-right with collapsible panel, suggested prompts, bounded input, loading indicator, and safe unavailable state. Accept active page up to 64 characters and prompt from 4 to 600 characters. Send only role, active page, prompt, and bounded structured lookup context. State that it cannot make employment, authorization, eligibility, or other decisions. Test authentication, mobile/desktop placement, errors, and bounds.

### Prompt 16 — Assistant Candidate and Project Database Queries

> Add deterministic, role-scoped candidate-profile and project-status lookup to the assistant. Query only recruiter-visible candidate metadata and permitted project status. Return lookup kind and short records with the AI reply, then render a Database matches panel. Do not pass unrestricted rows or return HR/readiness details, raw resumes, storage keys, user-role administration, or Finance commercial fields beyond an existing permitted role. Test lookups, unsupported roles, bounds, and browser rendering.

### Prompt 17 — Database Foundation and Idempotent Seed

> Maintain normalized Drizzle tables for users, employee workflow, onboarding assignments, role audit history, candidate profiles, private resume references, clients, projects, demands, assignments, timesheets, and activities. Use a one-off stable-key idempotent seed that creates internal demonstration records only when absent. Explain in-app that TiDB/Drizzle backs operational records while selected interface demonstrations remain representative. Do not seed reviews, testimonials, real candidate documents, or confidential client records.

### Prompt 18 — FastAPI Reference Service, Not Live Runtime

> Maintain the FastAPI reference as a future migration artifact, not the deployed backend. Keep typed JWT-protected workforce, access, profile, onboarding, recruiter-progress, and AI contracts. Preserve Node/tRPC as the active runtime. Run Python contract tests but do not claim FastAPI deployment, start a persistent Python sidecar, or change live authentication without an explicit hosting decision.

## B. Repeated page-level assessment prompts

These are the analysis prompts requested after the foundational implementation set. Each has a completed detailed codebase review and current-gap guide.

| Requested page / area | Requested analysis | Current guide |
|---|---|---|
| Administrator Overview | Analyze frontend, backend, database, related components, missing existing capability connections, and create implementation prompts. | `docs/admin_overview_end_to_end_review.md` |
| Administrator Talent Pipeline | Analyze end to end and produce existing-capability implementation prompts. | `docs/admin_talent_pipeline_end_to_end_review.md` |
| Administrator Readiness | Analyze end to end and produce existing-capability implementation prompts. | `docs/admin_readiness_end_to_end_review.md` |
| Administrator Onboarding | Analyze end to end and produce existing-capability implementation prompts. | `docs/admin_onboarding_end_to_end_review.md` |
| Administrator Delivery and Time & Billing | Analyze end to end and produce existing-capability implementation prompts. | `docs/admin_delivery_time_billing_end_to_end_review.md` |
| Administrator Controls and Admin Center | Analyze end to end and produce existing-capability implementation prompts. | `docs/admin_controls_admin_center_end_to_end_review.md` |
| Administrator My Profile and New-Hire Progress | Analyze end to end and produce existing-capability implementation prompts. | `docs/admin_profile_new_hire_progress_end_to_end_review.md` |
| Overview and Talent Pipeline remaining gaps | Build prompts only for unimplemented existing capability gaps. | `docs/remaining_overview_talent_pipeline_implementation_prompts.md` |
| Eight workspaces for all users | Build prompts for Readiness, Onboarding, Delivery, Time & Billing, Controls, Admin Center, My Profile, and New-Hire Process. | `docs/all_users_remaining_workspace_implementation_prompts.md` |

## C. Recent visual implementation prompts

| Prompt | Status |
|---|---|
| Change the protected login page color theme to match the Workforce Hub portal. | Completed: portal navy, blue, white, focus, and contrast treatment. |
| Add a portal-style loading animation to the login button while credentials submit. | Completed: disabled state, animated spinner, `aria-busy`, and focused test. |

## D. Historical or superseded requests

| Historical request | Current position |
|---|---|
| Use Python/FastAPI as the full live backend. | **Not active.** FastAPI remains reference-only. |
| Deploy/cut over with Railway and external TiDB. | **Withdrawn.** Managed Workforce Hub services remain production. |
| Use external hosting or migrate the custom domain away from the managed portal. | **Not active.** Retain the current managed domain/runtime unless an explicit new decision is made. |
| Expose role directories or demo credentials on the public login page. | **Superseded.** Public page remains protected and shows no role directory or shared credentials. |

## E. Current non-negotiable constraints

1. Use only the managed platform for current portal work.
2. Keep the public URL at the dark/portal-styled protected login and reveal no role directory, credentials, or workspace content before sign-in.
3. Enforce authorization on the server; never rely on a hidden client control alone.
4. Keep AI bounded, role-aware, human-reviewed, and non-decisional.
5. Keep original resume bytes in private storage; Recruiter/Admin only; PDF/DOCX only; 5 MB limit.
6. Do not add payroll, payment execution, invoicing, accounting integrations, external notifications, candidate/staffing decisions, reviews, ratings, or testimonials.
7. Do not represent representative local UI as database-backed operational behavior.

## F. Suggested implementation order for new work

When you submit the next prompt, begin with the remaining prompt guides rather than rebuilding completed prompts. The most valuable sequence is: server-first field projections and page query states; containment/removal of representative and inert controls; confirmed administrator role changes; corrected operational Talent Pipeline source/role scope; then the cross-workspace regression matrix.
