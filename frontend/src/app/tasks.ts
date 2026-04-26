// INPUT: raw task records, planner dates, and edited occurrence payloads
// OUTPUT: normalized task helpers plus recurrence-aware task transforms
// EFFECT: Keeps one-time, repeating, legacy, and per-occurrence override flows consistent across the planner
import dayjs from "dayjs";

import type { RepeatFrequency, Task, TaskOccurrenceOverride, TaskRecurrence } from "../types";
import { weekdayISO, ymd } from "./date";

export type TaskSaveScope = "series" | "single";

export function normalizeTask(task: Task): Task {
  const beginDate = task.beginDate ?? task.date ?? normalizeLegacyPermanentBeginDate(task);
  const recurrence = normalizeRecurrence(task, beginDate);
  const type = recurrence.frequency === "NONE" ? "ONCE" : "RECURRING";

  return {
    ...task,
    type,
    beginDate,
    recurrence,
    date: type === "ONCE" ? beginDate : undefined,
    weekday:
      recurrence.frequency === "WEEKLY" && recurrence.weekdays && recurrence.weekdays.length === 1
        ? recurrence.weekdays[0]
        : undefined,
    occurrenceOverrides: task.occurrenceOverrides ?? {},
    done: type === "ONCE" ? Boolean(task.done) : undefined,
  };
}

export function normalizeTasks(tasks: Task[]): Task[] {
  return tasks.map(normalizeTask);
}

export function isRecurringTask(task: Task) {
  return normalizeTask(task).recurrence?.frequency !== "NONE";
}

export function isOneTimeTask(task: Task) {
  return !isRecurringTask(task);
}

export function getRepeatFrequency(task: Task): RepeatFrequency {
  return normalizeTask(task).recurrence?.frequency ?? "NONE";
}

export function getRepeatLabelKey(task: Task) {
  const frequency = getRepeatFrequency(task);
  if (frequency === "DAILY") return "dialog.repeatOptions.daily";
  if (frequency === "WEEKLY") return "dialog.repeatOptions.weekly";
  if (frequency === "MONTHLY") return "dialog.repeatOptions.monthly";
  if (frequency === "YEARLY") return "dialog.repeatOptions.yearly";
  return "dialog.repeatOptions.none";
}

export function getTaskOccurrence(task: Task, dateYmd: string): Task | null {
  const normalized = normalizeTask(task);
  if (normalized.recurrence?.frequency === "NONE") {
    if (normalized.beginDate !== dateYmd || normalized.done) return null;
    return normalized;
  }

  if (!matchesRecurrence(normalized, dateYmd)) return null;

  const override = normalized.occurrenceOverrides?.[dateYmd];
  return override ? { ...normalized, ...override } : normalized;
}

export function applySeriesEdit(sourceTask: Task, editedTask: Task): Task {
  const source = normalizeTask(sourceTask);
  const edited = normalizeTask(editedTask);

  return {
    ...source,
    ...pickEditableFields(edited),
    type: edited.type,
    beginDate: edited.beginDate,
    recurrence: edited.recurrence,
    date: edited.date,
    weekday: edited.weekday,
    done: edited.done,
    updatedAt: edited.updatedAt,
  };
}

export function applySingleOccurrenceEdit(sourceTask: Task, dateYmd: string, editedTask: Task): Task {
  const source = normalizeTask(sourceTask);
  const edited = normalizeTask(editedTask);
  const nextOverride = stripEmptyOverride({
    ...(source.occurrenceOverrides?.[dateYmd] ?? {}),
    ...pickOccurrenceOverrideFields(edited),
  });

  return {
    ...source,
    occurrenceOverrides: {
      ...(source.occurrenceOverrides ?? {}),
      ...(nextOverride ? { [dateYmd]: nextOverride } : {}),
    },
    updatedAt: edited.updatedAt,
  };
}

function normalizeLegacyPermanentBeginDate(task: Task) {
  if (task.type !== "PERMANENT") return task.beginDate;
  const base = task.createdAt ? dayjs(task.createdAt) : dayjs();
  if (typeof task.weekday !== "number") return ymd(base.startOf("day"));
  let cursor = base.startOf("day");
  while (weekdayISO(cursor) !== task.weekday) {
    cursor = cursor.subtract(1, "day");
  }
  return ymd(cursor);
}

function normalizeRecurrence(task: Task, beginDate?: string): TaskRecurrence {
  if (task.recurrence) {
    const frequency = task.recurrence.frequency ?? "NONE";
    return {
      frequency,
      interval: clampInterval(task.recurrence.interval),
      weekdays:
        frequency === "WEEKLY"
          ? uniqueSortedNumbers(task.recurrence.weekdays?.length ? task.recurrence.weekdays : inferWeeklyDays(task, beginDate))
          : undefined,
      monthDays:
        frequency === "MONTHLY"
          ? uniqueSortedNumbers(task.recurrence.monthDays?.length ? task.recurrence.monthDays : inferMonthlyDays(beginDate))
          : undefined,
      until: task.recurrence.until ?? null,
    };
  }

  if (task.type === "PERMANENT") {
    return {
      frequency: "WEEKLY",
      interval: 1,
      weekdays: uniqueSortedNumbers(inferWeeklyDays(task, beginDate)),
      until: null,
    };
  }

  return {
    frequency: "NONE",
    interval: 1,
    until: null,
  };
}

function inferWeeklyDays(task: Task, beginDate?: string) {
  if (typeof task.weekday === "number") return [task.weekday];
  if (beginDate) return [weekdayISO(dayjs(beginDate))];
  return [weekdayISO(dayjs())];
}

function inferMonthlyDays(beginDate?: string) {
  const safeDate = beginDate ? dayjs(beginDate) : dayjs();
  return [safeDate.date()];
}

function clampInterval(interval?: number) {
  const value = Number(interval ?? 1);
  if (Number.isNaN(value)) return 1;
  return Math.min(10, Math.max(1, value));
}

function uniqueSortedNumbers(values?: number[]) {
  return [...new Set((values ?? []).filter((value) => Number.isFinite(value)))].sort((a, b) => a - b);
}

function matchesRecurrence(task: Task, dateYmd: string) {
  const recurrence = task.recurrence;
  const beginDate = task.beginDate;
  if (!recurrence || !beginDate) return false;

  const target = dayjs(dateYmd);
  const start = dayjs(beginDate);

  if (target.isBefore(start, "day")) return false;
  if (recurrence.until && target.isAfter(dayjs(recurrence.until), "day")) return false;

  if (recurrence.frequency === "DAILY") {
    return target.diff(start, "day") % (recurrence.interval ?? 1) === 0;
  }

  if (recurrence.frequency === "WEEKLY") {
    const weekDiff = target.startOf("day").diff(start.startOf("day"), "week");
    return weekDiff % (recurrence.interval ?? 1) === 0 && (recurrence.weekdays ?? []).includes(weekdayISO(target));
  }

  if (recurrence.frequency === "MONTHLY") {
    const monthDiff =
      target.year() * 12 +
      target.month() -
      (start.year() * 12 + start.month());
    return monthDiff % (recurrence.interval ?? 1) === 0 && (recurrence.monthDays ?? []).includes(target.date());
  }

  if (recurrence.frequency === "YEARLY") {
    return (
      target.diff(start, "year") % (recurrence.interval ?? 1) === 0 &&
      target.month() === start.month() &&
      target.date() === start.date()
    );
  }

  return false;
}

function pickEditableFields(task: Task) {
  return {
    title: task.title,
    emergency: task.emergency,
    location: task.location ?? "",
    mapProvider: task.mapProvider ?? "google",
    startTime: task.startTime ?? "",
    endTime: task.endTime ?? "",
    description: task.description ?? "",
  };
}

function pickOccurrenceOverrideFields(task: Task): TaskOccurrenceOverride {
  return stripEmptyOverride({
    title: task.title,
    emergency: task.emergency,
    location: task.location ?? "",
    mapProvider: task.mapProvider ?? "google",
    startTime: task.startTime ?? "",
    endTime: task.endTime ?? "",
    description: task.description ?? "",
  }) ?? {};
}

function stripEmptyOverride(override: TaskOccurrenceOverride) {
  const nextEntries = Object.entries(override).filter(([, value]) => value !== undefined);
  if (nextEntries.length === 0) return undefined;
  return Object.fromEntries(nextEntries) as TaskOccurrenceOverride;
}
