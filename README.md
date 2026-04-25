# Weekly To-Do Application

Current version: `v1.6.0`

Weekly To-Do is a full-stack planner for daily tasks, weekly routines, reminders, shared help questions, and calendar-based scheduling.

Deployed Web: [website](https://todo-cfun.onrender.com/)

## Features

- Secure registration and login with JWT-backed sessions.
- Login and registration screens support an `EN` / `中文` switch before authentication.
- Today, Week, and Month planning views for temporary and recurring tasks.
- Mobile Week view with a horizontal swipe flow that shows 4 days first, then the remaining 3 days, and continues into the next week.
- Reminder tracking with priority ordering and completion flow.
- Shared help center with FAQ content and public user questions.
- Responsive application shell with a desktop sidebar, mobile bottom navigation, and full-screen mobile task and reminder forms.
- Idempotent save routes and client-side recovery that reload persisted planner data after a failed task or reminder sync.
- Map links for task locations and browser notifications for daily prompts and upcoming timed tasks.
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
- On smaller screens, the app uses bottom navigation, a swipe-through Week view that advances into the next week, and full-screen editing dialogs to keep controls touch-friendly.
- The login page language switch uses the same bilingual copy system as the signed-in app, so authentication flows can be changed before sign-in.
- Keep backend running before opening the frontend locally.
