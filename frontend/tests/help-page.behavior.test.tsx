// INPUT: help page with mocked shared-question storage
// OUTPUT: behavior coverage for help-center interactions
// EFFECT: Verifies the help feature loads shared questions and submits a new public question
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import { HelpPage } from "../src/pages/HelpPage";
import { renderWithProviders } from "./test-utils";

vi.mock("../src/app/storage", async () => {
  const actual = await vi.importActual<typeof import("../src/app/storage")>("../src/app/storage");
  return {
    ...actual,
    loadHelpQuestions: vi.fn().mockResolvedValue([
      {
        id: "q1",
        username: "alice",
        question: "How do I move a task?",
        createdAt: "2026-04-20T12:00:00.000Z",
      },
    ]),
    createHelpQuestion: vi.fn().mockResolvedValue(undefined),
  };
});

describe("HelpPage behavior", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("shows shared questions and lets the user submit a new question", async () => {
    const user = userEvent.setup();

    renderWithProviders(<HelpPage />);

    expect(await screen.findByText("How do I move a task?")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Your question"), "Can I sort tasks by time?");
    await user.click(screen.getByRole("button", { name: "Send Question" }));

    await waitFor(() => {
      expect(screen.getByText("Your question is now visible to everyone.")).toBeInTheDocument();
    });
  });
});
