// INPUT: account/session actions, task list, import hooks, install prompt state, and avatar state
// OUTPUT: Settings page for account, language, install, import, export, and profile photo workflows
// EFFECT: Centralizes planner account and utility actions outside the main navigation shell
import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import InstallMobileRoundedIcon from "@mui/icons-material/InstallMobileRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import { useTranslation } from "react-i18next";

import type { Task } from "../types";
import {
  addSavedAccount,
  getSavedAccounts,
  getUsername,
  removeSavedAccount,
  setAuth,
} from "../app/storage";
import { importTasksFromIcs } from "../app/ics";
import { ExportIcsDialog } from "../components/ExportIcsDialog";
import { SyllabusImportDialog } from "./SyllabusImportDialog";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type SettingsPageProps = {
  tasks: Task[];
  onImportSuccess: () => void;
  showToast: (msg: string, severity: "success" | "error" | "info" | "warning") => void;
  installPrompt: BeforeInstallPromptEvent | null;
  onInstallPromptConsumed: () => void;
  onLogout: () => void;
  onLoginSuccess: () => void;
  avatarUrl: string | null;
  onAvatarChange: (url: string | null) => void;
};

const API_URL = import.meta.env.VITE_API_URL || "/api";

export function SettingsPage({
  tasks,
  onImportSuccess,
  showToast,
  installPrompt,
  onInstallPromptConsumed,
  onLogout,
  onLoginSuccess,
  avatarUrl,
  onAvatarChange,
}: SettingsPageProps) {
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [installFallback, setInstallFallback] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [syllabusImportOpen, setSyllabusImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<string[]>(() => getSavedAccounts());
  const [selectedAccount, setSelectedAccount] = useState("");
  const [switchPassword, setSwitchPassword] = useState("");
  const [switchError, setSwitchError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [email, setEmail] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [emailError, setEmailError] = useState("");
  const currentLanguage = i18n.resolvedLanguage?.startsWith("zh") ? "zh" : "en";
  const username = getUsername() || t("settings.account.unknownUser");

  function handleLanguageToggle() {
    void i18n.changeLanguage(currentLanguage === "en" ? "zh" : "en");
  }

  useEffect(() => {
    let cancelled = false;

    async function loadUserProfile() {
      const response = await fetch(`${API_URL}/user/me`, { credentials: "include" });
      if (!response.ok) return;
      const data = await response.json();
      if (cancelled) return;
      setEmail(data.email ?? "");
      setEmailNotifications(Boolean(data.emailNotifications));
    }

    void loadUserProfile().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  function handleInstallApp() {
    if (installPrompt) {
      void installPrompt.prompt();
      onInstallPromptConsumed();
      return;
    }

    setInstallFallback(
      /iPad|iPhone|iPod/.test(navigator.userAgent)
        ? t("nav.installFallback.ios")
        : t("nav.installFallback.other")
    );
  }

  async function handleIcsFile(file: File | null) {
    if (!file) return;

    try {
      const result = await importTasksFromIcs(file);
      if (result.tasks.length === 0) {
        showToast(t("today.importEmpty", { name: file.name }), "error");
        return;
      }

      onImportSuccess();
      showToast(
        result.skippedCount > 0
          ? t("today.importSuccessWithSkipped", {
              count: result.tasks.length,
              skipped: result.skippedCount,
              name: file.name,
            })
          : t("today.importSuccess", {
              count: result.tasks.length,
              name: file.name,
            }),
        "success"
      );
    } catch {
      showToast(t("today.importError", { name: file.name }), "error");
    }
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError(t("settings.account.passwordMismatch"));
      return;
    }

    const response = await fetch(`${API_URL}/user/password`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setPasswordError(data.error || t("settings.account.passwordUpdateFailed"));
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showToast(t("settings.account.passwordUpdated"), "success");
  }

  async function handleSwitchAccount(event: FormEvent) {
    event.preventDefault();
    setSwitchError("");

    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: selectedAccount, password: switchPassword }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setSwitchError(data.error || t("settings.account.switchFailed"));
      setSwitchPassword("");
      return;
    }

    setAuth(data.username, data.role);
    addSavedAccount(data.username);
    setSavedAccounts(getSavedAccounts());
    setSwitchOpen(false);
    setSelectedAccount("");
    setSwitchPassword("");
    onLoginSuccess();
  }

  function handleRemoveAccount(account: string) {
    removeSavedAccount(account);
    setSavedAccounts(getSavedAccounts());
    if (selectedAccount === account) {
      setSelectedAccount("");
      setSwitchPassword("");
    }
  }

  async function handleAvatarFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast(t("settings.account.avatar.invalidFormat"), "error");
      return;
    }

    setAvatarUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const size = 200;
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d")!;
            const scale = Math.max(size / img.width, size / img.height);
            const w = img.width * scale;
            const h = img.height * scale;
            ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
          };
          img.onerror = reject;
          img.src = reader.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      if (dataUrl.length > 262144) {
        showToast(t("settings.account.avatar.tooLarge"), "error");
        return;
      }

      const res = await fetch(`${API_URL}/user/avatar`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: dataUrl }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        showToast(data.error ?? t("settings.account.avatar.tooLarge"), "error");
        return;
      }

      onAvatarChange(dataUrl);
      showToast(t("settings.account.avatar.updated"), "success");
    } catch {
      showToast(t("settings.account.avatar.invalidFormat"), "error");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleRemoveAvatar() {
    setAvatarUploading(true);
    try {
      await fetch(`${API_URL}/user/avatar`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: null }),
      });
      onAvatarChange(null);
      showToast(t("settings.account.avatar.removed"), "success");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSaveEmail(event: FormEvent) {
    event.preventDefault();
    setEmailError("");

    const response = await fetch(`${API_URL}/user/email`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, emailNotifications }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setEmailError(data.error || t("settings.email.saveFailed"));
      return;
    }

    showToast(t("settings.email.saved"), "success");
  }

  return (
    <Box sx={{ px: { xs: 2, md: 0 }, pb: 3 }}>
      <Stack spacing={2.5}>
        <Typography variant="h4" fontWeight={800}>
          {t("settings.title")}
        </Typography>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">{t("settings.account.title")}</Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ position: "relative", display: "inline-flex" }}>
                  <Avatar
                    src={avatarUrl || undefined}
                    sx={{ width: 72, height: 72, background: "linear-gradient(135deg, #4f46e5, #0ea5e9)", fontSize: "1.75rem", fontWeight: 700 }}
                  >
                    {avatarUrl ? null : (username[0] ?? "?").toUpperCase()}
                  </Avatar>
                  <Tooltip title={t("settings.account.avatar.upload")}>
                    <IconButton
                      size="small"
                      disabled={avatarUploading}
                      onClick={() => avatarInputRef.current?.click()}
                      sx={{ position: "absolute", bottom: -4, right: -4, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", boxShadow: 1 }}
                    >
                      <CameraAltRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <input
                    ref={avatarInputRef}
                    hidden
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => { void handleAvatarFile(e.currentTarget.files?.[0] ?? null); e.currentTarget.value = ""; }}
                  />
                </Box>
                <Stack spacing={0.5}>
                  <Chip label={t("settings.account.username", { username })} sx={{ alignSelf: "flex-start" }} />
                  {avatarUrl && (
                    <Button size="small" color="error" onClick={() => void handleRemoveAvatar()} disabled={avatarUploading}>
                      {t("settings.account.avatar.remove")}
                    </Button>
                  )}
                </Stack>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button variant="contained" startIcon={<LogoutRoundedIcon />} onClick={onLogout}>
                  {t("nav.logout")}
                </Button>
                <Button variant="outlined" onClick={() => setSwitchOpen(true)}>
                  {t("settings.account.switchAccount")}
                </Button>
              </Stack>
              <Accordion variant="outlined">
                <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                  <Typography fontWeight={700}>{t("settings.account.changePassword")}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box component="form" onSubmit={handleChangePassword}>
                    <Stack spacing={1.5}>
                      {passwordError && <Alert severity="error">{passwordError}</Alert>}
                      <TextField
                        label={t("settings.account.currentPassword")}
                        type="password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        required
                      />
                      <TextField
                        label={t("settings.account.newPassword")}
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        required
                      />
                      <TextField
                        label={t("settings.account.confirmPassword")}
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        required
                      />
                      <Button type="submit" variant="contained">
                        {t("settings.account.updatePassword")}
                      </Button>
                    </Stack>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Box component="form" onSubmit={handleSaveEmail}>
              <Stack spacing={2}>
                <Typography variant="h6">{t("settings.email.title")}</Typography>
                <Typography color="text.secondary">{t("settings.email.description")}</Typography>
                {emailError && <Alert severity="error">{emailError}</Alert>}
                <TextField
                  label={t("settings.email.address")}
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (!event.target.value.trim()) {
                      setEmailNotifications(false);
                    }
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={emailNotifications}
                      disabled={!email.trim()}
                      onChange={(event) => setEmailNotifications(event.target.checked)}
                    />
                  }
                  label={t("settings.email.receive")}
                />
                <Button type="submit" variant="contained">
                  {t("common.save")}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">{t("settings.language.title")}</Typography>
              <Typography color="text.secondary">
                {t("settings.language.current", {
                  language: currentLanguage === "en" ? "English" : "中文",
                })}
              </Typography>
              <Button id="language-switch-settings" data-onboarding="language-switch-button" variant="outlined" startIcon={<LanguageRoundedIcon />} onClick={handleLanguageToggle}>
                {currentLanguage === "en" ? "中文" : "English"}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">{t("settings.install.title")}</Typography>
              {installFallback && <Alert severity="info" sx={{ whiteSpace: "pre-line" }}>{installFallback}</Alert>}
              <Button id="install-web-app-settings" data-onboarding="download-app-button" variant="outlined" startIcon={<InstallMobileRoundedIcon />} onClick={handleInstallApp}>
                {t("settings.install.action")}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">{t("settings.import.title")}</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button variant="outlined" startIcon={<UploadFileRoundedIcon />} onClick={() => fileInputRef.current?.click()}>
                  {t("today.importIcs")}
                </Button>
                <Button variant="outlined" startIcon={<MenuBookRoundedIcon />} onClick={() => setSyllabusImportOpen(true)}>
                  {t("syllabus.importButton")}
                </Button>
              </Stack>
              <input
                ref={fileInputRef}
                hidden
                type="file"
                accept=".ics,text/calendar"
                aria-label={t("today.importIcsInput")}
                onChange={(event) => {
                  void handleIcsFile(event.currentTarget.files?.[0] ?? null);
                  event.currentTarget.value = "";
                }}
              />
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">{t("settings.export.title")}</Typography>
              <Button variant="outlined" startIcon={<FileDownloadRoundedIcon />} onClick={() => setExportOpen(true)}>
                {t("today.exportIcs")}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <SyllabusImportDialog
        open={syllabusImportOpen}
        onClose={() => setSyllabusImportOpen(false)}
        onImportSuccess={onImportSuccess}
        showToast={showToast}
      />
      <ExportIcsDialog open={exportOpen} onClose={() => setExportOpen(false)} tasks={tasks} />
      <Dialog open={switchOpen} onClose={() => setSwitchOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t("settings.account.switchAccount")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {savedAccounts.length === 0 ? (
              <>
                <Alert severity="info">{t("settings.account.noSavedAccounts")}</Alert>
                <Button variant="contained" onClick={onLogout}>
                  {t("settings.account.addAccount")}
                </Button>
              </>
            ) : (
              <>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {savedAccounts.map((account) => (
                    <Chip
                      key={account}
                      label={account}
                      color={selectedAccount === account ? "primary" : "default"}
                      onClick={() => {
                        setSelectedAccount(account);
                        setSwitchPassword("");
                        setSwitchError("");
                      }}
                      onDelete={() => handleRemoveAccount(account)}
                      deleteIcon={<DeleteRoundedIcon />}
                    />
                  ))}
                </Stack>
                {selectedAccount && (
                  <Box component="form" onSubmit={handleSwitchAccount}>
                    <Stack spacing={1.5}>
                      {switchError && <Alert severity="error">{switchError}</Alert>}
                      <TextField
                        label={t("settings.account.passwordFor", { username: selectedAccount })}
                        type="password"
                        value={switchPassword}
                        onChange={(event) => setSwitchPassword(event.target.value)}
                        required
                      />
                      <Button type="submit" variant="contained">
                        {t("settings.account.switchToSelected", { username: selectedAccount })}
                      </Button>
                    </Stack>
                  </Box>
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSwitchOpen(false)}>{t("common.close")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
