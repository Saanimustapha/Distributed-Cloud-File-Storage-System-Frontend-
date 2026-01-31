const KEY = "access_token";

export const tokenStorage = {
  get() {
    return localStorage.getItem(KEY);
  },
  set(token) {
    localStorage.setItem(KEY, token);
  },
  clear() {
    localStorage.removeItem(KEY);
  },
  hasActiveSession() {
    const t = localStorage.getItem(KEY);
    return Boolean(t && t.trim().length > 0);
  },
};
