import { describe, it, expect } from "vitest";
import { buildSyllabusPrompt } from "../src/app/syllabusPrompt";

describe("buildSyllabusPrompt", () => {
  it("includes the input text verbatim in the returned prompt", () => {
    const input = "CS101: Final exam on December 15th at 2pm in Room 204.";
    const prompt = buildSyllabusPrompt(input);
    expect(prompt).toContain(input);
  });

  it("mentions all 12 sourceType values", () => {
    const prompt = buildSyllabusPrompt("test");
    const sourceTypes = [
      "final",
      "midterm",
      "assignment",
      "quiz",
      "project",
      "prep",
      "lecture",
      "lab",
      "tutorial",
      "other",
      "office_hour",
      "reading",
    ];
    for (const type of sourceTypes) {
      expect(prompt).toContain(type);
    }
  });

  it('mentions the YYYY-MM-DD date format', () => {
    const prompt = buildSyllabusPrompt("test");
    expect(prompt).toContain("YYYY-MM-DD");
  });

  it("mentions all 3 confidence levels", () => {
    const prompt = buildSyllabusPrompt("test");
    expect(prompt).toContain("high");
    expect(prompt).toContain("medium");
    expect(prompt).toContain("low");
  });

  it("documents weekday convention: 1=Monday and 7=Sunday", () => {
    const prompt = buildSyllabusPrompt("test");
    expect(prompt).toMatch(/1[=\s]+Mon(day)?/i);
    expect(prompt).toMatch(/7[=\s]+Sun(day)?/i);
  });

  it("returns a non-empty prompt string when given an empty input", () => {
    const prompt = buildSyllabusPrompt("");
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });
});
