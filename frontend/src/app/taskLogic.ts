// INPUT: task collections, date ranges, and recurring-task completion state
// OUTPUT: filtered task lists and calendar event records
// EFFECT: Converts raw planner data into the day and week views used across the scheduling features
import dayjs from "dayjs";
import type { Task } from "../types";
import type { CompletionMap } from "./completions";
import { isDoneForDate } from "./completions";
import {
  getTaskOccurrenceFromNormalizedTask,
  listRecurringOccurrenceDatesForNormalizedTask,
  normalizeTask,
} from "./tasks";

// INPUT: all tasks, selected date, and recurring-task completions
// OUTPUT: tasks visible on the selected day
// EFFECT: Resolves which temporary and permanent tasks belong in the Today and Month views
export function tasksForDate(all: Task[], dateYmd: string, completions: CompletionMap): Task[] {
  return all
    .map(normalizeTask)
    .flatMap((task) => {
      const occurrence = getTaskOccurrenceFromNormalizedTask(task, dateYmd);
      if (!occurrence) return [];
      if (task.recurrence?.frequency !== "NONE" && isDoneForDate(completions, task.id, dateYmd)) return [];
      return [occurrence];
    })
    .sort((a, b) => {
      const ea = a.emergency ?? 5;
      const eb = b.emergency ?? 5;
      if (ea !== eb) return ea - eb;
      return a.title.localeCompare(b.title);
    });
}

// INPUT: all tasks, recurring-task completions, and visible calendar range
// OUTPUT: calendar events for FullCalendar
// EFFECT: Expands planner tasks into week-view event records for the scheduling feature
export function toCalendarEventsForRange(
  all: Task[],
  completions: CompletionMap,
  rangeStart: dayjs.Dayjs,
  rangeEnd: dayjs.Dayjs
) {
  const events: any[] = [];
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
    if (d.isBefore(rangeStart, "day")) continue;
    if (d.isAfter(rangeEnd.subtract(1, "day"), "day")) continue;

    const level = occurrence.emergency ?? 5;
    const col = temporaryColorMap[level] ?? temporaryColorMap[5];

    events.push({
      id: task.id,
      title: occurrence.title,
      start: occurrence.beginDate,
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
      if (isDoneForDate(completions, task.id, dateStr)) continue;

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
