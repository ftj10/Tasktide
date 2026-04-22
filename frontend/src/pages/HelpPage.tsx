// INPUT: authenticated help-question access plus translated help content
// OUTPUT: help center page with guides, FAQ entries, and shared questions
// EFFECT: Delivers onboarding content and the public question board for signed-in users
import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";

import type { HelpQuestion } from "../types";
import { createHelpQuestion, loadHelpQuestions } from "../app/storage";

export function HelpPage() {
  const { t, i18n } = useTranslation();
  const [questions, setQuestions] = useState<HelpQuestion[]>([]);
  const [draftQuestion, setDraftQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const currentLanguage = i18n.resolvedLanguage?.startsWith("zh") ? "zh" : "en";

  const guideSteps = useMemo(() => ([
    t("help.guides.step1"),
    t("help.guides.step2"),
    t("help.guides.step3"),
    t("help.guides.step4"),
    t("help.guides.step5"),
  ]), [t]);

  const faqItems = useMemo(() => ([
    { question: t("help.faq.q1.question"), answer: t("help.faq.q1.answer") },
    { question: t("help.faq.q2.question"), answer: t("help.faq.q2.answer") },
    { question: t("help.faq.q3.question"), answer: t("help.faq.q3.answer") },
    { question: t("help.faq.q4.question"), answer: t("help.faq.q4.answer") },
    { question: t("help.faq.q5.question"), answer: t("help.faq.q5.answer") },
    { question: t("help.faq.q6.question"), answer: t("help.faq.q6.answer") },
  ]), [t]);

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
    const nextQuestion: HelpQuestion = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      username: "",
      question: draftQuestion.trim(),
      createdAt: new Date().toISOString(),
    };
    await createHelpQuestion({
      id: nextQuestion.id,
      question: nextQuestion.question,
      createdAt: nextQuestion.createdAt,
    });
    const nextQuestions = await loadHelpQuestions();
    setQuestions(nextQuestions);
    setDraftQuestion("");
    setSubmitMessage(t("help.submitSuccess"));
    setIsSubmitting(false);
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

  return (
    <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 1, sm: 2 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, fontSize: { xs: "1.4rem", sm: "2rem" } }}>{t("help.title")}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: "0.92rem", sm: "1rem" } }}>{t("help.subtitle")}</Typography>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>{t("help.guides.title")}</Typography>
            <Stack spacing={1.5}>
              {guideSteps.map((step, index) => (
                <Typography key={step} variant="body1">
                  {index + 1}. {step}
                </Typography>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>{t("help.faq.title")}</Typography>
            <Stack spacing={1}>
              {faqItems.map((item) => (
                <Accordion key={item.question} disableGutters>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight="bold">{item.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography color="text.secondary">{item.answer}</Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>{t("help.ask.title")}</Typography>
            <Stack spacing={2}>
              {submitMessage ? <Alert severity="success">{submitMessage}</Alert> : null}
              <TextField
                label={t("help.ask.field")}
                multiline
                minRows={3}
                value={draftQuestion}
                onChange={(e) => setDraftQuestion(e.target.value)}
              />
              <Box>
                <Button variant="contained" disabled={!draftQuestion.trim() || isSubmitting} onClick={() => void handleSubmitQuestion()}>
                  {t("help.ask.submit")}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>{t("help.community.title")}</Typography>
            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={28} />
              </Box>
            ) : questions.length === 0 ? (
              <Typography color="text.secondary">{t("help.community.empty")}</Typography>
            ) : (
              <Stack spacing={2}>
                {questions.map((item) => (
                  <Box key={item.id} sx={{ pb: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Typography variant="body1" sx={{ mb: 0.75 }}>{item.question}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("help.community.meta", { username: item.username, createdAt: formatDate(item.createdAt) })}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
