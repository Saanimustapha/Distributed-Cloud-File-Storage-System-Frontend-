import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link as RouterLink } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Menu,
  MenuItem,
  Avatar,
  Paper,
  Stack,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import ShareIcon from "@mui/icons-material/Share";
import PeopleIcon from "@mui/icons-material/People";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import HomeIcon from "@mui/icons-material/Home";
import GroupIcon from "@mui/icons-material/Group";
import GroupAddIcon from "@mui/icons-material/GroupAdd";

import { http } from "../../lib/api/http";

/**
 * === ENDPOINTS USED (from your backend) ===
 * Files:
 * - GET  /files/all?folder_id=
 * - GET  /files/shared
 * - GET  /files/shared-by-me
 * - GET  /files/{file_id}/download
 * - DELETE /files/{file_id}/delete
 * - POST /files/upload?folder_id= (multipart: file)
 * - POST /files/{file_id}/versions (multipart: upload)
 * - POST /files/{file_id}/share  (owner) body: { user_id, role }
 * - GET  /files/{file_id}/shares-by-me (owner) -> list people shared to
 *
 * Folders:
 * - GET  /folders/all?page=1&parent_id=
 * - POST /folders/create  body: { name, parent_id? }
 * - DELETE /folders/delete/{folder_id}
 *
 * Users (assumed you added, as per earlier recommendation):
 * - GET /users/me
 * - GET /users/search?email=...
 */

// -------------------- helpers --------------------
function getApiErrorMessage(err) {
  const detail = err?.response?.data?.detail;
  if (!detail) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail?.[0]?.msg || "Validation error.";
  return "Request failed. Please try again.";
}

function formatBytes(bytes) {
  if (bytes == null) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

// -------------------- small modal components --------------------
function RenameModal({ open, title, initialValue, onClose, onSubmit, loading }) {
  const [value, setValue] = useState(initialValue || "");

  useEffect(() => {
    setValue(initialValue || "");
  }, [initialValue, open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="New name"
          fullWidth
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit(value.trim());
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onSubmit(value.trim())}
          disabled={loading || !value.trim()}
        >
          {loading ? <CircularProgress size={18} /> : "Rename"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ShareModal({ open, onClose, onSubmit, loading }) {
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

function UploadNewVersionModal({ open, onClose, onSubmit, loading }) {
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

// -------------------- DrivePage --------------------
export default function DrivePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Query params for navigation into folders
  const parentId = searchParams.get("parent_id"); // folders filter
  const folderId = searchParams.get("folder_id"); // files filter
  const view = searchParams.get("view") || "drive"; // drive | shared | shared-by-me

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);

  const [rowMenuAnchorEl, setRowMenuAnchorEl] = useState(null);
  const [rowMenuItem, setRowMenuItem] = useState(null); // { type: "folder"|"file", data: ... }

  // Data state
  const [me, setMe] = useState(null);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);

  const [loading, setLoading] = useState(false);

  // Create folder (inline rename like desktop)
  const [inlineRenameId, setInlineRenameId] = useState(null);
  const inlineRenameRef = useRef(null);

  // Modals state
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameModalTitle, setRenameModalTitle] = useState("Rename");
  const [renameInitialValue, setRenameInitialValue] = useState("");
  const [renameTarget, setRenameTarget] = useState(null); // { type, id }

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareTargetFileId, setShareTargetFileId] = useState(null);

  const [uploadNewVersionOpen, setUploadNewVersionOpen] = useState(false);
  const [uploadNewVersionFileId, setUploadNewVersionFileId] = useState(null);

  // Upload file input
  const uploadRef = useRef(null);

  // Toasts
  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });
  const showToast = (severity, message) => setToast({ open: true, severity, message });

  const currentParentId = useMemo(() => (parentId ? Number(parentId) : null), [parentId]);
  const currentFolderId = useMemo(() => (folderId ? Number(folderId) : null), [folderId]);

  // -------------------- API calls --------------------
  const fetchMe = async () => {
    try {
      const { data } = await http.get("/users/me");
      setMe(data);
    } catch {
      // optional endpoint - ignore if not added yet
    }
  };

  const fetchFolders = async () => {
    // Your folders endpoint is paginated (PAGE_SIZE=10).
    // We will fetch pages until we get < 10 results.
    const pageSize = 10;
    let page = 1;
    let all = [];

    while (true) {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      if (currentParentId !== null) qs.set("parent_id", String(currentParentId));

      const { data } = await http.get(`/folders/all?${qs.toString()}`);
      all = all.concat(data || []);
      if (!data || data.length < pageSize) break;
      page += 1;
    }

    setFolders(all);
  };

  const fetchFiles = async () => {
    // view decides which files endpoint to use
    if (view === "shared") {
      const { data } = await http.get("/files/shared");
      setFiles(data || []);
      return;
    }

    if (view === "shared-by-me") {
      const { data } = await http.get("/files/shared-by-me");
      setFiles(data || []);
      return;
    }

    // default: my files in folder
    const qs = new URLSearchParams();
    if (currentFolderId !== null) qs.set("folder_id", String(currentFolderId));
    const url = qs.toString() ? `/files/all?${qs.toString()}` : `/files/all`;
    const { data } = await http.get(url);
    setFiles(data || []);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      // On shared views, folders list isn’t relevant
      if (view === "drive") {
        await Promise.all([fetchFolders(), fetchFiles()]);
      } else {
        await fetchFiles();
        setFolders([]);
      }
    } catch (err) {
      showToast("error", getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentId, folderId, view]);

  // -------------------- navigation helpers --------------------
  const goDriveRoot = () => {
    setSearchParams({ view: "drive" });
  };

  const openFolder = (folder) => {
    // Both folders and files should follow the clicked folder context.
    // You requested: parent_id filter for folders, folder_id filter for files.
    setSearchParams({
      view: "drive",
      parent_id: String(folder.id),
      folder_id: String(folder.id),
    });
  };

  // -------------------- create folder (with inline rename) --------------------
  const createFolder = async () => {
    try {
      const payload = {
        name: "New folder",
        parent_id: currentParentId, // null for root
      };
      const { data } = await http.post("/folders/create", payload);

      // optimistic: place it at top
      setFolders((prev) => [data, ...prev]);

      // open inline rename right away
      setInlineRenameId(data.id);

      // focus after render
      setTimeout(() => inlineRenameRef.current?.focus(), 50);
    } catch (err) {
      showToast("error", getApiErrorMessage(err));
    }
  };

  const commitInlineRename = async (folder, newName) => {
    const trimmed = (newName || "").trim();
    setInlineRenameId(null);

    // If user didn't rename, keep as is (New folder)
    if (!trimmed || trimmed === folder.name) return;

    // --- IMPORTANT ---
    // You did NOT provide a folder rename endpoint in your pasted routes.
    // If you added one, update this call accordingly.
    // Example suggested endpoint:
    // await http.patch(`/folders/${folder.id}`, { name: trimmed });
    try {
      // TEMP: only update UI locally
      setFolders((prev) => prev.map((f) => (f.id === folder.id ? { ...f, name: trimmed } : f)));
      showToast("success", "Folder renamed (UI only). Add a backend rename endpoint to persist.");
    } catch (err) {
      showToast("error", getApiErrorMessage(err));
    }
  };

  // -------------------- upload file --------------------
  const triggerUpload = () => uploadRef.current?.click();

  const handleUploadChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const form = new FormData();
      form.append("file", file);

      const qs = new URLSearchParams();
      if (currentFolderId !== null) qs.set("folder_id", String(currentFolderId));
      const url = qs.toString() ? `/files/upload?${qs.toString()}` : `/files/upload`;

      await http.post(url, form, { headers: { "Content-Type": "multipart/form-data" } });
      showToast("success", "File uploaded.");
      await refresh();
    } catch (err) {
      showToast("error", getApiErrorMessage(err));
    } finally {
      // reset input
      e.target.value = "";
    }
  };

  // -------------------- row menu actions --------------------
  const openRowMenu = (evt, item) => {
    setRowMenuAnchorEl(evt.currentTarget);
    setRowMenuItem(item);
  };

  const closeRowMenu = () => {
    setRowMenuAnchorEl(null);
    setRowMenuItem(null);
  };

  const deleteFolder = async (id) => {
    try {
      await http.delete(`/folders/delete/${id}`);
      showToast("success", "Folder deleted.");
      setFolders((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      showToast("error", getApiErrorMessage(err));
    }
  };

  const deleteFile = async (id) => {
    try {
      await http.delete(`/files/${id}/delete`);
      showToast("success", "File deleted.");
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      showToast("error", getApiErrorMessage(err));
    }
  };

  const downloadFile = async (file) => {
    // Use browser navigation to streaming endpoint
    const base = http.defaults.baseURL || "";
    const url = `${base}/files/${file.id}/download`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openRenameModalFor = (target) => {
    setRenameTarget(target);
    setRenameModalTitle(target.type === "folder" ? "Rename folder" : "Rename file");
    setRenameInitialValue(target.data?.name || "");
    setRenameModalOpen(true);
  };

  const submitRenameModal = async (newName) => {
    const trimmed = (newName || "").trim();
    if (!renameTarget || !trimmed) return;

    setRenameModalOpen(false);

    // No folder/file rename endpoint provided.
    // We will do UI-only update for now.
    try {
      if (renameTarget.type === "folder") {
        setFolders((prev) =>
          prev.map((f) => (f.id === renameTarget.data.id ? { ...f, name: trimmed } : f))
        );
        showToast("success", "Folder renamed (UI only). Add backend rename endpoint to persist.");
      } else {
        setFiles((prev) =>
          prev.map((x) => (x.id === renameTarget.data.id ? { ...x, name: trimmed } : x))
        );
        showToast("success", "File renamed (UI only). Add backend rename endpoint to persist.");
      }
    } catch (err) {
      showToast("error", getApiErrorMessage(err));
    }
  };

  const openShareModal = (fileId) => {
    setShareTargetFileId(fileId);
    setShareModalOpen(true);
  };

  const submitShare = async ({ email, role }) => {
    try {
      // Lookup user_id by email (endpoint assumed added)
      const { data: user } = await http.get(`/users/search?email=${encodeURIComponent(email)}`);
      if (!user?.id && !user?.user_id) {
        showToast("error", "User not found.");
        return;
      }
      const userId = user.user_id ?? user.id;

      await http.post(`/files/${shareTargetFileId}/share`, {
        user_id: userId,
        role,
      });

      showToast("success", "File shared successfully.");
      setShareModalOpen(false);
    } catch (err) {
      showToast("error", getApiErrorMessage(err));
    }
  };

  const openUploadNewVersionModal = (fileId) => {
    setUploadNewVersionFileId(fileId);
    setUploadNewVersionOpen(true);
  };

  const submitUploadNewVersion = async (file) => {
    try {
      const form = new FormData();
      form.append("upload", file);

      await http.post(`/files/${uploadNewVersionFileId}/versions`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("success", "New version uploaded.");
      setUploadNewVersionOpen(false);
      await refresh();
    } catch (err) {
      showToast("error", getApiErrorMessage(err));
    }
  };

  // -------------------- derived UI list items --------------------
  const items = useMemo(() => {
    // For drive view: combine folders + files in a single list like Drive.
    // Shared views: show only files.
    if (view !== "drive") {
      return (files || []).map((f) => ({ type: "file", data: f }));
    }
    const folderItems = (folders || []).map((f) => ({ type: "folder", data: f }));
    const fileItems = (files || []).map((f) => ({ type: "file", data: f }));
    return [...folderItems, ...fileItems];
  }, [folders, files, view]);

  // -------------------- sidebar navigation --------------------
  const sidebarItems = [
    { key: "drive", label: "My Drive", icon: <HomeIcon />, onClick: () => setSearchParams({ view: "drive" }) },
    { key: "shared", label: "Shared with me", icon: <GroupIcon />, onClick: () => setSearchParams({ view: "shared" }) },
    { key: "shared-by-me", label: "Shared by me", icon: <GroupAddIcon />, onClick: () => setSearchParams({ view: "shared-by-me" }) },
  ];

  const pageTitle = useMemo(() => {
    if (view === "shared") return "Shared with me";
    if (view === "shared-by-me") return "Shared by me";
    return currentFolderId ? `Folder #${currentFolderId}` : "My Drive";
  }, [view, currentFolderId]);

  // -------------------- render --------------------
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "background.default" }}>
      {/* Sidebar */}
      <Drawer
        variant="persistent"
        open={sidebarOpen}
        sx={{
          "& .MuiDrawer-paper": {
            width: 260,
            boxSizing: "border-box",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={800}>
            Cloud Drive
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {me?.email ? `Signed in as ${me.email}` : " "}
          </Typography>
        </Box>
        <Divider />
        <List>
          {sidebarItems.map((it) => (
            <ListItemButton
              key={it.key}
              selected={view === it.key}
              onClick={it.onClick}
            >
              <ListItemIcon>{it.icon}</ListItemIcon>
              <ListItemText primary={it.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top Navbar */}
        <AppBar position="sticky" color="default" elevation={1}>
          <Toolbar sx={{ gap: 1 }}>
            <IconButton onClick={() => setSidebarOpen((v) => !v)} edge="start">
              <MenuIcon />
            </IconButton>

            {/* Favicon / Logo */}
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1,
                bgcolor: "primary.main",
                display: "grid",
                placeItems: "center",
                color: "primary.contrastText",
                fontWeight: 900,
                mr: 1,
              }}
              title="Cloud Drive"
            >
              CD
            </Box>

            <Typography variant="h6" sx={{ flex: 1 }}>
              {pageTitle}
            </Typography>

            {view === "drive" && (
              <>
                <Tooltip title="Create folder">
                  <Button
                    variant="outlined"
                    startIcon={<CreateNewFolderIcon />}
                    onClick={createFolder}
                    disabled={loading}
                  >
                    Create folder
                  </Button>
                </Tooltip>

                <Tooltip title="Upload file">
                  <Button
                    variant="contained"
                    startIcon={<CloudUploadIcon />}
                    onClick={triggerUpload}
                    disabled={loading}
                  >
                    Upload file
                  </Button>
                </Tooltip>

                {/* Global upload new version button (you can choose a file row later) */}
                <Tooltip title="Upload new version (select a file from list using ⋮)">
                  <Button
                    variant="text"
                    startIcon={<SwapVertIcon />}
                    disabled
                  >
                    Upload new version
                  </Button>
                </Tooltip>

                <input
                  ref={uploadRef}
                  type="file"
                  hidden
                  onChange={handleUploadChange}
                />
              </>
            )}

            {/* Profile icon */}
            <IconButton onClick={(e) => setProfileAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 34, height: 34 }}>
                {(me?.email || "U")[0]?.toUpperCase?.() || "U"}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={profileAnchorEl}
              open={Boolean(profileAnchorEl)}
              onClose={() => setProfileAnchorEl(null)}
            >
              <MenuItem disabled>
                <Stack>
                  <Typography fontWeight={700}>{me?.email || "User"}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {me?.id ? `User ID: ${me.id}` : " "}
                  </Typography>
                </Stack>
              </MenuItem>
              <Divider />
              <MenuItem component={RouterLink} to="/login" onClick={() => setProfileAnchorEl(null)}>
                Sign out (clears token manually in AppShell)
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Box sx={{ p: 2 }}>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {view === "drive" ? "Folders & files" : "Files"}
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center">
                <Button onClick={refresh} disabled={loading}>
                  {loading ? <CircularProgress size={18} /> : "Refresh"}
                </Button>

                {view === "drive" && (currentFolderId || currentParentId) && (
                  <Button variant="outlined" onClick={goDriveRoot}>
                    Back to root
                  </Button>
                )}
              </Stack>
            </Stack>

            {/* Header row */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 180px 160px 40px",
                px: 1,
                py: 1,
                borderBottom: "1px solid",
                borderColor: "divider",
                color: "text.secondary",
                fontSize: 13,
              }}
            >
              <Box />
              <Box>Name</Box>
              <Box>Last modified</Box>
              <Box>Size</Box>
              <Box />
            </Box>

            {/* Rows */}
            {items.length === 0 && !loading ? (
              <Box sx={{ p: 3 }}>
                <Typography color="text.secondary">No items here.</Typography>
              </Box>
            ) : (
              <Stack>
                {items.map(({ type, data }) => {
                  const isFolder = type === "folder";
                  const isInline = isFolder && inlineRenameId === data.id;

                  return (
                    <Box
                      key={`${type}-${data.id}`}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "40px 1fr 180px 160px 40px",
                        alignItems: "center",
                        px: 1,
                        py: 1,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        "&:hover": { bgcolor: "action.hover" },
                        cursor: isFolder ? "pointer" : "default",
                      }}
                      onDoubleClick={() => {
                        if (isFolder) openFolder(data);
                        if (!isFolder) navigate(`/app/files/${data.id}`);
                      }}
                      onClick={() => {
                        if (isFolder) return;
                        // single click on file could open details too; leaving double-click only
                      }}
                    >
                      <Box sx={{ display: "grid", placeItems: "center" }}>
                        {isFolder ? <FolderIcon /> : <InsertDriveFileIcon />}
                      </Box>

                      <Box>
                        {isInline ? (
                          <TextField
                            inputRef={inlineRenameRef}
                            defaultValue={data.name}
                            size="small"
                            onBlur={(e) => commitInlineRename(data, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitInlineRename(data, e.target.value);
                              if (e.key === "Escape") setInlineRenameId(null);
                            }}
                            sx={{ maxWidth: 420 }}
                          />
                        ) : (
                          <Typography
                            fontWeight={600}
                            sx={{ userSelect: "none" }}
                            onClick={() => {
                              if (isFolder) openFolder(data);
                            }}
                          >
                            {data.name}
                          </Typography>
                        )}
                        {!isFolder && view === "shared" && data.my_role && (
                          <Typography variant="caption" color="text.secondary">
                            Your role: {data.my_role}
                          </Typography>
                        )}
                        {!isFolder && view === "shared-by-me" && (
                          <Typography variant="caption" color="text.secondary">
                            Collaborators: {data.collaborator_count ?? "—"}
                          </Typography>
                        )}
                      </Box>

                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(data.updated_at || data.latest_version_created_at || data.created_at)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {isFolder ? "—" : formatBytes(data.latest_version_size_bytes)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        {/* If shared-by-me view: show people button for each file */}
                        {view === "shared-by-me" && !isFolder ? (
                          <Tooltip title="People (who you shared with)">
                            <IconButton
                              onClick={() => navigate(`/app/files/${data.id}/people`)}
                            >
                              <PeopleIcon />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              openRowMenu(e, { type, data });
                            }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Row menu */}
      <Menu
        anchorEl={rowMenuAnchorEl}
        open={Boolean(rowMenuAnchorEl)}
        onClose={closeRowMenu}
      >
        {rowMenuItem?.type === "folder" ? (
          <>
            <MenuItem
              onClick={() => {
                closeRowMenu();
                openRenameModalFor({ type: "folder", data: rowMenuItem.data });
              }}
            >
              <ListItemIcon><DriveFileRenameOutlineIcon fontSize="small" /></ListItemIcon>
              Rename
            </MenuItem>

            <MenuItem
              onClick={() => {
                const folder = rowMenuItem.data;
                closeRowMenu();
                deleteFolder(folder.id);
              }}
            >
              <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
              Delete folder
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem
              onClick={() => {
                const file = rowMenuItem.data;
                closeRowMenu();
                downloadFile(file);
              }}
            >
              <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
              Download
            </MenuItem>

            <MenuItem
              onClick={() => {
                const file = rowMenuItem.data;
                closeRowMenu();
                openUploadNewVersionModal(file.id);
              }}
            >
              <ListItemIcon><SwapVertIcon fontSize="small" /></ListItemIcon>
              Upload new version
            </MenuItem>

            <MenuItem
              onClick={() => {
                const file = rowMenuItem.data;
                closeRowMenu();
                openShareModal(file.id);
              }}
            >
              <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
              Share file
            </MenuItem>

            <MenuItem
              onClick={() => {
                const file = rowMenuItem.data;
                closeRowMenu();
                deleteFile(file.id);
              }}
            >
              <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
              Delete file
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Modals */}
      <RenameModal
        open={renameModalOpen}
        title={renameModalTitle}
        initialValue={renameInitialValue}
        loading={false}
        onClose={() => setRenameModalOpen(false)}
        onSubmit={submitRenameModal}
      />

      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onSubmit={submitShare}
        loading={false}
      />

      <UploadNewVersionModal
        open={uploadNewVersionOpen}
        onClose={() => setUploadNewVersionOpen(false)}
        onSubmit={submitUploadNewVersion}
        loading={false}
      />

      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

