// INPUT: full task collection
// OUTPUT: 30-day analytics page with trend chart, comparison cards, and behaviour insights
// EFFECT: Surfaces user productivity patterns without modifying task data
import dayjs from "dayjs";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingFlatRoundedIcon from "@mui/icons-material/TrendingFlatRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

import type { Task } from "../types";
import {
  periodStatsForWindow,
  productivityStatsSeries,
  weekdayProductivitySeries,
} from "../app/taskLogic";
import { ymd } from "../app/date";

const CURRENT_WINDOW = 30;
const TREND_MIN_TASKS = 5;

const WEEKDAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAY_NAMES_ZH = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function StatsPage({ tasks }: { tasks: Task[] }) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.resolvedLanguage?.startsWith("zh");
  const todayYmd = ymd(dayjs());
  const prevEndYmd = dayjs(todayYmd).subtract(CURRENT_WINDOW, "day").format("YYYY-MM-DD");

  const currentStats = useMemo(
    () => periodStatsForWindow(tasks, todayYmd, CURRENT_WINDOW),
    [tasks, todayYmd]
  );

  const prevStats = useMemo(
    () => periodStatsForWindow(tasks, prevEndYmd, CURRENT_WINDOW),
    [tasks, prevEndYmd]
  );

  const trendSeries = useMemo(
    () => productivityStatsSeries(tasks, todayYmd, CURRENT_WINDOW),
    [tasks, todayYmd]
  );

  const weekdayStats = useMemo(
    () => weekdayProductivitySeries(tasks, todayYmd, CURRENT_WINDOW),
    [tasks, todayYmd]
  );

  const hasEnoughData = currentStats.totalCount >= TREND_MIN_TASKS;
  const maxTrendTotal = useMemo(
    () => Math.max(...trendSeries.map((d) => d.totalCount), 1),
    [trendSeries]
  );

  const weekdayNames = isZh ? WEEKDAY_NAMES_ZH : WEEKDAY_NAMES_EN;

  const bestDay = useMemo(() => {
    const active = weekdayStats.filter((d) => d.totalCount > 0);
    if (active.length === 0) return null;
    return active.reduce((best, d) => (d.completionRate > best.completionRate ? d : best), active[0]);
  }, [weekdayStats]);

  const worstDay = useMemo(() => {
    const active = weekdayStats.filter((d) => d.totalCount > 0);
    if (active.length < 2) return null;
    return active.reduce((worst, d) => (d.completionRate < worst.completionRate ? d : worst), active[0]);
  }, [weekdayStats]);

  const avgDailyCompleted = currentStats.totalCount > 0
    ? (currentStats.completedCount / CURRENT_WINDOW).toFixed(1)
    : "0";

  const backlogDelta = currentStats.createdCount - currentStats.completedCount;

  function formatTrendDate(dateYmd: string) {
    return new Intl.DateTimeFormat(isZh ? "zh" : "en", {
      month: "numeric",
      day: "numeric",
    }).format(dayjs(dateYmd).toDate());
  }

  function deltaBadge(current: number, prev: number, label: string) {
    const diff = current - prev;
    if (Math.abs(diff) < 1) {
      return (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <TrendingFlatRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            {t("stats.same")}
          </Typography>
        </Stack>
      );
    }
    const positive = diff > 0;
    const color = positive ? "#10b981" : "#ef4444";
    return (
      <Stack direction="row" spacing={0.5} alignItems="center">
        {positive
          ? <TrendingUpRoundedIcon sx={{ fontSize: 16, color }} />
          : <TrendingDownRoundedIcon sx={{ fontSize: 16, color }} />}
        <Typography variant="caption" fontWeight={700} sx={{ color }}>
          {positive ? t("stats.better", { value: diff, label }) : t("stats.worse", { value: Math.abs(diff), label })}
        </Typography>
      </Stack>
    );
  }

  function rateChangeBadge(current: number, prev: number) {
    const diff = current - prev;
    if (Math.abs(diff) < 2) {
      return (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <TrendingFlatRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            {t("stats.same")}
          </Typography>
        </Stack>
      );
    }
    const positive = diff > 0;
    const color = positive ? "#10b981" : "#ef4444";
    return (
      <Stack direction="row" spacing={0.5} alignItems="center">
        {positive
          ? <TrendingUpRoundedIcon sx={{ fontSize: 16, color }} />
          : <TrendingDownRoundedIcon sx={{ fontSize: 16, color }} />}
        <Typography variant="caption" fontWeight={700} sx={{ color }}>
          {positive
            ? t("stats.betterRate", { value: diff })
            : t("stats.worseRate", { value: Math.abs(diff) })}
        </Typography>
      </Stack>
    );
  }

  const insights: string[] = useMemo(() => {
    const result: string[] = [];
    if (!hasEnoughData) return result;

    if (prevStats.completedCount > 0) {
      const pctChange = Math.round(
        ((currentStats.completedCount - prevStats.completedCount) / prevStats.completedCount) * 100
      );
      if (pctChange >= 10) {
        result.push(t("stats.insightMoreCompleted", { percent: pctChange }));
      } else if (pctChange <= -10) {
        result.push(t("stats.insightFewerCompleted", { percent: Math.abs(pctChange) }));
      }
    }

    if (prevStats.overdueCount > 0 && currentStats.overdueCount < prevStats.overdueCount) {
      result.push(t("stats.insightOverdueDown"));
    } else if (prevStats.overdueCount > 0 && currentStats.overdueCount > prevStats.overdueCount) {
      result.push(t("stats.insightOverdueUp"));
    }

    if (currentStats.createdCount > currentStats.completedCount + 2) {
      result.push(t("stats.insightBacklogGrowing"));
    } else if (currentStats.completedCount > currentStats.createdCount + 2) {
      result.push(t("stats.insightBacklogShrinking"));
    }

    if (bestDay && bestDay.totalCount > 0) {
      result.push(t("stats.insightMostProductiveDay", { day: weekdayNames[bestDay.weekday] }));
    }

    if (worstDay && worstDay !== bestDay && worstDay.totalCount > 0) {
      result.push(t("stats.insightLeastProductiveDay", { day: weekdayNames[worstDay.weekday] }));
    }

    return result;
  }, [hasEnoughData, currentStats, prevStats, bestDay, worstDay, weekdayNames, t]);

  const summaryCardSx = {
    p: { xs: 1.5, sm: 2 },
    borderRadius: 3,
    border: "1px solid",
    borderColor: alpha("#0f172a", 0.08),
    background: "rgba(255,255,255,0.9)",
    flex: 1,
    minWidth: 0,
  };

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
      {/* Page header */}
      <Paper
        elevation={0}
        sx={{
          mb: 2.5,
          p: { xs: 1.75, sm: 2.5 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          background: "linear-gradient(135deg, rgba(79, 70, 229, 0.06), rgba(14, 165, 233, 0.05))",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 3,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha("#4f46e5", 0.1),
              color: "#4f46e5",
              flexShrink: 0,
            }}
          >
            <BarChartRoundedIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {t("stats.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("stats.subtitle")}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Empty state */}
      {!hasEnoughData && (
        <Paper
          elevation={0}
          sx={{
            textAlign: "center",
            py: 8,
            borderRadius: 4,
            border: "1px dashed",
            borderColor: "divider",
            bgcolor: "rgba(255,255,255,0.6)",
          }}
        >
          <Box sx={{ color: "text.disabled", mb: 1.5, display: "flex", justifyContent: "center" }}>
            <BarChartRoundedIcon sx={{ fontSize: 48 }} />
          </Box>
          <Typography variant="h6" color="text.secondary" fontWeight={600} sx={{ mb: 1 }}>
            {t("stats.emptyTitle")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 340, mx: "auto" }}>
            {t("stats.emptySubtitle")}
          </Typography>
        </Paper>
      )}

      {hasEnoughData && (
        <Stack spacing={2.5}>
          {/* Section 1: Summary Cards */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 4,
              border: "1px solid",
              borderColor: alpha("#10b981", 0.18),
              background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(255,255,255,0.95))",
            }}
          >
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
              {t("stats.currentPeriod")}
            </Typography>
            <Stack
              direction={{ xs: "row", sm: "row" }}
              spacing={1.25}
              flexWrap="wrap"
              useFlexGap
            >
              <Paper elevation={0} sx={{ ...summaryCardSx, minWidth: { xs: "calc(50% - 8px)", sm: 0 } }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
                  {t("stats.completed")}
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#10b981", mt: 0.5, lineHeight: 1 }}>
                  {currentStats.completedCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("stats.outOf", { total: currentStats.totalCount })}
                </Typography>
              </Paper>

              <Paper elevation={0} sx={{ ...summaryCardSx, minWidth: { xs: "calc(50% - 8px)", sm: 0 } }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
                  {t("stats.created")}
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#4f46e5", mt: 0.5, lineHeight: 1 }}>
                  {currentStats.createdCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("stats.tasksAdded")}
                </Typography>
              </Paper>

              <Paper elevation={0} sx={{ ...summaryCardSx, minWidth: { xs: "calc(50% - 8px)", sm: 0 } }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
                  {t("stats.completionRate")}
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#0ea5e9", mt: 0.5, lineHeight: 1 }}>
                  {currentStats.completionRate}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("stats.ofScheduledTasks")}
                </Typography>
              </Paper>

              <Paper elevation={0} sx={{ ...summaryCardSx, minWidth: { xs: "calc(50% - 8px)", sm: 0 } }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
                  {t("stats.overdue")}
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{ color: currentStats.overdueCount > 0 ? "#ef4444" : "#10b981", mt: 0.5, lineHeight: 1 }}
                >
                  {currentStats.overdueCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("stats.incompletePastDays")}
                </Typography>
              </Paper>
            </Stack>
          </Paper>

          {/* Section 2: 30-Day Trend Chart */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 4,
              border: "1px solid",
              borderColor: alpha("#0f172a", 0.08),
              background: "rgba(255,255,255,0.92)",
            }}
          >
            <Stack spacing={0.5} sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={800}>
                {t("stats.trendTitle")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("stats.trendSubtitle")}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 999, bgcolor: "#22c55e" }} />
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {t("stats.legendCompleted")}
              </Typography>
              <Box sx={{ width: 10, height: 10, borderRadius: 999, bgcolor: alpha("#94a3b8", 0.48), ml: 1 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {t("stats.legendRemaining")}
              </Typography>
            </Stack>
            <Box sx={{ overflowX: "auto", pb: 0.5 }}>
              <Stack
                direction="row"
                spacing={0}
                alignItems="flex-end"
                sx={{ minWidth: trendSeries.length * 28, height: 140, position: "relative" }}
              >
                {trendSeries.map((item) => {
                  const barHeight = item.totalCount > 0
                    ? Math.max((item.totalCount / maxTrendTotal) * 100, 10)
                    : 4;
                  const completedPct = item.totalCount > 0
                    ? (item.completedCount / item.totalCount) * 100
                    : 0;
                  const remainingPct = 100 - completedPct;

                  return (
                    <Stack
                      key={item.dateYmd}
                      alignItems="center"
                      spacing={0.25}
                      sx={{ flex: "0 0 28px", width: 28 }}
                    >
                      <Box
                        sx={{
                          width: 16,
                          height: 96,
                          display: "flex",
                          alignItems: "flex-end",
                          justifyContent: "center",
                        }}
                      >
                        <Box
                          sx={{
                            width: "100%",
                            height: `${barHeight}%`,
                            minHeight: item.totalCount > 0 ? 8 : 3,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-end",
                            overflow: "hidden",
                            borderRadius: "4px 4px 2px 2px",
                            border: "1px solid",
                            borderColor: alpha("#0f172a", 0.06),
                            bgcolor: alpha("#e2e8f0", 0.6),
                          }}
                        >
                          {remainingPct > 0 && item.totalCount > 0 && (
                            <Box sx={{ height: `${remainingPct}%`, bgcolor: alpha("#94a3b8", 0.4) }} />
                          )}
                          {completedPct > 0 && (
                            <Box sx={{ height: `${completedPct}%`, bgcolor: "#22c55e" }} />
                          )}
                        </Box>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.58rem",
                          color: "text.secondary",
                          lineHeight: 1,
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          height: 32,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatTrendDate(item.dateYmd)}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          </Paper>

          {/* Section 3: Compare With Previous 30 Days */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 4,
              border: "1px solid",
              borderColor: alpha("#0f172a", 0.08),
              background: "rgba(255,255,255,0.92)",
            }}
          >
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
              {t("stats.comparisonTitle")}
            </Typography>
            <Stack spacing={1}>
              {[
                {
                  label: t("stats.completed"),
                  current: currentStats.completedCount,
                  prev: prevStats.completedCount,
                  type: "count" as const,
                },
                {
                  label: t("stats.created"),
                  current: currentStats.createdCount,
                  prev: prevStats.createdCount,
                  type: "count" as const,
                },
                {
                  label: t("stats.completionRate"),
                  current: currentStats.completionRate,
                  prev: prevStats.completionRate,
                  type: "rate" as const,
                },
                {
                  label: t("stats.overdue"),
                  current: currentStats.overdueCount,
                  prev: prevStats.overdueCount,
                  type: "count-inverse" as const,
                },
              ].map(({ label, current, prev, type }) => (
                <Stack
                  key={label}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    p: 1.25,
                    borderRadius: 2.5,
                    border: "1px solid",
                    borderColor: alpha("#0f172a", 0.06),
                    background: "rgba(248,250,252,0.8)",
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      {label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {type === "rate"
                        ? `${current}% ${t("stats.vsLabel")} ${prev}%`
                        : `${current} ${t("stats.vsLabel")} ${prev}`}
                    </Typography>
                  </Box>
                  {type === "rate"
                    ? rateChangeBadge(current, prev)
                    : type === "count-inverse"
                      ? deltaBadge(prev, current, label)
                      : deltaBadge(current, prev, label)}
                </Stack>
              ))}
            </Stack>
          </Paper>

          {/* Section 4: Behaviour Insights */}
          {insights.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 4,
                border: "1px solid",
                borderColor: alpha("#f59e0b", 0.2),
                background: "linear-gradient(135deg, rgba(245,158,11,0.05), rgba(255,255,255,0.95))",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
                <AutoAwesomeRoundedIcon sx={{ fontSize: 18, color: "#f59e0b" }} />
                <Typography variant="subtitle1" fontWeight={800}>
                  {t("stats.insightsTitle")}
                </Typography>
              </Stack>
              <Stack spacing={0.75}>
                {insights.map((text, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        bgcolor: "#f59e0b",
                        mt: "7px",
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" color="text.primary">
                      {text}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          )}

          {/* Section 5: Details */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 4,
              border: "1px solid",
              borderColor: alpha("#0f172a", 0.08),
              background: "rgba(255,255,255,0.92)",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
              <EmojiEventsRoundedIcon sx={{ fontSize: 18, color: "#4f46e5" }} />
              <Typography variant="subtitle1" fontWeight={800}>
                {t("stats.detailsTitle")}
              </Typography>
            </Stack>
            <Stack spacing={0.75}>
              {[
                {
                  label: t("stats.avgDaily"),
                  value: avgDailyCompleted,
                  unit: t("stats.tasksPerDay"),
                },
                ...(bestDay
                  ? [{
                      label: t("stats.bestDay"),
                      value: weekdayNames[bestDay.weekday],
                      unit: `${bestDay.completionRate}%`,
                    }]
                  : []),
                ...(worstDay
                  ? [{
                      label: t("stats.worstDay"),
                      value: weekdayNames[worstDay.weekday],
                      unit: `${worstDay.completionRate}%`,
                    }]
                  : []),
                {
                  label: t("stats.backlogChange"),
                  value: backlogDelta > 0
                    ? t("stats.backlogGrowing", { count: backlogDelta })
                    : backlogDelta < 0
                      ? t("stats.backlogShrinking", { count: Math.abs(backlogDelta) })
                      : t("stats.backlogNeutral"),
                  unit: "",
                  color: backlogDelta > 0 ? "#ef4444" : backlogDelta < 0 ? "#10b981" : undefined,
                },
              ].map(({ label, value, unit, color }) => (
                <Stack
                  key={label}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    "&:nth-of-type(odd)": { bgcolor: "rgba(248,250,252,0.8)" },
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="baseline">
                    <Typography variant="body2" fontWeight={800} sx={{ color }}>
                      {value}
                    </Typography>
                    {unit && (
                      <Typography variant="caption" color="text.secondary">
                        {unit}
                      </Typography>
                    )}
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Paper>

          {/* Period date range footer */}
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={t("stats.currentPeriodRange", {
                start: dayjs(todayYmd).subtract(CURRENT_WINDOW - 1, "day").format("MMM D"),
                end: dayjs(todayYmd).format("MMM D"),
              })}
              sx={{ bgcolor: alpha("#10b981", 0.08), color: "#10b981", fontWeight: 700, fontSize: "0.7rem" }}
            />
            <Chip
              size="small"
              label={t("stats.previousPeriodRange", {
                start: dayjs(todayYmd).subtract(CURRENT_WINDOW * 2 - 1, "day").format("MMM D"),
                end: dayjs(todayYmd).subtract(CURRENT_WINDOW, "day").format("MMM D"),
              })}
              sx={{ bgcolor: alpha("#94a3b8", 0.1), color: "text.secondary", fontWeight: 700, fontSize: "0.7rem" }}
            />
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
