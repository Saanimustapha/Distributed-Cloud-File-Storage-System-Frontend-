import React from "react";
import { Navigate } from "react-router-dom";
import { tokenStorage } from "../../lib/auth/tokenStorage";

export function ProtectedRoute({ children }) {
  const token = tokenStorage.get();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
