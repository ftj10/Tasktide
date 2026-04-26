// INPUT: task dialog and invalid time input
// OUTPUT: behavior coverage for task validation
// EFFECT: Verifies the task editor blocks invalid timed-task saves
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, beforeEach, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import { TaskDialog } from "../src/components/TaskDialog";
import { renderWithProviders } from "./test-utils";
import { setScreenWidth } from "./setup";

describe("TaskDialog behavior", () => {
  beforeEach(async () => {
    setScreenWidth(1024);
    await i18n.changeLanguage("en");
  });

  it("blocks saving when end time is earlier than start time", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    renderWithProviders(
      <TaskDialog
        open
        mode="create"
        defaultDateYmd="2026-04-20"
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    await user.type(screen.getByLabelText("Task name"), "Late task");
    await user.type(screen.getByLabelText("Start Time (Optional)"), "1800");
    await user.type(screen.getByLabelText("End Time (Optional)"), "1700");

    expect(screen.getByText("End time must be equal to or later than start time.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("uses a full-screen dialog layout on mobile screens", () => {
    setScreenWidth(390);

    renderWithProviders(
      <TaskDialog
        open
        mode="create"
        defaultDateYmd="2026-04-20"
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByRole("dialog")).toHaveClass("MuiDialog-paperFullScreen");
  });

  it("uses a full-screen repeat dialog layout on mobile screens", async () => {
    setScreenWidth(390);
    const user = userEvent.setup();

    renderWithProviders(
      <TaskDialog
        open
        mode="create"
        defaultDateYmd="2026-04-20"
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /None \(Once\)/i }));

    expect(document.querySelectorAll(".MuiDialog-paperFullScreen")).toHaveLength(2);
  });

  it("keeps the repeat selector label fully visible in the repeat dialog", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <TaskDialog
        open
        mode="create"
        defaultDateYmd="2026-04-20"
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /None \(Once\)/i }));

    expect(screen.getAllByText("Repeat")[0]).toBeInTheDocument();
  });

  it("asks whether to update one day or the entire series when saving a repeating task edit", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    renderWithProviders(
      <TaskDialog
        open
        mode="edit"
        defaultDateYmd="2026-04-22"
        occurrenceDateYmd="2026-04-22"
        task={{
          id: "repeat-1",
          title: "Weekly review",
          type: "RECURRING",
          beginDate: "2026-04-20",
          createdAt: "2026-04-20T00:00:00.000Z",
          updatedAt: "2026-04-20T00:00:00.000Z",
          recurrence: {
            frequency: "WEEKLY",
            interval: 1,
            weekdays: [3],
            until: null,
          },
        }}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    await user.clear(screen.getByLabelText("Task name"));
    await user.type(screen.getByLabelText("Task name"), "Updated weekly review");
    await user.click(screen.getByRole("button", { name: "Done" }));
    await user.click(screen.getByRole("button", { name: "This day only" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][1]).toBe("single");
  });
});
