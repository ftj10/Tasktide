// INPUT: task collection, retained completion history, and selected date route state
// OUTPUT: Today view with grouped tasks and task action dialogs
// EFFECT: Drives the daily planning feature, including completion, rescheduling, map launch, and task CRUD flows
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import EventIcon from "@mui/icons-material/Event";
import MapIcon from "@mui/icons-material/Map";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";

import type { Task } from "../types";
import {
  productivityStatsForDate,
  tasksForDate,
} from "../app/taskLogic";
import { ymd } from "../app/date";
import { TaskDialog } from "../components/TaskDialog";
import { ConfirmDoneDialog } from "../components/ConfirmDoneDialog";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import { ConfirmAllDoneDialog } from "../components/ConfirmAllDoneDialog";
import {
  completeTaskInCollection,
  getRepeatFrequency,
  getTaskOccurrence,
  isOneTimeTask,
  isRecurringTask,
  normalizeTask,
  removeTaskFromCollection,
  saveTaskCollection,
  type TaskSaveScope,
} from "../app/tasks";
import { getPriorityAccent } from "../app/priorities";
import { parseIcsTasks } from "../app/ics";
import { ExportIcsDialog } from "../components/ExportIcsDialog";

export function TodayPage(props: {
  tasks: Task[];
  setTasks: (next: Task[]) => void;
  onTaskDialogVisibilityChange?: (open: boolean) => void;
  showToast?: (message: string, severity?: "success" | "error" | "info" | "warning") => void;
}) {
  const { tasks, setTasks, onTaskDialogVisibilityChange, showToast } = props;
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlDate = searchParams.get("date");
  const currentLanguage = i18n.resolvedLanguage?.startsWith("zh") ? "zh" : "en";

  const selectedDay = urlDate || ymd(dayjs());

  function updateSelectedDay(nextDay: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("date", nextDay);
      return next;
    });
  }

  const title = useMemo(() => {
    return new Intl.DateTimeFormat(currentLanguage, {
      weekday: "long",
      month: "short",
      day: "numeric",
    }).format(dayjs(selectedDay).toDate());
  }, [currentLanguage, selectedDay]);

  const isTodayView = selectedDay === ymd(dayjs());

  const { allDayTasks, timedTasks } = useMemo(() => {
    const raw = tasksForDate(tasks, selectedDay);
    const allDay = raw
      .filter((t) => !t.startTime)
      .sort((a, b) => (a.emergency ?? 5) - (b.emergency ?? 5));
    const timed = raw
      .filter((t) => !!t.startTime)
      .sort((a, b) => a.startTime!.localeCompare(b.startTime!));

    return { allDayTasks: allDay, timedTasks: timed };
  }, [tasks, selectedDay]);

  const completedTaskCount = useMemo(
    () => productivityStatsForDate(tasks, selectedDay).completedCount,
    [tasks, selectedDay]
  );

  const totalTasks = allDayTasks.length + timedTasks.length;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  const [editingSourceTask, setEditingSourceTask] = useState<Task | undefined>();
  const [markDoneTask, setMarkDoneTask] = useState<Task | undefined>();
  const [deleteTask, setDeleteTask] = useState<{
    task: Task;
    scope: TaskSaveScope;
    sourceTask?: Task;
    occurrenceDateYmd?: string;
  } | undefined>();
  const [allDoneOpen, setAllDoneOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  useEffect(() => {
    onTaskDialogVisibilityChange?.(dialogOpen);
    return () => {
      onTaskDialogVisibilityChange?.(false);
    };
  }, [dialogOpen, onTaskDialogVisibilityChange]);

  function closeTaskEditor() {
    setDialogOpen(false);
    setEditing(undefined);
    setEditingSourceTask(undefined);
  }

  function upsert(task: Task, scope: TaskSaveScope = "series") {
    setTasks(
      saveTaskCollection(tasks, task, {
        editingSourceTask,
        scope: editingSourceTask && isRecurringTask(editingSourceTask) ? scope : "series",
        occurrenceDateYmd: selectedDay,
      })
    );
    closeTaskEditor();
  }

  function handleTaskSave(task: Task, scope: TaskSaveScope = "series") {
    const isEditing = !!editing;
    upsert(task, scope);
    showToast?.(isEditing ? t("toast.taskUpdated") : t("toast.taskCreated"));
  }

  function remove(taskId: string, scope: TaskSaveScope = "series", sourceTask?: Task, occurrenceDateYmd?: string) {
    setTasks(
      removeTaskFromCollection(tasks, taskId, {
        editingSourceTask: sourceTask,
        scope,
        occurrenceDateYmd,
        updatedAt: new Date().toISOString(),
      })
    );
    setDeleteTask(undefined);
    closeTaskEditor();
    showToast?.(t("toast.taskDeleted"), "info");
  }

  function doMarkDone(task: Task) {
    const completedAt = new Date().toISOString();
    setTasks(
      completeTaskInCollection(tasks, task.id, {
        completedAt,
        occurrenceDateYmd: isRecurringTask(task) ? selectedDay : undefined,
        updatedAt: completedAt,
      })
    );
    setMarkDoneTask(undefined);
    showToast?.(t("toast.taskDone"));
  }

  function markAllDone() {
    const completionAt = new Date().toISOString();
    const raw = tasksForDate(tasks, selectedDay);
    let nextTasks = tasks;

    for (const task of raw) {
      nextTasks = completeTaskInCollection(nextTasks, task.id, {
        completedAt: completionAt,
        occurrenceDateYmd: isRecurringTask(task) ? selectedDay : undefined,
        updatedAt: completionAt,
      });
    }

    setTasks(nextTasks);
    setAllDoneOpen(false);
    showToast?.(t("toast.allTasksDone"));
  }

  function moveTemporaryToToday(task: Task) {
    if (!isOneTimeTask(task)) return;
    const todayYmd = ymd(dayjs());
    const durationDays = dayjs(task.endDate ?? task.beginDate ?? todayYmd).diff(dayjs(task.beginDate ?? todayYmd), "day");
    upsert({
      ...task,
      beginDate: todayYmd,
      endDate: dayjs(todayYmd).add(durationDays, "day").format("YYYY-MM-DD"),
      date: todayYmd,
      completedAt: null,
      updatedAt: new Date().toISOString(),
    });
  }

  function moveTemporaryToTomorrow(task: Task) {
    if (!isOneTimeTask(task)) return;
    const tomorrowYmd = ymd(dayjs(selectedDay).add(1, "day"));
    const durationDays = dayjs(task.endDate ?? task.beginDate ?? tomorrowYmd).diff(dayjs(task.beginDate ?? tomorrowYmd), "day");
    upsert({
      ...task,
      beginDate: tomorrowYmd,
      endDate: dayjs(tomorrowYmd).add(durationDays, "day").format("YYYY-MM-DD"),
      date: tomorrowYmd,
      completedAt: null,
      updatedAt: new Date().toISOString(),
    });
  }

  function getTaskTypeLabel(task: Task) {
    const frequency = getRepeatFrequency(task);
    if (frequency === "DAILY") return t("today.taskTypes.daily");
    if (frequency === "WEEKLY") return t("today.taskTypes.weekly");
    if (frequency === "MONTHLY") return t("today.taskTypes.monthly");
    if (frequency === "YEARLY") return t("today.taskTypes.yearly");
    return t("today.taskTypes.once");
  }

  function formatTaskTime(value: string) {
    return new Intl.DateTimeFormat(currentLanguage, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(`2000-01-01T${value}`));
  }

  const openMap = (task: Task) => {
    if (!task.location) return;
    const query = encodeURIComponent(task.location);
    let url = "";

    if (task.mapProvider === "apple") {
      url = `https://maps.apple.com/?q=${query}`;
    } else if (task.mapProvider === "baidu") {
      url = `https://api.map.baidu.com/geocoder?address=${query}&output=html`;
    } else {
      url = `https://maps.google.com/?q=${query}`;
    }

    window.open(url, "_blank");
  };

  function openTaskEditor(task: Task) {
    const sourceTask = tasks.find((item) => item.id === task.id);
    if (!sourceTask) return;
    setEditingSourceTask(sourceTask);
    setEditing(getTaskOccurrence(sourceTask, selectedDay) ?? normalizeTask(sourceTask));
    setDialogOpen(true);
  }

  function mergeImportedTasks(importedTasks: Task[]) {
    const importedById = new Map(importedTasks.map((task) => [task.id, task]));
    return [
      ...tasks.filter((task) => !importedById.has(task.id)),
      ...importedTasks,
    ];
  }

  async function importIcsFile(file: File | null) {
    if (!file) return;

    try {
      const { tasks: importedTasks, skippedCount } = parseIcsTasks(await file.text());
      if (importedTasks.length === 0) {
        showToast?.(t("today.importEmpty", { name: file.name }), "error");
        return;
      }

      setTasks(mergeImportedTasks(importedTasks));
      showToast?.(
        skippedCount > 0
          ? t("today.importSuccessWithSkipped", {
            count: importedTasks.length,
            skipped: skippedCount,
            name: file.name,
          })
          : t("today.importSuccess", {
            count: importedTasks.length,
            name: file.name,
          }),
        "success"
      );
    } catch {
      showToast?.(t("today.importError", { name: file.name }), "error");
    }
  }

  const renderTaskCard = (task: Task) => {
    const color = getPriorityAccent(task.emergency ?? 5);
    const isToday = selectedDay === ymd(dayjs());
    const isTomorrow = selectedDay === ymd(dayjs().add(1, "day"));

    return (
      <Card
        key={task.id}
        sx={{
          mb: 1.25,
          position: "relative",
          overflow: "hidden",
          borderRadius: 2,
          transition: "transform 180ms ease, box-shadow 180ms ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
          },
          "&::before": {
            content: '""',
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 6,
            background: `linear-gradient(180deg, ${color}, ${alpha(color, 0.6)})`,
          },
          background: `linear-gradient(135deg, ${alpha(color, 0.04)}, rgba(255,255,255,1) 60%)`,
        }}
      >
        <CardContent sx={{ p: "16px !important", pl: "22px !important" }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
          >
            <Box sx={{ maxWidth: "100%", overflow: "hidden", minWidth: 0, flexGrow: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography
                  variant="h6"
                  sx={{
                    wordBreak: "break-word",
                    fontSize: { xs: "1rem", sm: "1.1rem" },
                    fontWeight: 700,
                  }}
                >
                  {task.title}
                </Typography>
                <Chip
                  label={getTaskTypeLabel(task)}
                  size="small"
                  sx={{
                    height: 22,
                    bgcolor: alpha(color, 0.12),
                    color: color,
                    fontWeight: 700,
                    fontSize: "0.7rem",
                  }}
                />
                <Chip
                  label={`P${task.emergency ?? 5}`}
                  size="small"
                  sx={{
                    height: 22,
                    bgcolor: alpha(color, 0.9),
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.7rem",
                  }}
                />
              </Stack>

              {task.startTime && (
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.75 }}>
                  <AccessTimeIcon sx={{ fontSize: 16, color }} />
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{ fontSize: { xs: "0.85rem", sm: "0.9rem" }, color: "text.primary" }}
                  >
                    {formatTaskTime(task.startTime)}
                    {task.endTime && ` – ${formatTaskTime(task.endTime)}`}
                  </Typography>
                </Stack>
              )}

              {task.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.75,
                    whiteSpace: "pre-wrap",
                    fontSize: { xs: "0.82rem", sm: "0.88rem" },
                  }}
                >
                  {task.description}
                </Typography>
              )}

              {task.location && (
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.75 }}>
                  <LocationOnOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.82rem", sm: "0.88rem" } }}
                  >
                    {task.location}
                  </Typography>
                </Stack>
              )}
            </Box>

            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              sx={{ mt: { xs: 1, sm: 0 }, flexShrink: 0 }}
            >
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => openTaskEditor(task)}
                sx={{ borderRadius: 2 }}
              >
                {t("today.modify")}
              </Button>
              {isOneTimeTask(task) && !isToday && (
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  startIcon={<EventIcon />}
                  onClick={() => moveTemporaryToToday(task)}
                  sx={{ borderRadius: 2 }}
                >
                  {t("today.toToday")}
                </Button>
              )}
              {isOneTimeTask(task) && !isTomorrow && (
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  startIcon={<EventIcon />}
                  onClick={() => moveTemporaryToTomorrow(task)}
                  sx={{ borderRadius: 2 }}
                >
                  {t("today.toTomorrow")}
                </Button>
              )}
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckIcon />}
                onClick={() => setMarkDoneTask(task)}
                sx={{ borderRadius: 2 }}
              >
                {t("common.done")}
              </Button>
              {task.location && (
                <Button
                  size="small"
                  variant="contained"
                  color="secondary"
                  startIcon={<MapIcon />}
                  onClick={() => openMap(task)}
                  sx={{ borderRadius: 2 }}
                >
                  {t("today.map")}
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  };

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
          mb: 2.5,
          p: { xs: 2, sm: 2.5 },
          borderRadius: { xs: 0, sm: 2 },
          border: "1px solid",
          borderColor: "divider",
          background: "#ffffff",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={{ xs: 2, sm: 3 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <IconButton
              aria-label={t("today.previousDay")}
              onClick={() => updateSelectedDay(ymd(dayjs(selectedDay).subtract(1, "day")))}
              sx={{
                bgcolor: "rgba(255,255,255,0.7)",
                border: "1px solid",
                borderColor: "divider",
                "&:hover": { bgcolor: "rgba(255,255,255,0.95)" },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ minWidth: { xs: 0, sm: 180 }, textAlign: "center" }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}
              >
                {isTodayView ? t("nav.today") : ""}
              </Typography>
              <Typography
                variant="h6"
                fontWeight={800}
                sx={{ fontSize: { xs: "1.05rem", sm: "1.35rem" }, lineHeight: 1.15 }}
              >
                {title}
              </Typography>
            </Box>
            <IconButton
              aria-label={t("today.nextDay")}
              onClick={() => updateSelectedDay(ymd(dayjs(selectedDay).add(1, "day")))}
              sx={{
                bgcolor: "rgba(255,255,255,0.7)",
                border: "1px solid",
                borderColor: "divider",
                "&:hover": { bgcolor: "rgba(255,255,255,0.95)" },
              }}
            >
              <ArrowForwardIcon />
            </IconButton>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" useFlexGap>
            <Button
              variant="outlined"
              startIcon={<TodayRoundedIcon />}
              onClick={() => updateSelectedDay(ymd(dayjs()))}
              sx={{ borderRadius: 2.5 }}
            >
              {t("today.goToToday")}
            </Button>
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileRoundedIcon />}
              sx={{ borderRadius: 2.5 }}
            >
              {t("today.importIcs")}
              <input
                hidden
                type="file"
                accept=".ics,text/calendar"
                aria-label={t("today.importIcsInput")}
                onChange={(event) => {
                  void importIcsFile(event.currentTarget.files?.[0] ?? null);
                  event.currentTarget.value = "";
                }}
              />
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadRoundedIcon />}
              onClick={() => setExportDialogOpen(true)}
              sx={{ borderRadius: 2.5 }}
            >
              {t("today.exportIcs")}
            </Button>
            <Button
              id="today-add-task-button"
              data-onboarding="add-task-button"
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => {
                setEditing(undefined);
                setEditingSourceTask(undefined);
                setDialogOpen(true);
              }}
              sx={{ borderRadius: 2.5 }}
            >
              {t("today.addTask")}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
        <Chip
          label={t("today.activeCount", { count: totalTasks })}
          sx={{
            fontWeight: 700,
            bgcolor: alpha("#4f46e5", 0.08),
            color: "primary.main",
            border: "1px solid",
            borderColor: alpha("#4f46e5", 0.2),
          }}
        />
        <Chip
          label={t("today.completedCount", { count: completedTaskCount })}
          variant="outlined"
          sx={{
            fontWeight: 700,
            color: "#10b981",
            borderColor: alpha("#10b981", 0.4),
            bgcolor: alpha("#10b981", 0.06),
          }}
        />
      </Stack>

      {allDayTasks.length === 0 && timedTasks.length === 0 ? (
        <Paper
          id="today-empty-state"
          data-onboarding="task-list"
          elevation={0}
          sx={{
            mt: 4,
            textAlign: "center",
            py: 8,
            borderRadius: { xs: 0, sm: 2 },
            border: "1px dashed",
            borderColor: "divider",
            bgcolor: "#ffffff",
          }}
        >
          <Box sx={{ color: "text.disabled", mb: 1.5, display: "flex", justifyContent: "center" }}>
            <CheckCircleOutlineRoundedIcon sx={{ fontSize: 48 }} />
          </Box>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
            {t("today.noTasks")}
          </Typography>
          <Button
            id="today-empty-add-task-button"
            data-onboarding="add-task-button"
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => {
              setEditing(undefined);
              setEditingSourceTask(undefined);
              setDialogOpen(true);
            }}
            sx={{ mt: 1, borderRadius: 2.5 }}
          >
            {t("today.addTask")}
          </Button>
        </Paper>
      ) : (
        <Box id="today-task-list" data-onboarding="task-list">
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <Button
              size="small"
              variant="text"
              startIcon={<DoneAllRoundedIcon />}
              onClick={() => setAllDoneOpen(true)}
            >
              {t("today.markAllDone")}
            </Button>
          </Box>

          {allDayTasks.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Box sx={{ width: 3, height: 14, borderRadius: 1.5, bgcolor: "primary.light", flexShrink: 0 }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                    color: "text.secondary",
                    flexShrink: 0,
                    fontSize: { xs: "0.75rem", sm: "0.8rem" },
                  }}
                >
                  {t("today.allDay")}
                </Typography>
                <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
                <Typography variant="caption" sx={{ color: "text.secondary", opacity: 0.6, fontWeight: 700 }}>
                  {allDayTasks.length}
                </Typography>
              </Box>
              {allDayTasks.map(renderTaskCard)}
            </Box>
          )}

          {timedTasks.length > 0 && (
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Box sx={{ width: 3, height: 14, borderRadius: 1.5, bgcolor: "secondary.main", flexShrink: 0 }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                    color: "text.secondary",
                    flexShrink: 0,
                    fontSize: { xs: "0.75rem", sm: "0.8rem" },
                  }}
                >
                  {t("today.scheduled")}
                </Typography>
                <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
                <Typography variant="caption" sx={{ color: "text.secondary", opacity: 0.6, fontWeight: 700 }}>
                  {timedTasks.length}
                </Typography>
              </Box>
              {timedTasks.map(renderTaskCard)}
            </Box>
          )}
        </Box>
      )}

      <TaskDialog
        open={dialogOpen}
        mode={editing ? "edit" : "create"}
        task={editing}
        occurrenceDateYmd={editing ? selectedDay : undefined}
        defaultDateYmd={selectedDay}
        onClose={() => {
          closeTaskEditor();
        }}
        onSave={handleTaskSave}
        onDelete={(id, scope = "series") => {
          const task = tasks.find((item) => item.id === id);
          if (!task) return;
          setDeleteTask({
            task,
            scope: isRecurringTask(task) ? scope : "series",
            sourceTask: editingSourceTask,
            occurrenceDateYmd: selectedDay,
          });
        }}
      />

      <ConfirmDoneDialog
        open={!!markDoneTask}
        title={markDoneTask?.title || ""}
        onCancel={() => setMarkDoneTask(undefined)}
        onConfirm={() => {
          if (markDoneTask) doMarkDone(markDoneTask);
        }}
      />
      <ConfirmDeleteDialog
        open={!!deleteTask}
        title={deleteTask?.task.title || ""}
        onCancel={() => setDeleteTask(undefined)}
        onConfirm={() => {
          if (deleteTask) {
            remove(
              deleteTask.task.id,
              deleteTask.scope,
              deleteTask.sourceTask,
              deleteTask.occurrenceDateYmd
            );
          }
        }}
      />
      <ConfirmAllDoneDialog
        open={allDoneOpen}
        onCancel={() => setAllDoneOpen(false)}
        onConfirm={markAllDone}
      />
      <ExportIcsDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        tasks={tasks}
      />
    </Box>
  );
}
