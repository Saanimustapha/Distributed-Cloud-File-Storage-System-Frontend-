import { useCallback, useEffect, useMemo, useState } from "react";
import { http } from "../../../lib/api/http";
import { getApiErrorMessage } from "../utils/format";

export function useDriveData({ parentId, folderId, view, onError }) {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentParentId = useMemo(() => (parentId ? Number(parentId) : null), [parentId]);
  const currentFolderId = useMemo(() => (folderId ? Number(folderId) : null), [folderId]);


  const fetchFolders = useCallback(async () => {
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
  }, [currentParentId]);

  const fetchFiles = useCallback(async () => {
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

    const qs = new URLSearchParams();
    if (currentFolderId !== null) qs.set("folder_id", String(currentFolderId));
    const url = qs.toString() ? `/files/all?${qs.toString()}` : `/files/all`;
    const { data } = await http.get(url);
    setFiles(data || []);
  }, [currentFolderId, view]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (view === "drive") {
        await Promise.all([fetchFolders(), fetchFiles()]);
      } else {
        await fetchFiles();
        setFolders([]);
      }
    } catch (err) {
      onError?.(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [fetchFolders, fetchFiles, onError, view]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    folders,
    setFolders,
    files,
    setFiles,
    loading,
    refresh,
    currentParentId,
    currentFolderId,
  };
}
