import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  Alert,
  Divider,
} from "@mui/material";

import { http } from "../../lib/api/http";
import { getApiErrorMessage } from "../drive/utils/format"; // adjust path if different

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export default function FilePeoplePage() {
  const navigate = useNavigate();
  const { fileId } = useParams();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const id = useMemo(() => Number(fileId), [fileId]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        // ✅ your backend endpoint
        const { data } = await http.get(`/files/${id}/shares-by-me`);
        if (!alive) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!alive) return;
        setError(getApiErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (Number.isFinite(id)) load();
    else {
      setLoading(false);
      setError("Invalid file id.");
    }

    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Stack>
            <Typography variant="h6" fontWeight={800}>
              Collaborators
            </Typography>
            <Typography variant="body2" color="text.secondary">
              People you shared this file with (email + role).
            </Typography>
          </Stack>

          <Button variant="outlined" onClick={() => navigate(-1)}>
            Back
          </Button>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Stack direction="row" alignItems="center" spacing={1}>
            <CircularProgress size={18} />
            <Typography>Loading...</Typography>
          </Stack>
        ) : rows.length === 0 ? (
          <Typography color="text.secondary">No collaborators found.</Typography>
        ) : (
          <Box>
            {/* Simple table-like layout */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 140px 220px",
                fontWeight: 700,
                color: "text.secondary",
                pb: 1,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box>Email</Box>
              <Box>Role</Box>
              <Box>Shared at</Box>
            </Box>

            {rows.map((r) => (
              <Box
                key={`${r.user_id}-${r.email}`}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 140px 220px",
                  py: 1,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box>
                  <Typography fontWeight={600}>{r.email}</Typography>
                </Box>
                <Box>
                  <Typography>{r.role}</Typography>
                </Box>
                <Box>
                  <Typography color="text.secondary">
                    {formatDateTime(r.shared_at)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
