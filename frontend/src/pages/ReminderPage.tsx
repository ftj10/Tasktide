// INPUT: reminder collection and reminder save callback
// OUTPUT: reminder list page with create, edit, and complete actions
// EFFECT: Runs the persistent reminder feature outside the date-based task flows
import { useState } from "react";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import { useTranslation } from "react-i18next";

import type { Reminder } from "../types";
import { ReminderDialog } from "../components/ReminderDialog";

// INPUT: reminder state and update callback
// OUTPUT: active reminder page
// EFFECT: Sorts and renders reminders by urgency while exposing reminder CRUD actions
export function ReminderPage(props: { reminders: Reminder[]; setReminders: (next: Reminder[]) => void }) {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | undefined>();

  const sortedReminders = [...props.reminders].filter((r) => !r.done).sort((a, b) => (a.emergency ?? 5) - (b.emergency ?? 5));

  function upsert(reminder: Reminder) {
    props.setReminders([...props.reminders.filter((r) => r.id !== reminder.id), reminder]);
    setDialogOpen(false);
  }

  function doMarkDone(reminder: Reminder) {
    upsert({ ...reminder, done: true, updatedAt: new Date().toISOString() });
  }

  function getColor(emergency: number) {
    switch (emergency) {
      case 1: return "#d32f2f";
      case 2: return "#ed6c02";
      case 3: return "#ff9800";
      case 4: return "#4caf50";
      case 5: default: return "#2196f3";
    }
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: { xs: 1, sm: 2 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">{t("reminder.title")}</Typography>
        <Button variant="contained" onClick={() => { setEditing(undefined); setDialogOpen(true); }}>
          {t("reminder.addReminder")}
        </Button>
      </Stack>

      {sortedReminders.length === 0 ? (
        <Typography variant="body1" sx={{ mt: 4, textAlign: "center", color: "text.secondary" }}>
          {t("reminder.empty")}
        </Typography>
      ) : (
        <Box>
          {sortedReminders.map((reminder) => (
            <Card key={reminder.id} sx={{ mb: 2, borderLeft: "6px solid", borderColor: getColor(reminder.emergency), opacity: reminder.done ? 0.5 : 1 }}>
              <CardContent>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
                  <Box>
                    <Typography variant="h6" sx={{ textDecoration: reminder.done ? "line-through" : "none" }}>
                      {reminder.title}
                    </Typography>
                    {reminder.content && (
                      <Typography variant="body1" sx={{ mt: 1, color: "text.secondary", whiteSpace: "pre-wrap" }}>
                        {reminder.content}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, fontWeight: 'bold' }}>
                      {t("reminder.priority", { value: reminder.emergency })}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => { setEditing(reminder); setDialogOpen(true); }}>
                      {t("reminder.modify")}
                    </Button>
                    {!reminder.done && (
                      <Button size="small" variant="contained" color="success" startIcon={<CheckIcon />} onClick={() => doMarkDone(reminder)}>
                        {t("common.done")}
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <ReminderDialog
        open={dialogOpen}
        mode={editing ? "edit" : "create"}
        reminder={editing}
        onClose={() => { setDialogOpen(false); setEditing(undefined); }}
        onSave={upsert}
      />
    </Box>
  );
}
