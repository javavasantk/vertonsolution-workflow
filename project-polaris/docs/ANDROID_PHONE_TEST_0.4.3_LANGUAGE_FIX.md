# DayTodo 0.4.3 — Language Selection Fix Phone Test

## Scope

This build fixes repeated language selection in the **DayTodo** local preview. A language choice is stored with the local workspace before Android applies the per-app locale, so activity recreation must not remove tasks, Areas, plans, checklist state, or settings.

> The preview declares 14 app locales. Only the default English resource set is currently approved and bundled. Selecting another locale now changes the saved Android app-language state and can be changed again; visible translated interface copy requires the separate localization implementation and linguistic approval process.

## Before testing

Install `DayTodo-local-preview-0.4.3.apk` over the existing DayTodo preview. Use synthetic tasks only. Do not clear DayTodo app storage between the persistence steps below.

## Required test sequence

| Step | Action | Expected result |
|---|---|---|
| 1 | Open DayTodo and create a task called `Language test task`. Optionally add an Area and a due date. | The task is visible in Inbox and persists after closing/reopening the app. |
| 2 | Open **Settings** and choose **App language**. Select Hindi, Tamil, Arabic, Spanish, or another listed option. | The chooser closes and the activity may briefly restart. The selected language name is shown in Settings after restart. The test task remains. |
| 3 | Return to **Settings → App language** and select a different listed language. | The second selection also applies; it is not blocked by the first selection. The task remains unchanged. |
| 4 | Choose English, then close DayTodo completely and reopen it. | English remains selected and `Language test task` is still present. |
| 5 | On Android 13+, open Android Settings → Apps → DayTodo → Language. Select another declared language, return to DayTodo, then open Settings. | DayTodo adopts the Android per-app choice and shows the same selected language name in Settings. |
| 6 | While a task has a date/time and reminder preference, repeat steps 2–4. | Task details, date/time, reminder preference, Area, and checklist state remain. |

## Pass criteria

The build passes this fix test only when a user can select at least three different languages in sequence, restart the app after each relevant step, and retain all locally stored task data. If the selection reverts, the chooser does not close, a crash occurs, or any local task is lost, record the chosen language tags, Android version, phone model, and exact steps. Do not include task titles, notes, or exported task data in a public issue.

## Known limitation

This release fixes **language-state selection and persistence**, not translated user-interface copy. Do not use this test build as evidence that Hindi, Tamil, Arabic, Urdu, Japanese, Chinese, or any other localized interface is release-ready.
