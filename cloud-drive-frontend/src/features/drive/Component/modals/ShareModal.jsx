import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, TextField, Button, Alert, FormControl, InputLabel, Select, MenuItem, CircularProgress
} from "@mui/material";

export default function ShareModal({ open, onClose, onSubmit, loading }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("read");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setEmail("");
      setRole("read");
      setError("");
    }
  }, [open]);

  const handleShare = () => {
    setError("");
    if (!email.trim()) {
      setError("Please enter an email.");
      return;
    }
    onSubmit({ email: email.trim(), role });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Share file</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Recipient email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <MenuItem value="read">Read</MenuItem>
              <MenuItem value="write">Write</MenuItem>
              <MenuItem value="owner">Owner</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleShare} disabled={loading}>
          {loading ? <CircularProgress size={18} /> : "Share"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
