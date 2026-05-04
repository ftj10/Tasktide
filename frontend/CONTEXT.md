# Frontend Context

The frontend is a React + TypeScript single-page application. It owns all planner UI, task rendering, offline sync, and the syllabus import wizard.

## Language

**Task**:
A user-created item with a title, optional schedule, recurrence, location, and description. The atomic unit of the planner.
_Avoid_: Todo, item, event

**Recurring Task**:
A Task whose `recurrence.frequency` is not `NONE`. Rendered on every matching date within its `beginDate`–`recurrence.until` window.
_Avoid_: Repeating task, series

**One-Time Task**:
A Task whose `recurrence.frequency` is `NONE`. Appears on a single date.
_Avoid_: Single task, non-recurring task

**Occurrence**:
A single rendered instance of a Recurring Task on a specific date. Not a separate database record — derived at render time from the task's recurrence rule.
_Avoid_: Instance, copy

**Occurrence Override**:
A per-date patch stored in `occurrenceOverrides` that modifies or deletes a single Occurrence without affecting the rest of the series.
_Avoid_: Exception, edit

**Draft**:
A `SyllabusTaskDraft` item produced by AI output during the syllabus import wizard. Lives in localStorage during the wizard session. Becomes a Task only after the user confirms import.
_Avoid_: Preview task, pending task, AI task

**SyllabusTaskDraft**:
The AI-facing schema for a single task proposed by the syllabus import wizard. A simplified, AI-friendly shape validated by the **SyllabusTaskDraft Schema** (Zod) and transformed into a `Task` on import. Distinct from the internal `Task` type.
_Avoid_: Draft task schema, import schema

Key fields: `title`, `sourceType`, `type` (`"recurring"` | `"once"`), `termStart`/`termEnd` (recurring), `date` (once), `weekdays`, `interval`, `startTime`, `endTime`, `location`, `description`, `excludedDates` (dates this recurring event does not occur — converted to `occurrenceOverrides` with `deleted: true` on import), `confidence` (`"high"` | `"medium"` | `"low"`), `sourceText` (the syllabus line the AI used — shown in the review screen for user verification).

`sourceType` enum: `"lecture"` | `"lab"` | `"tutorial"` | `"office_hour"` | `"assignment"` | `"midterm"` | `"final"` | `"quiz"` | `"project"` | `"prep"` | `"reading"` | `"other"`

Default `emergency` mapping during transformation (1 = most urgent, 5 = least urgent):

| sourceType | emergency |
|---|---|
| `final`, `midterm` | 1 |
| `assignment`, `quiz`, `project` | 2 |
| `prep` | 3 |
| `lecture`, `lab`, `tutorial`, `other` | 4 |
| `office_hour`, `reading` | 5 |

**Wizard Draft**:
The full localStorage state for an in-progress syllabus import session. Contains the current wizard step, generated prompt text, pasted AI JSON, study preferences, and the list of `SyllabusTaskDraft` items. Expires after 24 hours or on confirm/cancel.
_Avoid_: Import session, draft state

**Study Preferences**:
User-configured options entered during the syllabus import wizard (e.g., "create exam prep tasks 3 days before each test"). Embedded into the AI prompt to drive prep task generation. Scoped to the current wizard session — not persisted to the user profile.
_Avoid_: User preferences, notification preferences

**Import Overview**:
A human-readable summary of the Drafts shown on the wizard's review step. Derived from the `SyllabusTaskDraft` items themselves — not AI-generated and not saved after import.
_Avoid_: Term summary, AI summary, course summary

**SyllabusTaskDraft Schema**:
The Zod schema that is the single source of truth for `SyllabusTaskDraft` validation. Powers the TypeScript type, manual JSON validation, automatic API response validation, and tests. Both generation methods validate through this schema before producing a `SyllabusImportDraftResult`.
_Avoid_: Draft validator, AI schema

**Review Item**:
The paired unit shown on the review screen: `{ draft: SyllabusTaskDraft, task: Task, deleted: boolean }`. The `task` is the editable object (via the existing Task dialog). The `draft` is display-only metadata (sourceText, sourceType, confidence). On confirm, only non-deleted `task` objects are imported.
_Avoid_: Draft pair, preview item

**Prep Task**:
A `SyllabusTaskDraft` generated from a study preference (e.g., a preparation reminder 3 days before a midterm). Appears as a first-class editable Draft in the review screen.
_Avoid_: Preparation task, reminder task

**Generation Method**:
The user's choice at the start of the import wizard: "Automatic" (TaskTide sends extracted text to Claude via the backend) or "Manual" (TaskTide generates a prompt the user copies into their own AI tool). Both methods produce a `SyllabusImportDraftResult` and share the same review and import pipeline.
_Avoid_: AI mode, import mode

**SyllabusImportDraftResult**:
The shared output of both generation methods: a validated `SyllabusTaskDraft[]`. The downstream wizard steps (review, confirm, batch import) consume this type regardless of how the drafts were generated.
_Avoid_: Generation result, AI output

**Consent Gate**:
The mandatory wizard step shown before any extracted text is sent to an AI provider. Displays provider name, content type, storage policy, and a collapsible preview of the exact extracted text. The AI call cannot proceed until the user clicks "Send to AI and Generate Tasks." Consent is per-import, not account-wide.
_Avoid_: Consent checkbox, privacy notice, terms screen

**Manual Copy-Paste Generation**:
A first-class generation method. TaskTide generates a structured prompt containing the extracted text and required JSON schema. The user copies it into their own AI tool, pastes the JSON result back, and TaskTide validates it. Available as a user choice from the start of the wizard — not only as an error fallback.
_Avoid_: Manual fallback, manual mode

## Relationships

- A **Wizard Draft** contains the current **Generation Method**, one set of **Study Preferences**, the generated prompt text, any pasted JSON, and the **SyllabusImportDraftResult**
- A **SyllabusImportDraftResult** is a validated `SyllabusTaskDraft[]` produced by either generation method through the **SyllabusTaskDraft Schema**
- A **SyllabusImportDraftResult** is presented as a list of **Review Items** on the review screen
- A **Review Item** pairs one **SyllabusTaskDraft** (display-only) with one transformed **Task** (editable) and a `deleted` flag
- A **SyllabusTaskDraft** is transformed into a **Task** (including `excludedDates` → `occurrenceOverrides`) when the user confirms import
- A **Prep Task** is a **SyllabusTaskDraft** with `sourceType: "prep"` derived from another Draft + a Study Preference
- A **Consent Gate** is shown before automatic generation only — manual generation uses inline disclosure instead
- A **Recurring Task** has zero or more **Occurrence Overrides**, keyed by date
- An **Occurrence** is rendered from a **Recurring Task** + a specific date; it is not stored

## Flagged ambiguities

- "Course" was used informally to mean a group of related tasks — resolved: Course is not a domain entity in MVP. Tasks are grouped implicitly by shared title prefix (e.g., `CPSC 110 101 - Lecture`).
- "Term summary" was proposed as an AI-generated artifact — resolved: no term summary exists. Course-level info (professor, TA, syllabus link) lives in the `description` of the relevant recurring lecture/lab/tutorial Draft.
- "Study preferences" could mean user profile settings — resolved: Study Preferences are wizard-session scoped only. No backend storage, no User model field.
- "Manual mode" was initially scoped as an API-failure fallback only — resolved: Manual Copy-Paste Generation is a first-class user choice from the start of the wizard. It remains available as a recovery path if automatic generation fails, but is not exclusively a fallback.
