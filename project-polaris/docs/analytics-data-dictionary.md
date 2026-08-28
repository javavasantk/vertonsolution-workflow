# Product Analytics Data Dictionary

Product analytics is separate from service observability. It is disabled by default until an approved privacy decision enables it. The validation layer accepts only the event names and properties listed below after a current explicit analytics consent decision.

| Event | Purpose | Allowed properties | Explicitly prohibited |
|---|---|---|---|
| `onboarding_completed` | Measure completion of optional local onboarding flow | `appVersion`, `locale` | Planning preferences, task data, account identity. |
| `language_selected` | Validate language-picker usability | `locale`, `selectionSource` | Search query, user text, device identifier. |
| `assistant_consent_changed` | Confirm consent control works | `decision`, `noticeVersion`, `capability` | Selected source text, policy copy, email. |
| `assistant_draft_requested` | Measure capability reliability | `capability`, `outcome`, `latencyBucket`, `appVersion` | Task/Inbox/note/share text, due date, course, prompt, draft. |
| `assistant_draft_reviewed` | Measure draft review outcome | `capability`, `outcome` | Candidate content, selected action, source ID. |
| `privacy_control_opened` | Confirm privacy controls are discoverable | `control` | Export URL, deletion request ID, account data. |
| `export_request_state_changed` | Monitor request lifecycle | `state` | Export content, artifact URL, identity. |
| `sync_status_observed` | Measure coarse client reliability | `state` | Sync operation payload, task ID, device pseudonym. |

The application must reject unknown events/properties. It must never include task, course, note, source text, assistant input/output, deadline, availability, plan, reminder, Focus duration, account identifier, device pseudonym, IP, token, export/deletion artifact, or inferred academic/behavioral/health attribute.

Withdrawal stops new product-analytics collection and clears unsent local records. Any remote retention/deletion behavior must follow the approved policy and be described accurately in the Privacy Dashboard. Operational logs and metrics are governed separately by `docs/observability.md`; they must remain content-free and low-cardinality.
