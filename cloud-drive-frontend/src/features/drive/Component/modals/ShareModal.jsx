import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { http } from "../../../../lib/api/http";
import { getApiErrorMessage } from "../../utils/format";

/**
 * Props:
 * - open: boolean
 * - loading: boolean (optional)
 * - onClose: () => void
 * - onSubmit: ({ userId, email, role }) => Promise<void> | void
 *
 * IMPORTANT:
 * We submit userId (selected from suggestions) to avoid "user not found".
 */
export default function ShareModal({ open, onClose, onSubmit, loading = false }) {
  const [role, setRole] = useState("read");

  // Autocomplete state
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  // debounce typing
  useEffect(() => {
    if (!open) return;

    setError("");

    const q = inputValue.trim();
    if (q.length < 2) {
      setOptions([]);
      return;
    }

    const handle = setTimeout(async () => {
      setFetching(true);
      try {
        // partial search
        const { data } = await http.get("/users/search", {
          params: { query: q, limit: 10 },
        });

        setOptions(Array.isArray(data) ? data : []);
      } catch (err) {
        setOptions([]);
        setError(getApiErrorMessage(err));
      } finally {
        setFetching(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [inputValue, open]);

  // Reset modal state whenever it opens
  useEffect(() => {
    if (!open) return;
    setRole("read");
    setInputValue("");
    setOptions([]);
    setSelectedUser(null);
    setError("");
    setFetching(false);
  }, [open]);

  const canSubmit = useMemo(() => {
    // Require selecting from suggestions to guarantee we have userId
    return !!selectedUser?.id && (role === "read" || role === "write");
  }, [selectedUser, role]);

  const handleShare = async () => {
    setError("");

    if (!selectedUser?.id) {
      setError("Please select a user from the suggestions.");
      return;
    }

    try {
      await onSubmit?.({
        userId: selectedUser.id,
        email: selectedUser.email,
        role,
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Share file</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Autocomplete
            value={selectedUser}
            onChange={(event, newValue) => setSelectedUser(newValue)}
            inputValue={inputValue}
            onInputChange={(event, newInputValue) => {
              setInputValue(newInputValue);
              // If user edits input manually, clear selection so they must re-select
              setSelectedUser(null);
            }}
            options={options}
            loading={fetching}
            // your UserRead likely has {id, email, username,...}
            getOptionLabel={(opt) => opt?.email || ""}
            isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id}>
                <Stack>
                  <Typography fontWeight={600}>{option.email}</Typography>
                  {option.username && (
                    <Typography variant="caption" color="text.secondary">
                      {option.username}
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="User email"
                placeholder="Type at least 2 characters..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {fetching ? <CircularProgress size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <TextField
            select
            label="Permission"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            SelectProps={{ native: true }}
          >
            <option value="read">Can view (read)</option>
            <option value="write">Can edit (write)</option>
          </TextField>

          <Typography variant="caption" color="text.secondary">
            Tip: Suggestions exclude your own account (by backend rule).
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading || fetching}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleShare}
          disabled={!canSubmit || loading || fetching}
        >
          {loading ? "Sharing..." : "Share"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
