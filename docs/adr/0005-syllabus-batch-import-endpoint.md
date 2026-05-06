# Syllabus import uses a new POST /tasks/batch endpoint with atomic all-or-none semantics

Importing a syllabus creates 15–25 tasks in one operation. Using sequential individual `POST /tasks` requests risks partial state: if request 8 of 15 fails, the user has a partially imported schedule with no clear indication of what is missing. A partial import is worse than a failed import for a schedule-critical feature.

`POST /tasks/batch` accepts a validated array of Task objects, enforces a max batch size, and creates all tasks atomically. If any task fails validation or the write fails, no tasks are saved. The frontend preserves the import draft in localStorage on failure so the user can fix and retry without re-uploading their syllabus.

**Consequence:** This is a new backend route with its own auth, per-task validation, and tests. The max batch size must be enforced to prevent abuse.
