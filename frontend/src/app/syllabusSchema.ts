import { z } from "zod";

import type { Task, TaskRecurrence } from "../types";

export const SourceTypeSchema = z.enum([
  "final",
  "midterm",
  "assignment",
  "quiz",
  "project",
  "prep",
  "lecture",
  "lab",
  "tutorial",
  "other",
  "office_hour",
  "reading",
]);

export const SyllabusTaskDraftSchema = z.object({
  title: z.string().min(1),
  sourceType: SourceTypeSchema,
  type: z.enum(["recurring", "once"]),
  termStart: z.string().optional(),
  termEnd: z.string().optional(),
  date: z.string().optional(),
  weekdays: z.array(z.number().int().min(1).max(7)).optional(),
  interval: z.number().int().positive().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  excludedDates: z.array(z.string()).optional(),
  confidence: z.enum(["high", "medium", "low"]),
  sourceText: z.string(),
});

export type SyllabusTaskDraft = z.infer<typeof SyllabusTaskDraftSchema>;
export type SyllabusImportDraftResult = SyllabusTaskDraft[];

const SOURCE_TYPE_EMERGENCY: Record<string, number> = {
  final: 1,
  midterm: 1,
  assignment: 2,
  quiz: 2,
  project: 2,
  prep: 3,
  lecture: 4,
  lab: 4,
  tutorial: 4,
  other: 4,
  office_hour: 5,
  reading: 5,
};

export function transformDraft(draft: SyllabusTaskDraft): Task {
  const now = new Date().toISOString();
  const id =
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  const emergency = SOURCE_TYPE_EMERGENCY[draft.sourceType] ?? 4;

  const occurrenceOverrides =
    draft.excludedDates?.length
      ? Object.fromEntries(
          draft.excludedDates.map((date) => [date, { deleted: true as const }])
        )
      : undefined;

  if (draft.type === "once") {
    return {
      id,
      title: draft.title,
      type: "ONCE",
      date: draft.date,
      beginDate: draft.date,
      emergency,
      startTime: draft.startTime,
      endTime: draft.endTime,
      location: draft.location,
      description: draft.description,
      occurrenceOverrides,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  const recurrence: TaskRecurrence = {
    frequency: draft.weekdays?.length ? "WEEKLY" : "DAILY",
    interval: draft.interval ?? 1,
    weekdays: draft.weekdays,
    until: draft.termEnd ?? null,
  };

  return {
    id,
    title: draft.title,
    type: "RECURRING",
    beginDate: draft.termStart,
    endDate: draft.termEnd,
    recurrence,
    emergency,
    startTime: draft.startTime,
    endTime: draft.endTime,
    location: draft.location,
    description: draft.description,
    occurrenceOverrides,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}
