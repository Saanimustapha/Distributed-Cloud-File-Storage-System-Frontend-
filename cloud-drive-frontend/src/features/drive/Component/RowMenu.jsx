// import React from "react";
// import { Menu, MenuItem, ListItemIcon } from "@mui/material";

// import DownloadIcon from "@mui/icons-material/Download";
// import DeleteIcon from "@mui/icons-material/Delete";
// import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
// import ShareIcon from "@mui/icons-material/Share";
// import SwapVertIcon from "@mui/icons-material/SwapVert";

// export default function RowMenu({
//   view,
//   anchorEl,
//   open,
//   onClose,
//   item, // { type, data }
//   onRename,
//   onDeleteFolder,
//   onDownload,
//   onShare,
//   onDeleteFile,
//   onRemoveShared
// }) {
//   return (
//     <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
//       {item?.type === "folder" ? (
//         <>
//           <MenuItem
//             onClick={() => {
//               onClose();
//               onRename(item);
//             }}
//           >
//             <ListItemIcon>
//               <DriveFileRenameOutlineIcon fontSize="small" />
//             </ListItemIcon>
//             Rename
//           </MenuItem>

//           <MenuItem
//             onClick={() => {
//               const folder = item.data; // item = {type,data}
//               onClose();
//               onDeleteFolder(folder);
//             }}
//           >
//             <ListItemIcon>
//               <DeleteIcon fontSize="small" />
//             </ListItemIcon>
//             Delete folder
//           </MenuItem>
//         </>
//       ) : (
//         <>
//           <MenuItem
//             onClick={() => {
//               onClose();
//               onDownload(item.data);
//             }}
//           >
//             <ListItemIcon>
//               <DownloadIcon fontSize="small" />
//             </ListItemIcon>
//             Download
//           </MenuItem>

//           <MenuItem
//             onClick={() => {
//               onClose();
//               onRename(item);
//             }}
//           >
//             <ListItemIcon>
//               <SwapVertIcon fontSize="small" />
//             </ListItemIcon>
//             Rename
//           </MenuItem>


//           <MenuItem
//             onClick={() => {
//               onClose();
//               onShare(item.data.id);
//             }}
//           >
//             <ListItemIcon>
//               <ShareIcon fontSize="small" />
//             </ListItemIcon>
//             Share file
//           </MenuItem>
          
//           {view !== "shared" && (
//             <MenuItem
//             onClick={() => {
//               const file = item.data;
//               onClose();
//               onDeleteFile(file);
//             }}
//           >
//             <ListItemIcon>
//               <DeleteIcon fontSize="small" />
//             </ListItemIcon>
//             Delete file
//           </MenuItem>
//           )
//           }

//           {view === "shared" && item?.type === "file" && (
//             <MenuItem
//               onClick={() => {
//                 onClose();
//                 onRemoveShared(item.data);
//               }}
//             >
//               <ListItemIcon>
//                 <DeleteIcon fontSize="small" />
//               </ListItemIcon>
//               Remove
//             </MenuItem>
//           )}

//         </>
//       )}
//     </Menu>
//   );
// }

import React from "react";
import { Menu, MenuItem, ListItemIcon } from "@mui/material";

import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import ShareIcon from "@mui/icons-material/Share";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import Fade from "@mui/material/Fade";

export default function RowMenu({
  view,
  anchorEl,
  open,
  onClose,
  onExited,
  item, // { type, data }
  onRename,
  onDeleteFolder,
  onDownload,
  onShare,
  onDeleteFile,
  onRemoveShared,
}) {
  const isFolder = item?.type === "folder";
  const isFile = item?.type === "file";
  const isSharedView = view === "shared";

  return (
    <Menu anchorEl={anchorEl} open={open} onClose={onClose}
    slots={{ transition: Fade }}
    slotProps={{
    transition: { onExited: onExited },
  }}   
    >
      {!item ? null : isFolder ? (
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
              const folder = item.data;
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
      ) : isSharedView && isFile ? (
        /* ✅ Shared with me: ONLY Rename + Remove */
        <>
          <MenuItem
            onClick={() => {
              onClose();
              onRename(item); // permission check (write/read) handled in DrivePage
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
              onRemoveShared?.(item.data); 
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            Remove
          </MenuItem>
        </>
      ) : (
        /* ✅ Other views: normal file menu */
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

