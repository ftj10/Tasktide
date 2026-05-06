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
import { registerTaskTideServiceWorker } from "./app/serviceWorker";

registerTaskTideServiceWorker();

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
      '"Plus Jakarta Sans", "Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, -apple-system, sans-serif',
    h4: { fontWeight: 700, letterSpacing: 0 },
    h5: { fontWeight: 700, letterSpacing: 0 },
    h6: { fontWeight: 700, letterSpacing: 0 },
    body1: { fontSize: "1rem" },
    body2: { fontSize: "0.875rem" },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "@import": "url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap')",
        html: {
          overflowX: "hidden",
          backgroundColor: "#f4f6fb",
        },
        body: {
          background: "#f4f6fb",
          minHeight: "100dvh",
          overflowX: "hidden",
        },
        "#root": {
          minHeight: "100dvh",
          overflowX: "hidden",
        },
        "button, [role='button'], a, .MuiButtonBase-root": {
          cursor: "pointer",
        },
        "@media (max-width: 600px)": {
          ".MuiTypography-body1, .MuiTypography-body2, .MuiInputBase-input, .MuiButton-root": {
            fontSize: "1rem",
          },
        },
        ".MuiButtonBase-root": {
          minWidth: 44,
          minHeight: 44,
          transition: "background-color 180ms ease, color 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
        },
        ".MuiButtonBase-root.Mui-focusVisible": {
          outline: "3px solid rgba(79, 70, 229, 0.35)",
          outlineOffset: 2,
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
          minHeight: 44,
        },
        containedPrimary: {
          boxShadow: "none",
          "&:hover": { boxShadow: "0 2px 8px rgba(15,23,42,0.08)" },
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
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
          border: `1px solid ${alpha("#0f172a", 0.06)}`,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: ({ theme }) => ({
          [theme.breakpoints.down("sm")]: {
            padding: 16,
            "&:last-child": {
              paddingBottom: 16,
            },
          },
        }),
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage:
            "linear-gradient(135deg, #4f46e5, #0ea5e9)",
          boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          width: "100%",
          minHeight: 64,
          paddingBottom: "env(safe-area-inset-bottom)",
          background: "#ffffff",
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          flex: 1,
          minWidth: 0,
          maxWidth: "none",
          padding: "6px 2px 8px",
          "&.Mui-selected": { color: "#4f46e5" },
        },
        label: {
          fontSize: "0.65rem",
          lineHeight: 1.15,
          whiteSpace: "nowrap",
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
        paper: ({ theme }) => ({
          borderRadius: 18,
          [theme.breakpoints.down("sm")]: {
            width: "100%",
            maxWidth: "100%",
            height: "100%",
            maxHeight: "100%",
            margin: 0,
            borderRadius: 0,
          },
        }),
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          minHeight: 48,
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
    MuiTooltip: {
      defaultProps: {
        arrow: true,
        enterTouchDelay: 500,
        leaveTouchDelay: 2000,
        enterDelay: 300,
      },
      styleOverrides: {
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          color: "#f8fafc",
          fontSize: "0.78rem",
          fontWeight: 500,
          padding: "6px 12px",
          borderRadius: 8,
          maxWidth: 200,
          boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
        },
        arrow: {
          color: "rgba(15, 23, 42, 0.9)",
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
