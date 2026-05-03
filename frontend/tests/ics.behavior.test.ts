// INPUT: representative ICS calendar exports and planner task arrays
// OUTPUT: behavior coverage for task import and export
// EFFECT: Verifies ICS events convert into planner tasks and planner tasks produce valid ICS output
import { describe, expect, it } from "vitest";

import { parseIcsTasks, tasksToIcs } from "../src/app/ics";
import type { Task } from "../src/types";

describe("ICS import behavior", () => {
  it("converts one-time timed events into one-time tasks", () => {
    const result = parseIcsTasks(`BEGIN:VCALENDAR
BEGIN:VEVENT
UID:event-1@example.com
DTSTART:20260428T090000
DTEND:20260428T100000
SUMMARY:Sprint sync
DESCRIPTION:Team update
LOCATION:Room A
PRIORITY:3
END:VEVENT
END:VCALENDAR`);

    expect(result.skippedCount).toBe(0);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]).toMatchObject({
      id: "ics-event-1-example-com",
      title: "Sprint sync",
      type: "ONCE",
      beginDate: "2026-04-28",
      date: "2026-04-28",
      startTime: "09:00",
      endTime: "10:00",
      description: "Team update",
      location: "Room A",
      emergency: 2,
    });
  });

  it("converts recurring events, exclusions, and overridden occurrences", () => {
    const result = parseIcsTasks(`BEGIN:VCALENDAR
BEGIN:VEVENT
UID:series-1@example.com
DTSTART;VALUE=DATE:20260428
SUMMARY:Pay rent
RRULE:FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=28;UNTIL=20260928
EXDATE;VALUE=DATE:20260628
END:VEVENT
BEGIN:VEVENT
UID:series-1@example.com
RECURRENCE-ID;VALUE=DATE:20260728
DTSTART;VALUE=DATE:20260728
SUMMARY:Pay rent early
DESCRIPTION:Adjusted for travel
END:VEVENT
END:VCALENDAR`);

    expect(result.skippedCount).toBe(0);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]).toMatchObject({
      id: "ics-series-1-example-com",
      title: "Pay rent",
      type: "RECURRING",
      beginDate: "2026-04-28",
      recurrence: {
        frequency: "MONTHLY",
        interval: 1,
        monthDays: [28],
        until: "2026-09-28",
      },
    });
    expect(result.tasks[0].occurrenceOverrides?.["2026-06-28"]).toMatchObject({ deleted: true });
    expect(result.tasks[0].occurrenceOverrides?.["2026-07-28"]).toMatchObject({
      title: "Pay rent early",
      description: "Adjusted for travel",
      mapProvider: "google",
    });
  });

  it("converts multi-day all-day events into one task range", () => {
    const result = parseIcsTasks(`BEGIN:VCALENDAR
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
END:VCALENDAR`);

    expect(result.tasks).toHaveLength(1);
    expect(result.skippedCount).toBe(0);
    expect(result.tasks[0]).toMatchObject({
      title: "My 3-Day Event",
      beginDate: "2026-05-01",
      endDate: "2026-05-03",
      description: "Example event description",
    });
  });
});

describe("ICS export behavior", () => {
  const baseTask: Task = {
    id: "task-abc123",
    title: "Team standup",
    type: "ONCE",
    date: "2026-05-10",
    beginDate: "2026-05-10",
    startTime: "09:00",
    endTime: "09:30",
    description: "Daily sync",
    location: "Zoom",
    emergency: 2,
    completedAt: null,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
  };

  it("produces a valid VCALENDAR wrapper", () => {
    const ics = tasksToIcs([baseTask]);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
  });

  it("maps task fields to VEVENT properties", () => {
    const ics = tasksToIcs([baseTask]);
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("UID:task-abc123");
    expect(ics).toContain("SUMMARY:Team standup");
    expect(ics).toContain("DESCRIPTION:Daily sync");
    expect(ics).toContain("LOCATION:Zoom");
    expect(ics).toContain("DTSTART:20260510T090000");
    expect(ics).toContain("DTEND:20260510T093000");
    expect(ics).toContain("STATUS:NEEDS-ACTION");
    expect(ics).toContain("PRIORITY:3");
  });

  it("sets STATUS:COMPLETED for completed tasks", () => {
    const completed: Task = { ...baseTask, completedAt: "2026-05-10T10:00:00.000Z" };
    const ics = tasksToIcs([completed]);
    expect(ics).toContain("STATUS:COMPLETED");
  });

  it("uses DATE format for all-day tasks", () => {
    const allDay: Task = {
      ...baseTask,
      startTime: undefined,
      endTime: undefined,
      date: "2026-05-15",
      beginDate: "2026-05-15",
    };
    const ics = tasksToIcs([allDay]);
    expect(ics).toContain("DTSTART;VALUE=DATE:20260515");
    expect(ics).toContain("DTEND;VALUE=DATE:20260516");
  });

  it("emits RRULE for recurring tasks", () => {
    const recurring: Task = {
      ...baseTask,
      id: "task-recurring",
      type: "RECURRING",
      date: undefined,
      beginDate: "2026-05-01",
      recurrence: { frequency: "WEEKLY", interval: 1, weekdays: [1, 3], until: "2026-07-31" },
    };
    const ics = tasksToIcs([recurring]);
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20260731");
  });

  it("emits EXDATE for deleted occurrences", () => {
    const withDeleted: Task = {
      ...baseTask,
      id: "task-exdate",
      type: "RECURRING",
      date: undefined,
      beginDate: "2026-05-01",
      recurrence: { frequency: "DAILY", interval: 1 },
      occurrenceOverrides: { "2026-05-05": { deleted: true } },
    };
    const ics = tasksToIcs([withDeleted]);
    expect(ics).toContain("EXDATE:20260505T090000");
  });

  it("filters out completed tasks when filter is incomplete", () => {
    const completed: Task = { ...baseTask, id: "done", completedAt: "2026-05-10T10:00:00.000Z" };
    const active: Task = { ...baseTask, id: "active", completedAt: null };
    const ics = tasksToIcs([completed, active], { type: "incomplete" });
    expect(ics).toContain("UID:active");
    expect(ics).not.toContain("UID:done");
  });

  it("filters tasks by date range", () => {
    const inRange: Task = { ...baseTask, id: "in-range", date: "2026-06-15", beginDate: "2026-06-15" };
    const outOfRange: Task = { ...baseTask, id: "out", date: "2026-08-01", beginDate: "2026-08-01" };
    const ics = tasksToIcs([inRange, outOfRange], {
      type: "dateRange",
      startDate: "2026-06-01",
      endDate: "2026-06-30",
    });
    expect(ics).toContain("UID:in-range");
    expect(ics).not.toContain("UID:out");
  });

  it("escapes special characters in text fields", () => {
    const special: Task = {
      ...baseTask,
      title: "Task, with; special\\chars",
      description: "Line one\nLine two",
    };
    const ics = tasksToIcs([special]);
    expect(ics).toContain("SUMMARY:Task\\, with\\; special\\\\chars");
    expect(ics).toContain("DESCRIPTION:Line one\\nLine two");
  });
});
