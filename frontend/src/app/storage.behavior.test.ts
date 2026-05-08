// INPUT: saved account localStorage state
// OUTPUT: behavior coverage for saved account helpers with switch tokens
// EFFECT: Verifies account switching stores usernames and tokens, caps the list, and migrates old format
import { beforeEach, describe, expect, it } from "vitest";

import { addSavedAccount, getSavedAccounts, getSwitchToken, removeSavedAccount } from "./storage";

describe("saved account storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("getSavedAccounts returns [] when localStorage is empty", () => {
    expect(getSavedAccounts()).toEqual([]);
  });

  it("addSavedAccount stores username and switchToken", () => {
    addSavedAccount("tom", "token-abc");

    expect(getSavedAccounts()).toEqual([{ username: "tom", switchToken: "token-abc" }]);
  });

  it("addSavedAccount deduplicates by username and caps at 10", () => {
    ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"].forEach((u) =>
      addSavedAccount(u, `token-${u}`)
    );

    const accounts = getSavedAccounts();
    expect(accounts).toHaveLength(10);
    expect(accounts[0].username).toBe("k");
    expect(accounts.map((a) => a.username)).not.toContain("a");
  });

  it("addSavedAccount refreshes the switch token when re-adding an existing username", () => {
    addSavedAccount("tom", "old-token");
    addSavedAccount("tom", "new-token");

    expect(getSavedAccounts()).toEqual([{ username: "tom", switchToken: "new-token" }]);
  });

  it("removeSavedAccount removes the correct entry", () => {
    addSavedAccount("tom", "t1");
    addSavedAccount("casey", "t2");
    addSavedAccount("sam", "t3");

    removeSavedAccount("casey");

    expect(getSavedAccounts().map((a) => a.username)).toEqual(["sam", "tom"]);
  });

  it("getSwitchToken returns the token for a known username", () => {
    addSavedAccount("tom", "token-xyz");

    expect(getSwitchToken("tom")).toBe("token-xyz");
  });

  it("getSwitchToken returns null for an unknown username", () => {
    expect(getSwitchToken("nobody")).toBeNull();
  });

  it("getSavedAccounts migrates old string-only entries to the new shape", () => {
    localStorage.setItem("savedAccounts", JSON.stringify(["tom", "casey"]));

    expect(getSavedAccounts()).toEqual([
      { username: "tom", switchToken: "" },
      { username: "casey", switchToken: "" },
    ]);
  });

  it("getSwitchToken returns null for a migrated entry with no token", () => {
    localStorage.setItem("savedAccounts", JSON.stringify(["tom"]));

    expect(getSwitchToken("tom")).toBeNull();
  });
});
