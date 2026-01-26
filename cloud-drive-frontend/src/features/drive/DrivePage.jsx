import React, { useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Paper, Snackbar, Alert } from "@mui/material";

import { http } from "../../lib/api/http";
import { getApiErrorMessage } from "./utils/format";
import { useDriveData } from "./hooks/useDriveData";

import DriveToolbar from "./Component/DriveToolbar";
import DriveTable from "./Component/DriveTable";
import RowMenu from "./Component/RowMenu";

import RenameModal from "./Component/modals/RenameModal";
import ShareModal from "./Component/modals/ShareModal";
import UploadNewVersionModal from "./Component/modals/UploadNewVersionModal";

export default function DrivePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const parentId = searchParams.get("parent_id");
  const folderId = searchParams.get("folder_id");
  const view = searchParams.get("view") || "drive";

  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });
  const showToast = (severity, message) => setToast({ open: true, severity, message });

  const handleError = useCallback((msg) => {
  showToast("error", msg);
}, []);

  const {
    folders,
    setFolders,
    files,
    setFiles,
    loading,
    refresh,
    currentParentId,
    currentFolderId,
  } = useDriveData({
    parentId,
    folderId,
    view,
    onError: handleError,
  });

  // Upload file input
  const uploadRef = useRef(null);

  // Row menu
  const [rowMenuAnchorEl, setRowMenuAnchorEl] = useState(null);
  const [rowMenuItem, setRowMenuItem] = useState(null);

  // Inline rename for just-created folder
  const [inlineRenameId, setInlineRenameId] = useState(null);
  const inlineRenameRef = useRef(null);

  // Modals
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameModalTitle, setRenameModalTitle] = useState("Rename");
  const [renameInitialValue, setRenameInitialValue] = useState("");
  const [renameTarget, setRenameTarget] = useState(null);

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareTargetFileId, setShareTargetFileId] = useState(null);

  const [uploadNewVersionOpen, setUploadNewVersionOpen] = useState(false);
  const [uploadNewVersionFileId, setUploadNewVersionFileId] = useState(null);

  // Derived
  const items = useMemo(() => {
    if (view !== "drive") return (files || []).map((f) => ({ type: "file", data: f }));
    return [
      ...(folders || []).map((f) => ({ type: "folder", data: f })),
      ...(files || []).map((f) => ({ type: "file", data: f })),
    ];
  }, [folders, files, view]);

  const pageTitle = useMemo(() => {
    if (view === "shared") return "Shared with me";
    if (view === "shared-by-me") return "Shared by me";
    return currentFolderId ? `Folder #${currentFolderId}` : "My Drive";
  }, [view, currentFolderId]);

  const canGoBack = Boolean(view === "drive" && (currentFolderId || currentParentId));

  // Navigation helpers
  const goDriveRoot = () => setSearchParams({ view: "drive" });

  const openFolder = (folder) => {
    setSearchParams({
      view: "drive",
      parent_id: String(folder.id),
      folder_id: String(folder.id),
    });
  };

  // Upload file
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
      e.target.value = "";
    }
  };

  // Create folder
  const createFolder = async () => {
    try {
      const payload = { name: "New folder", parent_id: currentParentId };
      const { data } = await http.post("/folders/create", payload);

      setFolders((prev) => [data, ...prev]);
      setInlineRenameId(data.id);
      setTimeout(() => inlineRenameRef.current?.focus(), 50);
    } catch (err) {
      showToast("error", getApiErrorMessage(err));
    }
  };

  const commitInlineRename = async (folder, newName) => {
    const trimmed = (newName || "").trim();
    setInlineRenameId(null);

    if (!trimmed || trimmed === folder.name) return;

    // NOTE: no rename endpoint in your backend paste => UI only for now
    setFolders((prev) => prev.map((f) => (f.id === folder.id ? { ...f, name: trimmed } : f)));
    showToast("success", "Folder renamed (UI only). Add backend rename endpoint to persist.");
  };

  // Row menu handlers
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

  const downloadFile = (file) => {
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
  };

  const openShareModal = (fileId) => {
    setShareTargetFileId(fileId);
    setShareModalOpen(true);
  };

  const submitShare = async ({ email, role }) => {
    try {
      const { data: user } = await http.get(`/users/search?email=${encodeURIComponent(email)}`);
      const userId = user?.user_id ?? user?.id;
      if (!userId) {
        showToast("error", "User not found.");
        return;
      }

      await http.post(`/files/${shareTargetFileId}/share`, { user_id: userId, role });
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

  return (
    <Box sx={{ minHeight: "calc(100vh - 64px)" }}>
      <Paper sx={{ p: 2 }}>
        <DriveToolbar
          view={view}
          pageTitle={pageTitle}
          loading={loading}
          onCreateFolder={createFolder}
          onTriggerUpload={triggerUpload}
          uploadInput={<input ref={uploadRef} type="file" hidden onChange={handleUploadChange} />}
          onRefresh={refresh}
          canGoBack={canGoBack}
          onGoRoot={goDriveRoot}
        />

        <DriveTable
          items={items}
          loading={loading}
          view={view}
          inlineRenameId={inlineRenameId}
          inlineRenameRef={inlineRenameRef}
          onInlineCommit={commitInlineRename}
          onInlineCancel={() => setInlineRenameId(null)}
          onOpenFolder={openFolder}
          onOpenFile={(file) => navigate(`/app/files/${file.id}`)}
          onOpenRowMenu={openRowMenu}
          onPeopleClick={(file) => navigate(`/app/files/${file.id}/people`)}
        />
      </Paper>

      <RowMenu
        anchorEl={rowMenuAnchorEl}
        open={Boolean(rowMenuAnchorEl)}
        onClose={closeRowMenu}
        item={rowMenuItem}
        onRename={(item) => openRenameModalFor(item)}
        onDeleteFolder={deleteFolder}
        onDownload={downloadFile}
        onUploadNewVersion={openUploadNewVersionModal}
        onShare={openShareModal}
        onDeleteFile={deleteFile}
      />

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
        loading={false}
        onClose={() => setShareModalOpen(false)}
        onSubmit={submitShare}
      />

      <UploadNewVersionModal
        open={uploadNewVersionOpen}
        loading={false}
        onClose={() => setUploadNewVersionOpen(false)}
        onSubmit={submitUploadNewVersion}
      />

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
