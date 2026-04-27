// INPUT: notification identifiers, browser localStorage, and the current time
// OUTPUT: bounded notification-history reads and writes for reminder deduplication
// EFFECT: Prevents duplicate browser notifications while pruning entries older than three days
const NOTIFICATION_HISTORY_KEY = "notification-history";
const NOTIFICATION_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;

export type NotificationHistoryEntry = {
  id: string;
  firedAt: string;
};

function parseNotificationHistory() {
  const raw = localStorage.getItem(NOTIFICATION_HISTORY_KEY);

  if (!raw) {
    return [] as NotificationHistoryEntry[];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [] as NotificationHistoryEntry[];
    }

    return parsed.filter((entry): entry is NotificationHistoryEntry => {
      return typeof entry?.id === "string" && typeof entry?.firedAt === "string";
    });
  } catch {
    return [] as NotificationHistoryEntry[];
  }
}

function pruneNotificationHistory(entries: NotificationHistoryEntry[], now: Date) {
  const cutoff = now.getTime() - NOTIFICATION_RETENTION_MS;

  return entries.filter((entry) => {
    const firedAt = new Date(entry.firedAt).getTime();
    return Number.isFinite(firedAt) && firedAt >= cutoff;
  });
}

function writeNotificationHistory(entries: NotificationHistoryEntry[]) {
  if (entries.length === 0) {
    localStorage.removeItem(NOTIFICATION_HISTORY_KEY);
    return;
  }

  localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(entries));
}

function getNotificationHistoryState(now: Date) {
  const entries = parseNotificationHistory();
  const prunedEntries = pruneNotificationHistory(entries, now);

  return {
    entries: prunedEntries,
    changed: prunedEntries.length !== entries.length,
  };
}

export function loadNotificationHistory(now = new Date()) {
  return getNotificationHistoryState(now).entries;
}

export function hasNotificationFired(id: string, now = new Date()) {
  return loadNotificationHistory(now).some((entry) => entry.id === id);
}

export function pruneStoredNotificationHistory(now = new Date()) {
  const historyState = getNotificationHistoryState(now);

  if (historyState.changed) {
    writeNotificationHistory(historyState.entries);
  }

  return historyState.entries;
}

export function recordNotificationFired(id: string, now = new Date()) {
  const historyState = getNotificationHistoryState(now);
  const nextEntries = historyState.entries;

  if (nextEntries.some((entry) => entry.id === id)) {
    if (historyState.changed) {
      writeNotificationHistory(nextEntries);
    }
    return;
  }

  nextEntries.push({
    id,
    firedAt: now.toISOString(),
  });
  writeNotificationHistory(nextEntries);
}

export { NOTIFICATION_HISTORY_KEY };
