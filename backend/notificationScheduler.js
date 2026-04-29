// INPUT: push-enabled users, saved tasks, and scheduler timestamps
// OUTPUT: due-notification dispatch helpers and scheduler controls
// EFFECT: Sends daily and timed-task push notifications from the backend so alerts work on desktop browsers and supported mobile installs
const Task = require('./models/Task');
const User = require('./models/User');
const { sendWebPushNotification } = require('./pushNotifications');

const DEFAULT_NOTIFICATION_INTERVAL_MS = 60 * 1000;
const NOTIFICATION_HISTORY_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;
const DAILY_NOTIFICATION_HOURS = [10, 21];

const formatterCache = new Map();

// INPUT: timestamp plus IANA timezone
// OUTPUT: localized date parts
// EFFECT: Converts UTC runtime timestamps into the subscription-local wall clock used for due-notification checks
function getLocalDateParts(date, timeZone) {
  const cacheKey = timeZone || 'UTC';
  if (!formatterCache.has(cacheKey)) {
    formatterCache.set(
      cacheKey,
      new Intl.DateTimeFormat('en-CA', {
        timeZone: cacheKey,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
    );
  }

  const formatter = formatterCache.get(cacheKey);
  const formattedParts = formatter.formatToParts(date);
  const entries = Object.fromEntries(
    formattedParts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );
  const year = Number(entries.year);
  const month = Number(entries.month);
  const day = Number(entries.day);
  const hour = Number(entries.hour);
  const minute = Number(entries.minute);

  return {
    ymd: `${entries.year}-${entries.month}-${entries.day}`,
    year,
    month,
    day,
    hour,
    minute,
    minuteOfDay: hour * 60 + minute,
  };
}

// INPUT: previous and current localized date parts plus a target date and minute
// OUTPUT: crossing flag
// EFFECT: Detects whether the scheduler window crossed a local wall-clock minute even when the minute boundary spans midnight
function crossedLocalMinute(previousParts, currentParts, targetYmd, targetMinuteOfDay) {
  if (previousParts.ymd === currentParts.ymd) {
    if (targetYmd !== currentParts.ymd) return false;
    return previousParts.minuteOfDay < targetMinuteOfDay && targetMinuteOfDay <= currentParts.minuteOfDay;
  }

  if (targetYmd === previousParts.ymd) {
    return previousParts.minuteOfDay < targetMinuteOfDay;
  }

  if (targetYmd === currentParts.ymd) {
    return targetMinuteOfDay <= currentParts.minuteOfDay;
  }

  return false;
}

// INPUT: current timestamp plus stored notification history rows
// OUTPUT: bounded notification history
// EFFECT: Keeps subscription-side deduplication state limited to the same three-day retention window used by planner notification history
function pruneNotificationHistory(entries, now) {
  const cutoffTime = now.getTime() - NOTIFICATION_HISTORY_RETENTION_MS;
  return (entries ?? []).filter((entry) => {
    const firedTime = new Date(entry.firedAt).getTime();
    return Number.isFinite(firedTime) && firedTime >= cutoffTime;
  });
}

// INPUT: history rows plus notification id
// OUTPUT: dedupe flag
// EFFECT: Prevents the scheduler from re-sending the same daily or task notification for one subscription
function hasNotificationHistoryEntry(entries, notificationId) {
  return (entries ?? []).some((entry) => entry.id === notificationId);
}

// INPUT: previous and next notification history rows
// OUTPUT: equality flag
// EFFECT: Detects bounded-history changes even when pruning and new writes keep the same array length
function areNotificationHistoriesEqual(previousEntries, nextEntries) {
  const left = previousEntries ?? [];
  const right = nextEntries ?? [];
  if (left.length !== right.length) return false;

  return left.every((entry, index) => {
    const nextEntry = right[index];
    return entry.id === nextEntry?.id && entry.firedAt === nextEntry?.firedAt;
  });
}

// INPUT: raw task record
// OUTPUT: normalized task structure
// EFFECT: Aligns backend notification checks with the same repeat and completion semantics used by the planner UI
function normalizeTask(task) {
  const beginDate = task.beginDate ?? task.date ?? normalizeLegacyPermanentBeginDate(task);
  const recurrence = normalizeRecurrence(task, beginDate);
  const type = recurrence.frequency === 'NONE' ? 'ONCE' : 'RECURRING';
  const endDate = type === 'ONCE' ? normalizeTaskEndDate(task, beginDate) : undefined;

  return {
    ...task,
    type,
    beginDate,
    endDate,
    date: type === 'ONCE' ? beginDate : undefined,
    recurrence,
    occurrenceOverrides: normalizeOccurrenceOverrides(task.occurrenceOverrides),
    completedAt: type === 'ONCE' ? normalizeLegacyCompletedAt(task) : null,
  };
}

// INPUT: raw task list plus selected local date
// OUTPUT: active task occurrences for that day
// EFFECT: Resolves repeating and one-time task visibility before timed notification checks run
function tasksForDate(tasks, dateYmd) {
  return (tasks ?? [])
    .map(normalizeTask)
    .flatMap((task) => {
      const occurrence = getTaskOccurrence(task, dateYmd);
      return occurrence ? [occurrence] : [];
    });
}

// INPUT: one push-enabled subscription plus candidate tasks and scheduler timestamps
// OUTPUT: due notification payloads for that subscription
// EFFECT: Builds localized daily and task reminder pushes from the subscription's timezone and locale
function collectDueNotificationsForSubscription({ subscription, tasks, previousRunAt, now }) {
  const previousParts = getLocalDateParts(previousRunAt, subscription.timezone || 'UTC');
  const currentParts = getLocalDateParts(now, subscription.timezone || 'UTC');
  const candidates = [];
  const checkedDates = [...new Set([previousParts.ymd, currentParts.ymd])];

  for (const hour of DAILY_NOTIFICATION_HOURS) {
    for (const dateYmd of checkedDates) {
      const notificationId = `daily:${dateYmd}:${hour}`;
      if (!crossedLocalMinute(previousParts, currentParts, dateYmd, hour * 60)) continue;
      candidates.push({
        id: notificationId,
        payload: buildDailyNotificationPayload(subscription.locale, dateYmd),
      });
    }
  }

  for (const dateYmd of checkedDates) {
    for (const task of tasksForDate(tasks, dateYmd)) {
      if (!task.startTime) continue;

      const [startHour, startMinute] = String(task.startTime)
        .split(':')
        .map((value) => Number(value));
      const taskReminderMinute = startHour * 60 + startMinute - 15;

      if (taskReminderMinute < 0) continue;
      if (!crossedLocalMinute(previousParts, currentParts, dateYmd, taskReminderMinute)) continue;

      candidates.push({
        id: `task:${task.id}:${dateYmd}`,
        payload: buildTaskNotificationPayload(subscription.locale, task.title, task.startTime),
      });
    }
  }

  return candidates;
}

// INPUT: scheduler dependencies and timestamps
// OUTPUT: notification delivery summary
// EFFECT: Scans subscribed users, sends due pushes, prunes stale subscription history, and removes expired endpoints
async function dispatchDueNotifications({
  now = new Date(),
  previousRunAt = new Date(now.getTime() - DEFAULT_NOTIFICATION_INTERVAL_MS),
  userModel = User,
  taskModel = Task,
  sendNotification = sendWebPushNotification,
  logger = console,
} = {}) {
  const userQuery = userModel.find(
    { 'pushSubscriptions.0': { $exists: true } },
    { pushSubscriptions: 1 }
  );
  const users =
    typeof userQuery.lean === 'function'
      ? await userQuery.lean()
      : await userQuery;

  let sentCount = 0;
  let removedSubscriptionCount = 0;

  for (const user of users) {
    const taskQuery = taskModel.find({ userId: user._id }, { _id: 0, __v: 0, userId: 0 });
    const tasks =
      typeof taskQuery.lean === 'function'
        ? await taskQuery.lean()
        : await taskQuery;

    let subscriptionsChanged = false;
    const nextSubscriptions = [];

    for (const subscription of user.pushSubscriptions ?? []) {
      const nextHistory = pruneNotificationHistory(subscription.notificationHistory, now);
      const dueNotifications = collectDueNotificationsForSubscription({
        subscription,
        tasks,
        previousRunAt,
        now,
      }).filter((candidate) => !hasNotificationHistoryEntry(nextHistory, candidate.id));

      let subscriptionRemoved = false;

      for (const candidate of dueNotifications) {
        try {
          await sendNotification(subscription, candidate.payload);
          nextHistory.push({
            id: candidate.id,
            firedAt: now.toISOString(),
          });
          sentCount += 1;
        } catch (error) {
          if (error?.statusCode === 404 || error?.statusCode === 410) {
            subscriptionRemoved = true;
            removedSubscriptionCount += 1;
            subscriptionsChanged = true;
            break;
          }
          logger.error('Failed to send push notification', error);
        }
      }

      if (subscriptionRemoved) {
        continue;
      }

      if (!areNotificationHistoriesEqual(subscription.notificationHistory, nextHistory)) {
        subscriptionsChanged = true;
      }

      nextSubscriptions.push({
        ...subscription,
        notificationHistory: nextHistory,
      });
    }

    if (subscriptionsChanged) {
      await userModel.updateOne(
        { _id: user._id },
        { $set: { pushSubscriptions: nextSubscriptions } },
        { runValidators: true }
      );
    }
  }

  return {
    sentCount,
    removedSubscriptionCount,
  };
}

// INPUT: optional scheduler dependencies
// OUTPUT: stop handle for the background interval
// EFFECT: Runs push notification scans immediately and then every minute while the backend stays online
function startNotificationScheduler({
  runDispatch = dispatchDueNotifications,
  nowFn = () => new Date(),
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval,
  intervalMs = DEFAULT_NOTIFICATION_INTERVAL_MS,
} = {}) {
  let previousRunAt = new Date(nowFn().getTime() - intervalMs);

  async function runOnce() {
    const now = nowFn();
    const currentPreviousRunAt = previousRunAt;
    previousRunAt = now;
    await runDispatch({ now, previousRunAt: currentPreviousRunAt });
  }

  void runOnce();
  const timerId = setIntervalFn(() => {
    void runOnce();
  }, intervalMs);

  return {
    stop() {
      clearIntervalFn(timerId);
    },
  };
}

function normalizeLegacyCompletedAt(task) {
  if (task.completedAt) return task.completedAt;
  if (task.done) return task.updatedAt ?? task.createdAt ?? new Date().toISOString();
  return null;
}

function normalizeOccurrenceOverrides(overrides) {
  const rawEntries =
    overrides instanceof Map
      ? Array.from(overrides.entries())
      : Object.entries(overrides ?? {});

  return Object.fromEntries(
    rawEntries.map(([dateYmd, override]) => [
      dateYmd,
      {
        ...override,
        completedAt: override?.completedAt ?? null,
        deleted: override?.deleted ? true : undefined,
      },
    ])
  );
}

function normalizeLegacyPermanentBeginDate(task) {
  if (task.type !== 'PERMANENT') return task.beginDate;
  const baseDate = task.createdAt ? parseYmd(toYmd(task.createdAt)) : new Date();
  if (typeof task.weekday !== 'number') return toYmd(baseDate);
  const cursor = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate()));
  while (weekdayISO(cursor) !== task.weekday) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return toYmd(cursor);
}

function normalizeTaskEndDate(task, beginDate) {
  if (!beginDate) return task.endDate;
  const candidate = task.endDate ?? task.beginDate ?? task.date ?? beginDate;
  return dayIndex(candidate) < dayIndex(beginDate) ? beginDate : candidate;
}

function normalizeRecurrence(task, beginDate) {
  if (task.recurrence) {
    const frequency = task.recurrence.frequency ?? 'NONE';
    return {
      frequency,
      interval: clampInterval(task.recurrence.interval),
      weekdays:
        frequency === 'WEEKLY'
          ? uniqueSortedNumbers(
              task.recurrence.weekdays?.length
                ? task.recurrence.weekdays
                : inferWeeklyDays(task, beginDate)
            )
          : undefined,
      monthDays:
        frequency === 'MONTHLY'
          ? uniqueSortedNumbers(
              task.recurrence.monthDays?.length
                ? task.recurrence.monthDays
                : inferMonthlyDays(beginDate)
            )
          : undefined,
      until: task.recurrence.until ?? null,
    };
  }

  if (task.type === 'PERMANENT') {
    return {
      frequency: 'WEEKLY',
      interval: 1,
      weekdays: uniqueSortedNumbers(inferWeeklyDays(task, beginDate)),
      until: null,
    };
  }

  return {
    frequency: 'NONE',
    interval: 1,
    until: null,
  };
}

function inferWeeklyDays(task, beginDate) {
  if (typeof task.weekday === 'number') return [task.weekday];
  if (beginDate) return [weekdayISO(parseYmd(beginDate))];
  return [weekdayISO(new Date())];
}

function inferMonthlyDays(beginDate) {
  return [parseYmd(beginDate ?? toYmd(new Date())).getUTCDate()];
}

function clampInterval(interval) {
  const value = Number(interval ?? 1);
  if (Number.isNaN(value)) return 1;
  return Math.min(10, Math.max(1, value));
}

function uniqueSortedNumbers(values) {
  return [...new Set((values ?? []).filter((value) => Number.isFinite(value)))].sort((left, right) => left - right);
}

function getTaskOccurrence(task, dateYmd) {
  if (task.recurrence?.frequency === 'NONE') {
    if (!isOneTimeTaskVisibleOnDate(task, dateYmd)) return null;
    return task.completedAt ? null : task;
  }

  if (!matchesRecurrence(task, dateYmd)) return null;
  const override = task.occurrenceOverrides?.[dateYmd];
  if (override?.deleted || override?.completedAt) return null;
  return override ? { ...task, ...override } : task;
}

function isOneTimeTaskVisibleOnDate(task, dateYmd) {
  const beginDate = task.beginDate;
  if (!beginDate) return false;
  const endDate = task.endDate ?? beginDate;
  return dayIndex(dateYmd) >= dayIndex(beginDate) && dayIndex(dateYmd) <= dayIndex(endDate);
}

function matchesRecurrence(task, dateYmd) {
  const recurrence = task.recurrence;
  const beginDate = task.beginDate;
  if (!recurrence || !beginDate) return false;

  const targetIndex = dayIndex(dateYmd);
  const startIndex = dayIndex(beginDate);
  if (targetIndex < startIndex) return false;
  if (recurrence.until && targetIndex > dayIndex(recurrence.until)) return false;

  if (recurrence.frequency === 'DAILY') {
    return (targetIndex - startIndex) % (recurrence.interval ?? 1) === 0;
  }

  if (recurrence.frequency === 'WEEKLY') {
    const weekDiff = Math.floor((targetIndex - startIndex) / 7);
    return weekDiff % (recurrence.interval ?? 1) === 0 && (recurrence.weekdays ?? []).includes(weekdayISO(parseYmd(dateYmd)));
  }

  if (recurrence.frequency === 'MONTHLY') {
    const startDate = parseYmd(beginDate);
    const targetDate = parseYmd(dateYmd);
    const monthDiff =
      targetDate.getUTCFullYear() * 12 +
      targetDate.getUTCMonth() -
      (startDate.getUTCFullYear() * 12 + startDate.getUTCMonth());
    return monthDiff % (recurrence.interval ?? 1) === 0 && (recurrence.monthDays ?? []).includes(targetDate.getUTCDate());
  }

  if (recurrence.frequency === 'YEARLY') {
    const startDate = parseYmd(beginDate);
    const targetDate = parseYmd(dateYmd);
    return (
      (targetDate.getUTCFullYear() - startDate.getUTCFullYear()) % (recurrence.interval ?? 1) === 0 &&
      targetDate.getUTCMonth() === startDate.getUTCMonth() &&
      targetDate.getUTCDate() === startDate.getUTCDate()
    );
  }

  return false;
}

function parseYmd(dateYmd) {
  const [year, month, day] = String(dateYmd)
    .split('-')
    .map((value) => Number(value));
  return new Date(Date.UTC(year, month - 1, day));
}

function toYmd(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return date.toISOString().slice(0, 10);
}

function dayIndex(dateYmd) {
  return Math.floor(parseYmd(dateYmd).getTime() / (24 * 60 * 60 * 1000));
}

function weekdayISO(date) {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

function buildDailyNotificationPayload(locale, dateYmd) {
  return {
    title: locale === 'zh' ? '每日提醒' : 'Daily Reminder',
    body: locale === 'zh' ? '别忘了查看今天的任务。' : "Don't forget your tasks for today.",
    tag: `daily-${dateYmd}`,
    url: '/',
  };
}

function buildTaskNotificationPayload(locale, title, startTime) {
  const timeLabel = formatTimeLabel(startTime, locale);
  return {
    title:
      locale === 'zh'
        ? `任务即将开始：${title}`
        : `Task Starting Soon: ${title}`,
    body:
      locale === 'zh'
        ? `开始时间 ${timeLabel}`
        : `Starts at ${timeLabel}`,
    tag: `task-${title}-${startTime}`,
    url: '/',
  };
}

function formatTimeLabel(startTime, locale) {
  const [hour, minute] = String(startTime)
    .split(':')
    .map((value) => Number(value));
  const sampleDate = new Date(Date.UTC(2000, 0, 1, hour, minute));
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(sampleDate);
}

module.exports = {
  DAILY_NOTIFICATION_HOURS,
  DEFAULT_NOTIFICATION_INTERVAL_MS,
  NOTIFICATION_HISTORY_RETENTION_MS,
  collectDueNotificationsForSubscription,
  crossedLocalMinute,
  dispatchDueNotifications,
  areNotificationHistoriesEqual,
  getLocalDateParts,
  pruneNotificationHistory,
  startNotificationScheduler,
  tasksForDate,
};
