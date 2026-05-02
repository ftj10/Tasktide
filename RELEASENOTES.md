# Release Notes

## Version 1.19.2
Version: 1.19.2
Update Date: 2026-05-02

Title: Version 1.19.2 – Update Released (2026-05-02)

### What’s New
- Added: A cleaner update-readiness check so TaskTide can be verified more confidently before new planner improvements are released.

### Improvements
- Improved: Help Center now gives beginners a clearer start-to-finish path for planning today, organizing the week, scanning the month, and finishing work.
- Improved: Maintenance checks are now easier to run without unrelated warnings getting in the way.

### Fixes
- Fixed: Frontend lint warnings and errors that could make future quality issues harder to spot.

## Version 1.19.1
Version: 1.19.1
Update Date: 2026-05-01

Title: Version 1.19.1 – Update Released (2026-05-01)

### What’s New
- Added: A clearer Install app entry point so users can find the web-app download guidance from the main planner.
- Added: New first-time coach marks that point users to Help Center and the Install app guide.

### Improvements
- Improved: Help Center now gives a fuller start-to-finish workflow for planning, managing, completing, and getting support in TaskTide.
- Improved: Signed-in sessions now check that browser requests come from a trusted TaskTide page before accepting changes.

### Fixes
- Fixed: Planner changes are now protected from untrusted web pages trying to use an active TaskTide session.

## Version 1.19.0
Version: 1.19.0
Update Date: 2026-04-30

### New Features
- Added offline task access for signed-in browsers and installed TaskTide web apps after tasks have been cached online.
- Added queued offline task creation, editing, completion, and deletion that sync when the API is reachable again.

### Improvements
- Improved installed web-app startup by caching the TaskTide app shell through the service worker.
- Updated Help Center guidance so users understand how offline task access works and when sync happens.
- Updated README setup notes with the local-storage cache and service-worker sync behavior for offline task edits.

### Bug Fixes
- Fixed failed task API saves so offline task edits are no longer immediately discarded from the planner view.

## Version 1.18.4
Version: 1.18.4
Update Date: 2026-04-30

Title: Version 1.18.4 – Update Released (2026-04-30)

### What’s New
- Added: A first-time coach mark that points users to the Install app guide.
- Added: A visible Install app entry point for users who want to add TaskTide to their device.

### Improvements
- Improved: Users can now find web-app download guidance without searching through Help Center first.

### Fixes
- Fixed: New users are less likely to miss the installed web-app option during setup.

## Version 1.18.3
Version: 1.18.3
Update Date: 2026-04-30

Title: Version 1.18.3 – Update Released (2026-04-30)

### What’s New
- Added: A first-time coach mark that points users to Help Center.

### Improvements
- Improved: New users can find walkthroughs, common answers, and support earlier in the onboarding flow.

### Fixes
- Fixed: Users are less likely to miss where most TaskTide features are introduced.

## Version 1.18.1
Version: 1.18.1
Update Date: 2026-04-30

### New Features
- Added automatic cross-site session cookie handling for hosted frontend and backend deployments on different hostnames.

### Improvements
- Updated deployment guidance so teams can rely on the backend default for secure cross-host login cookies and only override it when needed.
- Improved Help Center sign-in guidance to explain that hosted web sessions should remain active after login.

### Bug Fixes
- Fixed hosted web login sessions so users are no longer immediately returned to the login page after signing in from a separate frontend origin.

## Version 1.18.0
Version: 1.18.0
Update Date: 2026-04-30

### New Features
- Added a first-time coach mark that points users to the TaskTide language switch before the rest of the onboarding tour.

### Improvements
- Improved onboarding target detection so coach marks attach to the visible desktop or mobile control.
- Updated Help Center guidance to explain that users can switch language from the login page or inside TaskTide.
- Updated README onboarding documentation to describe the new four-step first-run tour.

### Bug Fixes
- Fixed the first-run tour so responsive duplicate targets do not attach to hidden controls.

## Version 1.17.0
Version: 1.17.0
Update Date: 2026-04-30

### New Features
- Added TaskTide as the project and web-app name across the application shell, login screen, install metadata, notifications, and package metadata.

### Improvements
- Updated Help Center install and notification guidance so users see TaskTide as the app name in setup instructions.
- Updated README setup notes and project metadata to reflect the TaskTide brand and identifier changes.
- Updated backup, session cookie, local browser profile, onboarding, and notification identifiers to use TaskTide naming.

### Bug Fixes
- Fixed remaining legacy brand labels in user-facing and developer-facing surfaces.

## Version 1.16.0
Version: 1.16.0
Update Date: 2026-04-30

### New Features
- Added HttpOnly cookie-based login sessions so the browser now keeps the JWT out of JavaScript-managed local storage.
- Added a session restore endpoint so returning users can reopen the planner in the same browser without re-reading auth state from frontend storage.

### Improvements
- Improved frontend authentication requests by switching protected API calls to browser credential mode.
- Updated local development setup to use the Vite `/api` proxy so cookie-backed auth works during frontend development.
- Updated Help Center and repository setup guidance so sign-in behavior and deployment requirements are easier to follow.

### Bug Fixes
- Fixed the auth bootstrap path so protected planner data no longer depends on a readable browser token.

## Version 1.15.1
Update Date: 2026-04-29

### Bug Fixes
- Fixed Month navigation so the page now opens on the month that matches the selected `?date=` route.
- Fixed Month day-cell routing so clicking a visible day number no longer jumps to the same number from the previous month grid.

## Version 1.15.0
Update Date: 2026-04-29

### New Features
- Added a first-run onboarding tooltip flow that highlights task creation, the Today task area, and the Week planner.
- Added `Quick Walkthroughs` in the Help Center with short modal guides for adding tasks, finding saved tasks, opening Week, and using drag-to-add.

### Improvements
- Improved feature discovery with direct `Help Center` entry points from the Week page into the drag-to-add walkthrough.
- Updated in-app help content and repository documentation so activation guidance now matches the shipped onboarding flow.

## Version 1.14.3
Update Date: 2026-04-29

### Improvements
- Updated all release notes to use a consistent product-announcement structure with categorized sections.
- Improved the in-app Updates center so each release now appears under clear `New Features`, `Improvements`, and `Bug Fixes` headings.
- Updated repository documentation so the public release history and in-app release notes stay aligned.

## Version 1.14.2
Update Date: 2026-04-29

### New Features
- Added a Help Center recovery message for notification failures caused by VAPID key changes or stale subscriptions.

### Improvements
- Updated the recovery guidance so users know to clear old subscriptions before resubscribing.
- Updated the instructions so each browser and installed mobile web app is re-enabled with a fresh notification subscription.

## Version 1.14.1
Update Date: 2026-04-29

### Improvements
- Updated Today reschedule messaging so the selected-day behavior is easier to understand in the app.

### Bug Fixes
- Fixed Today so moving a one-time task to `Tomorrow` from a viewed future date no longer skips an extra day.
- Fixed one-time task date ranges so they stay aligned when rescheduled from the Today page.

## Version 1.14.0
Update Date: 2026-04-28

### New Features
- Added background Web Push notifications for daily prompts and upcoming timed tasks on supported desktop browsers.
- Added installable mobile web-app notification support through the service worker subscription flow.

### Improvements
- Improved notification coverage by keeping an in-page fallback for browsers without background Web Push support.

## Version 1.13.1
Update Date: 2026-04-28

### Improvements
- Updated older public ICS release wording so it no longer conflicts with current multi-day support.

### Bug Fixes
- Fixed mobile Week drag-to-create so cross-day selections now preserve the selected task end date.

## Version 1.13.0
Update Date: 2026-04-28

### New Features
- Added multi-day task support across Today, Week, Month, and ICS import flows.
- Added one-time task end-date support so a single task can span multiple planner days.
- Added ICS import handling for multi-day all-day events instead of skipping them.

## Version 1.12.1
Update Date: 2026-04-28

### Improvements
- Improved ICS import feedback so skipped unsupported calendar entries are reported more clearly.
- Updated public release messaging around early ICS import behavior.

## Version 1.12.0
Update Date: 2026-04-28

### New Features
- Added `.ics` calendar import to Today so exported events can become planner tasks in one step.

### Improvements
- Improved imported task fidelity by keeping titles, notes, locations, all-day dates, same-day times, and supported repeat rules.
- Updated import results so skipped unsupported entries are reported after each file.

## Version 1.11.2
Update Date: 2026-04-27

### New Features
- Added a recurring-task delete choice so Today and Week can remove one occurrence or an entire series from the shared task editor.

### Improvements
- Updated task editor wording so edit submissions use `Save` instead of looking like task completion.

### Bug Fixes
- Fixed one-time task completion handling so completed tasks leave active planner views consistently.

## Version 1.11.1
Update Date: 2026-04-27

### Improvements
- Improved recurring-task edit stability for single-day changes in the planner.
- Improved the Week calendar event renderer for a more reliable production build.

## Version 1.11.0
Update Date: 2026-04-27

### New Features
- Added a compact Today productivity summary with a one-click `View Stats and Visualization` action.

### Improvements
- Improved Today page focus by folding the full productivity section by default.
- Updated insights access so selected-day, 7-day, 30-day, and 7-day chart views remain available on demand.

## Version 1.10.1
Update Date: 2026-04-27

### Improvements
- Improved Today analytics by replacing the old completed-history block with a clearer 7-day productivity chart.
- Improved scanability while keeping selected-day, 7-day, and 30-day completion summaries visible.
- Updated the Week header to remove extra hint labels for a cleaner calendar view.
- Updated the Updates center so release notes focus on product changes instead of internal implementation details.

## Version 1.10.0
Update Date: 2026-04-27

### New Features
- Added admin review mode in the Help Center so admins can review and remove submitted questions.
- Added Today productivity summaries for the selected day, the last 7 days, and the last 30 days.

### Improvements
- Improved Week performance by generating repeating events only for the visible date range.
- Updated completion retention so finished task data stays available for 30 days before automatic cleanup.

### Bug Fixes
- Fixed completed-task handling so finished tasks leave active Today, Week, Month, and reminder flows immediately.

## Version 1.9.2
Update Date: 2026-04-27

### Improvements
- Improved help-question persistence so each submission saves as its own post instead of overwriting older content.

### Bug Fixes
- Fixed failed help-question submissions so the draft remains visible and an error message is shown.
- Fixed Week calendar timing for one-day repeating-task overrides.

## Version 1.9.1
Update Date: 2026-04-27

### Improvements
- Improved mobile task editing focus by hiding the bottom navigation while add-task and edit-task dialogs are open.
- Updated dialog-close behavior so mobile navigation returns automatically after the task window closes.

## Version 1.9.0
Update Date: 2026-04-26

### New Features
- Added press-hold time-range task creation to the mobile Week page.
- Added a refreshed Month card grid with `Jump to Current Month`.

### Improvements
- Updated Week to open in Time Grid by default.
- Updated the mobile Week layout by replacing the global `Add Task` button with direct calendar range creation.
- Improved mobile navigation layering so bottom-nav taps stay reliable above planner content.

## Version 1.8.0
Update Date: 2026-04-26

### Improvements
- Improved browser notification permissions so prompts appear only after user interaction.
- Improved reminder scheduling reliability by tolerating timer drift more consistently.
- Updated notification retention so older history clears automatically after three days.

## Version 1.7.2
Update Date: 2026-04-25

### Bug Fixes
- Fixed repeat selector spacing so the `Repeat` label no longer clips below the dialog header.

## Version 1.7.1
Update Date: 2026-04-25

### Improvements
- Improved the repeat-options dialog size so it matches the main task editor on desktop.
- Updated the repeat-options dialog to open full-screen on phones.

## Version 1.7.0
Update Date: 2026-04-25

### New Features
- Added daily, weekly, monthly, and yearly repeat rules.
- Added repeating-task edit choices for one occurrence or the full series.

### Improvements
- Updated the task creation flow to use a begin-date and repeat-options model.
- Improved backward compatibility so older task data continues to work with the new recurrence system.

## Version 1.6.1
Update Date: 2026-04-25

### Bug Fixes
- Fixed mobile Week swipe handling so a single swipe moves only one page at a time.

## Version 1.6.0
Update Date: 2026-04-25

### New Features
- Added a horizontal mobile Week layout that shows four days first and then the remaining three days.
- Added an `EN` / `中文` language switch to the login and registration screen.

## Version 1.5.1
Update Date: 2026-04-24

### Improvements
- Improved save idempotency so repeated task, reminder, and help-question submissions no longer create duplicates.

### Bug Fixes
- Fixed failed task and reminder saves so persisted data reloads instead of leaving unsynced local state on screen.

## Version 1.5.0
Update Date: 2026-04-22

### New Features
- Added a responsive app shell with a desktop sidebar and mobile bottom navigation.

### Improvements
- Updated task and reminder dialogs to open full-screen on phones and as centered modals on larger screens.

## Version 1.4.0
Update Date: 2026-04-20

### New Features
- Added the Help Center with usage steps, FAQ content, and a shared question board.
- Added Week-to-Today date jumps and blank-slot date prefilling for new tasks.

## Version 1.3.1
Update Date: 2026-04-20

### Improvements
- Updated the Month view past-day marker to use a red check mark.

## Version 1.3.0
Update Date: 2026-04-20

### New Features
- Added end-time validation for task editing.
- Added the in-app Updates popup and release history drawer.

### Improvements
- Improved translations across Today, Week, Month, and Reminder flows.
- Improved overlapping task layout in the Week time grid.

### Bug Fixes
- Fixed timed tasks without an end time so they no longer spill into the next day.
