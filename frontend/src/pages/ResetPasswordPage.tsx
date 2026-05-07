// INPUT: reset token and email query parameters
// OUTPUT: public password reset form
// EFFECT: Completes password reset before the user signs in
import { type FormEvent, useState } from "react";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";
  const email = params.get("email") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError(t("resetPassword.mismatch"));
      return;
    }

    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, newPassword }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error || t("resetPassword.failed"));
      return;
    }

    setMessage(t("resetPassword.success"));
  }

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
      <Paper variant="outlined" sx={{ width: "100%", maxWidth: 420, p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Typography variant="h4" fontWeight={800}>{t("resetPassword.title")}</Typography>
            {message && <Alert severity="success">{message}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label={t("resetPassword.newPassword")}
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
            <TextField
              label={t("resetPassword.confirmPassword")}
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
            <Button type="submit" variant="contained">{t("resetPassword.submit")}</Button>
            {message && <Button component={Link} to="/" variant="text">{t("resetPassword.loginLink")}</Button>}
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
