// INPUT: task collections with fewer or more than five recent scheduled tasks
// OUTPUT: behavior coverage for Stats page empty and analytics states
// EFFECT: Verifies the analytics page gates rich sections until enough task data exists
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import i18n from "../src/i18n";
import { StatsPage } from "../src/pages/StatsPage";
import type { Task } from "../src/types";
import { renderWithProviders } from "./test-utils";
import { setScreenWidth } from "./setup";

function makeTask(overrides: Partial<Task> = {}): Task {
  const id = crypto.randomUUID();
  return {
    id,
    title: "Test task",
    type: "ONCE",
    date: "2026-05-05",
    beginDate: "2026-05-05",
    recurrence: { frequency: "NONE" },
    emergency: 5,
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeCompletedTasks() {
  return [
    "2026-04-20",
    "2026-04-21",
    "2026-04-22",
    "2026-04-23",
    "2026-04-24",
    "2026-04-25",
    "2026-04-26",
    "2026-04-27",
    "2026-05-03",
    "2026-05-04",
  ].map((date, index) => makeTask({
    id: `task-${index}`,
    date,
    beginDate: date,
    completedAt: `${date}T10:00:00.000Z`,
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T10:00:00.000Z`,
  }));
}

describe("StatsPage behavior", () => {
  beforeEach(async () => {
    setScreenWidth(1024);
    await i18n.changeLanguage("en");
  });

  it("renders the empty state when fewer than five tasks are in the current window", () => {
    renderWithProviders(<StatsPage tasks={[
      makeTask({ id: "one", date: "2026-05-04", beginDate: "2026-05-04" }),
      makeTask({ id: "two", date: "2026-05-05", beginDate: "2026-05-05" }),
    ]} />);

    expect(screen.getByText("Not enough activity yet")).toBeInTheDocument();
  });

  it("renders summary cards with five or more completed tasks", () => {
    renderWithProviders(<StatsPage tasks={makeCompletedTasks()} />);

    expect(screen.getAllByText("Completed")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Created")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Completion Rate")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Overdue")[0]).toBeInTheDocument();
  });

  it("renders the trend chart section with five or more tasks", () => {
    renderWithProviders(<StatsPage tasks={makeCompletedTasks()} />);

    expect(screen.getByText("30-Day Completion Trend")).toBeInTheDocument();
  });

  it("renders the comparison section with five or more tasks", () => {
    renderWithProviders(<StatsPage tasks={makeCompletedTasks()} />);

    expect(screen.getByText("Compared With Previous 30 Days")).toBeInTheDocument();
  });
});
