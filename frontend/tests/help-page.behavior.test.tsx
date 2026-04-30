// INPUT: help page with mocked role-scoped question storage
// OUTPUT: behavior coverage for help-center interactions
// EFFECT: Verifies the help feature loads role-scoped questions and handles question submission outcomes
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import { HelpPage } from "../src/pages/HelpPage";
import { renderWithProviders } from "./test-utils";
import { setScreenWidth } from "./setup";

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
    setScreenWidth(1024);
    await i18n.changeLanguage("en");
  });

  it("shows the signed-in user's questions and lets the user submit a new question", async () => {
    const user = userEvent.setup();

    renderWithProviders(<HelpPage />);

    expect(screen.getByRole("button", { name: /Add a task from Today on desktop/i })).toBeInTheDocument();
    expect(screen.getByText("Use the language button on the login page or inside TaskTide if you want English or Chinese.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add a task in Week on mobile/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Notifications stopped after a key change?")).not.toBeInTheDocument();
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

    await user.click(screen.getByRole("button", { name: /Quick-add a task in Week on desktop/i }));

    expect(await screen.findByRole("dialog", { name: "Quick-add a task in Week on desktop" })).toBeInTheDocument();
    expect(screen.getByText("how to quickly add task in weekpage browser.gif")).toBeInTheDocument();
    expect(screen.getByText("This GIF shows choosing a time in Week and creating a task faster.")).toBeInTheDocument();
    fireEvent.error(screen.getByRole("img", { name: "how to quickly add task in weekpage browser.gif" }));
    expect(screen.getByText("GIF placeholder")).toBeInTheDocument();
    expect(screen.getByText("/help-walkthroughs/how to quickly add task in weekpage browser.gif")).toBeInTheDocument();
  });

  it("shows the updated mobile notification and install guidance in the FAQ", async () => {
    renderWithProviders(<HelpPage />);

    expect(await screen.findByText("How do I get notifications on phone and computer?")).toBeInTheDocument();
    expect(screen.getByText(/1\. Open TaskTide\./i)).toBeInTheDocument();
    expect(screen.getByText(/Settings > Notifications > TaskTide/i)).toBeInTheDocument();
    expect(screen.getByText(/Settings > Apps > TaskTide or your browser > Notifications/i)).toBeInTheDocument();
    expect(screen.queryByText(/How do I install the mobile web app\?/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Do installed mobile web apps work the same on every browser\?/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/How does the layout change on mobile devices\?/i)).not.toBeInTheDocument();
  });

  it("shows mobile-only help items on mobile and hides desktop-only ones", async () => {
    setScreenWidth(390);

    renderWithProviders(<HelpPage />);

    expect(await screen.findByRole("button", { name: /Add a task in Week on mobile/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add a task from Today on desktop/i })).not.toBeInTheDocument();
    expect(screen.getByText(/How does the layout change on mobile devices\?/i)).toBeInTheDocument();
    expect(screen.queryByText(/Do browser reminder notifications keep growing in storage\?/i)).not.toBeInTheDocument();
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
