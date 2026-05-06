// INPUT: all-done confirmation dialog props
// OUTPUT: behavior coverage for bulk completion confirmation
// EFFECT: Verifies users can cancel or confirm marking all visible tasks done
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import { ConfirmAllDoneDialog } from "../src/components/ConfirmAllDoneDialog";
import { renderWithProviders } from "./test-utils";
import { setScreenWidth } from "./setup";

describe("ConfirmAllDoneDialog behavior", () => {
  beforeEach(async () => {
    setScreenWidth(1024);
    await i18n.changeLanguage("en");
  });

  it("renders the dialog message", () => {
    renderWithProviders(<ConfirmAllDoneDialog open onCancel={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByText("Mark all tasks for this day as done?")).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    renderWithProviders(<ConfirmAllDoneDialog open onCancel={onCancel} onConfirm={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when All done is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    renderWithProviders(<ConfirmAllDoneDialog open onCancel={vi.fn()} onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "All done" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
