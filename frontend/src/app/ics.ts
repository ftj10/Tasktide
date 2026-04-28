// INPUT: raw ICS calendar text
// OUTPUT: normalized planner tasks plus skipped-entry metadata
// EFFECT: Converts VEVENT records and supported recurrence rules into task records the planner can save and render
import dayjs from "dayjs";

import type { RepeatFrequency, Task, TaskOccurrenceOverride, TaskRecurrence } from "../types";
import { normalizeTask } from "./tasks";

type ParsedIcsDate = {
  dateYmd: string;
  time: string;
  isAllDay: boolean;
};

type ParsedIcsEvent = {
  uid: string;
  title: string;
  description: string;
  location: string;
  start?: ParsedIcsDate;
  end?: ParsedIcsDate;
  recurrenceId?: ParsedIcsDate;
  recurrence?: TaskRecurrence;
  exceptionDates: ParsedIcsDate[];
  emergency?: number;
  status?: string;
};

export type IcsImportResult = {
  tasks: Task[];
  skippedCount: number;
};

type IcsImportPolicy = {
  skipped: boolean;
};

const WEEKDAY_MAP: Record<string, number> = {
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
  SU: 7,
};

// INPUT: ICS calendar file contents
// OUTPUT: normalized planner tasks plus a skipped-event count
// EFFECT: Supports Today-page imports from exported calendar files without needing a backend parser
export function parseIcsTasks(source: string): IcsImportResult {
  const events = parseIcsEvents(source);
  const masterEvents = new Map<string, ParsedIcsEvent>();
  const exceptionEvents = new Map<string, ParsedIcsEvent[]>();
  let skippedCount = 0;

  for (const event of events) {
    if (!event.start) {
      skippedCount += 1;
      continue;
    }

    if (event.recurrenceId) {
      const current = exceptionEvents.get(event.uid) ?? [];
      current.push(event);
      exceptionEvents.set(event.uid, current);
      continue;
    }

    masterEvents.set(event.uid, event);
  }

  const tasks: Task[] = [];
  const nowIso = new Date().toISOString();

  for (const event of masterEvents.values()) {
    if (!event.start) {
      skippedCount += 1;
      continue;
    }

    const importPolicy = classifyImportPolicy(event);
    if (importPolicy.skipped) {
      skippedCount += 1;
      continue;
    }

    const occurrenceOverrides = buildOccurrenceOverrides(
      event,
      exceptionEvents.get(event.uid) ?? []
    );

    tasks.push(
      normalizeTask({
        id: buildTaskId(event),
        title: event.title || "Imported event",
        type: event.recurrence?.frequency && event.recurrence.frequency !== "NONE" ? "RECURRING" : "ONCE",
        beginDate: event.start.dateYmd,
        date: event.recurrence?.frequency && event.recurrence.frequency !== "NONE" ? undefined : event.start.dateYmd,
        recurrence: event.recurrence ?? { frequency: "NONE", interval: 1, until: null },
        occurrenceOverrides,
        weekday:
          event.recurrence?.frequency === "WEEKLY" && event.recurrence.weekdays?.length === 1
            ? event.recurrence.weekdays[0]
            : undefined,
        emergency: event.emergency ?? 5,
        completedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        location: event.location,
        mapProvider: "google",
        startTime: event.start.isAllDay ? "" : event.start.time,
        endTime: resolveEndTime(event.start, event.end),
        description: event.description,
      })
    );
  }

  for (const [uid, exceptions] of exceptionEvents.entries()) {
    if (!masterEvents.has(uid)) skippedCount += exceptions.length;
  }

  return { tasks, skippedCount };
}

function classifyImportPolicy(event: ParsedIcsEvent): IcsImportPolicy {
  if (
    event.start?.isAllDay &&
    event.end?.isAllDay &&
    event.end.dateYmd !== event.start.dateYmd
  ) {
    return { skipped: true };
  }

  return { skipped: false };
}

function buildOccurrenceOverrides(
  masterEvent: ParsedIcsEvent,
  exceptionEvents: ParsedIcsEvent[]
): Record<string, TaskOccurrenceOverride> {
  const occurrenceOverrides: Record<string, TaskOccurrenceOverride> = {};

  for (const exceptionDate of masterEvent.exceptionDates) {
    occurrenceOverrides[exceptionDate.dateYmd] = { deleted: true };
  }

  for (const exceptionEvent of exceptionEvents) {
    const targetDate = exceptionEvent.recurrenceId?.dateYmd;
    if (!targetDate) continue;

    if (exceptionEvent.status === "CANCELLED") {
      occurrenceOverrides[targetDate] = { deleted: true };
      continue;
    }

    occurrenceOverrides[targetDate] = stripEmptyOccurrenceOverride({
      ...(occurrenceOverrides[targetDate] ?? {}),
      title: exceptionEvent.title || undefined,
      emergency: exceptionEvent.emergency,
      location: exceptionEvent.location || undefined,
      mapProvider: "google",
      startTime: exceptionEvent.start?.isAllDay ? undefined : exceptionEvent.start?.time,
      endTime:
        exceptionEvent.start && exceptionEvent.end
          ? resolveEndTime(exceptionEvent.start, exceptionEvent.end) || undefined
          : undefined,
      description: exceptionEvent.description || undefined,
    });
  }

  return occurrenceOverrides;
}

function stripEmptyOccurrenceOverride(
  override: TaskOccurrenceOverride
): TaskOccurrenceOverride {
  return Object.fromEntries(
    Object.entries(override).filter(([, value]) => value !== undefined && value !== "")
  ) as TaskOccurrenceOverride;
}

function buildTaskId(event: ParsedIcsEvent) {
  const safeUid = event.uid
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `ics-${safeUid || `event-${event.start?.dateYmd ?? "unknown"}`}`;
}

function resolveEndTime(start: ParsedIcsDate, end?: ParsedIcsDate) {
  if (!end || start.isAllDay || end.isAllDay) return "";
  if (end.dateYmd !== start.dateYmd) return "";
  if (end.time <= start.time) return "";
  return end.time;
}

function parseIcsEvents(source: string) {
  const lines = unfoldIcsLines(source);
  const events: ParsedIcsEvent[] = [];
  let currentEvent: ParsedIcsEvent | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      currentEvent = {
        uid: "",
        title: "",
        description: "",
        location: "",
        exceptionDates: [],
      };
      continue;
    }

    if (line === "END:VEVENT") {
      if (currentEvent) {
        currentEvent.uid ||= buildFallbackUid(currentEvent);
        events.push(currentEvent);
      }
      currentEvent = null;
      continue;
    }

    if (!currentEvent) continue;
    const property = parseIcsProperty(line);
    if (!property) continue;

    if (property.name === "UID") {
      currentEvent.uid = decodeIcsText(property.value);
      continue;
    }

    if (property.name === "SUMMARY") {
      currentEvent.title = decodeIcsText(property.value);
      continue;
    }

    if (property.name === "DESCRIPTION") {
      currentEvent.description = decodeIcsText(property.value);
      continue;
    }

    if (property.name === "LOCATION") {
      currentEvent.location = decodeIcsText(property.value);
      continue;
    }

    if (property.name === "DTSTART") {
      currentEvent.start = parseIcsDate(property.value, property.params);
      continue;
    }

    if (property.name === "DTEND") {
      currentEvent.end = parseIcsDate(property.value, property.params);
      continue;
    }

    if (property.name === "RECURRENCE-ID") {
      currentEvent.recurrenceId = parseIcsDate(property.value, property.params);
      continue;
    }

    if (property.name === "EXDATE") {
      currentEvent.exceptionDates.push(...parseIcsDateList(property.value, property.params));
      continue;
    }

    if (property.name === "RRULE") {
      currentEvent.recurrence = parseRecurrenceRule(property.value, currentEvent.start);
      continue;
    }

    if (property.name === "PRIORITY") {
      currentEvent.emergency = mapIcsPriorityToEmergency(property.value);
      continue;
    }

    if (property.name === "STATUS") {
      currentEvent.status = property.value.trim().toUpperCase();
    }
  }

  return events;
}

function unfoldIcsLines(source: string) {
  const normalizedLines = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const lines: string[] = [];

  for (const rawLine of normalizedLines) {
    if (!rawLine) continue;
    if ((rawLine.startsWith(" ") || rawLine.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += rawLine.slice(1);
      continue;
    }
    lines.push(rawLine);
  }

  return lines;
}

function parseIcsProperty(line: string) {
  const separatorIndex = line.indexOf(":");
  if (separatorIndex < 0) return null;

  const left = line.slice(0, separatorIndex);
  const value = line.slice(separatorIndex + 1);
  const [rawName, ...paramParts] = left.split(";");
  const params = Object.fromEntries(
    paramParts.map((part) => {
      const [key, paramValue = ""] = part.split("=");
      return [key.toUpperCase(), paramValue];
    })
  );

  return {
    name: rawName.toUpperCase(),
    params,
    value,
  };
}

function parseIcsDateList(value: string, params: Record<string, string>) {
  return value
    .split(",")
    .map((item) => parseIcsDate(item.trim(), params))
    .filter((item): item is ParsedIcsDate => Boolean(item));
}

function parseIcsDate(value: string, params: Record<string, string>) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return undefined;

  const isAllDay = params.VALUE === "DATE" || /^\d{8}$/.test(trimmedValue);
  if (isAllDay) {
    const year = Number(trimmedValue.slice(0, 4));
    const month = Number(trimmedValue.slice(4, 6)) - 1;
    const day = Number(trimmedValue.slice(6, 8));
    const date = new Date(year, month, day);

    return {
      dateYmd: dayjs(date).format("YYYY-MM-DD"),
      time: "",
      isAllDay: true,
    };
  }

  const parsedDate = parseIcsDateTime(trimmedValue);
  if (!parsedDate) return undefined;

  return {
    dateYmd: dayjs(parsedDate).format("YYYY-MM-DD"),
    time: dayjs(parsedDate).format("HH:mm"),
    isAllDay: false,
  };
}

function parseIcsDateTime(value: string) {
  const utcMatch = value.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?Z$/
  );
  if (utcMatch) {
    const [, year, month, day, hour, minute, second = "00"] = utcMatch;
    return new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      )
    );
  }

  const localMatch = value.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/
  );
  if (!localMatch) return undefined;

  const [, year, month, day, hour, minute, second = "00"] = localMatch;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );
}

function parseRecurrenceRule(
  value: string,
  start?: ParsedIcsDate
): TaskRecurrence | undefined {
  const parts = Object.fromEntries(
    value.split(";").map((part) => {
      const [key, rawPartValue = ""] = part.split("=");
      return [key.toUpperCase(), rawPartValue];
    })
  );

  const frequency = mapRruleFrequency(parts.FREQ);
  if (!frequency) return undefined;

  const interval = Number(parts.INTERVAL || "1");
  const recurrence: TaskRecurrence = {
    frequency,
    interval: Number.isFinite(interval) && interval > 0 ? interval : 1,
    until: parseRruleUntil(parts.UNTIL),
  };

  if (frequency === "WEEKLY") {
    const weekdays = parts.BYDAY
      ? parts.BYDAY.split(",").map((day) => WEEKDAY_MAP[day]).filter(Boolean)
      : start
      ? [weekdayNumberFromDate(start.dateYmd)]
      : [];
    recurrence.weekdays = weekdays;
  }

  if (frequency === "MONTHLY") {
    const monthDays = parts.BYMONTHDAY
      ? parts.BYMONTHDAY
          .split(",")
          .map((day) => Number(day))
          .filter((day) => Number.isInteger(day) && day >= 1 && day <= 31)
      : start
      ? [dayjs(start.dateYmd).date()]
      : [];
    recurrence.monthDays = monthDays;
  }

  return recurrence;
}

function mapRruleFrequency(value: string | undefined): RepeatFrequency | undefined {
  if (value === "DAILY") return "DAILY";
  if (value === "WEEKLY") return "WEEKLY";
  if (value === "MONTHLY") return "MONTHLY";
  if (value === "YEARLY") return "YEARLY";
  return undefined;
}

function parseRruleUntil(value: string | undefined) {
  if (!value) return null;
  const parsed = parseIcsDate(value, {});
  return parsed?.dateYmd ?? null;
}

function mapIcsPriorityToEmergency(value: string) {
  const numericPriority = Number(value);
  if (!Number.isFinite(numericPriority) || numericPriority <= 0) return 5;
  if (numericPriority <= 2) return 1;
  if (numericPriority <= 4) return 2;
  if (numericPriority === 5) return 3;
  if (numericPriority <= 7) return 4;
  return 5;
}

function buildFallbackUid(event: ParsedIcsEvent) {
  return `${event.title || "imported-event"}-${event.start?.dateYmd ?? "unknown"}`;
}

function decodeIcsText(value: string) {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function weekdayNumberFromDate(dateYmd: string) {
  const weekday = dayjs(dateYmd).day();
  return weekday === 0 ? 7 : weekday;
}
