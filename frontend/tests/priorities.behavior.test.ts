// INPUT: priority levels and optional completed planner items
// OUTPUT: behavior coverage for shared priority color helpers
// EFFECT: Verifies active and completed task styling stays consistent across planner surfaces
import { describe, expect, it } from "vitest";

import { getPriorityAccent, getPriorityColors } from "../src/app/priorities";

describe("priority color behavior", () => {
  it("returns the expected accent for every priority level and by default", () => {
    expect(getPriorityAccent(1)).toBe("#ef4444");
    expect(getPriorityAccent(2)).toBe("#f97316");
    expect(getPriorityAccent(3)).toBe("#f59e0b");
    expect(getPriorityAccent(4)).toBe("#10b981");
    expect(getPriorityAccent(5)).toBe("#0ea5e9");
    expect(getPriorityAccent()).toBe("#0ea5e9");
  });

  it("returns the completed grey palette when completedAt is set", () => {
    expect(getPriorityColors({ emergency: 1, completedAt: "2026-05-05T10:00:00.000Z" })).toEqual({
      bg: "#e5e7eb",
      border: "#cbd5e1",
      text: "#6b7280",
    });
  });

  it("returns an accent-colored palette for active items", () => {
    expect(getPriorityColors({ emergency: 2, completedAt: null })).toEqual({
      bg: "#f97316",
      border: "#f97316",
      text: "#ffffff",
    });
  });

  it("uses the default priority accent when no item is passed", () => {
    expect(getPriorityColors()).toEqual({
      bg: "#0ea5e9",
      border: "#0ea5e9",
      text: "#ffffff",
    });
  });
});
