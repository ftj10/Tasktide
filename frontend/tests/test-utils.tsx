import type { ReactElement } from "react";
import { CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import "../src/i18n";

const theme = createTheme();

// INPUT: ui, route
// OUTPUT: Render result wrapped with router and MUI theme
// EFFECT: Provides the same base providers used by the frontend app
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
