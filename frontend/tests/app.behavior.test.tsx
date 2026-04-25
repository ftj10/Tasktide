// INPUT: app shell with mocked storage and release-note state
// OUTPUT: behavior coverage for shell-level interactions
// EFFECT: Verifies top-level planner features such as localization continue to work after shell updates
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, beforeEach, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
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

  it("reloads server tasks after a failed task save so local-only edits do not linger", async () => {
    const user = userEvent.setup();
    storageMocks.createTask.mockRejectedValueOnce(new Error("save failed"));
    storageMocks.loadTasks
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    renderWithProviders(<App />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add Task" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Add Task" }));
    await user.type(screen.getByLabelText("Task name"), "Unsaved task");
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(storageMocks.loadTasks).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(screen.queryByText("Unsaved task")).not.toBeInTheDocument();
    });
  });
});
