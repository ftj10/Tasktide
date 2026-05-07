# Findings

## Session Findings
- `App.tsx` currently owns language, install fallback dialog, syllabus import dialog, and logout controls in the mobile toolbar and desktop sidebar.
- `TodayPage.tsx` owns the existing ICS import merge flow through `parseIcsTasks`; `ics.ts` does not currently export `importTasksFromIcs`.
- Authentication uses an HttpOnly `tasktide_session` cookie plus localStorage username/role profile keys.
- Backend tests use in-process Express invocation and direct model/function stubs.
