# Administrator My Profile and New-Hire Progress: Final End-to-End Assessment and Existing-Capability Prompt Guide

**Assessment status:** Final codebase-derived review of the authenticated Administrator experience.  
**Scope:** The active managed React, Node/tRPC, Drizzle, and MySQL-compatible TiDB application only.  
**Author:** Manus AI  
**Evidence standard:** All findings below derive from current source and tests. This final guide strengthens existing flows only; it does not authorize new employment, readiness, recruiting, staffing, or notification capabilities.

> **Core conclusion.** For an Administrator, **My Profile** is intentionally an own-record self-service workflow, not an administrative directory or readiness-review tool. **New-Hire Progress** is an Administrator/Recruiter launchboard for limited onboarding and assignment signals, not a staffing-decision workspace. Both pages have real protected data paths; the main verified gaps are state clarity, representative-fallback containment, Administrator-specific framing, and route-level regression coverage. [1] [2] [3]

## Executive assessment

`My profile` is available to all authenticated roles, including Administrator, and calls `profile.mine` using the authenticated session’s user ID. The form can submit only an employment-type label and a bounded status note. The server upserts that user’s `employee_profiles` row, resets the administrative workflow state to `details_requested`, and records the same user as updater. The page deliberately holds no document upload, reviewer decision, legal analysis, or authorization determination capability. [1] [2] [3] [4]

`New-hire progress` is available to Administrator and Recruiter. Its active launchboard calls a protected recruiter/admin procedure that joins users with onboarding assignments and returns only limited name, email, role, onboarding stage, percentage, manager-confirmation, project-name, assignment-state, and update-time fields. Restricted readiness fields and documents are excluded. The UI derives neutral handoff labels from existing stage and assignment values; it has no creation, edit, assignment, manager-confirmation, or decision mutation. [1] [2] [3] [4]

One material UI distinction is already visible in source: a successful empty New-Hire query silently substitutes local `demoRows`, while the page labels them as a representative queue. This makes a genuine no-record response indistinguishable from a demonstration fallback. The page also identifies itself as a “Recruiter workspace” even when an Administrator opens it. Both are verified presentation gaps, not reasons to create a new workflow. [1]

| Area | Current state | Assessment |
|---|---|---|
| My Profile read/write | Protected own-record query and upsert with constrained input. | **Live, database-backed self-service capability.** [2] [3] |
| My Profile state values | Five stored workflow indicators; employee mutation writes `details_requested`. | **Administrative tracking only; human review remains mandatory.** [3] [4] |
| New-Hire Progress | Protected Administrator/Recruiter query returns a restricted launchboard projection. | **Live, database-backed launchboard capability.** [2] [3] |
| Handoff labels | Client derives labels from current onboarding/assignment values. | **Representative of human-owned follow-up; no action is performed.** [1] |
| Launchboard fallback | Local `demoRows` render when returned rows are empty. | **Representative fallback that needs clearer state separation.** [1] |
| Resume/Candidate tools on same route | Current page composition also renders existing protected parser/finder/inline candidate components. | **Related existing recruiting capability, not New-Hire Progress data.** [1] [2] |

## Active architecture and request-path map

The managed Node/tRPC server remains authoritative. Client query enablement and navigation filtering reduce accidental exposure, while `protectedProcedure` and `recruiterProcedure` enforce access on direct API calls. The FastAPI reference artifact and external hosting are outside this live path. [1] [2] [5] [11]

| Layer | My Profile | New-Hire Progress | Boundary to retain |
|---|---|---|---|
| Workspace routing | All authenticated roles can reach `My profile`; unpermitted paths recover to Overview. | Only Administrator and Recruiter receive the navigation item and route. | Client-side routing is supplementary to server authorization. [1] |
| React data access | `profile.mine` is enabled for an authenticated non-preview user; `profile.requestReview` refetches after success. | `recruiting.newHireProgress` is enabled only for Administrator/Recruiter clients. | Add distinct loading/error/empty states without inventing fallback records. [1] |
| Node/tRPC contract | `protectedProcedure` derives the user ID from the session for both read and update. | `recruiterProcedure` permits only stored `admin` and `recruiter` roles. | Do not accept an arbitrary profile user ID or broaden recruiter access. [2] [5] |
| Data helper | Own profile read and unique-key upsert set only the present form fields plus workflow state/updater. | A fixed safe projection joins user and onboarding records and filters to `user`/`consultant` workforce roles. | Exclude documents, detailed readiness, compensation, and staffing decision records. [3] |
| Drizzle schema | `employee_profiles` stores administrative status, employment type, note, expiry, updater, and timestamps. | `onboarding_assignments` stores stage, percentage, manager confirmation, project name, assignment state, and update time. | State vocabularies remain closed; there is no task or decision table in this scope. [4] |
| Related AI | No My Profile contextual action is rendered. | Existing page-level recruiter summary is permitted to Administrator/Recruiter with bounded aggregate row context. | AI must remain human-reviewed and cannot make readiness, employment, or staffing decisions. [1] [2] |

## Active page composition versus representative UI

The selected route is important. `New-hire progress` renders the `RecruiterDashboard`, then the existing resume-parser/candidate view and inline candidate table. Those related components use separate protected recruiting contracts and should not be misrepresented as onboarding-assignment management. [1] [2]

| Surface | Rendered now? | Source / behavior | Correct classification |
|---|---:|---|---|
| My Profile status card | Yes | Reads the authenticated user’s profile status, employment type, and status note. | Protected own-record database view. [1] [2] [3] |
| My Profile request form | Yes | Sends only employment type and status note to own-record upsert. | Protected request for human review; not a self-approval form. [1] [2] |
| Reviewer ownership | Yes | Renders “Authorized reviewer” as static explanatory wording. | Correct safety copy; not a selectable reviewer or workflow assignment. [1] |
| New-Hire launchboard | Yes | Renders safe live rows when returned; otherwise uses a local three-row demo fallback. | Database-backed when live; representative fallback otherwise. [1] [3] |
| Handoff badge | Yes | Derives neutral message from stored stage, manager confirmation, and assignment state. | Human-follow-up indication only. [1] |
| New-Hire parser/finder/editor | Yes, on same route | Existing Recruiter/Admin file/AI/candidate contracts and UI components. | Adjacent recruiting capability; not a profile or onboarding mutation. [1] [2] |
| Local onboarding personas/checklist | No, selected on `Onboarding` only | Local client state and persona arrays. | Separate representative onboarding UI; do not use as New-Hire fallback. [1] |

## Data, state, and privacy boundaries

The existing schemas deliberately separate personal administrative profile tracking from recruiter-visible launchboard signals. The launchboard query returns no readiness status; My Profile uses the authenticated ID exclusively. [2] [3] [4]

| Domain | Existing fields / states | Authorized current use | Explicit exclusion |
|---|---|---|---|
| Employee profile | Employment type, status note, expiry date, updater, timestamps; states `not_started`, `details_requested`, `human_review`, `verified`, `expiry_watch`. | The authenticated user reads and requests human review of their own record. | Documents, identity copies, legal conclusions, eligibility decision, reviewer decision, and access to another user’s record. [3] [4] |
| Profile update | Input: employment type (2–96) and status note (8–500); update sets `details_requested`. | Any authenticated user, including Administrator, for own record only. | Arbitrary status setting, expiry-date editing, `updatedByUserId` spoofing, or another user ID. [2] [3] |
| Launchboard projection | Name, email, role, onboarding stage, progress percent, manager confirmed, project name, assignment state, update time. | Administrator and Recruiter view limited operational handoff signals. | Readiness status, documents, work-authorization details, finance fields, raw resumes, storage keys, or staffing recommendations. [2] [3] |
| Onboarding stage | `not_started`, `profile_in_progress`, `manager_confirmation`, `ready_for_assignment`, `assigned`. | Display and handoff-label derivation. | Stage change action, automated assignment, or automatic staffing decision. [1] [4] |
| Assignment state | `unassigned`, `pending`, `active`, `roll_off`. | Display and handoff-label derivation. | Assignment creation/editing, deployment decision, or payroll/invoice action. [1] [4] |
| Candidate tools on route | Existing candidate profile, private-resume, parser, and export capability. | Administrator/Recruiter recruiting work. | Do not treat parsed candidate data as onboarding records or use it to make decisions. [1] [2] |

> **Own-record rule.** Even when an Administrator opens My Profile, the server uses `ctx.user.id` rather than a client-supplied user ID. The Administrator does not obtain a hidden multi-employee readiness view through this page. [2] [3]

## Verified controls and test evidence

| Evidence | Verified behavior | Current limitation |
|---|---|---|
| `access.test.ts` | A non-recruiter is denied New-Hire data; launchboard rows omit `readinessStatus`; profile read/update helpers are invoked only with the authenticated user ID; oversized profile notes are rejected. [6] | It does not test every profile state, UI submission/error/empty states, or Administrator-specific My Profile rendering. |
| `demoSession.integration.test.ts` | A real demo recruiter session resolves to the protected launchboard and returns stage/assignment data without readiness status. [7] | It does not cover the Administrator session, no-row state, or the local UI fallback. |
| `Home.test.tsx` | Existing recruiting-route tests cover parser, protected upload, candidate filtering, exports, and inline candidate interactions on the shared route. [8] | It has no direct My Profile or launchboard row/hand-off browser-style assertion. |
| `demoAuth.browser.test.ts` | Existing browser coverage validates sign-in, recruiting file workflow, and assistant behavior. [9] | It has no dedicated authenticated My Profile or New-Hire Progress desktop/mobile journey. |
| Schema, DB, and router | The stored state vocabulary and narrow queries are directly implemented. [2] [3] [4] | They do not create a reviewer decision workflow, onboarding mutation, notification, task system, or staffing engine. |

## Verified gaps and capability-constrained remedies

| Priority | Verified gap or risk | Why it matters | Constrained remedy |
|---|---|---|---|
| High | New-Hire Progress swaps a successful empty protected result for local demo rows. [1] | A genuine empty cohort can look like live operational data. | Separate loading, error, successful-empty, and explicit representative-preview state; do not manufacture operational records. |
| High | Neither target page has dedicated query loading/error treatment. [1] | A failed protected request can be confused with an empty/default profile or queue. | Add component-level query state using current contracts only. |
| High | New-Hire UI calls itself “Recruiter workspace” and presents a recruiter boundary to an Administrator. [1] | Administrator context can be unclear despite correct API authorization. | Use accurate Administrator/Recruiter-neutral copy while retaining the same safe field projection. |
| Medium | An Administrator without an own profile row receives default display copy, but the UI does not distinguish profile not-yet-created from query failure. [1] [3] | Users cannot tell whether a submission is needed or data is unavailable. | Add a neutral first-profile state and error state; retain own-profile bounds. |
| Medium | My Profile form state has success indication but no dedicated mutation-error message. [1] | A user can lack clear feedback on a rejected/unavailable update. | Render safe existing mutation error feedback and prevent duplicate submits. |
| Medium | Handoff badges are useful but can appear action-like without an explicit read-only explanation near each result. [1] | The page must not be mistaken for an assignment or approval queue. | Add concise human-follow-up/read-only wording; do not add actions, recommendations, or automation. |
| Medium | New-Hire route includes separate candidate/parser functionality alongside onboarding signals. [1] [2] | Users could conflate candidate acquisition with employee onboarding. | Clarify section provenance and boundaries; do not connect candidate records to onboarding assignments without existing relationship support. |
| Medium | Direct My Profile and New-Hire Progress browser regressions are absent. [8] [9] | Shared-route changes could obscure ownership, readiness privacy, and fallback labels. | Add focused existing demo-session and component/browser checks. |

## Implementation prompts, restricted to existing capabilities

### Prompt 1 — Own-record My Profile contract and field minimization

> Harden the existing My Profile route without expanding its scope. Preserve `profile.mine` and `profile.requestReview` as authenticated own-record procedures that derive the target exclusively from `ctx.user.id`. Retain only the current input fields—employment type and a 8–500-character status note—and keep the stored state transition to `details_requested` plus authenticated updater ID. Return only the current profile presentation fields required by the page. Do not accept a user ID, expose other employee profiles, permit review-state or expiry edits, store documents, or make any work-authorization, eligibility, legal, hiring, or employment decision. Add direct contract tests for field absence, input bounds, and own-record enforcement across Administrator and non-Administrator callers.

**Acceptance conditions:** A client cannot read or update another profile by supplying an ID; a successful request leaves review ownership with an authorized human; and no document or decision capability is added. [2] [3] [4]

### Prompt 2 — My Profile loading, first-record, success, and error states

> Improve the active My Profile UI around the existing protected query and mutation. Add compact loading treatment, a distinct “no profile record yet” first-use state, mutation pending prevention, accessible success feedback, and a safe mutation/query error message. Keep the existing work-authorization category selector and status-note bounds, but reaffirm that submitted information is administrative and requires human review. Do not provide document upload, reviewer selection, a status override, legal guidance, automated recommendation, profile deletion, or notification. Preserve the current refetch after a successful request.

**Acceptance conditions:** Missing data, loading, and failure render differently; an unavailable request never appears as a submitted review; and the form sends only the existing two fields. [1] [2]

### Prompt 3 — Safe Administrator/Recruiter New-Hire projection

> Preserve the existing `recruiting.newHireProgress` contract for Administrator and Recruiter only. Keep the selected safe fields—name, email, role, onboarding stage, progress percentage, manager confirmation, project name, assignment state, and update time—and retain the current filter to consultant-compatible workforce roles. Continue excluding readiness status, documents, raw resumes, storage keys, finance data, pay/bill fields, and any decision-related fields. Keep `recruiterProcedure` as the server authority and add tests for Administrator success, non-Administrator/non-Recruiter denial, field absence, and accepted existing stage/assignment vocabularies.

**Acceptance conditions:** The page continues to expose limited operational handoff signals only, and no new person, assignment, or readiness write operation is introduced. [2] [3] [4]

### Prompt 4 — Launchboard state separation and representative-fallback containment

> Refine the active `RecruiterDashboard` so a successful empty `newHireProgress` response renders a neutral zero-cohort state rather than silently replacing it with local demonstration records. Add separate component-level loading and retry-safe error states. If a local representative preview remains needed for non-live preview mode, isolate it behind the existing preview condition and label it prominently as representative; never use it for a successful live empty or failed request. Do not seed records automatically, create onboarding assignments, or provide manager-confirmation, staffing, or assignment actions.

**Acceptance conditions:** Users can distinguish live rows, a successful empty result, an unavailable query, and preview-only representative rows; no local record can be mistaken for a live operational employee. [1] [3]

### Prompt 5 — Administrator-aware New-Hire copy and read-only handoffs

> Update New-Hire Progress presentation copy so the same safe launchboard is accurately described for both Administrator and Recruiter users. Keep the current title, stage/progress/manager/project/assignment displays, and derived handoff indicators, but replace role-exclusive wording with Administrator/Recruiter-neutral labels where appropriate. Next to handoff badges, state that they identify human-owned follow-up only and do not create assignments, approve onboarding, determine readiness, or make staffing decisions. Preserve the existing restricted-readiness boundary.

**Acceptance conditions:** An Administrator sees correct role context without receiving broader data, and no badge becomes a button or mutation. [1] [2]

### Prompt 6 — Preserve profile and launchboard state vocabulary

> Establish focused presentation and contract tests for the existing profile and launchboard state vocabularies. Profile display may map only `not_started`, `details_requested`, `human_review`, `verified`, and `expiry_watch` to human-readable administrative labels. The launchboard may derive handoff language only from `not_started`, `profile_in_progress`, `manager_confirmation`, `ready_for_assignment`, `assigned`, plus `unassigned`, `pending`, `active`, and `roll_off`. Treat unknown or absent values neutrally without inventing status. Do not add transitions, review approvals, notifications, task automation, or staffing logic.

**Acceptance conditions:** Unexpected values cannot crash rendering or create a decision implication, and all existing labels remain human-review oriented. [1] [4]

### Prompt 7 — Clarify the shared-route recruiting boundary

> Keep the existing page composition in which New-Hire Progress also renders the protected resume parser, Candidate Finder, and inline candidate table for Administrator/Recruiter users. Add concise section provenance so launchboard rows are identified as onboarding/assignment signals and candidate tools are identified as separate recruiter-visible candidate capabilities. Preserve each current contract and its existing role checks. Do not treat parsed candidates as new hires, auto-create onboarding assignments from a candidate, connect documents to employee profiles, or make candidate, staffing, eligibility, or hiring decisions.

**Acceptance conditions:** The route remains coherent while data provenance is clear, and no cross-domain record relationship or workflow is added. [1] [2]

### Prompt 8 — Bounded New-Hire AI assistance and regression matrix

> Preserve the existing Administrator/Recruiter `recruiter_summary` AI action and page-level workspace assistant boundaries. Provide only the current bounded aggregate onboarding/assignment context to the AI and retain human-review/unavailable-service messaging. Add a regression matrix covering own-profile reads/writes, profile bounds and errors, Administrator/Recruiter New-Hire access, denied role access, readiness-field exclusion, empty/error/representative state separation, handoff-label vocabulary, candidate/onboarding boundary copy, direct-route recovery, and authenticated desktop/mobile rendering. Use only existing internal demonstration data. Do not add AI decisions, personal-document context, notifications, payroll, payments, invoices, reviews, ratings, testimonials, or external integrations.

**Acceptance conditions:** AI never receives restricted profile/readiness content, browser flows preserve ownership and field masking, and all target-page state paths are exercised without adding a new operational workflow. [1] [2] [6] [7]

## Recommended implementation order

| Order | Prompt | Reason for sequence | Minimum validation |
|---:|---|---|---|
| 1 | Own-profile contract | Locks the privacy boundary before UI improvement. | Router tests for own-record and field exclusion. |
| 2 | New-Hire projection | Confirms safe role/field scope before display changes. | Server role, vocabulary, and restricted-field tests. |
| 3 | Profile state treatment | Makes failure and first-use behavior understandable. | Component loading/empty/error/pending tests. |
| 4 | Launchboard state separation | Removes ambiguity between database rows and demo fallback. | Live-empty/error/preview-only rendering tests. |
| 5 | Administrator-aware/read-only copy | Clarifies user purpose without changing data or actions. | Role-specific content and no-action tests. |
| 6 | State vocabulary | Protects neutral labels and human-review boundaries. | State/fallback unit tests. |
| 7 | Shared-route provenance | Prevents cross-domain misunderstanding. | Section-boundary UI tests. |
| 8 | AI and browser matrix | Verifies combined privacy and responsive behavior. | Full test suite, TypeScript, desktop/mobile authenticated checks. |

## Explicitly out of scope

This guide does **not** recommend capabilities absent from the current verified profile and launchboard implementation:

- Administrator access to another employee’s My Profile record or any reviewer override of work-readiness status from this page.
- Document capture, identity-document storage, legal or immigration guidance, work-authorization/eligibility determination, or automated employment decisions.
- Onboarding-assignment creation/editing, manager confirmation actions, task completion, staffing decisions, candidate conversion, assignment automation, or notifications.
- Timesheet approval, payroll, payments, invoicing, accounting integration, pay/bill/margin data, or commercial calculations.
- Customer reviews, ratings, testimonials, real confidential client data, or personal documents.
- A FastAPI cutover, Railway/external deployment, external TiDB migration, or a change to the managed Node/tRPC session runtime.

## Source references

[1]: ../client/src/pages/Home.tsx "Role routing, authenticated query setup, My Profile, New-Hire launchboard, representative fallback, shared-route composition, and bounded AI context"
[2]: ../server/routers.ts "Protected profile and recruiter routes plus AI task authorization"
[3]: ../server/db.ts "Own-profile upsert and restricted New-Hire launchboard projection/query"
[4]: ../drizzle/schema.ts "Employee-profile and onboarding-assignment state schemas"
[5]: ../server/_core/trpc.ts "Protected and Administrator/Recruiter procedure middleware"
[6]: ../server/access.test.ts "Profile ownership/bounds and safe New-Hire field coverage"
[7]: ../server/demoSession.integration.test.ts "Authenticated recruiter launchboard integration and readiness exclusion"
[8]: ../client/src/pages/Home.test.tsx "Existing shared recruiting-route component coverage"
[9]: ../server/demoAuth.browser.test.ts "Existing authenticated browser coverage; no dedicated target-page journey"
[10]: ../scripts/seed-demo-data.mjs "Stable internal demonstration profile and onboarding records"
[11]: ../fastapi_reference/app/main.py "Future reference service; not the live runtime"
