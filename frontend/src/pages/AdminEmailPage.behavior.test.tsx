// INPUT: mocked current-user profile responses
// OUTPUT: behavior coverage for admin email page role rendering
// EFFECT: Verifies URL-only broadcast access is limited to admin users
import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../tests/test-utils";
import { AdminEmailPage } from "./AdminEmailPage";

function mockProfile(role: "USER" | "ADMIN") {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ role }),
    })
  );
}

describe("AdminEmailPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows access denied for non-admin", async () => {
    mockProfile("USER");

    renderWithProviders(<AdminEmailPage />);

    expect(await screen.findByText("Access denied")).toBeInTheDocument();
  });

  it("renders form for admin", async () => {
    mockProfile("ADMIN");

    renderWithProviders(<AdminEmailPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Admin Email Broadcast" })).toBeInTheDocument();
    });
    expect(screen.getByRole("textbox", { name: /Subject/ })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /HTML body/ })).toBeInTheDocument();
  });
});
