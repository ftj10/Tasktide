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
} from "@mui/material";
import type { Task, TaskType } from "../types";
import { useEffect, useMemo, useState } from "react";
import { weekdayISO, weekStartMonday, ymd } from "../app/date";

type Mode = "create" | "edit";

// INPUT: open, mode, defaultDateYmd, task, onClose, onSave, onDelete, onMoveOccurrenceToToday
// OUTPUT: Dialog component for creating or editing tasks
// EFFECT: Manages local state for task fields and calls onSave with updated task data
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

  // Core Fields
  const [title, setTitle] = useState(base.title);
  const [type, setType] = useState<TaskType>(base.type);
  const [weekday, setWeekday] = useState<number>(base.weekday ?? 1);
  const [date, setDate] = useState<string>(base.date ?? props.defaultDateYmd);
  const [emergency, setEmergency] = useState<number>(base.emergency ?? 5);

  // Extra Fields
  const [location, setLocation] = useState(props.task?.location || "");
  const [description, setDescription] = useState(props.task?.description || "");
  const [startTime, setStartTime] = useState(props.task?.startTime || "");
  const [endTime, setEndTime] = useState(props.task?.endTime || "");
  const [mapProvider, setMapProvider] = useState(props.task?.mapProvider || "google");

  // INPUT: props.open, base, props.defaultDateYmd, props.task
  // OUTPUT: None
  // EFFECT: Updates local state variables when the dialog opens
  useEffect(() => {
    if (!props.open) return;
    setTitle(base.title);
    setType(base.type);
    setWeekday(base.weekday ?? 1);
    setDate(base.date ?? props.defaultDateYmd);
    setEmergency(base.emergency ?? 5);

    // Load existing extra fields if editing, or default to blank
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

  const canSave = title.trim().length > 0;

  // INPUT: override (Partial<Task>)
  // OUTPUT: Task object
  // EFFECT: Constructs the final task object from state variables
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

      // Inject the extra fields into the final save object
      location: location.trim(),
      description: description.trim(),
      startTime: startTime,
      endTime: endTime,
      mapProvider: mapProvider,

      ...override,
    };
  }

  // INPUT: None
  // OUTPUT: None
  // EFFECT: Saves the selected map provider as default, saves task, and closes dialog
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
    { v: 1, label: "Monday" },
    { v: 2, label: "Tuesday" },
    { v: 3, label: "Wednesday" },
    { v: 4, label: "Thursday" },
    { v: 5, label: "Friday" },
    { v: 6, label: "Saturday" },
    { v: 7, label: "Sunday" },
  ];

  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="sm">
      <DialogTitle>{props.mode === "create" ? "Add task" : "Edit task"}</DialogTitle>

      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSave) return;
          save();
        }}
      >
        <DialogContent sx={{ display: "grid", gap: 3, pt: 2 }}>
          <TextField
            label="Task name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
          />

          <FormControl>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={type} onChange={(e) => setType(e.target.value as TaskType)}>
              <MenuItem value="PERMANENT">repeat every week</MenuItem>
              <MenuItem value="TEMPORARY">one-time</MenuItem>
            </Select>
          </FormControl>

          <FormControl>
            <InputLabel>Emergency</InputLabel>
            <Select
              label="Emergency"
              value={emergency}
              onChange={(e) => setEmergency(Number(e.target.value))}
            >
              <MenuItem value={1}>1 (Highest)</MenuItem>
              <MenuItem value={2}>2</MenuItem>
              <MenuItem value={3}>3</MenuItem>
              <MenuItem value={4}>4</MenuItem>
              <MenuItem value={5}>5 (Lowest)</MenuItem>
            </Select>
          </FormControl>

          {type === "PERMANENT" ? (
            <FormControl>
              <InputLabel>Weekday</InputLabel>
              <Select
                label="Weekday"
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
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          )}

          {/* Start and End Time Fields */}
          <Stack direction="row" spacing={2}>
            <TextField
              label="Start Time (Optional)"
              type="time"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                // Automatically clear End Time if Start Time is deleted
                if (!e.target.value) setEndTime("");
              }}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="End Time (Optional)"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!startTime} // Disabled if no Start Time
              fullWidth
            />
          </Stack>

          {/* Description Field */}
          <TextField
            label="Description (Optional)"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Location Field */}
          <TextField
            label="Location (Optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          {/* Map Provider Field */}
          <FormControl>
            <InputLabel>Map Provider</InputLabel>
            <Select
              label="Map Provider"
              value={mapProvider}
              onChange={(e) => setMapProvider(e.target.value)}
            >
              <MenuItem value="google">Google Maps</MenuItem>
              <MenuItem value="apple">Apple Maps</MenuItem>
              <MenuItem value="baidu">Baidu Maps</MenuItem>
            </Select>
          </FormControl>

        </DialogContent>

        <DialogActions>
          {props.mode === "edit" && props.onDelete && props.task ? (
            <Button
              color="error"
              onClick={() => {
                props.onDelete?.(props.task!.id);
                props.onClose();
              }}
            >
              Delete
            </Button>
          ) : (
            <span />
          )}

          {canMoveTempToToday ? <Button onClick={moveTempToToday}>Move to today</Button> : <span />}

          {canMovePermanentOccurrenceToToday ? (
            <Button onClick={movePermanentOccurrenceToToday}>Move occurrence to today</Button>
          ) : (
            <span />
          )}

          <Button onClick={props.onClose}>Cancel</Button>
          <Button variant="contained" disabled={!canSave} type="submit">
            Save
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}