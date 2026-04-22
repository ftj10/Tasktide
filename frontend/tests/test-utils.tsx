// INPUT: test UI trees and optional routes
// OUTPUT: rendered UI wrapped in app-level providers
// EFFECT: Recreates the planner's router, theme, and i18n context inside frontend tests
import type { ReactElement } from "react";
import { CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import "../src/i18n";

const theme = createTheme();

export function renderWithProviders(ui: ReactElement, route = "/") {
  return render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    </ThemeProvider>
  );
}
