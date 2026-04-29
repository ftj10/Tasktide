# Release Notes

## v1.15.0 - 2026-04-29

- Added a Help Center notification-recovery pitch for VAPID key changes and stale push subscriptions.
- Clarified the in-app recovery steps for deleting old subscriptions and re-enabling notifications on each device.

## v1.14.1 - 2026-04-29

- Fixed Today so moving a one-time task to tomorrow from a viewed future date no longer skips an extra day.
- Kept one-time task date ranges aligned when rescheduling from the Today page.

## v1.14.0 - 2026-04-28

- Added background push notifications for daily prompts and upcoming timed tasks on supported desktop browsers.
- Added installable mobile web-app notification support through a service worker and Web Push subscription flow.
- Kept an in-page notification fallback for browsers that still do not support background Web Push.

## v1.13.1 - 2026-04-28

- Fixed mobile Week drag-to-create so cross-day selections now preserve the task end date.
- Updated public ICS release notes so older history no longer implies that multi-day support is still unavailable.

## v1.13.0 - 2026-04-28

- Added multi-day task support across Today, Week, Month, and ICS import flows.
- One-time tasks can now keep an end date so a single task spans multiple days in the planner.
- ICS import now converts multi-day all-day calendar events into planner tasks instead of skipping them.

## v1.12.1 - 2026-04-28

- Improved ICS import feedback so skipped unsupported calendar entries are reported more clearly.
- Clarified public release messaging around early ICS import behavior.

## v1.12.0 - 2026-04-28

- Added `.ics` calendar import on Today so exported events can become planner tasks in one step.
- Imported calendar tasks now keep titles, notes, locations, all-day dates, same-day times, and supported daily, weekly, monthly, or yearly repeat rules.
- Import results now report when unsupported calendar entries were skipped.

## v1.11.2 - 2026-04-27

- Fixed one-time task completion handling so completed tasks leave active planner views consistently.
- Added a recurring-task delete choice so Today and Week can remove only one occurrence or the full series from the same task editor flow.
- Clarified the task editor action wording so edit saves use `Save` instead of looking like task completion.

## v1.11.1 - 2026-04-27

- Improved recurring task edit stability for single-day changes in the planner.
- Cleaned up the Week calendar event renderer for a more reliable production build.

## v1.11.0 - 2026-04-27

- Folded the Today productivity section by default so the page stays lighter until you choose to open the full stats and chart view.
- Added a quick Today productivity pitch with a one-click `View Stats and Visualization` action.
- Kept the selected-day, 7-day, 30-day, and 7-day chart insights available on demand.

## v1.10.1 - 2026-04-27

- Replaced the old completed-history block on Today with a clearer 7-day productivity chart.
- Kept the selected-day, 7-day, and 30-day completion summaries while making progress easier to scan at a glance.
- Removed extra Week header hint labels for a cleaner calendar header.
- Simplified public update notes so the Updates center focuses on product changes instead of internal implementation details.

## v1.10.0 - 2026-04-27

- Added admin review mode in the Help Center so admins can review and remove submitted questions while each standard user only sees their own questions.
- Improved Week performance by generating repeating events only for the visible date range.
- Completed tasks now leave active Today, Week, Month, and reminder flows immediately after completion.
- Added Today productivity summaries for the selected day, the last 7 days, and the last 30 days.
- Kept completed task data available for 30 days before automatic cleanup.

## v1.9.2 - 2026-04-27

- Each Help Center question now saves as its own post instead of overwriting an older one.
- Failed help-question submissions now keep the draft visible and show an error message.
- Fixed Week calendar timing for one-day repeating-task overrides.

## v1.9.1 - 2026-04-27

- Hid the mobile bottom navigation while add-task and edit-task dialogs are open.
- Restored the mobile bottom navigation automatically after the task dialog closes.

## v1.9.0 - 2026-04-26

- Changed Week to open in Time Grid by default.
- Removed the global `Add Task` button from the mobile Week page and replaced it with press-hold time-range task creation.
- Simplified Month into a cleaner card-based task grid and restored `Jump to Current Month`.
- Kept the mobile bottom navigation above overlapping planner content so taps stay reliable.

## v1.8.0 - 2026-04-26

- Browser notifications now ask for permission only after user interaction.
- Daily and task reminders now tolerate timer drift more reliably.
- Old notification history now clears automatically after three days.

## v1.7.2 - 2026-04-25

- Adjusted the repeat selector spacing so the `Repeat` label no longer clips below the dialog header.

## v1.7.1 - 2026-04-25

- Matched the repeat-options dialog to the main task editor size.
- Changed the repeat-options dialog to full-screen on phones.

## v1.7.0 - 2026-04-25

- Replaced the old task-type flow with a begin-date and repeat-options flow.
- Added daily, weekly, monthly, and yearly repeat rules.
- Added repeating-task edit choices for one occurrence or the full series.
- Kept older task data compatible with the new recurrence system.

## v1.6.1 - 2026-04-25

- Improved mobile Week swipe stability so one swipe only moves one page at a time.

## v1.6.0 - 2026-04-25

- Changed mobile Week into a horizontal paged layout that shows 4 days first and then the remaining 3 days.
- Added an `EN` / `中文` language switch to the login and registration screen.

## v1.5.1 - 2026-04-24

- Repeated task, reminder, and help-question submissions no longer create duplicates.
- Failed task and reminder saves now reload stored data instead of leaving unsynced local state on screen.

## v1.5.0 - 2026-04-22

- Added a responsive app shell with a desktop sidebar and mobile bottom navigation.
- Changed Task and Reminder dialogs to full-screen on phones and centered modals on larger screens.

## v1.4.0 - 2026-04-20

- Added the Help Center with usage steps, FAQ content, and a shared question board.
- Added Week-to-Today date jumps and blank-slot date prefilling for new tasks.

## v1.3.1 - 2026-04-20

- Changed the month-view past-day marker to a red check mark.

## v1.3.0 - 2026-04-20

- Expanded translations across Today, Week, Month, and Reminder flows.
- Prevented timed tasks without an end time from spilling into the next day.
- Improved overlapping task layout in the week time grid.
- Added end-time validation for task editing.
- Added the in-app Updates popup and release history drawer.
