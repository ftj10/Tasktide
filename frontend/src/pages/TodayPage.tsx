import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import EventIcon from "@mui/icons-material/Event";
import MapIcon from "@mui/icons-material/Map";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

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

// INPUT: props.tasks, props.setTasks
// OUTPUT: Renders the daily task view
// EFFECT: Groups tasks into "All-Day" and "Timed", ranks them correctly, and manages CRUD operations
export function TodayPage(props: { tasks: Task[]; setTasks: (next: Task[]) => void }) {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlDate = searchParams.get("date");
  const currentLanguage = i18n.resolvedLanguage?.startsWith("zh") ? "zh" : "en";

  const [selectedDay, setSelectedDay] = useState<string>(
    urlDate || ymd(dayjs())
  );

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

  // INPUT: props.tasks, selectedDay, completions
  // OUTPUT: { allDayTasks: Task[], timedTasks: Task[] }
  // EFFECT: Splits tasks into two arrays and sorts them based on user constraints (All Day by Emergency, Timed by Time)
  const { allDayTasks, timedTasks } = useMemo(() => {
    const raw = tasksForDate(props.tasks, selectedDay, completions);
    // All-Day: Has NO start time. Rank by emergency.
    const allDay = raw.filter(t => !t.startTime).sort((a, b) => (a.emergency ?? 5) - (b.emergency ?? 5));

    // Timed: Has start time. Rank ONLY by time chronologically (ignoring emergency order).
    const timed = raw.filter(t => !!t.startTime).sort((a, b) => a.startTime!.localeCompare(b.startTime!));

    return { allDayTasks: allDay, timedTasks: timed };
  }, [props.tasks, selectedDay, completions]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  const [markDoneTask, setMarkDoneTask] = useState<Task | undefined>();
  const [deleteTask, setDeleteTask] = useState<Task | undefined>();
  const [allDoneOpen, setAllDoneOpen] = useState(false);

  function upsert(task: Task) {
    props.setTasks([
      ...props.tasks.filter((t) => t.id !== task.id),
      task,
    ]);
    setDialogOpen(false);
  }

  function remove(id: string) {
    props.setTasks(props.tasks.filter((t) => t.id !== id));
    setDeleteTask(undefined);
    setDialogOpen(false);
  }

  function doMarkDone(task: Task) {
    if (task.type === "TEMPORARY") {
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
    const temporaryIds = raw.filter((t) => t.type === "TEMPORARY").map((t) => t.id);
    let nextTasks = props.tasks;
    if (temporaryIds.length > 0) {
      nextTasks = nextTasks.map((t) => {
        if (temporaryIds.includes(t.id)) {
          return { ...t, done: true, updatedAt: new Date().toISOString() };
        }
        return t;
      });
    }

    const permanentIds = raw.filter((t) => t.type === "PERMANENT").map((t) => t.id);
    let nextCompletions = completions;
    for (const pid of permanentIds) {
      nextCompletions = markDoneForDate(nextCompletions, pid, selectedDay);
    }

    if (temporaryIds.length > 0) {
      props.setTasks(nextTasks);
    }
    saveCompletions(nextCompletions);
    setCompletions(nextCompletions);
    setAllDoneOpen(false);
  }

  function moveTemporaryToToday(task: Task) {
    if (task.type !== "TEMPORARY") return;
    const todayYmd = ymd(dayjs());
    upsert({ ...task, date: todayYmd, done: false, updatedAt: new Date().toISOString() });
  }

  function moveTemporaryToTomorrow(task: Task) {
    if (task.type !== "TEMPORARY") return;
    const tomorrowYmd = ymd(dayjs().add(1, "day"));
    upsert({ ...task, date: tomorrowYmd, done: false, updatedAt: new Date().toISOString() });
  }

  function getColor(t: Task) {
    switch (t.emergency) {
      case 1: return "#d32f2f";
      case 2: return "#ed6c02";
      case 3: return "#ff9800";
      case 4: return "#4caf50";
      case 5:
      default: return "#2196f3";
    }
  }

  function getTaskTypeLabel(task: Task) {
    return task.type === "TEMPORARY"
      ? t("today.taskTypes.temporary")
      : t("today.taskTypes.permanent");
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

  // INPUT: task (Task)
  // OUTPUT: Renders a single material card
  // EFFECT: Dynamically shows map, time, description based on existence of properties
  const renderTaskCard = (task: Task) => {
    const color = getColor(task);
    const isToday = selectedDay === ymd(dayjs());
    const isTomorrow = selectedDay === ymd(dayjs().add(1, "day"));

    return (
      <Card
        key={task.id}
        sx={{ mb: 1, borderLeft: "6px solid", borderColor: color, opacity: task.done ? 0.6 : 1 }}
      >
        <CardContent sx={{ p: "16px !important" }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
            <Box sx={{ maxWidth: "100%", overflow: "hidden" }}>
              <Typography variant="h6" sx={{ textDecoration: task.done ? "line-through" : "none", wordBreak: "break-word" }}>
                {task.title}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {t("today.taskMeta", {
                  type: getTaskTypeLabel(task),
                  priority: task.emergency ?? 5,
                })}
              </Typography>

              {task.startTime && (
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.primary" fontWeight="bold">
                    {formatTaskTime(task.startTime)}
                    {task.endTime && ` - ${formatTaskTime(task.endTime)}`}
                  </Typography>
                </Stack>
              )}

              {task.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                  {task.description}
                </Typography>
              )}

              {task.location && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {t("today.locationLabel", { location: task.location })}
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: { xs: 1, sm: 0 } }}>
              <Button size="small" variant="outlined" color="primary" startIcon={<EditIcon />} onClick={() => { setEditing(task); setDialogOpen(true); }}>
                {t("today.modify")}
              </Button>
              {task.type === "TEMPORARY" && !isToday && (
                <Button size="small" variant="outlined" color="secondary" startIcon={<EventIcon />} onClick={() => moveTemporaryToToday(task)}>{t("today.toToday")}</Button>
              )}
              {task.type === "TEMPORARY" && !isTomorrow && (
                <Button size="small" variant="outlined" color="secondary" startIcon={<EventIcon />} onClick={() => moveTemporaryToTomorrow(task)}>{t("today.toTomorrow")}</Button>
              )}
              {!task.done && (
                <Button size="small" variant="contained" color="success" startIcon={<CheckIcon />} onClick={() => setMarkDoneTask(task)}>{t("common.done")}</Button>
              )}
              {task.location && (
                <Button size="small" variant="contained" color="secondary" startIcon={<MapIcon />} onClick={() => openMap(task)}>{t("today.map")}</Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: { xs: 1, sm: 2 } }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton aria-label={t("today.previousDay")} onClick={() => setSelectedDay(ymd(dayjs(selectedDay).subtract(1, "day")))}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ minWidth: 160, textAlign: "center" }}>
            {title}
          </Typography>
          <IconButton aria-label={t("today.nextDay")} onClick={() => setSelectedDay(ymd(dayjs(selectedDay).add(1, "day")))}>
            <ArrowForwardIcon />
          </IconButton>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
          <Button variant="outlined" onClick={() => setSelectedDay(ymd(dayjs()))}>{t("today.goToToday")}</Button>
          <Button variant="contained" onClick={() => { setEditing(undefined); setDialogOpen(true); }}>{t("today.addTask")}</Button>
        </Stack>
      </Stack>

      {(allDayTasks.length === 0 && timedTasks.length === 0) ? (
        <Typography variant="body1" sx={{ mt: 4, textAlign: "center" }}>
          {t("today.noTasks")}
        </Typography>
      ) : (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <Button size="small" variant="text" onClick={() => setAllDoneOpen(true)}>{t("today.markAllDone")}</Button>
          </Box>

          {allDayTasks.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: "text.secondary" }}>
                {t("today.allDay")}
              </Typography>
              {allDayTasks.map(renderTaskCard)}
            </Box>
          )}

          {timedTasks.length > 0 && (
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: "text.secondary" }}>
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
        defaultDateYmd={selectedDay}
        onClose={() => { setDialogOpen(false); setEditing(undefined); }}
        onSave={upsert}
        onDelete={(id) => { const t = props.tasks.find((x) => x.id === id); if (t) setDeleteTask(t); }}
      />

      <ConfirmDoneDialog open={!!markDoneTask} title={markDoneTask?.title || ""} onCancel={() => setMarkDoneTask(undefined)} onConfirm={() => { if (markDoneTask) doMarkDone(markDoneTask); }} />
      <ConfirmDeleteDialog open={!!deleteTask} title={deleteTask?.title || ""} onCancel={() => setDeleteTask(undefined)} onConfirm={() => { if (deleteTask) remove(deleteTask.id); }} />
      <ConfirmAllDoneDialog open={allDoneOpen} onCancel={() => setAllDoneOpen(false)} onConfirm={markAllDone} />
    </Box>
  );
}
