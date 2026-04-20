import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, beforeEach, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import { TaskDialog } from "../src/components/TaskDialog";
import { renderWithProviders } from "./test-utils";

describe("TaskDialog behavior", () => {
  beforeEach(async () => {
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
});
