# Design: Syllabus Import Button + Structured Preferences

**Date:** 2026-05-09
**Status:** Approved
**Scope:** Medium feature

---

## Summary

Two changes:
1. Replace the Export ICS button in TodayPage with an "Import Syllabus (AI)" button that opens the existing `SyllabusImportDialog`.
2. Replace the single free-text preferences field in `SyllabusImportDialog` with four structured, optional questions — and insert that preferences step into the auto path as well as the manual path.

---

## Feature 1 — TodayPage Button Bar

### What changes

The TodayPage action bar currently has four buttons: Go to Today, Import ICS, Export ICS, Add Task.

**After:**
- Remove: Export ICS button
- Add: "Import Syllabus (AI)" button (outlined, indigo, `SchoolRounded` or `UploadFileRounded` icon) that opens `SyllabusImportDialog`
- Unchanged: Import ICS button, Add Task button, nav arrows

### Export ICS

Export ICS already exists in SettingsPage — no new work needed there. It is simply removed from TodayPage.

### SyllabusImportDialog wiring in TodayPage

`SyllabusImportDialog` requires: `open`, `onClose`, `onImportSuccess`, `showToast`. TodayPage already has `showToast` via props. `onImportSuccess` calls `props.onTasksChanged?.()` to reload the task list.

---

## Feature 2 — Structured Preference Questions

### Context

The `preferences` wizard step currently shows a single free-text `TextField` (`studyPreferences`). The output of that field is passed verbatim to `buildSyllabusPrompt` (manual path) and `callGenerateDrafts` (auto path).

The auto path currently skips the `preferences` step entirely (method → consent).

### New preferences step UI

Four inputs, all optional:

| # | Question label | Input type | Serialized output (if filled) |
|---|---|---|---|
| Q1 | "Add a 'study' task how many days before each exam or final?" | Number text input | "Add a study task N days before each exam or final." |
| Q2 | "Add a 'prep' task how many days before each assignment or quiz?" | Number text input | "Add a prep task N days before each assignment or quiz." |
| Q3 | "Don't import these (select any to skip)" | Chip multi-select: Lectures, Office Hours, Readings, Labs, Tutorials | "Do not import [x, y, z]." |
| Q4 | "Anything else you want the AI to know?" | Free text (multiline) | Appended as-is |

Blank/unselected fields are omitted. All non-empty parts are joined into a single string and stored in `studyPreferences`. Everything downstream (`buildSyllabusPrompt`, `callGenerateDrafts`) receives this string unchanged.

### Serialization

```
serialize({ examPrepDays, assignmentPrepDays, skipTypes, freeText }) → string
```

- If `examPrepDays` is a positive integer: append `"Add a study task {N} days before each exam or final."`
- If `assignmentPrepDays` is a positive integer: append `"Add a prep task {N} days before each assignment or quiz."`
- If `skipTypes.length > 0`: append `"Do not import {types joined with ', '}."`
- If `freeText` is non-empty: append as-is
- Join all parts with `" "`, trim

### Wizard flow change

**Manual path** (unchanged structure, step UI changes):
```
upload → method → preferences → prompt → paste → review
```

**Auto path** (new step inserted):
```
upload → method → preferences → consent → [clarify] → review
```

`handleChooseAuto` changes from `setWizardStep("consent")` to `setWizardStep("preferences")`.

`goBack` from `consent` already goes to `method` — this must change to go back to `preferences` instead.

### State additions to SyllabusImportDialog

Four new state vars:
- `examPrepDays: string` (string so empty input is representable)
- `assignmentPrepDays: string`
- `skipTypes: string[]`
- `prefsFreeText: string`

All reset to initial values in `handleClose`. `studyPreferences` remains as the serialized output written at `handleContinuePreferences` time.

`SavedDraft` shape is unchanged — we persist `studyPreferences` (the serialized string), not the raw structured inputs.

---

## Files Changed

| File | Change |
|---|---|
| `frontend/src/pages/TodayPage.tsx` | Remove export button + state + imports; add syllabus button + dialog |
| `frontend/src/pages/SyllabusImportDialog.tsx` | Replace preferences step UI; add 4 state vars; update auto path flow; update `goBack` for consent |
| `frontend/src/i18n.ts` | Add en + zh keys for Q1–Q4 labels, hints, chip labels |
| `frontend/src/pages/SyllabusImportDialog.behavior.test.tsx` | Cover auto path now visiting preferences step |

---

## Out of Scope

- Changing how the serialized string is consumed by `buildSyllabusPrompt` or `callGenerateDrafts`
- Persisting raw structured inputs in `SavedDraft`
- Adding preference questions to WeekPage or any other page
- Changing the review or batch import flow
