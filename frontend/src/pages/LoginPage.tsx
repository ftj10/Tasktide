// INPUT: login or registration form fields
// OUTPUT: authentication page for sign-in and sign-up
// EFFECT: Starts or creates a planner account and stores the resulting authenticated session
import { useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import { useTranslation } from "react-i18next";
import { setAuth } from "../app/storage";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// INPUT: login success callback
// OUTPUT: authentication form UI
// EFFECT: Switches between sign-in and registration flows for the planner shell
export function LoginPage({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const { t, i18n } = useTranslation();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<{
    severity: "success" | "error";
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const currentLanguage = i18n.resolvedLanguage?.startsWith("zh") ? "zh" : "en";

  function translateAuthMessage(message: string) {
    const authMessages: Record<string, string> = {
      "Username taken": t("login.errors.usernameTaken"),
      "Invalid credentials": t("login.errors.invalidCredentials"),
      "Failed to register": t("login.errors.failedToRegister"),
      "Failed to log in": t("login.errors.failedToLogin"),
      "Something went wrong": t("login.errors.generic"),
    };

    return authMessages[message] ?? message;
  }

  function handleLanguageToggle() {
    void i18n.changeLanguage(currentLanguage === "en" ? "zh" : "en");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsLoading(true);

    const endpoint = isRegistering ? "/register" : "/login";

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (isRegistering) {
        setIsRegistering(false);
        setFeedback({
          severity: "success",
          message: t("login.status.registrationSuccess"),
        });
        setUsername("");
        setPassword("");
      } else {
        setAuth(data.username, data.role);
        onLoginSuccess();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setFeedback({
        severity: "error",
        message: translateAuthMessage(message),
      });
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: { xs: 4, sm: 8 },
        px: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 5 },
          width: "100%",
          maxWidth: 440,
          borderRadius: 5,
          border: "1px solid",
          borderColor: "divider",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
          backdropFilter: "blur(14px)",
          boxShadow: "0 30px 60px rgba(15, 23, 42, 0.12)",
        }}
      >
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Avatar
              sx={{
                width: 48,
                height: 48,
                background: "linear-gradient(135deg, #4f46e5, #0ea5e9)",
                boxShadow: "0 12px 24px rgba(79, 70, 229, 0.3)",
              }}
            >
              <TaskAltRoundedIcon />
            </Avatar>
            <Button
              variant="text"
              startIcon={<LanguageRoundedIcon />}
              onClick={handleLanguageToggle}
              sx={{ color: "text.secondary", borderRadius: 2 }}
            >
              {currentLanguage === "en" ? "中文" : "English"}
            </Button>
          </Stack>

          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
              {isRegistering ? t("login.title.register") : t("login.title.login")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              TaskTide · {t("nav.reminders")} · {t("nav.week")} · {t("nav.month")}
            </Typography>
          </Box>

          {feedback && (
            <Alert severity={feedback.severity} sx={{ borderRadius: 2 }}>
              {feedback.message}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label={t("login.fields.username")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <TextField
                fullWidth
                label={t("login.fields.password")}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  py: 1.3,
                  fontSize: "1rem",
                  background: "linear-gradient(135deg, #4f46e5, #0ea5e9)",
                  boxShadow: "0 12px 24px rgba(79, 70, 229, 0.3)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #4338ca, #0284c7)",
                    boxShadow: "0 14px 28px rgba(79, 70, 229, 0.36)",
                  },
                }}
                disabled={isLoading}
              >
                {isLoading
                  ? t("login.actions.waiting")
                  : isRegistering
                  ? t("login.actions.register")
                  : t("login.actions.login")}
              </Button>
            </Stack>
          </Box>

          <Button
            fullWidth
            variant="text"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setFeedback(null);
              setUsername("");
              setPassword("");
              setShowPassword(false);
            }}
            sx={{ color: "text.secondary" }}
          >
            {isRegistering
              ? t("login.actions.switchToLogin")
              : t("login.actions.switchToRegister")}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
