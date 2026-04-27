// INPUT: notification history entries, browser localStorage, and retention windows
// OUTPUT: behavior coverage for notification-history pruning and deduplication
// EFFECT: Verifies reminder notification state stays bounded instead of growing forever
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  hasNotificationFired,
  loadNotificationHistory,
  NOTIFICATION_HISTORY_KEY,
  pruneStoredNotificationHistory,
  recordNotificationFired,
} from "../src/app/notificationHistory";

describe("notificationHistory behavior", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("records fired notifications in one retained history key", () => {
    const now = new Date("2026-04-26T10:00:00.000Z");

    recordNotificationFired("daily:2026-04-26:10", now);
    recordNotificationFired("task:task-1:2026-04-26", now);

    expect(localStorage.getItem(NOTIFICATION_HISTORY_KEY)).toBe(JSON.stringify([
      {
        id: "daily:2026-04-26:10",
        firedAt: "2026-04-26T10:00:00.000Z",
      },
      {
        id: "task:task-1:2026-04-26",
        firedAt: "2026-04-26T10:00:00.000Z",
      },
    ]));
  });

  it("prunes entries older than three days while keeping recent notification ids", () => {
    localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify([
      {
        id: "daily:2026-04-22:10",
        firedAt: "2026-04-22T09:59:59.000Z",
      },
      {
        id: "daily:2026-04-23:10",
        firedAt: "2026-04-23T10:00:00.000Z",
      },
    ]));

    const history = loadNotificationHistory(new Date("2026-04-26T10:00:00.000Z"));

    expect(history).toEqual([
      {
        id: "daily:2026-04-23:10",
        firedAt: "2026-04-23T10:00:00.000Z",
      },
    ]);
    expect(hasNotificationFired("daily:2026-04-22:10", new Date("2026-04-26T10:00:00.000Z"))).toBe(false);
    expect(hasNotificationFired("daily:2026-04-23:10", new Date("2026-04-26T10:00:00.000Z"))).toBe(true);
  });

  it("does not rewrite localStorage while reading notification history", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const removeItemSpy = vi.spyOn(Storage.prototype, "removeItem");

    localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify([
      {
        id: "daily:2026-04-23:10",
        firedAt: "2026-04-23T10:00:00.000Z",
      },
    ]));
    setItemSpy.mockClear();
    removeItemSpy.mockClear();

    expect(loadNotificationHistory(new Date("2026-04-26T10:00:00.000Z"))).toEqual([
      {
        id: "daily:2026-04-23:10",
        firedAt: "2026-04-23T10:00:00.000Z",
      },
    ]);
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(removeItemSpy).not.toHaveBeenCalled();
  });

  it("writes pruned history only when stale entries were removed", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify([
      {
        id: "daily:2026-04-22:10",
        firedAt: "2026-04-22T09:59:59.000Z",
      },
      {
        id: "daily:2026-04-23:10",
        firedAt: "2026-04-23T10:00:00.000Z",
      },
    ]));
    setItemSpy.mockClear();

    expect(pruneStoredNotificationHistory(new Date("2026-04-26T10:00:00.000Z"))).toEqual([
      {
        id: "daily:2026-04-23:10",
        firedAt: "2026-04-23T10:00:00.000Z",
      },
    ]);
    expect(setItemSpy).toHaveBeenCalledTimes(1);
  });

  it("ignores duplicate writes for the same notification id", () => {
    const now = new Date("2026-04-26T21:00:00.000Z");

    recordNotificationFired("daily:2026-04-26:21", now);
    recordNotificationFired("daily:2026-04-26:21", now);

    expect(loadNotificationHistory(now)).toEqual([
      {
        id: "daily:2026-04-26:21",
        firedAt: "2026-04-26T21:00:00.000Z",
      },
    ]);
  });
});
