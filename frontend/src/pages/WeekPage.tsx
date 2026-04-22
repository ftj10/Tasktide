// INPUT: task collection plus completion refresh state
// OUTPUT: weekly calendar page with navigation and task editing actions
// EFFECT: Turns planner tasks into week-view events and connects week interactions back to task dialogs and day routing
import { Box, Button, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import type { Task } from "../types";
import { toCalendarEventsForRange } from "../app/taskLogic";
import { TaskDialog } from "../components/TaskDialog";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import { loadCompletions } from "../app/completions";

// INPUT: optional task record
// OUTPUT: event color tokens
// EFFECT: Aligns week-view event styling with the shared task-priority feature
function getTaskColors(task?: Task) {
  if (task?.done) {
    return { bg: "#eeeeee", border: "#bdbdbd", text: "#9e9e9e" }; 
  }
  
  const palette = ["#d32f2f", "#ed6c02", "#ff9800", "#4caf50", "#2196f3"];
  const baseColor = palette[(task?.emergency || 5) - 1];

  return {
    bg: baseColor,
    border: baseColor,
    text: "#ffffff"
  };
}

// INPUT: task collection, save callback, and completion revision
// OUTPUT: week calendar page
// EFFECT: Supports weekly schedule review, event editing, date jumps, and date-prefilled task creation
export function WeekPage(props: {
  tasks: Task[];
  setTasks: (next: Task[]) => void;
  completionsRev: number;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  const [deleteTask, setDeleteTask] = useState<Task | undefined>();
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
      const colors = getTaskColors(task);

      const dateYmd = typeof ev.start === "string" 
          ? ev.start.substring(0, 10) 
          : dayjs(ev.start).format("YYYY-MM-DD");

      if (task && task.startTime) {
        const startAt = dayjs(`${dateYmd}T${task.startTime}:00`);
        const implicitEndAt = startAt.add(1, "hour");
        const dayEndAt = dayjs(`${dateYmd}T23:59:00`);
        const endAt = task.endTime
          ? dayjs(`${dateYmd}T${task.endTime}:00`)
          : (implicitEndAt.isAfter(dayEndAt) ? dayEndAt : implicitEndAt);

        return {
          ...ev,
          start: startAt.format("YYYY-MM-DDTHH:mm:ss"),
          end: endAt.format("YYYY-MM-DDTHH:mm:ss"),
          allDay: false, 
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: colors.text,
          extendedProps: { ...ev.extendedProps, task }
        };
      }

      return {
        ...ev,
        allDay: true,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        extendedProps: { ...ev.extendedProps, task }
      };
    });
  }, [props.tasks, props.completionsRev]);

  function upsert(task: Task) {
    props.setTasks([...props.tasks.filter((t) => t.id !== task.id), task]);
    setDialogOpen(false);
  }

  function remove(id: string) {
    props.setTasks(props.tasks.filter((t) => t.id !== id));
    setDeleteTask(undefined);
    setDialogOpen(false);
    setEditing(undefined);
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 1, sm: 2 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h6" sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>{t('week.title')}</Typography>
        <Button variant="contained" onClick={() => { setEditing(undefined); setDialogOpen(true); }}>
          {t('today.addTask')}
        </Button>
      </Stack>

      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <Box sx={{ minWidth: { xs: 560, sm: 700 } }}>
          <FullCalendar
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView="dayGridWeek"
            eventDisplay="block"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridWeek,timeGridWeek",
            }}
            buttonText={{
              today: t("week.todayButton"),
              dayGridWeek: t("week.listView"),
              timeGridWeek: t("week.timeGridView")
            }}
            navLinks={true}
            navLinkDayClick={(date) => {
              navigate(`/?date=${dayjs(date).format("YYYY-MM-DD")}`);
            }}
            firstDay={1}
            events={events}
            slotEventOverlap={false}
            eventMaxStack={4}
            eventMinHeight={28}
            expandRows={true}
            
            eventContent={(eventInfo) => {
              const task = eventInfo.event.extendedProps.task as Task;
              const isTimed = !eventInfo.event.allDay;
              const timeText = eventInfo.timeText;
              
              return (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: 0.25, 
                  px: 0.5, 
                  py: 0.35,
                  overflow: 'hidden',
                  borderRadius: '2px',
                  minHeight: '100%',
                  borderLeft: isTimed ? '3px solid rgba(0,0,0,0.3)' : 'none'
                }}>
                  {isTimed ? (
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                      <AccessTimeIcon sx={{ fontSize: 12, color: 'inherit', flexShrink: 0 }} />
                      <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 'bold', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                        {timeText}
                      </Typography>
                    </Stack>
                  ) : null}
                  <Typography variant="caption" sx={{ 
                    fontSize: 11, 
                    fontWeight: isTimed ? 'normal' : 'bold',
                    textDecoration: task?.done ? 'line-through' : 'none',
                    whiteSpace: isTimed ? 'normal' : 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.15,
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: isTimed ? 2 : 1
                  }}>
                    {eventInfo.event.title}
                  </Typography>
                </Box>
              );
            }}

            eventClick={(info) => {
              const taskId = info.event.extendedProps.taskId as string;
              const task = props.tasks.find((t) => t.id === taskId);
              if (!task) return;
              setEditing(task);
              setDefaultDate(info.event.startStr.slice(0, 10));
              setDialogOpen(true);
            }}
            dateClick={(info) => {
              setDefaultDate(info.dateStr.slice(0, 10));
            }}
            height="auto"
            contentHeight="auto"
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
        onClose={() => { setDialogOpen(false); setEditing(undefined); }}
        onSave={upsert}
        onDelete={(id) => {
          const task = props.tasks.find((item) => item.id === id);
          if (task) setDeleteTask(task);
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
