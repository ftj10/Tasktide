// INPUT: week page, mocked calendar interactions, and task fixtures
// OUTPUT: behavior coverage for weekly planning actions
// EFFECT: Verifies week-view navigation, delete confirmation, and prefilled date flows
import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, beforeEach, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import type { Task } from "../src/types";
import { WeekPage } from "../src/pages/WeekPage";
import { renderWithProviders } from "./test-utils";
import { setScreenWidth } from "./setup";

const navigateMock = vi.fn();
const calendarRenderProps: any[] = [];

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@fullcalendar/react", () => ({
  default: (props: any) => {
    calendarRenderProps.push(props);
    return (
      <div>
        <button type="button" onClick={() => props.navLinkDayClick?.(new Date("2026-04-22T00:00:00"))}>
        jump-day
        </button>
        <button type="button" onClick={() => props.dateClick?.({ dateStr: "2026-04-23T09:00:00" })}>
        blank-slot
        </button>
        {props.events.map((event: any) => (
          <button
            key={event.id}
            type="button"
            onClick={() =>
              props.eventClick({
                event: {
                  extendedProps: event.extendedProps,
                  startStr: event.start,
                },
              })
            }
          >
            {event.title}
          </button>
        ))}
      </div>
    );
  },
}));

describe("WeekPage behavior", () => {
  beforeEach(async () => {
    vi.useRealTimers();
    setScreenWidth(1024);
    navigateMock.mockReset();
    calendarRenderProps.length = 0;
    await i18n.changeLanguage("en");
  });

  it("asks for delete confirmation before removing a task", async () => {
    const user = userEvent.setup();
    const task: Task = {
      id: "t1",
      title: "Design review",
      type: "TEMPORARY",
      date: "2026-04-20",
      emergency: 3,
      createdAt: "2026-04-20T00:00:00.000Z",
      updatedAt: "2026-04-20T00:00:00.000Z",
    };
    const setTasks = vi.fn();

    renderWithProviders(<WeekPage tasks={[task]} setTasks={setTasks} completionsRev={0} />);

    await user.click(screen.getByRole("button", { name: "Design review" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByText('Delete "Design review"?')).toBeInTheDocument();
    expect(setTasks).not.toHaveBeenCalled();

    const confirmDialog = screen.getByRole("dialog", { name: "Confirm" });
    await user.click(within(confirmDialog).getByRole("button", { name: "Delete" }));

    expect(setTasks).toHaveBeenCalledWith([]);
  });

  it("jumps to Today when a week date header is clicked", async () => {
    const user = userEvent.setup();

    renderWithProviders(<WeekPage tasks={[]} setTasks={vi.fn()} completionsRev={0} />);

    await user.click(screen.getByRole("button", { name: "jump-day" }));

    expect(navigateMock).toHaveBeenCalledWith("/?date=2026-04-22");
  });

  it("uses the clicked blank week date as the default date for a new task", async () => {
    const user = userEvent.setup();
    const setTasks = vi.fn();

    renderWithProviders(<WeekPage tasks={[]} setTasks={setTasks} completionsRev={0} />);

    await user.click(screen.getByRole("button", { name: "blank-slot" }));
    await user.click(screen.getByRole("button", { name: "Add Task" }));
    await user.type(screen.getByLabelText("Task name"), "Blank slot task");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(setTasks).toHaveBeenCalledTimes(1);
    const savedTasks = setTasks.mock.calls[0][0] as Task[];
    expect(savedTasks[0].date).toBe("2026-04-23");
  });

  it("rolls mobile week view from a 3-day page into the next week's 4-day page", () => {
    setScreenWidth(390);

    renderWithProviders(<WeekPage tasks={[]} setTasks={vi.fn()} completionsRev={0} />);

    const latestCalendarProps = calendarRenderProps.slice(-3);

    expect(latestCalendarProps).toHaveLength(3);
    expect(latestCalendarProps[0].visibleRange).toMatchObject({
      start: "2026-04-20",
      end: "2026-04-24",
    });
    expect(latestCalendarProps[1].visibleRange).toMatchObject({
      start: "2026-04-24",
      end: "2026-04-27",
    });
    expect(latestCalendarProps[2].visibleRange).toMatchObject({
      start: "2026-04-27",
      end: "2026-05-01",
    });
    expect(latestCalendarProps[0].headerToolbar).toBe(false);
    expect(latestCalendarProps[1].headerToolbar).toBe(false);
    expect(latestCalendarProps[2].headerToolbar).toBe(false);
  });

  it("advances only one mobile page after a swipe settles", () => {
    vi.useFakeTimers();
    setScreenWidth(390);

    renderWithProviders(<WeekPage tasks={[]} setTasks={vi.fn()} completionsRev={0} />);
    act(() => {
      vi.advanceTimersByTime(100);
    });

    const pager = screen.getByTestId("mobile-week-pager");
    Object.defineProperty(pager, "clientWidth", {
      configurable: true,
      value: 100,
    });

    Object.defineProperty(pager, "scrollLeft", {
      configurable: true,
      writable: true,
      value: 190,
    });
    act(() => {
      fireEvent.scroll(pager, { target: { scrollLeft: 190 } });
    });
    pager.scrollLeft = 195;
    act(() => {
      fireEvent.scroll(pager, { target: { scrollLeft: 195 } });
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    const latestCalendarProps = calendarRenderProps.slice(-3);
    expect(latestCalendarProps[1].visibleRange).toMatchObject({
      start: "2026-04-27",
      end: "2026-05-01",
    });
    expect(latestCalendarProps[2].visibleRange).toMatchObject({
      start: "2026-05-01",
      end: "2026-05-04",
    });
  });
});
