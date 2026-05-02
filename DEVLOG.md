# Development Log

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
