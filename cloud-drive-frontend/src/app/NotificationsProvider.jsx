import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { http } from "../lib/api/http";
import { tokenStorage } from "../lib/auth/tokenStorage";

const NotificationsContext = createContext(null);

export function useNotifications() {
  return useContext(NotificationsContext);
}

export function NotificationsProvider({ children }) {
  const [items, setItems] = useState([]); // unread list
  const wsRef = useRef(null);

  const hasUnread = items.length > 0;

  const fetchUnread = async () => {
    const { data } = await http.get("/notifications/unread");
    setItems(Array.isArray(data) ? data : []);
  };

  const markRead = async (id) => {
    await http.patch(`/notifications/${id}/read`);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  useEffect(() => {
    // load initial unread
    fetchUnread().catch(() => {});

    const token = tokenStorage.get();
    if (!token) return;

    // Connect WS
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const base = import.meta.env.VITE_API_BASE_URL?.replace(/^http/, protocol);
    const url = `${base}/ws/notifications?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      // optional ping to keep alive
      ws.send("hello");
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg?.event === "notification" && msg.notification) {
          setItems((prev) => [msg.notification, ...prev]);
        }
      } catch {}
    };

    ws.onclose = () => {};
    ws.onerror = () => {};

    return () => {
      try { ws.close(); } catch {}
    };
  }, []);

  const value = useMemo(() => ({ items, hasUnread, fetchUnread, markRead }), [items, hasUnread]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
