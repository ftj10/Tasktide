// INPUT: representative ICS calendar exports
// OUTPUT: behavior coverage for task import parsing
// EFFECT: Verifies ICS events convert into planner tasks with retained recurrence and exception details
import { describe, expect, it } from "vitest";

import { parseIcsTasks } from "../src/app/ics";

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
