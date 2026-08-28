# Observability and Emergency Controls

Project Polaris collects only safe operational metadata needed to run the service. Product analytics is separate, consent-gated, allow-listed, and documented in `analytics-data-dictionary.md`.

## Permitted operational signals

| Area | Permitted examples |
|---|---|
| API | Route template, HTTP status class, latency bucket, deployment revision, readiness result. |
| Authentication and authorization | Safe validation/denial category and aggregate rate. |
| Assistant | Capability, policy/schema outcome category, provider category, timeout/circuit state, latency/cost bucket. |
| Sync and jobs | Aggregate acknowledgement/retry/conflict counts, queue age, dead-letter state, handler outcome. |
| Privacy | Aggregate export/deletion state, artifact expiry/authorization error category. |
| Platform | Instance/concurrency/resource pressure, database connection/capacity, Redis availability, migration/backup job result, deployment/feature flag state. |

The following must never appear in logs, traces, metrics, dashboards, alerts, tickets, or CI artifacts: learner content; raw AI prompt/output; tokens/credentials; email/phone/address; task/course/note/share/focus text; exact schedule/deadline/availability; device pseudonym; export URL/content; database URI; internal stack trace; or full request body/query parameters.

## Alert response

Alert/runbook categories are API readiness/latency, authorization anomaly, database/backup, job queue, assistant policy/schema/provider/cost, export/deletion, storage access, secret/redaction, locale-release drift, and budget. Threshold values and recipient channels are environment configuration approved before deployment; they are not embedded in source control.

The assistant kill switch must reject new provider submissions before content leaves the service. It does not disable guest planning, delete local data, or erase drafts. Equivalent controls can pause product analytics forwarding, sync transmission, export delivery, and deletion intake without bypassing authorization or silently deleting data.
