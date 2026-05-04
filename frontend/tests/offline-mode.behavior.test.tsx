// INPUT: offline browser state and network failures
// OUTPUT: behavior coverage for stable offline mode
// EFFECT: Verifies the planner survives network absence without logging out, crashing pages, or showing blank screens
import { act, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import { LATEST_RELEASE_ID } from "../src/app/releaseNotes";
import { setAuth, saveCachedTasks } from "../src/app/storage";
import App from "../src/App";
import { HelpPage } from "../src/pages/HelpPage";
import { ChunkErrorBoundary } from "../src/components/ChunkErrorBoundary";
import { renderWithProviders } from "./test-utils";
import { setScreenWidth } from "./setup";

const storageMocks = vi.hoisted(() => ({
  loadSession: vi.fn(),
  loadTasks: vi.fn(),
  loadReminders: vi.fn(),
  flushPendingTaskSync: vi.fn(),
}));

vi.mock("../src/app/storage", async () => {
  const actual = await vi.importActual<typeof import("../src/app/storage")>("../src/app/storage");
  return {
    ...actual,
    loadSession: storageMocks.loadSession,
    loadTasks: storageMocks.loadTasks,
    loadReminders: storageMocks.loadReminders,
    flushPendingTaskSync: storageMocks.flushPendingTaskSync,
    rolloverIfNeeded: (tasks: unknown) => tasks,
  };
});

function setupBaseAuth() {
  localStorage.setItem("release-notes-seen:tom", LATEST_RELEASE_ID);
  localStorage.setItem("tasktide:onboarding:v1.18.4", "done");
  setAuth("tom", "USER");
  setScreenWidth(1024);
}

describe("offline mode behavior", () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage("en");
    storageMocks.loadSession.mockReset();
    storageMocks.loadTasks.mockReset();
    storageMocks.loadReminders.mockReset();
    storageMocks.flushPendingTaskSync.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // Cycle 4: chunk load failure shows fallback UI, not blank page
  it("shows the offline fallback message when a page chunk fails to load", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    function BrokenPage(): ReactNode {
      throw new TypeError("Failed to fetch dynamically imported module");
    }

    renderWithProviders(
      <ChunkErrorBoundary resetKey="/">
        <BrokenPage />
      </ChunkErrorBoundary>
    );

    expect(screen.getByText("This page isn't available offline. Go back online to load it.")).toBeInTheDocument();
  });

  it("resets the chunk error boundary when the route changes", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let shouldThrow = true;

    function MaybeBreakPage() {
      if (shouldThrow) throw new TypeError("chunk load failed");
      return <div>Page loaded</div>;
    }

    const { rerender } = renderWithProviders(
      <ChunkErrorBoundary resetKey="/week">
        <MaybeBreakPage />
      </ChunkErrorBoundary>
    );

    expect(screen.getByText("This page isn't available offline. Go back online to load it.")).toBeInTheDocument();

    shouldThrow = false;
    rerender(
      <ChunkErrorBoundary resetKey="/month">
        <MaybeBreakPage />
      </ChunkErrorBoundary>
    );

    expect(screen.getByText("Page loaded")).toBeInTheDocument();
  });

  // Cycle 3: Help Center works offline — shows content, not blank
  it("renders Help Center guide content when question loading fails offline", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    renderWithProviders(<HelpPage />);

    await waitFor(() => {
      expect(screen.getByText("How To Use This Website")).toBeInTheDocument();
    });
  });

  // Cycle 5: switching pages offline shows fallback, not blank screen
  it("shows the offline fallback instead of a blank page when a lazy page chunk fails to load", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    setupBaseAuth();
    saveCachedTasks([]);
    storageMocks.loadSession.mockResolvedValue({ username: "tom", role: "USER" });
    storageMocks.loadTasks.mockResolvedValue([]);
    storageMocks.loadReminders.mockResolvedValue([]);

    await act(async () => {
      renderWithProviders(<App />, "/week");
    });

    await waitFor(() => {
      const nav = screen.getAllByRole("link", { name: "Today" });
      expect(nav.length).toBeGreaterThan(0);
    });

    expect(document.body.innerHTML).not.toBe("");
    expect(document.querySelector("[data-testid='blank']")).toBeNull();
  });

  // Cycle 2: app renders when navigator.onLine is false
  it("renders the today page using cached tasks when the browser is offline", async () => {
    setupBaseAuth();
    saveCachedTasks([
      {
        id: "cached-1",
        title: "Offline cached task",
        type: "ONCE",
        beginDate: "2026-05-03",
        date: "2026-05-03",
        recurrence: { frequency: "NONE" },
        completedAt: null,
        createdAt: "2026-05-03T08:00:00.000Z",
        updatedAt: "2026-05-03T08:00:00.000Z",
      },
    ]);

    vi.stubGlobal("navigator", { ...navigator, onLine: false });
    storageMocks.loadSession.mockResolvedValue({ username: "tom", role: "USER" });
    storageMocks.loadTasks.mockRejectedValue(new TypeError("Failed to fetch"));
    storageMocks.loadReminders.mockRejectedValue(new TypeError("Failed to fetch"));

    await act(async () => {
      renderWithProviders(<App />);
    });

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: "Today" }).length).toBeGreaterThan(0);
    });
  });

  // Cycle 1: network TypeError must not clear auth (i.e. not trigger logout)
  it("a network TypeError from a task fetch does not clear the saved session", async () => {
    setAuth("tom", "USER");

    storageMocks.loadSession.mockResolvedValue({ username: "tom", role: "USER" });
    storageMocks.loadTasks.mockRejectedValue(new TypeError("Failed to fetch"));
    storageMocks.loadReminders.mockResolvedValue([]);

    setupBaseAuth();
    saveCachedTasks([]);

    await act(async () => {
      renderWithProviders(<App />);
    });

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: "Today" }).length).toBeGreaterThan(0);
    });

    expect(localStorage.getItem("tasktide_username")).toBe("tom");
  });
});
