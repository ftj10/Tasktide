# Syllabus Import Button + Structured Preferences — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Export ICS button in TodayPage with an "Import Syllabus (AI)" button, and replace the single free-text preferences field in the syllabus wizard with four structured, optional questions shown in both manual and auto paths.

**Architecture:** A new pure `serializePreferences` function in `app/syllabusPrefs.ts` converts four structured inputs into a natural-language string stored in the existing `studyPreferences` state — nothing downstream changes. The auto wizard path gains a `preferences` step before `consent`. TodayPage drops the export dialog and wires in `SyllabusImportDialog`.

**Tech Stack:** React 18, TypeScript, MUI v7, Vitest + Testing Library, i18next

---

## File Map

| File | Action | What changes |
|---|---|---|
| `frontend/src/app/syllabusPrefs.ts` | **Create** | `serializePreferences` pure function |
| `frontend/src/app/syllabusPrefs.test.ts` | **Create** | Unit tests for `serializePreferences` |
| `frontend/src/i18n.ts` | **Modify** | Add en + zh keys for Q1–Q4 labels, hints, chip names |
| `frontend/src/pages/SyllabusImportDialog.tsx` | **Modify** | 4 new state vars, new preferences UI, auto path flow fix |
| `frontend/src/pages/SyllabusImportDialog.behavior.test.tsx` | **Modify** | Update auto path test to navigate through preferences step |
| `frontend/src/pages/TodayPage.tsx` | **Modify** | Remove export dialog; add syllabus button + `SyllabusImportDialog` |

---

## Task 1 — `serializePreferences` pure function (TDD)

**Files:**
- Create: `frontend/src/app/syllabusPrefs.ts`
- Create: `frontend/src/app/syllabusPrefs.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/app/syllabusPrefs.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { serializePreferences } from "./syllabusPrefs";

describe("serializePreferences", () => {
  it("returns empty string when all inputs are blank", () => {
    expect(
      serializePreferences({ examPrepDays: "", assignmentPrepDays: "", skipTypes: [], prefsFreeText: "" })
    ).toBe("");
  });

  it("includes exam prep sentence when examPrepDays is a positive integer", () => {
    const result = serializePreferences({ examPrepDays: "3", assignmentPrepDays: "", skipTypes: [], prefsFreeText: "" });
    expect(result).toBe("Add a study task 3 days before each exam or final.");
  });

  it("includes assignment prep sentence when assignmentPrepDays is a positive integer", () => {
    const result = serializePreferences({ examPrepDays: "", assignmentPrepDays: "1", skipTypes: [], prefsFreeText: "" });
    expect(result).toBe("Add a prep task 1 day before each assignment or quiz.");
  });

  it("uses 'day' (singular) when N is 1", () => {
    const result = serializePreferences({ examPrepDays: "1", assignmentPrepDays: "", skipTypes: [], prefsFreeText: "" });
    expect(result).toBe("Add a study task 1 day before each exam or final.");
  });

  it("includes skip sentence when skipTypes has entries", () => {
    const result = serializePreferences({ examPrepDays: "", assignmentPrepDays: "", skipTypes: ["Lectures", "Labs"], prefsFreeText: "" });
    expect(result).toBe("Do not import Lectures, Labs.");
  });

  it("appends freeText as-is", () => {
    const result = serializePreferences({ examPrepDays: "", assignmentPrepDays: "", skipTypes: [], prefsFreeText: "use 24h time" });
    expect(result).toBe("use 24h time");
  });

  it("joins all non-empty parts with a space", () => {
    const result = serializePreferences({
      examPrepDays: "3",
      assignmentPrepDays: "1",
      skipTypes: ["Readings"],
      prefsFreeText: "use 24h time",
    });
    expect(result).toBe(
      "Add a study task 3 days before each exam or final. Add a prep task 1 day before each assignment or quiz. Do not import Readings. use 24h time"
    );
  });

  it("ignores non-positive or non-integer values for day fields", () => {
    expect(
      serializePreferences({ examPrepDays: "0", assignmentPrepDays: "-1", skipTypes: [], prefsFreeText: "" })
    ).toBe("");
    expect(
      serializePreferences({ examPrepDays: "abc", assignmentPrepDays: "1.5", skipTypes: [], prefsFreeText: "" })
    ).toBe("");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm run test:run -- syllabusPrefs
```

Expected: `Cannot find module './syllabusPrefs'`

- [ ] **Step 3: Create `frontend/src/app/syllabusPrefs.ts`**

```ts
export type StructuredPrefs = {
  examPrepDays: string;
  assignmentPrepDays: string;
  skipTypes: string[];
  prefsFreeText: string;
};

export function serializePreferences(prefs: StructuredPrefs): string {
  const parts: string[] = [];

  const examN = parsePositiveInt(prefs.examPrepDays);
  if (examN !== null) {
    parts.push(`Add a study task ${examN} ${examN === 1 ? "day" : "days"} before each exam or final.`);
  }

  const assignN = parsePositiveInt(prefs.assignmentPrepDays);
  if (assignN !== null) {
    parts.push(`Add a prep task ${assignN} ${assignN === 1 ? "day" : "days"} before each assignment or quiz.`);
  }

  if (prefs.skipTypes.length > 0) {
    parts.push(`Do not import ${prefs.skipTypes.join(", ")}.`);
  }

  if (prefs.prefsFreeText.trim()) {
    parts.push(prefs.prefsFreeText.trim());
  }

  return parts.join(" ");
}

function parsePositiveInt(value: string): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm run test:run -- syllabusPrefs
```

Expected: all 8 tests pass

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/syllabusPrefs.ts frontend/src/app/syllabusPrefs.test.ts
git commit -m "feat: add serializePreferences helper for structured syllabus prefs"
```

---

## Task 2 — i18n strings

**Files:**
- Modify: `frontend/src/i18n.ts`

- [ ] **Step 1: Add English keys**

In `frontend/src/i18n.ts`, find the `syllabus` object in the English (`en`) translation (around line 737). After `preferencesHint`, add:

```ts
preferencesExamDaysLabel: "Add a 'study' task how many days before each exam or final?",
preferencesExamDaysHint: "e.g. enter 3 → AI adds \"Study for Midterm\" 3 days before the exam",
preferencesAssignDaysLabel: "Add a 'prep' task how many days before each assignment or quiz?",
preferencesAssignDaysHint: "e.g. enter 1 → AI adds \"Finish Assignment\" 1 day before it's due",
preferencesSkipLabel: "Don't import these (select any to skip)",
preferencesSkipHint: "Nothing selected = import everything",
preferencesSkipLectures: "Lectures",
preferencesSkipOfficeHours: "Office Hours",
preferencesSkipReadings: "Readings",
preferencesSkipLabs: "Labs",
preferencesSkipTutorials: "Tutorials",
preferencesFreeTextLabel: "Anything else you want the AI to know? (optional)",
preferencesDaysPlaceholder: "days",
```

- [ ] **Step 2: Add Chinese keys**

In `frontend/src/i18n.ts`, find the `syllabus` object in the Chinese (`zh`) translation (around line 1516). After `preferencesHint`, add:

```ts
preferencesExamDaysLabel: "每次考试或期末考前几天添加「备考」任务？",
preferencesExamDaysHint: "例如：输入 3 → AI 在考试前 3 天添加「备考 期中考」",
preferencesAssignDaysLabel: "每次作业或小测前几天添加「准备」任务？",
preferencesAssignDaysHint: "例如：输入 1 → AI 在截止日前 1 天添加「完成作业」",
preferencesSkipLabel: "不导入这些类型（可多选）",
preferencesSkipHint: "不选 = 全部导入",
preferencesSkipLectures: "讲座",
preferencesSkipOfficeHours: "答疑时间",
preferencesSkipReadings: "阅读材料",
preferencesSkipLabs: "实验课",
preferencesSkipTutorials: "辅导课",
preferencesFreeTextLabel: "还有什么想让 AI 知道的？（选填）",
preferencesDaysPlaceholder: "天数",
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd frontend && npm run build 2>&1 | head -30
```

Expected: no type errors relating to missing i18n keys

- [ ] **Step 4: Commit**

```bash
git add frontend/src/i18n.ts
git commit -m "feat(i18n): add structured preferences keys for syllabus wizard"
```

---

## Task 3 — SyllabusImportDialog: state, UI, and flow

**Files:**
- Modify: `frontend/src/pages/SyllabusImportDialog.tsx`

### 3a — Update failing behavior test first

- [ ] **Step 1: Update the behavior test to expect preferences step in auto path**

Open `frontend/src/pages/SyllabusImportDialog.behavior.test.tsx`. The existing test clicks "Analyze with Claude" and then immediately expects "Send to Claude" (the consent step). After our change, clicking "Analyze with Claude" goes to the **preferences** step first. Update the test:

```ts
it("shows ambiguity questions before auto draft generation", async () => {
  const user = userEvent.setup();
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
    ok: true,
    json: async () => ({ questions: ["What is the midterm date?"] }),
  } as Response);

  renderSyllabusImportDialog();
  await user.type(
    screen.getByLabelText(/paste syllabus text/i),
    "CSCI 101 syllabus"
  );
  // upload → method
  await user.click(screen.getByRole("button", { name: /^next$/i }));
  await waitFor(() =>
    screen.getByRole("button", { name: /analyze with claude/i })
  );
  // method → preferences
  await user.click(
    screen.getByRole("button", { name: /analyze with claude/i })
  );
  // preferences step is now shown — click Next to advance to consent
  await waitFor(() =>
    screen.getByRole("button", { name: /^next$/i })
  );
  await user.click(screen.getByRole("button", { name: /^next$/i }));
  // consent step
  await waitFor(() =>
    screen.getByRole("button", { name: /send to claude/i })
  );
  await user.click(screen.getByRole("button", { name: /send to claude/i }));

  await waitFor(() =>
    expect(screen.getByText("What is the midterm date?")).toBeInTheDocument()
  );
});
```

- [ ] **Step 2: Run test to verify it now fails**

```bash
cd frontend && npm run test:run -- SyllabusImportDialog.behavior
```

Expected: FAIL — after clicking "Analyze with Claude" the test can't find the Next button because the dialog still jumps straight to consent.

### 3b — Implement the changes

- [ ] **Step 3: Add import for `serializePreferences` and MUI `Chip`**

At the top of `frontend/src/pages/SyllabusImportDialog.tsx`, add to the MUI imports:

```ts
import Chip from "@mui/material/Chip";  // add if not present — check existing imports
```

And add after the existing app imports:

```ts
import { serializePreferences } from "../app/syllabusPrefs";
import type { StructuredPrefs } from "../app/syllabusPrefs";
```

- [ ] **Step 4: Add 4 new state vars**

Inside `SyllabusImportDialog`, after the existing `const [studyPreferences, setStudyPreferences] = useState("");` line, add:

```ts
const [examPrepDays, setExamPrepDays] = useState("");
const [assignmentPrepDays, setAssignmentPrepDays] = useState("");
const [skipTypes, setSkipTypes] = useState<string[]>([]);
const [prefsFreeText, setPrefsFreeText] = useState("");
```

- [ ] **Step 5: Reset new vars in `handleClose`**

Inside `handleClose`, after `setStudyPreferences("")`, add:

```ts
setExamPrepDays("");
setAssignmentPrepDays("");
setSkipTypes([]);
setPrefsFreeText("");
```

- [ ] **Step 6: Update `handleContinuePreferences` to serialize**

Replace the existing `handleContinuePreferences` function:

```ts
function handleContinuePreferences() {
  const prefs: StructuredPrefs = { examPrepDays, assignmentPrepDays, skipTypes, prefsFreeText };
  const serialized = serializePreferences(prefs);
  setStudyPreferences(serialized);
  const prompt = buildSyllabusPrompt(extractedText, serialized);
  setGeneratedPrompt(prompt);
  setPromptCopied(false);
  setWizardStep(wizardMode === "auto" ? "consent" : "prompt");
}
```

This replaces the old two-function split (`handleContinuePreferences` → `prompt` step only). Now the same handler works for both paths — manual goes to `prompt`, auto goes to `consent`.

- [ ] **Step 7: Fix `handleChooseAuto` to go to `preferences`**

Replace:

```ts
function handleChooseAuto() {
  setWizardMode("auto");
  setWizardStep("consent");
}
```

With:

```ts
function handleChooseAuto() {
  setWizardMode("auto");
  setWizardStep("preferences");
}
```

- [ ] **Step 8: Fix `goBack` — consent now goes back to `preferences`**

In the `goBack` function, change:

```ts
case "consent":
  setWizardStep("method");
  break;
```

To:

```ts
case "consent":
  setWizardStep("preferences");
  break;
```

- [ ] **Step 9: Replace the preferences step UI**

Find the `wizardStep === "preferences"` JSX block. It currently renders a single `TextField`. Replace the entire block content with:

```tsx
) : wizardStep === "preferences" ? (
  <Stack spacing={3} sx={{ pt: 0.5 }}>
    <Stack spacing={0.75}>
      <Typography variant="body2" fontWeight={600}>
        {t("syllabus.preferencesExamDaysLabel")}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {t("syllabus.preferencesExamDaysHint")}
      </Typography>
      <TextField
        placeholder={t("syllabus.preferencesDaysPlaceholder")}
        size="small"
        inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
        value={examPrepDays}
        onChange={(e) => setExamPrepDays(e.target.value.replace(/\D/g, ""))}
        sx={{ width: 100 }}
      />
    </Stack>

    <Stack spacing={0.75}>
      <Typography variant="body2" fontWeight={600}>
        {t("syllabus.preferencesAssignDaysLabel")}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {t("syllabus.preferencesAssignDaysHint")}
      </Typography>
      <TextField
        placeholder={t("syllabus.preferencesDaysPlaceholder")}
        size="small"
        inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
        value={assignmentPrepDays}
        onChange={(e) => setAssignmentPrepDays(e.target.value.replace(/\D/g, ""))}
        sx={{ width: 100 }}
      />
    </Stack>

    <Stack spacing={0.75}>
      <Typography variant="body2" fontWeight={600}>
        {t("syllabus.preferencesSkipLabel")}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {(["preferencesSkipLectures","preferencesSkipOfficeHours","preferencesSkipReadings","preferencesSkipLabs","preferencesSkipTutorials"] as const).map((key) => {
          const label = t(`syllabus.${key}`);
          const selected = skipTypes.includes(label);
          return (
            <Chip
              key={key}
              label={label}
              clickable
              color={selected ? "primary" : "default"}
              variant={selected ? "filled" : "outlined"}
              onClick={() =>
                setSkipTypes((prev) =>
                  selected ? prev.filter((x) => x !== label) : [...prev, label]
                )
              }
            />
          );
        })}
      </Box>
      <Typography variant="caption" color="text.secondary">
        {t("syllabus.preferencesSkipHint")}
      </Typography>
    </Stack>

    <Stack spacing={0.75}>
      <Typography variant="body2" fontWeight={600}>
        {t("syllabus.preferencesFreeTextLabel")}
      </Typography>
      <TextField
        multiline
        minRows={2}
        fullWidth
        value={prefsFreeText}
        onChange={(e) => setPrefsFreeText(e.target.value)}
      />
    </Stack>
  </Stack>
```

- [ ] **Step 10: Fix the preferences DialogActions button**

The `preferences` step action currently has a hardcoded "Next" button that calls `handleContinuePreferences`. Verify this still works — the handler now handles both paths, so no action change is needed. The `Back` button calls `goBack`, which already maps `preferences → method`. No change needed there.

- [ ] **Step 11: Run the behavior test to verify it passes**

```bash
cd frontend && npm run test:run -- SyllabusImportDialog.behavior
```

Expected: all tests pass

- [ ] **Step 12: Commit**

```bash
git add frontend/src/pages/SyllabusImportDialog.tsx frontend/src/pages/SyllabusImportDialog.behavior.test.tsx
git commit -m "feat(syllabus): structured preference questions in wizard, auto path gains preferences step"
```

---

## Task 4 — TodayPage: swap Export ICS for Syllabus Import

**Files:**
- Modify: `frontend/src/pages/TodayPage.tsx`

- [ ] **Step 1: Remove export-related imports**

In `frontend/src/pages/TodayPage.tsx`:

Remove this import line:

```ts
import { ExportIcsDialog } from "../components/ExportIcsDialog";
```

Remove `FileDownloadRoundedIcon` from the MUI icons import block (line ~29) — only remove it if it is not used elsewhere in the file. Check with:

```bash
grep -n "FileDownloadRoundedIcon" frontend/src/pages/TodayPage.tsx
```

If it appears only on the import line and the button, remove the import.

Add this import:

```ts
import { SyllabusImportDialog } from "./SyllabusImportDialog";
```

Add `SchoolRoundedIcon` to the MUI icons imports:

```ts
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
```

- [ ] **Step 2: Replace `exportDialogOpen` state with `syllabusDialogOpen`**

Remove:

```ts
const [exportDialogOpen, setExportDialogOpen] = useState(false);
```

Add:

```ts
const [syllabusDialogOpen, setSyllabusDialogOpen] = useState(false);
```

- [ ] **Step 3: Replace the Export ICS button with the Syllabus Import button**

Find the Export ICS button (around line 601–608):

```tsx
<Button
  variant="outlined"
  startIcon={<FileDownloadRoundedIcon />}
  onClick={() => setExportDialogOpen(true)}
  sx={{ borderRadius: 2.5 }}
>
  {t("today.exportIcs")}
</Button>
```

Replace with:

```tsx
<Button
  variant="outlined"
  startIcon={<SchoolRoundedIcon />}
  onClick={() => setSyllabusDialogOpen(true)}
  sx={{ borderRadius: 2.5 }}
>
  {t("syllabus.importButton")}
</Button>
```

- [ ] **Step 4: Replace `ExportIcsDialog` with `SyllabusImportDialog` at bottom of JSX**

Find (around line 813–817):

```tsx
<ExportIcsDialog
  open={exportDialogOpen}
  onClose={() => setExportDialogOpen(false)}
  tasks={tasks}
/>
```

Replace with:

```tsx
<SyllabusImportDialog
  open={syllabusDialogOpen}
  onClose={() => setSyllabusDialogOpen(false)}
  onImportSuccess={() => void reloadTasks?.()}
  showToast={(msg, sev) => showToast?.(msg, sev)}
/>
```

- [ ] **Step 5: Run lint and type check**

```bash
cd frontend && npm run lint && npm run build 2>&1 | tail -20
```

Expected: no errors. If `FileDownloadRoundedIcon` is still referenced somewhere, the build will tell you.

- [ ] **Step 6: Run all frontend tests**

```bash
cd frontend && npm run test:run
```

Expected: all pass

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/TodayPage.tsx
git commit -m "feat(today): replace export ICS button with syllabus import (AI)"
```

---

## Task 5 — Version bump and docs

**Files:**
- Modify: `RELEASENOTES.md`
- Modify: `frontend/src/app/releaseNotes.ts`
- Modify: `frontend/src/app/helpCenter.ts`
- Modify: `DEVLOG.md`

- [ ] **Step 1: Determine current version**

```bash
cat frontend/package.json | grep '"version"'
```

Bump minor version (new feature): e.g. `2.11.1` → `2.12.0`.

- [ ] **Step 2: Update `frontend/package.json` version**

Change the `"version"` field to the new version.

- [ ] **Step 3: Add entry to `RELEASENOTES.md`**

Prepend to `RELEASENOTES.md`:

```markdown
## Version {new_version} – Update Released ({today's date})

### What's New
- Added: Import your course syllabus directly from the main task view — tap "Import Syllabus (AI)" to get started

### Improvements
- Improved: The syllabus import setup now asks focused questions (exam prep timing, assignment prep timing, task types to skip) instead of a blank text box — making it easier to guide the AI without writing instructions from scratch
```

- [ ] **Step 4: Prepend entry to `frontend/src/app/releaseNotes.ts`**

Add to the top of the `RELEASE_NOTES` array:

```ts
{
  id: "{YYYY-MM-DD}-syllabus-button-structured-prefs",
  version: "v{new_version}",
  releasedAt: "{YYYY-MM-DD}",
  title: { en: "Syllabus Import from Today View", zh: "今日视图直接导入课程大纲" },
  summary: {
    en: "Import your syllabus right from the main view, with guided preference questions.",
    zh: "可在主页面直接导入课程大纲，并通过引导式问题设置偏好。",
  },
  changes: {
    en: [
      "Added: Import Syllabus (AI) button in the main task view",
      "Improved: Structured preference questions replace the blank hints field in the syllabus wizard",
    ],
    zh: [
      "新增：主任务页面新增「AI 导入课程大纲」按钮",
      "改进：课程大纲向导中的偏好设置改为结构化问题，取代原有空白提示框",
    ],
  },
},
```

- [ ] **Step 5: Update `frontend/src/app/helpCenter.ts`**

In the Help Center, update Section 2 (Quick Walkthroughs) to reflect the new location of the syllabus import button (now in TodayPage, not just Settings). Find any walkthrough that references the Settings page for syllabus import and update it to say "tap Import Syllabus (AI) on the main task view."

Also update Section 3 (Q&A): add or update an entry — "Where do I import a syllabus?" → "Tap the 'Import Syllabus (AI)' button on the main task view."

- [ ] **Step 6: Update `DEVLOG.md`**

Prepend an entry describing: new `syllabusPrefs.ts` module, preferences step inserted into auto path, `goBack` fix for consent, TodayPage button swap, ExportIcsDialog removed from TodayPage (still in Settings).

- [ ] **Step 7: Commit**

```bash
git add RELEASENOTES.md DEVLOG.md frontend/src/app/releaseNotes.ts frontend/src/app/helpCenter.ts frontend/package.json
git commit -m "chore: bump to v{new_version}, update docs for syllabus import button and structured prefs"
```
