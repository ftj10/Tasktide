// frontend/src/pages/TodayPage.tsx

import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
// EFFECT: Manages task CRUD operations for a specific date
export function TodayPage(props: { tasks: Task[]; setTasks: (next: Task[]) => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlDate = searchParams.get("date");

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
    const d = dayjs(selectedDay);
    return d.format("dddd, MMM D");
  }, [selectedDay]);

  const todays = useMemo(() => {
    return tasksForDate(props.tasks, selectedDay, completions);
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
    const temporaryIds = todays.filter((t) => t.type === "TEMPORARY").map((t) => t.id);
    let nextTasks = props.tasks;
    if (temporaryIds.length > 0) {
      nextTasks = nextTasks.map((t) => {
        if (temporaryIds.includes(t.id)) {
          return { ...t, done: true, updatedAt: new Date().toISOString() };
        }
        return t;
      });
    }

    const permanentIds = todays.filter((t) => t.type === "PERMANENT").map((t) => t.id);
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
    upsert({
      ...task,
      date: todayYmd,
      done: false,
      updatedAt: new Date().toISOString(),
    });
  }

  function moveTemporaryToTomorrow(task: Task) {
    if (task.type !== "TEMPORARY") return;
    const tomorrowYmd = ymd(dayjs().add(1, "day"));
    upsert({
      ...task,
      date: tomorrowYmd,
      done: false,
      updatedAt: new Date().toISOString(),
    });
  }

  function getColor(t: Task) {
    switch (t.emergency) {
      case 1:
        return "#d32f2f";
      case 2:
        return "#ed6c02";
      case 3:
        return "#ff9800";
      case 4:
        return "#4caf50";
      case 5:
      default:
        return "#2196f3";
    }
  }

  // INPUT: task (Task)
  // OUTPUT: none
  // EFFECT: Opens a new window with the appropriate map provider URL
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

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: { xs: 1, sm: 2 } }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={() => setSelectedDay(ymd(dayjs(selectedDay).subtract(1, "day")))}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ minWidth: 160, textAlign: "center" }}>
            {title}
          </Typography>
          <IconButton onClick={() => setSelectedDay(ymd(dayjs(selectedDay).add(1, "day")))}>
            <ArrowForwardIcon />
          </IconButton>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
          <Button variant="outlined" onClick={() => setSelectedDay(ymd(dayjs()))}>
            Go to Today
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
          >
            Add Task
          </Button>
        </Stack>
      </Stack>

      {todays.length === 0 ? (
        <Typography variant="body1" sx={{ mt: 4, textAlign: "center" }}>
          No tasks scheduled for this date.
        </Typography>
      ) : (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <Button size="small" variant="text" onClick={() => setAllDoneOpen(true)}>
              Mark All Done
            </Button>
          </Box>
          {todays.map((task) => {
            const color = getColor(task);
            const isToday = selectedDay === ymd(dayjs());
            const isTomorrow = selectedDay === ymd(dayjs().add(1, "day"));

            return (
              <Card
                key={task.id}
                sx={{
                  mb: 1,
                  borderLeft: "6px solid",
                  borderColor: color,
                  opacity: task.done ? 0.6 : 1,
                }}
              >
                <CardContent sx={{ p: "16px !important" }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={2}
                  >
                    <Box sx={{ maxWidth: "100%", overflow: "hidden" }}>
                      <Typography
                        variant="h6"
                        sx={{
                          textDecoration: task.done ? "line-through" : "none",
                          wordBreak: "break-word"
                        }}
                      >
                        {task.title}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        {task.type} • Priority {task.emergency ?? 5}
                      </Typography>


                      {task.location && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Location: {task.location}
                        </Typography>
                      )}
                    </Box>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: { xs: 1, sm: 0 } }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          setEditing(task);
                          setDialogOpen(true);
                        }}
                      >
                        Modify
                      </Button>

                      {task.type === "TEMPORARY" && !isToday && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="secondary"
                          startIcon={<EventIcon />}
                          onClick={() => moveTemporaryToToday(task)}
                        >
                          To Today
                        </Button>
                      )}

                      {task.type === "TEMPORARY" && !isTomorrow && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="secondary"
                          startIcon={<EventIcon />}
                          onClick={() => moveTemporaryToTomorrow(task)}
                        >
                          To Tomorrow
                        </Button>
                      )}

                      {!task.done && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => setMarkDoneTask(task)}
                        >
                          Done
                        </Button>
                      )}

                      {task.location && (
                        <Button
                          size="small"
                          variant="contained"
                          color="secondary"
                          startIcon={<MapIcon />}
                          onClick={() => openMap(task)}
                        >
                          Map
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <TaskDialog
        open={dialogOpen}
        mode={editing ? "edit" : "create"}
        task={editing}
        defaultDateYmd={selectedDay}
        onClose={() => {
          setDialogOpen(false);
          setEditing(undefined);
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