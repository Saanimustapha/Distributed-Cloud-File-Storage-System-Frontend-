# Cloud Drive — Frontend (React)

A modern Cloud Drive UI for uploading, organizing, sharing, and collaborating on files with **role-based access control (read/write/owner)**, **immutable file versioning**, **search suggestions**, and **real-time notifications** via WebSockets.

> **Demo (GIF placeholder):**  
> _Add a short GIF showing: login → drive → create folder → upload → share → recipient sees notification → open file_  
> `![Demo](./docs/demo.gif)`

---

## Features

### Drive & Navigation
- Create folders, upload files, rename, delete, and browse folders (breadcrumb navigation).
- Dedicated views:
  - **My Drive**
  - **Shared with me**
  - **Shared by me**

### Search (Suggestions / Autocomplete)
- Search bar with typeahead suggestions for **files + folders**.
- Clicking a suggestion:
  - **File** → opens the file viewer
  - **Folder** → navigates into the folder view

> **Screenshot placeholder:**  
> `![Search Suggestions](./docs/search-suggestions.png)`

### Sharing & Access Control
- Share files with users and assign role:
  - `read` (view-only)
  - `write` (can edit/rename/upload versions)
  - `owner` (full control)
- UI enforces permissions:
  - Read-only recipients can view but **cannot edit**
  - “Save new version” is hidden when user lacks write access
  - Rename restricted based on role in “Shared with me” view

### Real-time Notifications
- WebSocket-driven notifications for events like **“file shared”**
- Notification bell UI with unread counts, deep-links user into “Shared with me”

> **GIF placeholder:**  
> `![Notifications](./docs/notifications.gif)`

### File Viewer
- Supports:
  - Inline viewing (PDF/images/other preview types)
  - Editable text files with Monaco editor (read-only toggle when needed)
  - Uploading a new version for writable users

---

## Tech Stack
- **React** (Vite)
- **Material UI (MUI)**
- **Axios** (API client)
- **React Router**
- **React Query** (used in auth / mutation flows)
- **WebSockets** for notifications
- **Google OAuth** (`@react-oauth/google`) for “Sign in with Google”

---

## Architecture Overview

This frontend is designed to be served behind **Nginx**, with Nginx also proxying API routes to the FastAPI backend:

- Frontend served as static assets (Nginx)
- API calls go to `"/"` (same origin)
- Nginx forwards:
  - `/auth`, `/folders`, `/files`, `/users`, `/notifications`, `/search` → backend container
  - `/ws` → backend WebSocket endpoint

That’s why the frontend Axios base URL is set to:

```js
// src/lib/api/http.js
const baseURL = "/";
```

## Environment Variables

Required (Production)
- VITE_GOOGLE_CLIENT_ID — Google OAuth client id for the frontend

Optional (Local Dev)

If you don’t want to use a dev proxy and want direct API calls, you can switch Axios to:
```js
// const baseURL = import.meta.env.VITE_API_BASE_URL;
```
and set:
`VITE_API_BASE_URL=http://localhost:8000`

## Local Development

Prerequisites
- Node.js 18+ (recommended: Node 20)
- Backend running locally or via Docker (FastAPI + Postgres + storage nodes)

Install & Run
```bash
npm install
npm run dev
```

## Dev Proxy (Recommended)

If your frontend is running on `http://localhost:5173` and backend on `http://localhost:8000`,
configure Vite dev proxy so `/auth`, `/files`, etc. forward to the backend.

vite.config.js (example):
```js
export default {
  server: {
    proxy: {
      "/auth": "http://localhost:8000",
      "/folders": "http://localhost:8000",
      "/files": "http://localhost:8000",
      "/users": "http://localhost:8000",
      "/notifications": "http://localhost:8000",
      "/search": "http://localhost:8000",
      "/ws": { target: "http://localhost:8000", ws: true },
    },
  },
};
```
