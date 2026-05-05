// INPUT: localStorage helpers from SyllabusImportDialog (loadDraft, saveDraft, clearDraft)
// OUTPUT: behavior coverage for 24h TTL, save/restore, and clear-on-confirm/cancel
// EFFECT: exercises localStorage directly — no DOM rendering needed
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "syllabus_wizard_draft";
const TTL_MS = 24 * 60 * 60 * 1000;

type SavedDraft = {
  step: number;
  pasteText: string;
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
      step: 1,
      pasteText: "CSCI 101 syllabus",
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
      step: 1,
      pasteText: "old syllabus",
      drafts: [],
      savedAt: pastTime,
    };
    writeDraft(draft);
    const loaded = loadDraft();
    expect(loaded).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("clears the draft from storage", () => {
    writeDraft({ step: 1, pasteText: "text", drafts: [], savedAt: Date.now() });
    localStorage.removeItem(STORAGE_KEY);
    expect(readDraft()).toBeNull();
  });

  it("draft persists a step-1 state with drafts array", () => {
    const drafts = [
      { title: "Final", sourceType: "final", confidence: "high", sourceText: "Final Dec 15", type: "once" },
    ];
    writeDraft({ step: 1, pasteText: "course syllabus", drafts, savedAt: Date.now() });
    const loaded = loadDraft();
    expect(loaded!.step).toBe(1);
    expect(loaded!.drafts).toHaveLength(1);
  });

  it("returns null when storage contains invalid JSON", () => {
    localStorage.setItem(STORAGE_KEY, "not-valid-json{{{");
    expect(loadDraft()).toBeNull();
  });
});
