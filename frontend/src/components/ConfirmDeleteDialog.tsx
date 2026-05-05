// INPUT: dialog visibility, entity title, and confirmation callbacks
// OUTPUT: deletion confirmation dialog
// EFFECT: Guards destructive task actions across planner views; optionally offers batch syllabus delete
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export function ConfirmDeleteDialog(props: {
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
  syllabusTaskCount?: number;
  onDeleteSyllabus?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={props.open} onClose={props.onCancel}>
      <DialogTitle>{t("common.confirm")}</DialogTitle>
      <DialogContent>
        <Typography>{t("dialog.deleteMessage", { title: props.title })}</Typography>
        {props.onDeleteSyllabus && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t("dialog.deleteSyllabusHint")}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onCancel}>{t("common.cancel")}</Button>
        {props.onDeleteSyllabus && (
          <Button color="warning" onClick={props.onDeleteSyllabus}>
            {t("dialog.deleteSyllabusAction", { count: props.syllabusTaskCount ?? 0 })}
          </Button>
        )}
        <Button color="error" variant="contained" onClick={props.onConfirm}>
          {t("common.delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
