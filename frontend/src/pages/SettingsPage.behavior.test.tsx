// INPUT: Settings page props and mocked browser state
// OUTPUT: behavior coverage for settings sections and account actions
// EFFECT: Verifies the centralized settings workflows render and call their expected handlers
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../i18n";
import { renderWithProviders } from "../../tests/test-utils";
import { SettingsPage } from "./SettingsPage";

const storageMocks = vi.hoisted(() => ({
  isAdminUser: vi.fn(),
}));

vi.mock("../app/storage", async () => {
  const actual = await vi.importActual<typeof import("../app/storage")>("../app/storage");
  return {
    ...actual,
    isAdminUser: storageMocks.isAdminUser,
  };
});

function renderSettingsPage(overrides: Partial<Parameters<typeof SettingsPage>[0]> = {}) {
  localStorage.setItem("tasktide_username", "tom");
  const props = {
    tasks: [],
    onImportSuccess: vi.fn(),
    showToast: vi.fn(),
    installPrompt: null,
    onInstallPromptConsumed: vi.fn(),
    onLogout: vi.fn(),
    onLoginSuccess: vi.fn(),
    avatarUrl: null,
    onAvatarChange: vi.fn(),
    ...overrides,
  } as Parameters<typeof SettingsPage>[0];

  renderWithProviders(<SettingsPage {...props} />);
  return props;
}

describe("SettingsPage", () => {
  beforeEach(async () => {
    storageMocks.isAdminUser.mockReset().mockReturnValue(false);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ email: "", emailNotifications: false, sent: 1 }),
    }));
    await i18n.changeLanguage("en");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders all five sections", () => {
    renderSettingsPage();

    expect(screen.getByRole("heading", { name: "Account" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Install App" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Import Tasks" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Export Tasks" })).toBeInTheDocument();
  });

  it("language toggle calls i18n.changeLanguage", () => {
    const changeLanguage = vi.spyOn(i18n, "changeLanguage").mockResolvedValue((() => "") as never);
    renderSettingsPage();

    fireEvent.click(screen.getByRole("button", { name: "中文" }));

    expect(changeLanguage).toHaveBeenCalledWith("zh");
    changeLanguage.mockRestore();
  });

  it("logout button calls onLogout", () => {
    const onLogout = vi.fn();
    renderSettingsPage({ onLogout });

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("shows the admin role badge for admin users", () => {
    storageMocks.isAdminUser.mockReturnValue(true);

    renderSettingsPage();

    expect(screen.getByText("Admin")).toBeVisible();
  });

  it("shows the user role badge for non-admin users", () => {
    storageMocks.isAdminUser.mockReturnValue(false);

    renderSettingsPage();

    expect(screen.getByText("User")).toBeVisible();
  });

  it("submits the admin email broadcast form", async () => {
    const user = userEvent.setup();
    storageMocks.isAdminUser.mockReturnValue(true);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: "", emailNotifications: false }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sent: 1 }),
      });
    vi.stubGlobal("fetch", fetchMock);

    renderSettingsPage();
    await user.click(screen.getByRole("button", { name: "Email Broadcast" }));
    fireEvent.change(await screen.findByRole("textbox", { name: /Subject/ }), { target: { value: "Schedule update" } });
    fireEvent.change(await screen.findByRole("textbox", { name: /Message \(HTML\)/ }), { target: { value: "<p>Hello subscribers</p>" } });
    fireEvent.click(screen.getByRole("button", { name: "Send to All Subscribers" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/email-broadcast", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: "Schedule update", html: "<p>Hello subscribers</p>" }),
      });
    });
  });

  it("hides the admin email broadcast form for non-admin users", () => {
    storageMocks.isAdminUser.mockReturnValue(false);

    renderSettingsPage();

    expect(screen.queryByRole("button", { name: "Email Broadcast" })).not.toBeInTheDocument();
  });
});
