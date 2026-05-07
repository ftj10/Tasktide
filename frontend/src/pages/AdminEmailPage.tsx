// INPUT: current user role plus email broadcast fields
// OUTPUT: admin-only email broadcast form
// EFFECT: Sends opt-in email updates from a URL-only admin page
import { type FormEvent, useEffect, useState } from "react";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export function AdminEmailPage() {
  const { t } = useTranslation();
  const [role, setRole] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const response = await fetch(`${API_URL}/user/me`, { credentials: "include" });
      const data = await response.json();
      setRole(data.role);
    }

    void loadProfile().catch(() => setRole("USER"));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setResult("");
    setError("");

    const response = await fetch(`${API_URL}/admin/email-broadcast`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, html }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error || t("adminEmail.failed"));
      return;
    }

    setResult(t("adminEmail.sent", { count: data.sent }));
  }

  if (role !== "ADMIN") {
    return (
      <Box sx={{ px: { xs: 2, md: 0 } }}>
        <Alert severity="error">{t("adminEmail.accessDenied")}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, md: 0 } }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Typography variant="h4" fontWeight={800}>{t("adminEmail.title")}</Typography>
            {result && <Alert severity="success">{result}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label={t("adminEmail.subject")} value={subject} onChange={(event) => setSubject(event.target.value)} required />
            <TextField label={t("adminEmail.html")} value={html} onChange={(event) => setHtml(event.target.value)} multiline rows={8} required />
            <Button type="submit" variant="contained">{t("adminEmail.send")}</Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
