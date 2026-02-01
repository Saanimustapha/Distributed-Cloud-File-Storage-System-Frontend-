import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Paper, Snackbar, Alert, Button } from "@mui/material";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";

import { http } from "../../lib/api/http";
import { getApiErrorMessage } from "./utils/format";
import { useDriveData } from "./hooks/useDriveData";

import DriveBreadCrumbs from "./Component/DriveBreadCrumbs";

import DriveToolbar from "./Component/DriveToolbar";
import DriveTable from "./Component/DriveTable";
import RowMenu from "./Component/RowMenu";

import RenameModal from "./Component/modals/RenameModal";
import ShareModal from "./Component/modals/ShareModal";
import UploadNewVersionModal from "./Component/modals/UploadNewVersionModal";
import ConfirmDeleteModal from "./Component/modals/ConfirmDeleteModal";
import ConfirmDeleteAllModal from "./Component/modals/ConfirmDeleteAllModal";



export default function DrivePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const parentId = searchParams.get("parent_id");
  const folderId = searchParams.get("folder_id");
  const view = searchParams.get("view") || "drive";

  // Toast
  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });
  const showToast = (severity, message) => setToast({ open: true, severity, message });


  // Stable error handler (prevents refresh loops)
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

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); 
  // { type: "file"|"folder", data: { ... } }
  const [deleting, setDeleting] = useState(false);


  const openDeleteConfirm = (item) => {
    setDeleteTarget(item);      // item = { type, data }
    setConfirmDeleteOpen(true);
  };

const tryOpenFolderDeleteConfirm = async (folder) => {
  const id = Number(folder?.id);
  if (!Number.isInteger(id)) {
    showToast("error", "Invalid folder id");
    return;
  }

  // ✅ Always allow confirming delete (recursive delete)
  setDeleteTarget({ type: "folder", data: folder });
  setConfirmDeleteOpen(true);
};



  const closeDeleteConfirm = () => {
    if (deleting) return;
    setConfirmDeleteOpen(false);
    setDeleteTarget(null);
  };


  const confirmDelete = async () => {
      try {
        const target = deleteTarget; // { type, data }
        if (!target) return;

        if (target.type === "folder") {
          const id = Number(target.data.id);
          const { data } = await http.delete(`/folders/${id}/delete-tree`);

          showToast(
            "success",
            `Deleted ${data.deleted_files} file(s) and ${data.deleted_folders} folder(s).`
          );

          await refresh();
        } else {
          await deleteFile(deleteTarget.data.id);
        }

        setConfirmDeleteOpen(false);
        setDeleteTarget(null);
      } catch (err) {
        showToast("error", getApiErrorMessage(err));
    }
  };

  const [noWriteOpen, setNoWriteOpen] = useState(false);
  const [noWriteMsg, setNoWriteMsg] = useState("");


  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);

  const showDeleteAllButton = view === "drive";


const deleteAllItems = async () => {
  setDeleteAllLoading(true);

  try {
    const res =
      currentFolderId == null
        ? await http.delete("/folders/delete-all-items/root")
        : await http.delete(`/folders/${currentFolderId}/delete-all-items`);

    const data = res.data;

    // refresh list after deletions
    await refresh();

    // ✅ single toast (no skipped folders anymore)
    showToast(
      "success",
      `Deleted ${data.deleted_files} file(s) and ${data.deleted_folders} folder(s).`
    );

    setDeleteAllOpen(false);
  } catch (err) {
    showToast("error", getApiErrorMessage(err));
  } finally {
    setDeleteAllLoading(false);
  }
};





  // Breadcrumb
  const [breadcrumbPath, setBreadcrumbPath] = useState([]);

  const fetchBreadcrumbPath = useCallback(async () => {
    // only show breadcrumbs inside Drive view
    if (view !== "drive") {
      setBreadcrumbPath([]);
      return;
    }

    // root
    if (!currentFolderId) {
      setBreadcrumbPath([]);
      return;
    }

    const { data } = await http.get(`/folders/${currentFolderId}/path`);
    setBreadcrumbPath(Array.isArray(data) ? data : []);
  }, [currentFolderId, view]);

  useEffect(() => {
    fetchBreadcrumbPath().catch(() => setBreadcrumbPath([]));
  }, [fetchBreadcrumbPath]);

  // Upload file input
  const uploadRef = useRef(null);

  // Row menu
  const [rowMenuAnchorEl, setRowMenuAnchorEl] = useState(null);
  const [rowMenuItem, setRowMenuItem] = useState(null);

  // Inline rename
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

  // Combine folders + files
  const items = useMemo(() => {
    if (view !== "drive") return (files || []).map((f) => ({ type: "file", data: f }));
    return [
      ...(folders || []).map((f) => ({ type: "folder", data: f })),
      ...(files || []).map((f) => ({ type: "file", data: f })),
    ];
  }, [folders, files, view]);

  const canGoBack = Boolean(view === "drive" && (currentFolderId || currentParentId));

  // Navigation
  const goDriveRoot = useCallback(() => {
    setSearchParams({ view: "drive" });
  }, [setSearchParams]);

  const openFolder = useCallback(
    (folder) => {
      setSearchParams({
        view: "drive",
        parent_id: String(folder.id),
        folder_id: String(folder.id),
      });
    },
    [setSearchParams]
  );

  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null); // file object
  const [removing, setRemoving] = useState(false);

  const removeSharedFile = async (file) => {
    try {
      setRemoving(true);
      await http.delete(`/files/${file.id}/remove-from-shared`);
      showToast("success", "Removed from Shared with me.");
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      setConfirmRemoveOpen(false);
      setRemoveTarget(null);
    } catch (err) {
      showToast("error", getApiErrorMessage(err));
    } finally {
      setRemoving(false);
    }
  };

  const tryOpenRemoveSharedConfirm = (file) => {
    setRemoveTarget(file);
    setConfirmRemoveOpen(true);
  };




  // breadcrumb click open by id
  const openFolderById = useCallback(
    (id) => {
      setSearchParams({
        view: "drive",
        parent_id: String(id),
        folder_id: String(id),
      });
    },
    [setSearchParams]
  );

  // Build breadcrumb node for toolbar title
  const titleNode = useMemo(() => {
    if (view === "shared") return "Shared with me";
    if (view === "shared-by-me") return "Shared by me";

    return (
      <DriveBreadCrumbs
        path={breadcrumbPath}
        onGoRoot={goDriveRoot}
        onOpenFolder={openFolderById}
      />
    );
  }, [view, breadcrumbPath, goDriveRoot, openFolderById]);

  // Upload
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

// Create folder (inside the currently opened folder)
const createFolder = async () => {
  try {
    const payload = {
      name: "New folder",
      parent_id: currentFolderId ?? null, // <-- IMPORTANT
    };

    const { data } = await http.post("/folders/create", payload);

    setFolders((prev) => [data, ...prev]);
    setInlineRenameId(data.id);
    setTimeout(() => inlineRenameRef.current?.focus(), 50);
  } catch (err) {
    showToast("error", getApiErrorMessage(err));
  }
};


  // Inline rename (persist via backend endpoint)
  const commitInlineRename = async (folder, newName) => {
    const trimmed = (newName || "").trim();
    setInlineRenameId(null);

    if (!trimmed || trimmed === folder.name) return;

    const prevName = folder.name;
    setFolders((prev) => prev.map((f) => (f.id === folder.id ? { ...f, name: trimmed } : f)));

    try {
      const { data } = await http.patch(`/folders/${folder.id}/rename`, { name: trimmed });

      setFolders((prev) => prev.map((f) => (f.id === folder.id ? data : f)));

      // if we are inside this folder, refresh breadcrumbs (name changed)
      fetchBreadcrumbPath().catch(() => {});
      showToast("success", "Folder renamed.");
    } catch (err) {
      setFolders((prev) => prev.map((f) => (f.id === folder.id ? { ...f, name: prevName } : f)));
      showToast("error", getApiErrorMessage(err));
    }
  };

  // Row menu
  const openRowMenu = (evt, item) => {
    setRowMenuAnchorEl(evt.currentTarget);
    setRowMenuItem(item);
  };

  const closeRowMenu = () => {
    setRowMenuAnchorEl(null); // close menu first (keep item)
  };

  // run when close animation finishes
  const clearRowMenuItem = () => {
    setRowMenuItem(null);
  };


  const deleteFolder = async (id) => {
    try {
      await http.delete(`/folders/delete/${id}`);
      showToast("success", "Folder deleted.");
      setFolders((prev) => prev.filter((f) => f.id !== id));
      fetchBreadcrumbPath().catch(() => {});
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
  try {
    const res = await http.get(`/files/${file.id}/download`, {
      responseType: "blob",
    });

    // Try to get filename from Content-Disposition
    const disposition = res.headers?.["content-disposition"] || "";
    const match = disposition.match(/filename="(.+)"/);
    const filename = match?.[1] || file.name || "download";

    const blobUrl = window.URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);

    showToast("success", "Download started.");
  } catch (err) {
    showToast("error", getApiErrorMessage(err));
  }
};

const openRenameModalFor = (target) => {
    // If we're in "Shared with me" view and user is not write/owner, block rename
    if (view === "shared" && target?.type === "file") {
      const role = target.data?.my_role; // should exist from /files/shared endpoint
      const canWrite = role === "write" || role === "owner";

      if (!canWrite) {
        setNoWriteMsg("You cannot rename this file. Write permission is required.");
        setNoWriteOpen(true);
        return; // don't open RenameModal
      }
    }

    //otherwise proceed normally
    setRenameTarget(target);
    setRenameModalTitle(target.type === "folder" ? "Rename folder" : "Rename file");
    setRenameInitialValue(target.data?.name || "");
    setRenameModalOpen(true);
  };


  // Modal rename (persist folders using backend)
  const submitRenameModal = async (newName) => {
    const trimmed = (newName || "").trim();
    if (!renameTarget || !trimmed) return;

    setRenameModalOpen(false);

    try {
      if (renameTarget.type === "folder") {
        const { data } = await http.patch(`/folders/${renameTarget.data.id}/rename`, { name: trimmed });
        setFolders((prev) => prev.map((f) => (f.id === renameTarget.data.id ? data : f)));
        fetchBreadcrumbPath().catch(() => {});
        showToast("success", "Folder renamed.");
      } else {
        // ✅ FILE rename persists in backend now

        await http.patch(`/files/${renameTarget.data.id}/rename`, { name: trimmed });

        // Update UI quickly (name only)
        setFiles((prev) =>
          prev.map((f) => (f.id === renameTarget.data.id ? { ...f, name: trimmed } : f))
        );

        // Optional but safest: refresh list so UI stays consistent with backend sorting/updated_at
        await refresh();

        showToast("success", "File renamed.");
      }
    } catch (err) {
      showToast("error", getApiErrorMessage(err));
    }
  };

  const openShareModal = (fileId) => {
    setShareTargetFileId(fileId);
    setShareModalOpen(true);
  };

  

const submitShare = async ({ userIds, role }) => {
  try {
    const res = await http.post(`/files/${shareTargetFileId}/share`, {
      user_ids: userIds,
      role,
    });

    const data = res.data;
    showToast("success", `Shared with ${data.count_shared} user(s).`);

    if (data.count_skipped > 0) {
      const skipped = data.skipped.map((s) => s.user_id).join(", ");
      setTimeout(() => showToast("warning", `Skipped: ${skipped}`), 450);
    }

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
          pageTitle={titleNode}  // <-- breadcrumb node for drive view
          loading={loading}
          onCreateFolder={createFolder}
          onTriggerUpload={triggerUpload}
          uploadInput={<input ref={uploadRef} type="file" hidden onChange={handleUploadChange} />}
          onRefresh={refresh}
          canGoBack={canGoBack}
          onGoRoot={goDriveRoot}
          showDeleteAllButton={showDeleteAllButton}
          onDeleteAllItems={() => setDeleteAllOpen(true)}
          onSearchSelect={(result) => {
            if (result.type === "file") {
              navigate(`/app/files/${result.id}/view`, { state: { file: result } });
              return;
            }
            if (result.type === "folder") {
              setSearchParams({
                view: "drive",
                parent_id: String(result.id),
                folder_id: String(result.id),
              });
            }
          }}
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
          onOpenFile={(file) => navigate(`/app/files/${file.id}/view`, { state: { file } })}
          onOpenRowMenu={openRowMenu}
          onPeopleClick={(file) => navigate(`/app/files/${file.id}/people`)}
        />
      </Paper>

      <RowMenu
        view={view}
        anchorEl={rowMenuAnchorEl}
        open={Boolean(rowMenuAnchorEl)}
        onClose={closeRowMenu}
        onExited={clearRowMenuItem}
        item={rowMenuItem}
        onRename={(item) => openRenameModalFor(item)}
        onDeleteFolder={(folder) => tryOpenFolderDeleteConfirm(folder)}
        onDownload={downloadFile}
        onShare={openShareModal}
        onDeleteFile={(file) => openDeleteConfirm({ type: "file", data: file })}
        onRemoveShared={(file) => {
          closeRowMenu();
          tryOpenRemoveSharedConfirm(file);
        }}
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

      <ConfirmDeleteModal
        open={confirmDeleteOpen}
        loading={deleting}
        title={
          deleteTarget?.type === "folder" ? "Delete folder?" : "Delete file?"
        }
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.data.name}"? This action cannot be undone.`
            : ""
        }
        onClose={closeDeleteConfirm}
        onConfirm={confirmDelete}
      />

      <ConfirmDeleteModal
        open={confirmRemoveOpen}
        loading={removing}
        title="Remove file?"
        description={
          removeTarget
            ? `Remove "${removeTarget.name}" from your Shared with me list? You will lose access unless it is shared again.`
            : ""
        }
        onClose={() => {
          if (removing) return;
          setConfirmRemoveOpen(false);
          setRemoveTarget(null);
        }}
        onConfirm={() => {
          if (!removeTarget) return;
          removeSharedFile(removeTarget);
        }}
      />


      <ConfirmDeleteAllModal
        open={deleteAllOpen}
        loading={deleteAllLoading}
        onClose={() => setDeleteAllOpen(false)}
        onConfirm={deleteAllItems}
      />

      <Dialog open={noWriteOpen} onClose={() => setNoWriteOpen(false)}>
        <DialogTitle>Action not allowed</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            {noWriteMsg}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoWriteOpen(false)} variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>



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
