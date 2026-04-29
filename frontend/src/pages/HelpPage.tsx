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
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import QuestionAnswerRoundedIcon from "@mui/icons-material/QuestionAnswerRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import { useTranslation } from "react-i18next";

import type { HelpQuestion } from "../types";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import { createHelpQuestion, deleteHelpQuestion, isAdminUser, loadHelpQuestions } from "../app/storage";

export function HelpPage() {
  const { t, i18n } = useTranslation();
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
  const currentLanguage = i18n.resolvedLanguage?.startsWith("zh") ? "zh" : "en";
  const isAdmin = isAdminUser();

  const guideSteps = useMemo(
    () => [
      t("help.guides.step1"),
      t("help.guides.step2"),
      t("help.guides.step3"),
      t("help.guides.step4"),
      t("help.guides.step5"),
      t("help.guides.step6"),
      t("help.guides.step7"),
    ],
    [t]
  );

  const faqItems = useMemo(
    () => [
      { question: t("help.faq.q1.question"), answer: t("help.faq.q1.answer") },
      { question: t("help.faq.q2.question"), answer: t("help.faq.q2.answer") },
      { question: t("help.faq.q3.question"), answer: t("help.faq.q3.answer") },
      { question: t("help.faq.q4.question"), answer: t("help.faq.q4.answer") },
      { question: t("help.faq.q5.question"), answer: t("help.faq.q5.answer") },
      { question: t("help.faq.q6.question"), answer: t("help.faq.q6.answer") },
      { question: t("help.faq.q7.question"), answer: t("help.faq.q7.answer") },
      { question: t("help.faq.q8.question"), answer: t("help.faq.q8.answer") },
      { question: t("help.faq.q9.question"), answer: t("help.faq.q9.answer") },
      { question: t("help.faq.q10.question"), answer: t("help.faq.q10.answer") },
      { question: t("help.faq.q11.question"), answer: t("help.faq.q11.answer") },
      { question: t("help.faq.q12.question"), answer: t("help.faq.q12.answer") },
    ],
    [t]
  );

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
        maxWidth: 1200,
        mx: "auto",
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 1, sm: 2 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          background:
            "linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(14, 165, 233, 0.08))",
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
              boxShadow: "0 12px 28px rgba(79, 70, 229, 0.3)",
            }}
          >
            <HelpOutlineIcon sx={{ fontSize: 30 }} />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{ mb: 0.5, fontSize: { xs: "1.4rem", sm: "2rem" }, letterSpacing: "-0.02em" }}
            >
              {t("help.title")}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
            >
              {t(isAdmin ? "help.subtitleAdmin" : "help.subtitleUser")}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Stack spacing={2.5}>
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
                  <Typography variant="body1" sx={{ pt: 0.25 }}>
                    {step}
                  </Typography>
                </Stack>
              ))}
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
                    <Typography color="text.secondary">{item.answer}</Typography>
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
    </Box>
  );
}
