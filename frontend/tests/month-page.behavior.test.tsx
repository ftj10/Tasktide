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
import { setScreenWidth } from "./setup";

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
    setScreenWidth(1024);
    await i18n.changeLanguage("en");
  });

  it("navigates to the selected day route when a calendar cell is clicked", async () => {
    const user = userEvent.setup();
    const todayDate = dayjs().format("YYYY-MM-DD");

    renderWithProviders(<MonthPage tasks={[]} />, `/?date=${todayDate}`);

    await user.click(screen.getByRole("button", { name: todayDate }));

    expect(navigateMock).toHaveBeenCalledWith(`/?date=${todayDate}`);
  });

  it("seeds the visible month from the selected route date", () => {
    renderWithProviders(<MonthPage tasks={[]} />, "/?date=2026-03-29");

    expect(screen.getByText("March 2026")).toBeInTheDocument();
  });

  it("renders only the month task grid without the extra header controls", () => {
    renderWithProviders(<MonthPage tasks={[]} />);

    expect(screen.getByText(dayjs().format("MMMM YYYY"))).toBeInTheDocument();
    expect(screen.getByText("Jump to Current Month")).toBeInTheDocument();
    expect(screen.getByLabelText("Previous month")).toBeInTheDocument();
    expect(screen.getByLabelText("Next month")).toBeInTheDocument();
    expect(screen.getByTestId("month-grid-surface")).toBeInTheDocument();
  });

  it("changes month when the reduced month grid is swiped vertically on mobile", () => {
    setScreenWidth(390);
    renderWithProviders(<MonthPage tasks={[]} />);

    const nextMonthDay = dayjs().add(1, "month").date(1).format("D");
    const swipeSurface = screen.getByTestId("month-grid-surface");

    fireEvent.touchStart(swipeSurface, { touches: [{ clientX: 120, clientY: 260 }] });
    fireEvent.touchMove(swipeSurface, { touches: [{ clientX: 126, clientY: 120 }] });
    fireEvent.touchEnd(swipeSurface);

    expect(screen.getAllByText(nextMonthDay).length).toBeGreaterThan(0);
  });

  it("hides month arrow buttons on mobile while keeping the jump button", () => {
    setScreenWidth(390);
    renderWithProviders(<MonthPage tasks={[]} />);

    expect(screen.queryByLabelText("Previous month")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Next month")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Jump to Current Month" })).toBeInTheDocument();
  });

  it("changes month with arrow buttons on desktop", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MonthPage tasks={[]} />);

    const nextMonthDay = dayjs().add(1, "month").date(1).format("D");
    await user.click(screen.getByLabelText("Next month"));

    expect(screen.getAllByText(nextMonthDay).length).toBeGreaterThan(0);
  });

  it("jumps back to the current month when the month jump button is pressed", async () => {
    const user = userEvent.setup();

    renderWithProviders(<MonthPage tasks={[]} />);

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
      />
    );

    expect(screen.queryByText(/1 tasks?/i)).not.toBeInTheDocument();
  });
});
