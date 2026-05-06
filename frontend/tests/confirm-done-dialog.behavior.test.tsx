// INPUT: done-confirmation dialog props and viewport width
// OUTPUT: behavior coverage for task completion confirmation
// EFFECT: Verifies users can cancel, confirm, and receive a mobile fullscreen dialog
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import { ConfirmDoneDialog } from "../src/components/ConfirmDoneDialog";
import { renderWithProviders } from "./test-utils";
import { setScreenWidth } from "./setup";

describe("ConfirmDoneDialog behavior", () => {
  beforeEach(async () => {
    setScreenWidth(1024);
    await i18n.changeLanguage("en");
  });

  it("renders the task title in the confirmation message", () => {
    renderWithProviders(<ConfirmDoneDialog open title="Read chapter 4" onCancel={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByText('Mark "Read chapter 4" as done?')).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    renderWithProviders(<ConfirmDoneDialog open title="Read chapter 4" onCancel={onCancel} onConfirm={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when Done is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    renderWithProviders(<ConfirmDoneDialog open title="Read chapter 4" onCancel={vi.fn()} onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("uses a fullscreen dialog on mobile", () => {
    setScreenWidth(390);

    renderWithProviders(<ConfirmDoneDialog open title="Read chapter 4" onCancel={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByRole("dialog")).toHaveClass("MuiDialog-paperFullScreen");
  });
});
