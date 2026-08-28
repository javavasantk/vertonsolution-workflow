# Data Classification

| Category | Examples | Storage/use rule |
|---|---|---|
| Learner-authored content | Tasks, courses, notes, subtasks, Inbox/share text, Focus labels | Keep local first. Send only deliberately selected minimum content to approved server-side assistant after authentication and granular consent. Never log, analyze, translate automatically, or use for product analytics. |
| AI draft content | Validated draft actions, uncertainty, safe policy status | Account/workspace scoped, reviewable, short-retention by approved policy. No provider raw prompt/output in observability. Never changes data without confirmation. |
| Consent metadata | Capability/event scope, decision, policy version, locale, time | Store minimum policy-enforcement evidence. Never include selected task/source text. |
| Identity and security | Firebase token, service credential, secret, signed URL, DB URI | Runtime/Secret Manager only. Never stored in Android source, logs, artifacts, analytics, or screenshots. |
| Operational telemetry | Safe code, route template, deployment revision, latency/cost bucket | Redacted and low-cardinality. Excludes content, identity, device pseudonym, schedules, and URLs. |
| Product analytics | Allow-listed non-content event/property after consent | Disabled/minimized by default. No dynamic metadata/property escape hatches. Withdrawal stops future collection. |
| Privacy artifact | Synthetic test export or user-approved real export | Private, account-scoped, encrypted managed storage, short-lived access/lifecycle. Content/URL never logged. |

No Project Polaris V1 capability collects contacts, precise location, calendar data, microphone data, advertising identifiers, hardware identifiers, targeted-advertising data, or school/LMS data.
