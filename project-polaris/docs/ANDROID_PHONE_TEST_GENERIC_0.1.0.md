# Project Polaris 0.1.0 — Generic Phone Preview

## What this APK is

This is a **debug-signed, device-only Android preview** of Project Polaris. It is a general-purpose task and workflow workspace for activities such as personal errands, household routines, work projects, side projects, appointments, and planning. It is not limited to academic work.

The preview works without a network connection. It stores its small local workspace in the Android app’s private preferences on the installed device. It is intended for synthetic test data only and is not a production release.

| Available in this preview | Not available in this preview |
|---|---|
| Onboarding without sign-in; language-choice selection; dark theme; tasks; optional workflow Areas; manual Today plan; completion; removal; local Focus timer; privacy transparency; local Polaris step-preview. | Real UI translations or RTL mirror layouts; Android system-language synchronization; due dates; subtasks; calendar integration; notifications; sign-in; backup/sync; team collaboration; real AI; analytics; export/download; account deletion; or Google Play distribution. |

## APK details

| Property | Value |
|---|---|
| Application ID | `com.projectpolaris.app` |
| Version | `0.1.0` (`versionCode 1`) |
| Minimum device version | Android 8.0 / API 26 |
| Target device version | Android 15 / API 35 |
| Signing | Android debug certificate; not suitable for public distribution |
| SHA-256 | `a1cd4cbead1eb709d531eb6defd9dd1228f74705d44f468e253b8ced0ad19939` |

## Install on a physical Android phone

Download the supplied APK to the phone. Open it from **Files** or **Downloads**, then select **Install**. Android may ask you to allow that specific app—for example Files or Chrome—to install this test build. That is normal for a directly shared debug APK. Do not grant this permission to untrusted apps.

If the phone already has a different-signed build with the same package name, uninstall that earlier test build before installing. Uninstalling removes its device-only preview workspace, so only do this when you are comfortable losing its synthetic test data.

## Generic workflow test script

Use invented, non-sensitive information. Good examples include `Plan a weekend trip`, `Renew car insurance`, `Prepare client demo`, `Buy groceries`, `Home`, `Work`, and `Personal`. Do not enter personal data, private work information, customer information, credentials, or real confidential tasks.

| Step | Action | Expected result |
|---|---|---|
| 1 | Start the app, choose any listed language, then select **Continue** or **Skip for now**. | The app opens without account creation, consent, or runtime permission requests. The selected language name persists; interface copy remains English in this preview. |
| 2 | Open **Settings** and add Areas named `Work`, `Home`, and `Personal`. | Each Area is saved on the device and becomes selectable when creating or editing a task. |
| 3 | Open **Inbox**, choose **Add task**, create `Prepare client demo`, and assign it to `Work`. | The new task appears immediately in Inbox with its optional Area label. |
| 4 | Add two more tasks, then mark one complete and assign or remove an Area on another. | The selected task state changes only. User-written task titles are kept exactly as entered. |
| 5 | Select **Plan for today** for one task. Open **Today** and **Plan**. | The task appears in the Today list and the planned section. Project Polaris does not automatically move any task. |
| 6 | Select **Start Focus** for a task, then start 10 or 25 minutes. | The local countdown appears. End Focus at any time; the task is not marked complete automatically. |
| 7 | Open **Polaris preview**, select a task, review the local three-step preview, and choose either **Add first step to Inbox** or **Keep task unchanged**. | No network call occurs. The add action creates a separate local task only after you select it. |
| 8 | Turn on dark theme. Close the app completely, reopen it, and return to Inbox. | The theme, task list, Areas, plan state, and active timer state remain on the same device. |
| 9 | Enable airplane mode, create/complete/plan a task, force-close the app, and reopen it. | The local task state remains usable because no core preview flow depends on the network. |
| 10 | Open **Privacy**, then select Export or Delete. | The screen accurately says that cloud export and cloud deletion are not available in this device-only preview. Individual local tasks can be removed from Inbox. |

## Visual and accessibility checks

Test the preview in light and dark theme, rotate the device, and raise Android text size to its largest setting. Ensure the text you need is still readable and that important controls are not obscured. The selected language list intentionally shows each language in its own script. Full translated interface strings and RTL layout are future localization milestones; do not mark those as passed in this build.

If TalkBack is available, move through navigation, task checkboxes, filter chips, dialogs, and Focus controls. Record navigation or control labels that are unclear, missing, or hard to reach. The preview has basic Compose semantics but has not passed formal accessibility certification.

## Report an issue

Use this test record for each issue: device model; Android version; app version; selected language; theme; font-scale setting; network state; synthetic steps; expected behavior; actual behavior; and a sanitized screenshot. Do not include live tasks, personal details, passwords, account identifiers, or private organizational information.

Treat unexpected data loss, an action taken without your confirmation, misleading claims about AI/cloud handling, or an inaccessible core action as **P0**. Stop broad testing of that build, preserve only sanitized evidence, and report it to the release owner.

## Verification status

The generic preview was built successfully using Android SDK Platform 35, Build Tools 35.0.0, Java 17, and Gradle 8.10.2. Android lint, debug compilation, and the available assistant-core test task completed successfully. No emulator test ran because this environment does not expose hardware virtualization. The supplied APK is therefore intended for physical-device UI testing before a secure staging or production release.
