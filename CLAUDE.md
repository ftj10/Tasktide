# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TaskTide is a weekly todo/task manager with a React + TypeScript frontend and an Express + MongoDB backend. It supports recurring tasks, reminders, push notifications, offline sync, ICS import, and a bilingual UI (English/Simplified Chinese).

## Commands

### Development

```bash
# Start frontend dev server (proxies /api to port 2676)
cd frontend && npm run dev

# Start backend
cd backend && node server.js

# Lint frontend
cd frontend && npm run lint
```

### Testing

```bash
# Run all tests (from root)
npm test

# Frontend tests (watch mode)
cd frontend && npm run test

# Frontend tests (single run)
cd frontend && npm run test:run

# Behavior tests only
npm run test:behavior

# Smoke tests only
npm run test:smoke

# Backend tests directly
cd backend && node --test tests/**/*.test.js
```

### Build

```bash
# Production build (TypeScript check + Vite build)
cd frontend && npm run build
```

## Code Comments

Do not add explanation comments. Do not include meta-comments such as "here is the update". Only add comments for non-trivial features using this exact format:

```
// INPUT: <what goes in>
// OUTPUT: <what comes out>
// EFFECT: <side effects or state changes>
```

## Versioning

Increment the project version on every modification:

- **Patch** (`x.y.Z`) for bug fixes
- **Minor** (`x.Y.0`) for new features

## Required Updates Per Change

Every bug fix, refactor, or new feature must update all of the following:

### 1. `RELEASENOTES.md` — Client-Facing

Write as a product update notification aimed at users. Focus on what users can now do. No technical jargon.

```
## Version {version} – Update Released ({date})

### What's New
- Added: {user-facing feature explanation}

### Improvements
- Improved: {user-facing improvement explanation}

### Fixes
- Fixed: {user-facing bug fix explanation}
```

### 2. `frontend/src/app/releaseNotes.ts` — In-App Release History

Prepend a new entry to the `RELEASE_NOTES` array. Every entry must include bilingual (`en` and `zh`) title, summary, and changes. Follow the existing entry shape exactly:

```ts
{
  id: "{YYYY-MM-DD}-{short-slug}",
  version: "v{version}",
  releasedAt: "{YYYY-MM-DD}",
  title: { en: "...", zh: "..." },
  summary: { en: "...", zh: "..." },
  changes: {
    en: ["Added: ...", "Improved: ...", "Fixed: ..."],
    zh: ["新增 ...", "改进 ...", "修复 ..."]
  }
}
```

The `changes` strings must mirror the RELEASENOTES.md bullets — same content, same user-facing tone, no technical jargon.

### 3. Help Center (`frontend/src/app/helpCenter.ts`) — User Guidance

The Help Center must always contain and maintain exactly these three sections:

**Section 1 — How To Use This Website**
- Explains the full product workflow from start to finish
- Beginner-friendly; avoids feature-by-feature fragmentation
- Covers: what the app is for, how to get started, the main creation→management→completion flow
- May include short usage scenarios (e.g., "If you want to plan your week…")
- Must be improved with every meaningful feature change

**Section 2 — Quick Walkthroughs**
- Short, task-oriented guides for features that are hard to explain in words
- Step-by-step (click, drag, swipe), kept concise
- Add a new walkthrough for every new interactive feature

**Section 3 — Common Q&A**
- Clickable questions, each revealing a direct answer
- Covers confusion, edge cases, and "why does this happen?" scenarios
- Add entries for any new behavior that is likely to confuse users

### 4. `README.md` — Public Developer Overview

Include:
- Project overview and high-level feature summaries
- Setup instructions and environment configuration
- Architecture notes

Do **not** include detailed change history or internal debugging notes.

### 5. `DEVLOG.md` — Internal Development Log

Include:
- Exact technical changes and file-level modifications
- Design decisions, reasoning, and trade-offs
- Known limitations or edge cases

This is for maintainers only — not user-facing.

### 6. Tests

Add or update unit/integration tests for every change. Coverage must reflect new behavior and bug fixes. Frontend tests use Vitest (`.behavior.test.ts` for features, `.smoke.test.ts` for startup). Backend tests use Node's built-in runner.

## Architecture

### Stack

- **Frontend:** React 18 + TypeScript, Vite 7, MUI v7, FullCalendar v6, React Router v6, i18next
- **Backend:** Node.js, Express v5, MongoDB + Mongoose, JWT (HttpOnly cookies), Web Push API
- **Dev proxy:** Vite proxies `/api` → `http://127.0.0.1:2676` (backend port)

### Backend (`backend/server.js`)

A single-file Express app (~800 lines). Key route groups:
- Auth: `/register`, `/login`, `/logout`, `/session`
- Tasks: `/tasks`, `/tasks/:id`
- Reminders: `/reminders`, `/reminders/:id`
- Help: `/help-questions`, `/help-questions/:id`
- Notifications: `/notifications/public-key`, `/notifications/subscriptions`

Security middleware stack: CORS → CSRF origin check → JWT validation (HttpOnly cookie). All mutating routes require a valid JWT. Sessions are cookie-based with no JS token access.

Background processes run alongside the server: `notificationScheduler.js` (reminder delivery via Web Push) and `taskRetention.js` (cleanup of old completed tasks).

### Frontend Page Architecture

`App.tsx` holds global auth state and sets up React Router. **`TodayPage.tsx` is eager-loaded** (default route); all other pages (`WeekPage`, `MonthPage`, `HelpPage`, `ReminderPage`) and `ReleaseNotesCenter` are **lazy-loaded** via `React.lazy`. The Vite build splits MUI/Emotion into `mui-vendor.js` and FullCalendar into `calendar-vendor.js`.

### Key Frontend Modules

| File | Purpose |
|---|---|
| `app/tasks.ts` | Recurrence logic and task transforms |
| `app/storage.ts` | LocalStorage sync and offline operation queue |
| `app/pushNotifications.ts` | Web Push subscription management and service worker registration |
| `app/helpCenter.ts` | Help center state and onboarding flow |
| `app/ics.ts` | ICS calendar file import parsing |
| `i18n.ts` | All bilingual strings (English + Simplified Chinese) — 51KB |
| `types.ts` | Shared TypeScript types: `Task`, `Reminder`, `User` |

### Recurrence Model

Tasks support `once | daily | weekly | monthly | yearly` recurrence. Individual occurrences can have per-instance overrides stored separately in the task document. This lives in `app/tasks.ts` and the Mongoose `Task.js` model — changes to recurrence logic affect both.

### Offline Sync

`app/storage.ts` manages a LocalStorage operation queue. Mutations are queued offline and replayed on reconnection with timestamp validation to detect conflicts. This is separate from the service worker, which only caches the app shell.

### Push Notifications

VAPID keys live in `backend/.env`. Subscriptions are upserted by endpoint to avoid duplicates (`pushNotifications.js`). Users opt in explicitly from the Help Center — there is no automatic permission prompt. `notificationScheduler.js` drives scheduled delivery.

### i18n

All UI strings live in `frontend/src/i18n.ts`. When adding new UI text, add both `en` and `zh` keys. The app detects the browser language on first load and allows manual override.

### Environment Variables (`backend/.env`)

```
PORT=2676
MONGODB_URI=...
JWT_SECRET=...
CORS_ORIGIN=...               # Required for cross-host deploys
SESSION_COOKIE_SAME_SITE=...  # Override cookie SameSite
SESSION_COOKIE_SECURE=...     # Override cookie Secure flag
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
WEB_PUSH_SUBJECT=mailto:...
ADMIN_USERNAMES=user1,user2   # Comma-separated
```

## Permissions & Autonomy

Claude has full permission to:
- Read any file in this project
- Write, edit, and delete any file in this project
- Run any bash/shell commands needed to complete tasks
- Install dependencies (npm, pip, etc.)
- Execute scripts, builds, lints, tests

**Never ask for confirmation before running commands or editing files.
Just do it, then report what was done.**

The only exception: never read or modify `backend/.env`

## When to Ask vs. Act

**Just do it (no confirmation needed):**
- Reading files, grepping, searching
- Editing source files
- Running dev commands (build, lint, test, format)
- Installing packages

**Stop and ask first:**
- Deleting more than one file at a time
- Making changes outside this project directory
- Anything involving git push or deployment

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`github.com/ftj10/TODO`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context layout — `CONTEXT-MAP.md` at root points to `frontend/CONTEXT.md` and `backend/CONTEXT.md`. See `docs/agents/domain.md`.