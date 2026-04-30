// INPUT: login page UI with i18n state
// OUTPUT: behavior coverage for pre-login localization
// EFFECT: Verifies users can switch the authentication screen between English and Chinese before signing in
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import { LoginPage } from "../src/pages/LoginPage";
import { renderWithProviders } from "./test-utils";

const storageMocks = vi.hoisted(() => ({
  setAuth: vi.fn(),
}));

vi.mock("../src/app/storage", async () => {
  const actual = await vi.importActual<typeof import("../src/app/storage")>("../src/app/storage");
  return {
    ...actual,
    setAuth: storageMocks.setAuth,
  };
});

describe("LoginPage behavior", () => {
  beforeEach(async () => {
    storageMocks.setAuth.mockReset();
    vi.unstubAllGlobals();
    await i18n.changeLanguage("en");
  });

  it("switches the login screen copy to Chinese from the language button", async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginPage onLoginSuccess={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Welcome Back" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "中文" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "中文" }));

    expect(await screen.findByRole("heading", { name: "欢迎回来" })).toBeInTheDocument();
    expect(screen.getByText("用户名")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "登录" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
  });

  it("keeps the language switch active when moving to registration mode", async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginPage onLoginSuccess={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "中文" }));
    await user.click(await screen.findByRole("button", { name: "还没有账号？去注册" }));

    expect(screen.getByRole("heading", { name: "创建账号" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "注册" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "已有账号？去登录" })).toBeInTheDocument();
  });

  it("stores the returned role when login succeeds", async () => {
    const user = userEvent.setup();
    const onLoginSuccess = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ username: "tom", role: "ADMIN" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<LoginPage onLoginSuccess={onLoginSuccess} />);

    await user.type(screen.getByLabelText(/Username/i), "tom");
    await user.type(screen.getByLabelText(/Password/i), "secret");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/login", expect.objectContaining({
        method: "POST",
        credentials: "include",
      }));
      expect(storageMocks.setAuth).toHaveBeenCalledWith("tom", "ADMIN");
      expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
