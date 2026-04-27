// INPUT: task collection and navigation state
// OUTPUT: month grid page with per-day task previews
// EFFECT: Supports monthly schedule scanning and day-level navigation into the Today feature
import dayjs from "dayjs";
import { useState, useMemo, useEffect, useRef } from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CheckIcon from "@mui/icons-material/Check";

import type { Task } from "../types";
import { tasksForDate } from "../app/taskLogic";
import { ymd } from "../app/date";
import { COMPLETIONS_KEY, loadCompletions, type CompletionMap } from "../app/completions";

// INPUT: task collection and save callback
// OUTPUT: month calendar page
// EFFECT: Builds the month overview feature from planner tasks and completion state
export function MonthPage(props: { tasks: Task[]; setTasks: (next: Task[]) => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
      setCurrentMonth((current) => current.subtract(1, "month"));
      return;
    }
    setCurrentMonth((current) => current.add(1, "month"));
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 1, sm: 2 } }}>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <Button variant="outlined" onClick={() => setCurrentMonth(dayjs().startOf("month"))} sx={{ borderRadius: 999 }}>
          {t("month.jumpToCurrentMonth")}
        </Button>
      </Box>

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
          if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
            event.preventDefault();
          }
        }}
        onTouchEnd={() => {
          handleMonthGridSwipeEnd();
        }}
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: { xs: 0.75, sm: 1 },
          minWidth: 0,
          touchAction: "none",
          overscrollBehaviorY: "contain",
        }}
      >
        {weekDays.map((wd) => (
          <Typography
            key={wd}
            align="center"
            fontWeight="bold"
            sx={{
              mb: 0.5,
              py: 0.75,
              fontSize: { xs: "0.72rem", sm: "1rem" },
              borderRadius: 2,
              bgcolor: "rgba(76, 175, 80, 0.08)",
            }}
          >
            {wd}
          </Typography>
        ))}

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
                minHeight: { xs: 88, sm: 124 },
                p: { xs: 0.75, sm: 1 },
                borderRadius: 3,
                bgcolor: isToday
                  ? "rgba(33, 150, 243, 0.12)"
                  : isWeekend
                    ? "rgba(76, 175, 80, 0.05)"
                    : "background.paper",
                opacity: isCurrentMonth ? 1 : 0.4,
                cursor: "pointer",
                transition: "transform 0.18s, background-color 0.18s, box-shadow 0.18s",
                borderColor: isToday ? "rgba(33, 150, 243, 0.32)" : "rgba(15, 23, 42, 0.08)",
                boxShadow: isToday ? "0 8px 18px rgba(33, 150, 243, 0.10)" : "none",
                "&:hover": {
                  bgcolor: "action.hover",
                  transform: "translateY(-1px)",
                  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.08)",
                },
              }}
              onClick={() => navigate(`/?date=${dateStr}`)}
            >
              <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 0.25 }}>
                {isPastDay && !isToday ? (
                  <CheckIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: "error.main" }} />
                ) : null}
                <Typography
                  variant="body2"
                  fontWeight={isToday ? "bold" : "normal"}
                  color={isToday ? "primary" : isWeekend ? "success.main" : "text.primary"}
                  align="right"
                >
                  {d.date()}
                </Typography>
              </Box>

              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {dayTasks.slice(0, 3).map((task, idx) => (
                  <Typography
                    key={task.id || idx}
                    variant="caption"
                    sx={{
                      display: "block",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      bgcolor: task.done ? "rgba(148, 163, 184, 0.18)" : "rgba(25, 118, 210, 0.88)",
                      color: task.done ? "text.secondary" : "#fff",
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 1.5,
                      textDecoration: task.done ? "line-through" : "none",
                      fontSize: { xs: "0.62rem", sm: "0.75rem" },
                      fontWeight: 600,
                    }}
                  >
                    {task.title}
                  </Typography>
                ))}

                {dayTasks.length > 3 && (
                  <Typography variant="caption" color="text.secondary" align="center" sx={{ fontSize: "0.65rem" }}>
                    {t("month.moreTasks", { count: dayTasks.length - 3 })}
                  </Typography>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
