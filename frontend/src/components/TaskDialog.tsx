// INPUT: task editing state, default date, and task callbacks
// OUTPUT: task editor dialog for create and edit flows
// EFFECT: Builds or updates task records for the planner's temporary and permanent task features
import dayjs from "dayjs";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { Task, TaskType } from "../types";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { weekdayISO, weekStartMonday, ymd } from "../app/date";

type Mode = "create" | "edit";

export function TaskDialog(props: {
  open: boolean;
  mode: Mode;
  defaultDateYmd: string;
  task?: Task;
  onClose: () => void;
  onSave: (t: Task) => void;
  onDelete?: (id: string) => void;
  onMoveOccurrenceToToday?: (task: Task, fromDateYmd: string) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const base = useMemo(() => {
    if (props.mode === "edit" && props.task) {
      return { ...props.task, emergency: props.task.emergency ?? 5 };
    }

    const d = props.defaultDateYmd ? dayjs(props.defaultDateYmd) : dayjs();
    return {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      title: "",
      type: "TEMPORARY" as TaskType,
      date: ymd(d),
      weekday: weekdayISO(d),
      done: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emergency: 5,
    } satisfies Task;
  }, [props.mode, props.task, props.defaultDateYmd, props.open]);

  const [title, setTitle] = useState(base.title);
  const [type, setType] = useState<TaskType>(base.type);
  const [weekday, setWeekday] = useState<number>(base.weekday ?? 1);
  const [date, setDate] = useState<string>(base.date ?? props.defaultDateYmd);
  const [emergency, setEmergency] = useState<number>(base.emergency ?? 5);

  const [location, setLocation] = useState(props.task?.location || "");
  const [description, setDescription] = useState(props.task?.description || "");
  const [startTime, setStartTime] = useState(props.task?.startTime || "");
  const [endTime, setEndTime] = useState(props.task?.endTime || "");
  const [mapProvider, setMapProvider] = useState(props.task?.mapProvider || "google");
  const hasInvalidEndTime = Boolean(startTime && endTime && endTime < startTime);

  // INPUT: dialog open state plus the selected task context
  // OUTPUT: synchronized local field state
  // EFFECT: Rehydrates the task editor whenever the dialog starts a new create or edit flow
  useEffect(() => {
    if (!props.open) return;
    setTitle(base.title);
    setType(base.type);
    setWeekday(base.weekday ?? 1);
    setDate(base.date ?? props.defaultDateYmd);
    setEmergency(base.emergency ?? 5);

    setLocation(props.task?.location || "");
    setDescription(props.task?.description || "");
    setStartTime(props.task?.startTime || "");
    setEndTime(props.task?.endTime || "");
    setMapProvider(
      props.task?.mapProvider ||
      localStorage.getItem("defaultMapProvider") ||
      "google"
    );
  }, [props.open, base, props.defaultDateYmd, props.task]);

  const canSave = title.trim().length > 0 && !hasInvalidEndTime;

  // INPUT: optional field overrides
  // OUTPUT: normalized task payload
  // EFFECT: Produces the saved task record for task creation, editing, and move actions
  function buildTask(override?: Partial<Task>): Task {
    const now = new Date().toISOString();
    return {
      ...base,
      title: title.trim(),
      type,
      weekday: type === "PERMANENT" ? weekday : undefined,
      date: type === "TEMPORARY" ? date : undefined,
      done: type === "TEMPORARY" ? (base.done ?? false) : undefined,
      updatedAt: now,
      emergency: emergency,

      location: location.trim(),
      description: description.trim(),
      startTime: startTime,
      endTime: endTime,
      mapProvider: mapProvider,

      ...override,
    };
  }

  // INPUT: current task editor fields
  // OUTPUT: saved task plus persisted map-provider preference
  // EFFECT: Completes the task editor flow and closes the dialog
  function save() {
    localStorage.setItem("defaultMapProvider", mapProvider);
    props.onSave(buildTask());
    props.onClose();
  }

  const todayYmd = ymd(dayjs());
  const currentWeekStart = weekStartMonday(dayjs());
  const currentWeekEnd = ymd(dayjs(currentWeekStart).add(6, "day"));

  const canMoveTempToToday =
    props.mode === "edit" &&
    type === "TEMPORARY" &&
    date > todayYmd &&
    date >= currentWeekStart &&
    date <= currentWeekEnd;

  function moveTempToToday() {
    props.onSave(buildTask({ date: todayYmd, done: false }));
    props.onClose();
  }

  const fromDateYmd = props.defaultDateYmd;
  const canMovePermanentOccurrenceToToday =
    props.mode === "edit" &&
    type === "PERMANENT" &&
    Boolean(props.onMoveOccurrenceToToday) &&
    fromDateYmd > todayYmd &&
    fromDateYmd >= currentWeekStart &&
    fromDateYmd <= currentWeekEnd;

  function movePermanentOccurrenceToToday() {
    const taskNow = buildTask();
    props.onMoveOccurrenceToToday?.(taskNow, fromDateYmd);
    props.onClose();
  }

  const weekdayItems = [
    { v: 1, label: t("dialog.weekdays.monday") },
    { v: 2, label: t("dialog.weekdays.tuesday") },
    { v: 3, label: t("dialog.weekdays.wednesday") },
    { v: 4, label: t("dialog.weekdays.thursday") },
    { v: 5, label: t("dialog.weekdays.friday") },
    { v: 6, label: t("dialog.weekdays.saturday") },
    { v: 7, label: t("dialog.weekdays.sunday") },
  ];

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
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
      <DialogTitle>{props.mode === "create" ? t("dialog.addTaskTitle") : t("dialog.editTaskTitle")}</DialogTitle>

      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSave) return;
          save();
        }}
      >
        <DialogContent sx={{ display: "grid", gap: { xs: 2, sm: 3 }, pt: 2 }}>
          <TextField
            label={t("dialog.taskName")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
          />

          <FormControl>
            <InputLabel>{t("common.type")}</InputLabel>
            <Select label={t("common.type")} value={type} onChange={(e) => setType(e.target.value as TaskType)}>
              <MenuItem value="PERMANENT">{t("dialog.repeatWeekly")}</MenuItem>
              <MenuItem value="TEMPORARY">{t("dialog.oneTime")}</MenuItem>
            </Select>
          </FormControl>

          <FormControl>
            <InputLabel>{t("common.emergency")}</InputLabel>
            <Select
              label={t("common.emergency")}
              value={emergency}
              onChange={(e) => setEmergency(Number(e.target.value))}
            >
              <MenuItem value={1}>{t("dialog.highest", { value: 1 })}</MenuItem>
              <MenuItem value={2}>2</MenuItem>
              <MenuItem value={3}>3</MenuItem>
              <MenuItem value={4}>4</MenuItem>
              <MenuItem value={5}>{t("dialog.lowest", { value: 5 })}</MenuItem>
            </Select>
          </FormControl>

          {type === "PERMANENT" ? (
            <FormControl>
              <InputLabel>{t("common.weekday")}</InputLabel>
              <Select
                label={t("common.weekday")}
                value={weekday}
                onChange={(e) => setWeekday(Number(e.target.value))}
              >
                {weekdayItems.map((it) => (
                  <MenuItem key={it.v} value={it.v}>
                    {it.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField
              label={t("common.date")}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label={t("common.startTimeOptional")}
              type="time"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                if (!e.target.value) setEndTime("");
              }}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label={t("common.endTimeOptional")}
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!startTime}
              error={hasInvalidEndTime}
              helperText={hasInvalidEndTime ? t("dialog.endTimeError") : " "}
              fullWidth
            />
          </Stack>

          <TextField
            label={t("common.descriptionOptional")}
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <TextField
            label={t("common.locationOptional")}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <FormControl>
            <InputLabel>{t("common.mapProvider")}</InputLabel>
            <Select
              label={t("common.mapProvider")}
              value={mapProvider}
              onChange={(e) => setMapProvider(e.target.value)}
            >
              <MenuItem value="google">{t("dialog.mapProviders.google")}</MenuItem>
              <MenuItem value="apple">{t("dialog.mapProviders.apple")}</MenuItem>
              <MenuItem value="baidu">{t("dialog.mapProviders.baidu")}</MenuItem>
            </Select>
          </FormControl>

        </DialogContent>

        <DialogActions>
          {props.mode === "edit" && props.onDelete && props.task ? (
            <Button
              color="error"
              onClick={() => {
                props.onDelete?.(props.task!.id);
              }}
            >
              {t("common.delete")}
            </Button>
          ) : (
            <span />
          )}

          {canMoveTempToToday ? <Button onClick={moveTempToToday}>{t("common.moveToToday")}</Button> : <span />}

          {canMovePermanentOccurrenceToToday ? (
            <Button onClick={movePermanentOccurrenceToToday}>{t("common.moveOccurrenceToToday")}</Button>
          ) : (
            <span />
          )}

          <Button onClick={props.onClose}>{t("common.cancel")}</Button>
          <Button variant="contained" disabled={!canSave} type="submit">
            {props.mode === "create" ? t("common.add") : t("common.save")}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
