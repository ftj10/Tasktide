import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

/**
 * A simple confirmation dialog for marking all tasks on a day as done.
 *
 * Props:
 * - open: whether the dialog is visible.
 * - onCancel: callback to dismiss the dialog without taking action.
 * - onConfirm: callback to mark all tasks as done.
 */
export function ConfirmAllDoneDialog(props: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={props.open} onClose={props.onCancel}>
      <DialogTitle>Confirm</DialogTitle>
      <DialogContent>
        <Typography>Mark all tasks for this day as done?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onCancel}>Cancel</Button>
        <Button variant="contained" onClick={props.onConfirm}>
          All done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
