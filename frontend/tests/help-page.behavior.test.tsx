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
const pushMocks = vi.hoisted(() => ({
  supportsPushNotifications: vi.fn(),
  enablePushNotifications: vi.fn(),
  syncPushSubscription: vi.fn(),
  disablePushNotifications: vi.fn(),
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

vi.mock("../src/app/pushNotifications", () => ({
  supportsPushNotifications: pushMocks.supportsPushNotifications,
  enablePushNotifications: pushMocks.enablePushNotifications,
  syncPushSubscription: pushMocks.syncPushSubscription,
  disablePushNotifications: pushMocks.disablePushNotifications,
}));

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
    pushMocks.supportsPushNotifications.mockReset().mockReturnValue(true);
    pushMocks.enablePushNotifications.mockReset().mockResolvedValue(true);
    pushMocks.syncPushSubscription.mockReset().mockResolvedValue(undefined);
    pushMocks.disablePushNotifications.mockReset().mockResolvedValue(undefined);
    vi.stubGlobal("Notification", {
      permission: "default",
    });
    setScreenWidth(1024);
    await i18n.changeLanguage("en");
  });

  it("shows the signed-in user's questions and lets the user submit a new question", async () => {
    const user = userEvent.setup();

    renderWithProviders(<HelpPage />);

    expect(screen.getByRole("button", { name: /Add a task from Today on desktop/i })).toBeInTheDocument();
    expect(screen.getByText("TaskTide is for planning a week of work from start to finish. Create a clean account, add what you need to do, arrange it by day or time, then mark work complete as your week moves forward.")).toBeInTheDocument();
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
    expect(screen.getByText(/Click any empty time slot on the day you want/i)).toBeInTheDocument();
    fireEvent.error(screen.getByRole("img", { name: "how to quickly add task in weekpage browser.gif" }));
    expect(screen.getByText("GIF placeholder")).toBeInTheDocument();
    expect(screen.getByText("/help-walkthroughs/how to quickly add task in weekpage browser.gif")).toBeInTheDocument();
  });

  it("shows the updated mobile notification and install guidance in the FAQ", async () => {
    renderWithProviders(<HelpPage />);

    expect(await screen.findByText("How do I get Task Notifications on phone and computer?")).toBeInTheDocument();
    expect(screen.getByText("Can I use tasks offline in the installed web app?")).toBeInTheDocument();
    expect(screen.getByText("Why do I see an offline page message?")).toBeInTheDocument();
    expect(screen.getByText(/add tasks, edit tasks, mark tasks done, and delete tasks while offline/i)).toBeInTheDocument();
    expect(screen.getByText(/shows a message instead of a blank screen/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. Open Help\./i)).toBeInTheDocument();
    expect(screen.getByText(/Settings > Notifications > TaskTide/i)).toBeInTheDocument();
    expect(screen.getByText(/Settings > Apps > TaskTide or your browser > Notifications/i)).toBeInTheDocument();
    expect(screen.queryByText(/How do I install the mobile web app\?/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Do installed mobile web apps work the same on every browser\?/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/How does the layout change on mobile devices\?/i)).not.toBeInTheDocument();
  });

  it("requests Task Notifications permission only after enable is confirmed", async () => {
    const user = userEvent.setup();

    renderWithProviders(<HelpPage />);

    expect(await screen.findByText("Task Notifications")).toBeInTheDocument();
    expect(pushMocks.enablePushNotifications).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Enable Task Notifications" }));
    expect(screen.getByText("Enable notifications to receive task alerts, upcoming task start reminders, and daily task check-ins.")).toBeInTheDocument();
    expect(pushMocks.enablePushNotifications).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog", { name: "Enable Task Notifications?" });
    await user.click(within(dialog).getByRole("button", { name: "Enable Task Notifications" }));

    await waitFor(() => {
      expect(pushMocks.enablePushNotifications).toHaveBeenCalledWith("en");
      expect(screen.getByText("Task Notifications are enabled for this browser or device.")).toBeInTheDocument();
    });
  });

  it("syncs Task Notifications without prompting when permission is already granted", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("Notification", {
      permission: "granted",
    });

    renderWithProviders(<HelpPage />);

    await user.click(await screen.findByRole("button", { name: "Enable Task Notifications" }));
    const dialog = screen.getByRole("dialog", { name: "Enable Task Notifications?" });
    await user.click(within(dialog).getByRole("button", { name: "Enable Task Notifications" }));

    await waitFor(() => {
      expect(pushMocks.syncPushSubscription).toHaveBeenCalledWith("en");
      expect(pushMocks.enablePushNotifications).not.toHaveBeenCalled();
    });
  });

  it("does not repeatedly prompt when Task Notifications are denied", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("Notification", {
      permission: "denied",
    });

    renderWithProviders(<HelpPage />);

    await user.click(await screen.findByRole("button", { name: "Enable Task Notifications" }));
    await user.click(screen.getByRole("button", { name: "Enable Task Notifications" }));

    expect(pushMocks.enablePushNotifications).not.toHaveBeenCalled();
    expect(pushMocks.syncPushSubscription).not.toHaveBeenCalled();
    expect(screen.getByText("Task Notifications are blocked. Re-enable them from your browser or site notification settings, then try again.")).toBeInTheDocument();
  });

  it("shows unsupported-browser guidance for Task Notifications", async () => {
    const user = userEvent.setup();
    pushMocks.supportsPushNotifications.mockReturnValue(false);

    renderWithProviders(<HelpPage />);

    await user.click(await screen.findByRole("button", { name: "Enable Task Notifications" }));

    expect(pushMocks.enablePushNotifications).not.toHaveBeenCalled();
    expect(screen.getByText("This browser does not support Task Notifications through web push.")).toBeInTheDocument();
  });

  it("disables Task Notifications for the current browser or device", async () => {
    const user = userEvent.setup();

    renderWithProviders(<HelpPage />);

    await user.click(await screen.findByRole("button", { name: "Disable Task Notifications" }));

    await waitFor(() => {
      expect(pushMocks.disablePushNotifications).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Task Notifications are disabled for this browser or device.")).toBeInTheDocument();
    });
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
