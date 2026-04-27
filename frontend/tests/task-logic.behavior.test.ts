// INPUT: recurrence-aware task fixtures and selected planner dates
// OUTPUT: behavior coverage for repeat expansion, legacy-task compatibility, and occurrence overrides
// EFFECT: Verifies the planner keeps rendering old datasets while supporting new repeat options and single-day edits
import dayjs from "dayjs";
import { describe, expect, it } from "vitest";

import type { Task } from "../src/types";
import { tasksForDate } from "../src/app/taskLogic";
import {
  applySingleOccurrenceEdit,
  listRecurringOccurrenceDatesForNormalizedTask,
  normalizeTask,
} from "../src/app/tasks";

describe("task logic behavior", () => {
  it("renders a legacy weekly task on its stored weekday", () => {
    const legacyTask: Task = {
      id: "legacy-weekly",
      title: "Legacy weekly",
      type: "PERMANENT",
      weekday: 3,
      createdAt: "2026-04-20T00:00:00.000Z",
      updatedAt: "2026-04-20T00:00:00.000Z",
    };

    const visibleTasks = tasksForDate([legacyTask], "2026-04-22", {});

    expect(visibleTasks).toHaveLength(1);
    expect(visibleTasks[0].title).toBe("Legacy weekly");
  });

  it("renders daily, monthly, and yearly repeating tasks from the new recurrence model", () => {
    const tasks: Task[] = [
      normalizeTask({
        id: "daily-1",
        title: "Daily task",
        type: "RECURRING",
        beginDate: "2026-04-20",
        createdAt: "2026-04-20T00:00:00.000Z",
        updatedAt: "2026-04-20T00:00:00.000Z",
        recurrence: {
          frequency: "DAILY",
          interval: 2,
          until: null,
        },
      }),
      normalizeTask({
        id: "monthly-1",
        title: "Monthly task",
        type: "RECURRING",
        beginDate: "2026-04-20",
        createdAt: "2026-04-20T00:00:00.000Z",
        updatedAt: "2026-04-20T00:00:00.000Z",
        recurrence: {
          frequency: "MONTHLY",
          interval: 1,
          monthDays: [25],
          until: null,
        },
      }),
      normalizeTask({
        id: "yearly-1",
        title: "Yearly task",
        type: "RECURRING",
        beginDate: "2024-04-25",
        createdAt: "2024-04-25T00:00:00.000Z",
        updatedAt: "2024-04-25T00:00:00.000Z",
        recurrence: {
          frequency: "YEARLY",
          interval: 1,
          until: null,
        },
      }),
    ];

    expect(tasksForDate(tasks, "2026-04-22", {})).toHaveLength(1);
    expect(tasksForDate(tasks, "2026-04-25", {})).toHaveLength(2);
  });

  it("keeps a single-day edit as an override without changing the series title", () => {
    const sourceTask = normalizeTask({
      id: "weekly-override",
      title: "Series title",
      type: "RECURRING",
      beginDate: "2026-04-20",
      createdAt: "2026-04-20T00:00:00.000Z",
      updatedAt: "2026-04-20T00:00:00.000Z",
      recurrence: {
        frequency: "WEEKLY",
        interval: 1,
        weekdays: [3],
        until: null,
      },
    });

    const editedTask = {
      ...sourceTask,
      title: "Only this Wednesday",
      updatedAt: "2026-04-22T10:00:00.000Z",
    };

    const updatedSeries = applySingleOccurrenceEdit(sourceTask, "2026-04-22", editedTask);

    expect(tasksForDate([updatedSeries], "2026-04-22", {})[0].title).toBe("Only this Wednesday");
    expect(tasksForDate([updatedSeries], "2026-04-29", {})[0].title).toBe("Series title");
  });

  it("lists recurring weekly occurrences only inside the requested visible range", () => {
    const recurringTask = normalizeTask({
      id: "weekly-range",
      title: "Weekly range task",
      type: "RECURRING",
      beginDate: "2026-04-22",
      createdAt: "2026-04-22T00:00:00.000Z",
      updatedAt: "2026-04-22T00:00:00.000Z",
      recurrence: {
        frequency: "WEEKLY",
        interval: 1,
        weekdays: [1, 3, 5],
        until: null,
      },
    });

    const visibleDates = listRecurringOccurrenceDatesForNormalizedTask(
      recurringTask,
      dayjs("2026-04-24"),
      dayjs("2026-05-01")
    );

    expect(visibleDates).toEqual(["2026-04-24", "2026-04-27", "2026-04-29"]);
  });
});
