// INPUT: selected help walkthrough item
// OUTPUT: behavior coverage for walkthrough modal navigation
// EFFECT: Verifies users can inspect single-step and multi-step help flows
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import type { HelpCenterItem } from "../src/app/helpCenter";
import { HelpWalkthroughModal } from "../src/components/HelpWalkthroughModal";
import { renderWithProviders } from "./test-utils";
import { setScreenWidth } from "./setup";

const singleStepItem: HelpCenterItem = {
  id: "single",
  audience: "all",
  question: "Single question",
  steps: [
    {
      mediaSrc: "/single.gif",
      mediaAlt: "Single alt",
      title: "Single title",
      text: "Single text",
    },
  ],
};

const multiStepItem: HelpCenterItem = {
  id: "multi",
  audience: "all",
  question: "Multi question",
  steps: [
    {
      mediaSrc: "/first.gif",
      mediaAlt: "First alt",
      title: "First title",
      text: "First text",
    },
    {
      mediaSrc: "/second.gif",
      mediaAlt: "Second alt",
      title: "Second title",
      text: "Second text",
    },
  ],
};

describe("HelpWalkthroughModal behavior", () => {
  beforeEach(async () => {
    setScreenWidth(1024);
    await i18n.changeLanguage("en");
  });

  it("renders null when item is null", () => {
    renderWithProviders(<HelpWalkthroughModal open item={null} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows a single step and closes from Done", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<HelpWalkthroughModal open item={singleStepItem} onClose={onClose} />);
    expect(screen.getByText("Single title")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("advances from the first step and shows the step counter", async () => {
    const user = userEvent.setup();

    renderWithProviders(<HelpWalkthroughModal open item={multiStepItem} onClose={vi.fn()} />);
    expect(screen.getByText("Step 1 / 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Second title")).toBeInTheDocument();
    expect(screen.getByText("Step 2 / 2")).toBeInTheDocument();
  });

  it("goes back from the last step and closes from Done", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<HelpWalkthroughModal open item={multiStepItem} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("First title")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
