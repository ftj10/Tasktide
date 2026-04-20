import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

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
