// INPUT: login or registration form fields
// OUTPUT: authentication page for sign-in and sign-up
// EFFECT: Starts or creates a planner account and stores the resulting authenticated session
import { useState } from "react";
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Alert,
  InputAdornment,
  IconButton
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useTranslation } from "react-i18next";
import { setAuth } from "../app/storage";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:2676";

// INPUT: login success callback
// OUTPUT: authentication form UI
// EFFECT: Switches between sign-in and registration flows for the planner shell
export function LoginPage({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const { t, i18n } = useTranslation();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<{ severity: "success" | "error"; message: string } | null>(null);
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
        setAuth(data.token, data.username);
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
    <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
      <Paper sx={{ p: 4, width: "100%", maxWidth: 400, textAlign: "center" }} elevation={3}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
          <Button variant="text" onClick={handleLanguageToggle} sx={{ minWidth: 52, px: 1 }}>
            {currentLanguage === "en" ? "中文" : "EN"}
          </Button>
        </Box>
        <Typography variant="h5" gutterBottom>
          {isRegistering ? t("login.title.register") : t("login.title.login")}
        </Typography>

        {feedback && (
          <Alert severity={feedback.severity} sx={{ mb: 2 }}>
            {feedback.message}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label={t("login.fields.username")}
            variant="outlined"
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <TextField
            fullWidth
            label={t("login.fields.password")}
            type={showPassword ? "text" : "password"}
            variant="outlined"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
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
            color="primary"
            sx={{ mt: 2, py: 1.5 }}
            disabled={isLoading}
          >
            {isLoading ? t("login.actions.waiting") : isRegistering ? t("login.actions.register") : t("login.actions.login")}
          </Button>
        </form>

        <Button
          fullWidth
          variant="text"
          sx={{ mt: 2 }}
          onClick={() => {
            setIsRegistering(!isRegistering);
            setFeedback(null);
            setUsername("");
            setPassword("");
            setShowPassword(false);
          }}
        >
          {isRegistering
            ? t("login.actions.switchToLogin")
            : t("login.actions.switchToRegister")}
        </Button>
      </Paper>
    </Box>
  );
}
