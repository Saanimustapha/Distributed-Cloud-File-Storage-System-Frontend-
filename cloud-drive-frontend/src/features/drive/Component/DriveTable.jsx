import React from "react";
import { Box, Stack, Typography, TextField, IconButton, Tooltip } from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PeopleIcon from "@mui/icons-material/People";

import { formatBytes, formatDate } from "../utils/format";

export default function DriveTable({
  items,
  loading,
  view,
  inlineRenameId,
  inlineRenameRef,
  onInlineCommit,
  onInlineCancel,
  onOpenFolder,
  onOpenFile,
  onOpenRowMenu,
  onPeopleClick,
}) {
  return (
    <>
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
                  if (isFolder) onOpenFolder(data);
                  else onOpenFile(data);
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
                      onBlur={(e) => onInlineCommit(data, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onInlineCommit(data, e.target.value);
                        if (e.key === "Escape") onInlineCancel();
                      }}
                      sx={{ maxWidth: 420 }}
                    />
                  ) : (
                    <Typography
                      fontWeight={600}
                      sx={{ userSelect: "none" }}
                      onClick={() => {
                        if (isFolder) onOpenFolder(data);
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
                  {view === "shared-by-me" && !isFolder ? (
                    <Tooltip title="People (who you shared with)">
                      <IconButton onClick={() => onPeopleClick(data)}>
                        <PeopleIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRowMenu(e, { type, data });
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
    </>
  );
}
