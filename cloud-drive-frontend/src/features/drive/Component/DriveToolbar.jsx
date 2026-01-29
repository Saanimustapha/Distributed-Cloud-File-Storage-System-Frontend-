import React from "react";
import { Stack, Typography, Button, Tooltip, CircularProgress } from "@mui/material";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SwapVertIcon from "@mui/icons-material/SwapVert";

export default function DriveToolbar({
  view,
  pageTitle,
  loading,
  onCreateFolder,
  onTriggerUpload,
  uploadInput,
  onRefresh,
  canGoBack,
  onGoRoot,
  onDeleteAllItems,
  showDeleteAllButton,
}) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="h6" sx={{ mr: 1 }}>
          {pageTitle}
        </Typography>

        {view === "drive" && (
          <>
            <Tooltip title="Create folder">
              <Button
                variant="outlined"
                startIcon={<CreateNewFolderIcon />}
                onClick={onCreateFolder}
                disabled={loading}
              >
                Create folder
              </Button>
            </Tooltip>

            <Tooltip title="Upload file">
              <Button
                variant="contained"
                startIcon={<CloudUploadIcon />}
                onClick={onTriggerUpload}
                disabled={loading}
              >
                Upload file
              </Button>
            </Tooltip>

            <Tooltip title="Delete all items in this folder">
            {showDeleteAllButton && (
              <Button
                variant="outlined"
                color="error"
                onClick={onDeleteAllItems}
                disabled={loading}
                sx={{ ml: 1 }}
              >
                Delete all items
              </Button>
            )}
            </Tooltip>

            {uploadInput}
          </>
        )}
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Button onClick={onRefresh} disabled={loading}>
          {loading ? <CircularProgress size={18} /> : "Refresh"}
        </Button>

        {view === "drive" && canGoBack && (
          <Button variant="outlined" onClick={onGoRoot}>
            Back to root
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
