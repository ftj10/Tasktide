// INPUT: SyllabusImportDialog auto import path
// OUTPUT: clarification questions when ambiguity detection finds them
// EFFECT: Mocks API calls and verifies the clarify step renders
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../i18n";
import { SyllabusImportDialog } from "./SyllabusImportDialog";
import { renderWithProviders } from "../../tests/test-utils";

vi.mock("../app/syllabusExtraction", () => ({
  extract: vi.fn().mockResolvedValue("extracted pdf text"),
}));

const noop = () => {};

function renderSyllabusImportDialog() {
  return renderWithProviders(
    <SyllabusImportDialog
      open
      onClose={noop}
      onImportSuccess={noop}
      showToast={noop}
    />
  );
}

describe("SyllabusImportDialog ambiguity clarification", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows ambiguity questions before auto draft generation", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ questions: ["What is the midterm date?"] }),
    } as Response);

    renderSyllabusImportDialog();
    await user.type(
      screen.getByLabelText(/paste syllabus text/i),
      "CSCI 101 syllabus"
    );
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await waitFor(() =>
      screen.getByRole("button", { name: /analyze with claude/i })
    );
    await user.click(
      screen.getByRole("button", { name: /analyze with claude/i })
    );
    await waitFor(() =>
      screen.getByRole("button", { name: /send to claude/i })
    );
    await user.click(screen.getByRole("button", { name: /send to claude/i }));

    await waitFor(() =>
      expect(screen.getByText("What is the midterm date?")).toBeInTheDocument()
    );
  });
});
