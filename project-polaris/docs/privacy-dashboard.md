# Privacy Dashboard

The Privacy Dashboard presents controls and status without making cloud use a requirement. It must always be accessible from Settings, localized through the approved content pipeline, usable with TalkBack/keyboard/RTL/dynamic text, and available even when consent is declined.

| Section | Guest workspace | Signed-in workspace |
|---|---|---|
| Local workspace | Explains local-only storage; offers local export/delete discovery without claiming cloud coverage. | Explains that the device copy remains separate from account/cloud deletion. |
| Account and sync | States that backup is optional and does not exist until the learner signs in/migrates. | Shows accurate account/sync state and a non-destructive sign-out route. |
| AI features | States that AI is off until capability-specific consent; local manual alternatives remain available. | Shows capability consent/policy version, selected response locale, disclosure, turn-off action, and draft retention scope. |
| Product analytics | States default and offers no-pressure control. | Shows consent state, reviewed data categories, withdrawal, and retention/deletion status. |
| Export | Describes local export scope only. | Shows authenticated export request state, secured delivery expiry, retry/error status, and included categories. |
| Delete | Describes separate local deletion confirmation. | Explains account/cloud deletion, retention policy link, request state, and separate local-device choice. |
| Notifications | Links to local app/system controls without claiming app settings override Android. | Same behavior; no cross-device auto-enable claim. |

## Verification rules

Export and account/cloud deletion are verified only with synthetic staging accounts and artifacts. An export is account-scoped, private, time limited, schema-versioned, and never logged. A deletion request is explicit and authenticated, follows a policy-configured lifecycle, cancels or safely pauses eligible jobs, and never claims immediate backup purge if retention applies. Neither action deletes local Android data unless the learner separately confirms local deletion.
