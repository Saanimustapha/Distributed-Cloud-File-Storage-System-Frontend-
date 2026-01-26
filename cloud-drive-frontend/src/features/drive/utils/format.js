export function getApiErrorMessage(err) {
  // Axios network error (no response)
  if (!err?.response) {
    return err?.message || "Network error. Is the backend running and CORS enabled?";
  }

  const status = err.response.status;
  const data = err.response.data;

  // FastAPI often returns { detail: "..." }
  const detail = data?.detail;

  if (typeof detail === "string") return `${status}: ${detail}`;

  if (Array.isArray(detail)) {
    const first = detail[0];
    const msg = first?.msg || "Validation error.";
    return `${status}: ${msg}`;
  }

  // Sometimes FastAPI returns { message: "..." } or other keys
  if (typeof data?.message === "string") return `${status}: ${data.message}`;

  return `${status}: Request failed. Check Network tab for the failing endpoint.`;
}


export function formatBytes(bytes) {
  if (bytes == null) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return "—";
  }
}
