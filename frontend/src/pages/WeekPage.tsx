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

// INPUT: task (Task)
// OUTPUT: { bg, border, text } color strings
// EFFECT: Translates emergency level 1-5 into FullCalendar event colors
function getTaskColors(task?: Task) {
  if (task?.done) {
    return { bg: "#9e9e9e", border: "#9e9e9e", text: "#ffffff" }; // Grey for completed tasks
  }
  
  switch (task?.emergency) {
    case 1:
      return { bg: "#d32f2f", border: "#b71c1c", text: "#ffffff" }; // 1: High Emergency (Red)
    case 2:
      return { bg: "#ed6c02", border: "#e65100", text: "#ffffff" }; // 2: Orange
    case 3:
      return { bg: "#ff9800", border: "#f57c00", text: "#000000" }; // 3: Light Orange
    case 4:
      return { bg: "#4caf50", border: "#388e3c", text: "#ffffff" }; // 4: Green
    case 5:
    default:
      return { bg: "#81d4fa", border: "#4fc3f7", text: "#000000" }; // 5: Low Emergency (Light Blue)
  }
}

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
    const baseEvents = toCalendarEventsForRange(
      props.tasks,
      completions,
      dayjs().subtract(1, "year"),
      dayjs().add(1, "year")
    );

    return baseEvents.map((ev: any) => {
      const taskId = ev.extendedProps?.taskId;
      const task = props.tasks.find((t) => t.id === taskId);

      // Grab dynamic colors based on emergency level
      const colors = getTaskColors(task);

      if (task && task.startTime) {
        const dateYmd = typeof ev.start === "string" 
            ? ev.start.substring(0, 10) 
            : dayjs(ev.start).format("YYYY-MM-DD");
        
        const endProp = task.endTime ? { end: `${dateYmd}T${task.endTime}:00` } : {};

        return {
          ...ev,
          start: `${dateYmd}T${task.startTime}:00`,
          ...endProp,
          allDay: false, 
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: colors.text,
        };
      }

      return {
        ...ev,
        allDay: true,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
      };
    });
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
            
            buttonText={{
              dayGridWeek: 'List View',
              timeGridWeek: 'Time Grid View'
            }}

            views={{
              dayGridWeek: {
                displayEventTime: false 
              },
              timeGridWeek: {
                displayEventTime: true  
              }
            }}
            
            firstDay={1}
            events={events}
            dayHeaderContent={(arg) => {
              const ymdStr = dayjs(arg.date).format("YYYY-MM-DD");
              return (
                <span
                  style={{ cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => navigate(`/?date=${ymdStr}`)}
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
            slotMinTime="06:00:00"
            allDaySlot={true}
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