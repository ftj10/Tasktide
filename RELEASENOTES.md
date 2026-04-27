# Release Notes

## v1.9.0 - 2026-04-26

- Changed Week to open in Time Grid by default on desktop and mobile.
- Removed the global `Add Task` button from the mobile Week page.
- Added press-hold time-range selection in the mobile Week time grid so task creation starts from the selected context.
- Prefilled new Week mobile tasks with the selected date, start time, and end time from the pressed range.
- Reduced Month view to the task grid only by removing its extra header controls while keeping vertical swipe navigation directly on the grid.
- Added a `Jump to Current Month` button back to Month view without restoring the removed header shell.
- Refreshed MonthPage UI with the new card-based calendar styling while keeping desktop arrows and mobile swipe behavior separate.
- Kept Month day cells focused on task previews instead of extra task-count labels.
- Raised the mobile bottom navigation above overlapping planner content so nav taps win over the Week grid underneath.
- Expanded README and in-app Help content to document the simplified Month layout.
- Added frontend regression coverage for the refreshed Month layout, split desktop/mobile month navigation, restored Month jump button, and stronger mobile bottom-navigation layering alongside the existing Week behavior changes.

## v1.8.0 - 2026-04-26

- Replaced per-notification `localStorage` keys with one retained `notification-history` record.
- Changed daily and task reminder checks to use crossed-time windows so timer drift does not skip notifications at `10:00`, `21:00`, or the 15-minute task reminder mark.
- Changed browser notification permission requests to wait for user interaction instead of firing automatically on load.
- Added automatic cleanup for daily and task notification markers older than three days without rewriting storage on every history read.
- Added frontend regression coverage for notification-history pruning, interaction-driven permission requests, and drift-tolerant reminder delivery.

## v1.7.2 - 2026-04-25

- Adjusted the repeat-options selector spacing so its `Repeat` label clears the dialog header and no longer clips.
- Added frontend regression coverage for the repeat dialog label rendering.

## v1.7.1 - 2026-04-25

- Changed the repeat-options window to use the same dialog width as the main task editor.
- Changed the mobile repeat-options window to open full-screen like the main task editor.
- Added frontend regression coverage for the mobile full-screen repeat dialog.

## v1.7.0 - 2026-04-25

- Replaced the task type selector with a recurrence flow built around a begin date and a dedicated repeat-options window.
- Added daily, weekly, monthly, and yearly repeat rules with interval, day-selection, and end-date controls.
- Added recurring-task edit scope choices so changes can apply to one occurrence or the entire series without overwriting old data.
- Kept legacy task datasets renderable by normalizing older `TEMPORARY` and `PERMANENT` records at load time.
- Added frontend and backend regression coverage for recurrence rendering, single-day overrides, and the new task payload shape.

## v1.6.1 - 2026-04-25

- Changed mobile Week swipe handling to wait for the gesture to settle before deciding the next page.
- Prevented a single mobile swipe from skipping across multiple week pages.
- Added frontend regression coverage for one-swipe single-step paging.
- Expanded README and in-app release notes to document the stabilized mobile paging behavior.

## v1.6.0 - 2026-04-25

- Changed mobile Week view from a single 7-day layout to a horizontal paged swipe flow.
- Added a first page with 4 days and a second page with the remaining 3 days, then continued swiping into the next week.
- Removed the manual previous and next week arrows around the mobile Today button.
- Added an `EN` / `中文` language switch directly on the login and registration page.
- Added translated login titles, field labels, actions, success states, and common authentication errors.
- Added frontend behavior coverage for the rolling mobile week sequence.
- Added frontend behavior coverage for the login-page language toggle.
- Expanded README and in-app Help content to document the mobile paging behavior and pre-login language switching.

## v1.5.1 - 2026-04-24

- Changed task, reminder, and help-question create routes to idempotent saves so repeated submissions do not create duplicate records.
- Changed task and reminder sync recovery so the app reloads server data after a failed save instead of leaving unsaved local-only state on screen.
- Added tests covering failed task-save recovery and duplicate-safe task creation.
- Expanded README and in-app Help content with data-safety behavior notes.

## v1.5.0 - 2026-04-22

- Added a responsive application shell that scales from mobile width up to a 1200px desktop maximum.
- Added desktop sidebar navigation and mobile bottom navigation.
- Changed Task and Reminder dialogs to open full-screen on mobile and as centered modals on larger screens.
- Reduced mobile typography sizes across the main planner pages to avoid horizontal scrolling.
- Expanded README and in-app Help content to document the responsive behavior.

## v1.4.0 - 2026-04-20

- Added the Help page with step-by-step planner instructions.
- Added FAQ content for common workflow questions.
- Added a shared question board backed by MongoDB for signed-in users.
- Added week-view date jumps into the Today page.
- Added blank-slot date prefilling for new tasks created from Week view.

## v1.3.1 - 2026-04-20

- Changed the month-view past-day marker to a red check mark.

## v1.3.0 - 2026-04-20

- Expanded translations across Today, Week, Month, and Reminder flows.
- Prevented timed tasks without an end time from spilling into the next day.
- Improved overlapping task layout in the week time grid.
- Added end-time validation for task editing.
- Added the frontend release notes popup and history drawer.
