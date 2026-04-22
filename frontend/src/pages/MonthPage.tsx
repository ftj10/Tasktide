// INPUT: task collection and navigation state
// OUTPUT: month grid page with per-day task previews
// EFFECT: Supports monthly schedule scanning and day-level navigation into the Today feature
import dayjs from "dayjs";
import { useState, useMemo, useEffect } from "react";
import { Box, Button, IconButton, Stack, Typography, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";

import type { Task } from "../types";
import { tasksForDate } from "../app/taskLogic";
import { ymd } from "../app/date";
import { COMPLETIONS_KEY, loadCompletions, type CompletionMap } from "../app/completions";

// INPUT: task collection and save callback
// OUTPUT: month calendar page
// EFFECT: Builds the month overview feature from planner tasks and completion state
export function MonthPage(props: { tasks: Task[]; setTasks: (next: Task[]) => void }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf("month"));
  const [completions, setCompletions] = useState<CompletionMap>(loadCompletions());

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

  return (
    <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 1, sm: 2 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <IconButton onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: "1.1rem", sm: "1.5rem" }, textAlign: "center" }}>{monthLabel}</Typography>
        <IconButton onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}>
          <ArrowForwardIcon />
        </IconButton>
      </Stack>

      <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
        <Button variant="outlined" onClick={() => setCurrentMonth(dayjs().startOf("month"))}>
          {t("month.jumpToCurrentMonth")}
        </Button>
      </Box>

      <Box sx={{
        display: "grid",
        gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
        gap: { xs: 0.5, sm: 1 },
        minWidth: 0,
      }}>
        {weekDays.map(wd => (
          <Typography key={wd} align="center" fontWeight="bold" sx={{ mb: 1, fontSize: { xs: "0.75rem", sm: "1rem" }}}>
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
                minHeight: { xs: 80, sm: 110 },
                p: { xs: 0.5, sm: 1 },
                bgcolor: isToday 
                  ? "rgba(33, 150, 243, 0.1)" 
                  : isWeekend 
                    ? "#f9fff0"
                    : "background.paper", 
                opacity: isCurrentMonth ? 1 : 0.4,
                cursor: "pointer",
                transition: "background-color 0.2s",
                '&:hover': { bgcolor: "action.hover" }
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
                      borderRadius: 0.5,
                      textDecoration: t.done ? "line-through" : "none",
                      fontSize: { xs: "0.6rem", sm: "0.75rem" }
                    }}
                  >
                    {t.title}
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
