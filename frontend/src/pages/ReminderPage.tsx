import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import EventIcon from "@mui/icons-material/Event";

import type { Task } from "../types";
import { ymd } from "../app/date";
import { TaskDialog } from "../components/TaskDialog";
import { ConfirmDoneDialog } from "../components/ConfirmDoneDialog";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";

import {
  COMPLETIONS_KEY,
  loadCompletions,
  saveCompletions,
  markDoneForDate,
  type CompletionMap,
} from "../app/completions";

export function ReminderPage(props: { tasks: Task[]; setTasks: (next: Task[]) => void }) {
  const [completions, setCompletions] = useState<CompletionMap>(loadCompletions());

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === COMPLETIONS_KEY) setCompletions(loadCompletions());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const todayYmd = ymd(dayjs());

  const reminders = useMemo(() => {
    return props.tasks
      .filter((t) => !t.date && !t.weekday)
      .map((t) => {
        let isDone = t.done;
        if (t.type === "PERMANENT") {
          const comp = completions[t.id];
          isDone = Array.isArray(comp) ? comp.includes(todayYmd) : !!comp;
        }
        return { ...t, isDone }; 
      })
      .sort((a, b) => (a.emergency ?? 5) - (b.emergency ?? 5));
  }, [props.tasks, completions, todayYmd]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  const [markDoneTask, setMarkDoneTask] = useState<Task | undefined>();
  const [deleteTask, setDeleteTask] = useState<Task | undefined>();

  function upsert(task: Task) {
    props.setTasks([...props.tasks.filter((t) => t.id !== task.id), task]);
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
      const nextMap = markDoneForDate(completions, task.id, todayYmd);
      saveCompletions(nextMap);
      setCompletions(nextMap);
    }
    setMarkDoneTask(undefined);
  }

  function moveToToday(task: Task) {
    upsert({
      ...task,
      date: todayYmd,
      type: "TEMPORARY",
      done: false,
      updatedAt: new Date().toISOString(),
    });
  }

  function getColor(t: Task) {
    switch (t.emergency) {
      case 1: return "#d32f2f";
      case 2: return "#ed6c02";
      case 3: return "#ff9800";
      case 4: return "#4caf50";
      case 5: default: return "#2196f3";
    }
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: { xs: 1, sm: 2 } }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Typography variant="h5" fontWeight="bold">
          Active Reminders
        </Typography>

        <Button
          variant="contained"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          Add Reminder
        </Button>
      </Stack>

      {reminders.length === 0 ? (
        <Typography variant="body1" sx={{ mt: 4, textAlign: "center", color: "text.secondary" }}>
          You have no active reminders!
        </Typography>
      ) : (
        <Box>
          {reminders.map((task) => {
            const color = getColor(task);

            return (
              <Card
                key={task.id}
                sx={{
                  mb: 1,
                  borderLeft: "6px solid",
                  borderColor: color,
                  opacity: task.isDone ? 0.6 : 1,
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
                          textDecoration: task.isDone ? "line-through" : "none",
                          wordBreak: "break-word"
                        }}
                      >
                        {task.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Priority {task.emergency ?? 5}
                      </Typography>
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

                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        startIcon={<EventIcon />}
                        onClick={() => moveToToday(task)}
                      >
                        To Today
                      </Button>

                      {!task.isDone && (
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
        defaultDateYmd={""} 
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
    </Box>
  );
}