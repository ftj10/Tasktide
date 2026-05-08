// INPUT: Settings page props and mocked browser state
// OUTPUT: behavior coverage for settings sections and account actions
// EFFECT: Verifies the centralized settings workflows render and call their expected handlers
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../i18n";
import { renderWithProviders } from "../../tests/test-utils";
import { SettingsPage } from "./SettingsPage";

const storageMocks = vi.hoisted(() => ({
  isAdminUser: vi.fn(),
  getSavedAccounts: vi.fn(),
  getSwitchToken: vi.fn(),
  addSavedAccount: vi.fn(),
  removeSavedAccount: vi.fn(),
}));

vi.mock("../app/storage", async () => {
  const actual = await vi.importActual<typeof import("../app/storage")>("../app/storage");
  return {
    ...actual,
    isAdminUser: storageMocks.isAdminUser,
    getSavedAccounts: storageMocks.getSavedAccounts,
    getSwitchToken: storageMocks.getSwitchToken,
    addSavedAccount: storageMocks.addSavedAccount,
    removeSavedAccount: storageMocks.removeSavedAccount,
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
    storageMocks.getSavedAccounts.mockReset().mockReturnValue([]);
    storageMocks.getSwitchToken.mockReset().mockReturnValue(null);
    storageMocks.addSavedAccount.mockReset();
    storageMocks.removeSavedAccount.mockReset();
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

  it("clicking a saved account chip calls /account-switch and reloads session", async () => {
    const user = userEvent.setup();
    storageMocks.getSavedAccounts.mockReturnValue([{ username: "casey", switchToken: "tok-abc" }]);
    storageMocks.getSwitchToken.mockReturnValue("tok-abc");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ email: "", emailNotifications: false }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ username: "casey", role: "USER" }) });
    vi.stubGlobal("fetch", fetchMock);
    const onLoginSuccess = vi.fn();

    renderSettingsPage({ onLoginSuccess });
    await user.click(screen.getByRole("button", { name: "Switch Account" }));
    await user.click(screen.getByRole("button", { name: "casey" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/account-switch"),
        expect.objectContaining({ body: JSON.stringify({ username: "casey", switchToken: "tok-abc" }) })
      );
      expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it("shows session-expired error with Re-add button when switch token is rejected", async () => {
    const user = userEvent.setup();
    storageMocks.getSavedAccounts.mockReturnValue([{ username: "casey", switchToken: "expired" }]);
    storageMocks.getSwitchToken.mockReturnValue("expired");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ email: "", emailNotifications: false }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Switch token invalid or expired" }) });
    vi.stubGlobal("fetch", fetchMock);

    renderSettingsPage();
    await user.click(screen.getByRole("button", { name: "Switch Account" }));
    await user.click(screen.getByRole("button", { name: "casey" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Session expired/);
      expect(screen.getByRole("button", { name: /Re-add/i })).toBeInTheDocument();
    });
  });

  it("inline add-account form calls /account-token and stores the switch token without logging out", async () => {
    const user = userEvent.setup();
    storageMocks.getSavedAccounts.mockReturnValue([]);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ email: "", emailNotifications: false }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ username: "sam", switchToken: "new-tok" }) });
    vi.stubGlobal("fetch", fetchMock);
    const onLogout = vi.fn();

    renderSettingsPage({ onLogout });
    await user.click(screen.getByRole("button", { name: "Add Account" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(await within(dialog).findByRole("textbox", { name: /Username/i }), "sam");
    await user.type(within(dialog).getByLabelText(/Current password/i), "password1");
    await user.click(within(dialog).getByRole("button", { name: /Add & Stay/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/account-token"),
        expect.objectContaining({ body: JSON.stringify({ username: "sam", password: "password1" }) })
      );
      expect(storageMocks.addSavedAccount).toHaveBeenCalledWith("sam", "new-tok");
      expect(onLogout).not.toHaveBeenCalled();
    });
  });

  it("inline add-account form shows error when credentials are rejected", async () => {
    const user = userEvent.setup();
    storageMocks.getSavedAccounts.mockReturnValue([]);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ email: "", emailNotifications: false }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Invalid credentials" }) });
    vi.stubGlobal("fetch", fetchMock);

    renderSettingsPage();
    await user.click(screen.getByRole("button", { name: "Add Account" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(await within(dialog).findByRole("textbox", { name: /Username/i }), "nobody");
    await user.type(within(dialog).getByLabelText(/Current password/i), "wrongpass");
    await user.click(within(dialog).getByRole("button", { name: /Add & Stay/i }));

    await waitFor(() => {
      const alerts = screen.getAllByRole("alert");
      expect(alerts.some((a) => a.textContent?.includes("Invalid credentials"))).toBe(true);
    });
  });
});
