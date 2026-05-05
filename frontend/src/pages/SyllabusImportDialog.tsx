// INPUT: open/close state, import-success callback, toast notifier
// OUTPUT: multi-step wizard — upload → method select → manual path (preferences → prompt → paste JSON) or auto path (consent → analyze) → review → batch import
// EFFECT: manual path generates a local AI prompt with no data leaving the browser; auto path calls POST /api/syllabus/analyze; review calls POST /api/tasks/batch; wizard state persisted to localStorage with 24h TTL
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
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

import type { Task } from "../types";
import type { SyllabusTaskDraft } from "../app/syllabusSchema";
import { SyllabusTaskDraftSchema, transformDraft } from "../app/syllabusSchema";
import { extract } from "../app/syllabusExtraction";
import { buildSyllabusPrompt } from "../app/syllabusPrompt";
import { TaskDialog } from "../components/TaskDialog";

export type WizardStep =
  | "upload"
  | "method"
  | "preferences"
  | "prompt"
  | "paste"
  | "consent"
  | "review";

type ReviewItem = {
  draft: SyllabusTaskDraft;
  task: Task;
  deleted: boolean;
};

type SavedDraft = {
  wizardStep: WizardStep;
  pasteText: string;
  extractedText: string;
  studyPreferences: string;
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

export function validatePastedJson(raw: string): {
  drafts: SyllabusTaskDraft[];
  errors: string[];
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      drafts: [],
      errors: ["Not valid JSON — check for missing brackets or quotes."],
    };
  }
  if (!Array.isArray(parsed)) {
    return {
      drafts: [],
      errors: [`Expected a JSON array (starting with [). Got: ${typeof parsed}`],
    };
  }
  const drafts: SyllabusTaskDraft[] = [];
  const errors: string[] = [];
  (parsed as unknown[]).forEach((item, idx) => {
    const result = SyllabusTaskDraftSchema.safeParse(item);
    if (result.success) {
      drafts.push(result.data);
    } else {
      for (const issue of result.error.issues) {
        errors.push(
          `Item ${idx + 1}: ${issue.path.join(".") || "(root)"} — ${issue.message}`
        );
      }
    }
  });
  return { drafts, errors };
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
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

const SOURCE_TYPE_COLOR: Record<
  string,
  "error" | "warning" | "info" | "default"
> = {
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

const STEP_TITLE_KEY: Record<WizardStep, string> = {
  upload: "syllabus.step1Title",
  method: "syllabus.methodTitle",
  preferences: "syllabus.preferencesTitle",
  prompt: "syllabus.promptTitle",
  paste: "syllabus.pasteJsonTitle",
  consent: "syllabus.consentTitle",
  review: "syllabus.step2Title",
};

export function SyllabusImportDialog(props: {
  open: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  showToast: (
    message: string,
    severity: "success" | "error" | "info" | "warning"
  ) => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [wizardStep, setWizardStep] = useState<WizardStep>("upload");
  const [wizardMode, setWizardMode] = useState<"manual" | "auto">("auto");
  const [pasteText, setPasteText] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [studyPreferences, setStudyPreferences] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);
  const [pastedJson, setPastedJson] = useState("");
  const [jsonErrors, setJsonErrors] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [pendingResume, setPendingResume] = useState<SavedDraft | null>(null);
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
    setExtractedText(saved.extractedText ?? saved.pasteText);
    setStudyPreferences(saved.studyPreferences ?? "");
    if (saved.wizardStep === "review" && saved.drafts.length > 0) {
      setReviewItems(
        saved.drafts.map((draft) => ({
          draft,
          task: transformDraft(draft),
          deleted: false,
        }))
      );
      setWizardStep("review");
    }
    setPendingResume(null);
  }

  function dismissResume() {
    clearDraft();
    setPendingResume(null);
  }

  function handleClose() {
    clearDraft();
    setWizardStep("upload");
    setPasteText("");
    setExtractedText("");
    setUploadedFiles([]);
    setExtracting(false);
    setStudyPreferences("");
    setGeneratedPrompt("");
    setPromptCopied(false);
    setPastedJson("");
    setJsonErrors([]);
    setFileError(null);
    setReviewItems([]);
    setAnalyzeError(null);
    setConfirmError(null);
    setPendingResume(null);
    props.onClose();
  }

  async function handleContinueUpload() {
    setExtracting(true);
    setFileError(null);
    try {
      const fileParts = await Promise.all(uploadedFiles.map((f) => extract(f)));
      const parts = [...fileParts];
      if (pasteText.trim()) parts.push(pasteText.trim());
      setExtractedText(parts.join("\n---\n"));
      setWizardStep("method");
    } catch (err) {
      setFileError(
        err instanceof Error ? err.message : t("syllabus.fileTypeError")
      );
    } finally {
      setExtracting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    setFileError(null);
    const supported = [".pdf", ".csv", ".docx"];
    const unsupported = files.filter(
      (f) => !supported.some((ext) => f.name.toLowerCase().endsWith(ext))
    );
    const valid = files.filter((f) =>
      supported.some((ext) => f.name.toLowerCase().endsWith(ext))
    );
    if (unsupported.length > 0) {
      setFileError(t("syllabus.fileTypeError"));
    }
    if (valid.length > 0) {
      setUploadedFiles((prev) => {
        const existing = new Set(prev.map((f) => f.name));
        return [...prev, ...valid.filter((f) => !existing.has(f.name))];
      });
    }
  }

  function handleChooseManual() {
    setWizardMode("manual");
    setWizardStep("preferences");
  }

  function handleChooseAuto() {
    setWizardMode("auto");
    setWizardStep("consent");
  }

  function handleContinuePreferences() {
    const prompt = buildSyllabusPrompt(extractedText, studyPreferences);
    setGeneratedPrompt(prompt);
    setPromptCopied(false);
    setWizardStep("prompt");
  }

  async function handleCopyPrompt() {
    await copyToClipboard(generatedPrompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  }

  function handleContinueFromPrompt() {
    setPastedJson("");
    setJsonErrors([]);
    setWizardStep("paste");
  }

  function handlePasteImport() {
    if (!pastedJson.trim()) {
      setJsonErrors([t("syllabus.pasteJsonError")]);
      return;
    }
    const { drafts, errors } = validatePastedJson(pastedJson);
    if (errors.length > 0) {
      setJsonErrors(errors);
      return;
    }
    if (drafts.length === 0) {
      setJsonErrors([t("syllabus.noDraftsFound")]);
      return;
    }
    setJsonErrors([]);
    const items = drafts.map((draft) => ({
      draft,
      task: transformDraft(draft),
      deleted: false,
    }));
    setReviewItems(items);
    saveDraft({
      wizardStep: "review",
      pasteText,
      extractedText,
      studyPreferences,
      drafts,
      savedAt: Date.now(),
    });
    setWizardStep("review");
  }

  async function handleConsentConfirm() {
    setLoading(true);
    setAnalyzeError(null);
    try {
      const drafts = await callAnalyze(extractedText);
      setReviewItems(
        drafts.map((draft) => ({
          draft,
          task: transformDraft(draft),
          deleted: false,
        }))
      );
      saveDraft({
        wizardStep: "review",
        pasteText,
        extractedText,
        studyPreferences,
        drafts,
        savedAt: Date.now(),
      });
      setWizardStep("review");
    } catch {
      setAnalyzeError(t("syllabus.analyzeError"));
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    switch (wizardStep) {
      case "method":
        setWizardStep("upload");
        break;
      case "preferences":
        setWizardStep("method");
        break;
      case "prompt":
        setWizardStep("preferences");
        break;
      case "paste":
        setWizardStep("prompt");
        break;
      case "consent":
        setWizardStep("method");
        break;
      case "review":
        setWizardStep(wizardMode === "manual" ? "paste" : "consent");
        break;
      default:
        break;
    }
  }

  function toggleDeleted(idx: number) {
    setReviewItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, deleted: !item.deleted } : item
      )
    );
  }

  function openEdit(idx: number) {
    setEditingIdx(idx);
    setTaskDialogOpen(true);
  }

  async function handleConfirm() {
    const raw = reviewItems
      .filter((item) => !item.deleted)
      .map((item) => item.task);
    if (raw.length === 0) return;
    const batchId = crypto.randomUUID();
    const tasksToImport = stampBatchId(raw, batchId);
    setLoading(true);
    setConfirmError(null);
    try {
      await callBatchImport(tasksToImport);
      clearDraft();
      props.showToast(
        t("syllabus.importSuccess", { count: tasksToImport.length }),
        "success"
      );
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
        <DialogTitle>{t(STEP_TITLE_KEY[wizardStep])}</DialogTitle>
        <DialogContent>
          {pendingResume ? (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <Alert
                severity="info"
                action={
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      color="inherit"
                      onClick={() => applyResume(pendingResume)}
                    >
                      {t("syllabus.resume")}
                    </Button>
                    <Button
                      size="small"
                      color="inherit"
                      onClick={dismissResume}
                    >
                      {t("syllabus.startFresh")}
                    </Button>
                  </Stack>
                }
              >
                {t("syllabus.resumePrompt")}
              </Alert>
            </Stack>
          ) : wizardStep === "upload" ? (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <TextField
                label={t("syllabus.pasteLabel")}
                multiline
                minRows={6}
                fullWidth
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
              <Button
                variant="outlined"
                startIcon={<UploadFileRoundedIcon />}
                onClick={() => fileInputRef.current?.click()}
              >
                {t("syllabus.uploadLabel")}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv,.docx"
                hidden
                multiple
                onChange={handleFileChange}
              />
              {uploadedFiles.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {uploadedFiles.map((f) => (
                    <Chip
                      key={f.name}
                      label={f.name}
                      size="small"
                      onDelete={() =>
                        setUploadedFiles((prev) =>
                          prev.filter((x) => x.name !== f.name)
                        )
                      }
                    />
                  ))}
                </Stack>
              )}
              {fileError && <Alert severity="error">{fileError}</Alert>}
            </Stack>
          ) : wizardStep === "method" ? (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleChooseManual}
                sx={{ justifyContent: "flex-start", textAlign: "left", p: 2 }}
              >
                <Stack spacing={0.5} alignItems="flex-start">
                  <Typography variant="subtitle2">
                    {t("syllabus.methodManual")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("syllabus.methodManualDesc")}
                  </Typography>
                </Stack>
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleChooseAuto}
                sx={{ justifyContent: "flex-start", textAlign: "left", p: 2 }}
              >
                <Stack spacing={0.5} alignItems="flex-start">
                  <Typography variant="subtitle2">
                    {t("syllabus.methodAuto")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("syllabus.methodAutoDesc")}
                  </Typography>
                </Stack>
              </Button>
            </Stack>
          ) : wizardStep === "preferences" ? (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <TextField
                label={t("syllabus.preferencesLabel")}
                placeholder={t("syllabus.preferencesPlaceholder")}
                multiline
                minRows={3}
                fullWidth
                value={studyPreferences}
                onChange={(e) => setStudyPreferences(e.target.value)}
              />
              <Typography variant="caption" color="text.secondary">
                {t("syllabus.preferencesHint")}
              </Typography>
            </Stack>
          ) : wizardStep === "prompt" ? (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <Alert severity="info" icon={false}>
                {t("syllabus.promptPrivacy")}
              </Alert>
              <Button
                variant="outlined"
                startIcon={
                  promptCopied ? (
                    <CheckRoundedIcon />
                  ) : (
                    <ContentCopyRoundedIcon />
                  )
                }
                onClick={() => void handleCopyPrompt()}
                color={promptCopied ? "success" : "primary"}
                data-testid="copy-prompt-button"
              >
                {promptCopied
                  ? t("syllabus.promptCopied")
                  : t("syllabus.promptCopy")}
              </Button>
              <Box
                component="pre"
                sx={{
                  p: 1.5,
                  bgcolor: "action.hover",
                  borderRadius: 1,
                  fontSize: "0.72rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: 280,
                  overflow: "auto",
                }}
              >
                {generatedPrompt}
              </Box>
            </Stack>
          ) : wizardStep === "paste" ? (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <TextField
                label={t("syllabus.pasteJsonLabel")}
                multiline
                minRows={8}
                fullWidth
                value={pastedJson}
                onChange={(e) => {
                  setPastedJson(e.target.value);
                  if (jsonErrors.length > 0) setJsonErrors([]);
                }}
                error={jsonErrors.length > 0}
              />
              {jsonErrors.length > 0 && (
                <Stack spacing={0.5}>
                  {jsonErrors.map((err, i) => (
                    <Typography key={i} variant="caption" color="error">
                      {err}
                    </Typography>
                  ))}
                </Stack>
              )}
            </Stack>
          ) : wizardStep === "consent" ? (
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
                {extractedText}
              </Box>
              {analyzeError && (
                <Typography variant="caption" color="error">
                  {analyzeError}
                </Typography>
              )}
            </Stack>
          ) : reviewItems.length === 0 ? (
            <Box sx={{ pt: 0.5 }}>
              <Typography color="text.secondary">
                {t("syllabus.noDraftsFound")}
              </Typography>
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
                  sx={{
                    opacity: item.deleted ? 0.45 : 1,
                    transition: "opacity 0.15s",
                  }}
                >
                  <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Stack spacing={0.75}>
                      <Stack
                        direction="row"
                        spacing={0.75}
                        alignItems="center"
                        flexWrap="wrap"
                      >
                        <Chip
                          label={item.draft.sourceType}
                          size="small"
                          color={
                            SOURCE_TYPE_COLOR[item.draft.sourceType] ??
                            "default"
                          }
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
                          sx={{
                            textDecoration: item.deleted
                              ? "line-through"
                              : "none",
                          }}
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
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
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
                          {item.deleted
                            ? t("syllabus.restoreItem")
                            : t("syllabus.deleteItem")}
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
          ) : wizardStep === "upload" ? (
            <>
              <Button onClick={handleClose}>{t("common.cancel")}</Button>
              <Button
                variant="contained"
                onClick={() => void handleContinueUpload()}
                disabled={extracting || (!pasteText.trim() && uploadedFiles.length === 0)}
                startIcon={extracting ? <CircularProgress size={16} /> : undefined}
              >
                {t("syllabus.next")}
              </Button>
            </>
          ) : wizardStep === "method" ? (
            <Button onClick={goBack}>{t("syllabus.back")}</Button>
          ) : wizardStep === "preferences" ? (
            <>
              <Button onClick={goBack}>{t("syllabus.back")}</Button>
              <Button variant="contained" onClick={handleContinuePreferences}>
                {t("syllabus.next")}
              </Button>
            </>
          ) : wizardStep === "prompt" ? (
            <>
              <Button onClick={goBack}>{t("syllabus.back")}</Button>
              <Button variant="contained" onClick={handleContinueFromPrompt}>
                {t("syllabus.promptNext")}
              </Button>
            </>
          ) : wizardStep === "paste" ? (
            <>
              <Button onClick={goBack}>{t("syllabus.back")}</Button>
              <Button
                variant="contained"
                onClick={handlePasteImport}
                disabled={!pastedJson.trim()}
              >
                {t("syllabus.pasteJsonNext")}
              </Button>
            </>
          ) : wizardStep === "consent" ? (
            <>
              <Button onClick={goBack} disabled={loading}>
                {t("syllabus.back")}
              </Button>
              <Button
                variant="contained"
                onClick={() => void handleConsentConfirm()}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : undefined}
              >
                {loading
                  ? t("syllabus.analyzing")
                  : t("syllabus.consentConfirm")}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={goBack} disabled={loading}>
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
              prev.map((item, i) =>
                i === editingIdx ? { ...item, task: updatedTask } : item
              )
            );
            setTaskDialogOpen(false);
            setEditingIdx(null);
          }}
        />
      )}
    </>
  );
}
