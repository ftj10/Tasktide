// INPUT: dialog visibility, task title, and confirmation callbacks
// OUTPUT: single-task completion confirmation dialog
// EFFECT: Guards task completion in the Today planning feature
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

// INPUT: dialog props for task completion
// OUTPUT: confirmation modal UI
// EFFECT: Requires explicit approval before a task is marked done
export function ConfirmDoneDialog(props: {
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={props.open} onClose={props.onCancel}>
      <DialogTitle>{t("common.confirm")}</DialogTitle>
      <DialogContent>
        <Typography>{t("dialog.doneMessage", { title: props.title })}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onCancel}>{t("common.cancel")}</Button>
        <Button variant="contained" onClick={props.onConfirm}>{t("common.done")}</Button>
      </DialogActions>
    </Dialog>
  );
}
