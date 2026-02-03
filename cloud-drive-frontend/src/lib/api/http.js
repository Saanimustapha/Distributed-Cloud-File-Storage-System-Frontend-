import axios from "axios";
import { tokenStorage } from "../auth/tokenStorage";

// const baseURL = import.meta.env.VITE_API_BASE_URL;
const baseURL = "/";


export const http = axios.create({
  baseURL,
  timeout: 30000,
});

http.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    // Central 401 handling
    if (err?.response?.status === 401) {
      tokenStorage.clear();
      // Avoid circular imports; do a hard redirect:
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
