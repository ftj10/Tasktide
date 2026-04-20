import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, beforeEach, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import type { Task } from "../src/types";
import { WeekPage } from "../src/pages/WeekPage";
import { renderWithProviders } from "./test-utils";

vi.mock("@fullcalendar/react", () => ({
  default: (props: any) => (
    <div>
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
});
