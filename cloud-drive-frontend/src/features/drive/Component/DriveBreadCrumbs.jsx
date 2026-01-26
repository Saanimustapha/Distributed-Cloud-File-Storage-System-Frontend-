import React from "react";
import { Breadcrumbs, Link, Typography } from "@mui/material";

export default function DriveBreadcrumbs({ path, onGoRoot, onOpenFolder }) {
  if (!path || path.length === 0) {
    return <Typography variant="h6">My Drive</Typography>;
  }

  return (
    <Breadcrumbs aria-label="breadcrumb">
      <Link
        underline="hover"
        color="inherit"
        sx={{ cursor: "pointer", fontWeight: 700 }}
        onClick={onGoRoot}
      >
        My Drive
      </Link>

      {path.map((node, idx) => {
        const isLast = idx === path.length - 1;
        if (isLast) {
          return (
            <Typography key={node.id} color="text.primary" fontWeight={700}>
              {node.name}
            </Typography>
          );
        }

        return (
          <Link
            key={node.id}
            underline="hover"
            color="inherit"
            sx={{ cursor: "pointer" }}
            onClick={() => onOpenFolder(node.id)}
          >
            {node.name}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
