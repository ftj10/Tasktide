// INPUT: month page and mocked navigation
// OUTPUT: behavior coverage for month-cell navigation
// EFFECT: Verifies the month overview links the user back to the selected Today date
import dayjs from "dayjs";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, beforeEach, expect, it, vi } from "vitest";

import i18n from "../src/i18n";
import { MonthPage } from "../src/pages/MonthPage";
import { renderWithProviders } from "./test-utils";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("MonthPage behavior", () => {
  beforeEach(async () => {
    navigateMock.mockReset();
    await i18n.changeLanguage("en");
  });

  it("navigates to the selected day route when a calendar cell is clicked", async () => {
    const user = userEvent.setup();
    const todayDate = dayjs().format("YYYY-MM-DD");
    const todayNumber = String(dayjs().date());

    renderWithProviders(<MonthPage tasks={[]} setTasks={vi.fn()} />);

    await user.click(screen.getAllByText(todayNumber)[0]);

    expect(navigateMock).toHaveBeenCalledWith(`/?date=${todayDate}`);
  });
});
