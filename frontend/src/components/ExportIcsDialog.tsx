// INPUT: dialog visibility and task list
// OUTPUT: export options dialog with download trigger
// EFFECT: Generates and downloads a filtered ICS calendar file client-side
import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import type { Task } from "../types";
import { tasksToIcs, type IcsExportFilter } from "../app/ics";
import { ymd } from "../app/date";
import dayjs from "dayjs";

export function ExportIcsDialog(props: {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
}) {
  const { t } = useTranslation();
  const today = ymd(dayjs());
  const [filterType, setFilterType] = useState<"all" | "incomplete" | "dateRange">("all");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(ymd(dayjs().add(30, "day")));

  function handleExport() {
    const filter: IcsExportFilter =
      filterType === "dateRange"
        ? { type: "dateRange", startDate, endDate }
        : { type: filterType };

    const ics = tasksToIcs(props.tasks, filter);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "tasktide-tasks.ics";
    anchor.click();
    URL.revokeObjectURL(url);
    props.onClose();
  }

  const isDateRangeInvalid = filterType === "dateRange" && startDate > endDate;

  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t("today.exportDialogTitle")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <FormControl>
            <FormLabel sx={{ mb: 0.5 }}>{t("today.exportFilterLabel")}</FormLabel>
            <RadioGroup
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            >
              <FormControlLabel value="all" control={<Radio />} label={t("today.exportAll")} />
              <FormControlLabel
                value="incomplete"
                control={<Radio />}
                label={t("today.exportIncomplete")}
              />
              <FormControlLabel
                value="dateRange"
                control={<Radio />}
                label={t("today.exportDateRange")}
              />
            </RadioGroup>
          </FormControl>

          {filterType === "dateRange" && (
            <Stack spacing={1.5}>
              <TextField
                label={t("today.exportStartDate")}
                type="date"
                size="small"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label={t("today.exportEndDate")}
                type="date"
                size="small"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              {isDateRangeInvalid && (
                <Typography variant="caption" color="error">
                  {t("today.exportDateRangeError")}
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>{t("common.cancel")}</Button>
        <Button variant="contained" onClick={handleExport} disabled={isDateRangeInvalid}>
          {t("today.exportDownload")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
