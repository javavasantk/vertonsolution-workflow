# Project Polaris 0.1.0 — Android Phone Test Guide

## Purpose and scope

This package is a **debug-signed, local-only preview** for Android 8.0 (API 26) or newer. It lets you test the Project Polaris learner interface and the local-first flows implemented in this milestone. It is not a Google Play release, and it must not be used with sensitive learner data.

> The app stores tasks and courses only on the installed phone. It does not connect to an AI provider, account service, cloud database, backup/sync service, notification scheduler, analytics service, or export/deletion service.

| Available in this APK | Deliberately unavailable in this APK |
|---|---|
| Guest onboarding, language-choice persistence, dark theme, local courses and tasks, manual Today planning, completion, course assignment, local Focus timer, privacy screen, and local assistant-draft preview. | Real translated interface resources, Android per-app language synchronization, task deadlines/subtasks, reminders/notifications, sign-in, Firebase, backup/sync, cloud export/deletion, real AI/provider calls, analytics, or Play Store distribution. |

## APK identity

| Field | Value |
|---|---|
| Package name | `com.projectpolaris.app` |
| Version | `0.1.0` (`versionCode 1`) |
| Minimum Android version | Android 8.0 / API 26 |
| Target Android version | Android 15 / API 35 |
| Package type | Debug APK, signed with the local Android debug certificate |
| SHA-256 | `0d17644aed2223ea3620636331153d91b1e74fa2c96e63e0c3bbbb0674ef67b8` |

## Install on your Android phone

First, download the supplied `.apk` attachment to your phone. Android may show a warning because this is a direct debug build rather than an app installed through Google Play. This is expected for the test package.

Open the downloaded APK in the **Files** or **Downloads** app. If Android requests permission, allow that specific app to install unknown apps for this test. Do not enable this permission for apps you do not trust. Then select **Install** and open Project Polaris.

If installation fails because another `com.projectpolaris.app` build already exists with a different signing certificate, uninstall that earlier test build first and retry. This will remove that earlier build’s local test data. If you do not want to lose your current test tasks, do not uninstall until an export feature is implemented.

## Core local test script

Use synthetic test content only, for example `Review sample chapter`, `BIO-101`, or `Read the practice prompt`. Do not enter real student names, graded assignments, private notes, or account information.

| Step | Test action | Expected result |
|---|---|---|
| 1 | Open the app, choose a language, and select **Continue** or **Skip for now**. | Onboarding completes without requesting sign-in or permission. The selected language name is saved. Interface copy remains English in this local preview. |
| 2 | Open **Settings**, add course `BIO-101`, then return to **Inbox**. | Course appears in Settings and can be selected while adding or assigning a task. |
| 3 | In Inbox, select **Add task**, enter `Review sample chapter`, optionally select `BIO-101`, and save. | Task appears immediately and is stored on the device. |
| 4 | Tap **Plan for today**, then open **Today** and **Plan**. | The task appears in Today and in the planned section. No other task is moved automatically. |
| 5 | Tap **Start Focus**, select your task, and start a 10- or 25-minute local Focus session. | The timer appears. Ending it leaves the underlying task unchanged. |
| 6 | Open **Polaris suggestions**, choose a task, review the three local preview steps, then select **Add the first step to Inbox** or **Keep task unchanged**. | The preview does not call a service. The add action creates a new local task only after you select it. |
| 7 | In Inbox, mark a task complete, assign or remove a course, then remove a task and confirm. | Each selected action changes only local data and shows a confirmation message. |
| 8 | Turn on dark theme in **Settings**, then close and reopen the app. | Theme preference and locally saved tasks/courses remain. |
| 9 | Enable airplane mode, add/edit/complete a synthetic task, force-close the app, and reopen it. | Local task changes remain because the preview has no network dependency. |
| 10 | Open **Privacy** and select Export/Delete. | The app truthfully states that cloud export/deletion is not connected. You can remove individual local tasks from Inbox. |

## Optional physical-device checks

Set Android system text size to its largest setting and repeat the test script. Enable dark mode, rotate the phone, and test the visible button labels. For Arabic or Urdu selection, the selector displays the native script; full RTL layout and translated app copy are **not yet implemented** and therefore must be recorded as a known limitation, not a pass.

If you use TalkBack, verify that task completion controls, buttons, navigation labels, and dialogs are announced. Record any control with unclear focus order or an incomplete label. This preview has basic Compose semantics only; it has not passed a complete accessibility certification.

## How to report a test issue

For every issue, record the device model, Android version, app version, selected language, theme, font-size setting, network state, exact synthetic steps, expected behavior, actual behavior, and a screenshot that contains no private task content. Do not include real task titles, course names, personal data, tokens, or device account identifiers.

Classify data loss, unexpected task deletion, unintentional content sharing, a misleading AI claim, or inaccessible core action as **P0**. Do not continue broad testing after a P0 finding; retain the APK/build identifier, remove sensitive data from any evidence, and report the issue to the release owner.

## Verification status

The APK was built in the development environment with Android lint and the available Kotlin/core test task. The environment has no hardware virtualization support, so no Android emulator installation or automated device-level UI test was run. The next required gate is a physical-device test using this guide, followed by an instrumented emulator/device test suite and the secure staging implementation before any internal or public distribution.
