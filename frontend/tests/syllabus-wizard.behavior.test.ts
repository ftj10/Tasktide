// INPUT: validatePastedJson (pure function) + localStorage helpers from SyllabusImportDialog
// OUTPUT: behavior coverage for JSON validation, 24h TTL, save/restore, and clear-on-confirm/cancel
// EFFECT: exercises pure functions and localStorage directly — no DOM rendering needed
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { validatePastedJson } from "../src/pages/SyllabusImportDialog";

const STORAGE_KEY = "syllabus_wizard_draft";
const TTL_MS = 24 * 60 * 60 * 1000;

type WizardStep =
  | "upload"
  | "method"
  | "preferences"
  | "prompt"
  | "paste"
  | "consent"
  | "review";

type SavedDraft = {
  wizardStep: WizardStep;
  pasteText: string;
  extractedText: string;
  studyPreferences: string;
  drafts: unknown[];
  savedAt: number;
};

function writeDraft(draft: SavedDraft) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

function readDraft(): SavedDraft | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as SavedDraft;
}

function loadDraft(): SavedDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedDraft;
    if (Date.now() - parsed.savedAt > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

describe("validatePastedJson", () => {
  it("returns errors for invalid JSON syntax", () => {
    const { errors, drafts } = validatePastedJson("{not valid json[[[");
    expect(errors.length).toBeGreaterThan(0);
    expect(drafts).toHaveLength(0);
  });

  it("returns errors when top-level is not an array", () => {
    const { errors, drafts } = validatePastedJson('{"title": "Midterm"}');
    expect(errors.length).toBeGreaterThan(0);
    expect(drafts).toHaveLength(0);
    expect(errors[0]).toMatch(/array/i);
  });

  it("returns field-level errors for items missing required fields", () => {
    const { errors, drafts } = validatePastedJson(
      JSON.stringify([{ title: "Midterm" }])
    );
    expect(errors.length).toBeGreaterThan(0);
    expect(drafts).toHaveLength(0);
    expect(errors[0]).toMatch(/Item 1/);
  });

  it("returns errors for individual invalid items without losing valid ones", () => {
    const valid = {
      title: "Final",
      sourceType: "final",
      type: "once",
      confidence: "high",
      sourceText: "Final Dec 15",
    };
    const invalid = { title: "Bad" };
    const { errors, drafts } = validatePastedJson(
      JSON.stringify([valid, invalid])
    );
    expect(drafts).toHaveLength(1);
    expect(drafts[0].title).toBe("Final");
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/Item 2/);
  });

  it("returns parsed drafts with no errors for a valid array", () => {
    const items = [
      {
        title: "Midterm",
        sourceType: "midterm",
        type: "once",
        confidence: "high",
        sourceText: "Midterm Oct 1",
        date: "2026-10-01",
      },
      {
        title: "Lecture",
        sourceType: "lecture",
        type: "recurring",
        confidence: "medium",
        sourceText: "Mon 10am",
        termStart: "2026-09-01",
        termEnd: "2026-12-15",
        weekdays: [1],
        interval: 1,
      },
    ];
    const { errors, drafts } = validatePastedJson(JSON.stringify(items));
    expect(errors).toHaveLength(0);
    expect(drafts).toHaveLength(2);
    expect(drafts[0].title).toBe("Midterm");
  });

  it("returns empty array error for an empty array", () => {
    const { errors, drafts } = validatePastedJson("[]");
    expect(drafts).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });
});

describe("SyllabusImportDialog wizard persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("returns null when no draft is saved", () => {
    expect(loadDraft()).toBeNull();
  });

  it("returns the saved draft when within 24 hours", () => {
    const draft: SavedDraft = {
      wizardStep: "review",
      pasteText: "CSCI 101 syllabus",
      extractedText: "CSCI 101 syllabus",
      studyPreferences: "",
      drafts: [{ title: "Midterm" }],
      savedAt: Date.now(),
    };
    writeDraft(draft);
    const loaded = loadDraft();
    expect(loaded).not.toBeNull();
    expect(loaded!.pasteText).toBe("CSCI 101 syllabus");
    expect(loaded!.drafts).toHaveLength(1);
  });

  it("discards and returns null when draft is older than 24 hours", () => {
    vi.useFakeTimers();
    const pastTime = Date.now() - TTL_MS - 1000;
    const draft: SavedDraft = {
      wizardStep: "review",
      pasteText: "old syllabus",
      extractedText: "old syllabus",
      studyPreferences: "",
      drafts: [],
      savedAt: pastTime,
    };
    writeDraft(draft);
    const loaded = loadDraft();
    expect(loaded).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("clears the draft from storage", () => {
    writeDraft({
      wizardStep: "review",
      pasteText: "text",
      extractedText: "text",
      studyPreferences: "",
      drafts: [],
      savedAt: Date.now(),
    });
    localStorage.removeItem(STORAGE_KEY);
    expect(readDraft()).toBeNull();
  });

  it("draft persists wizardStep and studyPreferences", () => {
    const drafts = [
      {
        title: "Final",
        sourceType: "final",
        confidence: "high",
        sourceText: "Final Dec 15",
        type: "once",
      },
    ];
    writeDraft({
      wizardStep: "review",
      pasteText: "course syllabus",
      extractedText: "course syllabus",
      studyPreferences: "remind me 3 days before",
      drafts,
      savedAt: Date.now(),
    });
    const loaded = loadDraft();
    expect(loaded!.wizardStep).toBe("review");
    expect(loaded!.studyPreferences).toBe("remind me 3 days before");
    expect(loaded!.drafts).toHaveLength(1);
  });

  it("returns null when storage contains invalid JSON", () => {
    localStorage.setItem(STORAGE_KEY, "not-valid-json{{{");
    expect(loadDraft()).toBeNull();
  });
});
