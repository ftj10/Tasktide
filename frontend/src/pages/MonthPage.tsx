// INPUT: task collection and navigation state
// OUTPUT: month grid page with per-day task previews
// EFFECT: Supports monthly schedule scanning and day-level navigation into the Today feature
import dayjs from "dayjs";
import { useState, useMemo, useEffect, useRef } from "react";
import { Box, Button, IconButton, Paper, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CheckIcon from "@mui/icons-material/Check";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

import type { Task } from "../types";
import { tasksForDate } from "../app/taskLogic";
import { ymd } from "../app/date";
import { COMPLETIONS_KEY, loadCompletions, type CompletionMap } from "../app/completions";

// INPUT: task collection
// OUTPUT: month calendar page
// EFFECT: Builds the month overview feature from planner tasks and completion state
export function MonthPage(props: { tasks: Task[] }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf("month"));
  const [completions, setCompletions] = useState<CompletionMap>(loadCompletions());
  const monthTouchStartXRef = useRef<number | null>(null);
  const monthTouchStartYRef = useRef<number | null>(null);
  const monthTouchCurrentXRef = useRef<number | null>(null);
  const monthTouchCurrentYRef = useRef<number | null>(null);

  // INPUT: storage updates for completion records
  // OUTPUT: refreshed completion state
  // EFFECT: Keeps the month overview aligned with completion changes from other planner views
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === COMPLETIONS_KEY) setCompletions(loadCompletions());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const currentLanguage = i18n.resolvedLanguage?.startsWith("zh") ? "zh" : "en";
  const monthLabel = new Intl.DateTimeFormat(currentLanguage, {
    month: "long",
    year: "numeric",
  }).format(currentMonth.toDate());

  const calendarDays = useMemo(() => {
    const start = currentMonth.startOf("month").startOf("week");
    const end = currentMonth.endOf("month").endOf("week");
    const days = [];
    let day = start;
    while (day.isBefore(end)) {
      days.push(day);
      day = day.add(1, "day");
    }
    return days;
  }, [currentMonth]);

  const weekDays = [
    t("month.weekdays.sun"),
    t("month.weekdays.mon"),
    t("month.weekdays.tue"),
    t("month.weekdays.wed"),
    t("month.weekdays.thu"),
    t("month.weekdays.fri"),
    t("month.weekdays.sat"),
  ];

  // INPUT: task emergency and completion state
  // OUTPUT: month task-chip colors
  // EFFECT: Keeps Month task previews visually grouped by shared urgency styling
  function taskChipColor(emergency: number | undefined, done: boolean) {
    if (done) return { bg: alpha("#94a3b8", 0.2), color: "#64748b" };
    switch (emergency) {
      case 1:
        return { bg: alpha("#ef4444", 0.95), color: "#fff" };
      case 2:
        return { bg: alpha("#f97316", 0.95), color: "#fff" };
      case 3:
        return { bg: alpha("#f59e0b", 0.95), color: "#fff" };
      case 4:
        return { bg: alpha("#10b981", 0.95), color: "#fff" };
      default:
        return { bg: alpha("#0ea5e9", 0.95), color: "#fff" };
    }
  }

  // INPUT: swipe gesture coordinates on the month task grid
  // OUTPUT: previous or next month selection
  // EFFECT: Lets the reduced month grid keep direct swipe navigation without restoring extra controls
  function handleMonthGridSwipeEnd() {
    const startX = monthTouchStartXRef.current;
    const startY = monthTouchStartYRef.current;
    const currentX = monthTouchCurrentXRef.current;
    const currentY = monthTouchCurrentYRef.current;
    monthTouchStartXRef.current = null;
    monthTouchStartYRef.current = null;
    monthTouchCurrentXRef.current = null;
    monthTouchCurrentYRef.current = null;
    if (startX === null || startY === null || currentX === null || currentY === null) return;
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    if (Math.abs(deltaY) < 42 || Math.abs(deltaY) <= Math.abs(deltaX)) return;
    if (deltaY < 0) {
      setCurrentMonth((current) => current.add(1, "month"));
      return;
    }
    setCurrentMonth((current) => current.subtract(1, "month"));
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", px: { xs: 1, sm: 2, md: 3 }, py: { xs: 0.75, sm: 2 } }}>
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          p: { xs: 1.25, sm: 2 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          background: "linear-gradient(135deg, rgba(79, 70, 229, 0.06), rgba(14, 165, 233, 0.05))",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {!isMobile ? (
              <IconButton
                aria-label="Previous month"
                size="small"
                onClick={() => setCurrentMonth((m) => m.subtract(1, "month"))}
                sx={{ bgcolor: "rgba(255,255,255,0.8)", border: "1px solid", borderColor: "divider" }}
              >
                <ChevronLeftRoundedIcon />
              </IconButton>
            ) : null}
            <Typography
              variant="subtitle1"
              sx={{
                fontSize: { xs: "0.95rem", sm: "1.1rem" },
                fontWeight: 800,
                minWidth: { xs: 110, sm: 160 },
                textAlign: "center",
              }}
            >
              {monthLabel}
            </Typography>
            {!isMobile ? (
              <IconButton
                aria-label="Next month"
                size="small"
                onClick={() => setCurrentMonth((m) => m.add(1, "month"))}
                sx={{ bgcolor: "rgba(255,255,255,0.8)", border: "1px solid", borderColor: "divider" }}
              >
                <ChevronRightRoundedIcon />
              </IconButton>
            ) : null}
          </Stack>
          <Button
            variant="outlined"
            onClick={() => setCurrentMonth(dayjs().startOf("month"))}
            sx={{
              borderRadius: 999,
              whiteSpace: "nowrap",
              px: { xs: 1.5, sm: 2 },
              py: 0.5,
              fontSize: { xs: "0.75rem", sm: "0.85rem" },
            }}
          >
            {t("month.jumpToCurrentMonth")}
          </Button>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 0.75, sm: 1.25 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "rgba(255,255,255,0.96)",
          boxShadow: "0 14px 36px rgba(15, 23, 42, 0.06)",
        }}
      >
        <Box
          data-testid="month-grid-surface"
          onTouchStart={(event) => {
            monthTouchStartXRef.current = event.touches[0]?.clientX ?? null;
            monthTouchStartYRef.current = event.touches[0]?.clientY ?? null;
            monthTouchCurrentXRef.current = event.touches[0]?.clientX ?? null;
            monthTouchCurrentYRef.current = event.touches[0]?.clientY ?? null;
          }}
          onTouchMove={(event) => {
            const nextX = event.touches[0]?.clientX ?? null;
            const nextY = event.touches[0]?.clientY ?? null;
            monthTouchCurrentXRef.current = nextX;
            monthTouchCurrentYRef.current = nextY;
            const startX = monthTouchStartXRef.current;
            const startY = monthTouchStartYRef.current;
            if (startX === null || startY === null || nextX === null || nextY === null) return;
            const deltaX = nextX - startX;
            const deltaY = nextY - startY;
            if (isMobile && Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
              event.preventDefault();
            }
          }}
          onTouchEnd={() => {
            if (isMobile) handleMonthGridSwipeEnd();
          }}
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: { xs: 0.45, sm: 0.85 },
            minWidth: 0,
            touchAction: isMobile ? "none" : "auto",
            overscrollBehaviorY: isMobile ? "contain" : "auto",
          }}
        >
          {weekDays.map((wd, idx) => {
            const isWeekend = idx === 0 || idx === 6;
            return (
              <Typography
                key={wd}
                align="center"
                sx={{
                  mb: 0.15,
                  py: { xs: 0.55, sm: 0.8 },
                  fontSize: { xs: "0.62rem", sm: "0.78rem" },
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  borderRadius: 2,
                  color: isWeekend ? "primary.main" : "text.secondary",
                  bgcolor: isWeekend ? alpha("#4f46e5", 0.06) : alpha("#0f172a", 0.03),
                }}
              >
                {wd}
              </Typography>
            );
          })}

          {calendarDays.map((d) => {
            const dateStr = ymd(d);
            const isCurrentMonth = d.month() === currentMonth.month();
            const isToday = dateStr === ymd(dayjs());
            const isPastDay = d.endOf("day").isBefore(dayjs());
            const isWeekend = d.day() === 0 || d.day() === 6;
            const dayTasks = tasksForDate(props.tasks, dateStr, completions);

            return (
              <Paper
                key={dateStr}
                variant="outlined"
                sx={{
                  minHeight: { xs: 78, sm: 120 },
                  p: { xs: 0.5, sm: 1 },
                  borderRadius: { xs: 2, sm: 3 },
                  bgcolor: isToday
                    ? alpha("#4f46e5", 0.08)
                    : isWeekend
                      ? alpha("#0ea5e9", 0.03)
                      : "background.paper",
                  opacity: isCurrentMonth ? 1 : 0.4,
                  cursor: "pointer",
                  transition: "transform 0.18s, background-color 0.18s, box-shadow 0.18s",
                  borderColor: isToday ? alpha("#4f46e5", 0.4) : "rgba(15, 23, 42, 0.08)",
                  borderWidth: isToday ? 2 : 1,
                  boxShadow: isToday ? "0 10px 24px rgba(79, 70, 229, 0.15)" : "none",
                  "&:hover": {
                    bgcolor: alpha("#4f46e5", 0.06),
                    transform: "translateY(-1px)",
                    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                  },
                }}
                onClick={() => navigate(`/?date=${dateStr}`)}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 0.2 }}>
                  {isPastDay && !isToday ? (
                    <CheckIcon sx={{ fontSize: { xs: 11, sm: 14 }, color: alpha("#94a3b8", 0.8) }} />
                  ) : (
                    <Box sx={{ width: { xs: 11, sm: 14 } }} />
                  )}
                  <Typography
                    variant="body2"
                    fontWeight={isToday ? 800 : 600}
                    color={isToday ? "primary.main" : isWeekend ? "secondary.main" : "text.primary"}
                    align="right"
                    sx={{ fontSize: { xs: "0.75rem", sm: "0.95rem" } }}
                  >
                    {d.date()}
                  </Typography>
                </Box>

                <Stack spacing={0.35} sx={{ mt: { xs: 0.4, sm: 0.7 } }}>
                  {dayTasks.slice(0, 3).map((task, idx) => {
                    const { bg, color } = taskChipColor(task.emergency, !!task.done);
                    return (
                      <Typography
                        key={task.id || idx}
                        variant="caption"
                        sx={{
                          display: "block",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          bgcolor: bg,
                          color,
                          px: { xs: 0.5, sm: 0.75 },
                          py: 0.2,
                          borderRadius: 1.2,
                          textDecoration: task.done ? "line-through" : "none",
                          fontSize: { xs: "0.55rem", sm: "0.72rem" },
                          fontWeight: 700,
                        }}
                      >
                        {task.title}
                      </Typography>
                    );
                  })}

                  {dayTasks.length > 3 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      align="center"
                      sx={{ fontSize: { xs: 9, sm: 11 }, fontWeight: 600 }}
                    >
                      {t("month.moreTasks", { count: dayTasks.length - 3 })}
                    </Typography>
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}
