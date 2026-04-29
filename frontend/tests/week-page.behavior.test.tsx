// INPUT: week page, mocked calendar interactions, and task fixtures
// OUTPUT: behavior coverage for weekly planning actions
// EFFECT: Verifies week-view navigation, delete confirmation, and prefilled date flows
import dayjs from "dayjs";
import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, beforeEach, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import { tasksForDate } from "../src/app/taskLogic";
import { weekdayISO, weekStartMonday } from "../src/app/date";
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
        {props.selectable ? (
          <button
            type="button"
            onClick={() =>
              props.select?.({
                startStr: "2026-04-24T09:30:00",
                endStr: "2026-04-24T11:00:00",
                allDay: false,
                view: {
                  calendar: {
                    unselect: () => {},
                  },
                },
              })
            }
          >
            select-range
          </button>
        ) : null}
        {props.selectable ? (
          <button
            type="button"
            onClick={() =>
              props.select?.({
                startStr: "2026-04-24T23:30:00",
                endStr: "2026-04-25T01:00:00",
                allDay: false,
                view: {
                  calendar: {
                    unselect: () => {},
                  },
                },
              })
            }
          >
            select-range-cross-day
          </button>
        ) : null}
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
      date: dayjs().format("YYYY-MM-DD"),
      emergency: 3,
      createdAt: "2026-04-20T00:00:00.000Z",
      updatedAt: "2026-04-20T00:00:00.000Z",
    };
    const setTasks = vi.fn();

    renderWithProviders(<WeekPage tasks={[task]} setTasks={setTasks} />);

    await user.click(screen.getByRole("button", { name: "Design review" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByText('Delete "Design review"?')).toBeInTheDocument();
    expect(setTasks).not.toHaveBeenCalled();

    const confirmDialog = screen.getByRole("dialog", { name: "Confirm" });
    await user.click(within(confirmDialog).getByRole("button", { name: "Delete" }));

    expect(setTasks).toHaveBeenCalledWith([]);
  });

  it("lets recurring task deletion target only one week occurrence", async () => {
    const user = userEvent.setup();
    const recurringTask: Task = {
      id: "repeat-week-delete",
      title: "Weekly review",
      type: "RECURRING",
      beginDate: "2026-04-20",
      emergency: 3,
      createdAt: "2026-04-20T00:00:00.000Z",
      updatedAt: "2026-04-20T00:00:00.000Z",
      recurrence: {
        frequency: "WEEKLY",
        interval: 1,
        weekdays: [3],
        until: null,
      },
    };
    const setTasks = vi.fn();

    renderWithProviders(<WeekPage tasks={[recurringTask]} setTasks={setTasks} />);

    await user.click(screen.getByRole("button", { name: "Weekly review" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "This day only" }));

    const confirmDialog = screen.getByRole("dialog", { name: "Confirm" });
    await user.click(within(confirmDialog).getByRole("button", { name: "Delete" }));

    expect(setTasks).toHaveBeenCalledTimes(1);
    const nextTasks = setTasks.mock.calls[0][0] as Task[];
    const deletedDate = Object.keys(nextTasks[0].occurrenceOverrides ?? {})[0];
    expect(deletedDate).toBeTruthy();
    expect(tasksForDate(nextTasks, deletedDate)).toEqual([]);
    expect(tasksForDate(nextTasks, dayjs(deletedDate).add(7, "day").format("YYYY-MM-DD"))).toHaveLength(1);
    expect(nextTasks[0].occurrenceOverrides?.[deletedDate]?.deleted).toBe(true);
  });

  it("jumps to Today when a week date header is clicked", async () => {
    const user = userEvent.setup();

    renderWithProviders(<WeekPage tasks={[]} setTasks={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "jump-day" }));

    expect(navigateMock).toHaveBeenCalledWith("/?date=2026-04-22");
  });

  it("opens the help walkthrough from the week header", async () => {
    const user = userEvent.setup();

    renderWithProviders(<WeekPage tasks={[]} setTasks={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Help Center" }));

    expect(navigateMock).toHaveBeenCalledWith("/help?topic=drag-to-add");
  });

  it("uses the clicked blank week date as the default date for a new task", async () => {
    const user = userEvent.setup();
    const setTasks = vi.fn();

    renderWithProviders(<WeekPage tasks={[]} setTasks={setTasks} />);

    await user.click(screen.getByRole("button", { name: "blank-slot" }));
    await user.click(screen.getByRole("button", { name: "Add Task" }));
    await user.type(screen.getByLabelText("Task name"), "Blank slot task");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(setTasks).toHaveBeenCalledTimes(1);
    const savedTasks = setTasks.mock.calls[0][0] as Task[];
    expect(savedTasks[0].date).toBe("2026-04-23");
  });

  it("uses time grid as the default week view on desktop and mobile", () => {
    renderWithProviders(<WeekPage tasks={[]} setTasks={vi.fn()} />);

    const latestDesktopCalendar = calendarRenderProps.at(-1);
    expect(latestDesktopCalendar.initialView).toBe("timeGridWeek");

    calendarRenderProps.length = 0;
    setScreenWidth(390);
    renderWithProviders(<WeekPage tasks={[]} setTasks={vi.fn()} />);

    const latestMobileCalendars = calendarRenderProps.slice(-3);
    expect(latestMobileCalendars[0].initialView).toBe("mobileTimeGrid");
  });

  it("renders one-time multi-day all-day tasks across the whole date range in week view", () => {
    renderWithProviders(
      <WeekPage
        tasks={[
          {
            id: "range-1",
            title: "Conference",
            type: "ONCE",
            beginDate: "2026-04-28",
            endDate: "2026-04-30",
            date: "2026-04-28",
            createdAt: "2026-04-28T00:00:00.000Z",
            updatedAt: "2026-04-28T00:00:00.000Z",
          },
        ]}
        setTasks={vi.fn()}
      />
    );

    const latestDesktopCalendar = calendarRenderProps.at(-1);
    const renderedEvent = latestDesktopCalendar.events.find((event: any) => event.id === "range-1");

    expect(renderedEvent).toMatchObject({
      start: "2026-04-28",
      end: "2026-05-01",
      allDay: true,
    });
  });

  it("rolls mobile week view from a 3-day page into the next week's 4-day page", () => {
    setScreenWidth(390);

    renderWithProviders(<WeekPage tasks={[]} setTasks={vi.fn()} />);

    const latestCalendarProps = calendarRenderProps.slice(-3);
    const pageLengths = latestCalendarProps.map((item) =>
      dayjs(item.visibleRange.end).diff(dayjs(item.visibleRange.start), "day")
    );

    expect(latestCalendarProps).toHaveLength(3);
    expect(pageLengths.filter((length) => length === 3).length).toBeGreaterThanOrEqual(1);
    expect(pageLengths.filter((length) => length === 4).length).toBeGreaterThanOrEqual(1);
    expect(latestCalendarProps[0].visibleRange.end).toBe(latestCalendarProps[1].visibleRange.start);
    expect(latestCalendarProps[1].visibleRange.end).toBe(latestCalendarProps[2].visibleRange.start);
    expect(latestCalendarProps[0].headerToolbar).toBe(false);
    expect(latestCalendarProps[1].headerToolbar).toBe(false);
    expect(latestCalendarProps[2].headerToolbar).toBe(false);
  });

  it("advances only one mobile page after a swipe settles", () => {
    vi.useFakeTimers();
    setScreenWidth(390);

    renderWithProviders(<WeekPage tasks={[]} setTasks={vi.fn()} />);
    const initialCalendarProps = calendarRenderProps.slice(-3);
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
    expect(latestCalendarProps[1].visibleRange).toMatchObject(initialCalendarProps[2].visibleRange);
  });

  it("replaces the mobile add button with time-range creation in the time grid", async () => {
    setScreenWidth(390);
    const user = userEvent.setup();

    renderWithProviders(<WeekPage tasks={[]} setTasks={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Add Task" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Time Grid" }));
    await user.click(screen.getAllByRole("button", { name: "select-range" })[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Begin date")).toHaveValue("2026-04-24");
    expect(screen.getByLabelText("End date")).toHaveValue("2026-04-24");
    expect(screen.getByLabelText("Start Time (Optional)")).toHaveValue("09:30");
    expect(screen.getByLabelText("End Time (Optional)")).toHaveValue("11:00");
  });

  it("prefills and saves the end date when a mobile week selection crosses into the next day", async () => {
    setScreenWidth(390);
    const user = userEvent.setup();
    const setTasks = vi.fn();

    renderWithProviders(<WeekPage tasks={[]} setTasks={setTasks} />);

    await user.click(screen.getByRole("button", { name: "Time Grid" }));
    await user.click(screen.getAllByRole("button", { name: "select-range-cross-day" })[0]);

    expect(screen.getByLabelText("Begin date")).toHaveValue("2026-04-24");
    expect(screen.getByLabelText("End date")).toHaveValue("2026-04-25");
    expect(screen.getByLabelText("Start Time (Optional)")).toHaveValue("23:30");
    expect(screen.getByLabelText("End Time (Optional)")).toHaveValue("01:00");

    await user.type(screen.getByLabelText("Task name"), "Overnight work");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(setTasks).toHaveBeenCalledTimes(1);
    const savedTasks = setTasks.mock.calls[0][0] as Task[];
    expect(savedTasks[0]).toMatchObject({
      title: "Overnight work",
      beginDate: "2026-04-24",
      endDate: "2026-04-25",
      startTime: "23:30",
      endTime: "01:00",
    });
  });

  it("uses the occurrence override time for recurring events in the calendar", () => {
    const occurrenceStart = dayjs(weekStartMonday(dayjs())).add(1, "day");
    const occurrenceDate = occurrenceStart.format("YYYY-MM-DD");
    const recurringTask: Task = {
      id: "recurring-1",
      title: "Team sync",
      type: "RECURRING",
      beginDate: occurrenceDate,
      recurrence: {
        frequency: "WEEKLY",
        interval: 1,
        weekdays: [weekdayISO(occurrenceStart)],
        until: null,
      },
      occurrenceOverrides: {
        [occurrenceDate]: {
          title: "Team sync - moved",
          startTime: "14:30",
          endTime: "15:15",
        },
      },
      createdAt: "2026-04-20T00:00:00.000Z",
      updatedAt: "2026-04-20T00:00:00.000Z",
    };

    renderWithProviders(<WeekPage tasks={[recurringTask]} setTasks={vi.fn()} />);

    const latestDesktopCalendar = calendarRenderProps.at(-1);
    const event = latestDesktopCalendar.events.find((item: any) => item.id === `recurring-1::${occurrenceDate}`);

    expect(event.title).toBe("Team sync - moved");
    expect(event.start).toBe(`${occurrenceDate}T14:30:00`);
    expect(event.end).toBe(`${occurrenceDate}T15:15:00`);
  });
});
