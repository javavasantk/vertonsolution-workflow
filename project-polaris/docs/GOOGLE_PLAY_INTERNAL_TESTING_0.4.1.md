# Project Polaris 0.4.1 Internal Testing Preparation Package

**Status:** Preparation complete; **not approved for upload**. This document prepares a controlled Google Play Internal Testing release for the generic, device-local Project Polaris preview. It does not authorize a Play Console upload, tester invitation, or public publication.

> **Release principle.** The first Play distribution must be an **Internal Testing** release for a small, trusted group using synthetic data. It must not be moved to closed, open, or production testing until every blocker in this document and the release-gate report is closed.

## 1. Release candidate and technical status

| Item | Prepared value | Release status |
|---|---|---|
| Application ID | `com.projectpolaris.app` | Reserved only; verify availability in Play Console |
| Candidate version | `0.4.1-internal.1` / version code `5` | Prepared |
| Android baseline | Minimum API 26; target API 36; compile API 36 | Prepared |
| Candidate artifact | `android/app/build/outputs/bundle/release/app-release.aab` | **Unsigned; do not upload** |
| Device data model | Local Room database; device-only export | Implemented preview capability |
| Network/cloud behavior | Sync beta disabled; no account, live AI, or server data transfer | Intended internal-test scope |
| Runtime permission | `POST_NOTIFICATIONS` only, requested from Settings after user choice | Requires physical-device verification |
| Build/lint result | Release AAB build succeeded locally | Not sufficient for upload |

New Play submissions must target Android 16 / API 36 or later from 31 August 2026. This candidate is configured to meet that platform-level requirement.[1]

## 2. Upload signing plan — mandatory before upload

The current candidate has **no release signing configuration**. Play Console must never receive a debug-signed build, and the repository must never contain a keystore or keystore password.

| Step | Release owner action | Evidence to retain |
|---|---|---|
| 1 | Create an upload keystore in the organization’s approved secret-management environment. | Keystore custody record; not the keystore itself. |
| 2 | Copy `android/release.properties.example` to a protected local or CI secret store and provide the four `POLARIS_*` values. | Secret-store access audit. |
| 3 | Build `:app:bundleRelease` only in protected CI or an approved release workstation. | Build log and immutable artifact digest. |
| 4 | Verify the upload-certificate SHA-256 fingerprint with the release owner. | Signed certificate fingerprint record. |
| 5 | Enroll the app in Play App Signing during the controlled Console workflow. | Play Console enrollment evidence. |

Android App Bundles are the recommended publishing artifact, and Play App Signing is required before an App Bundle can be uploaded to Play Console.[2]

## 3. Store listing draft — English source only

No shipping-locale manifest or native linguistic approvals exist. Do **not** create a localized listing or represent non-English language availability. Use the following English copy only after legal and product approval.

| Field | Draft copy | Approval state |
|---|---|---|
| App name | DayTodo | Product approval required |
| Short description | Plan tasks, appointments, and routines offline on your device. | Product and legal approval required |
| Full description | DayTodo, developed by Project Polaris, is a calm, local-first way to organize work, home, personal, and project activities. Create tasks, choose an activity category, add an optional date and time, and review tasks by day, week, or month. Organize tasks into Areas, keep notes and checklists, use local search, and export your device-local workspace when you choose. Optional reminders are enabled only after you choose to allow notifications. DayTodo currently keeps planning data on your device and does not provide cloud backup or shared workspaces in this preview. | Product, legal, privacy, and localization approval required |
| Support email | `vasantkatta1416@gmail.com` | Provided by release owner; legal review remains required |
| Privacy policy URL | `https://javavasantk.github.io/project-polaris-privacy-policy/` | Public HTTPS page verified; legal review remains required |
| Category | Productivity | Product owner to validate |
| Audience wording | “DayTodo is a general-purpose task and planning app, developed by Project Polaris. Availability and intended audience must be finalized by the release owner before submission.” | **Legal/policy review required** |

Do not make grade-improvement, health, medical, guaranteed productivity, autonomous-AI, school affiliation, team collaboration, cloud-sync, or language-availability claims. Google Play requires a privacy-policy link even when an app does not collect or share user data.[3]

## 4. Data Safety and App Content drafting rules

The 0.4.1 candidate is intended to operate only on device. This is a **drafting aid**, not a declaration ready to submit. The release owner must inspect the final signed AAB, all transitive SDKs, and actual runtime traffic immediately before completing Play Console forms.

| Play form topic | Candidate behavior to verify | Draft response state |
|---|---|---|
| Data collection/sharing | No account, cloud sync, analytics forwarding, live AI, or network telemetry is intended in the 0.4.1 internal candidate. | Do not answer “No” until the signed AAB and SDK inventory are verified. |
| Data encryption in transit | No intended data transfer in the preview. | Not applicable only if no collection/sharing is verified. |
| Deletion request | Device-local data is controlled on the device; there is no account-side data to delete in the preview. | Legal/policy review required; do not overstate deletion support. |
| Notification permission | Optional `POST_NOTIFICATIONS` is used only after the user selects reminder enablement in Settings. | Declare/describe accurately if form guidance requires it. |
| Target audience | No audience configuration or age gate has been implemented. | **Blocking legal/policy decision required.** |
| Ads / financial features / health claims | None intended. | Verify against final signed artifact. |

All Play-published apps must provide accurate Data Safety declarations for their collection, sharing, and security practices, including behavior of third-party libraries. Closed and open test tracks require a completed Data Safety form; Internal Testing-only apps are exempt from its inclusion, but the app’s privacy statements must still be accurate.[3]

## 5. Internal Testing setup checklist

Internal testing is the only permitted first Play destination after the prerequisites above are closed. It supports a restricted group of up to 100 testers and is appropriate for initial quality assurance.[4]

| Sequence | Play Console action | Release gate |
|---|---|---|
| 1 | Create or select the Play Console app using package `com.projectpolaris.app`. | Developer-account owner confirms package ownership. |
| 2 | Enroll in Play App Signing and upload the **signed** AAB. | Upload certificate verified. |
| 3 | Create an Internal Testing release named `0.4.1-internal.1`. | Version code 5 is new in the account. |
| 4 | Add only named internal testers and share the opt-in link through an approved private channel. | Tester roster and synthetic-data agreement complete. |
| 5 | Provide the English source listing and placeholder-replaced contact/policy values. | Legal/product approval IDs attached. |
| 6 | Run pre-launch report, physical-device smoke tests, and permission-denial tests. | All P0/P1 release checks pass. |
| 7 | Collect feedback using a private support channel. | Incident contact path active. |

## 6. Mandatory blockers before any upload

| ID | Blocking condition | Owner | Required evidence |
|---|---|---|---|
| GP-01 | The public policy requires qualified legal review and alignment verification with the signed AAB. | Product / Legal | Legal approval ID; final policy-to-binary comparison. |
| GP-02 | No approved audience, App Content, Data Safety, or policy review decision. | Legal / Policy | Completed reviewed forms and approval IDs. |
| GP-03 | No release/upload keystore, protected signing workflow, or signed AAB. | Release engineering | CI signing evidence and certificate fingerprint. |
| GP-04 | No physical-device UI verification for version 5. | Android QA | Test report, screenshots, permission-denial test. |
| GP-05 | No localization manifest, native linguistic approval, or RTL evidence. | Localization / QA | Either verified English-only scope or approved locale artifacts. |
| GP-06 | No confirmed app icon, feature graphic, screenshots, or content rating completion. | Product / Design / Legal | Approved Play asset and questionnaire package. |
| GP-07 | Current product release gate remains no-go for production capabilities and only supports a device-local preview. | Engineering / Release manager | Internal-test scope acceptance and updated test plan. |

## 7. Explicit hold point

Do not open, upload, submit, roll out, or publish anything in Play Console until a release owner has provided explicit confirmation after reviewing the signed AAB, final policies, internal-tester list, and completed checklist. The Console upload and rollout are external publication actions and require a separate confirmation at the moment of submission.

## References

[1] [Android Developers — Meet Google Play’s target API level requirement](https://developer.android.com/google/play/requirements/target-sdk)

[2] [Android Developers — Build and test your Android App Bundle](https://developer.android.com/guide/app-bundle/test)

[3] [Google Play Console Help — Provide information for Google Play’s Data Safety section](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)

[4] [Google Play Console Help — Set up an open, closed, or internal test](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en)
