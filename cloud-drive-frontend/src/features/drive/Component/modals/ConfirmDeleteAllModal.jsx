import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

export default function ConfirmDeleteAllModal({ open, onClose, onConfirm, loading }) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete all items?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          This will delete all files and any empty folders inside this folder.
          Non-empty folders (with files/subfolders) will be skipped.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
        >
          {loading ? "Deleting..." : "Delete all"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
