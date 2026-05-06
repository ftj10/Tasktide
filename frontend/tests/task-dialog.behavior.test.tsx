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

  it("blocks saving when end date is earlier than begin date", async () => {
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

    await user.type(screen.getByLabelText("Task name"), "Trip");
    await user.clear(screen.getByLabelText("End date"));
    await user.type(screen.getByLabelText("End date"), "2026-04-19");

    expect(screen.getByText("End date must be the same as or later than begin date.")).toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: "Save" }));
    await user.click(screen.getByRole("button", { name: "This day only" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][1]).toBe("single");
  });

  it("asks whether to delete one day or the entire series when deleting a repeating task edit", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    renderWithProviders(
      <TaskDialog
        open
        mode="edit"
        defaultDateYmd="2026-04-22"
        occurrenceDateYmd="2026-04-22"
        task={{
          id: "repeat-delete-1",
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
        onSave={vi.fn()}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "This day only" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("repeat-delete-1", "single");
  });

  it("generates a fresh task id on each open so consecutive creates do not share the same id", async () => {
    const user = userEvent.setup();
    const savedTasks: { id: string }[] = [];

    const { rerender } = renderWithProviders(
      <TaskDialog
        open
        mode="create"
        defaultDateYmd="2026-05-05"
        onClose={vi.fn()}
        onSave={(task) => savedTasks.push({ id: task.id })}
      />
    );

    await user.type(screen.getByLabelText("Task name"), "First task");
    await user.click(screen.getByRole("button", { name: "Add" }));

    rerender(
      <TaskDialog
        open={false}
        mode="create"
        defaultDateYmd="2026-05-05"
        onClose={vi.fn()}
        onSave={(task) => savedTasks.push({ id: task.id })}
      />
    );

    rerender(
      <TaskDialog
        open
        mode="create"
        defaultDateYmd="2026-05-05"
        onClose={vi.fn()}
        onSave={(task) => savedTasks.push({ id: task.id })}
      />
    );

    await user.type(screen.getByLabelText("Task name"), "Second task");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(savedTasks).toHaveLength(2);
    expect(savedTasks[0].id).not.toBe(savedTasks[1].id);
  });
});
