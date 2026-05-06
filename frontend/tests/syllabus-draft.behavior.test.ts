import { describe, expect, it } from "vitest";

import {
  SyllabusTaskDraftSchema,
  transformDraft,
  type SyllabusTaskDraft,
} from "../src/app/syllabusSchema";

const baseDraft: SyllabusTaskDraft = {
  title: "Lecture 1",
  sourceType: "lecture",
  type: "once",
  date: "2026-09-07",
  confidence: "high",
  sourceText: "Sept 7 – Lecture 1: Introduction",
};

describe("SyllabusTaskDraftSchema validation", () => {
  it("accepts a valid once draft", () => {
    const result = SyllabusTaskDraftSchema.safeParse(baseDraft);
    expect(result.success).toBe(true);
  });

  it("accepts a valid recurring draft", () => {
    const result = SyllabusTaskDraftSchema.safeParse({
      title: "Weekly Lecture",
      sourceType: "lecture",
      type: "recurring",
      termStart: "2026-09-07",
      termEnd: "2026-12-10",
      weekdays: [1, 3],
      interval: 1,
      confidence: "high",
      sourceText: "Mon/Wed lectures",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a draft with empty title", () => {
    const result = SyllabusTaskDraftSchema.safeParse({ ...baseDraft, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a draft with invalid sourceType", () => {
    const result = SyllabusTaskDraftSchema.safeParse({
      ...baseDraft,
      sourceType: "seminar",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a draft with invalid confidence", () => {
    const result = SyllabusTaskDraftSchema.safeParse({
      ...baseDraft,
      confidence: "certain",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a draft with missing required fields", () => {
    const result = SyllabusTaskDraftSchema.safeParse({ title: "X" });
    expect(result.success).toBe(false);
  });

  it("rejects a draft with invalid weekday out of range", () => {
    const result = SyllabusTaskDraftSchema.safeParse({
      ...baseDraft,
      type: "recurring",
      weekdays: [0],
    });
    expect(result.success).toBe(false);
  });

  it.each([
    "final", "midterm", "assignment", "quiz", "project",
    "prep", "lecture", "lab", "tutorial", "other",
    "office_hour", "reading",
  ])("accepts sourceType %s", (sourceType) => {
    const result = SyllabusTaskDraftSchema.safeParse({
      ...baseDraft,
      sourceType,
    });
    expect(result.success).toBe(true);
  });
});

describe("transformDraft — sourceType → emergency", () => {
  function emergency(sourceType: SyllabusTaskDraft["sourceType"]) {
    return transformDraft({ ...baseDraft, sourceType }).emergency;
  }

  it("maps final to 1", () => expect(emergency("final")).toBe(1));
  it("maps midterm to 1", () => expect(emergency("midterm")).toBe(1));
  it("maps assignment to 2", () => expect(emergency("assignment")).toBe(2));
  it("maps quiz to 2", () => expect(emergency("quiz")).toBe(2));
  it("maps project to 2", () => expect(emergency("project")).toBe(2));
  it("maps prep to 3", () => expect(emergency("prep")).toBe(3));
  it("maps lecture to 4", () => expect(emergency("lecture")).toBe(4));
  it("maps lab to 4", () => expect(emergency("lab")).toBe(4));
  it("maps tutorial to 4", () => expect(emergency("tutorial")).toBe(4));
  it("maps other to 4", () => expect(emergency("other")).toBe(4));
  it("maps office_hour to 5", () => expect(emergency("office_hour")).toBe(5));
  it("maps reading to 5", () => expect(emergency("reading")).toBe(5));
});

describe("transformDraft — once task shape", () => {
  it("produces a ONCE task with the correct date and fields", () => {
    const task = transformDraft({
      ...baseDraft,
      title: "Final Exam",
      sourceType: "final",
      date: "2026-12-15",
      startTime: "09:00",
      endTime: "12:00",
      location: "Gym Hall",
    });
    expect(task.type).toBe("ONCE");
    expect(task.date).toBe("2026-12-15");
    expect(task.beginDate).toBe("2026-12-15");
    expect(task.emergency).toBe(1);
    expect(task.startTime).toBe("09:00");
    expect(task.endTime).toBe("12:00");
    expect(task.location).toBe("Gym Hall");
    expect(task.completedAt).toBeNull();
    expect(typeof task.id).toBe("string");
    expect(task.id.length).toBeGreaterThan(0);
  });
});

describe("transformDraft — recurring task shape", () => {
  it("produces a RECURRING task with WEEKLY recurrence when weekdays are given", () => {
    const task = transformDraft({
      title: "Weekly Lecture",
      sourceType: "lecture",
      type: "recurring",
      termStart: "2026-09-07",
      termEnd: "2026-12-10",
      weekdays: [1, 3],
      interval: 1,
      confidence: "high",
      sourceText: "Mon/Wed lectures",
    });
    expect(task.type).toBe("RECURRING");
    expect(task.beginDate).toBe("2026-09-07");
    expect(task.endDate).toBe("2026-12-10");
    expect(task.recurrence?.frequency).toBe("WEEKLY");
    expect(task.recurrence?.weekdays).toEqual([1, 3]);
    expect(task.recurrence?.interval).toBe(1);
    expect(task.recurrence?.until).toBe("2026-12-10");
    expect(task.completedAt).toBeNull();
  });

  it("falls back to DAILY frequency when no weekdays are specified", () => {
    const task = transformDraft({
      title: "Daily Reading",
      sourceType: "reading",
      type: "recurring",
      termStart: "2026-09-07",
      termEnd: "2026-12-10",
      interval: 1,
      confidence: "medium",
      sourceText: "Daily reading assignment",
    });
    expect(task.recurrence?.frequency).toBe("DAILY");
  });
});

describe("transformDraft — excludedDates → occurrenceOverrides", () => {
  it("converts excludedDates to occurrenceOverrides with deleted: true", () => {
    const task = transformDraft({
      title: "Weekly Lecture",
      sourceType: "lecture",
      type: "recurring",
      termStart: "2026-09-07",
      termEnd: "2026-12-10",
      weekdays: [1],
      excludedDates: ["2026-10-12", "2026-11-09"],
      confidence: "high",
      sourceText: "Mon lectures (no class Oct 12, Nov 9)",
    });
    expect(task.occurrenceOverrides?.["2026-10-12"]).toEqual({ deleted: true });
    expect(task.occurrenceOverrides?.["2026-11-09"]).toEqual({ deleted: true });
  });

  it("omits occurrenceOverrides when excludedDates is empty", () => {
    const task = transformDraft({ ...baseDraft, excludedDates: [] });
    expect(task.occurrenceOverrides).toBeUndefined();
  });

  it("omits occurrenceOverrides when excludedDates is absent", () => {
    const task = transformDraft(baseDraft);
    expect(task.occurrenceOverrides).toBeUndefined();
  });
});
