// INPUT: dialog visibility, entity title, and confirmation callbacks
// OUTPUT: deletion confirmation dialog
// EFFECT: Guards destructive task actions across planner views
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

// INPUT: dialog props for deletion
// OUTPUT: confirmation modal UI
// EFFECT: Requires explicit approval before the selected item is deleted
export function ConfirmDeleteDialog(props: {
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
        <Typography>{t("dialog.deleteMessage", { title: props.title })}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onCancel}>{t("common.cancel")}</Button>
        <Button color="error" variant="contained" onClick={props.onConfirm}>
          {t("common.delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
