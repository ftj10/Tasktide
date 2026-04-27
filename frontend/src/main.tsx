// INPUT: browser root element plus shared frontend providers
// OUTPUT: mounted React application
// EFFECT: Boots the planner shell with a modernized theme, router, and localization support
import React from "react";
import "./i18n";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CssBaseline } from "@mui/material";
import { alpha, createTheme, ThemeProvider } from "@mui/material/styles";
import { BrowserRouter } from "react-router-dom";

// INPUT: design tokens for the planner UI
// OUTPUT: shared MUI theme
// EFFECT: Centralizes palette, typography, shape, and component defaults used across the app
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#4f46e5",
      light: "#818cf8",
      dark: "#3730a3",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#0ea5e9",
      light: "#38bdf8",
      dark: "#0369a1",
    },
    success: { main: "#10b981", dark: "#047857" },
    warning: { main: "#f59e0b" },
    error: { main: "#ef4444" },
    info: { main: "#0ea5e9" },
    background: {
      default: "#f4f6fb",
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#475569",
    },
    divider: "rgba(15, 23, 42, 0.08)",
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      '"Inter", "Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, -apple-system, sans-serif',
    h4: { fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700, letterSpacing: "-0.015em" },
    h6: { fontWeight: 700, letterSpacing: "-0.01em" },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "radial-gradient(1200px 600px at 10% -10%, rgba(79, 70, 229, 0.08), transparent 60%), radial-gradient(900px 500px at 110% 10%, rgba(14, 165, 233, 0.08), transparent 60%), #f4f6fb",
          minHeight: "100vh",
        },
        'body[style*="overflow: hidden"] .mobile-bottom-navigation': {
          display: "none !important",
        },
        'body[style*="overflow: hidden"] .mobile-bottom-navigation-bar': {
          display: "none !important",
        },
        "*::-webkit-scrollbar": { width: 10, height: 10 },
        "*::-webkit-scrollbar-thumb": {
          background: "rgba(15, 23, 42, 0.18)",
          borderRadius: 8,
        },
        "*::-webkit-scrollbar-thumb:hover": {
          background: "rgba(15, 23, 42, 0.3)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 16,
        },
        containedPrimary: {
          boxShadow: "0 8px 20px rgba(79, 70, 229, 0.25)",
          "&:hover": { boxShadow: "0 12px 26px rgba(79, 70, 229, 0.32)" },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 6px 20px rgba(15, 23, 42, 0.06)",
          border: `1px solid ${alpha("#0f172a", 0.06)}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: "saturate(180%) blur(14px)",
          backgroundImage:
            "linear-gradient(135deg, rgba(79, 70, 229, 0.95), rgba(14, 165, 233, 0.92))",
          boxShadow: "0 10px 30px rgba(79, 70, 229, 0.18)",
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          background: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(14px)",
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          "&.Mui-selected": { color: "#4f46e5" },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 18,
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 10,
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
