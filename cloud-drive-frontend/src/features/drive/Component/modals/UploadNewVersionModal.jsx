import React, { useEffect, useRef } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Stack, Button, Typography, CircularProgress } from "@mui/material";

export default function UploadNewVersionModal({ open, onClose, onSubmit, loading }) {
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open && fileRef.current) fileRef.current.value = "";
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Upload new version</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <input ref={fileRef} type="file" />
          <Typography variant="body2" color="text.secondary">
            Select a file to upload as the next version.
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => {
            const f = fileRef.current?.files?.[0];
            if (f) onSubmit(f);
          }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={18} /> : "Upload"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
