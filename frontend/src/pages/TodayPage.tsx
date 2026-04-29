// INPUT: task collection, retained completion history, and selected date route state
// OUTPUT: Today view with grouped tasks and task action dialogs
// EFFECT: Drives the daily planning feature, including completion, rescheduling, map launch, and task CRUD flows
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
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
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";

import type { Task } from "../types";
import {
  productivityStatsForDate,
  productivityStatsForRollingWindow,
  productivityStatsSeries,
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

export function TodayPage(props: {
  tasks: Task[];
  setTasks: (next: Task[]) => void;
  onTaskDialogVisibilityChange?: (open: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlDate = searchParams.get("date");
  const currentLanguage = i18n.resolvedLanguage?.startsWith("zh") ? "zh" : "en";

  const [selectedDay, setSelectedDay] = useState<string>(urlDate || ymd(dayjs()));

  useEffect(() => {
    if (urlDate && urlDate !== selectedDay) {
      setSelectedDay(urlDate);
    }
  }, [urlDate]);

  useEffect(() => {
    if (selectedDay !== urlDate) {
      setSearchParams({ date: selectedDay });
    }
  }, [selectedDay, setSearchParams, urlDate]);

  const title = useMemo(() => {
    return new Intl.DateTimeFormat(currentLanguage, {
      weekday: "long",
      month: "short",
      day: "numeric",
    }).format(dayjs(selectedDay).toDate());
  }, [currentLanguage, selectedDay]);

  const isTodayView = selectedDay === ymd(dayjs());

  const { allDayTasks, timedTasks } = useMemo(() => {
    const raw = tasksForDate(props.tasks, selectedDay);
    const allDay = raw
      .filter((t) => !t.startTime)
      .sort((a, b) => (a.emergency ?? 5) - (b.emergency ?? 5));
    const timed = raw
      .filter((t) => !!t.startTime)
      .sort((a, b) => a.startTime!.localeCompare(b.startTime!));

    return { allDayTasks: allDay, timedTasks: timed };
  }, [props.tasks, selectedDay]);

  const dayStats = useMemo(() => productivityStatsForDate(props.tasks, selectedDay), [props.tasks, selectedDay]);
  const sevenDayStats = useMemo(
    () => productivityStatsForRollingWindow(props.tasks, selectedDay, 7),
    [props.tasks, selectedDay]
  );
  const thirtyDayStats = useMemo(
    () => productivityStatsForRollingWindow(props.tasks, selectedDay, 30),
    [props.tasks, selectedDay]
  );
  const sevenDayTrend = useMemo(
    () => productivityStatsSeries(props.tasks, selectedDay, 7),
    [props.tasks, selectedDay]
  );
  const completedTaskCount = sevenDayTrend[sevenDayTrend.length - 1]?.completedCount ?? 0;
  const maxTrendTotal = useMemo(
    () => Math.max(...sevenDayTrend.map((item) => item.totalCount), 1),
    [sevenDayTrend]
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
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    severity: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    props.onTaskDialogVisibilityChange?.(dialogOpen);
    return () => {
      props.onTaskDialogVisibilityChange?.(false);
    };
  }, [dialogOpen, props.onTaskDialogVisibilityChange]);

  function closeTaskEditor() {
    setDialogOpen(false);
    setEditing(undefined);
    setEditingSourceTask(undefined);
  }

  function upsert(task: Task, scope: TaskSaveScope = "series") {
    props.setTasks(
      saveTaskCollection(props.tasks, task, {
        editingSourceTask,
        scope: editingSourceTask && isRecurringTask(editingSourceTask) ? scope : "series",
        occurrenceDateYmd: selectedDay,
      })
    );
    closeTaskEditor();
  }

  function remove(taskId: string, scope: TaskSaveScope = "series", sourceTask?: Task, occurrenceDateYmd?: string) {
    props.setTasks(
      removeTaskFromCollection(props.tasks, taskId, {
        editingSourceTask: sourceTask,
        scope,
        occurrenceDateYmd,
        updatedAt: new Date().toISOString(),
      })
    );
    setDeleteTask(undefined);
    closeTaskEditor();
  }

  function doMarkDone(task: Task) {
    const completedAt = new Date().toISOString();
    props.setTasks(
      completeTaskInCollection(props.tasks, task.id, {
        completedAt,
        occurrenceDateYmd: isRecurringTask(task) ? selectedDay : undefined,
        updatedAt: completedAt,
      })
    );
    setMarkDoneTask(undefined);
  }

  function markAllDone() {
    const completionAt = new Date().toISOString();
    const raw = tasksForDate(props.tasks, selectedDay);
    let nextTasks = props.tasks;

    for (const task of raw) {
      nextTasks = completeTaskInCollection(nextTasks, task.id, {
        completedAt: completionAt,
        occurrenceDateYmd: isRecurringTask(task) ? selectedDay : undefined,
        updatedAt: completionAt,
      });
    }

    props.setTasks(nextTasks);
    setAllDoneOpen(false);
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

  function formatStatsLabel(completedCount: number, totalCount: number, completionRate: number) {
    return t("today.statsValue", {
      completed: completedCount,
      total: totalCount,
      percent: completionRate,
    });
  }

  function formatTaskTime(value: string) {
    return new Intl.DateTimeFormat(currentLanguage, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(`2000-01-01T${value}`));
  }

  function formatTrendDay(dateYmd: string) {
    return new Intl.DateTimeFormat(currentLanguage, {
      weekday: "short",
    }).format(dayjs(dateYmd).toDate());
  }

  function formatTrendDate(dateYmd: string) {
    return new Intl.DateTimeFormat(currentLanguage, {
      month: "numeric",
      day: "numeric",
    }).format(dayjs(dateYmd).toDate());
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
    const sourceTask = props.tasks.find((item) => item.id === task.id);
    if (!sourceTask) return;
    setEditingSourceTask(sourceTask);
    setEditing(getTaskOccurrence(sourceTask, selectedDay) ?? normalizeTask(sourceTask));
    setDialogOpen(true);
  }

  function mergeImportedTasks(importedTasks: Task[]) {
    const importedById = new Map(importedTasks.map((task) => [task.id, task]));
    return [
      ...props.tasks.filter((task) => !importedById.has(task.id)),
      ...importedTasks,
    ];
  }

  async function importIcsFile(file: File | null) {
    if (!file) return;

    try {
      const { tasks: importedTasks, skippedCount } = parseIcsTasks(await file.text());
      if (importedTasks.length === 0) {
        setImportStatus({
          severity: "error",
          message: t("today.importEmpty", { name: file.name }),
        });
        return;
      }

      props.setTasks(mergeImportedTasks(importedTasks));
      setImportStatus({
        severity: "success",
        message:
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
      });
    } catch {
      setImportStatus({
        severity: "error",
        message: t("today.importError", { name: file.name }),
      });
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
          borderRadius: 3,
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 16px 36px rgba(15, 23, 42, 0.1)",
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
        maxWidth: 1200,
        mx: "auto",
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 1, sm: 2 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          mb: 2.5,
          p: { xs: 1.75, sm: 2.5 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          background:
            "linear-gradient(135deg, rgba(79, 70, 229, 0.06), rgba(14, 165, 233, 0.05))",
          backdropFilter: "blur(8px)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={2}
        >
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <IconButton
              aria-label={t("today.previousDay")}
              onClick={() => setSelectedDay(ymd(dayjs(selectedDay).subtract(1, "day")))}
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
              onClick={() => setSelectedDay(ymd(dayjs(selectedDay).add(1, "day")))}
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
              onClick={() => setSelectedDay(ymd(dayjs()))}
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

      {importStatus ? (
        <Alert severity={importStatus.severity} sx={{ mb: 2.5 }}>
          {importStatus.message}
        </Alert>
      ) : null}

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
        <Chip label={t("today.activeCount", { count: totalTasks })} sx={{ fontWeight: 700 }} />
        <Chip label={t("today.completedCount", { count: completedTaskCount })} variant="outlined" sx={{ fontWeight: 700 }} />
      </Stack>

      <Paper
        elevation={0}
        sx={{
          mb: 2.5,
          p: { xs: 1.5, sm: 2 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: alpha("#0ea5e9", 0.14),
          background: "linear-gradient(135deg, rgba(14, 165, 233, 0.07), rgba(255,255,255,0.94))",
        }}
      >
        <Stack spacing={1.5}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={1}
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ xs: "flex-start", sm: "center" }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 3,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha("#0ea5e9", 0.12),
                  color: "#0369a1",
                }}
              >
                <QueryStatsRoundedIcon />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  {t("today.productivityTitle")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("today.productivityPitch", {
                    completed: sevenDayStats.completedCount,
                    total: sevenDayStats.totalCount,
                    percent: sevenDayStats.completionRate,
                  })}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
              <Button
                variant={statsExpanded ? "contained" : "outlined"}
                onClick={() => setStatsExpanded((value) => !value)}
                sx={{ borderRadius: 999 }}
              >
                {statsExpanded ? t("today.hideProductivityDetails") : t("today.viewProductivityDetails")}
              </Button>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    bgcolor: "#22c55e",
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  {t("today.productivityLegendCompleted")}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    bgcolor: alpha("#94a3b8", 0.48),
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  {t("today.productivityLegendRemaining")}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
          <Collapse in={statsExpanded} unmountOnExit>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    flex: 1,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: alpha("#0f172a", 0.08),
                    background: "rgba(255,255,255,0.82)",
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {t("today.productivityToday")}
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {formatStatsLabel(dayStats.completedCount, dayStats.totalCount, dayStats.completionRate)}
                  </Typography>
                </Paper>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    flex: 1,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: alpha("#0f172a", 0.08),
                    background: "rgba(255,255,255,0.82)",
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {t("today.productivityLast7Days")}
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {formatStatsLabel(
                      sevenDayStats.completedCount,
                      sevenDayStats.totalCount,
                      sevenDayStats.completionRate
                    )}
                  </Typography>
                </Paper>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    flex: 1,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: alpha("#0f172a", 0.08),
                    background: "rgba(255,255,255,0.82)",
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {t("today.productivityLast30Days")}
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {formatStatsLabel(
                      thirtyDayStats.completedCount,
                      thirtyDayStats.totalCount,
                      thirtyDayStats.completionRate
                    )}
                  </Typography>
                </Paper>
              </Stack>
              <Paper
                elevation={0}
                aria-label={t("today.productivityTrendTitle")}
                sx={{
                  p: { xs: 1.25, sm: 1.5 },
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: alpha("#0f172a", 0.08),
                  background: "rgba(255,255,255,0.82)",
                }}
              >
                <Stack spacing={0.5} sx={{ mb: 1.25 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t("today.productivityTrendTitle")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("today.productivityTrendHint")}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  spacing={{ xs: 0.75, sm: 1.25 }}
                  alignItems="flex-end"
                  justifyContent="space-between"
                  sx={{ minHeight: 180 }}
                >
                  {sevenDayTrend.map((item) => {
                    const barHeight = item.totalCount > 0 ? Math.max((item.totalCount / maxTrendTotal) * 100, 14) : 6;
                    const completedHeight = item.totalCount > 0 ? (item.completedCount / item.totalCount) * 100 : 0;
                    const remainingHeight = item.totalCount > 0 ? 100 - completedHeight : 0;

                    return (
                      <Stack
                        key={item.dateYmd}
                        spacing={0.75}
                        alignItems="center"
                        sx={{ flex: 1, minWidth: 0 }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {item.completedCount}/{item.totalCount}
                        </Typography>
                        <Box
                          sx={{
                            width: "100%",
                            maxWidth: 48,
                            height: 116,
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "center",
                          }}
                        >
                          <Box
                            sx={{
                              width: "100%",
                              height: `${barHeight}%`,
                              minHeight: item.totalCount > 0 ? 16 : 6,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "flex-end",
                              overflow: "hidden",
                              borderRadius: 999,
                              border: "1px solid",
                              borderColor: alpha("#0f172a", 0.08),
                              bgcolor: alpha("#e2e8f0", 0.7),
                              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
                            }}
                          >
                            {remainingHeight > 0 ? (
                              <Box
                                sx={{
                                  height: `${remainingHeight}%`,
                                  bgcolor: alpha("#94a3b8", 0.48),
                                }}
                              />
                            ) : null}
                            {completedHeight > 0 ? (
                              <Box
                                sx={{
                                  height: `${completedHeight}%`,
                                  bgcolor: "#22c55e",
                                }}
                              />
                            ) : null}
                          </Box>
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                          {formatTrendDay(item.dateYmd)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.1 }}>
                          {formatTrendDate(item.dateYmd)}
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </Paper>
            </Stack>
          </Collapse>
        </Stack>
      </Paper>

      {allDayTasks.length === 0 && timedTasks.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            mt: 4,
            textAlign: "center",
            py: 8,
            borderRadius: 4,
            border: "1px dashed",
            borderColor: "divider",
            bgcolor: "rgba(255,255,255,0.6)",
          }}
        >
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
            {t("today.noTasks")}
          </Typography>
          <Button
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
        <Box>
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
              <Typography
                variant="subtitle1"
                fontWeight={800}
                sx={{
                  mb: 1.25,
                  color: "text.secondary",
                  fontSize: { xs: "0.85rem", sm: "0.95rem" },
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {t("today.allDay")}
              </Typography>
              {allDayTasks.map(renderTaskCard)}
            </Box>
          )}

          {timedTasks.length > 0 && (
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight={800}
                sx={{
                  mb: 1.25,
                  color: "text.secondary",
                  fontSize: { xs: "0.85rem", sm: "0.95rem" },
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {t("today.scheduled")}
              </Typography>
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
        onSave={upsert}
        onDelete={(id, scope = "series") => {
          const task = props.tasks.find((item) => item.id === id);
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
    </Box>
  );
}
