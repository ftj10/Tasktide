# Backend Context

The backend is a single-file Express + MongoDB API. It owns auth, task persistence, reminders, push notifications, and the syllabus AI endpoint — which receives extracted text from the browser, calls the configured AI provider, and returns SyllabusTaskDraft items.

## Language

**Task**:
A MongoDB document representing a user's planner item. The authoritative persisted form of what the frontend calls a Task.
_Avoid_: Todo, record, event

**User**:
An authenticated account. Tasks, Reminders, and HelpQuestions all belong to a User via `userId`.
_Avoid_: Account, member, student

**Reminder**:
A standalone sticky-note-style item with urgency. Not date-scheduled, not recurring.
_Avoid_: Notification, alert, note

**Syllabus AI Endpoint**:
`POST /syllabus/generate-drafts` — receives extracted syllabus text and study preferences, calls the configured AI provider, and returns a `SyllabusTaskDraft[]`. The raw file never reaches this endpoint.
_Avoid_: Upload endpoint, parse endpoint

**Batch Import Endpoint**:
`POST /tasks/batch` — accepts a validated array of `Task` objects and creates all atomically. If any task fails validation or the write fails, no tasks are saved.
_Avoid_: Bulk insert, multi-create

## Flagged ambiguities

- "Upload" in the syllabus feature does not mean the backend stores files — resolved: raw syllabus files are parsed client-side. The backend has no file storage role in MVP.
