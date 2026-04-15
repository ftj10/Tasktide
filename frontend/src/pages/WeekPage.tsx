import { Box, Button, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayjs from "dayjs";

import type { Task } from "../types";
import { toCalendarEventsForRange } from "../app/taskLogic";
import { TaskDialog } from "../components/TaskDialog";
import { loadCompletions } from "../app/completions";

export function WeekPage(props: {
  tasks: Task[];
  setTasks: (next: Task[]) => void;
  completionsRev: number;
}) {
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  const [defaultDate, setDefaultDate] = useState<string | undefined>();

  const events = useMemo(() => {
    const completions = loadCompletions();
    return toCalendarEventsForRange(
      props.tasks,
      completions,
      dayjs().subtract(1, "year"),
      dayjs().add(1, "year")
    );
  }, [props.tasks, props.completionsRev]);

  function upsert(task: Task) {
    props.setTasks([
      ...props.tasks.filter((t) => t.id !== task.id),
      task,
    ]);
    setDialogOpen(false);
  }

  function remove(id: string) {
    props.setTasks(props.tasks.filter((t) => t.id !== id));
    setDialogOpen(false);
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", p: { xs: 1, md: 2 } }}>
      <Stack 
        direction={{ xs: "column", sm: "row" }} 
        justifyContent="space-between" 
        alignItems="center" 
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" align="center">Weekly Schedule (Mon–Sun)</Typography>
        <Button
          variant="contained"
          fullWidth={false}
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          Add task
        </Button>
      </Stack>

      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <Box sx={{ minWidth: 700 }}>
          <FullCalendar
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView="dayGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridWeek,timeGridWeek",
            }}
            firstDay={1}
            events={events}
            dayHeaderContent={(arg) => {
              const ymdStr = dayjs(arg.date).format("YYYY-MM-DD");
              return (
                <span
                  style={{ cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => navigate(`/today?date=${ymdStr}`)}
                >
                  {arg.text}
                </span>
              );
            }}
            eventClick={(info) => {
              const taskId = info.event.extendedProps.taskId as string;
              const task = props.tasks.find((t) => t.id === taskId);
              if (!task) return;
              setEditing(task);
              const startStr = info.event.startStr.slice(0, 10);
              setDefaultDate(startStr);
              setDialogOpen(true);
            }}
            dateClick={(info) => {
              const date = info.dateStr.slice(0, 10);
              setDefaultDate(date);
            }}
            height="auto"
          />
        </Box>
      </Box>

      <TaskDialog
        open={dialogOpen}
        mode={editing ? "edit" : "create"}
        task={editing}
        defaultDateYmd={defaultDate || ""}
        onClose={() => {
          setDialogOpen(false);
          setEditing(undefined);
        }}
        onSave={upsert}
        onDelete={remove}
      />
    </Box>
  );
}