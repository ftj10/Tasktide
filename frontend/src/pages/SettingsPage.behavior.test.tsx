// INPUT: Settings page props and mocked browser state
// OUTPUT: behavior coverage for settings sections and account actions
// EFFECT: Verifies the centralized settings workflows render and call their expected handlers
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import i18n from "../i18n";
import { renderWithProviders } from "../../tests/test-utils";
import { SettingsPage } from "./SettingsPage";

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
    ...overrides,
  } as Parameters<typeof SettingsPage>[0];

  renderWithProviders(<SettingsPage {...props} />);
  return props;
}

describe("SettingsPage", () => {
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
});
