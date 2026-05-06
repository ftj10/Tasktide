// INPUT: authenticated help-question access plus translated help content
// OUTPUT: help center page with guides, FAQ entries, and role-scoped questions
// EFFECT: Delivers onboarding content and the help board for signed-in users and admins
import { useEffect, useMemo, useState } from "react";
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
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import QuestionAnswerRoundedIcon from "@mui/icons-material/QuestionAnswerRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import type { HelpQuestion } from "../types";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import { HelpWalkthroughModal } from "../components/HelpWalkthroughModal";
import { getHelpCenterData, type HelpAudience } from "../app/helpCenter";
import { createHelpQuestion, deleteHelpQuestion, isAdminUser, loadHelpQuestions } from "../app/storage";
import {
  disablePushNotifications,
  enablePushNotifications,
  supportsPushNotifications,
  syncPushSubscription,
} from "../app/pushNotifications";

export function HelpPage() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchParams, setSearchParams] = useSearchParams();
  const [questions, setQuestions] = useState<HelpQuestion[]>([]);
  const [draftQuestion, setDraftQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitSeverity, setSubmitSeverity] = useState<"success" | "error">("success");
  const [boardMessage, setBoardMessage] = useState("");
  const [boardSeverity, setBoardSeverity] = useState<"success" | "error">("success");
  const [deleteTarget, setDeleteTarget] = useState<HelpQuestion | undefined>();
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationSeverity, setNotificationSeverity] = useState<"success" | "info" | "error">("info");
  const [isNotificationActionRunning, setIsNotificationActionRunning] = useState(false);
  const currentLanguage = i18n.resolvedLanguage?.startsWith("zh") ? "zh" : "en";
  const isAdmin = isAdminUser();
  const deviceAudience: HelpAudience = isMobile ? "mobile" : "desktop";
  const helpCenterData = useMemo(
    () => getHelpCenterData(t).filter((item) => item.audience === "all" || item.audience === deviceAudience),
    [deviceAudience, t]
  );
  const [selectedWalkthroughId, setSelectedWalkthroughId] = useState<string | null>(
    searchParams.get("topic")
  );
  const selectedWalkthrough = helpCenterData.find((item) => item.id === selectedWalkthroughId) ?? null;

  const guideSteps = useMemo(
    () => [
      t("help.guides.step0"),
      t("help.guides.step1"),
      t("help.guides.step2"),
      t("help.guides.step3"),
      t("help.guides.step4"),
      t(isMobile ? "help.guides.step5Mobile" : "help.guides.step5Desktop"),
      t(isMobile ? "help.guides.step6Mobile" : "help.guides.step6Desktop"),
      t(isMobile ? "help.guides.step7Mobile" : "help.guides.step7Desktop"),
    ],
    [isMobile, t]
  );

  const faqItems = useMemo(
    () => [
      { question: t("help.faq.q1.question"), answer: t("help.faq.q1.answer"), audience: "all" },
      { question: t("help.faq.q2.question"), answer: t("help.faq.q2.answer"), audience: "all" },
      { question: t("help.faq.q3.question"), answer: t("help.faq.q3.answer"), audience: "all" },
      { question: t("help.faq.q4.question"), answer: t("help.faq.q4.answer"), audience: "all" },
      { question: t("help.faq.q5.question"), answer: t("help.faq.q5.answer"), audience: "all" },
      { question: t("help.faq.q6.question"), answer: t("help.faq.q6.answer"), audience: "mobile" },
      { question: t("help.faq.q7.question"), answer: t("help.faq.q7.answer"), audience: "all" },
      { question: t("help.faq.q8.question"), answer: t("help.faq.q8.answer"), audience: "all" },
      { question: t("help.faq.q9.question"), answer: t("help.faq.q9.answer"), audience: "all" },
      { question: t("help.faq.q10.question"), answer: t("help.faq.q10.answer"), audience: "desktop" },
      { question: t("help.faq.q11.question"), answer: t("help.faq.q11.answer"), audience: "all" },
      { question: t("help.faq.q12.question"), answer: t("help.faq.q12.answer"), audience: "all" },
      { question: t("help.faq.q13.question"), answer: t("help.faq.q13.answer"), audience: "mobile" },
      { question: t("help.faq.q14.question"), answer: t("help.faq.q14.answer"), audience: "mobile" },
      { question: t("help.faq.q16.question"), answer: t("help.faq.q16.answer"), audience: "all" },
      { question: t("help.faq.q17.question"), answer: t("help.faq.q17.answer"), audience: "all" },
      { question: t("help.faq.q18.question"), answer: t("help.faq.q18.answer"), audience: "all" },
      { question: t("help.faq.q19.question"), answer: t("help.faq.q19.answer"), audience: "all" },
      { question: t("help.faq.q20.question"), answer: t("help.faq.q20.answer"), audience: "all" },
    ],
    [t]
  ).filter((item) => item.audience === "all" || item.audience === deviceAudience);

  useEffect(() => {
    const topic = searchParams.get("topic");
    if (!topic) {
      setSelectedWalkthroughId(null);
      return;
    }
    if (helpCenterData.some((item) => item.id === topic)) {
      setSelectedWalkthroughId(topic);
    }
  }, [helpCenterData, searchParams]);

  useEffect(() => {
    async function fetchQuestions() {
      setIsLoading(true);
      const nextQuestions = await loadHelpQuestions();
      setQuestions(nextQuestions);
      setIsLoading(false);
    }
    void fetchQuestions();
  }, []);

  async function handleSubmitQuestion() {
    if (!draftQuestion.trim()) return;
    setIsSubmitting(true);
    setSubmitMessage("");
    try {
      const savedQuestion = await createHelpQuestion({
        question: draftQuestion.trim(),
      });
      setQuestions((current) => [savedQuestion, ...current]);
      setDraftQuestion("");
      setSubmitSeverity("success");
      setSubmitMessage(t("help.submitSuccess"));
    } catch {
      setSubmitSeverity("error");
      setSubmitMessage(t("help.submitError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteQuestion() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setBoardMessage("");
    try {
      await deleteHelpQuestion(deleteTarget.id);
      setQuestions((current) => current.filter((item) => item.id !== deleteTarget.id));
      setBoardSeverity("success");
      setBoardMessage(t("help.community.deleteSuccess"));
      setDeleteTarget(undefined);
    } catch {
      setBoardSeverity("error");
      setBoardMessage(t("help.community.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  }

  function showNotificationMessage(severity: "success" | "info" | "error", message: string) {
    setNotificationSeverity(severity);
    setNotificationMessage(message);
  }

  function handleOpenNotificationDialog() {
    setNotificationMessage("");

    if (!supportsPushNotifications()) {
      showNotificationMessage("error", t("help.taskNotifications.unsupported"));
      return;
    }

    if (Notification.permission === "denied") {
      showNotificationMessage("error", t("help.taskNotifications.denied"));
      return;
    }

    setNotificationDialogOpen(true);
  }

  async function handleEnableTaskNotifications() {
    setIsNotificationActionRunning(true);
    setNotificationMessage("");

    try {
      if (!supportsPushNotifications()) {
        showNotificationMessage("error", t("help.taskNotifications.unsupported"));
        return;
      }

      if (Notification.permission === "denied") {
        showNotificationMessage("error", t("help.taskNotifications.denied"));
        return;
      }

      if (Notification.permission === "granted") {
        await syncPushSubscription(currentLanguage);
        showNotificationMessage("success", t("help.taskNotifications.enabled"));
        setNotificationDialogOpen(false);
        return;
      }

      const enabled = await enablePushNotifications(currentLanguage);
      if (enabled) {
        showNotificationMessage("success", t("help.taskNotifications.enabled"));
        setNotificationDialogOpen(false);
        return;
      }

      showNotificationMessage("error", t("help.taskNotifications.denied"));
      setNotificationDialogOpen(false);
    } catch {
      showNotificationMessage("error", t("help.taskNotifications.enableError"));
    } finally {
      setIsNotificationActionRunning(false);
    }
  }

  async function handleDisableTaskNotifications() {
    setIsNotificationActionRunning(true);
    setNotificationMessage("");

    try {
      await disablePushNotifications();
      showNotificationMessage("success", t("help.taskNotifications.disabled"));
    } catch {
      showNotificationMessage("error", t("help.taskNotifications.disableError"));
    } finally {
      setIsNotificationActionRunning(false);
    }
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat(currentLanguage, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  }

  const sectionHeader = (icon: React.ReactNode, label: string, tone: string) => (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
      <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(tone, 0.12), color: tone }}>
        {icon}
      </Avatar>
      <Typography variant="h6" fontWeight={800}>
        {label}
      </Typography>
    </Stack>
  );

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "lg",
        minHeight: "100dvh",
        mx: "auto",
        px: { xs: 0, sm: 2, md: 3 },
        pt: { xs: 1, sm: 2, md: 3 },
        pb: { xs: "calc(64px + env(safe-area-inset-bottom))", md: 3 },
        overflowX: "hidden",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: { xs: 2, sm: 3 },
          borderRadius: { xs: 0, sm: 2 },
          border: "1px solid",
          borderColor: "divider",
          background: "#ffffff",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              width: 56,
              height: 56,
              background: "linear-gradient(135deg, #4f46e5, #0ea5e9)",
            }}
          >
            <HelpOutlineIcon sx={{ fontSize: 30 }} />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{ mb: 0.5, fontSize: { xs: "1.4rem", sm: "2rem" }, letterSpacing: 0 }}
            >
              {t("help.title")}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: { xs: "1rem", sm: "1rem" } }}
            >
              {t(isAdmin ? "help.subtitleAdmin" : "help.subtitleUser")}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Stack spacing={{ xs: 2, sm: 2.5 }}>
        <Card>
          <CardContent>
            {sectionHeader(<MenuBookRoundedIcon />, t("help.guides.title"), "#4f46e5")}
            <Stack spacing={1.25}>
              {guideSteps.map((step, index) => (
                <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
                  <Box
                    sx={{
                      flexShrink: 0,
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(135deg, #4f46e5, #0ea5e9)",
                      color: "#fff",
                      fontSize: "0.8rem",
                      fontWeight: 800,
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography variant="body1" sx={{ pt: 0.25, fontSize: { xs: "1rem", sm: "1rem" } }}>
                    {step}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {sectionHeader(<QuestionAnswerRoundedIcon />, t("help.walkthroughs.title"), "#2563eb")}
            <Stack spacing={1}>
              {helpCenterData.map((item) => (
                <Button
                  key={item.id}
                  variant="outlined"
                  onClick={() => {
                    setSelectedWalkthroughId(item.id);
                    setSearchParams({ topic: item.id });
                  }}
                  sx={{
                    justifyContent: "space-between",
                    borderRadius: 2.5,
                    px: 2,
                    py: 1.5,
                    textTransform: "none",
                    gap: 1,
                  }}
                >
                  <Typography fontWeight={700} textAlign="left">
                    {item.question}
                  </Typography>
                  <Typography variant="caption" color="primary.main" fontWeight={800}>
                    {t("help.walkthroughs.open")}
                  </Typography>
                </Button>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {sectionHeader(<NotificationsActiveOutlinedIcon />, t("help.taskNotifications.title"), "#7c3aed")}
            <Stack spacing={2}>
              <Typography color="text.secondary">
                {t("help.taskNotifications.body")}
              </Typography>
              {notificationMessage ? (
                <Alert severity={notificationSeverity} sx={{ borderRadius: 2 }}>
                  {notificationMessage}
                </Alert>
              ) : null}
              <Stack data-onboarding="notification-toggle-button" direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  variant="contained"
                  onClick={handleOpenNotificationDialog}
                  disabled={isNotificationActionRunning}
                  sx={{ borderRadius: 2.5 }}
                >
                  {t("help.taskNotifications.enable")}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => void handleDisableTaskNotifications()}
                  disabled={isNotificationActionRunning}
                  sx={{ borderRadius: 2.5 }}
                >
                  {t("help.taskNotifications.disable")}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {sectionHeader(<QuestionAnswerRoundedIcon />, t("help.faq.title"), "#0ea5e9")}
            <Stack spacing={0.75}>
              {faqItems.map((item) => (
                <Accordion
                  key={item.question}
                  disableGutters
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: "12px !important",
                    "&:before": { display: "none" },
                    overflow: "hidden",
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      "&:hover": { bgcolor: alpha("#4f46e5", 0.04) },
                    }}
                  >
                    <Typography fontWeight={700}>{item.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ bgcolor: alpha("#0f172a", 0.02) }}>
                    <Typography color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
                      {item.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {sectionHeader(<ForumRoundedIcon />, t("help.ask.title"), "#10b981")}
            <Stack spacing={2}>
              {submitMessage ? (
                <Alert severity={submitSeverity} sx={{ borderRadius: 2 }}>
                  {submitMessage}
                </Alert>
              ) : null}
              <TextField
                label={t("help.ask.field")}
                multiline
                minRows={3}
                value={draftQuestion}
                onChange={(e) => setDraftQuestion(e.target.value)}
              />
              <Box>
                <Button
                  variant="contained"
                  disabled={!draftQuestion.trim() || isSubmitting}
                  onClick={() => void handleSubmitQuestion()}
                  sx={{ borderRadius: 2.5 }}
                >
                  {t("help.ask.submit")}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {sectionHeader(
              <ForumRoundedIcon />,
              t(isAdmin ? "help.community.titleAdmin" : "help.community.titleUser"),
              "#f59e0b"
            )}
            <Alert severity={isAdmin ? "info" : "success"} sx={{ mb: 2, borderRadius: 2 }}>
              {t(isAdmin ? "help.community.scopeAdmin" : "help.community.scopeUser")}
            </Alert>
            {boardMessage ? (
              <Alert severity={boardSeverity} sx={{ mb: 2, borderRadius: 2 }}>
                {boardMessage}
              </Alert>
            ) : null}
            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={28} />
              </Box>
            ) : questions.length === 0 ? (
              <Typography color="text.secondary">{t("help.community.empty")}</Typography>
            ) : (
              <Stack spacing={1.5}>
                {questions.map((item) => (
                  <Paper
                    key={item.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: alpha("#0f172a", 0.015),
                      "&:hover": { bgcolor: alpha("#4f46e5", 0.04) },
                    }}
                  >
                    <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body1" sx={{ mb: 0.75, fontWeight: 500 }}>
                          {item.question}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t("help.community.meta", {
                            username: item.username,
                            createdAt: formatDate(item.createdAt),
                          })}
                        </Typography>
                      </Box>
                      {isAdmin ? (
                        <Button
                          color="error"
                          size="small"
                          variant="outlined"
                          disabled={isDeleting}
                          onClick={() => setDeleteTarget(item)}
                          sx={{ flexShrink: 0, borderRadius: 2 }}
                        >
                          {t("common.delete")}
                        </Button>
                      ) : null}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title={deleteTarget?.question ?? ""}
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(undefined);
        }}
        onConfirm={() => void handleDeleteQuestion()}
      />
      <HelpWalkthroughModal
        item={selectedWalkthrough}
        open={!!selectedWalkthrough}
        onClose={() => {
          setSelectedWalkthroughId(null);
          setSearchParams({});
        }}
      />
      <Dialog
        open={notificationDialogOpen}
        onClose={() => setNotificationDialogOpen(false)}
        fullScreen={isMobile}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t("help.taskNotifications.dialogTitle")}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            {t("help.taskNotifications.explanation")}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1, px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2 } }}>
          <Button fullWidth={isMobile} onClick={() => setNotificationDialogOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            fullWidth={isMobile}
            onClick={() => void handleEnableTaskNotifications()}
            disabled={isNotificationActionRunning}
          >
            {t("help.taskNotifications.confirmEnable")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
