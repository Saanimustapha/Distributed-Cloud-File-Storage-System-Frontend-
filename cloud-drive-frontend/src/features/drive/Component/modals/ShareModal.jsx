import React, { useEffect, useMemo, useState } from "react";
import {
  MenuItem,
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
// export default function ShareModal({ open, onClose, onSubmit, loading = false }) {
//   const [role, setRole] = useState("read");

//   // Autocomplete state
//   const [inputValue, setInputValue] = useState("");
//   const [options, setOptions] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);

//   const [fetching, setFetching] = useState(false);
//   const [error, setError] = useState("");

//   // debounce typing
//   useEffect(() => {
//     if (!open) return;

//     setError("");

//     const q = inputValue.trim();
//     if (q.length < 2) {
//       setOptions([]);
//       return;
//     }

//     const handle = setTimeout(async () => {
//       setFetching(true);
//       try {
//         // partial search
//         const { data } = await http.get("/users/search", {
//           params: { query: q, limit: 10 },
//         });

//         setOptions(Array.isArray(data) ? data : []);
//       } catch (err) {
//         setOptions([]);
//         setError(getApiErrorMessage(err));
//       } finally {
//         setFetching(false);
//       }
//     }, 300);

//     return () => clearTimeout(handle);
//   }, [inputValue, open]);

//   // Reset modal state whenever it opens
//   useEffect(() => {
//     if (!open) return;
//     setRole("read");
//     setInputValue("");
//     setOptions([]);
//     setSelectedUser(null);
//     setError("");
//     setFetching(false);
//   }, [open]);

//   const canSubmit = useMemo(() => {
//     // Require selecting from suggestions to guarantee we have userId
//     return !!selectedUser?.id && (role === "read" || role === "write");
//   }, [selectedUser, role]);

//   const handleShare = async () => {
//     setError("");

//     if (!selectedUser?.id) {
//       setError("Please select a user from the suggestions.");
//       return;
//     }

//     try {
//       await onSubmit?.({
//         userId: selectedUser.id,
//         email: selectedUser.email,
//         role,
//       });
//     } catch (err) {
//       setError(getApiErrorMessage(err));
//     }
//   };

//   return (
//     <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
//       <DialogTitle>Share file</DialogTitle>

//       <DialogContent>
//         <Stack spacing={2} sx={{ mt: 1 }}>
//           {error && <Alert severity="error">{error}</Alert>}

//           <Autocomplete
//             value={selectedUser}
//             onChange={(event, newValue) => setSelectedUser(newValue)}
//             inputValue={inputValue}
//             onInputChange={(event, newInputValue) => {
//               setInputValue(newInputValue);
//               // If user edits input manually, clear selection so they must re-select
//               setSelectedUser(null);
//             }}
//             options={options}
//             loading={fetching}
//             // your UserRead likely has {id, email, username,...}
//             getOptionLabel={(opt) => opt?.email || ""}
//             isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
//             renderOption={(props, option) => (
//               <Box component="li" {...props} key={option.id}>
//                 <Stack>
//                   <Typography fontWeight={600}>{option.email}</Typography>
//                   {option.username && (
//                     <Typography variant="caption" color="text.secondary">
//                       {option.username}
//                     </Typography>
//                   )}
//                 </Stack>
//               </Box>
//             )}
//             renderInput={(params) => (
//               <TextField
//                 {...params}
//                 label="User email"
//                 placeholder="Type at least 2 characters..."
//                 InputProps={{
//                   ...params.InputProps,
//                   endAdornment: (
//                     <>
//                       {fetching ? <CircularProgress size={18} /> : null}
//                       {params.InputProps.endAdornment}
//                     </>
//                   ),
//                 }}
//               />
//             )}
//           />

//           <TextField
//             select
//             label="Permission"
//             value={role}
//             onChange={(e) => setRole(e.target.value)}
//             SelectProps={{ native: true }}
//           >
//             <option value="read">Can view (read)</option>
//             <option value="write">Can edit (write)</option>
//           </TextField>

//           <Typography variant="caption" color="text.secondary">
//             Tip: Suggestions exclude your own account (by backend rule).
//           </Typography>
//         </Stack>
//       </DialogContent>

//       <DialogActions sx={{ px: 3, pb: 2 }}>
//         <Button onClick={onClose} disabled={loading || fetching}>
//           Cancel
//         </Button>
//         <Button
//           variant="contained"
//           onClick={handleShare}
//           disabled={!canSubmit || loading || fetching}
//         >
//           {loading ? "Sharing..." : "Share"}
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// }

export default function ShareModal({ open, loading, onClose, onSubmit }) {
  const [role, setRole] = useState("read");
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = async (text) => {
    setFetching(true);
    setError("");
    try {
      const { data } = await http.get(`/users/search?query=${encodeURIComponent(text)}`);
      setOptions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setOptions([]);
    } finally {
      setFetching(false);
    }
  };

  // simple debounce without extra libs
  React.useEffect(() => {
    if (!open) return;
    if (!query || query.trim().length < 2) {
      setOptions([]);
      return;
    }
    const t = setTimeout(() => fetchUsers(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query, open]);

  const handleShare = async () => {
    if (!selectedUsers.length) {
      setError("Select at least one user.");
      return;
    }
    await onSubmit({
      userIds: selectedUsers.map((u) => u.id),
      role,
    });
    // optional reset after submit success (DrivePage can close modal)
    setSelectedUsers([]);
    setQuery("");
    setOptions([]);
    setRole("read");
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Share file</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <TextField
            value={error}
            fullWidth
            error
            margin="dense"
            InputProps={{ readOnly: true }}
          />
        )}

        <Autocomplete
          multiple
          options={options}
          value={selectedUsers}
          onChange={(e, v) => setSelectedUsers(v)}
          onInputChange={(e, v) => setQuery(v)}
          getOptionLabel={(opt) => opt.email}
          filterSelectedOptions
          loading={fetching}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Add people (type email)"
              margin="dense"
              placeholder="Start typing..."
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {fetching ? <CircularProgress size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <TextField
          select
          fullWidth
          margin="dense"
          label="Permission"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <MenuItem value="read">Read</MenuItem>
          <MenuItem value="write">Write</MenuItem>
        </TextField>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleShare} disabled={loading}>
          Share
        </Button>
      </DialogActions>
    </Dialog>
  );
}
