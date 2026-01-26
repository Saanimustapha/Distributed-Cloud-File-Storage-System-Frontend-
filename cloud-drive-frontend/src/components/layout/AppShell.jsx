import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Drawer,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Stack,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import GroupIcon from "@mui/icons-material/Group";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import DnsIcon from "@mui/icons-material/Dns";

import { tokenStorage } from "../../lib/auth/tokenStorage";
import { http } from "../../lib/api/http";

export default function AppShell() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [me, setMe] = useState(null);

  const logout = () => {
    tokenStorage.clear();
    navigate("/login", { replace: true });
  };

  // Optional: load current user for avatar/email
  useEffect(() => {
    (async () => {
      try {
        const { data } = await http.get("/users/me");
        setMe(data);
      } catch {
        // ignore if endpoint not available
      }
    })();
  }, []);

  const navItems = [
    { label: "My Drive", icon: <HomeIcon />, onClick: () => navigate("/app/drive") },
    { label: "Shared with me", icon: <GroupIcon />, onClick: () => navigate("/app/drive?view=shared") },
    { label: "Shared by me", icon: <GroupAddIcon />, onClick: () => navigate("/app/drive?view=shared-by-me") },
    { label: "Nodes", icon: <DnsIcon />, onClick: () => navigate("/app/admin/nodes") },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Top Navbar (Blue) */}
      <AppBar position="sticky" sx={{ bgcolor: "primary.main" }} elevation={1}>
        <Toolbar sx={{ gap: 1 }}>
          {/* Hamburger / Offcanvas toggle */}
          <IconButton
            onClick={() => setSidebarOpen(true)}
            edge="start"
            sx={{ color: "primary.contrastText" }}
          >
            <MenuIcon />
          </IconButton>

          {/* App icon + name (left side) */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Placeholder icon */}
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1,
                bgcolor: "rgba(255,255,255,0.25)",
                display: "grid",
                placeItems: "center",
                color: "primary.contrastText",
                fontWeight: 800,
              }}
            >
              CD
            </Box>

            <Typography
              variant="h6"
              sx={{ color: "primary.contrastText", fontWeight: 800 }}
            >
              Cloud drive
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }} />

          {/* Profile icon (rightmost) */}
          <IconButton
            onClick={(e) => setProfileAnchorEl(e.currentTarget)}
            sx={{ p: 0.5 }}
          >
            <Avatar sx={{ width: 34, height: 34 }}>
              {(me?.email || "U")[0]?.toUpperCase?.() || "U"}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={profileAnchorEl}
            open={Boolean(profileAnchorEl)}
            onClose={() => setProfileAnchorEl(null)}
          >
            <MenuItem disabled>
              <Stack>
                <Typography fontWeight={700}>{me?.email || "User"}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {me?.id ? `User ID: ${me.id}` : " "}
                </Typography>
              </Stack>
            </MenuItem>

            <Divider />

            <MenuItem
              onClick={() => {
                setProfileAnchorEl(null);
                logout();
              }}
            >
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar (Off-canvas) */}
      <Drawer
        variant="temporary"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": { width: 260, boxSizing: "border-box" },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={800}>
            Cloud Drive
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {me?.email ? `Signed in as ${me.email}` : " "}
          </Typography>
        </Box>
        <Divider />

        <List>
          {navItems.map((item) => (
            <ListItemButton
              key={item.label}
              onClick={() => {
                item.onClick();
                setSidebarOpen(false);
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Child pages */}
      <Box sx={{ p: 2 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
