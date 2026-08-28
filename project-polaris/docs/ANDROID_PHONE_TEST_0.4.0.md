# Project Polaris 0.4.0 — Categories and Calendar Phone Test

## Purpose

Version 0.4.0 adds a proper local due-date and time selection flow, a searchable activity-category list for day-to-day work, and offline task calendar views. The app remains a **device-only preview**. Use synthetic test data.

## Install

Install `ProjectPolaris-categories-calendar-preview-0.4.0.apk` on Android 8.0 or later. It updates the previous preview because it keeps the same application ID and debug signing certificate with a higher version code.

## Category test

Open **Inbox** and select **Add task**. Select **More options**, then choose **Activity category**. Confirm that the searchable list includes common work and everyday activities, including Task, Appointment, Meeting, Call, Email, Follow-up, Errand, Shopping, Delivery, Household, Cleaning, Maintenance, Health, Medication, Exercise, Meal, Finance, Bill or payment, Work, Project, Deadline, Travel, Family, Social, Education, Habit, Decision, Review, and Other.

Create these synthetic tasks using distinct categories:

| Title | Category | Due moment |
|---|---|---|
| `Dentist check-in` | Appointment | Tomorrow, 09:30 |
| `Team stand-up` | Meeting | Tomorrow, 10:00 |
| `Call mobile provider` | Call | Tomorrow, 14:00 |
| `Buy printer paper` | Shopping | Two days from now, 11:00 |
| `Pay electricity bill` | Bill or payment | This month, 16:30 |

Open each task’s **Task details** view and verify that the selected activity category and due moment are present. Edit `Call mobile provider`, change the category to Follow-up and the due time, then close and reopen the app. The revised values should persist.

## Date and time test

The **Choose date and time** action must open Android’s native date selector followed by the native time selector. Select a date and time; the app saves it in the stable local format `YYYY-MM-DD HH:MM`. Select **Clear date and time**, save, reopen the task, and confirm that no due date remains.

If you choose an optional reminder, the selected due date/time is also the basis for its local best-effort schedule. Reminder permission must still be requested only from **Settings → Enable reminders**.

## Calendar test

Open **Calendar** from the bottom navigation. Test each view:

| View | Expected behavior |
|---|---|
| **Day** | Displays every active task due on the selected day, sorted by selected time. Use Previous/Next to move by one day. |
| **Week** | Displays each day in the Monday-to-Sunday week containing the selected date. Use Previous/Next to move by one week. |
| **Month** | Displays each date in the selected month and any active due tasks. Use Previous/Next to move by one month. |

Select a calendar task to open its Task details. Archive a due task and confirm it disappears from Calendar. Restore it from Inbox → Archived and confirm it returns to the appropriate calendar date. Create and complete a weekly recurring task; the next local instance is created after completion, but its due date does not advance automatically in this preview.

## Current preview limits

The calendar is an accessible date-grouped list rather than a drag-and-drop grid. It uses the current device locale for Android-native date/time selectors, but full translated app resources, RTL validation, time-zone migration, system calendar integration, shared team calendars, and cloud sync remain out of scope. Use the calendar only to inspect local due-task data. No task data leaves the phone.

## Report a defect

For a defect report, include the app version, Android version, local time zone, selected category, sanitized due date/time, selected Calendar view, steps to reproduce, expected result, actual result, and a screenshot that excludes sensitive real content. Treat loss of a saved task or a due task appearing on the wrong local date as high severity.
