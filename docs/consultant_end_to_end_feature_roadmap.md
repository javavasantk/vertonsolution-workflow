# Consultant End-to-End Feature Roadmap

## Purpose

This roadmap defines a **consultant-first operating experience** for Verton Solution Inc.’s Workforce Hub. It is intentionally role-safe: it helps a consultant understand their own onboarding, assignment, time, and follow-up responsibilities without exposing colleague data, client-confidential material, Finance-only commercial values, source resumes, or restricted readiness information.

> The portal should surface **workflow information and human-owned next actions**. It must not make work-authorization, eligibility, staffing, compensation, assignment, or employment decisions.

## Current Foundation

The current Consultant workspace already provides protected access to **Overview**, **Onboarding**, **Delivery**, **Time & Billing**, **My Profile**, and the authenticated workspace assistant. My Profile is session-owned; Delivery and Time & Billing are role-scoped and read-only; and the currently rendered onboarding checklist is clearly marked as representative reference material. This creates a solid base, but it does not yet provide a persistent consultant-owned action plan, engagement check-in history, or notification delivery capability.

| Current capability | Consultant value today | Boundary to preserve |
| --- | --- | --- |
| Own My Profile | Submit an employment-type and status-note update for human review | No colleague profile access, reviewer selection, status override, document upload, or legal decision |
| Onboarding reference | Understand example handoffs and responsibilities | Existing checklist is representative, noninteractive, and not a persistent task system |
| Delivery visibility | See only consultant-scoped assignment, project, and client relationships | No demand creation, candidate matching, assignment creation, or staffing decision |
| Time & Billing | View consultant-scoped time records and states | Read-only billing readiness; no approvals, payroll, payment, invoice, or accounting actions |
| Assistant | Ask bounded workflow questions in an authenticated workspace | No decision-making and no unrestricted data access |

## Recommended Consultant Journey

The recommended journey is organized around the employee’s lifecycle rather than internal department pages. A consultant should open the portal and immediately see what is relevant to **their own record**, what needs human follow-up, and where to get help.

| Journey stage | Recommended capability | Primary user experience | Human owner / decision boundary |
| --- | --- | --- | --- |
| 1. Secure entry | Assigned-role landing summary | A concise personal dashboard with assignment, onboarding, and time-readiness cards | Access remains server-authorized from the session role |
| 2. Profile setup | Own-record profile completion | The consultant can update only their permitted profile fields and see “submitted for human review” status | HR or the assigned human owner handles review |
| 3. Onboarding | Persistent personal onboarding plan | A real, consultant-scoped checklist with due dates, owner, completion state, and evidence-free acknowledgment | Managers, HR, and IT own the underlying handoffs; no automatic approval |
| 4. Assignment | Engagement timeline | Project name, manager contact, assignment state, allocation, start/end dates, and neutral extension/roll-off indicator | Delivery leadership controls assignments and staffing outcomes |
| 5. Time tracking | Personal time-submission workspace | Draft, submit, return-for-correction, and submitted-for-review records linked to the assignment | A designated human approver controls approval; no payroll or invoice action |
| 6. Ongoing support | Action inbox and reminder preferences | In-app reminders, reminders that are due soon, and clear links back to the relevant own-record page | Reminder delivery never implies approval or a decision |
| 7. Transition | Roll-off and next-step handoff | Neutral status, end-date awareness, asset/knowledge-transfer acknowledgments, and a human owner | No automated redeployment, candidate matching, or assignment decision |

## Priority Feature Set

### Phase A — Consultant Home and Live Onboarding Plan

Add a **My Work** landing page for Consultants. It should aggregate only their own assignment, onboarding, profile-update, and time-submission signals. Each card should state its source, last updated time, and whether action is required, without exposing restricted readiness facts or team-wide counts.

Replace the representative onboarding checklist only after adding a normalized, consultant-owned onboarding-task data model. Each task should contain an approved type, title, description, owner group, due date, completion state, and timestamps. Consultants can acknowledge or complete only tasks assigned to their own user ID. A completion record should not equal manager confirmation, employment clearance, equipment provisioning, or work authorization.

| Feature | New data needed | Consultant actions | Server-side controls |
| --- | --- | --- | --- |
| My Work summary | Derived own-record view; no new sensitive fields | Open an assigned page or request help | Session user ID and role determine every record returned |
| Personal onboarding tasks | `onboarding_tasks` and a consultant-task assignment relation | Mark assigned task complete; add bounded optional note | Own-record update only; immutable activity history; no approval mutation |
| Human handoff card | Existing manager/project relation plus designated owner label | View owner and submit a non-decision help request | No manager confirmation or staffing decision from the consultant UI |

### Phase B — Assignment and Engagement Tracking

Add a consultant-scoped **My Engagement** page that renders only the consultant’s existing assignment relationship. It should show the current project, client label, allocation, manager name, assignment state, start/end date, and time-entry association. Where an assignment has a future end date, display a neutral “human follow-up may be needed” indicator rather than deciding whether to extend, roll off, or reassign the consultant.

Add an engagement check-in log only if the organization needs a durable record of consultant-submitted updates. A check-in should be a bounded factual note such as “access received” or “project orientation attended,” with a timestamp and author. It must not request immigration facts, health information, compensation information, client credentials, or subjective performance ratings.

### Phase C — Consultant Time Submission

The current Time & Billing area is intentionally read-only. If time submission is required, add it as a separate consultant capability with a narrow state machine such as **draft → submitted → returned for correction → approved**. Only the consultant may create or edit their own draft or returned entry; an assigned human role may approve or return it. Finance commercial data remains server-scoped and absent from the consultant response.

This feature should remain **billing-readiness only**. It must not calculate payroll, issue payments, create invoices, track expenses, or connect to accounting software unless a separate approved finance scope is defined.

### Phase D — Reminder Notifications and Action Inbox

The portal should first provide a clear in-app Action Inbox. It can surface deterministic reminders such as an onboarding task due soon, a profile update awaiting human review, a pending time submission, or an approaching assignment end date. Each reminder must link to an existing permitted action and state which human team owns resolution.

For automated delivery beyond the portal, choose one of the following approaches before implementation.

| Approach | Tradeoffs | Cost | Setup complexity |
| --- | --- | --- | --- |
| **In-app Action Inbox and on-demand reminders** | Safest starting point; no external delivery; users see reminders on sign-in but not outside the portal | No additional delivery service | Low; needs a notification data model and role-safe UI |
| **Scheduled email or chat reminders** | Delivers reminders without requiring portal sign-in; needs consent, delivery preferences, audit controls, and a configured communication provider | Provider and background-execution costs may apply | Medium; requires delivery credentials, a schedule, retry handling, and unsubscribe/preference controls |
| **Event-triggered notifications** | Fastest response when a task, profile update, or timesheet state changes; requires a durable event boundary and careful duplicate prevention | Depends on chosen communication provider | Medium to high; requires trusted event handling, delivery configuration, and delivery audit records |

No reminder should be sent for work-authorization expiry, hiring, eligibility, or staffing outcomes without an explicit policy and designated human review. Notifications should be opt-in where required, rate-limited, deduplicated, and auditable.

## Essential Supporting Capabilities

| Capability | Why it matters | Safe implementation requirement |
| --- | --- | --- |
| Consultant preferences | Lets users choose in-app versus permitted external reminders | Store only delivery preference and timezone; do not infer location or sensitive status |
| Ownership directory | Helps users know who handles a task | Show functional owner groups or approved contacts, not unrestricted employee directory data |
| Activity timeline | Makes handoffs transparent | Record factual actions, actor, timestamp, and source; avoid performance assessments or hidden scoring |
| Help request | Lets a consultant flag a blocked step | Structured, bounded request to a designated human owner; no automated routing decision |
| Mobile-first layout | Consultants often use phones for check-ins and reminders | Large tap targets, concise cards, keyboard accessibility, and responsive detail pages |
| Audit and privacy controls | Protects personal and client information | Enforce own-record access server-side, minimize responses, and preserve existing session and demo isolation |

## Recommended Delivery Order

| Priority | Implementation increment | Success condition |
| --- | --- | --- |
| 1 | Consultant My Work dashboard and source-labeled own-record summary | A Consultant sees only their own allowed data with loading, error, empty, and no-assignment states |
| 2 | Persistent personal onboarding tasks | Assigned tasks are stored, own-record scoped, human-owned, and never treated as approvals |
| 3 | My Engagement timeline and factual check-ins | The consultant can view their assignment and submit bounded factual updates without making staffing decisions |
| 4 | Personal time submission, if operationally required | Consultant drafts/submits only own time; designated humans handle review; no payroll or invoices |
| 5 | In-app Action Inbox | Deterministic reminders link to permitted actions with owner labels and state separation |
| 6 | External reminder delivery | Implement only after a delivery channel, consent model, schedule, and audit requirements are approved |

## Implementation Prompts

### Prompt C-1 — Consultant My Work Dashboard

> Build a protected Consultant My Work dashboard using only session-owned profile, onboarding, assignment, and permitted timesheet signals already available to the authenticated user. Render current assignment, onboarding progress, profile-update state, and time-submission state with source labels and last-updated timestamps. Add loading, unavailable, no-assignment, and successful-empty states. Enforce own-record filtering on the server. Do not expose colleague records, client documents, readiness details, compensation, commercial values, candidate data, or staffing recommendations.

### Prompt C-2 — Persistent Personal Onboarding Tasks

> Replace the representative Consultant onboarding checklist only with a normalized, protected onboarding-task capability. Store task title, approved task type, description, owner group, due date, consultant completion state, and timestamps. A Consultant may view and acknowledge only their assigned tasks. Task completion is not manager confirmation, employment authorization, provisioning approval, or an assignment decision. Add server ownership checks, immutable factual activity capture, loading/error/empty states, and desktop/mobile tests. Do not add document collection, legal guidance, automated approval, notification delivery, or staffing logic.

### Prompt C-3 — Consultant Engagement Tracking

> Add a protected My Engagement page that projects only the current authenticated Consultant’s assignment, project name, client label, manager name, allocation, start/end date, assignment state, and permitted time-entry relationship. Use neutral human-follow-up labels for extension, roll-off, and missing relationships. Add explicit loading, unavailable, and no-active-assignment states. Do not add project creation, demand creation, candidate matching, extension approval, redeployment decisions, commercial fields, or client document storage.

### Prompt C-4 — Factual Consultant Check-ins

> Add an own-record consultant check-in capability for bounded factual engagement updates. Permit only an approved check-in category, a 10–500 character factual note, and timestamp; display the designated human owner for follow-up. Enforce session-user ownership at the server and retain an append-only activity entry. Do not add performance ratings, private client credentials, work-authorization facts, health data, compensation, staffing recommendations, automated routing, or decision-making.

### Prompt C-5 — Consultant Time Submission (Optional New Scope)

> If approved as a separate finance/workflow scope, add a protected Consultant time-submission capability using only the consultant’s assignment relation, week ending, hours, permitted note, and the existing draft/submitted/approved/exception vocabulary. Permit the Consultant to create or edit only draft or returned-for-correction records tied to their own assignment; designated human roles handle submitted-record review. Add server ownership checks, date/hour validation, loading/error/empty states, and audit entries. Do not add payroll calculation, payment, invoice generation, expenses, accounting integration, commercial rates, or automated approval.

### Prompt C-6 — In-App Action Inbox

> Add a protected in-app Action Inbox for Consultants that displays deterministic, own-record reminders from existing onboarding tasks, profile-update status, permitted time records, and assignment end-date signals. Each item must identify its source, status, designated human owner, and an existing permitted destination. Add notification read/dismiss state scoped to the session user, deduplication, rate limits, loading/error/empty states, and accessibility support. Do not send external messages, automate decisions, or surface readiness, compensation, client-confidential, or colleague data.

### Prompt C-7 — Scheduled Reminder Delivery (Only After Channel Approval)

> Implement opt-in scheduled reminder delivery for existing Consultant Action Inbox items only after the organization selects a communication channel and provides approved delivery credentials. Respect user timezone and preference; send only deterministic reminders about permitted onboarding tasks, profile-update follow-up, time-submission follow-up, or assignment end-date awareness. Store delivery preference, delivery attempt, deduplication key, outcome, and timestamp; provide retry-safe handling and unsubscribe/preference controls. Do not send work-authorization, eligibility, hiring, compensation, staffing, payroll, invoice, or legal-decision notifications.

## Acceptance Gate

Before deploying any consultant feature, verify that the user can only access their own record; a direct API request for another person’s record fails; every screen has loading, unavailable, empty, and no-assignment behavior where relevant; all external reminders are optional, auditable, and rate-limited; and no UI or API returns resumes, private storage keys, restricted readiness material, commercial values, or employment/staffing decisions.
