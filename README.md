# Weekly To-Do Application

Current version: `v1.10.0`

Weekly To-Do is a full-stack planner for daily tasks, weekly routines, reminders, shared help questions, and calendar-based scheduling.

Deployed Web: [website](https://todo-cfun.onrender.com/)

## Features

- Secure registration and login with JWT-backed sessions and persisted `USER` / `ADMIN` roles.
- Login and registration screens support an `EN` / `中文` switch before authentication.
- Today, Week, and Month planning views for one-time and recurring tasks.
- Task forms now use a `Begin date` field plus a repeat-options window that supports once, daily, weekly, monthly, and yearly schedules.
- The repeat-options window now matches the main task editor size on desktop and opens full-screen on mobile.
- The repeat-options selector now sits slightly lower in its dialog so the `Repeat` label stays fully visible below the header.
- Repeating task edits can target either one occurrence or the full series without destroying older task data.
- Mobile Week view opens in Time Grid by default, keeps a horizontal swipe flow that shows 4 days first and then the remaining 3 days, and creates tasks from a press-held time range instead of a global add button.
- Month view now uses the refreshed card-based calendar UI, keeps desktop previous and next arrow controls, keeps mobile vertical swipe navigation between months, and includes a `Jump to Current Month` button.
- Reminder tracking with priority ordering and completion flow.
- Role-based help center with FAQ content, append-only user questions, admin-wide review access, and admin-only question deletion.
- Help-question posting now keeps the draft visible if the request fails instead of showing a false success state.
- Week view now respects one-day recurring-task time overrides when placing events on the calendar.
- Week view now generates recurring events only for the visible range and reuses cached occurrence windows for repeated range renders.
- Responsive application shell with a desktop sidebar, mobile bottom navigation, and full-screen mobile task and reminder forms.
- The mobile bottom navigation hides automatically while add-task and edit-task dialogs are open, then returns after the task dialog closes.
- Idempotent save routes and client-side recovery that reload persisted planner data after a failed task or reminder sync.
- Map links for task locations and browser notifications for daily prompts and upcoming timed tasks.
- Browser notifications now request permission only after a user interaction, tolerate timer drift for daily and task reminders, and keep one retained local record that clears reminder markers older than three days.
- Consistent `INPUT` / `OUTPUT` / `EFFECT` code comments across source and test files for faster feature scanning during maintenance.

## Stack

- Frontend: React 18, TypeScript, Vite, MUI, FullCalendar, Day.js, React Router.
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
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend `.env`:

```env
VITE_API_URL=http://127.0.0.1:2676
```

Workspace tests:

```bash
npm test
```

## Notes

- Review [RELEASENOTES.md](RELEASENOTES.md) for repository-level changes.
- The in-app Updates center mirrors the latest shipped release metadata from `frontend/src/app/releaseNotes.ts`.
- Shared help questions are stored as new posts on the server, so another signed-in user cannot overwrite an older question by reusing its client-side id.
- Standard users can only read their own submitted help questions, while `ADMIN` accounts can review all questions.
- The `My Questions` section is the normal non-admin view; it means the account is a `USER`, not an `ADMIN`.
- Admin accounts can delete help questions directly from the Help Center.
- `ADMIN_USERNAMES` lets you promote accounts to admin by username, including older accounts that still show `role: USER` in the dataset.
- Older user records that do not yet have a `role` field are backfilled on the next successful login.
- Older datasets that still use `TEMPORARY` and `PERMANENT` task records remain readable; the frontend normalizes them into the new recurrence model when it loads.
- On smaller screens, the app uses bottom navigation, a swipe-through Week view with single-step settled paging and default Time Grid focus, press-held time-range task creation in Week, a refreshed Month task grid with direct vertical swipe navigation plus a quick jump-to-current-month action, and full-screen editing dialogs to keep controls touch-friendly. When a task dialog opens, the mobile bottom navigation hides until that task window closes.
- The login page language switch uses the same bilingual copy system as the signed-in app, so authentication flows can be changed before sign-in.
- Keep backend running before opening the frontend locally.
