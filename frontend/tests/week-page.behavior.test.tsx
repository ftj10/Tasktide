// INPUT: week page, mocked calendar interactions, and task fixtures
// OUTPUT: behavior coverage for weekly planning actions
// EFFECT: Verifies week-view navigation, delete confirmation, and prefilled date flows
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, beforeEach, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import type { Task } from "../src/types";
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

vi.mock("@fullcalendar/react", () => ({
  default: (props: any) => (
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
  ),
}));

describe("WeekPage behavior", () => {
  beforeEach(async () => {
    navigateMock.mockReset();
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
});
