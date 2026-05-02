// INPUT: mocked browser storage and network failures
// OUTPUT: behavior coverage for offline task persistence
// EFFECT: Verifies cached tasks and queued writes keep the planner usable without API access
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Task } from "../src/types";
import {
  createTask,
  flushPendingTaskSync,
  loadSession,
  loadTasks,
  saveCachedTasks,
  setAuth,
  updateTask,
} from "../src/app/storage";

function buildTask(overrides: Partial<Task> = {}): Task {
  const now = "2026-04-30T12:00:00.000Z";
  return {
    id: "offline-task-1",
    title: "Offline task",
    type: "ONCE",
    beginDate: "2026-04-30",
    date: "2026-04-30",
    recurrence: { frequency: "NONE" },
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("offline storage behavior", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("keeps a saved browser session available when the session endpoint is offline", async () => {
    setAuth("tom", "USER");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(loadSession()).resolves.toEqual({ username: "tom", role: "USER" });
  });

  it("loads cached tasks when the task API is offline", async () => {
    const task = buildTask();
    setAuth("tom", "USER");
    saveCachedTasks([task]);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(loadTasks()).resolves.toMatchObject([{ id: task.id, title: task.title }]);
  });

  it("queues offline task creation and replays it when sync is available", async () => {
    const task = buildTask();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createTask(task)).resolves.toBeUndefined();
    await expect(flushPendingTaskSync()).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe("/api/tasks");
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "POST" });
  });

  it("merges repeated offline task updates before replaying the latest task", async () => {
    const originalTask = buildTask({ updatedAt: "2026-04-30T12:00:00.000Z" });
    const firstEdit = buildTask({ title: "First offline edit", updatedAt: "2026-04-30T12:05:00.000Z" });
    const secondEdit = buildTask({ title: "Second offline edit", updatedAt: "2026-04-30T12:10:00.000Z" });
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce(new Response(JSON.stringify([originalTask]), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateTask(firstEdit, originalTask)).resolves.toBeUndefined();
    await expect(updateTask(secondEdit, originalTask)).resolves.toBeUndefined();
    await expect(flushPendingTaskSync()).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[2][0]).toBe("/api/tasks");
    expect(fetchMock.mock.calls[3][0]).toBe("/api/tasks/offline-task-1");
    expect(fetchMock.mock.calls[3][1]).toMatchObject({ method: "PUT" });
    expect(JSON.parse(String(fetchMock.mock.calls[3][1]?.body))).toMatchObject({
      title: "Second offline edit",
      updatedAt: "2026-04-30T12:10:00.000Z",
    });
  });

  it("keeps a stale offline task update queued when the server task changed first", async () => {
    const originalTask = buildTask({ updatedAt: "2026-04-30T12:00:00.000Z" });
    const offlineEdit = buildTask({ title: "Offline edit", updatedAt: "2026-04-30T12:05:00.000Z" });
    const serverEdit = buildTask({ title: "Server edit", updatedAt: "2026-04-30T12:03:00.000Z" });
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce(new Response(JSON.stringify([serverEdit]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateTask(offlineEdit, originalTask)).resolves.toBeUndefined();
    await expect(flushPendingTaskSync()).rejects.toThrow("Task sync conflict");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe("/api/tasks");
    expect(localStorage.getItem("tasktide_tasks_sync_queue_v1")).toContain("Offline edit");
  });
});
