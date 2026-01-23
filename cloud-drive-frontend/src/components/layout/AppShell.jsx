import React from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { tokenStorage } from "../../lib/auth/tokenStorage";

export default function AppShell() {
  const navigate = useNavigate();

  const logout = () => {
    tokenStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar sx={{ display: "flex", gap: 2 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Cloud Drive
          </Typography>
          <Button color="inherit" component={Link} to="/app/drive">Drive</Button>
          <Button color="inherit" component={Link} to="/app/shared">Shared</Button>
          <Button color="inherit" component={Link} to="/app/admin/nodes">Nodes</Button>
          <Button color="inherit" onClick={logout}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
