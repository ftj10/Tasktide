// INPUT: task collection plus completion refresh state
// OUTPUT: weekly calendar page with navigation and task editing actions
// EFFECT: Turns planner tasks into week-view events and connects week interactions back to task dialogs and day routing
import { Box, Button, Stack, ToggleButton, ToggleButtonGroup, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { weekStartMonday, ymd } from "../app/date";
import {
  applySeriesEdit,
  applySingleOccurrenceEdit,
  getTaskOccurrence,
  normalizeTask,
  type TaskSaveScope,
} from "../app/tasks";

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  const [editingSourceTask, setEditingSourceTask] = useState<Task | undefined>();
  const [deleteTask, setDeleteTask] = useState<Task | undefined>();
  const [defaultDate, setDefaultDate] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<"dayGrid" | "timeGrid">("dayGrid");
  const [mobileWeekStart, setMobileWeekStart] = useState(() => dayjs(weekStartMonday(dayjs())));
  const [mobilePageKind, setMobilePageKind] = useState<"first" | "second">(() =>
    dayjs().diff(dayjs(weekStartMonday(dayjs())), "day") >= 4 ? "second" : "first"
  );
  const mobilePagerRef = useRef<HTMLDivElement | null>(null);
  const mobileTransitionLockRef = useRef(false);
  const mobileScrollSettleRef = useRef<number | null>(null);

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

  function upsert(task: Task, scope: TaskSaveScope = "series") {
    if (editingSourceTask && scope === "single" && defaultDate) {
      props.setTasks(
        props.tasks.map((item) =>
          item.id === editingSourceTask.id
            ? applySingleOccurrenceEdit(item, defaultDate, task)
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

  const mobilePages = useMemo(() => {
    const prevWeekStart = mobileWeekStart.subtract(1, "week");
    const nextWeekStart = mobileWeekStart.add(1, "week");

    if (mobilePageKind === "first") {
      return [
        {
          key: "prev-second",
          start: prevWeekStart.add(4, "day"),
          end: prevWeekStart.add(7, "day"),
          label: `${prevWeekStart.add(4, "day").format("MMM D")} - ${prevWeekStart.add(6, "day").format("MMM D")}`,
        },
        {
          key: "current-first",
          start: mobileWeekStart,
          end: mobileWeekStart.add(4, "day"),
          label: `${mobileWeekStart.format("MMM D")} - ${mobileWeekStart.add(3, "day").format("MMM D")}`,
        },
        {
          key: "current-second",
          start: mobileWeekStart.add(4, "day"),
          end: mobileWeekStart.add(7, "day"),
          label: `${mobileWeekStart.add(4, "day").format("MMM D")} - ${mobileWeekStart.add(6, "day").format("MMM D")}`,
        },
      ];
    }

    return [
      {
        key: "current-first",
        start: mobileWeekStart,
        end: mobileWeekStart.add(4, "day"),
        label: `${mobileWeekStart.format("MMM D")} - ${mobileWeekStart.add(3, "day").format("MMM D")}`,
      },
      {
        key: "current-second",
        start: mobileWeekStart.add(4, "day"),
        end: mobileWeekStart.add(7, "day"),
        label: `${mobileWeekStart.add(4, "day").format("MMM D")} - ${mobileWeekStart.add(6, "day").format("MMM D")}`,
      },
      {
        key: "next-first",
        start: nextWeekStart,
        end: nextWeekStart.add(4, "day"),
        label: `${nextWeekStart.format("MMM D")} - ${nextWeekStart.add(3, "day").format("MMM D")}`,
      },
    ];
  }, [mobilePageKind, mobileWeekStart]);

  function scrollToMobilePage(pageIndex: number, behavior: ScrollBehavior = "auto") {
    const pager = mobilePagerRef.current;
    if (!pager) return;
    const left = pager.clientWidth * pageIndex;
    if (typeof pager.scrollTo === "function") {
      pager.scrollTo({ left, behavior });
      return;
    }
    pager.scrollLeft = left;
  }

  useEffect(() => {
    if (!isMobile) return;
    requestAnimationFrame(() => {
      scrollToMobilePage(1);
      window.setTimeout(() => {
        mobileTransitionLockRef.current = false;
      }, 80);
    });
  }, [isMobile, mobilePageKind, mobileWeekStart]);

  useEffect(() => {
    return () => {
      if (mobileScrollSettleRef.current !== null) {
        window.clearTimeout(mobileScrollSettleRef.current);
      }
    };
  }, []);

  function moveMobilePage(direction: -1 | 1) {
    if (direction === 1) {
      if (mobilePageKind === "first") {
        setMobilePageKind("second");
        return;
      }
      setMobileWeekStart((current) => current.add(1, "week"));
      setMobilePageKind("first");
      return;
    }

    if (mobilePageKind === "second") {
      setMobilePageKind("first");
      return;
    }
    setMobileWeekStart((current) => current.subtract(1, "week"));
    setMobilePageKind("second");
  }

  function renderCalendar(pageStart?: dayjs.Dayjs, pageEnd?: dayjs.Dayjs, pageKey?: string) {
    const isMobileSlice = !!pageStart && !!pageEnd && !!pageKey;

    return (
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView={isMobileSlice ? (viewMode === "dayGrid" ? "mobileDayGrid" : "mobileTimeGrid") : "dayGridWeek"}
        views={
          isMobileSlice
            ? {
                mobileDayGrid: { type: "dayGrid" },
                mobileTimeGrid: { type: "timeGrid" },
              }
            : undefined
        }
        visibleRange={
          isMobileSlice && pageStart && pageEnd
            ? {
                start: ymd(pageStart),
                end: ymd(pageEnd),
              }
            : undefined
        }
        eventDisplay="block"
        headerToolbar={
          isMobileSlice
            ? false
            : {
                left: "prev,next today",
                center: "title",
                right: "dayGridWeek,timeGridWeek",
              }
        }
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
          const occurrenceDate = info.event.startStr.slice(0, 10);
          setEditingSourceTask(task);
          setEditing(getTaskOccurrence(task, occurrenceDate) ?? normalizeTask(task));
          setDefaultDate(occurrenceDate);
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
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 1, sm: 2 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h6" sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>{t('week.title')}</Typography>
        <Button variant="contained" onClick={() => { setEditing(undefined); setDialogOpen(true); }}>
          {t('today.addTask')}
        </Button>
      </Stack>

      {isMobile ? (
        <Box sx={{ width: "100%" }}>
          <Stack direction="row" justifyContent="center" sx={{ mb: 1 }}>
            <Button
              variant="text"
              onClick={() => {
                const today = dayjs();
                setMobileWeekStart(dayjs(weekStartMonday(today)));
                setMobilePageKind(today.diff(dayjs(weekStartMonday(today)), "day") >= 4 ? "second" : "first");
              }}
            >
              {t("week.todayButton")}
            </Button>
          </Stack>

          <ToggleButtonGroup
            exclusive
            value={viewMode}
            onChange={(_, nextView: "dayGrid" | "timeGrid" | null) => {
              if (nextView) setViewMode(nextView);
            }}
            fullWidth
            sx={{ mb: 1.5 }}
          >
            <ToggleButton value="dayGrid">{t("week.listView")}</ToggleButton>
            <ToggleButton value="timeGrid">{t("week.timeGridView")}</ToggleButton>
          </ToggleButtonGroup>

          <Box
            data-testid="mobile-week-pager"
            ref={mobilePagerRef}
            onScroll={(event) => {
              if (mobileTransitionLockRef.current) return;
              const pager = event.currentTarget;
              if (mobileScrollSettleRef.current !== null) {
                window.clearTimeout(mobileScrollSettleRef.current);
              }
              mobileScrollSettleRef.current = window.setTimeout(() => {
                if (mobileTransitionLockRef.current) return;
                const pageWidth = pager.clientWidth || 1;
                const progress = pager.scrollLeft / pageWidth;

                if (progress <= 0.35) {
                  mobileTransitionLockRef.current = true;
                  moveMobilePage(-1);
                  return;
                }
                if (progress >= 1.65) {
                  mobileTransitionLockRef.current = true;
                  moveMobilePage(1);
                  return;
                }

                mobileTransitionLockRef.current = true;
                scrollToMobilePage(1, "smooth");
                window.setTimeout(() => {
                  mobileTransitionLockRef.current = false;
                }, 120);
              }, 120);
            }}
            sx={{
              display: "flex",
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {mobilePages.map((page) => (
              <Box
                key={`${page.key}-${viewMode}-${mobilePageKind}-${ymd(mobileWeekStart)}`}
                sx={{
                  flex: "0 0 100%",
                  width: "100%",
                  scrollSnapAlign: "start",
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1, textAlign: "center" }}>
                  {page.label}
                </Typography>
                {renderCalendar(page.start, page.end, page.key)}
              </Box>
            ))}
          </Box>
        </Box>
      ) : (
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <Box sx={{ minWidth: { xs: 560, sm: 700 } }}>
            {renderCalendar()}
          </Box>
        </Box>
      )}

      <TaskDialog
        open={dialogOpen}
        mode={editing ? "edit" : "create"}
        task={editing}
        occurrenceDateYmd={editing ? defaultDate : undefined}
        defaultDateYmd={defaultDate || ""}
        onClose={() => { setDialogOpen(false); setEditing(undefined); setEditingSourceTask(undefined); }}
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
