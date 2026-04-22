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

vi.mock("../src/app/storage", async () => {
  const actual = await vi.importActual<typeof import("../src/app/storage")>("../src/app/storage");
  return {
    ...actual,
    getToken: () => "token",
    getUsername: () => "tom",
    loadTasks: vi.fn().mockResolvedValue([]),
    loadReminders: vi.fn().mockResolvedValue([]),
    saveTasks: vi.fn(),
    saveReminders: vi.fn(),
    logoutUser: vi.fn(),
    rolloverIfNeeded: (tasks: unknown) => tasks,
  };
});

describe("App behavior", () => {
  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem("release-notes-seen:tom", LATEST_RELEASE_ID);
    await i18n.changeLanguage("en");
  });

  it("switches navigation labels when the language toggle is used", async () => {
    const user = userEvent.setup();

    renderWithProviders(<App />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Today" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "中文" }));

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "今天" })).toBeInTheDocument();
    });
  });
});
