// INPUT: today page task fixtures and completion actions
// OUTPUT: behavior coverage for retained task completion statistics
// EFFECT: Verifies Today hides completed tasks from active lists, stores recurring completion in task data, and visualizes recent productivity
import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import type { Task } from "../src/types";
import { TodayPage } from "../src/pages/TodayPage";
import { renderWithProviders } from "./test-utils";

describe("TodayPage behavior", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores recurring-task completion inside the persisted task record", async () => {
    const user = userEvent.setup();
    const setTasks = vi.fn();
    const recurringTask: Task = {
      id: "recurring-1",
      title: "Weekly review",
      type: "RECURRING",
      beginDate: "2026-04-22",
      createdAt: "2026-04-20T08:00:00.000Z",
      updatedAt: "2026-04-20T08:00:00.000Z",
      recurrence: {
        frequency: "WEEKLY",
        interval: 1,
        weekdays: [3],
        until: null,
      },
    };

    renderWithProviders(<TodayPage tasks={[recurringTask]} setTasks={setTasks} />, "/?date=2026-04-22");

    await user.click(screen.getByRole("button", { name: "Done" }));
    const confirmDialog = screen.getByRole("dialog", { name: "Confirm" });
    await user.click(within(confirmDialog).getByRole("button", { name: "Done" }));

    expect(setTasks).toHaveBeenCalledTimes(1);
    const nextTasks = setTasks.mock.calls[0][0] as Task[];
    expect(nextTasks[0].occurrenceOverrides?.["2026-04-22"]?.completedAt).toMatch(/T/);
  });

  it("keeps completed tasks out of the active list while still counting them in the daily totals", () => {
    const completedTask: Task = {
      id: "completed-1",
      title: "Archived task",
      type: "ONCE",
      beginDate: "2026-04-22",
      date: "2026-04-22",
      completedAt: "2026-04-22T12:00:00.000Z",
      createdAt: "2026-04-22T08:00:00.000Z",
      updatedAt: "2026-04-22T12:00:00.000Z",
    };

    renderWithProviders(<TodayPage tasks={[completedTask]} setTasks={vi.fn()} />, "/?date=2026-04-22");

    expect(screen.getByText("No tasks scheduled for this date.")).toBeInTheDocument();
    expect(screen.getByText("Completed 1")).toBeInTheDocument();
    expect(screen.queryByText("Archived task")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show Completed History" })).not.toBeInTheDocument();
  });

  it("keeps productivity details collapsed until the user expands the stats panel", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <TodayPage
        tasks={[
          {
            id: "active-1",
            title: "Active task",
            type: "ONCE",
            beginDate: "2026-04-22",
            date: "2026-04-22",
            createdAt: "2026-04-22T08:00:00.000Z",
            updatedAt: "2026-04-22T08:00:00.000Z",
          },
          {
            id: "completed-1",
            title: "Completed task",
            type: "ONCE",
            beginDate: "2026-04-22",
            date: "2026-04-22",
            completedAt: "2026-04-22T12:00:00.000Z",
            createdAt: "2026-04-22T08:00:00.000Z",
            updatedAt: "2026-04-22T12:00:00.000Z",
          },
          {
            id: "completed-2",
            title: "Completed older task",
            type: "ONCE",
            beginDate: "2026-04-21",
            date: "2026-04-21",
            completedAt: "2026-04-21T16:00:00.000Z",
            createdAt: "2026-04-21T08:00:00.000Z",
            updatedAt: "2026-04-21T16:00:00.000Z",
          },
        ]}
        setTasks={vi.fn()}
      />,
      "/?date=2026-04-22"
    );

    expect(screen.getByText("Productivity Stats")).toBeInTheDocument();
    expect(screen.getByText("67% last 7 days")).toBeInTheDocument();
    expect(screen.queryByLabelText("7-Day Completion Trend")).not.toBeInTheDocument();
    expect(screen.queryByText("Selected Day")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "View Stats and Visualization" }));

    expect(screen.getByLabelText("7-Day Completion Trend")).toBeInTheDocument();
    expect(screen.getByText("Selected Day")).toBeInTheDocument();
    expect(screen.getByText("1 / 2 completed (50%)")).toBeInTheDocument();
    expect(screen.getAllByText("2 / 3 completed (67%)")).toHaveLength(2);
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("1/1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide Stats and Visualization" })).toBeInTheDocument();
  });

  it("imports tasks from an ICS file and reports the imported count", async () => {
    const user = userEvent.setup();
    const setTasks = vi.fn();

    renderWithProviders(
      <TodayPage
        tasks={[
          {
            id: "existing-1",
            title: "Existing task",
            type: "ONCE",
            beginDate: "2026-04-22",
            date: "2026-04-22",
            createdAt: "2026-04-22T08:00:00.000Z",
            updatedAt: "2026-04-22T08:00:00.000Z",
          },
        ]}
        setTasks={setTasks}
      />,
      "/?date=2026-04-22"
    );

    const importFile = new File(
      [
        `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:import-1@example.com
DTSTART:20260422T130000
DTEND:20260422T140000
SUMMARY:Imported planning block
END:VEVENT
END:VCALENDAR`,
      ],
      "planner.ics",
      { type: "text/calendar" }
    );

    await user.upload(screen.getByLabelText("Import ICS file"), importFile);

    expect(setTasks).toHaveBeenCalledTimes(1);
    const nextTasks = setTasks.mock.calls[0][0] as Task[];
    expect(nextTasks).toHaveLength(2);
    expect(nextTasks.find((task) => task.id === "ics-import-1-example-com")).toMatchObject({
      title: "Imported planning block",
      beginDate: "2026-04-22",
      startTime: "13:00",
      endTime: "14:00",
    });
  });

  it("imports a multi-day all-day ICS event as one ranged task", async () => {
    const user = userEvent.setup();
    const setTasks = vi.fn();

    renderWithProviders(<TodayPage tasks={[]} setTasks={setTasks} />, "/?date=2026-05-01");

    const importFile = new File(
      [
        `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:123456@example.com
DTSTAMP:20260428T160000Z
DTSTART;VALUE=DATE:20260501
DTEND;VALUE=DATE:20260504
SUMMARY:My 3-Day Event
DESCRIPTION:Example event description
END:VEVENT
END:VCALENDAR`,
      ],
      "three-day.ics",
      { type: "text/calendar" }
    );

    await user.upload(screen.getByLabelText("Import ICS file"), importFile);

    expect(setTasks).toHaveBeenCalledTimes(1);
    const nextTasks = setTasks.mock.calls[0][0] as Task[];
    expect(nextTasks[0]).toMatchObject({
      title: "My 3-Day Event",
      beginDate: "2026-05-01",
      endDate: "2026-05-03",
    });
  });

  it("moves a one-time task to the next selected day instead of the next real day", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-29T09:00:00.000Z"));
    const setTasks = vi.fn();

    renderWithProviders(
      <TodayPage
        tasks={[
          {
            id: "future-1",
            title: "Future task",
            type: "ONCE",
            beginDate: "2026-05-01",
            endDate: "2026-05-01",
            date: "2026-05-01",
            createdAt: "2026-04-29T08:00:00.000Z",
            updatedAt: "2026-04-29T08:00:00.000Z",
          },
        ]}
        setTasks={setTasks}
      />,
      "/?date=2026-05-01"
    );

    fireEvent.click(screen.getByRole("button", { name: "To Tomorrow" }));

    expect(setTasks).toHaveBeenCalledTimes(1);
    const nextTasks = setTasks.mock.calls[0][0] as Task[];
    expect(nextTasks[0]).toMatchObject({
      beginDate: "2026-05-02",
      endDate: "2026-05-02",
      date: "2026-05-02",
      completedAt: null,
    });
  });
});
