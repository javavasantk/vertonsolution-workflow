# AI Safety Boundary

The Polaris assistant is an optional cloud capability. In this implementation it supports only **task extraction** and **task breakdown**. Both capabilities are draft-only and begin only after an authenticated learner has selected content, reviewed a just-in-time disclosure, and made a current capability-specific data-use choice.

## Control path

| Stage | Required control | Result on failure |
|---|---|---|
| Entry | Learner explicitly chooses a supported capability | Continue using local manual planning. |
| Eligibility | Verified authentication, workspace ownership, feature gate, policy version, and consent | No content leaves device. |
| Policy | Deterministic request-size, scope, academic-integrity, sensitive-content, and capability checks | Return localized safe alternative; no provider call. |
| Provider | Server-only adapter with bounded structured output | Invalid output is rejected and never rendered raw. |
| Review | Learner edits/selects/rejects every proposal | No task, plan, notification, or reminder is changed. |
| Confirmation | Opaque short-lived, one-time, account/workspace/revision/candidate-bound receipt | An ordinary local domain mutation can proceed only after validation. |
| Sync | Existing idempotent outbox and normal authorization | No special assistant mutation channel exists. |

## Prohibited behavior

The assistant is not a generic chatbot or agent. It cannot browse, access external services, inspect unrelated workspace data, retrieve arbitrary documents, call tools, write directly to Room/PostgreSQL, schedule or move plans, create/send notifications, delete data, complete a task, generate submit-ready assessment answers, or override learner judgment.

Learner-provided text is untrusted data. It is never interpreted as an instruction to change policy, reveal secrets, access data, or perform an action. The application stores no raw provider prompt/output in logs, analytics, metrics, or alerts.

## Response language and content preservation

Assistant-authored text uses the selected assistant response locale where the provider/configuration supports it. Proper names, course codes, quotations, assignment text, and learner-authored text remain unchanged unless the learner manually edits a draft. A language change changes UI/assistant response presentation, not user task data.

## Production prerequisites

Before a real provider adapter may be enabled, the team must approve the provider data-use configuration, egress route, secret storage, model/version allow-list, request/response limits, rate/cost budget, audit metadata, incident runbook, safety testing, localized disclosure/refusal copy, and Prompt 12 release evidence. The feature flag remains disabled until these controls are verified in staging.
