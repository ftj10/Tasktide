// INPUT: Day.js dates from planner pages and dialogs
// OUTPUT: shared date formatting and weekday helpers
// EFFECT: Keeps date math consistent across temporary and permanent task features
import dayjs from "dayjs";

// INPUT: Day.js date
// OUTPUT: YYYY-MM-DD string
// EFFECT: Normalizes planner dates for storage, routing, and comparisons
export function ymd(d: dayjs.Dayjs) {
  return d.format("YYYY-MM-DD");
}

// INPUT: Day.js date
// OUTPUT: ISO weekday number
// EFFECT: Maps calendar dates into the recurring-task weekday feature
export function weekdayISO(d: dayjs.Dayjs) {
  const dow = d.day();
  return dow === 0 ? 7 : dow;
}

// INPUT: Day.js date
// OUTPUT: Monday week-start string in YYYY-MM-DD format
// EFFECT: Anchors week-based planner features to a shared Monday start
export function weekStartMonday(d: dayjs.Dayjs) {
  const iso = weekdayISO(d);
  return ymd(d.subtract(iso - 1, "day"));
}
