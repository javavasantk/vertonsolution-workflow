# Project Polaris 0.2.0 — Task Filters Phone Test

## Scope

This Android debug preview adds a complete **local task-creation and editing form** for general work, home, personal, project, and organizational workflows. The required field remains the task title. All other fields are optional and available under **More options**, so quick capture remains fast.

> The selected options are saved only on the installed device. Recurrence and reminder values are preferences in this preview: they do not yet create background jobs, notifications, shared workspaces, or cloud data. Do not use the preview for confidential or production data.

## Filters and expected behavior

| Filter | Entry control | Saved behavior in this preview |
|---|---|---|
| Task title | Required text input | A task cannot be saved without a title. The original title is preserved. |
| Area | Optional chips using saved Areas | Groups a task under Work, Home, Personal, or another user-created Area. |
| Priority | Low, Normal, High, Urgent, or None | Displayed on the Inbox/Today card. |
| Status | Inbox, Next, In progress, Waiting, Completed | Saved with the task. Completed also marks the task complete. |
| Task type | Action, Call, Email, Errand, Meeting, Habit, Decision, Review, Other | Displayed in the task summary. |
| Project or list | Optional text input | Saves an additional grouping label. |
| Due date | Optional text input | Stores the user-entered date/time label; no calendar calculation is performed yet. |
| Estimated effort | Not set, 5 min, 15 min, 30 min, 1 hour, 2+ hours | Saved locally for later planning. |
| Energy level | Not set, Low energy, Normal energy, Deep focus | Saved locally for later task views. |
| Tags | Comma-separated text input | Saved locally and displayed on the task card. |
| Repeat | None, Daily, Weekdays, Weekly, Monthly | Saves task preference only; it does not generate future tasks yet. |
| Reminder | None, due time, or advance reminder choices | Saves task preference only; no notification is sent. |
| Waiting on | Optional person/dependency field | Saves a waiting/dependency note only. |
| Location | Optional text input | Saves a place label; location services are not requested or used. |
| Privacy | Private, Personal, Shared later | Saves a local classification label; nothing is shared. |
| Notes | Optional multiline text | Saves locally and is editable. |
| Checklist | Comma-separated next steps | Saves a local list of steps for future task-detail work. |

## Install/update

The APK package is `com.projectpolaris.app`, version `0.2.0` (`versionCode 2`), and supports Android 8.0 or later. Download the attached APK to the phone, open it from **Files** or **Downloads**, and select **Install**. If Android asks, allow that specific trusted app to install this test APK. An earlier `0.1.0` Project Polaris test build can be updated directly because this APK is signed with the same debug certificate and has a higher version code.

## End-to-end test script

Use synthetic data, for example `Prepare client demo`, `Call insurance provider`, `Buy printer ink`, and `Plan family trip`. Do not enter passwords, real customer data, financial account data, health information, or private organizational information.

| Step | Action | Expected result |
|---|---|---|
| 1 | Open **Settings**, add Areas called `Work`, `Home`, and `Personal`. | Areas are stored on the device. |
| 2 | Go to **Inbox**, select **Add task**, enter `Prepare client demo`, select Work and High priority, then save without opening More options. | A task is created quickly; Area, type, and priority are visible on its card. |
| 3 | Select **Edit task** for that item and open **More options**. | All optional filters listed above are available in a scrollable form. |
| 4 | Set Project to `Website launch`; Status to In progress; Type to Meeting; Due date to `Friday 3 PM`; Effort to `1 hour`; Energy to `Deep focus`; Tags to `client, demo`; Repeat to Weekly; Reminder to `1 hour before`; Waiting on to `Design review`; Location to `Office`; Privacy to Personal; Notes and a two-item checklist. Save changes. | The edit dialog closes. The task card shows type, priority, due-date label, and tags. Other fields are retained locally. The reminder disclosure accurately says that no notification is sent. |
| 5 | Close the app from Android recent apps, reopen it, and return to Inbox. Then select **Edit task** again. | Every selected filter and entered value remains available. |
| 6 | Plan the task for Today, start a Focus session, then end it manually. | Planning and Focus remain explicit user actions. Focus does not complete or alter the task. |
| 7 | Enable airplane mode. Create a second task with multiple filters, close the app, reopen it, and inspect it. | The task and its filters remain saved without a network connection. |
| 8 | Set the first task status to Completed, then return to Inbox. | The task displays as completed. Reopen it, change status back to Next, and save. |
| 9 | Change app language preference and dark theme from Settings. | Preferences persist. In this preview, interface text remains English; full localized resources are not yet shipped. |

## Expected restrictions

Do not mark the following as tested or available in version 0.2.0: actual notification delivery, automatic recurrence generation, date validation/time-zone calculation, account backup or sync, multi-person assignment, shared workspaces, live AI, file attachments, cloud export/deletion, or actual translated/RTL screens. The app does not request notification, location, contact, calendar, storage, or account permissions for these task filters.

## Issue report

For a defect, record device model, Android version, app version, selected language, theme, network state, test task using synthetic data, selected filters, expected result, actual result, and a sanitized screenshot. Report data loss, a task changed without confirmation, unrequested permission, or a privacy disclosure that does not match behavior as P0.
