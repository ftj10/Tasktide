// INPUT: app shell with mocked storage and release-note state
// OUTPUT: behavior coverage for shell-level interactions
// EFFECT: Verifies top-level planner features such as localization continue to work after shell updates
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import { NOTIFICATION_HISTORY_KEY } from "../src/app/notificationHistory";
import { LATEST_RELEASE_ID } from "../src/app/releaseNotes";
import App from "../src/App";
import { renderWithProviders } from "./test-utils";
import { setScreenWidth } from "./setup";

const storageMocks = vi.hoisted(() => ({
  loadTasks: vi.fn(),
  loadReminders: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  createReminder: vi.fn(),
  updateReminder: vi.fn(),
  deleteReminder: vi.fn(),
  logoutUser: vi.fn(),
}));

vi.mock("../src/app/storage", async () => {
  const actual = await vi.importActual<typeof import("../src/app/storage")>("../src/app/storage");
  return {
    ...actual,
    getToken: () => "token",
    getUsername: () => "tom",
    loadTasks: storageMocks.loadTasks,
    loadReminders: storageMocks.loadReminders,
    createTask: storageMocks.createTask,
    updateTask: storageMocks.updateTask,
    deleteTask: storageMocks.deleteTask,
    createReminder: storageMocks.createReminder,
    updateReminder: storageMocks.updateReminder,
    deleteReminder: storageMocks.deleteReminder,
    logoutUser: storageMocks.logoutUser,
    rolloverIfNeeded: (tasks: unknown) => tasks,
  };
});

describe("App behavior", () => {
  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem("release-notes-seen:tom", LATEST_RELEASE_ID);
    setScreenWidth(1024);
    storageMocks.loadTasks.mockReset().mockResolvedValue([]);
    storageMocks.loadReminders.mockReset().mockResolvedValue([]);
    storageMocks.createTask.mockReset().mockResolvedValue(undefined);
    storageMocks.updateTask.mockReset().mockResolvedValue(undefined);
    storageMocks.deleteTask.mockReset().mockResolvedValue(undefined);
    storageMocks.createReminder.mockReset().mockResolvedValue(undefined);
    storageMocks.updateReminder.mockReset().mockResolvedValue(undefined);
    storageMocks.deleteReminder.mockReset().mockResolvedValue(undefined);
    storageMocks.logoutUser.mockReset();
    await i18n.changeLanguage("en");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("switches navigation labels when the language toggle is used", async () => {
    const user = userEvent.setup();

    renderWithProviders(<App />);

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: "Today" }).length).toBeGreaterThan(0);
    });

    await user.click(screen.getAllByRole("button", { name: "中文" })[0]);

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: "今天" }).length).toBeGreaterThan(0);
    });
  });

  it("renders mobile bottom navigation on small screens", async () => {
    setScreenWidth(390);

    renderWithProviders(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText("Mobile navigation")).toBeInTheDocument();
    });

    expect(screen.getAllByRole("link", { name: "Today" }).length).toBeGreaterThan(0);
  });

  it("keeps mobile bottom navigation above overlapping page content", async () => {
    setScreenWidth(390);

    renderWithProviders(<App />);

    const mobileNavigation = await screen.findByLabelText("Mobile navigation");
    const mobileNavigationPaper = mobileNavigation.parentElement;

    expect(mobileNavigationPaper).toHaveStyle({ zIndex: "1700" });
  });

  it("hides mobile bottom navigation while the task dialog is open", async () => {
    const user = userEvent.setup();
    setScreenWidth(390);

    renderWithProviders(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText("Mobile navigation")).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole("button", { name: "Add Task" })[0]);

    await waitFor(() => {
      expect(screen.getByLabelText("Mobile navigation")).not.toBeVisible();
    });

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Mobile navigation")).toBeVisible();
    });
  });

  it("reloads server tasks after a failed task save so local-only edits do not linger", async () => {
    const user = userEvent.setup();
    storageMocks.createTask.mockRejectedValueOnce(new Error("save failed"));
    storageMocks.loadTasks
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    renderWithProviders(<App />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "Add Task" }).length).toBeGreaterThan(0);
    });

    await user.click(screen.getAllByRole("button", { name: "Add Task" })[0]);
    await user.type(screen.getByLabelText("Task name"), "Unsaved task");
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(storageMocks.loadTasks).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(screen.queryByText("Unsaved task")).not.toBeInTheDocument();
    });
  });

  it("stores daily notification dedupe state in the retained history key", async () => {
    const notificationMock = vi.fn(function notificationConstructor(this: { close: ReturnType<typeof vi.fn>; onclick: null }) {
      this.close = vi.fn();
      this.onclick = null;
    });
    const notificationApi = Object.assign(notificationMock, {
      permission: "granted",
      requestPermission: vi.fn(),
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-26T09:59:20"));
    vi.stubGlobal("Notification", notificationApi);
    Object.defineProperty(window, "Notification", {
      configurable: true,
      writable: true,
      value: notificationApi,
    });

    await act(async () => {
      renderWithProviders(<App />);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000);
    });

    expect(notificationMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(NOTIFICATION_HISTORY_KEY)).toContain("daily:2026-04-26:10");
    expect(localStorage.getItem("notified-Sun Apr 26 2026-10")).toBeNull();
  });

  it("requests notification permission only after a user interaction", async () => {
    const requestPermission = vi.fn().mockResolvedValue("granted");
    const notificationApi = function notificationConstructor() {};
    Object.assign(notificationApi, {
      permission: "default",
      requestPermission,
    });

    vi.stubGlobal("Notification", notificationApi);
    Object.defineProperty(window, "Notification", {
      configurable: true,
      writable: true,
      value: notificationApi,
    });

    renderWithProviders(<App />);

    expect(requestPermission).not.toHaveBeenCalled();

    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointerdown"));
    });

    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it("prunes stale notification history before writing the next reminder", async () => {
    const notificationMock = vi.fn(function notificationConstructor(this: { close: ReturnType<typeof vi.fn>; onclick: null }) {
      this.close = vi.fn();
      this.onclick = null;
    });
    const notificationApi = Object.assign(notificationMock, {
      permission: "granted",
      requestPermission: vi.fn(),
    });

    localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify([
      {
        id: "daily:2026-04-22:10",
        firedAt: "2026-04-22T09:59:59.000Z",
      },
    ]));

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-26T20:59:20"));
    vi.stubGlobal("Notification", notificationApi);
    Object.defineProperty(window, "Notification", {
      configurable: true,
      writable: true,
      value: notificationApi,
    });

    await act(async () => {
      renderWithProviders(<App />);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000);
    });

    expect(notificationMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(NOTIFICATION_HISTORY_KEY)).toBe(JSON.stringify([
      {
        id: "daily:2026-04-26:21",
        firedAt: new Date("2026-04-27T04:00:20.000Z").toISOString(),
      },
    ]));
  });

  it("fires a task reminder when the interval crosses the 15-minute window late", async () => {
    const notificationMock = vi.fn(function notificationConstructor(this: { close: ReturnType<typeof vi.fn>; onclick: null }) {
      this.close = vi.fn();
      this.onclick = null;
    });
    const notificationApi = Object.assign(notificationMock, {
      permission: "granted",
      requestPermission: vi.fn(),
    });

    storageMocks.loadTasks.mockResolvedValue([
      {
        id: "task-1",
        title: "Standup",
        type: "ONCE",
        date: "2026-04-26",
        startTime: "14:15",
        completedAt: null,
        createdAt: "2026-04-26T08:00:00.000Z",
        updatedAt: "2026-04-26T08:00:00.000Z",
      },
    ]);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-26T13:59:20"));
    vi.stubGlobal("Notification", notificationApi);
    Object.defineProperty(window, "Notification", {
      configurable: true,
      writable: true,
      value: notificationApi,
    });

    await act(async () => {
      renderWithProviders(<App />);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000);
    });

    expect(notificationMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(NOTIFICATION_HISTORY_KEY)).toContain("task:task-1:2026-04-26");
  });
});
