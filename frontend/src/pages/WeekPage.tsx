// INPUT: task collection plus task-editing actions
// OUTPUT: weekly calendar page with navigation and task editing actions
// EFFECT: Turns planner tasks into week-view events and connects week interactions back to task dialogs and day routing
import {
  Box,
  Button,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import type { Task } from "../types";
import { toCalendarEventsForRange, type PlannerCalendarEvent } from "../app/taskLogic";
import { TaskDialog } from "../components/TaskDialog";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import { weekStartMonday, ymd } from "../app/date";
import {
  getTaskOccurrence,
  removeTaskFromCollection,
  saveTaskCollection,
  type TaskSaveScope,
} from "../app/tasks";
import { getPriorityColors } from "../app/priorities";
import { deleteSyllabusBatch } from "../app/storage";

export function WeekPage(props: {
  tasks: Task[];
  setTasks: (next: Task[]) => void;
  onTaskDialogVisibilityChange?: (open: boolean) => void;
  showToast?: (message: string, severity?: "success" | "error" | "info" | "warning") => void;
  reloadTasks?: () => Promise<void>;
}) {
  const { tasks, setTasks, onTaskDialogVisibilityChange, showToast, reloadTasks } = props;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  const [editingSourceTask, setEditingSourceTask] = useState<Task | undefined>();
  const [deleteTask, setDeleteTask] = useState<{
    task: Task;
    scope: TaskSaveScope;
    sourceTask?: Task;
    occurrenceDateYmd?: string;
  } | undefined>();
  const [defaultDate, setDefaultDate] = useState<string | undefined>();
  const [defaultEndDate, setDefaultEndDate] = useState<string | undefined>();
  const [defaultStartTime, setDefaultStartTime] = useState<string | undefined>();
  const [defaultEndTime, setDefaultEndTime] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<"dayGrid" | "timeGrid">("timeGrid");
  const [mobileWeekStart, setMobileWeekStart] = useState(() => dayjs(weekStartMonday(dayjs())));
  const [mobilePageKind, setMobilePageKind] = useState<"first" | "second">(() =>
    dayjs().diff(dayjs(weekStartMonday(dayjs())), "day") >= 4 ? "second" : "first"
  );
  const [desktopVisibleRange, setDesktopVisibleRange] = useState(() => {
    const start = dayjs(weekStartMonday(dayjs()));
    return { start, end: start.add(7, "day") };
  });
  const mobilePagerRef = useRef<HTMLDivElement | null>(null);
  const mobileTransitionLockRef = useRef(false);
  const mobileScrollSettleRef = useRef<number | null>(null);

  useEffect(() => {
    onTaskDialogVisibilityChange?.(dialogOpen);
    return () => {
      onTaskDialogVisibilityChange?.(false);
    };
  }, [dialogOpen, onTaskDialogVisibilityChange]);

  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);

  function closeTaskEditor() {
    setDialogOpen(false);
    setEditing(undefined);
    setEditingSourceTask(undefined);
    setDefaultStartTime(undefined);
    setDefaultEndDate(undefined);
    setDefaultEndTime(undefined);
  }

  const buildEventsForRange = useCallback((rangeStart: dayjs.Dayjs, rangeEnd: dayjs.Dayjs): PlannerCalendarEvent[] => {
    const baseEvents = toCalendarEventsForRange(
      tasks,
      rangeStart,
      rangeEnd
    );

    return baseEvents.map((ev) => {
      const sourceTask =
        taskById.get(ev.extendedProps.taskId) ?? ev.extendedProps.sourceTask;
      const occurrenceTask = ev.extendedProps.task;
      const displayTask = occurrenceTask ?? sourceTask;
      const colors = getPriorityColors(displayTask);

      const dateYmd =
        typeof ev.start === "string"
          ? ev.start.substring(0, 10)
          : dayjs(ev.start).format("YYYY-MM-DD");

      if (displayTask?.startTime) {
        const startAt = dayjs(`${dateYmd}T${displayTask.startTime}:00`);
        const implicitEndAt = startAt.add(1, "hour");
        const endDateYmd = displayTask.endDate ?? dateYmd;
        const dayEndAt = dayjs(`${endDateYmd}T23:59:00`);
        const endAt = displayTask.endTime
          ? dayjs(`${endDateYmd}T${displayTask.endTime}:00`)
          : implicitEndAt.isAfter(dayEndAt)
          ? dayEndAt
          : implicitEndAt;

        return {
          ...ev,
          title: displayTask?.title ?? ev.title,
          start: startAt.format("YYYY-MM-DDTHH:mm:ss"),
          end: endAt.format("YYYY-MM-DDTHH:mm:ss"),
          allDay: false,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: colors.text,
          extendedProps: { ...ev.extendedProps, sourceTask, task: displayTask },
        };
      }

      return {
        ...ev,
        title: displayTask?.title ?? ev.title,
        allDay: true,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        extendedProps: { ...ev.extendedProps, sourceTask, task: displayTask },
      };
    });
  }, [taskById, tasks]);

  const desktopEvents = useMemo(
    () => buildEventsForRange(desktopVisibleRange.start, desktopVisibleRange.end),
    [buildEventsForRange, desktopVisibleRange.end, desktopVisibleRange.start]
  );

  function upsert(task: Task, scope: TaskSaveScope = "series") {
    setTasks(
      saveTaskCollection(tasks, task, {
        editingSourceTask,
        scope,
        occurrenceDateYmd: defaultDate,
      })
    );
    closeTaskEditor();
  }

  function remove(taskId: string, scope: TaskSaveScope = "series", sourceTask?: Task, occurrenceDateYmd?: string) {
    setTasks(
      removeTaskFromCollection(tasks, taskId, {
        editingSourceTask: sourceTask,
        scope,
        occurrenceDateYmd,
        updatedAt: new Date().toISOString(),
      })
    );
    setDeleteTask(undefined);
    closeTaskEditor();
  }

  async function removeSyllabusBatch(batchId: string) {
    try {
      await deleteSyllabusBatch(batchId);
      await reloadTasks?.();
      setDeleteTask(undefined);
      closeTaskEditor();
      showToast?.(t("toast.syllabusDeleted"), "success");
    } catch {
      showToast?.(t("toast.syllabusDeleteFailed"), "error");
    }
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
          label: `${prevWeekStart.add(4, "day").format("MMM D")} - ${prevWeekStart
            .add(6, "day")
            .format("MMM D")}`,
        },
        {
          key: "current-first",
          start: mobileWeekStart,
          end: mobileWeekStart.add(4, "day"),
          label: `${mobileWeekStart.format("MMM D")} - ${mobileWeekStart
            .add(3, "day")
            .format("MMM D")}`,
        },
        {
          key: "current-second",
          start: mobileWeekStart.add(4, "day"),
          end: mobileWeekStart.add(7, "day"),
          label: `${mobileWeekStart.add(4, "day").format("MMM D")} - ${mobileWeekStart
            .add(6, "day")
            .format("MMM D")}`,
        },
      ];
    }

    return [
      {
        key: "current-first",
        start: mobileWeekStart,
        end: mobileWeekStart.add(4, "day"),
        label: `${mobileWeekStart.format("MMM D")} - ${mobileWeekStart
          .add(3, "day")
          .format("MMM D")}`,
      },
      {
        key: "current-second",
        start: mobileWeekStart.add(4, "day"),
        end: mobileWeekStart.add(7, "day"),
        label: `${mobileWeekStart.add(4, "day").format("MMM D")} - ${mobileWeekStart
          .add(6, "day")
          .format("MMM D")}`,
      },
      {
        key: "next-first",
        start: nextWeekStart,
        end: nextWeekStart.add(4, "day"),
        label: `${nextWeekStart.format("MMM D")} - ${nextWeekStart
          .add(3, "day")
          .format("MMM D")}`,
      },
    ];
  }, [mobilePageKind, mobileWeekStart]);

  const mobilePagesWithEvents = useMemo(
    () =>
      mobilePages.map((page) => ({
        ...page,
        events: buildEventsForRange(page.start, page.end),
      })),
    [buildEventsForRange, mobilePages]
  );

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

  function openCreateDialogForRange(startIso: string, endIso: string) {
    const startAt = dayjs(startIso);
    const endAt = dayjs(endIso);

    setEditing(undefined);
    setEditingSourceTask(undefined);
    setDefaultDate(startAt.format("YYYY-MM-DD"));
    setDefaultEndDate(endAt.format("YYYY-MM-DD"));
    setDefaultStartTime(startAt.format("HH:mm"));
    setDefaultEndTime(endAt.format("HH:mm"));
    setDialogOpen(true);
  }

  function renderCalendar(events: PlannerCalendarEvent[], pageStart?: dayjs.Dayjs, pageEnd?: dayjs.Dayjs, pageKey?: string) {
    const isMobileSlice = !!pageStart && !!pageEnd && !!pageKey;
    const allowRangeCreate = isMobileSlice && viewMode === "timeGrid";

    return (
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView={
          isMobileSlice
            ? viewMode === "dayGrid"
              ? "mobileDayGrid"
              : "mobileTimeGrid"
            : "timeGridWeek"
        }
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
          timeGridWeek: t("week.timeGridView"),
        }}
        navLinks={true}
        selectable={allowRangeCreate}
        selectMirror={allowRangeCreate}
        selectLongPressDelay={350}
        datesSet={(info) => {
          if (isMobileSlice) return;
          setDesktopVisibleRange((current) => {
            const nextStart = dayjs(info.start);
            const nextEnd = dayjs(info.end);

            if (ymd(current.start) === ymd(nextStart) && ymd(current.end) === ymd(nextEnd)) {
              return current;
            }

            return {
              start: nextStart,
              end: nextEnd,
            };
          });
        }}
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
          const isTimed = !eventInfo.event.allDay;
          const timeText = eventInfo.timeText;

          return (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                gap: 0.25,
                px: 0.6,
                py: 0.4,
                overflow: "hidden",
                borderRadius: "4px",
                minHeight: "100%",
                borderLeft: isTimed ? "3px solid rgba(255,255,255,0.45)" : "none",
              }}
            >
              {isTimed ? (
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                  <AccessTimeIcon sx={{ fontSize: 12, color: "inherit", flexShrink: 0 }} />
                  <Typography
                    variant="caption"
                    sx={{ fontSize: 10, fontWeight: 700, lineHeight: 1.1, whiteSpace: "nowrap" }}
                  >
                    {timeText}
                  </Typography>
                </Stack>
              ) : null}
              <Typography
                variant="caption"
                sx={{
                  fontSize: 11,
                  fontWeight: isTimed ? 600 : 700,
                  whiteSpace: isTimed ? "normal" : "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.15,
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: isTimed ? 2 : 1,
                }}
              >
                {eventInfo.event.title}
              </Typography>
            </Box>
          );
        }}
        eventClick={(info) => {
          const task = info.event.extendedProps.sourceTask as Task | undefined;
          if (!task) return;
          const occurrenceDate =
            (info.event.extendedProps.occurrenceDate as string | undefined) ?? info.event.startStr.slice(0, 10);
          setEditingSourceTask(task);
          setEditing(getTaskOccurrence(task, occurrenceDate) ?? task);
          setDefaultDate(occurrenceDate);
          setDefaultStartTime(undefined);
          setDefaultEndTime(undefined);
          setDialogOpen(true);
        }}
        dateClick={(info) => {
          setDefaultDate(info.dateStr.slice(0, 10));
        }}
        selectAllow={(info) => allowRangeCreate && !info.allDay}
        select={(info) => {
          if (!allowRangeCreate || info.allDay) return;
          openCreateDialogForRange(info.startStr, info.endStr);
          info.view.calendar.unselect();
        }}
        height="auto"
        contentHeight="auto"
        slotMinTime="06:00:00"
        allDaySlot={true}
      />
    );
  }

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
          mb: 2,
          p: { xs: 1.75, sm: 2.5 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          background:
            "linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(14, 165, 233, 0.06))",
          boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
          <Stack spacing={0.25}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6" fontWeight={800} sx={{ fontSize: { xs: "1.05rem", sm: "1.4rem" } }}>
                {t("week.title")}
              </Typography>
              <Button
                id="week-help-button"
                variant="text"
                size="small"
                startIcon={<HelpOutlineIcon />}
                onClick={() => navigate("/help?topic=drag-to-add")}
                sx={{ minWidth: "auto", borderRadius: 2 }}
              >
                {t("help.title")}
              </Button>
            </Stack>
          </Stack>
          {!isMobile ? (
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => {
                setEditing(undefined);
                setEditingSourceTask(undefined);
                setDefaultStartTime(undefined);
                setDefaultEndTime(undefined);
                setDialogOpen(true);
              }}
              sx={{ borderRadius: 2.5 }}
            >
              {t("today.addTask")}
            </Button>
          ) : null}
        </Stack>
      </Paper>

      {isMobile ? (
        <Box sx={{ width: "100%" }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{
              mb: 1.25,
              px: 1.5,
              py: 1,
              borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.95)",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 6px 18px rgba(15, 23, 42, 0.05)",
            }}
          >
            <Typography variant="subtitle2" fontWeight={800}>
              {mobilePages[1]?.label}
            </Typography>
            <Button
              variant="text"
              size="small"
              onClick={() => {
                const today = dayjs();
                setMobileWeekStart(dayjs(weekStartMonday(today)));
                setMobilePageKind(
                  today.diff(dayjs(weekStartMonday(today)), "day") >= 4 ? "second" : "first"
                );
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
            sx={{
              mb: 1.25,
              bgcolor: "rgba(255,255,255,0.95)",
              borderRadius: 3,
              p: 0.5,
              boxShadow: "0 6px 18px rgba(15, 23, 42, 0.05)",
              "& .MuiToggleButton-root": {
                border: "none !important",
                borderRadius: "10px !important",
                "&.Mui-selected": {
                  background: "linear-gradient(135deg, #4f46e5, #0ea5e9)",
                  color: "#fff",
                  "&:hover": {
                    background: "linear-gradient(135deg, #4338ca, #0284c7)",
                  },
                },
              },
            }}
          >
            <ToggleButton value="dayGrid">{t("week.listView")}</ToggleButton>
            <ToggleButton value="timeGrid">{t("week.timeGridView")}</ToggleButton>
          </ToggleButtonGroup>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1.5, textAlign: "center", px: 1 }}
          >
            {t("week.mobileCreateHint")}
          </Typography>

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
            {mobilePagesWithEvents.map((page) => (
              <Box
                key={`${page.key}-${viewMode}-${mobilePageKind}-${ymd(mobileWeekStart)}`}
                sx={{
                  flex: "0 0 100%",
                  width: "100%",
                  scrollSnapAlign: "start",
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    bgcolor: "rgba(255,255,255,0.98)",
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
                    p: 1,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1, textAlign: "center", fontWeight: 800 }}
                  >
                    {page.label}
                  </Typography>
                  <Box
                    sx={{
                      "& .fc": { fontSize: "0.82rem" },
                      "& .fc-theme-standard td, & .fc-theme-standard th": {
                        borderColor: alpha("#0f172a", 0.08),
                      },
                      "& .fc-scrollgrid": {
                        borderRadius: 2,
                        overflow: "hidden",
                        borderColor: alpha("#0f172a", 0.08),
                      },
                      "& .fc-col-header-cell": { bgcolor: alpha("#4f46e5", 0.06) },
                      "& .fc-timegrid-slot": { height: "2.6rem" },
                      "& .fc-event": {
                        borderRadius: "6px !important",
                        border: "none !important",
                      },
                    }}
                  >
                    {renderCalendar(page.events, page.start, page.end, page.key)}
                  </Box>
                </Paper>
              </Box>
            ))}
          </Box>
        </Box>
      ) : (
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            overflowX: "auto",
            borderRadius: 4,
            bgcolor: "rgba(255,255,255,0.98)",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
            p: 2,
          }}
        >
          <Box
            sx={{
              minWidth: { xs: 560, sm: 700 },
              "& .fc": { fontSize: "0.92rem" },
              "& .fc-toolbar-title": { fontSize: "1.15rem", fontWeight: 800 },
              "& .fc-button": {
                borderRadius: "10px !important",
                textTransform: "none",
                fontWeight: 600,
                border: "1px solid rgba(15, 23, 42, 0.1) !important",
                background: "rgba(255,255,255,0.9) !important",
                color: "#0f172a !important",
                boxShadow: "none !important",
              },
              "& .fc-button-primary.fc-button-active, & .fc-button-primary:not(:disabled):active": {
                background: "linear-gradient(135deg, #4f46e5, #0ea5e9) !important",
                color: "#fff !important",
                border: "none !important",
              },
              "& .fc-col-header-cell": { bgcolor: alpha("#4f46e5", 0.06) },
              "& .fc-theme-standard td, & .fc-theme-standard th": {
                borderColor: alpha("#0f172a", 0.08),
              },
              "& .fc-scrollgrid": {
                borderRadius: 3,
                overflow: "hidden",
                borderColor: alpha("#0f172a", 0.08),
              },
              "& .fc-timegrid-slot": { height: "3rem" },
              "& .fc-event": {
                borderRadius: "8px !important",
                border: "none !important",
                boxShadow: "0 4px 10px rgba(15, 23, 42, 0.08)",
              },
              "& .fc-today": {
                background: `${alpha("#4f46e5", 0.04)} !important`,
              },
            }}
          >
            {renderCalendar(desktopEvents)}
          </Box>
        </Paper>
      )}

      <TaskDialog
        open={dialogOpen}
        mode={editing ? "edit" : "create"}
        task={editing}
        occurrenceDateYmd={editing ? defaultDate : undefined}
        defaultDateYmd={defaultDate || ""}
        defaultEndDateYmd={defaultEndDate}
        defaultStartTime={defaultStartTime}
        defaultEndTime={defaultEndTime}
        onClose={closeTaskEditor}
        onSave={upsert}
        onDelete={(id, scope = "series") => {
          const task = tasks.find((item) => item.id === id);
          if (!task) return;
          setDeleteTask({
            task,
            scope,
            sourceTask: editingSourceTask,
            occurrenceDateYmd: defaultDate,
          });
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
        syllabusTaskCount={
          deleteTask?.task.syllabusImportBatchId
            ? tasks.filter((t) => t.syllabusImportBatchId === deleteTask.task.syllabusImportBatchId).length
            : undefined
        }
        onDeleteSyllabus={
          deleteTask?.task.syllabusImportBatchId
            ? () => void removeSyllabusBatch(deleteTask.task.syllabusImportBatchId!)
            : undefined
        }
      />
    </Box>
  );
}
