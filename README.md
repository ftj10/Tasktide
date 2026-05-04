# TaskTide Application

Current version: `v1.25.2`

TaskTide is a full-stack planner for daily tasks, weekly routines, reminders, shared help questions, and calendar-based scheduling.

Deployed Web: TaskTide

## Features

- Task and reminder CRUD actions — create, update, complete, delete — each confirm with a brief toast notification at the bottom of the screen. ICS import results also appear as toasts instead of inline banners.
- Secure registration and login with HttpOnly cookie sessions and persisted `USER` / `ADMIN` roles.
- Registration now trims usernames, prevents duplicate-looking username casing, and requires stronger passwords before an account is created.
- Cookie-backed write requests are checked against trusted TaskTide origins so signed-in planner changes stay protected from cross-site request attempts.
- Hosted frontend and backend deployments now keep users signed in after login by automatically using cross-site session cookie settings when the browser request comes from a different hostname.
- Installed TaskTide sessions can reopen cached tasks offline after a successful online load, then add, edit, complete, and delete tasks while changes wait for the API to return.
- Offline task sync now merges repeated edits for the same task and checks server update timestamps before replaying queued changes.
- Project, web-app, install, notification, storage, and backup identifiers now use the TaskTide name.
- Login and registration screens support an `EN` / `中文` switch before authentication.
- Today, Week, and Month planning views for one-time and recurring tasks.
- Week, Month, Help Center, Reminders, and Updates are loaded only when needed so the first app screen downloads less JavaScript.
- If a page has not loaded on the current device before and the browser is offline, the app shows a clear offline message instead of a blank screen.
- Today reschedule shortcuts now follow the selected day in the header, so moving a one-time task to `Today` or `Tomorrow` works correctly even while you are browsing future dates.
- Today can now import `.ics` calendar files into planner tasks, including multi-day all-day events, timed events, and supported daily, weekly, monthly, and yearly repeats.
- Today can now export tasks as a `.ics` calendar file compatible with Apple Calendar, Google Calendar, Outlook, and any standard calendar app. Export options include all tasks, incomplete tasks only, or tasks within a specified date range. The file is generated entirely in the browser with no backend request.
- Task completion now uses retained `completedAt` timestamps: completed tasks disappear from active planner views immediately, stay retained for 30 days, and continue feeding shared completion analytics and cleanup rules.
- A dedicated Stats page (`/stats`) shows 30-day task analytics: completed, created, overdue, and completion rate summary cards; a 30-day daily trend bar chart; period-over-period comparison against the previous 30 days; behaviour insights; and a Details section with best/worst day and daily averages.
- First-time users get a seven-step in-app onboarding tour: add a task, view the task area, switch language, download the app, open Week view (forced navigation), open Help Center (forced navigation), and enable or disable notifications.
- Single-day edits for repeating tasks now save through the shared planner collection flow more reliably.
- Repeating tasks now use the same shared delete logic in Today and Week, including a `This day only` versus `Entire series` choice from the shared task editor.
- Task forms now use a `Begin date` field plus a repeat-options window that supports once, daily, weekly, monthly, and yearly schedules.
- One-time tasks now support an `End date`, so the same task can span multiple days in Today, Week, Month, and ICS imports.
- Mobile Week drag-to-create now preserves the selected `End date` when your range crosses into the next day.
- The shared task editor now uses `Save` for edit submission so task completion stays distinct from task editing.
- The Today header now includes an `Import ICS` action that converts supported calendar exports into tasks and reports skipped unsupported entries after import.
- The repeat-options window now matches the main task editor size on desktop and opens full-screen on mobile.
- The repeat-options selector now sits slightly lower in its dialog so the `Repeat` label stays fully visible below the header.
- Repeating task edits can target either one occurrence or the full series without destroying older task data.
- Mobile Week view opens in Time Grid by default, keeps a horizontal swipe flow that shows 4 days first and then the remaining 3 days, and creates tasks from a press-held time range instead of a global add button.
- Month view now uses the refreshed card-based calendar UI, keeps desktop previous and next arrow controls, keeps mobile vertical swipe navigation between months, and includes a `Jump to Current Month` button.
- Month view now opens on the month that matches the selected `?date=` route, so clicking a visible day always follows the active planner date context.
- Reminder tracking with priority ordering and completion flow.
- Role-based help center with FAQ content, append-only user questions, admin-wide review access, and admin-only question deletion.
- Help Center now includes `Quick Walkthroughs`: short question-driven modal guides with GIF-ready media slots for adding tasks, opening Week, finding saved tasks, drag-to-add, and Task Notifications setup.
- Help Center includes a start-to-finish website guide, focused walkthroughs, and clickable Q&A entries, including offline page guidance.
- Help Center now explains mobile notification setup, mobile web-app installation, and browser-specific installed-app behavior for iPhone, iPad, and Android.
- The app shell includes an Install app entry point that opens the Help Center walkthrough for adding TaskTide as a web app.
- Help-question posting now keeps the draft visible if the request fails instead of showing a false success state.
- Week view now respects one-day recurring-task time overrides when placing events on the calendar.
- Week view now generates recurring events only for the visible range and reuses cached occurrence windows for repeated range renders.
- Responsive application shell with a desktop sidebar, mobile bottom navigation, and full-screen mobile task and reminder forms.
- The mobile bottom navigation hides automatically while add-task and edit-task dialogs are open, then returns after the task dialog closes.
- Idempotent save routes and client-side recovery that reload persisted planner data after a failed task or reminder sync.
- Map links for task locations plus explicit Task Notifications for task alerts, task start reminders, and daily task check-ins.
- Desktop browsers can receive Task Notifications through a service worker after the user opens Help, chooses `Enable Task Notifications`, confirms the explanation, and grants browser permission.
- Supported mobile installs can receive the same Task Notifications after you add TaskTide to the home screen, open the installed app, and enable notifications from Help.
- The shared service worker caches the TaskTide app shell so installed web-app sessions can start from cached files while offline.
- Browsers without Web Push support still fall back to in-page notification timers while the planner tab stays open.
- Consistent `INPUT` / `OUTPUT` / `EFFECT` code comments across source and test files for faster feature scanning during maintenance.
- Frontend linting now runs cleanly with typed calendar-event data and stable hook dependency checks.

## Stack

- Frontend: React 18, TypeScript, Vite, MUI, FullCalendar, Day.js, React Router.
- Frontend routing uses lazy-loaded page chunks plus separate MUI and FullCalendar vendor chunks to keep the app shell smaller.
- Backend: Node.js, Express, MongoDB with Mongoose, JWT, bcryptjs.

## Setup

Backend:

```bash
cd backend
npm install
node server.js
```

Backend `.env`:

```env
PORT=2676
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_secure_random_secret_string
ADMIN_USERNAMES=comma_separated_admin_usernames
CORS_ORIGIN=http://127.0.0.1:5173
SESSION_COOKIE_SAME_SITE=optional_lax_strict_or_none
SESSION_COOKIE_SECURE=optional_true_or_false
WEB_PUSH_SUBJECT=mailto:you@example.com
VAPID_PUBLIC_KEY=optional_existing_public_key
VAPID_PRIVATE_KEY=optional_existing_private_key
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend `.env`:

```env
VITE_API_URL=/api
```

Workspace tests:

```bash
npm test
```

Frontend quality checks:

```bash
npm --prefix frontend run lint
npm --prefix frontend run build
```

## Notes

- Review [RELEASENOTES.md](RELEASENOTES.md) for repository-level changes.
- The installable web app, browser tab title, service worker notifications, package metadata, session cookie, and local browser profile keys use the TaskTide brand.
- The login session now lives in an HttpOnly cookie. JavaScript no longer reads the JWT directly, and frontend API calls rely on browser credentials instead of `Authorization` headers.
- Local frontend development now defaults to the Vite `/api` proxy so cookie-based auth stays same-origin during `npm run dev`.
- If you deploy the frontend and backend on different HTTPS hostnames, set `CORS_ORIGIN` to the frontend origin. The backend uses this value for credentialed CORS and CSRF origin checks. Cross-host login responses default to `SameSite=None; Secure`; use `SESSION_COOKIE_SAME_SITE` and `SESSION_COOKIE_SECURE` only when you need to override that behavior.
- Local development can skip manual VAPID setup because the backend generates `backend/.push-vapid.json` on first use. Production should provide `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `WEB_PUSH_SUBJECT`.
- Task Notifications are user-controlled from Help. TaskTide does not request notification permission automatically after login, page load, app startup, or session restore.
- `Enable Task Notifications` creates or reuses the current browser subscription and saves it through `POST /notifications/subscriptions`; the backend upserts by endpoint so the same browser does not create duplicate subscription records.
- `Disable Task Notifications` unsubscribes only the current browser or installed app and deletes only that endpoint through `DELETE /notifications/subscriptions`; other signed-in devices remain connected.
- Use `Import ICS` on the Today page when you want to bring calendar events into the planner from a `.ics` export. The importer keeps titles, notes, locations, multi-day all-day ranges, timed events, and supported daily, weekly, monthly, and yearly recurrence rules.
- The in-app Updates center mirrors the latest shipped release metadata from `frontend/src/app/releaseNotes.ts` and groups each release under `New Features`, `Improvements`, and `Bug Fixes`.
- The frontend lint check is separate from `npm test`; run it before shipping UI changes so type, hook, and style issues are caught early.
- Production builds split heavy planner views and vendor libraries into cacheable chunks; watch the Vite output if a future feature grows the entry bundle again.
- Offline task access uses browser local storage for the latest task cache and a queued task mutation list. The queue merges repeated operations for the same task, replays task create, update, and delete operations when the browser fires `online` or the app next loads tasks successfully, and uses task `updatedAt` values to avoid overwriting newer server changes.
- During `npm run dev`, the frontend unregisters the TaskTide app-shell service worker and background push service-worker registration stays disabled unless `VITE_ENABLE_DEV_SERVICE_WORKER=true` is set. This keeps Vite HMR and React Fast Refresh on a single fresh module graph.
- Walkthrough GIF files can be added under `frontend/public/help-walkthroughs/` using the built-in filenames shown in each Help Center placeholder.
- First-run onboarding is stored per browser in local storage and disappears after completion or skip. Two steps (Week view and Help Center) require the user to tap the real navigation button rather than clicking Next, ensuring they discover the page. The notification step highlights the Enable/Disable buttons inside Help Center and waits for the lazy-loaded page to render before measuring position.
- Shared help questions are stored as new posts on the server, so another signed-in user cannot overwrite an older question by reusing its client-side id.
- Standard users can only read their own submitted help questions, while `ADMIN` accounts can review all questions.
- The `My Questions` section is the normal non-admin view; it means the account is a `USER`, not an `ADMIN`.
- Admin accounts can delete help questions directly from the Help Center.
- `ADMIN_USERNAMES` lets you promote accounts to admin by username, including older accounts that still show `role: USER` in the dataset.
- Older user records that do not yet have a `role` field are backfilled on the next successful login.
- Older datasets that still use `TEMPORARY` and `PERMANENT` task records remain readable; the frontend normalizes them into the new recurrence model when it loads.
- Completed one-time tasks and completed recurring occurrences stay in retained history for 30 days before the backend cleanup scheduler removes them.
- Web Push requires `https` in production or `http://127.0.0.1` / `http://localhost` during local development.
- On iPhone and iPad, Task Notifications require installing the web app to the home screen before enabling notifications from Help.
- On smaller screens, the app uses bottom navigation, a swipe-through Week view with single-step settled paging and default Time Grid focus, press-held time-range task creation in Week, a refreshed Month task grid with direct vertical swipe navigation plus a quick jump-to-current-month action, and full-screen editing dialogs to keep controls touch-friendly. When a task dialog opens, the mobile bottom navigation hides until that task window closes.
- The login page language switch uses the same bilingual copy system as the signed-in app, so authentication flows can be changed before sign-in.
- Keep backend running before opening the frontend locally.
- New account names are normalized by the backend so extra spaces and mixed casing do not create duplicate-looking accounts.
