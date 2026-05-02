# Development Log

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
