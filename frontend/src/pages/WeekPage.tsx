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

// INPUT: props.tasks, props.setTasks, props.completionsRev
// OUTPUT: Renders a weekly calendar view of tasks
// EFFECT: Translates tasks into FullCalendar events, maps task.startTime/endTime, explicitly hides time text in list view, and overrides color to light blue based on completion
export function WeekPage(props: {
  tasks: Task[];
  setTasks: (next: Task[]) => void;
  completionsRev: number;
}) {
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  const [defaultDate, setDefaultDate] = useState<string | undefined>();

  // INPUT: props.tasks, props.completionsRev
  // OUTPUT: Array of FullCalendar compatible event objects
  // EFFECT: Fetches raw events, applies startTime and endTime for time grid events, sets light blue colors
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

      // Emergency determines Color ONLY, not order.
      const bgColor = task?.done ? "#9e9e9e" : "#81d4fa"; 
      const borderColor = task?.done ? "#9e9e9e" : "#4fc3f7"; 
      const textColor = task?.done ? "#ffffff" : "#000000"; 

      // If it has a Start Time, attach start and optional end to the event
      if (task && task.startTime) {
        const dateYmd = typeof ev.start === "string" 
            ? ev.start.substring(0, 10) 
            : dayjs(ev.start).format("YYYY-MM-DD");
        
        // Include endTime only if it exists
        const endProp = task.endTime ? { end: `${dateYmd}T${task.endTime}:00` } : {};

        return {
          ...ev,
          start: `${dateYmd}T${task.startTime}:00`,
          ...endProp,
          allDay: false, 
          backgroundColor: bgColor,
          borderColor: borderColor,
          textColor: textColor,
        };
      }

      // No start time -> push to the All Day bar
      return {
        ...ev,
        allDay: true,
        backgroundColor: bgColor,
        borderColor: borderColor,
        textColor: textColor,
      };
    });
  }, [props.tasks, props.completionsRev]);

  // INPUT: task (Task)
  // OUTPUT: none
  // EFFECT: Updates or inserts a task into the state array
  function upsert(task: Task) {
    props.setTasks([
      ...props.tasks.filter((t) => t.id !== task.id),
      task,
    ]);
    setDialogOpen(false);
  }

  // INPUT: id (string)
  // OUTPUT: none
  // EFFECT: Removes a task from the state array by ID
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
            
            // Renames the buttons to be cleaner
            buttonText={{
              dayGridWeek: 'List View',
              timeGridWeek: 'Time Grid View'
            }}

            // Dynamically controls event time display based on current view
            views={{
              dayGridWeek: {
                displayEventTime: false // Hides time text (e.g. "5:12p") in List View
              },
              timeGridWeek: {
                displayEventTime: true  // Shows it properly in Time Grid View
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