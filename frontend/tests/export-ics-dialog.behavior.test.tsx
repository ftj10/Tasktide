// INPUT: export dialog tasks and date range selections
// OUTPUT: behavior coverage for ICS export filtering and download trigger
// EFFECT: Verifies users can choose export scope and invalid ranges block downloads
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import { ExportIcsDialog } from "../src/components/ExportIcsDialog";
import type { Task } from "../src/types";
import { renderWithProviders } from "./test-utils";
import { setScreenWidth } from "./setup";

const tasks: Task[] = [
  {
    id: "task-1",
    title: "Export me",
    type: "ONCE",
    date: "2026-05-05",
    beginDate: "2026-05-05",
    recurrence: { frequency: "NONE" },
    emergency: 5,
    completedAt: null,
    createdAt: "2026-05-05T08:00:00.000Z",
    updatedAt: "2026-05-05T08:00:00.000Z",
  },
];

describe("ExportIcsDialog behavior", () => {
  beforeEach(async () => {
    setScreenWidth(1024);
    await i18n.changeLanguage("en");
  });

  it("renders with Export All selected by default", () => {
    renderWithProviders(<ExportIcsDialog open tasks={tasks} onClose={vi.fn()} />);

    expect(screen.getByRole("radio", { name: "All tasks" })).toBeChecked();
  });

  it("reveals date inputs when switching to date range", async () => {
    const user = userEvent.setup();

    renderWithProviders(<ExportIcsDialog open tasks={tasks} onClose={vi.fn()} />);
    await user.click(screen.getByRole("radio", { name: "Tasks in date range" }));

    expect(screen.getByLabelText("Start date")).toBeInTheDocument();
    expect(screen.getByLabelText("End date")).toBeInTheDocument();
  });

  it("disables Export and shows an error for an invalid date range", async () => {
    const user = userEvent.setup();

    renderWithProviders(<ExportIcsDialog open tasks={tasks} onClose={vi.fn()} />);
    await user.click(screen.getByRole("radio", { name: "Tasks in date range" }));
    await user.clear(screen.getByLabelText("Start date"));
    await user.type(screen.getByLabelText("Start date"), "2026-06-01");
    await user.clear(screen.getByLabelText("End date"));
    await user.type(screen.getByLabelText("End date"), "2026-05-01");

    expect(screen.getByText("Start date must be on or before end date.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download .ics" })).toBeDisabled();
  });

  it("enables Export for a valid date range", async () => {
    const user = userEvent.setup();

    renderWithProviders(<ExportIcsDialog open tasks={tasks} onClose={vi.fn()} />);
    await user.click(screen.getByRole("radio", { name: "Tasks in date range" }));
    await user.clear(screen.getByLabelText("Start date"));
    await user.type(screen.getByLabelText("Start date"), "2026-05-01");
    await user.clear(screen.getByLabelText("End date"));
    await user.type(screen.getByLabelText("End date"), "2026-06-01");

    expect(screen.getByRole("button", { name: "Download .ics" })).toBeEnabled();
  });

  it("creates an anchor download and closes when exporting all tasks", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const anchorClick = vi.fn();
    const createObjectURL = vi.fn(() => "blob:tasktide");
    const revokeObjectURL = vi.fn();
    const originalCreateElement = document.createElement.bind(document);

    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName.toLowerCase() === "a") {
        element.click = anchorClick;
      }
      return element;
    });

    renderWithProviders(<ExportIcsDialog open tasks={tasks} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Download .ics" }));

    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:tasktide");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
