// INPUT: task collection, completion history, and selected date route state
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
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";

import type { Task } from "../types";
import { tasksForDate } from "../app/taskLogic";
import { ymd } from "../app/date";
import { TaskDialog } from "../components/TaskDialog";
import { ConfirmDoneDialog } from "../components/ConfirmDoneDialog";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import { ConfirmAllDoneDialog } from "../components/ConfirmAllDoneDialog";

import {
  COMPLETIONS_KEY,
  loadCompletions,
  saveCompletions,
  markDoneForDate,
  type CompletionMap,
} from "../app/completions";
import {
  applySeriesEdit,
  applySingleOccurrenceEdit,
  getRepeatFrequency,
  getTaskOccurrence,
  isOneTimeTask,
  isRecurringTask,
  normalizeTask,
  type TaskSaveScope,
} from "../app/tasks";

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

  const [completions, setCompletions] = useState<CompletionMap>(loadCompletions());

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === COMPLETIONS_KEY) {
        setCompletions(loadCompletions());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const title = useMemo(() => {
    return new Intl.DateTimeFormat(currentLanguage, {
      weekday: "long",
      month: "short",
      day: "numeric",
    }).format(dayjs(selectedDay).toDate());
  }, [currentLanguage, selectedDay]);

  const isTodayView = selectedDay === ymd(dayjs());

  const { allDayTasks, timedTasks } = useMemo(() => {
    const raw = tasksForDate(props.tasks, selectedDay, completions);
    const allDay = raw
      .filter((t) => !t.startTime)
      .sort((a, b) => (a.emergency ?? 5) - (b.emergency ?? 5));
    const timed = raw
      .filter((t) => !!t.startTime)
      .sort((a, b) => a.startTime!.localeCompare(b.startTime!));

    return { allDayTasks: allDay, timedTasks: timed };
  }, [props.tasks, selectedDay, completions]);

  const totalTasks = allDayTasks.length + timedTasks.length;
  const completedTasks = [...allDayTasks, ...timedTasks].filter((task) => task.done).length;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  const [editingSourceTask, setEditingSourceTask] = useState<Task | undefined>();
  const [markDoneTask, setMarkDoneTask] = useState<Task | undefined>();
  const [deleteTask, setDeleteTask] = useState<Task | undefined>();
  const [allDoneOpen, setAllDoneOpen] = useState(false);

  useEffect(() => {
    props.onTaskDialogVisibilityChange?.(dialogOpen);
    return () => {
      props.onTaskDialogVisibilityChange?.(false);
    };
  }, [dialogOpen, props.onTaskDialogVisibilityChange]);

  function upsert(task: Task, scope: TaskSaveScope = "series") {
    if (editingSourceTask && scope === "single" && isRecurringTask(editingSourceTask)) {
      props.setTasks(
        props.tasks.map((item) =>
          item.id === editingSourceTask.id
            ? applySingleOccurrenceEdit(item, selectedDay, task)
            : item
        )
      );
      setDialogOpen(false);
      setEditing(undefined);
      setEditingSourceTask(undefined);
      return;
    }

    const sourceId = editingSourceTask?.id ?? task.id;
    const nextTask = editingSourceTask ? applySeriesEdit(editingSourceTask, task) : normalizeTask(task);
    props.setTasks([...props.tasks.filter((item) => item.id !== sourceId), nextTask]);
    setDialogOpen(false);
    setEditing(undefined);
    setEditingSourceTask(undefined);
  }

  function remove(id: string) {
    props.setTasks(props.tasks.filter((t) => t.id !== id));
    setDeleteTask(undefined);
    setDialogOpen(false);
    setEditing(undefined);
    setEditingSourceTask(undefined);
  }

  function doMarkDone(task: Task) {
    if (isOneTimeTask(task)) {
      upsert({ ...task, done: true, updatedAt: new Date().toISOString() });
    } else {
      const nextMap = markDoneForDate(completions, task.id, selectedDay);
      saveCompletions(nextMap);
      setCompletions(nextMap);
    }
    setMarkDoneTask(undefined);
  }

  function markAllDone() {
    const raw = tasksForDate(props.tasks, selectedDay, completions);
    const temporaryIds = raw.filter((task) => isOneTimeTask(task)).map((task) => task.id);
    let nextTasks = props.tasks;
    if (temporaryIds.length > 0) {
      nextTasks = nextTasks.map((t) => {
        if (temporaryIds.includes(t.id)) {
          return { ...t, done: true, updatedAt: new Date().toISOString() };
        }
        return t;
      });
    }

    const recurringIds = raw.filter((task) => isRecurringTask(task)).map((task) => task.id);
    let nextCompletions = completions;
    for (const recurringId of recurringIds) {
      nextCompletions = markDoneForDate(nextCompletions, recurringId, selectedDay);
    }

    if (temporaryIds.length > 0) {
      props.setTasks(nextTasks);
    }
    saveCompletions(nextCompletions);
    setCompletions(nextCompletions);
    setAllDoneOpen(false);
  }

  function moveTemporaryToToday(task: Task) {
    if (!isOneTimeTask(task)) return;
    const todayYmd = ymd(dayjs());
    upsert({
      ...task,
      beginDate: todayYmd,
      date: todayYmd,
      done: false,
      updatedAt: new Date().toISOString(),
    });
  }

  function moveTemporaryToTomorrow(task: Task) {
    if (!isOneTimeTask(task)) return;
    const tomorrowYmd = ymd(dayjs().add(1, "day"));
    upsert({
      ...task,
      beginDate: tomorrowYmd,
      date: tomorrowYmd,
      done: false,
      updatedAt: new Date().toISOString(),
    });
  }

  function getColor(t: Task) {
    switch (t.emergency) {
      case 1:
        return "#ef4444";
      case 2:
        return "#f97316";
      case 3:
        return "#f59e0b";
      case 4:
        return "#10b981";
      case 5:
      default:
        return "#0ea5e9";
    }
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
    const sourceTask = props.tasks.find((item) => item.id === task.id);
    if (!sourceTask) return;
    setEditingSourceTask(sourceTask);
    setEditing(getTaskOccurrence(sourceTask, selectedDay) ?? normalizeTask(sourceTask));
    setDialogOpen(true);
  }

  const renderTaskCard = (task: Task) => {
    const color = getColor(task);
    const isToday = selectedDay === ymd(dayjs());
    const isTomorrow = selectedDay === ymd(dayjs().add(1, "day"));

    return (
      <Card
        key={task.id}
        sx={{
          mb: 1.25,
          position: "relative",
          overflow: "hidden",
          opacity: task.done ? 0.7 : 1,
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
          background: task.done
            ? "rgba(248, 250, 252, 0.9)"
            : `linear-gradient(135deg, ${alpha(color, 0.04)}, rgba(255,255,255,1) 60%)`,
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
                    textDecoration: task.done ? "line-through" : "none",
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
              {!task.done && (
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
              )}
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
              {totalTasks > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {completedTasks} / {totalTasks} · {t("common.done")}
                </Typography>
              )}
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
          setDialogOpen(false);
          setEditing(undefined);
          setEditingSourceTask(undefined);
        }}
        onSave={upsert}
        onDelete={(id) => {
          const t = props.tasks.find((x) => x.id === id);
          if (t) setDeleteTask(t);
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
        title={deleteTask?.title || ""}
        onCancel={() => setDeleteTask(undefined)}
        onConfirm={() => {
          if (deleteTask) remove(deleteTask.id);
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
