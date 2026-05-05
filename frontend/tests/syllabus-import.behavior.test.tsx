// INPUT: SyllabusImportDialog rendered in test providers
// OUTPUT: behavior coverage for upload→consent→analyze→draft-count wizard flow
// EFFECT: mocks fetch and extract to simulate API responses
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import { SyllabusImportDialog } from "../src/pages/SyllabusImportDialog";
import { renderWithProviders } from "./test-utils";

vi.mock("../src/app/syllabusExtraction", () => ({
  extract: vi.fn().mockResolvedValue("extracted pdf text"),
}));

// Clicks Analyze then confirms the consent gate
async function analyzeWithConsent(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /^analyze$/i }));
  await waitFor(() => screen.getByRole("button", { name: /send to claude/i }));
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
    renderWithProviders(<SyllabusImportDialog open onClose={() => {}} />);
    expect(screen.getByRole("heading", { name: /upload or paste/i })).toBeInTheDocument();
  });

  it("keeps Analyze button disabled while textarea is empty", () => {
    renderWithProviders(<SyllabusImportDialog open onClose={() => {}} />);
    expect(screen.getByRole("button", { name: /^analyze$/i })).toBeDisabled();
  });

  it("shows consent gate with the entered text before calling the API", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SyllabusImportDialog open onClose={() => {}} />);
    await user.type(screen.getByLabelText(/paste syllabus text/i), "CSCI 101 syllabus");
    await user.click(screen.getByRole("button", { name: /^analyze$/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /send to claude/i })).toBeInTheDocument());
    expect(screen.getByText("CSCI 101 syllabus")).toBeInTheDocument();
  });

  it("cancelling the consent gate returns to step 1 without calling the API", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderWithProviders(<SyllabusImportDialog open onClose={() => {}} />);
    await user.type(screen.getByLabelText(/paste syllabus text/i), "CSCI 101 syllabus");
    await user.click(screen.getByRole("button", { name: /^analyze$/i }));

    await waitFor(() => screen.getByRole("button", { name: /cancel/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.getByLabelText(/paste syllabus text/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("moves to step 2 and shows draft count after successful analysis", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { title: "Midterm", sourceType: "midterm", type: "once", confidence: "high", sourceText: "Midterm Oct 1" },
        { title: "Lecture", sourceType: "lecture", type: "recurring", confidence: "medium", sourceText: "Mon 10am" },
      ],
    } as Response);

    renderWithProviders(<SyllabusImportDialog open onClose={() => {}} />);
    await user.type(screen.getByLabelText(/paste syllabus text/i), "CSCI 101 syllabus");
    await analyzeWithConsent(user);

    await waitFor(() => expect(screen.getByText(/2 tasks/i)).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: /tasks found/i })).toBeInTheDocument();
  });

  it("shows error message when API call fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    renderWithProviders(<SyllabusImportDialog open onClose={() => {}} />);
    await user.type(screen.getByLabelText(/paste syllabus text/i), "some syllabus text");
    await analyzeWithConsent(user);

    await waitFor(() => expect(screen.getByText(/analysis failed/i)).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: /upload or paste/i })).toBeInTheDocument();
  });

  it("Back button on step 2 returns to step 1", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    renderWithProviders(<SyllabusImportDialog open onClose={() => {}} />);
    await user.type(screen.getByLabelText(/paste syllabus text/i), "syllabus text");
    await analyzeWithConsent(user);

    await waitFor(() => screen.getByRole("button", { name: /back/i }));
    await user.click(screen.getByRole("button", { name: /back/i }));

    expect(screen.getByRole("heading", { name: /upload or paste/i })).toBeInTheDocument();
  });

  it("shows zero-drafts message when API returns empty array", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    renderWithProviders(<SyllabusImportDialog open onClose={() => {}} />);
    await user.type(screen.getByLabelText(/paste syllabus text/i), "minimal syllabus");
    await analyzeWithConsent(user);

    await waitFor(() =>
      expect(screen.getByText(/no tasks could be extracted/i)).toBeInTheDocument()
    );
  });

  it("triggers analysis with extracted text when a file is uploaded", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { title: "Final", sourceType: "final", type: "once", confidence: "high", sourceText: "Final Dec 15" },
      ],
    } as Response);

    renderWithProviders(<SyllabusImportDialog open onClose={() => {}} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const csvFile = new File(["Event,Date\nFinal,2026-12-15"], "syllabus.csv", { type: "text/csv" });
    await user.upload(fileInput, csvFile);

    await waitFor(() => screen.getByRole("button", { name: /send to claude/i }));
    await user.click(screen.getByRole("button", { name: /send to claude/i }));

    await waitFor(() => expect(screen.getByText(/1 task/i)).toBeInTheDocument());
  });
});
