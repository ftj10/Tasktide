// INPUT: task editing state, default date, and task callbacks
// OUTPUT: task editor dialog for create and edit flows
// EFFECT: Builds or updates one-time and repeating task records, including recurrence setup and recurring edit scope choices
import dayjs from "dayjs";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { RepeatFrequency, Task, TaskRecurrence } from "../types";
import { weekdayISO } from "../app/date";
import { getRepeatFrequency, getRepeatLabelKey, normalizeTask, type TaskSaveScope } from "../app/tasks";

type Mode = "create" | "edit";

const INTERVAL_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1);
const MONTH_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => index + 1);

export function TaskDialog(props: {
  open: boolean;
  mode: Mode;
  defaultDateYmd: string;
  defaultEndDateYmd?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  task?: Task;
  occurrenceDateYmd?: string;
  onClose: () => void;
  onSave: (task: Task, scope?: TaskSaveScope) => void;
  onDelete?: (id: string, scope?: TaskSaveScope) => void;
  onMoveOccurrenceToToday?: (task: Task, fromDateYmd: string) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const base = useMemo(() => {
    if (props.mode === "edit" && props.task) {
      const normalized = normalizeTask(props.task);
      return {
        ...normalized,
        emergency: normalized.emergency ?? 5,
      };
    }

    const d = props.defaultDateYmd ? dayjs(props.defaultDateYmd) : dayjs();
    return {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      title: "",
      type: "ONCE" as const,
      beginDate: d.format("YYYY-MM-DD"),
      endDate: props.defaultEndDateYmd || d.format("YYYY-MM-DD"),
      date: d.format("YYYY-MM-DD"),
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emergency: 5,
      startTime: props.defaultStartTime || undefined,
      endTime: props.defaultEndTime || undefined,
      recurrence: {
        frequency: "NONE" as const,
        interval: 1,
        until: null,
      },
      occurrenceOverrides: {},
    } satisfies Task;
  }, [props.defaultDateYmd, props.defaultEndDateYmd, props.defaultEndTime, props.defaultStartTime, props.mode, props.task]);

  const [title, setTitle] = useState(base.title);
  const [beginDate, setBeginDate] = useState(base.beginDate ?? props.defaultDateYmd);
  const [endDate, setEndDate] = useState(base.endDate ?? base.beginDate ?? props.defaultDateYmd);
  const [emergency, setEmergency] = useState<number>(base.emergency ?? 5);
  const [location, setLocation] = useState(base.location || "");
  const [description, setDescription] = useState(base.description || "");
  const [startTime, setStartTime] = useState(base.startTime || "");
  const [endTime, setEndTime] = useState(base.endTime || "");
  const [mapProvider, setMapProvider] = useState(base.mapProvider || "google");
  const [repeatDialogOpen, setRepeatDialogOpen] = useState(false);
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [deleteScopeDialogOpen, setDeleteScopeDialogOpen] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<RepeatFrequency>(getRepeatFrequency(base));
  const [repeatInterval, setRepeatInterval] = useState<number>(base.recurrence?.interval ?? 1);
  const [repeatWeekdays, setRepeatWeekdays] = useState<number[]>(base.recurrence?.weekdays ?? [weekdayISO(dayjs(base.beginDate))]);
  const [repeatMonthDays, setRepeatMonthDays] = useState<number[]>(base.recurrence?.monthDays ?? [dayjs(base.beginDate).date()]);
  const [repeatUntilMode, setRepeatUntilMode] = useState<"forever" | "until">(base.recurrence?.until ? "until" : "forever");
  const [repeatUntilDate, setRepeatUntilDate] = useState<string>(base.recurrence?.until ?? "");
  const hasInvalidDateRange = Boolean(endDate && beginDate && dayjs(endDate).isBefore(dayjs(beginDate), "day"));
  const hasInvalidEndTime = Boolean(
    startTime &&
    endTime &&
    endDate === beginDate &&
    endTime < startTime
  );
  const isRecurringEdit = props.mode === "edit" && repeatFrequency !== "NONE";

  const weekdayItems = [
    { v: 1, label: t("dialog.weekdays.monday") },
    { v: 2, label: t("dialog.weekdays.tuesday") },
    { v: 3, label: t("dialog.weekdays.wednesday") },
    { v: 4, label: t("dialog.weekdays.thursday") },
    { v: 5, label: t("dialog.weekdays.friday") },
    { v: 6, label: t("dialog.weekdays.saturday") },
    { v: 7, label: t("dialog.weekdays.sunday") },
  ];

  // INPUT: dialog open state plus the selected task context
  // OUTPUT: synchronized local field state
  // EFFECT: Rehydrates the task editor whenever the dialog starts a new create or edit flow
  useEffect(() => {
    if (!props.open) return;
    const normalized = normalizeTask(base);
    setTitle(normalized.title);
    setBeginDate(normalized.beginDate ?? props.defaultDateYmd);
    setEndDate(normalized.endDate ?? normalized.beginDate ?? props.defaultDateYmd);
    setEmergency(normalized.emergency ?? 5);
    setLocation(normalized.location || "");
    setDescription(normalized.description || "");
    setStartTime(normalized.startTime || "");
    setEndTime(normalized.endTime || "");
    setMapProvider(
      normalized.mapProvider ||
      localStorage.getItem("defaultMapProvider") ||
      "google"
    );
    setRepeatFrequency(getRepeatFrequency(normalized));
    setRepeatInterval(normalized.recurrence?.interval ?? 1);
    setRepeatWeekdays(normalized.recurrence?.weekdays ?? [weekdayISO(dayjs(normalized.beginDate))]);
    setRepeatMonthDays(normalized.recurrence?.monthDays ?? [dayjs(normalized.beginDate).date()]);
    setRepeatUntilMode(normalized.recurrence?.until ? "until" : "forever");
    setRepeatUntilDate(normalized.recurrence?.until ?? "");
    setRepeatDialogOpen(false);
    setScopeDialogOpen(false);
    setDeleteScopeDialogOpen(false);
  }, [base, props.defaultDateYmd, props.open]);

  useEffect(() => {
    if (repeatFrequency === "WEEKLY" && repeatWeekdays.length === 0) {
      setRepeatWeekdays([weekdayISO(dayjs(beginDate))]);
    }
    if (repeatFrequency === "MONTHLY" && repeatMonthDays.length === 0) {
      setRepeatMonthDays([dayjs(beginDate).date()]);
    }
  }, [beginDate, repeatFrequency, repeatMonthDays.length, repeatWeekdays.length]);

  const canSave =
    title.trim().length > 0 &&
    Boolean(beginDate) &&
    Boolean(endDate) &&
    !hasInvalidDateRange &&
    !hasInvalidEndTime;
  const repeatSummary = t(getRepeatLabelKey(buildPreviewTask()));
  const canMoveTempToToday = false;
  const canMovePermanentOccurrenceToToday = false;

  // INPUT: current repeat editor state
  // OUTPUT: normalized recurrence payload
  // EFFECT: Converts repeat-form controls into the shared recurrence model used by task saving and rendering
  function buildRecurrence(): TaskRecurrence {
    if (repeatFrequency === "NONE") {
      return {
        frequency: "NONE",
        interval: 1,
        until: null,
      };
    }

    return {
      frequency: repeatFrequency,
      interval: repeatInterval,
      weekdays: repeatFrequency === "WEEKLY" ? repeatWeekdays : undefined,
      monthDays: repeatFrequency === "MONTHLY" ? repeatMonthDays : undefined,
      until: repeatUntilMode === "until" ? repeatUntilDate : null,
    };
  }

  // INPUT: current task editor fields
  // OUTPUT: unsaved task preview
  // EFFECT: Keeps repeat summaries and save payloads aligned to the latest dialog inputs
  function buildPreviewTask(): Task {
    const recurrence = buildRecurrence();
    const isRecurring = recurrence.frequency !== "NONE";
    return {
      ...base,
      title: title.trim(),
      type: isRecurring ? "RECURRING" : "ONCE",
      beginDate,
      endDate: isRecurring ? undefined : endDate,
      recurrence,
      date: isRecurring ? undefined : beginDate,
      weekday:
        recurrence.frequency === "WEEKLY" && recurrence.weekdays?.length === 1
          ? recurrence.weekdays[0]
          : undefined,
      emergency,
      completedAt: isRecurring ? null : (base.completedAt ?? null),
      location: location.trim(),
      description: description.trim(),
      startTime,
      endTime,
      mapProvider,
    };
  }

  // INPUT: current task editor fields
  // OUTPUT: persisted task payload
  // EFFECT: Produces the saved task record for task creation and editing flows
  function buildTask(): Task {
    return {
      ...buildPreviewTask(),
      updatedAt: new Date().toISOString(),
    };
  }

  // INPUT: current task editor fields
  // OUTPUT: saved task plus persisted map-provider preference
  // EFFECT: Completes the task editor flow and opens recurring scope selection when needed
  function save() {
    localStorage.setItem("defaultMapProvider", mapProvider);
    if (isRecurringEdit) {
      setScopeDialogOpen(true);
      return;
    }
    props.onSave(buildTask(), "series");
    props.onClose();
  }

  function saveWithScope(scope: TaskSaveScope) {
    props.onSave(buildTask(), scope);
    setScopeDialogOpen(false);
    props.onClose();
  }

  function remove() {
    if (!props.onDelete) return;
    if (isRecurringEdit) {
      setDeleteScopeDialogOpen(true);
      return;
    }
    props.onDelete(base.id, "series");
    props.onClose();
  }

  function removeWithScope(scope: TaskSaveScope) {
    props.onDelete?.(base.id, scope);
    setDeleteScopeDialogOpen(false);
    props.onClose();
  }

  function toggleWeekday(dayValue: number) {
    if (repeatWeekdays.includes(dayValue)) {
      const nextValues = repeatWeekdays.filter((value) => value !== dayValue);
      if (nextValues.length > 0) setRepeatWeekdays(nextValues);
      return;
    }
    setRepeatWeekdays([...repeatWeekdays, dayValue].sort((a, b) => a - b));
  }

  function moveTempToToday() {
    props.onSave({
      ...buildTask(),
      beginDate: dayjs().format("YYYY-MM-DD"),
      endDate: dayjs().add(dayjs(endDate).diff(dayjs(beginDate), "day"), "day").format("YYYY-MM-DD"),
      date: dayjs().format("YYYY-MM-DD"),
      completedAt: null,
    }, "series");
    props.onClose();
  }

  function movePermanentOccurrenceToToday() {
    const fromDateYmd = props.occurrenceDateYmd ?? props.defaultDateYmd;
    props.onMoveOccurrenceToToday?.(buildTask(), fromDateYmd);
    props.onClose();
  }

  return (
    <>
      <Dialog
        open={props.open}
        onClose={props.onClose}
        fullWidth
        fullScreen={isMobile}
        maxWidth="sm"
        PaperProps={{
          "data-task-dialog": "true",
          sx: {
            borderRadius: { xs: 0, sm: 3 },
            mx: { xs: 0, sm: 2 },
          },
        }}
      >
        <DialogTitle>{props.mode === "create" ? t("dialog.addTaskTitle") : t("dialog.editTaskTitle")}</DialogTitle>

        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSave) return;
            save();
          }}
        >
          <DialogContent sx={{ display: "grid", gap: { xs: 2, sm: 3 }, pt: 2 }}>
            <TextField
              label={t("dialog.taskName")}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              autoFocus
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 2 }}
            />

            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                {t("common.repeat")}
              </Typography>
              <Button variant="outlined" onClick={() => setRepeatDialogOpen(true)} sx={{ justifyContent: "space-between", py: 1.25 }}>
                <span>{repeatSummary}</span>
                <Chip label={t("dialog.editRepeat")} size="small" />
              </Button>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("common.beginDate")}
                type="date"
                value={beginDate}
                onChange={(event) => setBeginDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              {repeatFrequency === "NONE" ? (
                <TextField
                  label={t("common.endDate")}
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  error={hasInvalidDateRange}
                  helperText={hasInvalidDateRange ? t("dialog.endDateError") : " "}
                  fullWidth
                />
              ) : null}
            </Stack>

            <FormControl>
              <InputLabel>{t("common.emergency")}</InputLabel>
              <Select
                label={t("common.emergency")}
                value={emergency}
                onChange={(event) => setEmergency(Number(event.target.value))}
              >
                <MenuItem value={1}>{t("dialog.highest", { value: 1 })}</MenuItem>
                <MenuItem value={2}>2</MenuItem>
                <MenuItem value={3}>3</MenuItem>
                <MenuItem value={4}>4</MenuItem>
                <MenuItem value={5}>{t("dialog.lowest", { value: 5 })}</MenuItem>
              </Select>
            </FormControl>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("common.startTimeOptional")}
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label={t("common.endTimeOptional")}
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                InputLabelProps={{ shrink: true }}
                error={hasInvalidEndTime}
                helperText={hasInvalidEndTime ? t("dialog.endTimeError") : " "}
                fullWidth
              />
            </Stack>

            <TextField
              label={t("common.locationOptional")}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <FormControl>
              <InputLabel>{t("common.mapProvider")}</InputLabel>
              <Select
                label={t("common.mapProvider")}
                value={mapProvider}
                onChange={(event) => setMapProvider(event.target.value)}
              >
                <MenuItem value="google">{t("dialog.mapProviders.google")}</MenuItem>
                <MenuItem value="apple">{t("dialog.mapProviders.apple")}</MenuItem>
                <MenuItem value="baidu">{t("dialog.mapProviders.baidu")}</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={t("common.descriptionOptional")}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              multiline
              minRows={3}
              InputLabelProps={{ shrink: true }}
            />
          </DialogContent>

          <DialogActions sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1, px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
            {props.mode === "edit" && props.onDelete ? (
              <Button fullWidth={isMobile} color="error" onClick={remove}>
                {t("common.delete")}
              </Button>
            ) : null}
            {canMoveTempToToday ? (
              <Button fullWidth={isMobile} onClick={moveTempToToday}>{t("common.moveToToday")}</Button>
            ) : null}
            {canMovePermanentOccurrenceToToday ? (
              <Button fullWidth={isMobile} onClick={movePermanentOccurrenceToToday}>{t("common.moveOccurrenceToToday")}</Button>
            ) : null}
            <Box sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }} />
            <Button fullWidth={isMobile} onClick={props.onClose}>{t("common.cancel")}</Button>
            <Button fullWidth={isMobile} type="submit" variant="contained" disabled={!canSave}>
              {props.mode === "create" ? t("common.add") : t("common.save")}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={repeatDialogOpen}
        onClose={() => setRepeatDialogOpen(false)}
        fullWidth
        fullScreen={isMobile}
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 3 },
            mx: { xs: 0, sm: 2 },
          },
        }}
      >
        <DialogTitle>{t("dialog.repeatTitle")}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2.5, pt: 2 }}>
          <FormControl sx={{ mt: 1 }}>
            <InputLabel>{t("common.repeat")}</InputLabel>
            <Select
              label={t("common.repeat")}
              value={repeatFrequency}
              onChange={(event) => setRepeatFrequency(event.target.value as RepeatFrequency)}
            >
              <MenuItem value="NONE">{t("dialog.repeatOptions.none")}</MenuItem>
              <MenuItem value="DAILY">{t("dialog.repeatOptions.daily")}</MenuItem>
              <MenuItem value="WEEKLY">{t("dialog.repeatOptions.weekly")}</MenuItem>
              <MenuItem value="MONTHLY">{t("dialog.repeatOptions.monthly")}</MenuItem>
              <MenuItem value="YEARLY">{t("dialog.repeatOptions.yearly")}</MenuItem>
            </Select>
          </FormControl>

          {repeatFrequency !== "NONE" ? (
            <>
              <FormControl>
                <InputLabel>{t("dialog.repeatEvery")}</InputLabel>
                <Select
                  label={t("dialog.repeatEvery")}
                  value={repeatInterval}
                  onChange={(event) => setRepeatInterval(Number(event.target.value))}
                >
                  {INTERVAL_OPTIONS.map((value) => (
                    <MenuItem key={value} value={value}>
                      {t("dialog.repeatIntervalValue", { value, unit: t(`dialog.repeatUnits.${repeatFrequency.toLowerCase()}`) })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {repeatFrequency === "WEEKLY" ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {t("dialog.onDays")}
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {weekdayItems.map((item) => (
                      <Chip
                        key={item.v}
                        label={item.label}
                        color={repeatWeekdays.includes(item.v) ? "primary" : "default"}
                        variant={repeatWeekdays.includes(item.v) ? "filled" : "outlined"}
                        onClick={() => toggleWeekday(item.v)}
                      />
                    ))}
                  </Stack>
                </Box>
              ) : null}

              {repeatFrequency === "MONTHLY" ? (
                <FormControl>
                  <InputLabel>{t("dialog.onMonthDays")}</InputLabel>
                  <Select
                    label={t("dialog.onMonthDays")}
                    multiple
                    value={repeatMonthDays}
                    onChange={(event) => setRepeatMonthDays((event.target.value as number[]).sort((a, b) => a - b))}
                    renderValue={(selected) => (selected as number[]).join(", ")}
                  >
                    {MONTH_DAY_OPTIONS.map((value) => (
                      <MenuItem key={value} value={value}>
                        <Checkbox checked={repeatMonthDays.includes(value)} />
                        {value}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : null}

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {t("dialog.until")}
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  value={repeatUntilMode}
                  onChange={(_, nextValue: "forever" | "until" | null) => {
                    if (nextValue) setRepeatUntilMode(nextValue);
                  }}
                  fullWidth
                >
                  <ToggleButton value="forever">{t("dialog.forever")}</ToggleButton>
                  <ToggleButton value="until">{t("dialog.endDate")}</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {repeatUntilMode === "until" ? (
                <TextField
                  label={t("dialog.endDate")}
                  type="date"
                  value={repeatUntilDate}
                  onChange={(event) => setRepeatUntilDate(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              ) : null}
            </>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2 } }}>
          <Button fullWidth={isMobile} onClick={() => setRepeatDialogOpen(false)}>{t("common.done")}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={scopeDialogOpen} onClose={() => setScopeDialogOpen(false)} fullScreen={isMobile} fullWidth maxWidth="sm">
        <DialogTitle>{t("dialog.editSeriesTitle")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography>{t("dialog.editSeriesMessage")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("dialog.editSeriesHint")}
            </Typography>
            <FormControlLabel
              control={<Checkbox checked disabled />}
              label={props.occurrenceDateYmd ? t("dialog.editingOccurrence", { date: props.occurrenceDateYmd }) : t("dialog.editEntireSeries")}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1, px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2 } }}>
          <Button fullWidth={isMobile} onClick={() => setScopeDialogOpen(false)}>{t("common.cancel")}</Button>
          <Button fullWidth={isMobile} onClick={() => saveWithScope("single")}>{t("dialog.thisDayOnly")}</Button>
          <Button fullWidth={isMobile} variant="contained" onClick={() => saveWithScope("series")}>{t("dialog.entireSeries")}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteScopeDialogOpen} onClose={() => setDeleteScopeDialogOpen(false)} fullScreen={isMobile} fullWidth maxWidth="sm">
        <DialogTitle>{t("dialog.deleteSeriesTitle")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography>{t("dialog.deleteSeriesMessage")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("dialog.deleteSeriesHint")}
            </Typography>
            <FormControlLabel
              control={<Checkbox checked disabled />}
              label={props.occurrenceDateYmd ? t("dialog.editingOccurrence", { date: props.occurrenceDateYmd }) : t("dialog.editEntireSeries")}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1, px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2 } }}>
          <Button fullWidth={isMobile} onClick={() => setDeleteScopeDialogOpen(false)}>{t("common.cancel")}</Button>
          <Button fullWidth={isMobile} color="error" onClick={() => removeWithScope("single")}>{t("dialog.thisDayOnly")}</Button>
          <Button fullWidth={isMobile} color="error" variant="contained" onClick={() => removeWithScope("series")}>{t("dialog.entireSeries")}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
