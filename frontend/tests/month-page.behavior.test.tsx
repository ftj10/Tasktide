// INPUT: month page and mocked navigation
// OUTPUT: behavior coverage for month-grid navigation
// EFFECT: Verifies the reduced month view keeps the task grid, date navigation, and grid swipe behavior
import dayjs from "dayjs";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, beforeEach, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import { MonthPage } from "../src/pages/MonthPage";
import { renderWithProviders } from "./test-utils";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("MonthPage behavior", () => {
  beforeEach(async () => {
    navigateMock.mockReset();
    await i18n.changeLanguage("en");
  });

  it("navigates to the selected day route when a calendar cell is clicked", async () => {
    const user = userEvent.setup();
    const todayDate = dayjs().format("YYYY-MM-DD");
    const todayNumber = String(dayjs().date());

    renderWithProviders(<MonthPage tasks={[]} setTasks={vi.fn()} />);

    await user.click(screen.getAllByText(todayNumber)[0]);

    expect(navigateMock).toHaveBeenCalledWith(`/?date=${todayDate}`);
  });

  it("renders only the month task grid without the extra header controls", () => {
    renderWithProviders(<MonthPage tasks={[]} setTasks={vi.fn()} />);

    expect(screen.getByText(dayjs().format("MMMM YYYY"))).toBeInTheDocument();
    expect(screen.getByText("Jump to Current Month")).toBeInTheDocument();
    expect(screen.getByTestId("month-grid-surface")).toBeInTheDocument();
  });

  it("changes month when the reduced month grid is swiped vertically", () => {
    renderWithProviders(<MonthPage tasks={[]} setTasks={vi.fn()} />);

    const nextMonthDay = dayjs().add(1, "month").date(1).format("D");
    const swipeSurface = screen.getByTestId("month-grid-surface");

    fireEvent.touchStart(swipeSurface, { touches: [{ clientX: 120, clientY: 260 }] });
    fireEvent.touchMove(swipeSurface, { touches: [{ clientX: 126, clientY: 120 }] });
    fireEvent.touchEnd(swipeSurface);

    expect(screen.getAllByText(nextMonthDay).length).toBeGreaterThan(0);
  });

  it("jumps back to the current month when the month jump button is pressed", async () => {
    const user = userEvent.setup();

    renderWithProviders(<MonthPage tasks={[]} setTasks={vi.fn()} />);

    const swipeSurface = screen.getByTestId("month-grid-surface");
    fireEvent.touchStart(swipeSurface, { touches: [{ clientX: 120, clientY: 260 }] });
    fireEvent.touchMove(swipeSurface, { touches: [{ clientX: 126, clientY: 120 }] });
    fireEvent.touchEnd(swipeSurface);

    await user.click(screen.getByRole("button", { name: "Jump to Current Month" }));

    expect(screen.getAllByText(String(dayjs().date())).length).toBeGreaterThan(0);
  });

  it("does not show a per-day task-count label in month cells", () => {
    renderWithProviders(
      <MonthPage
        tasks={[
          {
            id: "task-1",
            title: "Plan roadmap",
            type: "ONCE",
            date: dayjs().format("YYYY-MM-DD"),
            emergency: 2,
            createdAt: "2026-04-20T00:00:00.000Z",
            updatedAt: "2026-04-20T00:00:00.000Z",
          },
        ]}
        setTasks={vi.fn()}
      />
    );

    expect(screen.queryByText(/1 tasks?/i)).not.toBeInTheDocument();
  });
});
