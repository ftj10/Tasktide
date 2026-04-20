import { useEffect, useState } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Stack,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { Reminder } from "../types";

type Props = {
    open: boolean;
    mode: "create" | "edit";
    reminder?: Reminder;
    onClose: () => void;
    onSave: (r: Reminder) => void;
};

export function ReminderDialog({ open, mode, reminder, onClose, onSave }: Props) {
    const { t } = useTranslation();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [emergency, setEmergency] = useState<number>(5);

    useEffect(() => {
        if (open) {
            if (mode === "edit" && reminder) {
                setTitle(reminder.title);
                setContent(reminder.content || "");
                setEmergency(reminder.emergency ?? 5);
            } else {
                setTitle("");
                setContent("");
                setEmergency(5);
            }
        }
    }, [open, mode, reminder]);

    const handleSave = () => {
        if (!title.trim()) return;

        const now = new Date().toISOString();
        const newReminder: Reminder = {
            id: mode === "edit" && reminder ? reminder.id : crypto.randomUUID(),
            title: title.trim(),
            content: content.trim(),
            emergency,
            done: mode === "edit" && reminder ? reminder.done : false,
            createdAt: mode === "edit" && reminder ? reminder.createdAt : now,
            updatedAt: now,
        };

        onSave(newReminder);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{mode === "create" ? t("reminder.createTitle") : t("reminder.editTitle")}</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label={t("reminder.reminderTitle")}
                        fullWidth
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                    />
                    <TextField
                        label={t("reminder.notesOptional")}
                        fullWidth
                        multiline
                        rows={3}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <FormControl fullWidth>
                        <InputLabel>{t("reminder.emergencyField")}</InputLabel>
                        <Select
                            value={emergency}
                            label={t("reminder.emergencyField")}
                            onChange={(e) => setEmergency(Number(e.target.value))}
                        >
                            {[1, 2, 3, 4, 5].map((val) => (
                                <MenuItem key={val} value={val}>
                                    {val}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">{t("common.cancel")}</Button>
                <Button onClick={handleSave} variant="contained" disabled={!title.trim()}>{t("common.save")}</Button>
            </DialogActions>
        </Dialog>
    );
}
