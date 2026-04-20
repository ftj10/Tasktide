import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, beforeEach, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import type { Reminder } from "../src/types";
import { ReminderPage } from "../src/pages/ReminderPage";
import { renderWithProviders } from "./test-utils";

describe("ReminderPage behavior", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("marks a reminder as done through the action button", async () => {
    const user = userEvent.setup();
    const reminders: Reminder[] = [
      {
        id: "r1",
        title: "Buy milk",
        content: "",
        emergency: 2,
        done: false,
        createdAt: "2026-04-20T00:00:00.000Z",
        updatedAt: "2026-04-20T00:00:00.000Z",
      },
    ];
    const setReminders = vi.fn();

    renderWithProviders(<ReminderPage reminders={reminders} setReminders={setReminders} />);

    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(setReminders).toHaveBeenCalledTimes(1);
    const nextReminders = setReminders.mock.calls[0][0] as Reminder[];
    expect(nextReminders[0].done).toBe(true);
  });
});
