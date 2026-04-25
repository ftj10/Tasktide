# Release Notes

## v1.6.0 - 2026-04-25

- Changed mobile Week view from a single 7-day layout to a horizontal paged swipe flow.
- Added a first page with 4 days and a second page with the remaining 3 days, then continued swiping into the next week.
- Removed the manual previous and next week arrows around the mobile Today button.
- Added frontend behavior coverage for the rolling mobile week sequence.
- Expanded README and in-app Help content to document the mobile paging behavior.

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
