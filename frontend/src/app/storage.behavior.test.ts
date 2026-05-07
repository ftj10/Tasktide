// INPUT: saved account localStorage state
// OUTPUT: behavior coverage for saved account helpers
// EFFECT: Verifies account switching stores usernames only and keeps the list bounded
import { beforeEach, describe, expect, it } from "vitest";

import { addSavedAccount, getSavedAccounts, removeSavedAccount } from "./storage";

describe("saved account storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("getSavedAccounts returns [] when localStorage empty", () => {
    expect(getSavedAccounts()).toEqual([]);
  });

  it("addSavedAccount deduplicates and caps at 5", () => {
    ["a", "b", "c", "d", "e", "f", "a"].forEach(addSavedAccount);

    expect(getSavedAccounts()).toEqual(["a", "f", "e", "d", "c"]);
  });

  it("removeSavedAccount removes the correct entry", () => {
    ["tom", "casey", "sam"].forEach(addSavedAccount);

    removeSavedAccount("casey");

    expect(getSavedAccounts()).toEqual(["sam", "tom"]);
  });
});
