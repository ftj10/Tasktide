// INPUT: task collections with various completion and creation dates
// OUTPUT: behavior coverage for period stats, comparison logic, weekday productivity, and empty-state threshold
// EFFECT: Verifies Stats page data functions produce correct aggregates and edge-case results
import dayjs from "dayjs";
import { describe, expect, it } from "vitest";

import type { Task } from "../src/types";
import {
  periodStatsForWindow,
  weekdayProductivitySeries,
} from "../src/app/taskLogic";

function makeTask(overrides: Partial<Task> & Pick<Task, "id">): Task {
  return {
    type: "ONCE",
    title: overrides.id,
    createdAt: "2026-04-01T08:00:00.000Z",
    updatedAt: "2026-04-01T08:00:00.000Z",
    ...overrides,
  };
}

describe("periodStatsForWindow", () => {
  it("returns zeros for an empty task list", () => {
    const stats = periodStatsForWindow([], "2026-04-30", 30);
    expect(stats.completedCount).toBe(0);
    expect(stats.totalCount).toBe(0);
    expect(stats.completionRate).toBe(0);
    expect(stats.createdCount).toBe(0);
    expect(stats.overdueCount).toBe(0);
  });

  it("counts tasks completed within the window", () => {
    const tasks: Task[] = [
      makeTask({
        id: "t1",
        beginDate: "2026-04-28",
        date: "2026-04-28",
        completedAt: "2026-04-28T10:00:00.000Z",
        updatedAt: "2026-04-28T10:00:00.000Z",
        createdAt: "2026-04-28T08:00:00.000Z",
      }),
      makeTask({
        id: "t2",
        beginDate: "2026-04-29",
        date: "2026-04-29",
        completedAt: "2026-04-29T10:00:00.000Z",
        updatedAt: "2026-04-29T10:00:00.000Z",
        createdAt: "2026-04-29T08:00:00.000Z",
      }),
    ];

    const stats = periodStatsForWindow(tasks, "2026-04-30", 7);
    expect(stats.completedCount).toBe(2);
  });

  it("does not count tasks completed outside the window", () => {
    const tasks: Task[] = [
      makeTask({
        id: "t1",
        beginDate: "2026-04-01",
        date: "2026-04-01",
        completedAt: "2026-04-01T10:00:00.000Z",
        updatedAt: "2026-04-01T10:00:00.000Z",
        createdAt: "2026-04-01T08:00:00.000Z",
      }),
    ];

    const stats = periodStatsForWindow(tasks, "2026-04-30", 7);
    expect(stats.completedCount).toBe(0);
    expect(stats.totalCount).toBe(0);
  });

  it("computes completion rate correctly", () => {
    const tasks: Task[] = [
      makeTask({
        id: "completed",
        beginDate: "2026-04-28",
        date: "2026-04-28",
        completedAt: "2026-04-28T10:00:00.000Z",
        updatedAt: "2026-04-28T10:00:00.000Z",
        createdAt: "2026-04-28T08:00:00.000Z",
      }),
      makeTask({
        id: "active",
        beginDate: "2026-04-28",
        date: "2026-04-28",
        createdAt: "2026-04-28T08:00:00.000Z",
        updatedAt: "2026-04-28T08:00:00.000Z",
      }),
    ];

    const stats = periodStatsForWindow(tasks, "2026-04-28", 3);
    expect(stats.completedCount).toBe(1);
    expect(stats.totalCount).toBe(2);
    expect(stats.completionRate).toBe(50);
  });

  it("counts tasks created within the window by createdAt date", () => {
    const tasks: Task[] = [
      makeTask({ id: "t1", createdAt: "2026-04-25T08:00:00.000Z", updatedAt: "2026-04-25T08:00:00.000Z" }),
      makeTask({ id: "t2", createdAt: "2026-04-20T08:00:00.000Z", updatedAt: "2026-04-20T08:00:00.000Z" }),
      makeTask({ id: "t3", createdAt: "2026-04-01T08:00:00.000Z", updatedAt: "2026-04-01T08:00:00.000Z" }),
    ];

    const stats = periodStatsForWindow(tasks, "2026-04-30", 30);
    expect(stats.createdCount).toBe(3);

    const narrowStats = periodStatsForWindow(tasks, "2026-04-30", 7);
    expect(narrowStats.createdCount).toBe(1);
  });

  it("handles window of 1 day without crashing", () => {
    const tasks: Task[] = [
      makeTask({
        id: "t1",
        beginDate: "2026-04-30",
        date: "2026-04-30",
        createdAt: "2026-04-30T08:00:00.000Z",
        updatedAt: "2026-04-30T08:00:00.000Z",
      }),
    ];

    const stats = periodStatsForWindow(tasks, "2026-04-30", 1);
    expect(stats.totalCount).toBeGreaterThanOrEqual(0);
  });

  it("returns 100% completion rate when all tasks are completed", () => {
    const tasks: Task[] = [
      makeTask({
        id: "t1",
        beginDate: "2026-04-28",
        date: "2026-04-28",
        completedAt: "2026-04-28T10:00:00.000Z",
        updatedAt: "2026-04-28T10:00:00.000Z",
        createdAt: "2026-04-28T08:00:00.000Z",
      }),
      makeTask({
        id: "t2",
        beginDate: "2026-04-29",
        date: "2026-04-29",
        completedAt: "2026-04-29T11:00:00.000Z",
        updatedAt: "2026-04-29T11:00:00.000Z",
        createdAt: "2026-04-29T08:00:00.000Z",
      }),
    ];

    const stats = periodStatsForWindow(tasks, "2026-04-30", 7);
    expect(stats.completedCount).toBe(stats.totalCount);
    expect(stats.completionRate).toBe(100);
  });

  it("previous 30-day window starts 30 days before current window end", () => {
    const tasks: Task[] = [
      makeTask({
        id: "old",
        beginDate: "2026-03-20",
        date: "2026-03-20",
        completedAt: "2026-03-20T10:00:00.000Z",
        updatedAt: "2026-03-20T10:00:00.000Z",
        createdAt: "2026-03-20T08:00:00.000Z",
      }),
    ];

    const currentEnd = "2026-04-30";
    const prevEnd = dayjs(currentEnd).subtract(30, "day").format("YYYY-MM-DD");

    const currentStats = periodStatsForWindow(tasks, currentEnd, 30);
    const prevStats = periodStatsForWindow(tasks, prevEnd, 30);

    expect(currentStats.completedCount).toBe(0);
    expect(prevStats.completedCount).toBe(1);
  });
});

describe("weekdayProductivitySeries", () => {
  it("returns exactly 7 entries (Sunday through Saturday)", () => {
    const series = weekdayProductivitySeries([], "2026-04-30", 7);
    expect(series).toHaveLength(7);
    expect(series.map((d) => d.weekday)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("returns zero totals for an empty task list", () => {
    const series = weekdayProductivitySeries([], "2026-04-30", 30);
    for (const day of series) {
      expect(day.completedCount).toBe(0);
      expect(day.totalCount).toBe(0);
      expect(day.completionRate).toBe(0);
    }
  });

  it("accumulates tasks on the correct weekday", () => {
    const tasks: Task[] = [
      makeTask({
        id: "monday-task",
        beginDate: "2026-04-27",
        date: "2026-04-27",
        completedAt: "2026-04-27T10:00:00.000Z",
        updatedAt: "2026-04-27T10:00:00.000Z",
        createdAt: "2026-04-27T08:00:00.000Z",
      }),
    ];

    const dayOfWeek = dayjs("2026-04-27").day();
    const series = weekdayProductivitySeries(tasks, "2026-04-30", 7);
    const mondayEntry = series.find((d) => d.weekday === dayOfWeek);

    expect(mondayEntry).toBeDefined();
    expect(mondayEntry!.completedCount).toBe(1);
  });

  it("computes 100% completion rate for a weekday where all tasks are done", () => {
    const tasks: Task[] = [
      makeTask({
        id: "t1",
        beginDate: "2026-04-28",
        date: "2026-04-28",
        completedAt: "2026-04-28T10:00:00.000Z",
        updatedAt: "2026-04-28T10:00:00.000Z",
        createdAt: "2026-04-28T08:00:00.000Z",
      }),
    ];

    const dayOfWeek = dayjs("2026-04-28").day();
    const series = weekdayProductivitySeries(tasks, "2026-04-30", 7);
    const entry = series.find((d) => d.weekday === dayOfWeek);

    expect(entry!.completionRate).toBe(100);
  });
});
