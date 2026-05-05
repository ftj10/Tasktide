import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { extract } from "../src/app/syllabusExtraction";

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: (_src: unknown) => ({
    promise: Promise.resolve({
      numPages: 2,
      getPage: (pageNum: number) =>
        Promise.resolve({
          getTextContent: () =>
            Promise.resolve({
              items:
                pageNum === 1
                  ? [{ str: "COMSC 101 Course Outline" }, { str: "Fall 2026" }]
                  : [{ str: "Final Exam December 15" }],
            }),
        }),
    }),
  }),
}));

vi.mock("mammoth", () => ({
  extractRawText: vi.fn().mockResolvedValue({
    value: "COMSC 101 Syllabus\nFinal Exam December 15",
  }),
}));

describe("extract — plain text", () => {
  it("returns the input string unchanged", async () => {
    const text = "Jan 10: Lecture 1\nJan 17: Lecture 2";
    expect(await extract(text)).toBe(text);
  });

  it("returns an empty string unchanged", async () => {
    expect(await extract("")).toBe("");
  });
});

describe("extract — CSV file", () => {
  it("extracts rows from a CSV fixture as pipe-delimited text", async () => {
    const csvPath = path.resolve(
      __dirname,
      "fixtures/sample-syllabus.csv"
    );
    const buffer = fs.readFileSync(csvPath);
    const file = new File([buffer], "sample-syllabus.csv", { type: "text/csv" });

    const result = await extract(file);

    expect(result).toContain("Lecture 1");
    expect(result).toContain("Midterm Exam");
    expect(result).toContain("Final Exam");
    expect(result).toContain(" | ");
  });

  it("handles a minimal single-row CSV", async () => {
    const file = new File(["Event,Date\nFinal,2026-12-15"], "sched.csv", {
      type: "text/csv",
    });
    const result = await extract(file);
    expect(result).toContain("Final");
    expect(result).toContain("2026-12-15");
  });
});

describe("extract — PDF file (mocked pdfjs-dist)", () => {
  it("extracts text from each page and joins with newlines", async () => {
    const file = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "syllabus.pdf", {
      type: "application/pdf",
    });

    const result = await extract(file);

    expect(result).toContain("COMSC 101 Course Outline");
    expect(result).toContain("Fall 2026");
    expect(result).toContain("Final Exam December 15");
    expect(result.split("\n")).toHaveLength(2);
  });
});

describe("extract — DOCX file (mocked mammoth)", () => {
  it("extracts plain text from a .docx file", async () => {
    const file = new File(["binary"], "syllabus.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const result = await extract(file);
    expect(result).toContain("COMSC 101 Syllabus");
    expect(result).toContain("Final Exam December 15");
  });
});

describe("extract — unsupported file type", () => {
  it("throws a descriptive error for .xlsx files", async () => {
    const file = new File(["data"], "schedule.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    await expect(extract(file)).rejects.toThrow(/export to CSV first/i);
  });
});
