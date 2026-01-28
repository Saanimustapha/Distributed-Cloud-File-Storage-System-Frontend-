import React from "react";
import { Menu, MenuItem, ListItemIcon } from "@mui/material";

import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import ShareIcon from "@mui/icons-material/Share";
import SwapVertIcon from "@mui/icons-material/SwapVert";

export default function RowMenu({
  anchorEl,
  open,
  onClose,
  item, // { type, data }
  onRename,
  onDeleteFolder,
  onDownload,
  onShare,
  onDeleteFile,
}) {
  return (
    <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
      {item?.type === "folder" ? (
        <>
          <MenuItem
            onClick={() => {
              onClose();
              onRename(item);
            }}
          >
            <ListItemIcon>
              <DriveFileRenameOutlineIcon fontSize="small" />
            </ListItemIcon>
            Rename
          </MenuItem>

          <MenuItem
            onClick={() => {
              const folder = item.data; // item = {type,data}
              onClose();
              onDeleteFolder(folder);
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            Delete folder
          </MenuItem>
        </>
      ) : (
        <>
          <MenuItem
            onClick={() => {
              onClose();
              onDownload(item.data);
            }}
          >
            <ListItemIcon>
              <DownloadIcon fontSize="small" />
            </ListItemIcon>
            Download
          </MenuItem>

          <MenuItem
            onClick={() => {
              onClose();
              onRename(item);
            }}
          >
            <ListItemIcon>
              <SwapVertIcon fontSize="small" />
            </ListItemIcon>
            Rename
          </MenuItem>


          <MenuItem
            onClick={() => {
              onClose();
              onShare(item.data.id);
            }}
          >
            <ListItemIcon>
              <ShareIcon fontSize="small" />
            </ListItemIcon>
            Share file
          </MenuItem>

          <MenuItem
            onClick={() => {
              const file = item.data;
              onClose();
              onDeleteFile(file);
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            Delete file
          </MenuItem>
        </>
      )}
    </Menu>
  );
}
