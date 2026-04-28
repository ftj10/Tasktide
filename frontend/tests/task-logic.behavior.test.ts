// INPUT: recurrence-aware task fixtures and selected planner dates
// OUTPUT: behavior coverage for repeat expansion, legacy-task compatibility, and occurrence overrides
// EFFECT: Verifies the planner keeps rendering old datasets while supporting new repeat options and single-day edits
import dayjs from "dayjs";
import { describe, expect, it } from "vitest";

import type { Task } from "../src/types";
import {
  completedTasksForDate,
  productivityStatsForDate,
  productivityStatsForRollingWindow,
  productivityStatsSeries,
  tasksForDate,
} from "../src/app/taskLogic";
import {
  applySingleOccurrenceEdit,
  completeTaskInCollection,
  listRecurringOccurrenceDatesForNormalizedTask,
  normalizeTask,
  reopenTaskInCollection,
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

    const visibleTasks = tasksForDate([legacyTask], "2026-04-22");

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

    expect(tasksForDate(tasks, "2026-04-22")).toHaveLength(1);
    expect(tasksForDate(tasks, "2026-04-25")).toHaveLength(2);
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

    expect(tasksForDate([updatedSeries], "2026-04-22")[0].title).toBe("Only this Wednesday");
    expect(tasksForDate([updatedSeries], "2026-04-29")[0].title).toBe("Series title");
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

  it("hides completed one-time tasks from active views while keeping them in retained history", () => {
    const completedTask: Task = {
      id: "completed-once",
      title: "Completed once",
      type: "ONCE",
      beginDate: "2026-04-22",
      date: "2026-04-22",
      completedAt: "2026-04-22T09:00:00.000Z",
      createdAt: "2026-04-22T08:00:00.000Z",
      updatedAt: "2026-04-22T09:00:00.000Z",
    };

    expect(tasksForDate([completedTask], "2026-04-22")).toEqual([]);
    expect(completedTasksForDate([completedTask], "2026-04-22")).toHaveLength(1);
  });

  it("stores recurring occurrence completion inside the task record and allows undo", () => {
    const recurringTask = normalizeTask({
      id: "recurring-complete",
      title: "Recurring complete",
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

    const completedTasks = completeTaskInCollection([recurringTask], recurringTask.id, {
      completedAt: "2026-04-22T10:00:00.000Z",
      occurrenceDateYmd: "2026-04-22",
      updatedAt: "2026-04-22T10:00:00.000Z",
    });

    expect(tasksForDate(completedTasks, "2026-04-22")).toEqual([]);
    expect(completedTasksForDate(completedTasks, "2026-04-22")[0].completedAt).toBe("2026-04-22T10:00:00.000Z");

    const reopenedTasks = reopenTaskInCollection(completedTasks, recurringTask.id, {
      occurrenceDateYmd: "2026-04-22",
      updatedAt: "2026-04-22T11:00:00.000Z",
    });

    expect(tasksForDate(reopenedTasks, "2026-04-22")).toHaveLength(1);
    expect(reopenedTasks[0].occurrenceOverrides?.["2026-04-22"]).toBeUndefined();
  });

  it("builds daily and rolling productivity statistics from active and completed tasks", () => {
    const tasks: Task[] = [
      {
        id: "active-today",
        title: "Active today",
        type: "ONCE",
        beginDate: "2026-04-22",
        date: "2026-04-22",
        createdAt: "2026-04-22T08:00:00.000Z",
        updatedAt: "2026-04-22T08:00:00.000Z",
      },
      {
        id: "completed-today",
        title: "Completed today",
        type: "ONCE",
        beginDate: "2026-04-22",
        date: "2026-04-22",
        completedAt: "2026-04-22T12:00:00.000Z",
        createdAt: "2026-04-22T08:00:00.000Z",
        updatedAt: "2026-04-22T12:00:00.000Z",
      },
      {
        id: "completed-yesterday",
        title: "Completed yesterday",
        type: "ONCE",
        beginDate: "2026-04-21",
        date: "2026-04-21",
        completedAt: "2026-04-21T18:00:00.000Z",
        createdAt: "2026-04-21T08:00:00.000Z",
        updatedAt: "2026-04-21T18:00:00.000Z",
      },
    ];

    expect(productivityStatsForDate(tasks, "2026-04-22")).toEqual({
      completedCount: 1,
      totalCount: 2,
      completionRate: 50,
    });

    expect(productivityStatsForRollingWindow(tasks, "2026-04-22", 7)).toEqual({
      completedCount: 2,
      totalCount: 3,
      completionRate: 67,
    });

    expect(productivityStatsSeries(tasks, "2026-04-22", 3)).toEqual([
      {
        dateYmd: "2026-04-20",
        completedCount: 0,
        totalCount: 0,
        completionRate: 0,
      },
      {
        dateYmd: "2026-04-21",
        completedCount: 1,
        totalCount: 1,
        completionRate: 100,
      },
      {
        dateYmd: "2026-04-22",
        completedCount: 1,
        totalCount: 2,
        completionRate: 50,
      },
    ]);
  });
});
