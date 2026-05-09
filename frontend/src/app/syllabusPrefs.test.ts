import { describe, expect, it } from "vitest";
import { serializePreferences } from "./syllabusPrefs";

describe("serializePreferences", () => {
  it("returns empty string when all inputs are blank", () => {
    expect(
      serializePreferences({ examPrepDays: "", assignmentPrepDays: "", skipTypes: [], prefsFreeText: "" })
    ).toBe("");
  });

  it("includes exam prep sentence when examPrepDays is a positive integer", () => {
    const result = serializePreferences({ examPrepDays: "3", assignmentPrepDays: "", skipTypes: [], prefsFreeText: "" });
    expect(result).toBe("Add a study task 3 days before each exam or final.");
  });

  it("includes assignment prep sentence when assignmentPrepDays is a positive integer", () => {
    const result = serializePreferences({ examPrepDays: "", assignmentPrepDays: "1", skipTypes: [], prefsFreeText: "" });
    expect(result).toBe("Add a prep task 1 day before each assignment or quiz.");
  });

  it("uses 'day' (singular) when N is 1", () => {
    const result = serializePreferences({ examPrepDays: "1", assignmentPrepDays: "", skipTypes: [], prefsFreeText: "" });
    expect(result).toBe("Add a study task 1 day before each exam or final.");
  });

  it("includes skip sentence when skipTypes has entries", () => {
    const result = serializePreferences({ examPrepDays: "", assignmentPrepDays: "", skipTypes: ["Lectures", "Labs"], prefsFreeText: "" });
    expect(result).toBe("Do not import Lectures, Labs.");
  });

  it("appends freeText as-is", () => {
    const result = serializePreferences({ examPrepDays: "", assignmentPrepDays: "", skipTypes: [], prefsFreeText: "use 24h time" });
    expect(result).toBe("use 24h time");
  });

  it("joins all non-empty parts with a space", () => {
    const result = serializePreferences({
      examPrepDays: "3",
      assignmentPrepDays: "1",
      skipTypes: ["Readings"],
      prefsFreeText: "use 24h time",
    });
    expect(result).toBe(
      "Add a study task 3 days before each exam or final. Add a prep task 1 day before each assignment or quiz. Do not import Readings. use 24h time"
    );
  });

  it("ignores non-positive or non-integer values for day fields", () => {
    expect(
      serializePreferences({ examPrepDays: "0", assignmentPrepDays: "-1", skipTypes: [], prefsFreeText: "" })
    ).toBe("");
    expect(
      serializePreferences({ examPrepDays: "abc", assignmentPrepDays: "1.5", skipTypes: [], prefsFreeText: "" })
    ).toBe("");
  });
});
