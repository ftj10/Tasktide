# Development Log

## Version 2.8.1
Update Date: 2026-05-06

### Changes

**`backend/syllabusAnalysis.js`**
- Added deterministic section ambiguity detection before parsing Claude's ambiguity response.
- When syllabus text contains more than one section-like identifier, ambiguity detection now includes `Which section are you enrolled in?`.
- Tightened the Claude ambiguity prompt to explicitly ask which section applies when multiple sections, labs, tutorials, or section-specific schedules are present.
- Merges the deterministic section question with Claude questions, de-duplicates, and keeps the existing five-question cap.

**`backend/tests/syllabusAnalysis.detectAmbiguities.test.js`**
- Added regression coverage for multi-section syllabi where Claude returns `[]`.
- Added prompt coverage that section selection is explicitly prioritized.

**`frontend/src/app/releaseNotes.ts`**
- Added the in-app v2.8.1 update note for the section clarification fix.

**`README.md`, `RELEASENOTES.md`, `package.json`, `backend/package.json`, `backend/package-lock.json`, `frontend/package.json`, `frontend/package-lock.json`**
- Bumped version from `2.8.0` to `2.8.1` and documented the user-facing fix.

### Debugging observations
- The route was working, but ambiguity detection depended on Claude deciding that multiple sections were ambiguous.
- A syllabus with `Section A01` and `Section B02` could return no questions if Claude considered the excerpt clear enough.

### Design decision
- Section selection is now handled as a deterministic pre-check because choosing the wrong section directly changes generated lecture, lab, tutorial, and exam tasks.

## Version 2.8.0
Update Date: 2026-05-06

### Changes

**`backend/syllabusAnalysis.js`**
- Added `detectAmbiguities(text, overrideClient)` using `claude-haiku-4-5-20251001` with `max_tokens: 512`.
- Parses Claude text output as a JSON array of question strings and returns `[]` when parsing fails.
- Changed `generateDrafts()` from `claude-opus-4-7` at `32768` tokens to `claude-sonnet-4-6` at `8192` tokens.
- Replaced the draft-generation prompt with the shorter academic planning item extraction prompt requested for token optimization.
- Left `analyzeSyllabus()` unchanged.

**`backend/server.js`**
- Added authenticated ambiguity detection handlers for `POST /api/syllabus/detect-ambiguities` and the proxy-stripped `POST /syllabus/detect-ambiguities` path.
- Returns `{ questions }`, validates missing `extractedText` as `400`, and maps Claude provider errors to `503`.

**`frontend/src/pages/SyllabusImportDialog.tsx`**
- Added the `clarify` wizard step between consent and review.
- Automatic import now calls ambiguity detection before draft generation.
- If questions are returned, the wizard shows them with an optional clarification answer field and passes the answers into draft generation as `Clarifications: ...`.
- If ambiguity detection returns no questions or fails, automatic import continues directly to draft generation.
- Added the High Quality chip to the Analyze with Claude method option.

**`frontend/src/app/syllabusPrompt.ts`**
- Replaced the manual prompt with a two-step clarify-then-extract workflow.

**`frontend/src/app/syllabusJson.ts`**
- Moved pasted JSON validation out of the dialog module so the dialog file only exports the React component and still shares validation with tests.

**`frontend/src/App.tsx`**
- Added the stable toast setter to the `showToast` callback dependency list to satisfy the React hooks lint rule without changing callback behavior.

**`frontend/src/components/ChunkErrorBoundary.tsx`**
- Replaced the local fallback component function with a `Translation` render prop inside the existing class boundary so fast-refresh linting passes while preserving the offline chunk fallback UI.

**`frontend/eslint.config.js`**
- Allowed the class-based `ChunkErrorBoundary` export name for the fast-refresh rule because error boundaries must remain class components.

**`frontend/tests/syllabus-extraction.behavior.test.ts`**
- Removed an unused mock argument so the frontend lint command exits cleanly.

**Tests**
- Added `backend/tests/syllabusAnalysis.detectAmbiguities.test.js`.
- Added `frontend/src/pages/SyllabusImportDialog.behavior.test.tsx`.
- Updated prompt and auto-import behavior tests for the new clarify-first flow.
- Added direct coverage for `/syllabus/detect-ambiguities` because Vite rewrites frontend `/api/syllabus/detect-ambiguities` requests to that backend path in local development.

**Documentation and release metadata**
- Bumped frontend, backend, and workspace package versions to `2.8.0`.
- Updated release notes, in-app release notes, Help Center walkthrough content, README, and this development log.

### Design decisions
- Registered both `/api/syllabus/detect-ambiguities` and `/syllabus/detect-ambiguities` so direct backend tests and the Vite `/api` proxy path both resolve correctly.
- Kept clarification answers as appended study preferences to avoid expanding the draft-generation API contract.

## Version 2.7.3
Update Date: 2026-05-05

### Changes

**`backend/syllabusAnalysis.js`**
- Increased `max_tokens` from `8192` to `32768` in both `analyzeSyllabus` and `generateDrafts`. Root cause: the Claude API was hitting the token limit mid-way through generating the JSON tool input, returning `stop_reason: 'max_tokens'` with a truncated/empty `input: {}`. The SDK cannot parse the partial JSON, so `toolUse.input.tasks` was always `undefined`, producing `[]` silently.
- Added explicit `stop_reason === 'max_tokens'` guard after the API call in both functions. If truncation still occurs (e.g., for an extreme input), the route now returns 502 with a clear error instead of silently returning `[]`.

**`backend/tests/syllabus-analysis.behavior.test.js`**
- Added test: `analyzeSyllabus - max_tokens truncation throws claudeError`.

**`backend/tests/syllabus-generate.behavior.test.js`**
- Added test: `generateDrafts - max_tokens truncation throws claudeError`.

- Switched both functions from `client.messages.create()` to `client.messages.stream().finalMessage()`. Root cause: the Anthropic SDK v0.92 enforces a pre-request check — `(60min × max_tokens) / 128000 > 10min` — and throws "Streaming is required" before sending any request. With `max_tokens: 32768` the estimated time is ~15 min, triggering the guard. Using `.stream().finalMessage()` satisfies the SDK and returns an identical `Message` object with no parsing changes required.

### Design decision
`max_tokens: 32768` gives comfortable headroom for syllabi with ~100+ entries at ~200 tokens/task. The `.stream().finalMessage()` pattern is the SDK-recommended approach for large outputs; it streams internally and resolves to the same `Message` type so no response-parsing code changes were needed. The `stop_reason === 'max_tokens'` guard remains as a safety net for pathologically large inputs.

## Version 2.7.2
Update Date: 2026-05-05

### Changes

**`frontend/src/pages/SyllabusImportDialog.tsx`**
- Replaced the automatic Claude path request from `POST /api/syllabus/analyze` to `POST /api/syllabus/generate-drafts`.
- Sends `{ extractedText, studyPreferences }` so the automatic path uses the same stronger draft-generation backend flow as the newer syllabus import endpoint.

**`backend/syllabusAnalysis.js`**
- Broadened both AI prompts from "schedule events" to "academic planning items".
- Prompt now explicitly asks for exams, assignments, projects, quizzes, readings, labs, tutorials, lectures, office hours, prep work, and dated or recurring course obligations.

**`frontend/tests/syllabus-import.behavior.test.tsx`**
- Added regression coverage that automatic analysis posts to `/api/syllabus/generate-drafts` with `extractedText` and `studyPreferences`.

**`backend/tests/syllabus-analysis.behavior.test.js`**
- Added regression coverage that the legacy analysis prompt asks for broad academic planning items.

**`backend/tests/syllabus-generate.behavior.test.js`**
- Added regression coverage that draft generation asks for broad academic planning items.

**`frontend/src/i18n.ts`**
- Updated Help Center syllabus import Q&A copy in English and Chinese to explain the broader extraction scope.

**`frontend/src/app/releaseNotes.ts`**
- Added the in-app v2.7.2 update note for better automatic syllabus extraction.

**`README.md`**
- Updated the syllabus feature overview to mention the broader extraction scope.

**`RELEASENOTES.md`**
- Added the v2.7.2 client-facing release note.

**`package.json`, `backend/package.json`, `backend/package-lock.json`, `frontend/package.json`, `frontend/package-lock.json`**
- Bumped version from `2.7.1` to `2.7.2`.

### Design decisions
- Kept `/syllabus/analyze` in place for backward compatibility, but stopped using it from the current wizard automatic path.
- The stronger endpoint is preferred because it already accepts study preferences and was designed for draft generation rather than the earlier minimal analysis flow.

## Version 2.7.1
Update Date: 2026-05-05

### Changes

**`backend/syllabusAnalysis.js`**
- Loads `backend/.env` from the module directory so syllabus analysis sees `ANTHROPIC_API_KEY` even when the module is called outside `server.js`.
- Creates Anthropic clients with an explicit `apiKey` instead of relying on implicit environment discovery.
- Removed `thinking: { type: 'adaptive' }` from forced tool-use syllabus requests because Anthropic rejects thinking when `tool_choice` forces a tool call.
- `analyzeSyllabus()` now wraps Claude request failures with `claudeError` and preserves upstream status for route handling.

**`backend/server.js`**
- `/syllabus/analyze` now returns `502` for Claude provider failures instead of collapsing them into the generic `500` analysis failure response.

**`backend/tests/syllabus-analysis.behavior.test.js`**
- Updated provider failure coverage for `/syllabus/analyze` to expect `502`.
- Added regression coverage that forced tool-use requests do not include `thinking`.

**`backend/tests/syllabus-generate.behavior.test.js`**
- Added regression coverage that `generateDrafts()` forced tool-use requests do not include `thinking`.

**`frontend/src/app/releaseNotes.ts`**
- Added the in-app v2.7.1 update note for the syllabus auto-analysis fix.

**`frontend/src/i18n.ts`**
- Updated Help Center Q&A copy in English and Chinese to point users to the manual prompt path when automatic syllabus analysis is unavailable.

**`README.md`**
- Added `ANTHROPIC_API_KEY` to the backend `.env` setup example.

**`RELEASENOTES.md`**
- Added the v2.7.1 client-facing release note.

**`package.json`, `backend/package.json`, `backend/package-lock.json`, `frontend/package.json`, `frontend/package-lock.json`**
- Bumped version from `2.7.0` to `2.7.1`.

### Debugging observations
- `backend/.env` contained `ANTHROPIC_API_KEY`, and a direct SDK call succeeded after loading dotenv.
- The failing syllabus request returned Anthropic HTTP 400: thinking cannot be enabled when tool use is forced.
- After removing `thinking`, a live minimal syllabus analysis returned one draft with a description.

## Version 2.7.0
Update Date: 2026-05-05

### Changes

**`frontend/src/app/syllabusPrompt.ts`**
- Added an explicit prompt rule requiring every generated syllabus task to include a concise `description`.
- Description guidance asks for one useful sentence drawn from syllabus context, including topics, deliverables, grading weight, preparation, location context, or confident AI-suggested study context.

**`backend/syllabusAnalysis.js`**
- Added `DESCRIPTION_REQUIREMENT` and injected it into both `analyzeSyllabus()` and `generateDrafts()` Claude prompts.
- Keeps manual prompt and backend prompt behavior aligned without changing the `SyllabusTaskDraft` schema or task transformation.

**`frontend/tests/syllabus-prompt.behavior.test.ts`**
- Added regression coverage that the manual prompt requires a concise description for every extracted task.

**`backend/tests/syllabus-analysis.behavior.test.js`**
- Added regression coverage that `/syllabus/analyze` prompt construction requires concise descriptions.

**`backend/tests/syllabus-generate.behavior.test.js`**
- Added regression coverage that `generateDrafts()` prompt construction requires concise descriptions.

**`frontend/src/i18n.ts`**
- Updated Help Center manual syllabus walkthrough and Q&A copy in English and Chinese to explain that AI-generated tasks should include short descriptions and can be edited during review.

**`frontend/src/app/releaseNotes.ts`**
- Added the in-app v2.7.0 update note for clearer syllabus task details.

**`README.md`**
- Updated the feature overview to mention concise AI-generated task descriptions during syllabus import.

**`RELEASENOTES.md`**
- Added the v2.7.0 client-facing release note.

**`package.json`, `backend/package.json`, `backend/package-lock.json`, `frontend/package.json`, `frontend/package-lock.json`**
- Bumped version from `2.6.0` to `2.7.0`.

### Design decisions
- `description` remains schema-optional so older pasted JSON and existing saved drafts still validate.
- The fix is prompt-level because the observed failure is AI output omission, not task transformation loss. Existing transformation already preserves `draft.description` when present.

## Version 2.6.0
Update Date: 2026-05-05

### Changes

**`.claude/skills/tasktide-agent-workflow/SKILL.md`**
- Changed the quick-start workflow so implementation and test work must route to Codex.
- Changed the Claude Code Codex plugin guidance so `/codex:rescue --background` is required for implementation, bug investigation, and tests when the plugin is available.
- Changed the no-plugin fallback so running the generated Codex prompt remains the required next action.

**`.claude/skills/tasktide-agent-workflow/REFERENCE.md`**
- Updated the detailed TDD and Codex handoff rules so Claude must not treat Codex execution as optional for implementation or tests.
- Updated the unavailable-plugin fallback to require manual Codex execution as the next action.

**`backend/tests/agents-doc.behavior.test.js`**
- Added regression coverage for mandatory Codex execution wording in the TaskTide agent workflow skill and reference.

**`frontend/package.json`**
- Added `mammoth` dependency for client-side Word document (.docx) text extraction.

**`frontend/src/app/syllabusExtraction.ts`**
- Added `extractDocx(file)` using `mammoth.extractRawText` with `arrayBuffer` input (browser-compatible path).
- Routed `.docx` extension to `extractDocx` in the `extract` dispatch function.

**`frontend/src/pages/SyllabusImportDialog.tsx`**
- Added `uploadedFiles: File[]` state to track queued files separately from paste text.
- Removed immediate navigation on file select — files now appear as removable `Chip` elements; extraction and navigation happen on Next click.
- `handleFileChange` is now synchronous: validates extensions immediately, adds valid files to `uploadedFiles`, shows `fileTypeError` for unsupported types without calling `extract`.
- `handleContinueUpload` is now async: extracts all queued files in parallel via `Promise.all`, combines results with paste text using `\n---\n` separator, then navigates to method step.
- "Next" button disabled when both `uploadedFiles` is empty and `pasteText` is blank.
- File input updated to `accept=".pdf,.csv,.docx"` and `multiple`.
- `handleClose` resets `uploadedFiles` and `extracting` state.

**`frontend/src/i18n.ts`**
- Updated English and Chinese syllabus import copy so the upload button, walkthrough, and Q&A mention PDF, CSV, and DOCX files.

**`frontend/tests/syllabus-extraction.behavior.test.ts`**
- Added `vi.mock("mammoth", ...)` returning mocked `extractRawText`.
- Replaced the "DOCX throws" test with a "DOCX extracts plain text" test.
- Kept the "xlsx throws" test.

**`frontend/tests/syllabus-import.behavior.test.tsx`**
- Updated "triggers auto analysis when file uploaded" test to click Next after upload (file no longer auto-navigates).
- Updated "shows file type error" test to remove the `extract` mock (error is now thrown from extension check, not from extract).
- Added coverage for the upload button copy listing PDF, CSV, and DOCX support.
- Added: "Next button enabled when a file is queued but paste text is empty".
- Added: "uploaded files appear as removable chips; removing a chip disables Next again".

### Design decisions
- Files are not extracted on select to keep the UI responsive. Extraction runs on Next click, allowing the user to review their queue first.
- Unsupported types are rejected at the extension-check level (in the dialog), not at the extraction level. This gives immediate feedback without an async round-trip.
- `pasteText` state tracks only what the user typed; `extractedText` holds the combined result after Next is clicked. This keeps the two sources independent and makes draft serialization straightforward (File objects can't be serialized to localStorage; combined text can).

## Version 2.5.2
Update Date: 2026-05-05

### Changes

**`frontend/src/pages/ReminderPage.tsx`**
- Split reminder completion away from the create/edit `upsert` helper.
- Root cause: completing a reminder reused `upsert`, which derived the toast from dialog edit state. When no edit dialog was active, completion was classified as create and showed "Reminder created".
- Fix: completion now updates the matching reminder directly and shows a dedicated completion toast.

**`frontend/src/i18n.ts`**
- Added `toast.reminderDone` in English and Chinese.

**`frontend/tests/reminder-page.behavior.test.tsx`**
- Added regression coverage asserting reminder completion shows "Reminder completed" and does not show "Reminder created".

## Version 2.5.1
Update Date: 2026-05-05

### Changes

**`frontend/src/components/TaskDialog.tsx`**
- Added `props.open` to the `base` `useMemo` dependency array.
- Root cause: the `base` memo computed a fresh UUID for create mode once and cached it. When the dialog closed and reopened with no other prop changes, `base` did not recompute, so the same UUID was reused. `saveTaskCollection` then filtered out the existing task with that UUID before appending the "new" task, silently replacing the previously created task.
- Fix: adding `props.open` forces `base` to recompute on every open, guaranteeing a unique id per create session.

**`frontend/tests/task-dialog.behavior.test.tsx`**
- Added regression test: opens the dialog twice in create mode (simulate close → reopen) and asserts that each saved task gets a distinct id.

## Version 2.5.0
Update Date: 2026-05-05

### Changes

**`frontend/src/pages/SyllabusImportDialog.tsx`**
- Refactored step model from `number + consentText` to a named `WizardStep` union type: `upload | method | preferences | prompt | paste | consent | review`.
- Added `method` step: two option buttons let the user pick Manual (copy prompt) or Automatic (send to Claude).
- Added `preferences` step (manual path): optional free-text field appended to the generated prompt.
- Added `prompt` step (manual path): displays the full generated prompt in a scrollable `<pre>`, with a one-click copy button and a privacy disclosure ("Nothing is sent anywhere").
- Added `paste` step (manual path): JSON textarea + `validatePastedJson` (exported pure function) that runs `SyllabusTaskDraftSchema.safeParse` per item and surfaces field-level errors without clearing input.
- Fixed silent swallow of `extract()` errors on file upload — unsupported types (e.g. `.xlsx`) now display the error message from `syllabusExtraction.ts` in an `Alert`.
- `goBack()` tracks `wizardMode` ("manual" | "auto") so Back from review returns to `paste` (manual) or `consent` (auto).
- `SavedDraft` shape extended: `wizardStep: WizardStep`, `extractedText`, `studyPreferences` fields added; `step: number` removed.

**`frontend/src/app/syllabusPrompt.ts`**
- `buildSyllabusPrompt(text, preferences?)` — added optional `preferences` parameter injected as a "User preferences:" block before the syllabus text.

**`frontend/src/i18n.ts`**
- Added 16 new en+zh key pairs under `syllabus.*`: `next`, `fileTypeError`, `methodTitle`, `methodManual`, `methodManualDesc`, `methodAuto`, `methodAutoDesc`, `preferencesTitle`, `preferencesLabel`, `preferencesPlaceholder`, `preferencesHint`, `promptTitle`, `promptPrivacy`, `promptCopy`, `promptCopied`, `promptNext`, `pasteJsonTitle`, `pasteJsonLabel`, `pasteJsonNext`, `pasteJsonError`.
- Updated `q20` answer (en + zh) to describe both manual and auto paths.
- Added `walkthroughs.syllabusManual` (en + zh): step-by-step guide for the manual import flow.

**`frontend/tests/syllabus-wizard.behavior.test.ts`**
- Updated `SavedDraft` type to match new schema (`wizardStep`, `extractedText`, `studyPreferences`).
- Added `validatePastedJson` test suite: covers invalid JSON syntax, non-array top-level, missing required fields, mixed valid/invalid items, fully valid arrays, and empty arrays.

**`frontend/tests/syllabus-import.behavior.test.tsx`**
- Rewrote `analyzeWithConsent` helper to go through the new method-select step.
- Updated all existing auto-path tests to use "Next" → "Analyze with Claude" → "Send to Claude" flow.
- Added test: Back from review (auto) returns to consent; Back from review (manual) returns to paste.
- Added manual path describe block: walks preferences → prompt → paste; tests privacy disclosure, clipboard write, invalid JSON errors (field-level), schema validation errors, valid JSON advancing to review.
- Added test: unsupported file type (`.xlsx`) shows the "export to CSV first" error alert.

## Version 2.4.1
Update Date: 2026-05-05

### Changes

**`AGENTS.md`**
- Added root Codex agent instructions covering comment format, versioning, release notes, Help Center structure, README expectations, development log expectations, and test requirements.

**`package.json`** / **`frontend/package.json`** / **`backend/package.json`**
- Aligned package versions to `2.4.1`.

**`frontend/package-lock.json`** / **`backend/package-lock.json`**
- Aligned root package metadata versions to `2.4.1`.

**`RELEASENOTES.md`**
- Added the `2.4.1` client-facing update entry.

**`frontend/src/app/releaseNotes.ts`**
- Added the in-app `v2.4.1` release history entry.

**`frontend/src/i18n.ts`**
- Improved the Help Center website flow copy to point users back to Updates and Help when workflows change.
- Added a Common Q&A entry explaining where users can see recent updates.

**`frontend/src/pages/HelpPage.tsx`**
- Added the syllabus import and recent updates FAQ entries to the rendered Help Center FAQ list.

**`backend/tests/agents-doc.behavior.test.js`**
- Added behavior coverage that verifies `AGENTS.md` exists and retains the required operating sections.

### Design decisions
- Used `AGENTS.md` as the canonical filename because Codex agents discover that file convention automatically.
- Treated the missing agent instruction file as a patch-level process/documentation fix.
- Kept the Help Center update user-facing by directing users to Updates and Help instead of exposing internal implementation details.

### Known limitations
- `AGENTS.md` documents repository expectations but cannot enforce every required update by itself; tests cover its presence and required sections.

## Version 2.4.0
Update Date: 2026-05-04

### Changes

**`backend/models/Task.js`**
- Added `syllabusImportBatchId: { type: String }` field to task schema.
- Added compound index `{ userId: 1, syllabusImportBatchId: 1 }` for efficient batch-scoped queries.

**`backend/server.js`**
- Added `DELETE /tasks/batch/:batchId` route (JWT required). Calls `Task.deleteMany({ userId, syllabusImportBatchId: batchId })` and returns `{ deleted: N }`. Placed before `DELETE /tasks/:id` so Express route precedence is correct.

**`frontend/src/types.ts`**
- Added `syllabusImportBatchId?: string` to the `Task` type.

**`frontend/src/app/storage.ts`**
- Exported `deleteSyllabusBatch(batchId: string)` — calls `DELETE /api/tasks/batch/:batchId`, throws on non-ok so callers handle errors explicitly (no offline retry queue for batch ops).

**`frontend/src/pages/SyllabusImportDialog.tsx`**
- `handleConfirm()` now generates `crypto.randomUUID()` and stamps each task with `syllabusImportBatchId` before calling `callBatchImport`. UUID is frontend-generated so no backend changes were needed to the import route.

**`frontend/src/components/ConfirmDeleteDialog.tsx`**
- Added optional props `syllabusTaskCount?: number` and `onDeleteSyllabus?: () => void`. When `onDeleteSyllabus` is provided, a "Delete all N syllabus tasks" warning button appears between Cancel and Delete. This does not affect the existing delete flow for non-syllabus tasks.

**`frontend/src/pages/TodayPage.tsx`** / **`frontend/src/pages/WeekPage.tsx`**
- Added `reloadTasks?: () => Promise<void>` prop to both pages (wired from App.tsx's `reloadTasksFromServer`).
- Added `removeSyllabusBatch(batchId)` function: calls `deleteSyllabusBatch`, then `reloadTasks()` to replace local state from server — avoids queue-poisoning that would occur if `setTasks` were used after bulk server-side delete.
- `ConfirmDeleteDialog` now receives `syllabusTaskCount` (count of tasks in same batch) and `onDeleteSyllabus` (calls `removeSyllabusBatch`) when the selected task has `syllabusImportBatchId`.

**`frontend/src/App.tsx`**
- Passes `showToast` and `reloadTasks={reloadTasksFromServer}` to `WeekPage` (previously missing both).
- Passes `reloadTasks={reloadTasksFromServer}` to `TodayPage`.

**`frontend/src/i18n.ts`**
- Added `dialog.deleteSyllabusHint`, `dialog.deleteSyllabusAction` (en + zh).
- Added `toast.syllabusDeleted`, `toast.syllabusDeleteFailed` (en + zh).

### Design decisions
- **Frontend UUID generation**: Avoids changing the batch import API shape and keeps the implementation minimal.
- **`reloadTasks` after batch delete**: If we instead called `setTasks(tasks.filter(...))`, App.tsx would diff and fire `DELETE /tasks/:id` for each removed task. Those tasks are already gone (→ 404), which `deleteTask()` handles by enqueuing a retry — poisoning the offline sync queue. Reload from server sidesteps this entirely.
- **Route ordering**: `DELETE /tasks/batch/:batchId` must be registered before `DELETE /tasks/:id` so Express does not match the literal string `batch` as the `:id` parameter.

## Version 2.3.0
Update Date: 2026-05-04

### Changes

**`backend/server.js`**
- Added `POST /syllabus/generate-drafts` (JWT required). Receives `{ extractedText, studyPreferences }`, calls `syllabusAnalysis.generateDrafts()`, returns validated `SyllabusTaskDraft[]`. Returns 400 on missing body, 422 on schema validation failure, 502 on Claude API error. Distinct from `/syllabus/analyze` (no studyPreferences, generic 500).
- Added `BATCH_IMPORT_MAX = 200` constant and guard to `POST /tasks/batch` — returns 400 with message if exceeded.

**`backend/syllabusAnalysis.js`**
- Added `generateDrafts(extractedText, studyPreferences, overrideClient)` — includes studyPreferences in prompt, generates prep tasks for high-priority items. Throws `{ claudeError: true }` on Anthropic API failure, `{ validationError: true }` when all returned tasks fail schema validation.
- Exported `generateDrafts` alongside existing `analyzeSyllabus`.

**`frontend/src/pages/SyllabusImportDialog.tsx`** (updated)
- Full review screen (step 1): one `Card` per `ReviewItem` showing `sourceText`, `sourceType` chip, `confidence: "low"` chip, title, Edit (opens `TaskDialog`), and Delete/Restore toggle.
- Consent gate: clicking Analyze sets `consentText` state — shows the full text to be sent before any API call fires. Confirmed → `runAnalyze(text)`. Cancelled → returns to step 0, no fetch.
- LocalStorage persistence: `saveDraft()` called after successful analyze (step→1), `clearDraft()` called on confirm success and on close/cancel. `loadDraft()` on open checks 24h TTL — expired drafts silently removed. `pendingResume` state shows Alert with Resume/Start Fresh buttons.
- `handleConfirm()` calls `clearDraft()` before the batch API request succeeds.
- `handleClose()` clears all state including `consentText` and `pendingResume`.

**`backend/tests/batch-import.behavior.test.js`** (updated)
- Added stub for `Task.deleteMany` in tests that call the batch route (needed because `cleanupTasksForUser` runs before `updateOne`).
- Added test: batch exceeding 200 tasks returns 400.

**`backend/tests/syllabus-generate.behavior.test.js`** (new)
- 5 behavior tests: unauthenticated 401, missing extractedText 400, successful response 200, Claude API failure 502, schema validation failure 422.

**`frontend/tests/syllabus-import.behavior.test.tsx`** (updated)
- Added `analyzeWithConsent()` helper — clicks Analyze, waits for consent gate, clicks "Send to Claude".
- Added 2 new tests: consent gate shows text before API call; cancelling consent gate returns to step 1 without calling fetch.
- Updated all existing flow tests to go through the consent gate.
- Added `localStorage.clear()` in `beforeEach` to prevent resume prompt from appearing in unrelated tests.

**`frontend/tests/syllabus-wizard.behavior.test.ts`** (new)
- 6 unit tests for `loadDraft`/`saveDraft`/`clearDraft` logic: null when empty, returns within TTL, discards after 24h, clears on remove, persists step-1 state, handles invalid JSON.

**`frontend/src/i18n.ts`** (updated)
- Added syllabus keys: `reviewHeader`, `confidenceLow`, `editItem`, `deleteItem`, `restoreItem`, `confirmImport_one/other`, `importing`, `importSuccess_one/other`, `confirmError`, `resumePrompt`, `resume`, `startFresh`, `consentTitle`, `consentBody`, `consentConfirm`, `consentCancel` (en + zh).
- Updated `q20` help center answer (en + zh) to describe consent gate, review screen, and 24h session save.

## Version 2.2.0
Update Date: 2026-05-04

### Changes

**`frontend/src/pages/SyllabusImportDialog.tsx`** (new)
- Two-step wizard dialog: step 0 accepts paste text or file upload; step 1 shows the extracted draft count (placeholder for full review in #8).
- `callAnalyze(text)` — `POST /api/syllabus/analyze`, throws on non-ok responses.
- `handleAnalyze(input: string | File)` — calls `extract()` when input is a File, then `callAnalyze()`; sets `drafts` and advances to step 1 on success; sets `error` string on failure.
- `handleFileChange` — triggered by hidden `<input type="file" accept=".pdf,.csv">`, delegates to `handleAnalyze`.
- Step 0 actions: Cancel (closes + resets), Analyze (disabled while empty or loading, shows CircularProgress spinner).
- Step 1 actions: Back (returns to step 0 with state intact), Close.
- All strings via i18n `syllabus.*` keys.

**`frontend/src/App.tsx`**
- Added `MenuBookRoundedIcon` import.
- Lazy-imported `SyllabusImportDialog`.
- Added `syllabusImportOpen` state.
- Desktop sidebar: "Import Syllabus" button added to the utility `Stack` above ReleaseNotesCenter.
- Mobile AppBar: `MenuBookRoundedIcon` IconButton added before Install App.
- `<Suspense><SyllabusImportDialog /></Suspense>` rendered at root level.

**`frontend/src/i18n.ts`**
- Added `syllabus` section (en + zh): `importButton`, `step1Title`, `step2Title`, `pasteLabel`, `uploadLabel`, `analyze`, `analyzing`, `analyzeError`, `draftsFound`, `noDraftsFound`, `back`.
- Added `help.faq.q20` (en + zh): syllabus import explainer FAQ.

**`frontend/tests/syllabus-import.behavior.test.tsx`** (new)
- 7 tests: renders step 1 heading, analyze button disabled on empty text, paste→analyze→step 2 draft count, API failure shows error, Back returns to step 1, empty API array shows no-drafts message, file upload triggers analysis with mocked `extract`.

### Design notes
- `extract` is mocked at module level in the test file so file-upload tests don't depend on pdfjs-dist or papaparse.
- Dialog state resets fully on close (`handleClose`) so re-opening always starts at step 0.
- Lazy-loaded at root so it doesn't inflate the initial bundle.
- No GIF walkthrough added to helpCenter.ts yet; deferred until the full review flow (#8) is shipped.

## Version 2.1.0
Update Date: 2026-05-04

### Changes

**`backend/syllabusAnalysis.js`** (new)
- `analyzeSyllabus(text, overrideClient?) → Promise<SyllabusTaskDraft[]>` — calls `claude-opus-4-7` with `thinking: {type: "adaptive"}` and `tool_choice` forced to `submit_syllabus_tasks`, filters out any returned drafts missing required fields before returning.
- `SUBMIT_TOOL` — exported tool definition with full JSON schema for the 12-field `SyllabusTaskDraft` item shape; used by both the route and tests.
- `overrideClient` parameter allows test injection without a real API key.

**`backend/server.js`**
- Added `require('./syllabusAnalysis')` and `POST /syllabus/analyze` route: auth-protected via `authenticateToken`, validates non-empty `text` body, delegates to `syllabusAnalysis.analyzeSyllabus`, returns draft array.

**`backend/tests/syllabus-analysis.behavior.test.js`** (new)
- 7 tests: 401 for unauthenticated, 400 for missing/empty text, 200 with mocked drafts, 500 on API error, draft filtering (invalid items removed), empty array when no `tool_use` block returned.

**`frontend/src/app/syllabusPrompt.ts`** (new)
- `buildSyllabusPrompt(text: string): string` — builds the user-facing Claude prompt encoding all `SyllabusTaskDraftSchema` constraints: 12 sourceTypes with descriptions, confidence rules, YYYY-MM-DD date format, HH:MM 24-hour time format, weekday numbering (1=Mon…7=Sun), once vs recurring rules, verbatim `sourceText` requirement.

**`frontend/tests/syllabus-prompt.behavior.test.ts`** (new)
- 6 tests: verbatim text inclusion, all 12 sourceTypes present, YYYY-MM-DD mentioned, all 3 confidence levels present, weekday convention (1=Monday, 7=Sunday), non-empty output for empty input.

**Dependencies added:** `@anthropic-ai/sdk` (backend)

### Design notes
- Backend uses tool_choice forcing to guarantee structured JSON output rather than prompt-based JSON extraction, which is more robust against preamble/fence leakage.
- `overrideClient` injection pattern avoids module-level client construction at import time, so tests run without `ANTHROPIC_API_KEY` present.
- Prompt generator lives in the frontend to keep schema knowledge co-located with `syllabusSchema.ts`; the backend route uses its own inline prompt for the actual Claude call.

## Version 2.0.0
Update Date: 2026-05-04

### Changes

**`frontend/src/app/syllabusSchema.ts`** (new)
- `SyllabusTaskDraftSchema` — Zod v4 schema for the `SyllabusTaskDraft` type. Single source of truth for AI output validation, TypeScript inference, and tests.
- `transformDraft(draft) → Task` — pure function mapping a validated draft to a `Task`. Covers all 12 `sourceType → emergency` defaults, `excludedDates → occurrenceOverrides` with `deleted: true`, `type: "recurring" → RECURRING + TaskRecurrence` (WEEKLY when `weekdays` present, DAILY otherwise), `type: "once" → ONCE`.
- Exported types: `SyllabusTaskDraft`, `SyllabusImportDraftResult`.

**`frontend/src/app/syllabusExtraction.ts`** (new)
- `extract(input: string | File): Promise<string>` — client-side extractor. Plain text passthrough; PDF via `pdfjs-dist`; CSV via `papaparse` (rows joined with ` | `). Throws a descriptive error for unsupported types with an Excel → CSV hint.
- Worker URL assignment is wrapped in try/catch so it degrades gracefully in test environments.

**`frontend/tests/syllabus-draft.behavior.test.ts`** (new)
- 44 tests covering schema validation (valid drafts, invalid fields, all 12 source types) and all `transformDraft` output cases.

**`frontend/tests/syllabus-extraction.behavior.test.ts`** (new)
- 7 tests covering text passthrough, CSV extraction from a fixture file, PDF extraction with a mocked `pdfjs-dist`, and unsupported-type error messages.

**`frontend/tests/fixtures/sample-syllabus.csv`** (new)
- Fixture CSV used by extraction tests.

**Dependencies added:** `zod@^4`, `pdfjs-dist@^5`, `papaparse@^5`, `@types/papaparse` (dev).

### Design notes
- Excel support excluded from MVP. Users with `.xlsx` schedules see an error with a "export to CSV first" hint.
- `pdfjs-dist` worker URL uses `import.meta.url` for Vite compatibility; fails silently in jsdom so no test shim is needed.
- `transformDraft` is intentionally pure — no side effects — so the review screen can call it once on mount and let `TaskDialog` own edits from that point.

## Version 1.25.1
Update Date: 2026-05-03

### Root cause
`React.lazy()` throws a `ChunkLoadError` when a dynamically-imported JS chunk cannot be fetched (e.g. offline). No `ErrorBoundary` existed in the tree, so the uncaught render error unmounted the entire React tree → blank page.

### Changes

**`frontend/src/App.tsx`**
- Added `ChunkErrorBoundary` class component wrapping `<Suspense><Routes>`. Catches chunk load failures and renders `OfflineFallback` instead.
- Added `OfflineFallback` function component rendering a localised "page unavailable offline" message.
- `resetKey={location.pathname}` on the boundary auto-resets it on route change, so navigating to a cached page after an error recovers without a full reload.

**`frontend/src/i18n.ts`**
- Added `app.offlinePageUnavailable` in both `en` and `zh` locales.

### Design notes
- The boundary is keyed on `location.pathname` so it resets automatically when the user navigates back to a page whose chunk IS cached or when they come back online and click a different route.
- The secondary gap (chunks not pre-cached in the service worker) is left for a follow-up; the ErrorBoundary is the minimal safe fix.

## Version 1.25.0
Version: 1.25.0
Update Date: 2026-05-03

### Changes

**`frontend/src/app/taskLogic.ts`**
- Added `PeriodStats` type: `{ completedCount, totalCount, completionRate, createdCount, overdueCount }`.
- Added `WeekdayStats` type: `{ weekday, completedCount, totalCount, completionRate }`.
- Added `periodStatsForWindow(all, endDateYmd, windowDays)`: aggregates completed/total counts via `productivityStatsForDate` for each day in the window, counts overdue slots (active tasks on past days that remain incomplete), and counts created tasks by `createdAt` date within the window.
- Added `weekdayProductivitySeries(all, endDateYmd, windowDays)`: groups `productivityStatsForDate` results by weekday (0=Sunday … 6=Saturday) and returns a 7-element array of `WeekdayStats`.

**`frontend/src/pages/StatsPage.tsx`** (new file)
- Lazy-loaded analytics page at route `/stats`.
- Accepts `tasks: Task[]` prop; all stats are computed client-side from existing task data.
- Computes `currentStats` (last 30 days) and `prevStats` (days 31–60) using `periodStatsForWindow`.
- Computes `trendSeries` (30-day daily series) using `productivityStatsSeries`.
- Computes `weekdayStats` using `weekdayProductivitySeries`; derives `bestDay` and `worstDay` from days with `totalCount > 0`.
- Empty state shown when `currentStats.totalCount < 5` to avoid meaningless charts.
- Section 1: four summary cards (Completed, Created, Completion Rate, Overdue) using a 2×2 flex grid.
- Section 2: 30-day horizontal-scroll bar chart; each bar is 28 px wide with a rotated date label; uses the same green/gray encoding as the old TodayPage chart.
- Section 3: four comparison rows (Completed, Created, Completion Rate, Overdue) with directional trend badges; overdue comparison is intentionally inverted (fewer overdue = positive).
- Section 4: behaviour insights generated from comparisons — only rendered when supporting data exists; no fake data.
- Section 5: details table (avg daily, best/worst day, backlog change).
- Period date range chips in the footer confirm exactly which dates each period covers.

**`frontend/src/pages/TodayPage.tsx`**
- Removed entire stats Paper section (collapsible productivity panel, 7-day chart, stat cards).
- Removed `statsExpanded` state, `formatStatsLabel`, `formatTrendDay`, `formatTrendDate` helpers.
- Removed `productivityStatsForRollingWindow`, `productivityStatsSeries`, `QueryStatsRoundedIcon`, `Collapse` imports.
- Replaced multi-step `completedTaskCount` derivation (via `sevenDayTrend`) with a single `productivityStatsForDate(tasks, selectedDay).completedCount` memo.
- TodayPage now renders only the date navigation header, active/completed chips, task list, and dialogs.

**`frontend/src/App.tsx`**
- Added `StatsPage` lazy import.
- Added `BarChartRoundedIcon` import.
- Added `/stats` route: `<StatsPage tasks={tasks} />`.
- Added `{ to: "/stats", label: t("nav.stats"), icon: <BarChartRoundedIcon />, id: "nav-stats" }` to `navigationItems` (between Month and Help), visible in both desktop sidebar and mobile bottom navigation.

**`frontend/src/i18n.ts`**
- Added `nav.stats` key (`"Stats"` / `"统计"`).
- Added full `stats` namespace (48 keys) in English and Chinese covering all StatsPage copy: title, subtitle, empty state, card labels, trend chart, comparison section, insights, and details.
- Added `help.faq.q19` (Stats page FAQ entry) in English and Chinese.
- Updated `help.guides.step5Desktop` and `step5Mobile` to mention the Stats page.

**`frontend/src/pages/HelpPage.tsx`**
- Added `q18` and `q19` FAQ entries to the explicit FAQ item list.

**`frontend/src/app/releaseNotes.ts`**
- Prepended v1.25.0 entry.

### Design decisions
- No charting library added: the existing MUI Box-based bar rendering is sufficient for 30 bars with horizontal scroll; adding Recharts/Chart.js would increase bundle size with no UX gain for this simple bar chart.
- Stats are computed entirely on the frontend from the existing task collection. No new backend endpoint is needed — the task data already includes `createdAt`, `completedAt`, and occurrence overrides, which is everything `periodStatsForWindow` needs.
- The 30-day cleanup rule in `taskRetention.js` means analytics naturally cover up to 30 days of history, which aligns exactly with the feature scope.
- "Overdue" is defined as active (incomplete) task slots on past days. A daily recurring task that goes uncompleted for a week counts as 7 overdue slots — this is intentional and consistent with how the rest of the app counts tasks-per-day.
- Comparison inverts the delta direction for overdue (fewer overdue = positive/green), different from the other three metrics.

## Version 1.24.0
Version: 1.24.0
Update Date: 2026-05-03

### Changes

**`frontend/src/app/ics.ts`**
- Added `REVERSE_WEEKDAY_MAP` (inverse of the existing `WEEKDAY_MAP`) for weekday number → ICS day-name conversion.
- Added exported `IcsExportFilter` type: union of `{ type: "all" }`, `{ type: "incomplete" }`, and `{ type: "dateRange"; startDate: string; endDate: string }`.
- Added exported `tasksToIcs(tasks, filter?)` function: iterates filtered tasks, calls `buildMasterVEvent` per task, and calls `buildOverrideVEvent` for each non-deleted occurrence override on recurring tasks. Returns a CRLF-joined VCALENDAR string.
- Added `filterTasksForExport`: passes all tasks, filters by `completedAt`, or filters by date overlap using `task.date ?? task.beginDate` vs `task.recurrence.until ?? task.endDate ?? taskStart`.
- Added `buildMasterVEvent`: emits VEVENT with UID, DTSTAMP, SUMMARY, DTSTART/DTEND (DATE for all-day, datetime for timed), STATUS (COMPLETED or NEEDS-ACTION), DESCRIPTION, LOCATION, PRIORITY, RRULE (via `buildRrule`), and EXDATE for deleted occurrences.
- Added `buildOverrideVEvent`: emits a VEVENT with RECURRENCE-ID for each non-deleted occurrence override in a recurring task.
- Added `buildRrule`: converts `TaskRecurrence` → RRULE string (FREQ, INTERVAL, BYDAY, BYMONTHDAY, UNTIL).
- Added `buildDtstamp`: formats current UTC time as `YYYYMMDDTHHmmssZ` using `Date.getUTC*` methods (no extra dayjs plugin needed).
- Added `toIcsDate`, `toIcsDateTime`: format `YYYY-MM-DD` and `HH:mm` into ICS date/datetime strings.
- Added `encodeIcsText`: escapes `\`, `,`, `;`, and newlines per RFC 5545.
- Added `foldIcsLine`: folds lines longer than 75 characters with CRLF+space continuation.
- Added `mapEmergencyToIcsPriority`: maps emergency 1–5 to ICS priority 1/3/5/6/9.

**`frontend/src/components/ExportIcsDialog.tsx`** (new file)
- MUI Dialog with RadioGroup filter selector (all / incomplete / dateRange) and two TextField date inputs that appear only when dateRange is selected.
- Validates that startDate ≤ endDate; shows a caption error and disables the Export button if invalid.
- On Export: calls `tasksToIcs`, creates a Blob, creates a temporary anchor, triggers `click()` for the download, then revokes the object URL and closes the dialog.

**`frontend/src/pages/TodayPage.tsx`**
- Added `FileDownloadRoundedIcon` to MUI icon imports.
- Added `ExportIcsDialog` import.
- Added `exportDialogOpen` state (boolean, default false).
- Added Export ICS button (outlined variant, `FileDownloadRoundedIcon`, `borderRadius: 2.5`) between the Import ICS button and the Add Task button.
- Added `<ExportIcsDialog>` to the render, wired to `exportDialogOpen` state and `tasks` prop.

**`frontend/src/i18n.ts`**
- Added `today.exportIcs`, `today.exportDialogTitle`, `today.exportFilterLabel`, `today.exportAll`, `today.exportIncomplete`, `today.exportDateRange`, `today.exportStartDate`, `today.exportEndDate`, `today.exportDownload`, `today.exportDateRangeError` in both `en` and `zh`.
- Added `help.walkthroughs.exportIcs` (question, title, text) in both `en` and `zh`.
- Added `help.faq.q18` (ICS export FAQ) in both `en` and `zh`.

**`frontend/src/app/helpCenter.ts`**
- Added `export-ics` walkthrough entry to `getHelpCenterData` (audience: "all"), referencing the `exportIcs` translation keys.

**`frontend/tests/ics.behavior.test.ts`**
- Imported `tasksToIcs` and `Task` type.
- Added `ICS export behavior` describe block with 9 tests covering: VCALENDAR wrapper, VEVENT field mapping, COMPLETED status, all-day DATE format, RRULE generation, EXDATE for deleted occurrences, incomplete filter, date range filter, and text escaping.

## Version 1.23.0
Version: 1.23.0
Update Date: 2026-05-03

### Changes

**`frontend/src/i18n.ts`**
- Added `toast` namespace under both `en` and `zh` translations with keys: `taskCreated`, `taskUpdated`, `taskDeleted`, `taskDone`, `allTasksDone`, `reminderCreated`, `reminderUpdated`.
- Updated `help.guides.step1` (en + zh) to mention the new per-action confirmation feedback.

**`frontend/src/App.tsx`**
- Added `Alert` and `Snackbar` to MUI imports.
- Added `useCallback` to React imports.
- Added `toast` state `{ open, message, severity }` and `showToast` callback (memoized with `useCallback`).
- Passed `showToast` as a new optional prop to `TodayPage` and `ReminderPage` routes.
- Rendered a `Snackbar` + `Alert` pair at the root level with `anchorOrigin: bottom/center`, `autoHideDuration: 3000`. Bottom margin is `mb: 9` on mobile (above the bottom nav bar) and `mb: 2` on desktop. Alert styled with `borderRadius: 2.5` and a subtle shadow.

**`frontend/src/pages/TodayPage.tsx`**
- Added `showToast` optional prop to the component signature.
- Removed `Alert` from MUI imports (no longer used inline); added `CheckCircleOutlineRoundedIcon` import.
- Removed the `importStatus` state (`{ severity, message } | null`).
- `importIcsFile` now calls `showToast?.(msg, severity)` instead of `setImportStatus`.
- Added `handleTaskSave` wrapper around `upsert` that distinguishes create vs. edit (via `!!editing`) and calls `showToast` with the appropriate key. `TaskDialog.onSave` now receives `handleTaskSave` instead of `upsert` directly — `moveTemporaryToToday`/`moveTemporaryToTomorrow` still call `upsert` directly and show no toast (move is not a create/update action).
- `remove` calls `showToast?.(t("toast.taskDeleted"), "info")` after updating state.
- `doMarkDone` calls `showToast?.(t("toast.taskDone"))` after updating state.
- `markAllDone` calls `showToast?.(t("toast.allTasksDone"))` after updating state.
- **Task count chips**: Both chips now have explicit `bgcolor`, `color`, `border`, and `borderColor` matching the app theme — indigo tint for active, green tint for completed.
- **Stats section header**: Replaced the `body2` `productivityPitch` typography with two inline `Chip` components (height: 22, fontSize: 0.7rem): a green chip showing today's completion fraction and a primary-colored chip showing 7-day completion rate. The existing `productivityPitch` i18n key is no longer rendered but kept in i18n for potential future use.
- **Task section headers**: Replaced the plain uppercase `Typography subtitle1` for both "All-Day Tasks" and "Scheduled Tasks" with a flex row containing: a 3×14px rounded color accent bar (`primary.light` for all-day, `secondary.main` for scheduled), the label text as `caption`, a `flex: 1` 1px divider line, and a numeric count badge.
- **Empty state**: Added `CheckCircleOutlineRoundedIcon` at fontSize 48 with `text.disabled` color above the existing text and button.

**`frontend/src/pages/ReminderPage.tsx`**
- Added `showToast` optional prop; destructured from `props`.
- `upsert` now detects create vs. edit mode (via `!!editing` captured before the state update) and calls `showToast?.(t("toast.reminderCreated/reminderUpdated"))`.
- **Empty state**: Added `NotificationsActiveOutlinedIcon` at fontSize 48 above the text. Added an outlined "+ Add Reminder" `Button` below the text, wired to open the dialog with `editing: undefined`.

**`frontend/package.json`**
- Bumped version from 1.22.1 → 1.23.0.

**`RELEASENOTES.md`, `frontend/src/app/releaseNotes.ts`**
- Added v1.23.0 release entry with bilingual (en/zh) content.

### Design Decisions
- The `Snackbar` is rendered at the App root (not inside individual pages) to avoid it unmounting mid-display if the user navigates during the 3-second window. A single toast state at the top level is simpler than a context provider for this use case.
- `showToast` is typed as optional (`?`) on each page so pages can be rendered in tests or in isolation without providing it.
- `moveTemporaryToToday` and `moveTemporaryToTomorrow` intentionally skip the toast — they call `upsert` directly. Showing "Task updated" for a move could confuse users who expect that message only for edits.
- The Snackbar `mb` offset on mobile (`mb: 9`, ~72px) ensures the toast clears the 68px bottom navigation bar.
- Section header accent bars use `primary.light` and `secondary.main` to visually distinguish the two groups without adding heavy UI elements.
- Stats mini chips cap at height 22 to stay visually compact; font-size 0.7rem matches the existing priority chip sizing already used throughout the task cards.

## Version 1.22.1
Version: 1.22.1
Update Date: 2026-05-03

### Changes

**`frontend/src/main.tsx`**
- Added `MuiTooltip` to the theme `components` block with `defaultProps` (`arrow: true`, `enterTouchDelay: 500`, `leaveTouchDelay: 2000`, `enterDelay: 300`) and `styleOverrides` for `tooltip` and `arrow` sub-components. Styling uses `rgba(15, 23, 42, 0.9)` background with `backdropFilter: blur(8px)`, 8px border radius, and a shadow to match the app's design language.

**`frontend/src/App.tsx`**
- Added `placement="bottom"` to the three MUI Tooltip components wrapping the mobile AppBar icon buttons (language switch, install app, logout). These tooltips are at the top of the screen; without explicit placement the arrow may point incorrectly or clip the viewport edge on short phones.

**`frontend/package.json`, `package.json`**
- Bumped version from 1.22.0 → 1.22.1.

**`RELEASENOTES.md`, `frontend/src/app/releaseNotes.ts`**
- Added v1.22.1 release entry with bilingual (en/zh) content.

### Design Decisions
- `enterTouchDelay` was lowered to 500ms (from the 700ms MUI default) as a balance between intentional long-press and responsiveness; 0ms would conflict with tap actions that fire on touchend.
- `leaveTouchDelay` was raised to 2000ms so users on touch screens have enough time to read the tooltip label before it fades.
- `enterDelay: 300` on hover prevents tooltips from flashing during rapid cursor movements across the navigation area.
- `placement="bottom"` is set only on the mobile AppBar tooltips (top of screen); the desktop sidebar tooltip keeps the default since it has ample vertical space above and below.

## Version 1.22.0
Version: 1.22.0
Update Date: 2026-05-03

### Changes

**`frontend/src/app/helpCenter.ts`**
- Extended `OnboardingTooltipStep` type with `title: string`, `forceAction?: boolean`, `expectedAction?: string`.
- Rewrote `getOnboardingSteps` with 7 steps in new order: add-task, task-list, language-switch, download-app, open-week (forceAction, expectedAction: "open-week-page"), open-help (forceAction, expectedAction: "open-help-center"), notification-toggle.
- All step targets include both `[data-onboarding='...']` selectors and legacy `#id` selectors for backward compatibility.

**`frontend/src/components/OnboardingTooltip.tsx`**
- Added `forceAdvanceSignal?: string | null` prop; when the value matches the current forced-action step's `expectedAction`, the step auto-advances.
- Replaced `useLayoutEffect` + fixed positioning with a `useEffect` that scrolls the target into view with `scrollIntoView({ behavior: "smooth" })`, retries up to 30 frames if the element isn't in the DOM yet (handles lazy-loaded Help Center), then measures `getBoundingClientRect` after a 350ms settle delay.
- Tooltip width is now `min(320px, 100vw - 24px)` — responsive, never overflows viewport.
- Placement logic prefers below-target; falls back to above-target if insufficient space below; clamps horizontally to viewport padding.
- For `forceAction` steps, the Next button is hidden entirely, leaving only the Skip button. This forces real navigation.
- Step title and text displayed separately as `subtitle2` + `body2`, replacing the single bold `body1`.

**`frontend/src/App.tsx`**
- Added `onboardingForceSignal` state (`string | null`).
- Added `useEffect` on `location.pathname`: sets signal to `"open-week-page"` when on `/week`, `"open-help-center"` when on `/help`, `null` otherwise.
- Added `dataOnboarding` field to `navigationItems` (`"week-page-button"` for week, `"help-center-button"` for help).
- Added `data-onboarding` props to: desktop nav buttons, mobile `BottomNavigationAction`, mobile language-switch `IconButton`, mobile install-app `IconButton`, desktop install-app `Button`, desktop language-switch `Button`.
- Passes `forceAdvanceSignal={onboardingForceSignal}` to `<OnboardingTooltip>`.

**`frontend/src/pages/TodayPage.tsx`**
- Added `data-onboarding="add-task-button"` to both `#today-add-task-button` and `#today-empty-add-task-button`.
- Added `data-onboarding="task-list"` to both `#today-empty-state` (Paper) and `#today-task-list` (Box).

**`frontend/src/pages/HelpPage.tsx`**
- Added `data-onboarding="notification-toggle-button"` to the `<Stack>` containing the Enable/Disable notification buttons.

**`frontend/src/i18n.ts`**
- Replaced flat `onboarding.steps.*` strings with nested `{ title, text }` objects for all 7 steps in both `en` and `zh`.
- New keys: `addTask`, `taskList`, `languageSwitch`, `downloadApp`, `openWeek`, `openHelp`, `notificationToggle` — each with `.title` and `.text`.

### Design Decisions
- `forceAdvanceSignal` is a `string | null` prop rather than a callback to keep `OnboardingTooltip` mostly self-contained. App.tsx resets the signal to `null` when the user leaves `/week` or `/help`, preventing stale re-triggers on subsequent location changes to unrelated paths.
- Retry loop (30 rAF frames) in `OnboardingTooltip` handles the Help Center being lazy-loaded: the notification toggle element isn't in the DOM until after the Suspense boundary resolves.
- `data-onboarding` attributes coexist with existing `id` attributes; neither is removed, so any existing tooling or tests targeting `#today-add-task-button` etc. still work.
- The ONBOARDING_STORAGE_KEY is intentionally unchanged (`tasktide:onboarding:v1.18.4`) to avoid re-triggering onboarding for users who already completed it.

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
