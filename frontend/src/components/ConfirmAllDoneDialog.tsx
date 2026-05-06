// INPUT: dialog visibility and confirmation callbacks
// OUTPUT: all-done confirmation dialog
// EFFECT: Guards bulk completion in the Today planning feature
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, useMediaQuery, useTheme } from "@mui/material";
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog open={props.open} onClose={props.onCancel} fullScreen={isMobile} fullWidth maxWidth="sm">
      <DialogTitle>{t("common.confirm")}</DialogTitle>
      <DialogContent>
        <Typography>{t("dialog.allDoneMessage")}</Typography>
      </DialogContent>
      <DialogActions sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1, px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2 } }}>
        <Button fullWidth={isMobile} onClick={props.onCancel}>{t("common.cancel")}</Button>
        <Button fullWidth={isMobile} variant="contained" onClick={props.onConfirm}>
          {t("dialog.allDoneAction")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
