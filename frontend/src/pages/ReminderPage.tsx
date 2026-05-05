// INPUT: reminder collection and reminder save callback
// OUTPUT: reminder list page with create, edit, and complete actions
// EFFECT: Runs the persistent reminder feature outside the date-based task flows
import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import { useTranslation } from "react-i18next";

import type { Reminder } from "../types";
import { ReminderDialog } from "../components/ReminderDialog";
import { getPriorityAccent } from "../app/priorities";

export function ReminderPage(props: {
  reminders: Reminder[];
  setReminders: (next: Reminder[]) => void;
  showToast?: (message: string, severity?: "success" | "error" | "info" | "warning") => void;
}) {
  const { t } = useTranslation();
  const { showToast } = props;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | undefined>();

  const sortedReminders = [...props.reminders]
    .filter((r) => !r.done)
    .sort((a, b) => (a.emergency ?? 5) - (b.emergency ?? 5));

  function upsert(reminder: Reminder) {
    const isEditing = !!editing;
    props.setReminders([...props.reminders.filter((r) => r.id !== reminder.id), reminder]);
    setDialogOpen(false);
    showToast?.(isEditing ? t("toast.reminderUpdated") : t("toast.reminderCreated"));
  }

  function doMarkDone(reminder: Reminder) {
    props.setReminders(
      props.reminders.map((currentReminder) =>
        currentReminder.id === reminder.id
          ? { ...currentReminder, done: true, updatedAt: new Date().toISOString() }
          : currentReminder
      )
    );
    showToast?.(t("toast.reminderDone"));
  }

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
      <Paper
        elevation={0}
        sx={{
          mb: 2.5,
          p: { xs: 2, sm: 2.5 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          background:
            "linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(249, 115, 22, 0.05))",
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1.5}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #ef4444, #f97316)",
                color: "#fff",
                boxShadow: "0 8px 20px rgba(239, 68, 68, 0.3)",
              }}
            >
              <NotificationsActiveOutlinedIcon />
            </Box>
            <Box>
              <Typography
                variant="h5"
                fontWeight={800}
                sx={{ fontSize: { xs: "1.15rem", sm: "1.5rem" }, lineHeight: 1.1 }}
              >
                {t("reminder.title")}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {sortedReminders.length} · {t("nav.reminders")}
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
            sx={{ borderRadius: 2.5 }}
          >
            {t("reminder.addReminder")}
          </Button>
        </Stack>
      </Paper>

      {sortedReminders.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            mt: 4,
            py: 8,
            textAlign: "center",
            borderRadius: 4,
            border: "1px dashed",
            borderColor: "divider",
            bgcolor: "rgba(255,255,255,0.6)",
          }}
        >
          <Box sx={{ color: "text.disabled", mb: 1.5, display: "flex", justifyContent: "center" }}>
            <NotificationsActiveOutlinedIcon sx={{ fontSize: 48 }} />
          </Box>
          <Typography color="text.secondary" sx={{ fontWeight: 600, mb: 2 }}>
            {t("reminder.empty")}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddRoundedIcon />}
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
            sx={{ borderRadius: 2.5 }}
          >
            {t("reminder.addReminder")}
          </Button>
        </Paper>
      ) : (
        <Box>
          {sortedReminders.map((reminder) => {
            const color = getPriorityAccent(reminder.emergency);
            return (
              <Card
                key={reminder.id}
                sx={{
                  mb: 1.5,
                  position: "relative",
                  overflow: "hidden",
                  opacity: reminder.done ? 0.6 : 1,
                  borderRadius: 3,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 16px 36px rgba(15, 23, 42, 0.1)",
                  },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 6,
                    background: `linear-gradient(180deg, ${color}, ${alpha(color, 0.6)})`,
                  },
                  background: `linear-gradient(135deg, ${alpha(color, 0.04)}, rgba(255,255,255,1) 60%)`,
                }}
              >
                <CardContent sx={{ pl: "22px !important" }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          sx={{
                            textDecoration: reminder.done ? "line-through" : "none",
                            fontSize: { xs: "1rem", sm: "1.2rem" },
                          }}
                        >
                          {reminder.title}
                        </Typography>
                        <Chip
                          label={`P${reminder.emergency}`}
                          size="small"
                          sx={{
                            bgcolor: alpha(color, 0.9),
                            color: "#fff",
                            fontWeight: 700,
                            height: 22,
                            fontSize: "0.7rem",
                          }}
                        />
                      </Stack>
                      {reminder.content && (
                        <Typography
                          variant="body1"
                          sx={{
                            mt: 1,
                            color: "text.secondary",
                            whiteSpace: "pre-wrap",
                            fontSize: { xs: "0.9rem", sm: "0.95rem" },
                          }}
                        >
                          {reminder.content}
                        </Typography>
                      )}
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="flex-start" flexShrink={0}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          setEditing(reminder);
                          setDialogOpen(true);
                        }}
                        sx={{ borderRadius: 2 }}
                      >
                        {t("reminder.modify")}
                      </Button>
                      {!reminder.done && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => doMarkDone(reminder)}
                          sx={{ borderRadius: 2 }}
                        >
                          {t("common.done")}
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <ReminderDialog
        open={dialogOpen}
        mode={editing ? "edit" : "create"}
        reminder={editing}
        onClose={() => {
          setDialogOpen(false);
          setEditing(undefined);
        }}
        onSave={upsert}
      />
    </Box>
  );
}
