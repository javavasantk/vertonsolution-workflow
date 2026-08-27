# Final Remaining Overview and Talent Pipeline Implementation Prompts

**Scope:** Authenticated Workforce Hub functionality already present in the managed React, Node/tRPC, Drizzle, and TiDB application.  
**Purpose:** This final guide converts verified page-level gaps into implementable prompts without introducing an ATS, pipeline engine, staffing decision process, payments, accounting, notifications, external integrations, or any automated employment decision.

> **Implementation rule.** The desired outcome is a more truthful, connected presentation of existing protected data—not new business workflows. Server-side role checks, private resume storage, human review, and finance/readiness boundaries remain authoritative. [1] [2] [3]

## Verified remaining gaps

| Page | Current unimplemented or representative element | Safe existing-capability direction |
|---|---|---|
| Overview | Five-stage Recruiting flow chart is hard-coded. | Use an aggregate of existing candidate review states or label it representative. |
| Overview | “This week” looks like a filter but has no behavior. | Make it explanatory/noninteractive, or filter only the existing timesheet collection by week ending. |
| Overview | “View exceptions” only changes pages. | Derive a bounded attention summary from existing activity, timesheet, assignment, and demand states. |
| Overview | Protected summary query has limited loading/error/empty treatment. | Add explicit state UI without fabricated metrics. |
| Overview | Administrator governance records exist only in Admin Center. | Add aggregate-only, Administrator-only governance drill-through. |
| Talent Pipeline | Table, stages, profile strength, activity history, and demand cues are local arrays. | Recompose Administrator/Recruiter view from existing protected candidate projection. |
| Talent Pipeline | Account/Delivery roles can see representative candidate-like records without matching server scope. | Remove/recover their route; do not broaden recruiter procedures. |
| Talent Pipeline | Add, Filters, and Open profile controls are inert. | Replace with links to existing parser/Candidate Finder or neutral non-actionable UI. |
| Talent Pipeline | No direct permitted route and Administrator browser coverage for the operational candidate view. | Add route resolver mapping and focused existing-flow tests. |

## Ordered implementation prompts

### Prompt 1 — Overview summary state integrity

> Implement explicit component-level **loading**, **unavailable**, and **successful-empty** states for the authenticated Administrator Overview using the existing protected `portal.demoSummary` query. Keep metric cards, action queue, assignment signals, and priority demand derived only from returned clients, projects, demands, assignments, timesheets, and operational activities. Never substitute local counts when the query fails or returns an empty collection. Retain internal-demonstration provenance labels, exclude resume content, private storage references, readiness data, credentials, and finance-only commercial values, and add client/router tests for every state.

### Prompt 2 — Candidate-review aggregate instead of the synthetic funnel

> Replace the Overview’s representative Sourced/Screened/Submitted/Interview/Offer graphic with a protected, aggregate-only **Candidate review flow** based on the existing Administrator/Recruiter candidate query. Count only the persisted states `pending_human_review`, `reviewed`, and `archived`; label every result as human-reviewed workflow metadata and route users to the existing Talent Pipeline/Candidate Finder. Do not add applicant stages, ranking, matching, screening, interview, offer, candidate contact rows, raw resumes, readiness information, or hiring decisions. Test counts, empty state, access denial, and field exclusion.

### Prompt 3 — Deterministic attention summary and existing-page routing

> Enhance the Administrator Overview with a small, bounded human-review attention summary derived only from existing protected records: `activityState=attention`, timesheet `exception`, assignment `roll_off` or `extension_due`, and `open` demand with `high` or `critical` priority. Display record type, existing status, and a deterministic link to the existing Delivery or Time & Billing page. If no qualifying data exists, show a neutral empty state. Do not add reminders, approvals, auto-escalation, assignment changes, staffing decisions, or a new exception table.

### Prompt 4 — Aggregate-only governance snapshot

> Add an Administrator-only Overview governance strip using the existing protected `access.listUsers`, `access.permissionGroups`, and `access.roleChangeHistory` procedures. Show only account count, role distribution, permission-group count, and recent role-change count; link to the existing Admin Center for details. Preserve server-side Administrator enforcement and demo/production isolation. Do not display directory rows, passwords, reset data, session details, role recommendations, or any automatic role action. Test Administrator visibility, all other role denials, demo isolation, aggregate calculation, and drill-through behavior.

### Prompt 5 — Truthful Overview controls

> Resolve the Overview controls that resemble unavailable capabilities. Convert “This week” to noninteractive explanatory text unless it filters the already-returned timesheets by their existing `weekEnding` field. Convert “View exceptions” into a label that accurately describes the bounded attention summary from Prompt 3. Do not create reporting, export, date-range persistence, scheduling, notifications, or a new analytics system. Add UI tests proving no inactive control implies a completed action.

### Prompt 6 — Protected Talent Pipeline data-source reconciliation

> Rebuild the Administrator/Recruiter Talent Pipeline from the existing `recruiting.listCandidates` protected projection rather than local candidate arrays. Render candidate name, permitted contact metadata, location, years of experience, skills, extraction confidence, recent roles, education, recruiter notes, and only `pending_human_review`, `reviewed`, or `archived`. Include result count, loading/error/empty states, seeded-internal-demo wording where applicable, and human-review guidance. Do not query raw resume text, storage keys, upload sessions, readiness fields, finance data, candidate ranking, or new pipeline-stage fields. Keep server authorization unchanged and test Administrator/Recruiter access plus Consultant denial.

### Prompt 7 — Talent Pipeline role-scope correction

> Align Talent Pipeline navigation with current server policy. Administrator and Recruiter may use the database-backed candidate view; Account Manager and Delivery Manager must not receive recruiter-visible candidate profiles because no current protected candidate contract allows them. Remove their Talent Pipeline entry through the existing role resolver or provide a safe route recovery to their permitted delivery workspace. Do not widen candidate-list, parser, upload, curation, or assistant permissions. Test navigation, direct-route recovery, and API denial for every unsupported role.

### Prompt 8 — Existing Candidate Finder search and selected detail

> Connect the current Candidate Finder search to the Administrator/Recruiter Talent Pipeline. Preserve search only across candidate name, location, and skills; preserve one extracted-skill filter and the existing 0–3, 4–7, and 8+ experience buckets. Build an accessible selected-candidate detail panel from the already protected projection and display human-review state and extraction confidence as non-decision information. Do not add sorting by suitability, ranking, matching, contact export, work-authorization data, compensation, manual candidate creation, stage transitions, or hiring actions. Test filters, selected detail, close action, labels, and empty states.

### Prompt 9 — Replace inert talent controls with existing handoffs

> Replace the representative Talent Pipeline’s inert Add talent profile, Filters, and Open profile controls. For Administrator/Recruiter roles, route Add talent profile to the existing protected New-Hire Progress resume parser and Candidate Finder; preserve its 80–12,000-character text limit, PDF/DOCX-only 5 MB bound, private uploader-bound session, successful `pending_human_review` upsert, and unavailable-AI fallback. Replace unsupported controls with neutral non-actionable copy rather than inventing actions. Do not build manual profile creation, candidate deletion, CRM/email integration, pipeline-state mutation, candidate scoring, or external sharing.

### Prompt 10 — Existing metadata curation, assistant lookup, and deep-link regression

> Within the corrected Administrator/Recruiter Talent Pipeline, expose only current human curation: name, location, years of experience, and a maximum 20-item skill array through the existing server-validated update mutation and operational-activity record. Retain the existing bounded Workspace Assistant candidate lookup, limiting model context to name, location, experience, skills, and review state. Add a permitted Talent Pipeline workspace route using the existing resolver; test login gating, Administrator/Recruiter direct-route rendering, unsupported-role recovery, query states, safe detail fields, curation cancel/save, assistant prompt bounds, model-context exclusions, and desktop/mobile layouts. Do not add review-state edits, decisions, reminders, background jobs, external systems, or a new backend runtime.

## Acceptance sequence

| Sequence | Complete when |
|---:|---|
| 1–3 | Overview metrics and attention only reflect protected current records, and no failed/empty query displays invented data. |
| 4–5 | Governance and control wording accurately represent existing protected capability. |
| 6–8 | Talent Pipeline uses protected candidate records only for Administrator/Recruiter, with meaningful safe states and detail. |
| 9–10 | Existing parser, curation, assistant, routes, and regression coverage are connected without scope expansion. |

## Explicit non-goals

Do not add sourcing, requisitions, interviews, offers, manual candidate creation/deletion, candidate scoring/ranking, automated staffing/hiring decisions, work-authorization/eligibility determination, legal guidance, payments, payroll, invoicing, accounting, notifications, schedules, audit/candidate exports beyond the existing parsed-result export, external ATS/CRM systems, reviews, ratings, testimonials, or external hosting/migration work.

## References

[1]: ../client/src/pages/Home.tsx "Current login, Overview, Talent Pipeline, route, and query composition"
[2]: ../server/routers.ts "Protected portal, recruiting, access, and AI contracts"
[3]: ../server/db.ts "Current Drizzle-backed summary and candidate data helpers"
[4]: ./admin_overview_end_to_end_review.md "Prior detailed Overview capability assessment"
[5]: ./admin_talent_pipeline_end_to_end_review.md "Prior detailed Talent Pipeline capability assessment"
