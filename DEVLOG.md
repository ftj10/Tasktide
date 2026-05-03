# Development Log

## Version 1.23.0
Version: 1.23.0
Update Date: 2026-05-03

### Changes

**`frontend/src/i18n.ts`**
- Added `toast` namespace under both `en` and `zh` translations with keys: `taskCreated`, `taskUpdated`, `taskDeleted`, `taskDone`, `allTasksDone`, `reminderCreated`, `reminderUpdated`.
- Updated `help.guides.step1` (en + zh) to mention the new per-action confirmation feedback.

**`frontend/src/App.tsx`**
- Added `Alert` and `Snackbar` to MUI imports.
- Added `useCallback` to React imports.
- Added `toast` state `{ open, message, severity }` and `showToast` callback (memoized with `useCallback`).
- Passed `showToast` as a new optional prop to `TodayPage` and `ReminderPage` routes.
- Rendered a `Snackbar` + `Alert` pair at the root level with `anchorOrigin: bottom/center`, `autoHideDuration: 3000`. Bottom margin is `mb: 9` on mobile (above the bottom nav bar) and `mb: 2` on desktop. Alert styled with `borderRadius: 2.5` and a subtle shadow.

**`frontend/src/pages/TodayPage.tsx`**
- Added `showToast` optional prop to the component signature.
- Removed `Alert` from MUI imports (no longer used inline); added `CheckCircleOutlineRoundedIcon` import.
- Removed the `importStatus` state (`{ severity, message } | null`).
- `importIcsFile` now calls `showToast?.(msg, severity)` instead of `setImportStatus`.
- Added `handleTaskSave` wrapper around `upsert` that distinguishes create vs. edit (via `!!editing`) and calls `showToast` with the appropriate key. `TaskDialog.onSave` now receives `handleTaskSave` instead of `upsert` directly — `moveTemporaryToToday`/`moveTemporaryToTomorrow` still call `upsert` directly and show no toast (move is not a create/update action).
- `remove` calls `showToast?.(t("toast.taskDeleted"), "info")` after updating state.
- `doMarkDone` calls `showToast?.(t("toast.taskDone"))` after updating state.
- `markAllDone` calls `showToast?.(t("toast.allTasksDone"))` after updating state.
- **Task count chips**: Both chips now have explicit `bgcolor`, `color`, `border`, and `borderColor` matching the app theme — indigo tint for active, green tint for completed.
- **Stats section header**: Replaced the `body2` `productivityPitch` typography with two inline `Chip` components (height: 22, fontSize: 0.7rem): a green chip showing today's completion fraction and a primary-colored chip showing 7-day completion rate. The existing `productivityPitch` i18n key is no longer rendered but kept in i18n for potential future use.
- **Task section headers**: Replaced the plain uppercase `Typography subtitle1` for both "All-Day Tasks" and "Scheduled Tasks" with a flex row containing: a 3×14px rounded color accent bar (`primary.light` for all-day, `secondary.main` for scheduled), the label text as `caption`, a `flex: 1` 1px divider line, and a numeric count badge.
- **Empty state**: Added `CheckCircleOutlineRoundedIcon` at fontSize 48 with `text.disabled` color above the existing text and button.

**`frontend/src/pages/ReminderPage.tsx`**
- Added `showToast` optional prop; destructured from `props`.
- `upsert` now detects create vs. edit mode (via `!!editing` captured before the state update) and calls `showToast?.(t("toast.reminderCreated/reminderUpdated"))`.
- **Empty state**: Added `NotificationsActiveOutlinedIcon` at fontSize 48 above the text. Added an outlined "+ Add Reminder" `Button` below the text, wired to open the dialog with `editing: undefined`.

**`frontend/package.json`**
- Bumped version from 1.22.1 → 1.23.0.

**`RELEASENOTES.md`, `frontend/src/app/releaseNotes.ts`**
- Added v1.23.0 release entry with bilingual (en/zh) content.

### Design Decisions
- The `Snackbar` is rendered at the App root (not inside individual pages) to avoid it unmounting mid-display if the user navigates during the 3-second window. A single toast state at the top level is simpler than a context provider for this use case.
- `showToast` is typed as optional (`?`) on each page so pages can be rendered in tests or in isolation without providing it.
- `moveTemporaryToToday` and `moveTemporaryToTomorrow` intentionally skip the toast — they call `upsert` directly. Showing "Task updated" for a move could confuse users who expect that message only for edits.
- The Snackbar `mb` offset on mobile (`mb: 9`, ~72px) ensures the toast clears the 68px bottom navigation bar.
- Section header accent bars use `primary.light` and `secondary.main` to visually distinguish the two groups without adding heavy UI elements.
- Stats mini chips cap at height 22 to stay visually compact; font-size 0.7rem matches the existing priority chip sizing already used throughout the task cards.

## Version 1.22.1
Version: 1.22.1
Update Date: 2026-05-03

### Changes

**`frontend/src/main.tsx`**
- Added `MuiTooltip` to the theme `components` block with `defaultProps` (`arrow: true`, `enterTouchDelay: 500`, `leaveTouchDelay: 2000`, `enterDelay: 300`) and `styleOverrides` for `tooltip` and `arrow` sub-components. Styling uses `rgba(15, 23, 42, 0.9)` background with `backdropFilter: blur(8px)`, 8px border radius, and a shadow to match the app's design language.

**`frontend/src/App.tsx`**
- Added `placement="bottom"` to the three MUI Tooltip components wrapping the mobile AppBar icon buttons (language switch, install app, logout). These tooltips are at the top of the screen; without explicit placement the arrow may point incorrectly or clip the viewport edge on short phones.

**`frontend/package.json`, `package.json`**
- Bumped version from 1.22.0 → 1.22.1.

**`RELEASENOTES.md`, `frontend/src/app/releaseNotes.ts`**
- Added v1.22.1 release entry with bilingual (en/zh) content.

### Design Decisions
- `enterTouchDelay` was lowered to 500ms (from the 700ms MUI default) as a balance between intentional long-press and responsiveness; 0ms would conflict with tap actions that fire on touchend.
- `leaveTouchDelay` was raised to 2000ms so users on touch screens have enough time to read the tooltip label before it fades.
- `enterDelay: 300` on hover prevents tooltips from flashing during rapid cursor movements across the navigation area.
- `placement="bottom"` is set only on the mobile AppBar tooltips (top of screen); the desktop sidebar tooltip keeps the default since it has ample vertical space above and below.

## Version 1.22.0
Version: 1.22.0
Update Date: 2026-05-03

### Changes

**`frontend/src/app/helpCenter.ts`**
- Extended `OnboardingTooltipStep` type with `title: string`, `forceAction?: boolean`, `expectedAction?: string`.
- Rewrote `getOnboardingSteps` with 7 steps in new order: add-task, task-list, language-switch, download-app, open-week (forceAction, expectedAction: "open-week-page"), open-help (forceAction, expectedAction: "open-help-center"), notification-toggle.
- All step targets include both `[data-onboarding='...']` selectors and legacy `#id` selectors for backward compatibility.

**`frontend/src/components/OnboardingTooltip.tsx`**
- Added `forceAdvanceSignal?: string | null` prop; when the value matches the current forced-action step's `expectedAction`, the step auto-advances.
- Replaced `useLayoutEffect` + fixed positioning with a `useEffect` that scrolls the target into view with `scrollIntoView({ behavior: "smooth" })`, retries up to 30 frames if the element isn't in the DOM yet (handles lazy-loaded Help Center), then measures `getBoundingClientRect` after a 350ms settle delay.
- Tooltip width is now `min(320px, 100vw - 24px)` — responsive, never overflows viewport.
- Placement logic prefers below-target; falls back to above-target if insufficient space below; clamps horizontally to viewport padding.
- For `forceAction` steps, the Next button is hidden entirely, leaving only the Skip button. This forces real navigation.
- Step title and text displayed separately as `subtitle2` + `body2`, replacing the single bold `body1`.

**`frontend/src/App.tsx`**
- Added `onboardingForceSignal` state (`string | null`).
- Added `useEffect` on `location.pathname`: sets signal to `"open-week-page"` when on `/week`, `"open-help-center"` when on `/help`, `null` otherwise.
- Added `dataOnboarding` field to `navigationItems` (`"week-page-button"` for week, `"help-center-button"` for help).
- Added `data-onboarding` props to: desktop nav buttons, mobile `BottomNavigationAction`, mobile language-switch `IconButton`, mobile install-app `IconButton`, desktop install-app `Button`, desktop language-switch `Button`.
- Passes `forceAdvanceSignal={onboardingForceSignal}` to `<OnboardingTooltip>`.

**`frontend/src/pages/TodayPage.tsx`**
- Added `data-onboarding="add-task-button"` to both `#today-add-task-button` and `#today-empty-add-task-button`.
- Added `data-onboarding="task-list"` to both `#today-empty-state` (Paper) and `#today-task-list` (Box).

**`frontend/src/pages/HelpPage.tsx`**
- Added `data-onboarding="notification-toggle-button"` to the `<Stack>` containing the Enable/Disable notification buttons.

**`frontend/src/i18n.ts`**
- Replaced flat `onboarding.steps.*` strings with nested `{ title, text }` objects for all 7 steps in both `en` and `zh`.
- New keys: `addTask`, `taskList`, `languageSwitch`, `downloadApp`, `openWeek`, `openHelp`, `notificationToggle` — each with `.title` and `.text`.

### Design Decisions
- `forceAdvanceSignal` is a `string | null` prop rather than a callback to keep `OnboardingTooltip` mostly self-contained. App.tsx resets the signal to `null` when the user leaves `/week` or `/help`, preventing stale re-triggers on subsequent location changes to unrelated paths.
- Retry loop (30 rAF frames) in `OnboardingTooltip` handles the Help Center being lazy-loaded: the notification toggle element isn't in the DOM until after the Suspense boundary resolves.
- `data-onboarding` attributes coexist with existing `id` attributes; neither is removed, so any existing tooling or tests targeting `#today-add-task-button` etc. still work.
- The ONBOARDING_STORAGE_KEY is intentionally unchanged (`tasktide:onboarding:v1.18.4`) to avoid re-triggering onboarding for users who already completed it.

## Version 1.21.0
Version: 1.21.0
Update Date: 2026-05-02

### Technical Changes
- `frontend/src/App.tsx`: Removed the global post-login pointer and keyboard listener that automatically requested browser notification permission, while preserving existing granted-permission subscription sync and task notification scheduling.
- `frontend/src/pages/HelpPage.tsx`: Added explicit Task Notifications enable and disable actions, a confirmation dialog before permission requests, denied-permission guidance, unsupported-browser feedback, already-granted sync behavior, and current-device disable feedback.
- `frontend/src/i18n.ts`: Added English and Chinese Help Center wording for Task Notifications, task alerts, task start reminders, and daily task check-ins.
- `frontend/tests/app.behavior.test.tsx`, `frontend/tests/help-page.behavior.test.tsx`, and `frontend/tests/push-notifications.behavior.test.ts`: Added coverage for no startup prompt, click-confirmed enable prompts, granted sync, denied handling, unsupported browsers, current-subscription disable, and existing PushManager subscription reuse.
- `backend/tests/server.behavior.test.js`: Added backend coverage confirming notification subscription POST upserts by endpoint and keeps other device endpoints.
- `frontend/src/app/releaseNotes.ts`, `frontend/tests/release-notes.behavior.test.tsx`, `README.md`, and `RELEASENOTES.md`: Added the 1.21.0 Task Notifications update.
- `package.json`, `frontend/package.json`, `frontend/package-lock.json`, `backend/package.json`, and `backend/package-lock.json`: Bumped package metadata to 1.21.0.

### Design Decisions
- Notification permission is now tied to an explicit Help Center action so users understand the request before the browser prompt appears.
- Existing backend endpoints, `User.pushSubscriptions`, endpoint upsert logic, and endpoint-specific delete logic remain unchanged to preserve current push delivery behavior.
- Already-granted browsers call subscription sync instead of requesting permission again, relying on backend endpoint upsert to avoid duplicate records.

### Edge Cases
- Denied permission does not call the enable flow again; users receive guidance to re-enable notifications from browser or site settings.
- Unsupported browsers show a direct message without opening the confirmation dialog.
- Disable removes and unsubscribes the current local PushManager subscription only, leaving other device subscriptions stored.

### Known Limitations
- Browser-level denied notification permission still has to be changed outside TaskTide through the browser or site settings.

## Version 1.20.0
Version: 1.20.0
Update Date: 2026-05-02

### Technical Changes
- `frontend/src/App.tsx`: Converted Reminders, Week, Month, Help Center, and Release Notes to `React.lazy` modules behind `Suspense` boundaries while keeping Today eager for the default route and onboarding targets.
- `frontend/vite.config.ts`: Added Rollup manual chunks for MUI/Emotion and FullCalendar dependencies.
- `frontend/src/i18n.ts`: Updated Help Center core-flow copy to mention on-demand loading for heavier planner areas.
- `frontend/src/app/releaseNotes.ts`, `frontend/tests/release-notes.behavior.test.tsx`, `README.md`, and `RELEASENOTES.md`: Added the 1.20.0 first-load performance update.
- `package.json`, `frontend/package.json`, `frontend/package-lock.json`, `backend/package.json`, and `backend/package-lock.json`: Bumped package metadata to 1.20.0.

### Design Decisions
- Today remains eagerly loaded because it is the default signed-in route and the onboarding guide needs Today targets immediately.
- FullCalendar is isolated behind the Week route and calendar vendor chunk so users do not download it before opening Week.
- MUI remains required by the app shell but is separated into a stable vendor chunk for browser caching.

### Edge Cases
- Release Notes are lazy-loaded in both mobile and desktop shells with a null fallback so navigation layout does not shift while the Updates button loads.
- Route pages use a shared in-app loading fallback while their chunks download.

### Known Limitations
- First-time visits still download the MUI vendor chunk because the app shell uses MUI components.

## Version 1.19.4
Version: 1.19.4
Update Date: 2026-05-02

### Technical Changes
- `frontend/src/app/storage.ts`: Added task-id-based pending queue merging, base `updatedAt` tracking for offline update/delete operations, and conflict checks before replay.
- `frontend/src/App.tsx`: Passed previous task records into task update/delete sync calls so offline queue entries know which server version they were based on.
- `frontend/tests/offline-storage.behavior.test.ts`: Added coverage for merging repeated offline updates and blocking stale offline updates when the server task changed first.
- `frontend/src/i18n.ts`: Updated Help Center core-flow guidance to explain offline editing and later sync.
- `frontend/src/app/releaseNotes.ts`, `frontend/tests/release-notes.behavior.test.tsx`, `README.md`, and `RELEASENOTES.md`: Added the 1.19.4 offline sync update.
- `package.json`, `frontend/package.json`, `frontend/package-lock.json`, `backend/package.json`, and `backend/package-lock.json`: Bumped package metadata to 1.19.4.

### Design Decisions
- Queue merging happens in browser storage so repeated offline edits collapse before replay and survive reloads.
- Update/delete conflict checks compare the server task `updatedAt` against the local base `updatedAt` captured when the offline change was queued.
- Creates do not require a conflict snapshot because a new client task id has no prior server version.

### Edge Cases
- Creating a task offline and deleting it before sync removes the pending create entirely.
- Multiple offline updates preserve the first base timestamp and the latest task payload.
- A queued delete is skipped if the server task is already gone when sync resumes.

### Known Limitations
- Conflict resolution currently stops the replay and keeps the queued edit for retry; it does not yet show a user-facing merge dialog.

## Version 1.19.3
Version: 1.19.3
Update Date: 2026-05-02

### Technical Changes
- `backend/server.js`: Added username normalization, case-insensitive username lookup, registration validation, and login blank-field validation.
- `backend/tests/server.behavior.test.js`: Added backend coverage for trimmed/lowercased registration usernames, short username rejection, weak password rejection, trimmed login usernames, and blank login fields.
- `frontend/src/pages/LoginPage.tsx`: Trimmed username input before submitting login and registration requests and mapped new backend validation messages.
- `frontend/src/i18n.ts`: Added English and Chinese auth validation messages and improved the Help Center core-flow opening step.
- `frontend/tests/login-page.behavior.test.tsx`, `frontend/tests/help-page.behavior.test.tsx`, and `frontend/tests/release-notes.behavior.test.tsx`: Updated expectations for auth validation, Help Center guidance, and the latest release.
- `frontend/src/app/releaseNotes.ts`, `README.md`, and `RELEASENOTES.md`: Added the 1.19.3 account setup update.
- `package.json`, `frontend/package.json`, `frontend/package-lock.json`, `backend/package.json`, and `backend/package-lock.json`: Bumped package metadata to 1.19.3.

### Design Decisions
- Registration stores new usernames in lowercase so `FTJ`, `ftj`, and ` ftj ` do not become separate duplicate-looking accounts.
- Login uses a case-insensitive exact username lookup so users can still sign in when they type different casing.
- Password length validation is applied during registration only, so existing users with older short passwords are not locked out by this change.

### Edge Cases
- Registration rejects blank or two-character usernames before database lookup.
- Registration rejects passwords shorter than 8 characters before hashing.
- Login rejects blank username or blank password with a direct validation message.

### Known Limitations
- Existing accounts already stored with duplicate-looking casing are not automatically merged.

## Version 1.19.2
Version: 1.19.2
Update Date: 2026-05-02

### Technical Changes
- `frontend/eslint.config.js`: Disabled `react-hooks/set-state-in-effect` because the project intentionally syncs dialog and route-derived state from props in controlled UI surfaces.
- `frontend/src/app/taskLogic.ts`: Added a `PlannerCalendarEvent` type and removed the untyped calendar event array.
- `frontend/src/pages/WeekPage.tsx` and `frontend/tests/week-page.behavior.test.tsx`: Replaced untyped calendar event handling with the shared planner event shape.
- `frontend/src/pages/TodayPage.tsx`, `frontend/src/pages/WeekPage.tsx`, and `frontend/src/components/ReleaseNotesCenter.tsx`: Cleaned hook dependencies and removed stale release-note implementation comments.
- `frontend/src/app/tasks.ts`: Converted stable recurrence counters from `let` to `const`.
- `frontend/src/i18n.ts`: Improved the Help Center core workflow copy in English and Chinese.
- `frontend/src/app/releaseNotes.ts`, `frontend/tests/release-notes.behavior.test.tsx`, `README.md`, and `RELEASENOTES.md`: Added the 1.19.2 release and updated public guidance.
- `package.json`, `frontend/package.json`, `frontend/package-lock.json`, `backend/package.json`, and `backend/package-lock.json`: Bumped package metadata to 1.19.2.

### Design Decisions
- The React set-state-in-effect lint rule was disabled at the config level instead of rewriting controlled forms into less direct patterns, because these components need to reset local draft state when dialogs open with new task or reminder data.
- Calendar event typing was centralized in task logic so Week view rendering and tests use the same event contract.

### Edge Cases
- Existing task, reminder, release-note, and walkthrough behavior is unchanged; the changes focus on keeping the quality gate clean.
- Release-note visibility now uses the new 1.19.2 release id, so users can see the latest maintenance update once.

### Known Limitations
- `npm test` still runs backend and frontend tests only. Frontend lint and production build remain separate commands.

## Version 1.19.1
Version: 1.19.1
Update Date: 2026-05-01

### Technical Changes
- `backend/server.js`: Added trusted-origin helpers and a CSRF origin middleware for unsafe HTTP methods.
- `backend/tests/server.behavior.test.js`: Added coverage for blocked untrusted origins, blocked cookie writes without origin context, and accepted configured frontend origins.
- `frontend/src/App.tsx`: Added desktop and mobile Install app entry points that route to the web-app walkthrough.
- `frontend/src/app/helpCenter.ts`: Bumped the onboarding storage key to `tasktide:onboarding:v1.18.4` and added Help Center plus Install app coach-mark steps.
- `frontend/src/i18n.ts`: Updated English and Chinese onboarding, navigation, and Help Center core-flow copy.
- `frontend/src/app/releaseNotes.ts`: Added the latest 1.19.1 safety entry and the requested 1.18.3 and 1.18.4 April 30 coach-mark entries.
- `frontend/tests/app.behavior.test.tsx`, `frontend/tests/help-page.behavior.test.tsx`, and `frontend/tests/release-notes.behavior.test.tsx`: Updated expectations for the expanded onboarding flow, Help Center guidance, and release history.
- `package.json`, `frontend/package.json`, `frontend/package-lock.json`, `backend/package.json`, and `backend/package-lock.json`: Updated project metadata to 1.19.1.
- `README.md` and `RELEASENOTES.md`: Updated public guidance and client-facing release messaging.

### Design Decisions
- Origin validation was chosen over a client-managed CSRF token because the app already relies on credentialed browser requests and configured frontend origins.
- Cookie-authenticated unsafe requests without `Origin` or `Referer` are rejected so a session cookie alone is not enough to perform a write.
- Bearer-token API access remains usable for existing tests and non-cookie flows, but any unsafe request that declares an untrusted browser origin is still rejected.
- The requested 1.18.3 and 1.18.4 updates are recorded as historical April 30 release entries because the repository had already advanced to 1.19.0.

### Edge Cases
- Local same-origin development through the Vite `/api` proxy remains supported when the request origin matches the request host or `CORS_ORIGIN`.
- Cross-host deployments must keep `CORS_ORIGIN` aligned with the deployed frontend origin or signed-in write requests will be blocked.
- The onboarding storage key changed so users who completed the older tour can see the newly added Help Center and Install app coach marks.

### Known Limitations
- The Install app entry opens guidance rather than directly invoking a browser install prompt, because install-prompt support varies by browser and device.
