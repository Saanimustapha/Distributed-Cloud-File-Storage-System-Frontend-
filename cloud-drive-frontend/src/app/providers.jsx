import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline } from "@mui/material";
import { queryClient } from "./queryClient";

export function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <CssBaseline />
      {children}
    </QueryClientProvider>
  );
}
