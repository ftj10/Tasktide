import { describe, it, expect } from "vitest";
import { buildSyllabusPrompt } from "../src/app/syllabusPrompt";

describe("buildSyllabusPrompt", () => {
  it("includes the input text verbatim in the returned prompt", () => {
    const input = "CS101: Final exam on December 15th at 2pm in Room 204.";
    const prompt = buildSyllabusPrompt(input);
    expect(prompt).toContain(input);
  });

  it("guides the student through clarify and extract steps", () => {
    const input = "CS101: Midterm date TBA.";
    const prefs = "remind me 3 days before each exam";
    const prompt = buildSyllabusPrompt(input, prefs);
    expect(prompt).toContain("STEP 1");
    expect(prompt).toContain("STEP 2");
    expect(prompt).toContain(input);
    expect(prompt).toContain(prefs);
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

  it("requires a concise description shape for every extracted task", () => {
    const prompt = buildSyllabusPrompt("test");
    expect(prompt).toContain('"description":"one concise sentence"');
    expect(prompt).toMatch(/one concise sentence/i);
  });

  it("documents weekday range for recurring tasks", () => {
    const prompt = buildSyllabusPrompt("test");
    expect(prompt).toContain('"weekdays":[1-7]');
    expect(prompt).toMatch(/recurring only/i);
  });

  it("returns a non-empty prompt string when given an empty input", () => {
    const prompt = buildSyllabusPrompt("");
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  describe("with preferences", () => {
    it("includes the preferences text verbatim when provided", () => {
      const prefs = "remind me 3 days before each exam";
      const prompt = buildSyllabusPrompt("syllabus text", prefs);
      expect(prompt).toContain(prefs);
    });

    it("does not include a preferences section when preferences is empty string", () => {
      const prompt = buildSyllabusPrompt("syllabus text", "");
      expect(prompt).not.toContain("User preferences");
    });

    it("does not include a preferences section when preferences is whitespace only", () => {
      const prompt = buildSyllabusPrompt("syllabus text", "   ");
      expect(prompt).not.toContain("User preferences");
    });

    it("preferences appear before the syllabus text in the prompt", () => {
      const prefs = "focus on exam prep tasks";
      const prompt = buildSyllabusPrompt("CSCI 101 syllabus", prefs);
      const prefsIdx = prompt.indexOf(prefs);
      const syllabusIdx = prompt.indexOf("CSCI 101 syllabus");
      expect(prefsIdx).toBeGreaterThan(-1);
      expect(syllabusIdx).toBeGreaterThan(prefsIdx);
    });
  });
});
