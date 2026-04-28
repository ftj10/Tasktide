// INPUT: raw task records, planner dates, and edited occurrence payloads
// OUTPUT: normalized task helpers plus recurrence-aware task transforms
// EFFECT: Keeps one-time, repeating, legacy, and per-occurrence override flows consistent across the planner
import dayjs from "dayjs";

import type { RepeatFrequency, Task, TaskOccurrenceOverride, TaskRecurrence } from "../types";
import { weekdayISO, ymd } from "./date";

export type TaskSaveScope = "series" | "single";

const OCCURRENCE_RANGE_CACHE_LIMIT = 500;
const occurrenceRangeCache = new Map<string, string[]>();
type LegacyTask = Task & { done?: boolean };

function normalizeLegacyCompletedAt(task: Task) {
  if (task.completedAt) return task.completedAt;
  if ((task as LegacyTask).done) return task.updatedAt ?? task.createdAt ?? new Date().toISOString();
  return null;
}

function normalizeOccurrenceOverrides(overrides?: Record<string, TaskOccurrenceOverride>) {
  return Object.fromEntries(
    Object.entries(overrides ?? {}).map(([dateYmd, override]) => [
      dateYmd,
      {
        ...override,
        completedAt: override?.completedAt ?? null,
        deleted: override?.deleted ? true : undefined,
      },
    ])
  );
}

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
    occurrenceOverrides: normalizeOccurrenceOverrides(task.occurrenceOverrides),
    completedAt: type === "ONCE" ? normalizeLegacyCompletedAt(task) : null,
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
  return getTaskOccurrenceFromNormalizedTask(normalized, dateYmd);
}

export function getTaskOccurrenceCompletedAt(task: Task, dateYmd: string) {
  const normalized = normalizeTask(task);
  if (normalized.recurrence?.frequency === "NONE") {
    return normalized.beginDate === dateYmd ? normalized.completedAt ?? null : null;
  }

  if (normalized.occurrenceOverrides?.[dateYmd]?.deleted) {
    return null;
  }

  return normalized.occurrenceOverrides?.[dateYmd]?.completedAt ?? null;
}

export function isTaskOccurrenceCompleted(task: Task, dateYmd: string) {
  return Boolean(getTaskOccurrenceCompletedAt(task, dateYmd));
}

export function getTaskOccurrenceSnapshotFromNormalizedTask(task: Task, dateYmd: string): Task | null {
  if (task.recurrence?.frequency === "NONE") {
    return task.beginDate === dateYmd ? task : null;
  }

  if (!matchesRecurrence(task, dateYmd)) return null;

  const override = task.occurrenceOverrides?.[dateYmd];
  if (override?.deleted) return null;
  return override ? { ...task, ...override } : task;
}

export function getTaskOccurrenceFromNormalizedTask(task: Task, dateYmd: string): Task | null {
  const occurrence = getTaskOccurrenceSnapshotFromNormalizedTask(task, dateYmd);
  if (!occurrence) return null;
  if (isTaskOccurrenceCompleted(task, dateYmd)) return null;
  return occurrence;
}

export function listRecurringOccurrenceDatesForNormalizedTask(
  task: Task,
  rangeStart: dayjs.Dayjs,
  rangeEnd: dayjs.Dayjs
) {
  const recurrence = task.recurrence;
  const beginDate = task.beginDate;
  if (!recurrence || recurrence.frequency === "NONE" || !beginDate) return [];

  const safeRangeStart = rangeStart.startOf("day");
  const safeRangeEnd = rangeEnd.startOf("day");
  if (!safeRangeStart.isBefore(safeRangeEnd, "day")) return [];

  const cacheKey = [
    task.id,
    beginDate,
    recurrence.frequency,
    recurrence.interval ?? 1,
    recurrence.until ?? "",
    (recurrence.weekdays ?? []).join(","),
    (recurrence.monthDays ?? []).join(","),
    ymd(safeRangeStart),
    ymd(safeRangeEnd),
  ].join("|");
  const cached = occurrenceRangeCache.get(cacheKey);
  if (cached) return cached;

  const dates = listRecurringOccurrenceDates(task, safeRangeStart, safeRangeEnd);
  if (occurrenceRangeCache.size >= OCCURRENCE_RANGE_CACHE_LIMIT) {
    occurrenceRangeCache.clear();
  }
  occurrenceRangeCache.set(cacheKey, dates);
  return dates;
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
    completedAt: edited.completedAt ?? source.completedAt ?? null,
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

export function saveTaskCollection(
  allTasks: Task[],
  savedTask: Task,
  options: {
    editingSourceTask?: Task;
    scope?: TaskSaveScope;
    occurrenceDateYmd?: string;
  } = {}
) {
  const editingSourceTaskId = options.editingSourceTask?.id;
  const occurrenceDateYmd = options.occurrenceDateYmd;

  if (
    options.editingSourceTask &&
    editingSourceTaskId &&
    isRecurringTask(options.editingSourceTask) &&
    options.scope === "single" &&
    occurrenceDateYmd
  ) {
    return allTasks.map((item) =>
      item.id === editingSourceTaskId
        ? applySingleOccurrenceEdit(item, occurrenceDateYmd, savedTask)
        : item
    );
  }

  const sourceId = options.editingSourceTask?.id ?? savedTask.id;
  const nextTask = options.editingSourceTask
    ? applySeriesEdit(options.editingSourceTask, savedTask)
    : normalizeTask(savedTask);

  return [...allTasks.filter((item) => item.id !== sourceId), nextTask];
}

export function removeTaskFromCollection(
  allTasks: Task[],
  taskId: string,
  options: {
    editingSourceTask?: Task;
    scope?: TaskSaveScope;
    occurrenceDateYmd?: string;
    updatedAt?: string;
  } = {}
) {
  const editingSourceTaskId = options.editingSourceTask?.id;
  const occurrenceDateYmd = options.occurrenceDateYmd;

  if (
    options.editingSourceTask &&
    editingSourceTaskId &&
    isRecurringTask(options.editingSourceTask) &&
    options.scope === "single" &&
    occurrenceDateYmd
  ) {
    const updatedAt = options.updatedAt ?? new Date().toISOString();

    return allTasks.map((task) =>
      task.id === editingSourceTaskId
        ? removeSingleOccurrenceFromSeries(task, occurrenceDateYmd, updatedAt)
        : task
    );
  }

  return allTasks.filter((task) => task.id !== taskId);
}

export function completeTaskInCollection(
  allTasks: Task[],
  taskId: string,
  options: {
    completedAt?: string;
    occurrenceDateYmd?: string;
    updatedAt?: string;
  } = {}
) {
  const completionAt = options.completedAt ?? new Date().toISOString();
  const updatedAt = options.updatedAt ?? completionAt;

  return allTasks.map((task) => {
    if (task.id !== taskId) return task;
    const normalized = normalizeTask(task);

    if (normalized.recurrence?.frequency === "NONE") {
      return {
        ...normalized,
        completedAt: completionAt,
        updatedAt,
      };
    }

    if (!options.occurrenceDateYmd) {
      return normalized;
    }

    const currentOverride = normalized.occurrenceOverrides?.[options.occurrenceDateYmd] ?? {};
    const nextOverride = stripEmptyOverride({
      ...currentOverride,
      completedAt: completionAt,
    });

    return {
      ...normalized,
      occurrenceOverrides: {
        ...(normalized.occurrenceOverrides ?? {}),
        ...(nextOverride ? { [options.occurrenceDateYmd]: nextOverride } : {}),
      },
      updatedAt,
    };
  });
}

export function reopenTaskInCollection(
  allTasks: Task[],
  taskId: string,
  options: {
    occurrenceDateYmd?: string;
    updatedAt?: string;
  } = {}
) {
  const updatedAt = options.updatedAt ?? new Date().toISOString();

  return allTasks.map((task) => {
    if (task.id !== taskId) return task;
    const normalized = normalizeTask(task);

    if (normalized.recurrence?.frequency === "NONE") {
      return {
        ...normalized,
        completedAt: null,
        updatedAt,
      };
    }

    if (!options.occurrenceDateYmd) {
      return normalized;
    }

    const currentOverride = {
      ...(normalized.occurrenceOverrides?.[options.occurrenceDateYmd] ?? {}),
    };
    delete currentOverride.completedAt;

    const nextOccurrenceOverrides = {
      ...(normalized.occurrenceOverrides ?? {}),
    };
    const nextOverride = stripEmptyOverride(currentOverride);

    if (nextOverride) {
      nextOccurrenceOverrides[options.occurrenceDateYmd] = nextOverride;
    } else {
      delete nextOccurrenceOverrides[options.occurrenceDateYmd];
    }

    return {
      ...normalized,
      occurrenceOverrides: nextOccurrenceOverrides,
      updatedAt,
    };
  });
}

export function areTasksEqual(sourceTask: Task, targetTask: Task) {
  const source = normalizeTask(sourceTask);
  const target = normalizeTask(targetTask);

  return (
    source.id === target.id &&
    source.title === target.title &&
    source.type === target.type &&
    source.weekday === target.weekday &&
    source.date === target.date &&
    source.beginDate === target.beginDate &&
    source.emergency === target.emergency &&
    (source.completedAt ?? null) === (target.completedAt ?? null) &&
    source.createdAt === target.createdAt &&
    source.updatedAt === target.updatedAt &&
    (source.location ?? "") === (target.location ?? "") &&
    (source.mapProvider ?? "google") === (target.mapProvider ?? "google") &&
    (source.startTime ?? "") === (target.startTime ?? "") &&
    (source.endTime ?? "") === (target.endTime ?? "") &&
    (source.description ?? "") === (target.description ?? "") &&
    areRecurrencesEqual(source.recurrence, target.recurrence) &&
    areOccurrenceOverridesEqual(source.occurrenceOverrides, target.occurrenceOverrides)
  );
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

function areRecurrencesEqual(source?: TaskRecurrence, target?: TaskRecurrence) {
  if (!source && !target) return true;
  if (!source || !target) return false;

  return (
    source.frequency === target.frequency &&
    (source.interval ?? 1) === (target.interval ?? 1) &&
    (source.until ?? null) === (target.until ?? null) &&
    areNumberArraysEqual(source.weekdays, target.weekdays) &&
    areNumberArraysEqual(source.monthDays, target.monthDays)
  );
}

function areNumberArraysEqual(source?: number[], target?: number[]) {
  const left = source ?? [];
  const right = target ?? [];
  if (left.length !== right.length) return false;

  return left.every((value, index) => value === right[index]);
}

function areOccurrenceOverridesEqual(
  source?: Record<string, TaskOccurrenceOverride>,
  target?: Record<string, TaskOccurrenceOverride>
) {
  const sourceEntries = Object.entries(source ?? {}).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
  const targetEntries = Object.entries(target ?? {}).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

  if (sourceEntries.length !== targetEntries.length) return false;

  return sourceEntries.every(([sourceDate, sourceOverride], index) => {
    const [targetDate, targetOverride] = targetEntries[index] ?? [];

    return sourceDate === targetDate && areOccurrenceOverrideFieldsEqual(sourceOverride, targetOverride);
  });
}

function areOccurrenceOverrideFieldsEqual(source?: TaskOccurrenceOverride, target?: TaskOccurrenceOverride) {
  return (
    (source?.title ?? "") === (target?.title ?? "") &&
    source?.emergency === target?.emergency &&
    (source?.location ?? "") === (target?.location ?? "") &&
    (source?.mapProvider ?? "google") === (target?.mapProvider ?? "google") &&
    (source?.startTime ?? "") === (target?.startTime ?? "") &&
    (source?.endTime ?? "") === (target?.endTime ?? "") &&
    (source?.description ?? "") === (target?.description ?? "") &&
    (source?.completedAt ?? null) === (target?.completedAt ?? null) &&
    Boolean(source?.deleted) === Boolean(target?.deleted)
  );
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

function listRecurringOccurrenceDates(task: Task, rangeStart: dayjs.Dayjs, rangeEnd: dayjs.Dayjs) {
  const recurrence = task.recurrence;
  const beginDate = task.beginDate;
  if (!recurrence || recurrence.frequency === "NONE" || !beginDate) return [];

  const start = dayjs(beginDate).startOf("day");
  const until = recurrence.until ? dayjs(recurrence.until).startOf("day") : null;
  const results: string[] = [];

  if (recurrence.frequency === "DAILY") {
    const interval = recurrence.interval ?? 1;
    const firstCandidateBase = rangeStart.isAfter(start, "day") ? rangeStart : start;
    const dayDiff = firstCandidateBase.diff(start, "day");
    const remainder = dayDiff % interval;
    let cursor = remainder === 0 ? firstCandidateBase : firstCandidateBase.add(interval - remainder, "day");

    while (cursor.isBefore(rangeEnd, "day")) {
      if (until && cursor.isAfter(until, "day")) break;
      results.push(ymd(cursor));
      cursor = cursor.add(interval, "day");
    }

    return results;
  }

  if (recurrence.frequency === "WEEKLY") {
    const interval = recurrence.interval ?? 1;
    const weekdays = new Set(recurrence.weekdays ?? []);
    const firstCandidateBase = rangeStart.isAfter(start, "day") ? rangeStart : start;
    const initialCycle = Math.floor(firstCandidateBase.diff(start, "day") / 7);
    const cycleRemainder = initialCycle % interval;
    let cycleIndex = cycleRemainder === 0 ? initialCycle : initialCycle + (interval - cycleRemainder);

    for (
      let cycleStart = start.add(cycleIndex * 7, "day");
      cycleStart.isBefore(rangeEnd, "day");
      cycleStart = cycleStart.add(interval * 7, "day")
    ) {
      for (let offset = 0; offset < 7; offset += 1) {
        const candidate = cycleStart.add(offset, "day");
        if (candidate.isBefore(firstCandidateBase, "day")) continue;
        if (!candidate.isBefore(rangeEnd, "day")) break;
        if (until && candidate.isAfter(until, "day")) return results;
        if (weekdays.has(weekdayISO(candidate))) {
          results.push(ymd(candidate));
        }
      }
    }

    return results;
  }

  if (recurrence.frequency === "MONTHLY") {
    const interval = recurrence.interval ?? 1;
    const monthDays = recurrence.monthDays ?? [];
    const startMonthIndex = start.year() * 12 + start.month();
    const rangeMonthIndex = rangeStart.year() * 12 + rangeStart.month();
    const initialMonthDiff = Math.max(0, rangeMonthIndex - startMonthIndex);
    const monthRemainder = initialMonthDiff % interval;
    let monthDiff = monthRemainder === 0 ? initialMonthDiff : initialMonthDiff + (interval - monthRemainder);

    for (
      let currentMonth = start.startOf("month").add(monthDiff, "month");
      currentMonth.isBefore(rangeEnd, "day");
      currentMonth = currentMonth.add(interval, "month")
    ) {
      for (const monthDay of monthDays) {
        const candidate = createCalendarDate(currentMonth.year(), currentMonth.month(), monthDay);
        if (!candidate) continue;
        if (candidate.isBefore(start, "day")) continue;
        if (candidate.isBefore(rangeStart, "day")) continue;
        if (!candidate.isBefore(rangeEnd, "day")) continue;
        if (until && candidate.isAfter(until, "day")) return results;
        results.push(ymd(candidate));
      }
    }

    return results;
  }

  if (recurrence.frequency === "YEARLY") {
    const interval = recurrence.interval ?? 1;
    const initialYearDiff = Math.max(0, rangeStart.year() - start.year());
    const yearRemainder = initialYearDiff % interval;
    let yearDiff = yearRemainder === 0 ? initialYearDiff : initialYearDiff + (interval - yearRemainder);

    while (start.year() + yearDiff <= rangeEnd.year()) {
      const candidateYear = start.year() + yearDiff;
      const candidate = createCalendarDate(candidateYear, start.month(), start.date());
      if (candidate && !candidate.isBefore(rangeEnd, "day")) break;
      if (candidate && until && candidate.isAfter(until, "day")) break;
      if (candidate && !candidate.isBefore(rangeStart, "day") && !candidate.isBefore(start, "day")) {
        results.push(ymd(candidate));
      }
      yearDiff += interval;
    }
  }

  return results;
}

function createCalendarDate(year: number, monthIndex: number, dayOfMonth: number) {
  const candidate = dayjs(new Date(year, monthIndex, dayOfMonth)).startOf("day");
  if (candidate.year() !== year || candidate.month() !== monthIndex || candidate.date() !== dayOfMonth) {
    return null;
  }
  return candidate;
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
  const nextEntries = Object.entries(override).filter(([key, value]) => {
    if (value === undefined || value === null) return false;
    if (key === "deleted" && value !== true) return false;
    return true;
  });
  if (nextEntries.length === 0) return undefined;
  return Object.fromEntries(nextEntries) as TaskOccurrenceOverride;
}

function removeSingleOccurrenceFromSeries(sourceTask: Task, dateYmd: string, updatedAt: string): Task {
  const source = normalizeTask(sourceTask);
  const currentOverride = {
    ...(source.occurrenceOverrides?.[dateYmd] ?? {}),
  };

  delete currentOverride.completedAt;

  const nextOverride = stripEmptyOverride({
    ...currentOverride,
    deleted: true,
  });

  return {
    ...source,
    occurrenceOverrides: {
      ...(source.occurrenceOverrides ?? {}),
      ...(nextOverride ? { [dateYmd]: nextOverride } : {}),
    },
    updatedAt,
  };
}
