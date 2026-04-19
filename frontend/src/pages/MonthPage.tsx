import dayjs from "dayjs";
import { useState, useMemo, useEffect } from "react";
import { Box, Button, IconButton, Stack, Typography, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import type { Task } from "../types";
import { tasksForDate } from "../app/taskLogic";
import { ymd } from "../app/date";
import { COMPLETIONS_KEY, loadCompletions, type CompletionMap } from "../app/completions";

export function MonthPage(props: { tasks: Task[]; setTasks: (next: Task[]) => void }) {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf("month"));
  const [completions, setCompletions] = useState<CompletionMap>(loadCompletions());

  // Listen for changes so checkboxes update immediately
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === COMPLETIONS_KEY) setCompletions(loadCompletions());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const monthLabel = currentMonth.format("MMMM YYYY");

  // Calculate the exact grid of days (padding the start/end of the month to fit a 7-day grid)
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

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", p: { xs: 1, sm: 2 } }}>
      {/* Month Navigation Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <IconButton onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight="bold">{monthLabel}</Typography>
        <IconButton onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}>
          <ArrowForwardIcon />
        </IconButton>
      </Stack>

      <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
        <Button variant="outlined" onClick={() => setCurrentMonth(dayjs().startOf("month"))}>
          Jump to Current Month
        </Button>
      </Box>

      {/* Responsive Calendar Grid */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: { xs: 0.5, sm: 1 }
      }}>
        {/* Days of the Week Header */}
        {weekDays.map(wd => (
          <Typography key={wd} align="center" fontWeight="bold" sx={{ mb: 1, fontSize: { xs: "0.75rem", sm: "1rem" }}}>
            {wd}
          </Typography>
        ))}

        {/* Calendar Day Cells */}
        {calendarDays.map((d) => {
          const dateStr = ymd(d);
          const isCurrentMonth = d.month() === currentMonth.month();
          const isToday = dateStr === ymd(dayjs());
          const dayTasks = tasksForDate(props.tasks, dateStr, completions);

          return (
            <Paper
              key={dateStr}
              variant="outlined"
              sx={{
                minHeight: { xs: 80, sm: 110 },
                p: { xs: 0.5, sm: 1 },
                bgcolor: isToday ? "rgba(33, 150, 243, 0.08)" : "background.paper", // Light blue highlight for today
                opacity: isCurrentMonth ? 1 : 0.4, // Fade out days from prev/next months
                cursor: "pointer",
                transition: "background-color 0.2s",
                '&:hover': { bgcolor: "action.hover" }
              }}
              onClick={() => navigate(`/?date=${dateStr}`)} // Clicking a day jumps to TodayPage for that exact date
            >
              <Typography
                variant="body2"
                fontWeight={isToday ? "bold" : "normal"}
                color={isToday ? "primary" : "text.primary"}
                align="right"
              >
                {d.date()}
              </Typography>

              {/* Task Indicators */}
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {dayTasks.slice(0, 3).map((t, idx) => (
                  <Typography
                    key={t.id || idx}
                    variant="caption"
                    sx={{
                      display: "block",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      bgcolor: t.done ? "action.disabledBackground" : "primary.light",
                      color: t.done ? "text.disabled" : "primary.contrastText",
                      px: 0.5,
                      borderRadius: 1,
                      textDecoration: t.done ? "line-through" : "none",
                      fontSize: { xs: "0.6rem", sm: "0.75rem" }
                    }}
                  >
                    {t.title}
                  </Typography>
                ))}
                
                {/* If more than 3 tasks exist, show a "+X more" label so the box doesn't overflow */}
                {dayTasks.length > 3 && (
                  <Typography variant="caption" color="text.secondary" align="center" sx={{ fontSize: "0.65rem" }}>
                    +{dayTasks.length - 3} more
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