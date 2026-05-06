# Release Notes

Title: Version 2.8.1 – Update Released (2026-05-06)

What’s New

Improvements

Fixes

- Fixed: Automatic syllabus import now asks which course section applies when a syllabus includes multiple sections with different schedules.

Title: Version 2.8.0 – Update Released (2026-05-06)

What’s New

- Added: Automatic syllabus import can now ask up to five clarification questions before creating tasks, helping you resolve unclear dates, sections, or repeating patterns.
- Added: The Analyze with Claude option now shows a High Quality label so the recommended automatic path is easier to recognize.

Improvements

- Improved: Syllabus task generation now uses a shorter, more focused request so large imports can finish with less unnecessary AI output.
- Improved: The manual AI prompt now guides students through a clarify-first workflow before extracting tasks.

Fixes

## Version 2.7.3 – Update Released (2026-05-05)

### What's New

### Improvements

### Fixes
- Fixed: Automatic syllabus analysis now reliably extracts all your course events, even for large syllabi with many assignments, lectures, and recurring obligations.

Title: Version 2.7.2 – Update Released (2026-05-05)

What’s New

Improvements
- Improved: Automatic syllabus import now looks for a wider range of academic planning items, including assignments, readings, prep work, and recurring course obligations.

Fixes
- Fixed: Analyze with Claude now uses the stronger draft-generation flow, making empty imports less likely when the syllabus contains usable coursework details.

Title: Version 2.7.1 – Update Released (2026-05-05)

What’s New

Improvements

Fixes
- Fixed: Automatic syllabus analysis now connects to Claude correctly when an API key is configured, so task generation no longer fails from an invalid AI request.

Title: Version 2.7.0 – Update Released (2026-05-05)

What’s New

Improvements
- Improved: Syllabus Import now asks AI tools to include a short useful description for every generated task, making imported tasks easier to understand after they are added to your planner.

Fixes

## Version 2.6.0 – Update Released (2026-05-05)

### What's New
- Added: The Syllabus Import wizard now accepts Word documents (.docx) alongside PDFs and CSVs.
- Added: You can now upload multiple files at once — mix and match .docx, .pdf, and .csv files in a single import. Each file appears as a removable chip so you can review before proceeding.
- Added: Paste your own text and attach files at the same time. All sources are combined automatically when you click Next.

## Version 2.5.2 – Update Released (2026-05-05)

What’s New

Improvements

Fixes
- Fixed: Completing a reminder no longer shows a mistaken "Reminder created" message.

## Version 2.5.1 – Update Released (2026-05-05)

### Fixes
- Fixed: Adding a task after a previous task was just created no longer silently replaces the first task.

## Version 2.5.0 – Update Released (2026-05-05)

### What's New
- Added: The Syllabus Import wizard now supports a fully manual path — generate a ready-made AI prompt, copy it into any AI of your choice (ChatGPT, Claude, etc.), then paste the JSON response back. Nothing is sent anywhere when using this path.
- Added: A new Study Preferences step lets you add hints for the AI before the prompt is generated (e.g. "remind me 3 days before exams").
- Added: When pasting AI output, the wizard validates every item against the task schema and shows specific field-level errors so you know exactly what to fix — without losing your pasted content.
- Added: Uploading an unsupported file type (e.g. Excel) now shows a clear error with a tip to export to CSV first.

## Version 2.4.1 – Update Released (2026-05-05)

### Improvements
- Improved: TaskTide now has clearer contributor guidance, helping future updates stay consistent across release notes, Help Center guidance, README documentation, development logs, and tests.

## Version 2.4.0 – Update Released (2026-05-04)

### What's New
- Added: When you delete a task that came from a syllabus import, you now have the option to delete all tasks from that same import in one step — no need to remove them one by one.

## Version 2.3.0 – Update Released (2026-05-04)

### What's New
- Added: The Syllabus Import wizard now shows a review screen where you can inspect every extracted task before it is added to your planner — edit, remove, or restore any item before confirming.
- Added: Before your syllabus text is sent to AI for analysis, a consent screen shows you exactly what will be sent and asks you to confirm. Nothing is sent until you say so.
- Added: Your unfinished import is automatically saved for 24 hours. If you close the browser mid-import, you can pick up exactly where you left off when you reopen.
- Added: Importing a batch of tasks now has a 200-task safety limit to keep imports fast and reliable.

## Version 2.2.0 – Update Released (2026-05-04)

### What's New
- Added: A new "Import Syllabus" button now appears in the sidebar on desktop and in the top bar on mobile. Paste your course syllabus or upload a PDF or CSV file, click Analyze, and TaskTide will extract your schedule events as task drafts ready for your review.

## Version 2.1.0 – Update Released (2026-05-04)

### What's New
- Added: The app can now send your syllabus text to an AI for analysis. This is the engine behind the upcoming Syllabus Import feature — once the full import flow is complete, you will be able to drop in a course outline and have your tasks created automatically.

## Version 2.0.0 – Update Released (2026-05-04)

### What's New
- Added: Course Syllabus Import is on its way. Behind the scenes, support has been added for reading PDF and CSV syllabus files directly in your browser, so your course documents never leave your device.

## Version 1.25.1 – Update Released (2026-05-03)

### Fixes
- Fixed: Switching to a page you hadn't visited before while offline no longer shows a blank screen. A clear message now appears instead, letting you know the page will be available once you reconnect.

## Version 1.25.0 – Update Released (2026-05-03)

### What's New
- Added: A dedicated Stats page shows your task activity for the past 30 days, including how many tasks you completed, created, and left overdue, plus your overall completion rate.
- Added: A 30-day daily trend chart lets you see at a glance how your completed task count changed day by day.
- Added: The Stats page compares your current 30 days against the previous 30 days so you can see whether you are improving.
- Added: Behaviour insights appear automatically when the data supports them — for example, your most productive day, whether your backlog is growing or shrinking, and how much your completion rate changed versus last period.
- Added: A Details section shows your average daily completions, your best and worst day of the week, and your backlog change for the period.

### Improvements
- Improved: Today page is now focused only on your daily tasks. The statistics and graphs section has moved to the new Stats page.

## Version 1.24.0 – Update Released (2026-05-03)

### What's New
- Added: You can now export your tasks as a calendar file (.ics) and open them in any calendar app such as Apple Calendar, Google Calendar, or Outlook.
- Added: When exporting, choose whether to include all tasks, only incomplete tasks, or tasks within a specific date range.

## Version 1.23.0 – Update Released (2026-05-03)

### What's New
- Added: Every task action — creating, updating, completing, and deleting — now shows a brief confirmation message at the bottom of the screen so you always know what happened.
- Added: Reminders also confirm when you create or update one.
- Added: ICS calendar import now shows its result the same way, instead of leaving a message banner on the page.

### Improvements
- Improved: The Reminders page now shows an Add Reminder button right inside the empty state, so it is easier to get started.
- Improved: The Today page section headers for All-Day Tasks and Scheduled Tasks are now cleaner, with a color accent bar, a task count, and a visual separator.
- Improved: The Productivity Stats header now shows your today and 7-day completion as compact color-coded chips instead of a line of text.
- Improved: The Active and Completed task count pills on Today now use color to reinforce what each number means.
- Improved: The empty state on Today now shows an icon above the message to make the screen feel more welcoming.

## Version 1.22.1 – Update Released (2026-05-03)

### Improvements
- Improved: Tooltips throughout the app now have a polished dark design with a directional arrow and subtle blur, making them easier to read on any background.
- Improved: Tooltips on mobile now appear more quickly when you long-press an icon and stay visible long enough to read comfortably.
- Improved: Tooltips in the top navigation bar now always open downward so they are never cut off at the top of the screen on phones.

## Version 1.22.0 – Update Released (2026-05-03)

### What's New
- Added: The app tour now walks you through each part of TaskTide in the order you actually use it, starting with adding a task on Today.
- Added: The tour now asks you to tap Week to open the weekly view and tap Help to open the Help Center, so you learn by doing.
- Added: After opening Help Center, the tour points you to the notification toggle so you know exactly where to turn task alerts on or off.

### Improvements
- Improved: Each tour step now shows a clear title and a short explanation, making it easier to follow on any screen size.
- Improved: Tour tooltips now fit small mobile screens without overflowing, and reposition above or below the target based on available space.
- Improved: Tour targets scroll into view automatically before each step, so you always see what is being highlighted.

### Fixes
- Fixed: Tour no longer skips the notification step when the Help Center page loads after a delay.

## Version 1.21.0
Version: 1.21.0
Update Date: 2026-05-02

Title: Version 1.21.0 – Update Released (2026-05-02)

### What’s New
- Added: A visible Help Center action lets users turn Task Notifications on for the current browser or device.
- Added: A matching Disable Task Notifications action lets users turn off only the current browser or device.

### Improvements
- Improved: TaskTide now asks for notification permission only after users choose to enable Task Notifications.
- Improved: Users now see a short explanation before enabling task alerts, task start reminders, and daily task check-ins.

### Fixes
- Fixed: TaskTide no longer asks for notification permission during login, page load, app startup, or session restore.
- Fixed: Disabling Task Notifications keeps other signed-in devices connected.

## Version 1.20.0
Version: 1.20.0
Update Date: 2026-05-02

Title: Version 1.20.0 – Update Released (2026-05-02)

### What’s New
- Added: Faster first app loading by opening heavier planner areas only when users visit them.
- Added: Separate loading for Week, Month, Help Center, Reminders, and Updates.

### Improvements
- Improved: The first screen now downloads much less app code before users can start planning.
- Improved: Calendar and interface libraries are split into cacheable downloads for smoother repeat visits.

### Fixes
- Fixed: The production build no longer reports an oversized main app bundle.

## Version 1.19.4
Version: 1.19.4
Update Date: 2026-05-02

Title: Version 1.19.4 – Update Released (2026-05-02)

### What’s New
- Added: Smarter offline task syncing for users who edit tasks while disconnected.

### Improvements
- Improved: Repeated offline edits to the same task now sync as the latest task update instead of replaying every older step.
- Improved: TaskTide now checks whether a task changed online before replaying an offline edit.
- Improved: Help Center now explains that offline edits can continue and sync later.

### Fixes
- Fixed: Older offline task changes are less likely to overwrite newer task updates from another device.

## Version 1.19.3
Version: 1.19.3
Update Date: 2026-05-02

Title: Version 1.19.3 – Update Released (2026-05-02)

### What’s New
- Added: Clearer account setup guidance when username or password input needs attention.

### Improvements
- Improved: Usernames now ignore extra spaces during sign-in and account creation.
- Improved: Account creation now helps prevent duplicate-looking usernames with different letter casing.
- Improved: Help Center now starts the website flow with creating a clean account before planning tasks.

### Fixes
- Fixed: Very short passwords and blank account fields are now blocked before an account is created.

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
