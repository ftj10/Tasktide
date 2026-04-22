// INPUT: dialog visibility and confirmation callbacks
// OUTPUT: all-done confirmation dialog
// EFFECT: Guards bulk completion in the Today planning feature
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

// INPUT: dialog props for bulk completion
// OUTPUT: confirmation modal UI
// EFFECT: Requires explicit approval before all tasks for a day are marked done
export function ConfirmAllDoneDialog(props: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={props.open} onClose={props.onCancel}>
      <DialogTitle>{t("common.confirm")}</DialogTitle>
      <DialogContent>
        <Typography>{t("dialog.allDoneMessage")}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onCancel}>{t("common.cancel")}</Button>
        <Button variant="contained" onClick={props.onConfirm}>
          {t("dialog.allDoneAction")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
