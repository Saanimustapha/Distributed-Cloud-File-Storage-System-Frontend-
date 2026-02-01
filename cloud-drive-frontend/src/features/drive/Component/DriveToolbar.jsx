// import React from "react";
// import { Stack, Typography, Button, Tooltip, CircularProgress } from "@mui/material";
// import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
// import CloudUploadIcon from "@mui/icons-material/CloudUpload";
// import SwapVertIcon from "@mui/icons-material/SwapVert";

// export default function DriveToolbar({
//   view,
//   pageTitle,
//   loading,
//   onCreateFolder,
//   onTriggerUpload,
//   uploadInput,
//   onRefresh,
//   canGoBack,
//   onGoRoot,
//   onDeleteAllItems,
//   showDeleteAllButton,
// }) {
//   return (
//     <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
//       <Stack direction="row" spacing={1} alignItems="center">
//         <Typography variant="h6" sx={{ mr: 1 }}>
//           {pageTitle}
//         </Typography>

//         {view === "drive" && (
//           <>
//             <Tooltip title="Create folder">
//               <Button
//                 variant="outlined"
//                 startIcon={<CreateNewFolderIcon />}
//                 onClick={onCreateFolder}
//                 disabled={loading}
//               >
//                 Create folder
//               </Button>
//             </Tooltip>

//             <Tooltip title="Upload file">
//               <Button
//                 variant="contained"
//                 startIcon={<CloudUploadIcon />}
//                 onClick={onTriggerUpload}
//                 disabled={loading}
//               >
//                 Upload file
//               </Button>
//             </Tooltip>

//             <Tooltip title="Delete all items in this folder">
//             {showDeleteAllButton && (
//               <Button
//                 variant="outlined"
//                 color="error"
//                 onClick={onDeleteAllItems}
//                 disabled={loading}
//                 sx={{ ml: 1 }}
//               >
//                 Delete all items
//               </Button>
//             )}
//             </Tooltip>

//             {uploadInput}
//           </>
//         )}
//       </Stack>

//       <Stack direction="row" spacing={1} alignItems="center">
//         <Button onClick={onRefresh} disabled={loading}>
//           {loading ? <CircularProgress size={18} /> : "Refresh"}
//         </Button>

//         {view === "drive" && canGoBack && (
//           <Button variant="outlined" onClick={onGoRoot}>
//             Back to root
//           </Button>
//         )}
//       </Stack>
//     </Stack>
//   );
// }

import React, { useEffect, useState } from "react";
import {
  Stack,
  Typography,
  Button,
  Tooltip,
  CircularProgress,
  Autocomplete,
  TextField,
  InputAdornment,
  Box,
} from "@mui/material";

import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SearchIcon from "@mui/icons-material/Search";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

import { http } from "../../../lib/api/http"; // 

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

  // ✅ NEW: called when user clicks a search suggestion
  onSearchSelect,
}) {
  const [searchText, setSearchText] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [options, setOptions] = useState([]);

  // ✅ Debounced search (suggestions as user types)
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = (searchText || "").trim();

      if (!q) {
        setOptions([]);
        return;
      }

      setSearchLoading(true);
      try {
        const { data } = await http.get(
          `/search?q=${encodeURIComponent(q)}&limit=10`
        );
        setOptions(Array.isArray(data) ? data : []);
      } catch {
        setOptions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [searchText]);

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ mb: 1 }}
    >
      {/* LEFT */}
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

      {/* RIGHT */}
      <Stack direction="row" spacing={1} alignItems="center">
        {/* ✅ Search bar BEFORE Refresh */}
        <Autocomplete
          size="small"
          sx={{ width: 360 }}
          options={options}
          loading={searchLoading}
          filterOptions={(x) => x} // ✅ don't let MUI re-filter
          getOptionLabel={(opt) => opt?.name || ""}
          onInputChange={(e, v) => setSearchText(v)}
          onChange={(e, val) => {
            if (!val) return;
            onSearchSelect?.(val);
            // optional: clear search after selecting
            setSearchText("");
            setOptions([]);
          }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.type}-${option.id}`}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {option.type === "folder" ? (
                  <FolderIcon fontSize="small" />
                ) : (
                  <InsertDriveFileIcon fontSize="small" />
                )}

                <Box>
                  <Box sx={{ fontWeight: 600 }}>{option.name}</Box>
                  <Box sx={{ fontSize: 12, opacity: 0.7 }}>
                    {option.type === "folder"
                      ? "Folder"
                      : `File${option.my_role ? ` • ${option.my_role}` : ""}`}
                  </Box>
                </Box>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search files and folders"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <>
                    {searchLoading ? <CircularProgress size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <Button onClick={onRefresh} disabled={loading}>
          {loading ? <CircularProgress size={18} /> : "Refresh"}
        </Button>

      </Stack>
    </Stack>
  );
}

