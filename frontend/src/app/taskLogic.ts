// INPUT: task collections, date ranges, and persisted completion timestamps
// OUTPUT: filtered task lists and calendar event records
// EFFECT: Converts raw planner data into the day and week views used across the scheduling features
import dayjs from "dayjs";
import type { Task } from "../types";
import {
  getTaskOccurrenceCompletedAt,
  getTaskOccurrenceFromNormalizedTask,
  getTaskOccurrenceSnapshotFromNormalizedTask,
  listRecurringOccurrenceDatesForNormalizedTask,
  normalizeTask,
} from "./tasks";

export type ProductivityStats = {
  completedCount: number;
  totalCount: number;
  completionRate: number;
};

export type DailyProductivityStats = ProductivityStats & {
  dateYmd: string;
};

export type PlannerCalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  extendedProps: {
    taskId: string;
    occurrenceDate?: string;
    task?: Task;
    sourceTask?: Task;
  };
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

// INPUT: all tasks and selected date
// OUTPUT: tasks visible on the selected day
// EFFECT: Resolves which temporary and permanent tasks belong in the Today and Month views
export function tasksForDate(all: Task[], dateYmd: string): Task[] {
  return all
    .map(normalizeTask)
    .flatMap((task) => {
      const occurrence = getTaskOccurrenceFromNormalizedTask(task, dateYmd);
      if (!occurrence) return [];
      return [occurrence];
    })
    .sort((a, b) => {
      const ea = a.emergency ?? 5;
      const eb = b.emergency ?? 5;
      if (ea !== eb) return ea - eb;
      return a.title.localeCompare(b.title);
    });
}

// INPUT: all tasks and selected date
// OUTPUT: tasks completed on the selected day
// EFFECT: Builds the retained completion history used for task undo and recent productivity review
export function completedTasksForDate(all: Task[], dateYmd: string): Task[] {
  return all
    .map(normalizeTask)
    .flatMap((task) => {
      const occurrence = getTaskOccurrenceSnapshotFromNormalizedTask(task, dateYmd);
      if (!occurrence) return [];
      const completedAt = getTaskOccurrenceCompletedAt(task, dateYmd);
      if (!completedAt) return [];
      return [{ ...occurrence, completedAt }];
    })
    .sort((a, b) => String(b.completedAt ?? "").localeCompare(String(a.completedAt ?? "")));
}

// INPUT: all tasks and selected date
// OUTPUT: task completion summary for that day
// EFFECT: Produces one-day productivity statistics from the retained completion source of truth
export function productivityStatsForDate(all: Task[], dateYmd: string): ProductivityStats {
  const activeTasks = tasksForDate(all, dateYmd);
  const completedTasks = completedTasksForDate(all, dateYmd);
  const totalCount = activeTasks.length + completedTasks.length;

  return buildProductivityStats(completedTasks.length, totalCount);
}

// INPUT: all tasks, selected date, and rolling day window
// OUTPUT: aggregated task completion summary for that period
// EFFECT: Lets planner surfaces show recent productivity trends backed by persisted completedAt timestamps
export function productivityStatsForRollingWindow(all: Task[], dateYmd: string, windowDays: number): ProductivityStats {
  const safeWindowDays = Math.max(1, windowDays);
  let completedCount = 0;
  let totalCount = 0;

  for (let offset = 0; offset < safeWindowDays; offset += 1) {
    const targetDate = dayjs(dateYmd).subtract(offset, "day").format("YYYY-MM-DD");
    const dayStats = productivityStatsForDate(all, targetDate);
    completedCount += dayStats.completedCount;
    totalCount += dayStats.totalCount;
  }

  return buildProductivityStats(completedCount, totalCount);
}

// INPUT: all tasks, selected date, and rolling day window
// OUTPUT: per-day productivity summaries ordered from oldest to newest
// EFFECT: Feeds chart-style planner visualizations from the same retained completion history used by summary statistics
export function productivityStatsSeries(all: Task[], dateYmd: string, windowDays: number): DailyProductivityStats[] {
  const safeWindowDays = Math.max(1, windowDays);
  const series: DailyProductivityStats[] = [];

  for (let offset = safeWindowDays - 1; offset >= 0; offset -= 1) {
    const targetDate = dayjs(dateYmd).subtract(offset, "day").format("YYYY-MM-DD");
    const dayStats = productivityStatsForDate(all, targetDate);
    series.push({
      dateYmd: targetDate,
      ...dayStats,
    });
  }

  return series;
}

// INPUT: all tasks and visible calendar range
// OUTPUT: calendar events for FullCalendar
// EFFECT: Expands planner tasks into week-view event records for the scheduling feature
export function toCalendarEventsForRange(
  all: Task[],
  rangeStart: dayjs.Dayjs,
  rangeEnd: dayjs.Dayjs
) {
  const events: PlannerCalendarEvent[] = [];
  const normalizedTasks = all.map(normalizeTask);

  const permanentColorMap: { [level: number]: { bg: string; border: string; text: string } } = {
    1: { bg: "#0D47A1", border: "#08306B", text: "#FFFFFF" },
    2: { bg: "#1565C0", border: "#0D47A1", text: "#FFFFFF" },
    3: { bg: "#1E88E5", border: "#1565C0", text: "#FFFFFF" },
    4: { bg: "#90CAF9", border: "#42A5F5", text: "#000000" },
    5: { bg: "#E3F2FD", border: "#BBDEFB", text: "#000000" },
  };

  const temporaryColorMap: { [level: number]: { bg: string; border: string; text: string } } = {
    1: { bg: "#F57F17", border: "#E65100", text: "#000000" },
    2: { bg: "#F9A825", border: "#F57F17", text: "#000000" },
    3: { bg: "#FDD835", border: "#FBC02D", text: "#000000" },
    4: { bg: "#FFF59D", border: "#FDD835", text: "#000000" },
    5: { bg: "#FFFDE7", border: "#FFF9C4", text: "#000000" },
  };

  for (const task of normalizedTasks) {
    if (task.recurrence?.frequency !== "NONE") continue;

    const occurrence = getTaskOccurrenceFromNormalizedTask(task, task.beginDate ?? "");
    if (!occurrence?.beginDate) continue;

    const d = dayjs(occurrence.beginDate);
    const endDate = occurrence.endDate ?? occurrence.beginDate;
    const endDay = dayjs(endDate);
    if (endDay.isBefore(rangeStart, "day")) continue;
    if (d.isAfter(rangeEnd.subtract(1, "day"), "day")) continue;

    const level = occurrence.emergency ?? 5;
    const col = temporaryColorMap[level] ?? temporaryColorMap[5];

    events.push({
      id: task.id,
      title: occurrence.title,
      start: occurrence.beginDate,
      end:
        occurrence.startTime || endDate === occurrence.beginDate
          ? undefined
          : endDay.add(1, "day").format("YYYY-MM-DD"),
      allDay: true,
      extendedProps: { taskId: task.id },
      backgroundColor: col.bg,
      borderColor: col.border,
      textColor: col.text,
    });
  }

  for (const task of normalizedTasks) {
    if (task.recurrence?.frequency === "NONE") continue;

    for (const dateStr of listRecurringOccurrenceDatesForNormalizedTask(task, rangeStart, rangeEnd)) {
      const occurrence = getTaskOccurrenceFromNormalizedTask(task, dateStr);
      if (!occurrence) continue;

      const level = occurrence.emergency ?? 5;
      const col = permanentColorMap[level] ?? permanentColorMap[5];

      events.push({
        id: `${task.id}::${dateStr}`,
        title: occurrence.title,
        start: dateStr,
        allDay: true,
        extendedProps: { taskId: task.id, occurrenceDate: dateStr, task: occurrence },
        backgroundColor: col.bg,
        borderColor: col.border,
        textColor: col.text,
      });
    }
  }

  return events;
}

function buildProductivityStats(completedCount: number, totalCount: number): ProductivityStats {
  return {
    completedCount,
    totalCount,
    completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
  };
}
