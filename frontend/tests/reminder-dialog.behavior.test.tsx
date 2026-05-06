// INPUT: reminder dialog mode and optional existing reminder
// OUTPUT: behavior coverage for reminder creation and editing
// EFFECT: Verifies reminder saves validate titles and preserve existing record metadata
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import { ReminderDialog } from "../src/components/ReminderDialog";
import type { Reminder } from "../src/types";
import { renderWithProviders } from "./test-utils";
import { setScreenWidth } from "./setup";

const reminder: Reminder = {
  id: "reminder-1",
  title: "Existing reminder",
  content: "Existing notes",
  emergency: 2,
  done: true,
  createdAt: "2026-05-01T08:00:00.000Z",
  updatedAt: "2026-05-02T09:00:00.000Z",
};

describe("ReminderDialog behavior", () => {
  beforeEach(async () => {
    setScreenWidth(1024);
    await i18n.changeLanguage("en");
  });

  it("starts create mode with empty fields and Save disabled when title is blank", () => {
    renderWithProviders(<ReminderDialog open mode="create" onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByLabelText("Notes (Optional)")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("enables Save after a title and saves a new reminder", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    vi.spyOn(crypto, "randomUUID").mockReturnValue("uuid-1");

    renderWithProviders(<ReminderDialog open mode="create" onClose={vi.fn()} onSave={onSave} />);
    await user.type(screen.getByLabelText("Title"), "New reminder");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      id: "uuid-1",
      title: "New reminder",
      content: "",
      emergency: 5,
      done: false,
    }));
  });

  it("prefills fields in edit mode", () => {
    renderWithProviders(<ReminderDialog open mode="edit" reminder={reminder} onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByLabelText("Title")).toHaveValue("Existing reminder");
    expect(screen.getByLabelText("Notes (Optional)")).toHaveValue("Existing notes");
  });

  it("preserves original id, createdAt, and done when saving edits", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    renderWithProviders(<ReminderDialog open mode="edit" reminder={reminder} onClose={vi.fn()} onSave={onSave} />);
    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Updated reminder");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      id: "reminder-1",
      title: "Updated reminder",
      createdAt: "2026-05-01T08:00:00.000Z",
      done: true,
    }));
  });

  it("calls onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<ReminderDialog open mode="create" onClose={onClose} onSave={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
