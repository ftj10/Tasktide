// INPUT: open/close state, import-success callback, toast notifier
// OUTPUT: two-step modal wizard — step 0: upload/paste, step 1: review drafts before import
// EFFECT: step 0 calls extract() + POST /api/syllabus/analyze; step 1 calls POST /api/tasks/batch on confirm; wizard state persisted to localStorage with 24h TTL
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

import type { Task } from "../types";
import type { SyllabusTaskDraft } from "../app/syllabusSchema";
import { transformDraft } from "../app/syllabusSchema";
import { extract } from "../app/syllabusExtraction";
import { TaskDialog } from "../components/TaskDialog";

type ReviewItem = {
  draft: SyllabusTaskDraft;
  task: Task;
  deleted: boolean;
};

type SavedDraft = {
  step: number;
  pasteText: string;
  drafts: SyllabusTaskDraft[];
  savedAt: number;
};

const STORAGE_KEY = "syllabus_wizard_draft";
const TTL_MS = 24 * 60 * 60 * 1000;

function loadDraft(): SavedDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedDraft;
    if (Date.now() - parsed.savedAt > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveDraft(draft: SavedDraft) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

function clearDraft() {
  localStorage.removeItem(STORAGE_KEY);
}

async function callAnalyze(text: string): Promise<SyllabusTaskDraft[]> {
  const res = await fetch("/api/syllabus/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("analyze failed");
  return res.json() as Promise<SyllabusTaskDraft[]>;
}

async function callBatchImport(tasks: Task[]): Promise<void> {
  const res = await fetch("/api/tasks/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tasks }),
  });
  if (!res.ok) throw new Error("batch import failed");
}

function stampBatchId(tasks: Task[], batchId: string): Task[] {
  return tasks.map((t) => ({ ...t, syllabusImportBatchId: batchId }));
}

const SOURCE_TYPE_COLOR: Record<string, "error" | "warning" | "info" | "default"> = {
  final: "error",
  midterm: "error",
  assignment: "warning",
  quiz: "warning",
  project: "warning",
  lecture: "info",
  lab: "info",
  tutorial: "info",
  prep: "default",
  other: "default",
  office_hour: "default",
  reading: "default",
};

export function SyllabusImportDialog(props: {
  open: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  showToast: (message: string, severity: "success" | "error" | "info" | "warning") => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [pasteText, setPasteText] = useState("");
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [pendingResume, setPendingResume] = useState<SavedDraft | null>(null);
  const [consentText, setConsentText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = dayjs().format("YYYY-MM-DD");

  useEffect(() => {
    if (props.open) {
      const saved = loadDraft();
      if (saved) setPendingResume(saved);
    }
  }, [props.open]);

  function applyResume(saved: SavedDraft) {
    setPasteText(saved.pasteText);
    if (saved.step === 1 && saved.drafts.length > 0) {
      setReviewItems(saved.drafts.map((draft) => ({ draft, task: transformDraft(draft), deleted: false })));
      setStep(1);
    }
    setPendingResume(null);
  }

  function dismissResume() {
    clearDraft();
    setPendingResume(null);
  }

  function handleClose() {
    clearDraft();
    setStep(0);
    setPasteText("");
    setReviewItems([]);
    setAnalyzeError(null);
    setConfirmError(null);
    setPendingResume(null);
    setConsentText(null);
    props.onClose();
  }

  async function runAnalyze(text: string) {
    setLoading(true);
    setAnalyzeError(null);
    try {
      const drafts = await callAnalyze(text);
      setReviewItems(drafts.map((draft) => ({ draft, task: transformDraft(draft), deleted: false })));
      saveDraft({ step: 1, pasteText: text, drafts, savedAt: Date.now() });
      setStep(1);
    } catch {
      setAnalyzeError(t("syllabus.analyzeError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze(input: string | File) {
    const text = typeof input === "string" ? input : await extract(input);
    setConsentText(text);
  }

  async function handleConsentConfirm() {
    if (!consentText) return;
    const text = consentText;
    setConsentText(null);
    await runAnalyze(text);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleAnalyze(file);
    e.target.value = "";
  }

  function toggleDeleted(idx: number) {
    setReviewItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, deleted: !item.deleted } : item))
    );
  }

  function openEdit(idx: number) {
    setEditingIdx(idx);
    setTaskDialogOpen(true);
  }

  async function handleConfirm() {
    const raw = reviewItems.filter((item) => !item.deleted).map((item) => item.task);
    if (raw.length === 0) return;
    const batchId = crypto.randomUUID();
    const tasksToImport = stampBatchId(raw, batchId);

    setLoading(true);
    setConfirmError(null);
    try {
      await callBatchImport(tasksToImport);
      clearDraft();
      props.showToast(t("syllabus.importSuccess", { count: tasksToImport.length }), "success");
      props.onImportSuccess();
      handleClose();
      navigate("/week");
    } catch {
      setConfirmError(t("syllabus.confirmError"));
    } finally {
      setLoading(false);
    }
  }

  const activeCount = reviewItems.filter((item) => !item.deleted).length;
  const editingItem = editingIdx !== null ? reviewItems[editingIdx] : null;

  return (
    <>
      <Dialog open={props.open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>
          {step === 0 ? t("syllabus.step1Title") : t("syllabus.step2Title")}
        </DialogTitle>
        <DialogContent>
          {pendingResume ? (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <Alert
                severity="info"
                action={
                  <Stack direction="row" spacing={1}>
                    <Button size="small" color="inherit" onClick={() => applyResume(pendingResume)}>
                      {t("syllabus.resume")}
                    </Button>
                    <Button size="small" color="inherit" onClick={dismissResume}>
                      {t("syllabus.startFresh")}
                    </Button>
                  </Stack>
                }
              >
                {t("syllabus.resumePrompt")}
              </Alert>
            </Stack>
          ) : consentText !== null ? (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {t("syllabus.consentBody")}
              </Typography>
              <Box
                component="pre"
                sx={{
                  p: 1.5,
                  bgcolor: "action.hover",
                  borderRadius: 1,
                  fontSize: "0.75rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: 240,
                  overflow: "auto",
                }}
              >
                {consentText}
              </Box>
            </Stack>
          ) : step === 0 ? (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <TextField
                label={t("syllabus.pasteLabel")}
                multiline
                minRows={6}
                fullWidth
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                disabled={loading}
              />
              <Button
                variant="outlined"
                startIcon={<UploadFileRoundedIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                {t("syllabus.uploadLabel")}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv"
                hidden
                onChange={handleFileChange}
              />
              {analyzeError && (
                <Typography variant="caption" color="error">
                  {analyzeError}
                </Typography>
              )}
            </Stack>
          ) : reviewItems.length === 0 ? (
            <Box sx={{ pt: 0.5 }}>
              <Typography color="text.secondary">{t("syllabus.noDraftsFound")}</Typography>
            </Box>
          ) : (
            <Stack spacing={1.5} sx={{ pt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {t("syllabus.reviewHeader", { count: reviewItems.length })}
              </Typography>
              {reviewItems.map((item, idx) => (
                <Card
                  key={`${item.draft.sourceText}-${idx}`}
                  variant="outlined"
                  sx={{ opacity: item.deleted ? 0.45 : 1, transition: "opacity 0.15s" }}
                >
                  <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Stack spacing={0.75}>
                      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                        <Chip
                          label={item.draft.sourceType}
                          size="small"
                          color={SOURCE_TYPE_COLOR[item.draft.sourceType] ?? "default"}
                        />
                        {item.draft.confidence === "low" && (
                          <Chip
                            label={t("syllabus.confidenceLow")}
                            size="small"
                            color="warning"
                          />
                        )}
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ textDecoration: item.deleted ? "line-through" : "none" }}
                        >
                          {item.task.title}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.draft.sourceText}
                      </Typography>
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {!item.deleted && (
                          <Button
                            size="small"
                            startIcon={<EditRoundedIcon fontSize="small" />}
                            onClick={() => openEdit(idx)}
                          >
                            {t("syllabus.editItem")}
                          </Button>
                        )}
                        <Button
                          size="small"
                          color={item.deleted ? "primary" : "error"}
                          startIcon={
                            item.deleted ? (
                              <RestoreRoundedIcon fontSize="small" />
                            ) : (
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            )
                          }
                          onClick={() => toggleDeleted(idx)}
                        >
                          {item.deleted ? t("syllabus.restoreItem") : t("syllabus.deleteItem")}
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
              {confirmError && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {confirmError}
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {pendingResume ? (
            <Button onClick={handleClose}>{t("common.cancel")}</Button>
          ) : consentText !== null ? (
            <>
              <Button onClick={() => setConsentText(null)} disabled={loading}>
                {t("syllabus.consentCancel")}
              </Button>
              <Button
                variant="contained"
                onClick={() => void handleConsentConfirm()}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : undefined}
              >
                {loading ? t("syllabus.analyzing") : t("syllabus.consentConfirm")}
              </Button>
            </>
          ) : step === 0 ? (
            <>
              <Button onClick={handleClose} disabled={loading}>
                {t("common.cancel")}
              </Button>
              <Button
                variant="contained"
                onClick={() => void handleAnalyze(pasteText)}
                disabled={loading || !pasteText.trim()}
                startIcon={loading ? <CircularProgress size={16} /> : undefined}
              >
                {loading ? t("syllabus.analyzing") : t("syllabus.analyze")}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setStep(0)} disabled={loading}>
                {t("syllabus.back")}
              </Button>
              <Button
                variant="contained"
                onClick={() => void handleConfirm()}
                disabled={loading || activeCount === 0}
                startIcon={loading ? <CircularProgress size={16} /> : undefined}
              >
                {loading
                  ? t("syllabus.importing")
                  : t("syllabus.confirmImport", { count: activeCount })}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
      {editingItem && (
        <TaskDialog
          open={taskDialogOpen}
          mode="edit"
          task={editingItem.task}
          defaultDateYmd={editingItem.task.beginDate ?? today}
          onClose={() => {
            setTaskDialogOpen(false);
            setEditingIdx(null);
          }}
          onSave={(updatedTask) => {
            if (editingIdx === null) return;
            setReviewItems((prev) =>
              prev.map((item, i) => (i === editingIdx ? { ...item, task: updatedTask } : item))
            );
            setTaskDialogOpen(false);
            setEditingIdx(null);
          }}
        />
      )}
    </>
  );
}
