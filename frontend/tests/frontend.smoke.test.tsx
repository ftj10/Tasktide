// INPUT: app pages with mocked data sources
// OUTPUT: smoke coverage for major frontend routes
// EFFECT: Verifies the main planner surfaces render after shared UI changes
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import type { HelpQuestion, Reminder, Task } from "../src/types";
import App from "../src/App";
import { HelpPage } from "../src/pages/HelpPage";
import { MonthPage } from "../src/pages/MonthPage";
import { ReminderPage } from "../src/pages/ReminderPage";
import { TodayPage } from "../src/pages/TodayPage";
import { WeekPage } from "../src/pages/WeekPage";
import { renderWithProviders } from "./test-utils";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../src/app/storage", async () => {
  const actual = await vi.importActual<typeof import("../src/app/storage")>("../src/app/storage");
  return {
    ...actual,
    getToken: () => "token",
    getUsername: () => "tom",
    loadTasks: vi.fn().mockResolvedValue([]),
    loadReminders: vi.fn().mockResolvedValue([]),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    createReminder: vi.fn(),
    updateReminder: vi.fn(),
    deleteReminder: vi.fn(),
    loadHelpQuestions: vi.fn().mockResolvedValue([
      {
        id: "q1",
        username: "alice",
        question: "How do I use the planner?",
        createdAt: "2026-04-21T10:00:00.000Z",
      } satisfies HelpQuestion,
    ]),
    createHelpQuestion: vi.fn().mockResolvedValue(undefined),
    logoutUser: vi.fn(),
    rolloverIfNeeded: (tasks: unknown) => tasks,
  };
});

vi.mock("@fullcalendar/react", () => ({
  default: () => <div>calendar</div>,
}));

describe("frontend smoke", () => {
  beforeEach(async () => {
    localStorage.clear();
    navigateMock.mockReset();
    await i18n.changeLanguage("en");
  });

  it("renders the app shell", async () => {
    renderWithProviders(<App />);
    expect((await screen.findAllByText("Updates")).length).toBeGreaterThan(0);
  });

  it("renders the today page", () => {
    const tasks: Task[] = [];
    renderWithProviders(<TodayPage tasks={tasks} setTasks={vi.fn()} />);
    expect(screen.getAllByRole("button", { name: "Add Task" }).length).toBeGreaterThan(0);
  });

  it("renders the week page", () => {
    renderWithProviders(<WeekPage tasks={[]} setTasks={vi.fn()} completionsRev={0} />);
    expect(screen.getByText("calendar")).toBeInTheDocument();
  });

  it("renders the month page", () => {
    renderWithProviders(<MonthPage tasks={[]} setTasks={vi.fn()} />);
    expect(screen.getByText("Sun")).toBeInTheDocument();
  });

  it("renders the reminder page", () => {
    const reminders: Reminder[] = [];
    renderWithProviders(<ReminderPage reminders={reminders} setReminders={vi.fn()} />);
    expect(screen.getByText("Active Reminders")).toBeInTheDocument();
  });

  it("renders the help page", async () => {
    renderWithProviders(<HelpPage />);
    expect(await screen.findByText("Help Center")).toBeInTheDocument();
    expect(await screen.findByText("How do I use the planner?")).toBeInTheDocument();
  });
});
