// INPUT: SyllabusImportDialog rendered in test providers
// OUTPUT: behavior coverage for the full wizard — upload → method select → manual/auto paths → review
// EFFECT: mocks fetch and extract to simulate API responses; mocks clipboard API
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import { SyllabusImportDialog } from "../src/pages/SyllabusImportDialog";
import { renderWithProviders } from "./test-utils";

vi.mock("../src/app/syllabusExtraction", () => ({
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

async function goToConsent(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /^next$/i }));
  await waitFor(() =>
    screen.getByRole("button", { name: /analyze with claude/i })
  );
  await user.click(screen.getByRole("button", { name: /analyze with claude/i }));
  await waitFor(() =>
    screen.getByRole("button", { name: /send to claude/i })
  );
}

async function analyzeWithConsent(user: ReturnType<typeof userEvent.setup>) {
  await goToConsent(user);
  await user.click(screen.getByRole("button", { name: /send to claude/i }));
}

describe("SyllabusImportDialog behavior", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders step 1 heading when open", () => {
    renderSyllabusImportDialog();
    expect(
      screen.getByRole("heading", { name: /upload or paste/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /upload pdf, csv, or docx/i })
    ).toBeInTheDocument();
  });

  it("keeps Next button disabled while textarea is empty", () => {
    renderSyllabusImportDialog();
    expect(screen.getByRole("button", { name: /^next$/i })).toBeDisabled();
  });

  it("shows method select screen after clicking Next with text", async () => {
    const user = userEvent.setup();
    renderSyllabusImportDialog();
    await user.type(
      screen.getByLabelText(/paste syllabus text/i),
      "CSCI 101 syllabus"
    );
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /analyze with claude/i })
      ).toBeInTheDocument()
    );
    expect(
      screen.getByRole("button", { name: /copy prompt to my ai/i })
    ).toBeInTheDocument();
  });

  it("shows consent gate with extracted text after choosing Analyze with Claude", async () => {
    const user = userEvent.setup();
    renderSyllabusImportDialog();
    await user.type(
      screen.getByLabelText(/paste syllabus text/i),
      "CSCI 101 syllabus"
    );
    await goToConsent(user);
    expect(screen.getByText("CSCI 101 syllabus")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send to claude/i })
    ).toBeInTheDocument();
  });

  it("cancelling consent gate (Back) returns to method select", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderSyllabusImportDialog();
    await user.type(
      screen.getByLabelText(/paste syllabus text/i),
      "CSCI 101 syllabus"
    );
    await goToConsent(user);
    await user.click(screen.getByRole("button", { name: /^back$/i }));
    expect(
      screen.getByRole("button", { name: /analyze with claude/i })
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("moves to review and shows draft count after successful auto analysis", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ questions: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            title: "Midterm",
            sourceType: "midterm",
            type: "once",
            confidence: "high",
            sourceText: "Midterm Oct 1",
          },
          {
            title: "Lecture",
            sourceType: "lecture",
            type: "recurring",
            confidence: "medium",
            sourceText: "Mon 10am",
          },
        ],
      } as Response);

    renderSyllabusImportDialog();
    await user.type(
      screen.getByLabelText(/paste syllabus text/i),
      "CSCI 101 syllabus"
    );
    await analyzeWithConsent(user);

    await waitFor(() =>
      expect(screen.getByText(/2 tasks/i)).toBeInTheDocument()
    );
    expect(
      screen.getByRole("heading", { name: /tasks found/i })
    ).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/syllabus/generate-drafts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          extractedText: "CSCI 101 syllabus",
          studyPreferences: "",
        }),
      })
    );
  });

  it("shows error message when auto API call fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ questions: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

    renderSyllabusImportDialog();
    await user.type(
      screen.getByLabelText(/paste syllabus text/i),
      "some syllabus text"
    );
    await analyzeWithConsent(user);

    await waitFor(() =>
      expect(screen.getByText(/analysis failed/i)).toBeInTheDocument()
    );
    expect(
      screen.getByRole("heading", { name: /review before sending/i })
    ).toBeInTheDocument();
  });

  it("Back from review (auto path) returns to consent screen", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ questions: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

    renderSyllabusImportDialog();
    await user.type(
      screen.getByLabelText(/paste syllabus text/i),
      "syllabus text"
    );
    await analyzeWithConsent(user);

    await waitFor(() =>
      screen.getByRole("button", { name: /^back$/i })
    );
    await user.click(screen.getByRole("button", { name: /^back$/i }));

    expect(
      screen.getByRole("heading", { name: /review before sending/i })
    ).toBeInTheDocument();
  });

  it("shows zero-drafts message when auto API returns empty array", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ questions: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

    renderSyllabusImportDialog();
    await user.type(
      screen.getByLabelText(/paste syllabus text/i),
      "minimal syllabus"
    );
    await analyzeWithConsent(user);

    await waitFor(() =>
      expect(
        screen.getByText(/no tasks could be extracted/i)
      ).toBeInTheDocument()
    );
  });

  it("triggers auto analysis with extracted text when a file is uploaded", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ questions: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            title: "Final",
            sourceType: "final",
            type: "once",
            confidence: "high",
            sourceText: "Final Dec 15",
          },
        ],
      } as Response);

    renderSyllabusImportDialog();

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const csvFile = new File(
      ["Event,Date\nFinal,2026-12-15"],
      "syllabus.csv",
      { type: "text/csv" }
    );
    await user.upload(fileInput, csvFile);

    await waitFor(() =>
      expect(screen.getByText("syllabus.csv")).toBeInTheDocument()
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
      expect(screen.getByText(/1 task/i)).toBeInTheDocument()
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/syllabus/generate-drafts",
      expect.objectContaining({
        body: JSON.stringify({
          extractedText: "extracted pdf text",
          studyPreferences: "",
        }),
      })
    );
  });

  it("shows file type error when unsupported file is uploaded", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderSyllabusImportDialog();

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const xlsxFile = new File(["data"], "report.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    await user.upload(fileInput, xlsxFile);

    await waitFor(() =>
      expect(screen.getByText(/export to csv first/i)).toBeInTheDocument()
    );
    expect(
      screen.getByRole("heading", { name: /upload or paste/i })
    ).toBeInTheDocument();
  });

  it("Next button enabled when a file is queued but paste text is empty", async () => {
    const user = userEvent.setup();
    renderSyllabusImportDialog();

    expect(screen.getByRole("button", { name: /^next$/i })).toBeDisabled();

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const csvFile = new File(["Event,Date"], "schedule.csv", { type: "text/csv" });
    await user.upload(fileInput, csvFile);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^next$/i })).not.toBeDisabled()
    );
  });

  it("uploaded files appear as removable chips; removing a chip disables Next again", async () => {
    const user = userEvent.setup();
    renderSyllabusImportDialog();

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const csvFile = new File(["Event,Date"], "notes.csv", { type: "text/csv" });
    await user.upload(fileInput, csvFile);

    await waitFor(() =>
      expect(screen.getByText("notes.csv")).toBeInTheDocument()
    );

    const deleteIcon = screen.getByTestId("CancelIcon");
    await user.click(deleteIcon);

    await waitFor(() =>
      expect(screen.queryByText("notes.csv")).not.toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: /^next$/i })).toBeDisabled();
  });

  describe("manual path", () => {
    async function goToManualPaste(user: ReturnType<typeof userEvent.setup>) {
      await user.type(
        screen.getByLabelText(/paste syllabus text/i),
        "CSCI 101 syllabus"
      );
      await user.click(screen.getByRole("button", { name: /^next$/i }));
      await waitFor(() =>
        screen.getByRole("button", { name: /copy prompt to my ai/i })
      );
      await user.click(
        screen.getByRole("button", { name: /copy prompt to my ai/i })
      );
      await waitFor(() =>
        screen.getByRole("heading", { name: /study preferences/i })
      );
      await user.click(screen.getByRole("button", { name: /^next$/i }));
      await waitFor(() =>
        screen.getByRole("heading", { name: /your ai prompt/i })
      );
      await user.click(screen.getByRole("button", { name: /i've pasted it/i }));
      await waitFor(() =>
        screen.getByRole("heading", { name: /paste ai response/i })
      );
    }

    it("walks through preferences → prompt → paste steps", async () => {
      const user = userEvent.setup();
      renderSyllabusImportDialog();
      await goToManualPaste(user);
      expect(
        screen.getByLabelText(/paste the json array/i)
      ).toBeInTheDocument();
    });

    it("shows privacy disclosure on the prompt step", async () => {
      const user = userEvent.setup();
      renderSyllabusImportDialog();
      await user.type(
        screen.getByLabelText(/paste syllabus text/i),
        "CSCI 101"
      );
      await user.click(screen.getByRole("button", { name: /^next$/i }));
      await waitFor(() =>
        screen.getByRole("button", { name: /copy prompt to my ai/i })
      );
      await user.click(
        screen.getByRole("button", { name: /copy prompt to my ai/i })
      );
      await waitFor(() =>
        screen.getByRole("heading", { name: /study preferences/i })
      );
      await user.click(screen.getByRole("button", { name: /^next$/i }));
      await waitFor(() =>
        expect(screen.getByText(/nothing is sent anywhere/i)).toBeInTheDocument()
      );
    });

    it("shows copied state when Copy Prompt is clicked", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText },
        writable: true,
        configurable: true,
      });

      const user = userEvent.setup();
      renderSyllabusImportDialog();
      await user.type(
        screen.getByLabelText(/paste syllabus text/i),
        "CSCI 101"
      );
      await user.click(screen.getByRole("button", { name: /^next$/i }));
      await waitFor(() =>
        screen.getByRole("button", { name: /copy prompt to my ai/i })
      );
      await user.click(
        screen.getByRole("button", { name: /copy prompt to my ai/i })
      );
      await waitFor(() =>
        screen.getByRole("heading", { name: /study preferences/i })
      );
      await user.click(screen.getByRole("button", { name: /^next$/i }));
      await waitFor(() =>
        screen.getByRole("heading", { name: /your ai prompt/i })
      );
      await user.click(screen.getByTestId("copy-prompt-button"));

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: /copied/i })
        ).toBeInTheDocument()
      );
    });

    it("shows field-level errors for invalid JSON without losing pasted content", async () => {
      const user = userEvent.setup();
      renderSyllabusImportDialog();
      await goToManualPaste(user);

      const textarea = screen.getByLabelText(/paste the json array/i);
      fireEvent.change(textarea, { target: { value: "[{not json}]" } });
      await user.click(
        screen.getByRole("button", { name: /import tasks/i })
      );

      await waitFor(() =>
        expect(screen.getByText(/not valid json/i)).toBeInTheDocument()
      );
      expect(textarea).toHaveValue("[{not json}]");
    });

    it("shows field-level errors for items failing schema validation", async () => {
      const user = userEvent.setup();
      renderSyllabusImportDialog();
      await goToManualPaste(user);

      const textarea = screen.getByLabelText(/paste the json array/i);
      fireEvent.change(textarea, { target: { value: '[{"title":"Bad"}]' } });
      await user.click(
        screen.getByRole("button", { name: /import tasks/i })
      );

      await waitFor(() =>
        expect(screen.getAllByText(/Item 1/).length).toBeGreaterThan(0)
      );
    });

    it("advances to review when valid JSON is pasted", async () => {
      const user = userEvent.setup();
      renderSyllabusImportDialog();
      await goToManualPaste(user);

      const validJson = JSON.stringify([
        {
          title: "Midterm",
          sourceType: "midterm",
          type: "once",
          confidence: "high",
          sourceText: "Midterm Oct 1",
          date: "2026-10-01",
        },
      ]);
      const textarea = screen.getByLabelText(/paste the json array/i);
      fireEvent.change(textarea, { target: { value: validJson } });
      await user.click(
        screen.getByRole("button", { name: /import tasks/i })
      );

      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: /tasks found/i })
        ).toBeInTheDocument()
      );
      expect(screen.getByText(/1 task/i)).toBeInTheDocument();
    });

    it("Back from review (manual path) returns to paste step", async () => {
      const user = userEvent.setup();
      renderSyllabusImportDialog();
      await goToManualPaste(user);

      const validJson = JSON.stringify([
        {
          title: "Final",
          sourceType: "final",
          type: "once",
          confidence: "high",
          sourceText: "Final Dec 15",
          date: "2026-12-15",
        },
      ]);
      fireEvent.change(screen.getByLabelText(/paste the json array/i), {
        target: { value: validJson },
      });
      await user.click(screen.getByRole("button", { name: /import tasks/i }));

      await waitFor(() =>
        screen.getByRole("heading", { name: /tasks found/i })
      );
      await user.click(screen.getByRole("button", { name: /^back$/i }));

      expect(
        screen.getByRole("heading", { name: /paste ai response/i })
      ).toBeInTheDocument();
    });
  });
});
