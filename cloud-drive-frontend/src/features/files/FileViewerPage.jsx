import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
import Editor from "@monaco-editor/react";

import { http } from "../../lib/api/http";
import { getApiErrorMessage } from "../drive/utils/format"; // adjust path to your helper

function getExt(name = "") {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function isEditableText(ext) {
  return [
    "txt","md","json","csv","log","js","jsx","ts","tsx","py","java","c","cpp","go",
    "css","html","xml","yaml","yml","ini","env"
  ].includes(ext);
}

function getMonacoLanguage(ext) {
  const map = {
    js: "javascript",
    jsx: "javascript",
    json: "json",
    css: "css",
    html: "html",
    md: "markdown",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    py: "python",
    java: "java",
    c: "c",
    cpp: "cpp",
    go: "go",
    csv: "plaintext",
    txt: "plaintext",
    log: "plaintext",
    env: "plaintext",
    ini: "plaintext",
  };
  return map[ext] || "plaintext";
}

export default function FileViewerPage() {
  const navigate = useNavigate();
  const { fileId } = useParams();
  const location = useLocation();

  const fileFromState = location.state?.file;
  const fileName = fileFromState?.name || `file-${fileId}`;
  const ext = useMemo(() => getExt(fileName), [fileName]);

  const [loading, setLoading] = useState(true);
  const [blobUrl, setBlobUrl] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const editable = useMemo(() => isEditableText(ext), [ext]);
  const language = useMemo(() => getMonacoLanguage(ext), [ext]);

  // ✅ Fetch latest version for in-app viewing/editing (NOT download-to-disk)
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");

      // clean up old blob url (if any) before creating a new one
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });

      try {
        // ✅ IMPORTANT: use /view endpoint (inline), not /download (attachment)
        const res = await http.get(`/files/${fileId}/view`, {
          responseType: "blob",
        });

        if (!alive) return;

        const blob = res.data;

        if (editable) {
          const content = await blob.text();
          if (!alive) return;
          setText(content);
        } else {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      } catch (err) {
        if (!alive) return;
        setError(getApiErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
    };
  }, [fileId, editable]);

  const saveNewVersion = async () => {
    setSaving(true);
    setError("");

    try {
      // Create a file from edited text
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const uploadFile = new File([blob], fileName, { type: "text/plain" });

      const form = new FormData();
      form.append("upload", uploadFile);

      await http.post(`/files/${fileId}/versions`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSaving(false);
      navigate(-1);
    } catch (err) {
      setSaving(false);
      setError(getApiErrorMessage(err));
    }
  };

  const renderViewer = () => {
    if (!blobUrl) return null;

    if (ext === "pdf") {
      return <iframe title="pdf" src={blobUrl} style={{ width: "100%", height: "75vh", border: 0 }} />;
    }

    if (["png","jpg","jpeg","gif","webp","svg"].includes(ext)) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <img src={blobUrl} alt={fileName} style={{ maxWidth: "100%", maxHeight: "75vh" }} />
        </Box>
      );
    }

    return <iframe title="file" src={blobUrl} style={{ width: "100%", height: "75vh", border: 0 }} />;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack>
            <Typography variant="h6" fontWeight={800}>
              {fileName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {editable ? "Editable (text file)" : "Viewer"}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Back
            </Button>
            {editable && (
              <Button variant="contained" onClick={saveNewVersion} disabled={saving || loading}>
                {saving ? "Saving..." : "Save (new version)"}
              </Button>
            )}
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography>Loading...</Typography>
          </Stack>
        ) : editable ? (
          <Box sx={{ height: "75vh", border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
            <Editor
              height="75vh"
              language={language}
              value={text}
              onChange={(v) => setText(v ?? "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                scrollBeyondLastLine: false,
              }}
            />
          </Box>
        ) : (
          renderViewer()
        )}
      </Paper>
    </Box>
  );
}
