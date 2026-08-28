# Project Polaris 0.3.0 — Phone Test Guide

## Purpose and safe test boundary

This is a **local-first Android debug preview**. Use synthetic test information only. The app now has durable local state, searchable task views, task details and checklist interaction, archive/restore controls, repeat-rule creation, JSON export, and optional best-effort task reminders. It does not yet have account sign-in, cloud backup/sync, collaboration, a live AI provider, a full translation release, or production privacy deletion.

> The app should remain usable in airplane mode. It stores data locally in a Room database and retains a legacy-preview import path. No task content, note, tag, checklist item, project, or location label is sent to a network service in this build.

## Install or update

Install `ProjectPolaris-local-workflow-preview-0.3.0.apk` on an Android 8.0+ phone. If a previous preview is installed, Android should offer an update because this build uses the same debug certificate and a higher version code. Download it, open the file in **Files** or **Downloads**, and allow that trusted app to install the test build if Android asks.

## Functional test script

| Step | Test action | Expected result |
|---|---|---|
| 1 | Launch the app, complete guest onboarding, choose a language preference, and add Areas named `Work`, `Home`, and `Personal`. | No account or runtime permission is requested. The selected preferences and Areas persist after restart. |
| 2 | In Inbox, add `Prepare launch notes`; select Work and High priority. Open **More options** and add Project `Website launch`, status In progress, type Review, effort 30 min, tags `release, notes`, and two checklist items. | The task saves locally. Its key labels display on the card. |
| 3 | Select **Task details**. Toggle one checklist item. Close and reopen the app, then inspect task details again. | The checklist completion state and all task options remain saved. |
| 4 | Create three more synthetic tasks: `Call supplier`, `Buy printer ink`, and `Review family budget`. Use distinct Areas, status, tags, and priorities. Search for `supplier`, then change the view to Waiting, Completed, and Archived. | Search matches task title, notes, project, tags, Area, dependency, and location. Saved views show only their expected items. |
| 5 | Archive `Call supplier`, inspect it in Archived view, then select Restore. | The task disappears from active results when archived and returns when restored. |
| 6 | Set `Review family budget` to Weekly. Mark it complete. | The original task becomes completed and a new local uncompleted recurring instance is created; no streak/failure message appears. |
| 7 | Open Privacy and select **Export local data**. Choose a folder/name in the Android file picker. | A user-selected JSON file is created containing Areas and tasks. No upload occurs. Do not share the export file unless you intend to share the synthetic test data within it. |
| 8 | Open Settings and select **Enable reminders**. On Android 13+, accept the Android notification permission only for this test. Create a task with a due date formatted `YYYY-MM-DD HH:MM` a few minutes ahead, choose **At due time**, and save it. | The permission request occurs only from the explicit settings action. The task is saved whether permission is accepted or declined. If accepted and the scheduled time is between 08:00 and 20:59 local device time, a generic notification may appear. The notification contains no task title or note. |
| 9 | Repeat Step 8 but decline Android notification permission. | The app remains fully usable. It shows an in-app notice that reminders are off; tasks and plans still work. |
| 10 | Enable airplane mode. Create/edit/complete/archive a task, restart the app, and use search. | All local workflow operations continue to work. No network recovery is needed. |

## Reminder constraints

Notifications are **best effort** in this preview. A reminder needs an explicit task reminder choice, the date format shown above, and Android notification permission where applicable. Reminders scheduled overnight are suppressed by the worker’s 08:00–20:59 local-time guard. No task titles, notes, or private labels are put into notification content. Time-zone changes, reboot rescheduling, repeat-instance reminder propagation, channels, quiet-hour configuration, and robust failure/retry telemetry remain future work.

## Deliberately unavailable cloud features

The Settings screen shows **Back up and sync beta** as disabled. There is no Firebase credential, account prompt, API call, sync job, or remote storage path in this APK. This protects the local workspace until server-side identity, object authorization, idempotent outbox handling, conflicts, privacy export/deletion, observability, and staging tests are complete.

## Report issues

Include device model, Android version, Project Polaris `0.3.0`, whether notification permission was granted/denied, local device time, network state, sanitized reproduction steps, expected/actual behavior, and a screenshot without real/private task data. Treat data loss, unrequested notification permission, an unexpected network transfer, task mutation without an action, or notification exposure of task content as a P0 defect.
