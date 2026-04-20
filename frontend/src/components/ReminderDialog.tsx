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
import type { Reminder } from "../types";

type Props = {
    open: boolean;
    mode: "create" | "edit";
    reminder?: Reminder;
    onClose: () => void;
    onSave: (r: Reminder) => void;
};

export function ReminderDialog({ open, mode, reminder, onClose, onSave }: Props) {
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
            <DialogTitle>{mode === "create" ? "Create Reminder" : "Edit Reminder"}</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label="Title"
                        fullWidth
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                    />
                    <TextField
                        label="Notes (Optional)"
                        fullWidth
                        multiline
                        rows={3}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Emergency (1=Highest, 5=Lowest)</InputLabel>
                        <Select
                            value={emergency}
                            label="Emergency (1=Highest, 5=Lowest)"
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
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button onClick={handleSave} variant="contained" disabled={!title.trim()}>Save</Button>
            </DialogActions>
        </Dialog>
    );
}