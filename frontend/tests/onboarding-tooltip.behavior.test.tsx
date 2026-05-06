// INPUT: onboarding steps, target elements, and local storage state
// OUTPUT: behavior coverage for one-time onboarding tooltip flow
// EFFECT: Verifies onboarding can be skipped, advanced, completed, and hidden after completion
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import type { OnboardingTooltipStep } from "../src/app/helpCenter";
import { OnboardingTooltip } from "../src/components/OnboardingTooltip";
import { renderWithProviders } from "./test-utils";
import { setScreenWidth } from "./setup";

const steps: OnboardingTooltipStep[] = [
  {
    id: "first",
    targets: ["#onboarding-target"],
    title: "First step",
    text: "First text",
  },
  {
    id: "second",
    targets: ["#onboarding-target"],
    title: "Second step",
    text: "Second text",
  },
];

function renderTooltip(storageKey = "tasktide:test:onboarding") {
  return renderWithProviders(
    <>
      <button id="onboarding-target" type="button">Target</button>
      <OnboardingTooltip steps={steps} storageKey={storageKey} />
    </>
  );
}

function mockTargetRect() {
  const target = document.querySelector("#onboarding-target") as HTMLElement;
  target.scrollIntoView = vi.fn();
  target.getBoundingClientRect = vi.fn(() => ({
    x: 100,
    y: 100,
    top: 100,
    left: 100,
    right: 200,
    bottom: 140,
    width: 100,
    height: 40,
    toJSON: () => ({}),
  } as DOMRect));
}

describe("OnboardingTooltip behavior", () => {
  beforeEach(async () => {
    setScreenWidth(1024);
    localStorage.clear();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    await i18n.changeLanguage("en");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("renders nothing when localStorage has done for the storage key", () => {
    localStorage.setItem("tasktide:test:onboarding", "done");

    renderTooltip();

    expect(screen.queryByRole("dialog", { name: "Quick tour" })).not.toBeInTheDocument();
  });

  it("writes done to localStorage and hides when Skip is clicked", async () => {
    const user = userEvent.setup();

    renderTooltip();
    mockTargetRect();
    await screen.findByRole("dialog", { name: "Quick tour" });
    await user.click(screen.getByRole("button", { name: "Skip" }));

    expect(localStorage.getItem("tasktide:test:onboarding")).toBe("done");
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Quick tour" })).not.toBeInTheDocument();
    });
  });

  it("advances to the next step from Next", async () => {
    const user = userEvent.setup();

    renderTooltip();
    mockTargetRect();
    await screen.findByText("First step");
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Second step")).toBeInTheDocument();
  });

  it("completes onboarding from Done on the last step", async () => {
    const user = userEvent.setup();

    renderTooltip();
    mockTargetRect();
    await screen.findByText("First step");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(localStorage.getItem("tasktide:test:onboarding")).toBe("done");
  });

  it("shows the current step counter", async () => {
    renderTooltip();
    mockTargetRect();

    expect(await screen.findByText("1 / 2")).toBeInTheDocument();
  });
});
