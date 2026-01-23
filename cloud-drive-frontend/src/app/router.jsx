import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import LoginPage from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
// import DrivePage from "../features/drive/DrivePage";
// import FileDetailsPage from "../features/files/FileDetailsPage";
// import SharedPage from "../features/shared/SharedPage";
// import NodesPage from "../features/admin/nodes/NodesPage";
import AppShell from "../components/layout/AppShell";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },

//   {
//     path: "/app",
//     element: (
//       <ProtectedRoute>
//         <AppShell />
//       </ProtectedRoute>
//     ),
//     children: [
//       { path: "drive", element: <DrivePage /> },
//       { path: "shared", element: <SharedPage /> },
//       { path: "files/:fileId", element: <FileDetailsPage /> },
//       { path: "admin/nodes", element: <NodesPage /> },
//     ],
//   },

  { path: "*", element: <LoginPage /> },
]);
