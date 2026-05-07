# TaskTide 2.10.0 Feature Plan

## Goal
Implement Settings, account management, email notifications, forgot password, reset password, and admin email broadcast across frontend and backend.

## Phases
| Phase | Status | Verification |
|---|---|---|
| Phase 1 Settings Page + relocate existing features | complete | frontend lint/test, backend tests |
| Phase 2 Password change + account switching | complete | frontend lint/test, backend tests |
| Phase 3 Email system + forgot/reset/admin broadcast | complete | frontend lint/test, backend tests, frontend build |

## Required Every Phase
- Bump frontend and backend versions to 2.10.0.
- Update RELEASENOTES.md, frontend/src/app/releaseNotes.ts, frontend/src/app/helpCenter.ts, README.md, DEVLOG.md.
- Add or update tests.
- Do not read or modify backend/.env.
- All new UI strings go through frontend/src/i18n.ts with en and zh entries.

## Errors Encountered
| Error | Attempt | Resolution |
|---|---|---|
| Existing app behavior test looked for removed toolbar language button | Phase 1 frontend test run | Updated test to navigate to Settings and use the relocated language control |
| Help Center count test expected old walkthrough total | Phase 2 frontend test run | Updated expected total from 9 to 10 after adding account settings walkthrough |
| New unsafe backend route tests were blocked by CSRF cookie-origin guard | Phase 2 backend test run | Switched route tests to bearer-token auth so they test account behavior without cookie CSRF setup |
| `npm install nodemailer` could not reach registry.npmmirror.com from sandbox | Phase 3 dependency install | Added dependency to backend package.json and implemented email service with safe fallback; package-lock could not be regenerated without network |
| Admin email page behavior test queried required MUI labels exactly | Phase 3 frontend test run | Switched assertions to role/name regex queries that tolerate MUI required asterisks |
| Frontend build caught Settings test type issues | Phase 3 build | Typed the SettingsPage test props and fixed the `changeLanguage` spy return type |
