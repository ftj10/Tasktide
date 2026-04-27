// INPUT: release metadata, localStorage state, and release-notes UI
// OUTPUT: behavior coverage for the update center
// EFFECT: Verifies the latest shipped release is shown once per user and remains available in history
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, beforeEach, expect, it } from "vitest";

import i18n from "../src/i18n";
import { LATEST_RELEASE_ID } from "../src/app/releaseNotes";
import { ReleaseNotesCenter } from "../src/components/ReleaseNotesCenter";
import { renderWithProviders } from "./test-utils";

describe("ReleaseNotesCenter behavior", () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage("en");
  });

  it("shows the latest update once per user and stores the seen release id", async () => {
    const user = userEvent.setup();

    renderWithProviders(<ReleaseNotesCenter username="tom" />);

    expect(screen.getByText("What's New")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(localStorage.getItem("release-notes-seen:tom")).toBe(LATEST_RELEASE_ID);
    });
  });

  it("shows the latest shipped version in the update dialog", () => {
    renderWithProviders(<ReleaseNotesCenter username="tom" />);

    expect(screen.getByText("v1.8.0")).toBeInTheDocument();
  });

  it("opens the history drawer from the toolbar button", async () => {
    const user = userEvent.setup();
    localStorage.setItem("release-notes-seen:tom", LATEST_RELEASE_ID);

    renderWithProviders(<ReleaseNotesCenter username="tom" />);

    await user.click(screen.getByRole("button", { name: "Updates" }));
    expect(screen.getByText("Release History")).toBeInTheDocument();
  });
});
