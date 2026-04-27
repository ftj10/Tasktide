// INPUT: login page UI with i18n state
// OUTPUT: behavior coverage for pre-login localization
// EFFECT: Verifies users can switch the authentication screen between English and Chinese before signing in
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import { LoginPage } from "../src/pages/LoginPage";
import { renderWithProviders } from "./test-utils";

describe("LoginPage behavior", () => {
  beforeEach(async () => {
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
});
