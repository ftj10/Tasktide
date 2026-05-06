// INPUT: delete-confirmation dialog props and optional syllabus delete callback
// OUTPUT: behavior coverage for destructive task confirmation options
// EFFECT: Verifies users can cancel, delete one task, or delete a syllabus batch when available
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import { ConfirmDeleteDialog } from "../src/components/ConfirmDeleteDialog";
import { renderWithProviders } from "./test-utils";
import { setScreenWidth } from "./setup";

describe("ConfirmDeleteDialog behavior", () => {
  beforeEach(async () => {
    setScreenWidth(1024);
    await i18n.changeLanguage("en");
  });

  it("renders the delete message with the task title", () => {
    renderWithProviders(<ConfirmDeleteDialog open title="Old task" onCancel={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByText('Delete "Old task"?')).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    renderWithProviders(<ConfirmDeleteDialog open title="Old task" onCancel={onCancel} onConfirm={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when Delete is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    renderWithProviders(<ConfirmDeleteDialog open title="Old task" onCancel={vi.fn()} onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows and calls the syllabus delete action when provided", async () => {
    const user = userEvent.setup();
    const onDeleteSyllabus = vi.fn();

    renderWithProviders(
      <ConfirmDeleteDialog
        open
        title="Syllabus task"
        syllabusTaskCount={3}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        onDeleteSyllabus={onDeleteSyllabus}
      />
    );
    await user.click(screen.getByRole("button", { name: /dialog\.deleteSyllabusAction/i }));

    expect(onDeleteSyllabus).toHaveBeenCalledTimes(1);
  });

  it("hides the syllabus delete action when no callback is provided", () => {
    renderWithProviders(<ConfirmDeleteDialog open title="Old task" onCancel={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.queryByRole("button", { name: /dialog\.deleteSyllabusAction/i })).not.toBeInTheDocument();
  });
});
