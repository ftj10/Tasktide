// INPUT: help page with mocked role-scoped question storage
// OUTPUT: behavior coverage for help-center interactions
// EFFECT: Verifies the help feature loads role-scoped questions and handles question submission outcomes
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import { HelpPage } from "../src/pages/HelpPage";
import { renderWithProviders } from "./test-utils";

const storageMocks = vi.hoisted(() => ({
  loadHelpQuestions: vi.fn(),
  createHelpQuestion: vi.fn(),
  deleteHelpQuestion: vi.fn(),
  isAdminUser: vi.fn(),
}));

vi.mock("../src/app/storage", async () => {
  const actual = await vi.importActual<typeof import("../src/app/storage")>("../src/app/storage");
  return {
    ...actual,
    loadHelpQuestions: storageMocks.loadHelpQuestions,
    createHelpQuestion: storageMocks.createHelpQuestion,
    deleteHelpQuestion: storageMocks.deleteHelpQuestion,
    isAdminUser: storageMocks.isAdminUser,
  };
});

describe("HelpPage behavior", () => {
  beforeEach(async () => {
    storageMocks.loadHelpQuestions.mockReset().mockResolvedValue([
      {
        id: "q1",
        username: "tom",
        question: "How do I move a task?",
        createdAt: "2026-04-20T12:00:00.000Z",
      },
    ]);
    storageMocks.createHelpQuestion.mockReset().mockResolvedValue({
      id: "q2",
      username: "tom",
      question: "Can I sort tasks by time?",
      createdAt: "2026-04-21T12:00:00.000Z",
    });
    storageMocks.deleteHelpQuestion.mockReset().mockResolvedValue(undefined);
    storageMocks.isAdminUser.mockReset().mockReturnValue(false);
    await i18n.changeLanguage("en");
  });

  it("shows the signed-in user's questions and lets the user submit a new question", async () => {
    const user = userEvent.setup();

    renderWithProviders(<HelpPage />);

    expect(screen.getByRole("button", { name: /How do I add a task\?/i })).toBeInTheDocument();
    expect(screen.getByText("Notifications stopped after a key change?")).toBeInTheDocument();
    expect(
      screen.getByText(/delete the old stored push subscriptions/i)
    ).toBeInTheDocument();
    expect(await screen.findByText("My Questions")).toBeInTheDocument();
    expect(await screen.findByText("How do I move a task?")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Your question"), "Can I sort tasks by time?");
    await user.click(screen.getByRole("button", { name: "Send Question" }));

    await waitFor(() => {
      expect(screen.getByText("Your question has been saved.")).toBeInTheDocument();
    });
    expect(screen.getByText("Can I sort tasks by time?")).toBeInTheDocument();
    expect(storageMocks.loadHelpQuestions).toHaveBeenCalledTimes(1);
  });

  it("opens a walkthrough modal when a help question is selected", async () => {
    const user = userEvent.setup();

    renderWithProviders(<HelpPage />);

    await user.click(screen.getByRole("button", { name: /How does drag to add work\?/i }));

    expect(await screen.findByRole("dialog", { name: "How does drag to add work?" })).toBeInTheDocument();
    expect(screen.getByText("Start dragging")).toBeInTheDocument();
    expect(screen.getByText("Press and hold a time slot in Week.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Release to create")).toBeInTheDocument();
    expect(screen.getByText("Let go to create the task.")).toBeInTheDocument();
  });

  it("keeps the draft when posting a question fails", async () => {
    const user = userEvent.setup();
    storageMocks.createHelpQuestion.mockRejectedValueOnce(new Error("save failed"));

    renderWithProviders(<HelpPage />);

    await screen.findByText("How do I move a task?");
    await user.type(screen.getByLabelText("Your question"), "This should stay in the box");
    await user.click(screen.getByRole("button", { name: "Send Question" }));

    await waitFor(() => {
      expect(screen.getByText("We couldn't post your question. Your draft is still here.")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Your question")).toHaveValue("This should stay in the box");
  });

  it("shows the admin-wide question board when the signed-in user is an admin", async () => {
    storageMocks.isAdminUser.mockReturnValue(true);

    renderWithProviders(<HelpPage />);

    expect(await screen.findByText("All User Questions")).toBeInTheDocument();
    expect(screen.getByText("Admin view: you can review questions from every signed-in user.")).toBeInTheDocument();
    expect(screen.getByText("How do I move a task?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("lets admins delete a help question", async () => {
    storageMocks.isAdminUser.mockReturnValue(true);
    const user = userEvent.setup();

    renderWithProviders(<HelpPage />);

    expect(await screen.findByText("How do I move a task?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));

    const confirmDialog = screen.getByRole("dialog", { name: "Confirm" });
    await user.click(within(confirmDialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(storageMocks.deleteHelpQuestion).toHaveBeenCalledWith("q1");
      expect(screen.getByText("The question has been deleted.")).toBeInTheDocument();
    });
    expect(screen.queryByText("How do I move a task?")).not.toBeInTheDocument();
  });
});
